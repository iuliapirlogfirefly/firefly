const SANDBOX_BASE = "https://secure-sandbox.netopia-payments.com";
const LIVE_BASE = "https://secure.netopia-payments.com/api";

export class NetopiaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetopiaError";
  }
}

type NetopiaConfig = {
  apiKey: string;
  posSignature: string;
  sandbox: boolean;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new NetopiaError(`${name} is not set`);
  return value;
}

export function getNetopiaConfig(): NetopiaConfig {
  const sandboxFlag = process.env.NETOPIA_SANDBOX?.trim().toLowerCase();
  if (sandboxFlag !== "true" && sandboxFlag !== "false") {
    throw new NetopiaError("NETOPIA_SANDBOX must be true or false");
  }

  return {
    apiKey: requiredEnv("NETOPIA_API_KEY"),
    posSignature: requiredEnv("NETOPIA_POS_SIGNATURE"),
    sandbox: sandboxFlag === "true",
  };
}

function baseUrl(sandbox: boolean): string {
  return sandbox ? SANDBOX_BASE : LIVE_BASE;
}

type JsonRecord = Record<string, unknown>;

async function postNetopia(
  path: string,
  body: JsonRecord
): Promise<JsonRecord> {
  const config = getNetopiaConfig();
  const response = await fetch(`${baseUrl(config.sandbox)}${path}`, {
    method: "POST",
    headers: {
      Authorization: config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: JsonRecord = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as JsonRecord;
    } catch {
      throw new NetopiaError(
        `NETOPIA ${path} returned a non-JSON response (${response.status})`
      );
    }
  }

  if (!response.ok) {
    const message = readErrorMessage(parsed) ?? `NETOPIA ${path} failed (${response.status})`;
    throw new NetopiaError(message);
  }

  return unwrap(parsed);
}

function unwrap(body: JsonRecord): JsonRecord {
  const nested = body.data;
  if (
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested) &&
    ("payment" in nested || "error" in nested || "order" in nested)
  ) {
    return nested as JsonRecord;
  }
  return body;
}

function readErrorMessage(body: JsonRecord): string | null {
  const error = body.error;
  if (error && typeof error === "object" && !Array.isArray(error)) {
    const message = (error as JsonRecord).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof body.message === "string" && body.message.trim()) return body.message;
  return null;
}

function readPayment(body: JsonRecord): JsonRecord | null {
  const payment = body.payment;
  if (!payment || typeof payment !== "object" || Array.isArray(payment)) return null;
  return payment as JsonRecord;
}

export type StartedPayment = {
  paymentUrl: string;
  ntpId: string | null;
  status: number | null;
};

export type NetopiaOrder = {
  orderId: string;
  amount: number;
  currency: "RON";
  description: string;
  language: "ro" | "en";
  notifyUrl: string;
  redirectUrl: string;
  cancelUrl: string;
  billing: {
    email: string;
    firstName: string;
    lastName: string;
    city: string;
    country: number;
    countryName: string;
    state: string;
    postalCode: string;
    details: string;
  };
  product: {
    name: string;
    code: string;
    price: number;
  };
};

export async function startCardPayment(order: NetopiaOrder): Promise<StartedPayment> {
  const config = getNetopiaConfig();
  const body = await postNetopia("/payment/card/start", {
    config: {
      notifyUrl: order.notifyUrl,
      redirectUrl: order.redirectUrl,
      cancelUrl: order.cancelUrl,
      language: order.language,
    },
    payment: {
      options: {
        installments: 1,
        bonus: 0,
      },
    },
    order: {
      posSignature: config.posSignature,
      dateTime: new Date().toISOString().slice(0, 19),
      description: order.description,
      orderID: order.orderId,
      amount: order.amount,
      currency: order.currency,
      billing: {
        email: order.billing.email,
        firstName: order.billing.firstName,
        lastName: order.billing.lastName,
        city: order.billing.city,
        country: order.billing.country,
        countryName: order.billing.countryName,
        state: order.billing.state,
        postalCode: order.billing.postalCode,
        details: order.billing.details,
      },
      products: [
        {
          name: order.product.name,
          code: order.product.code,
          category: "promotion",
          price: order.product.price,
          vat: 0,
        },
      ],
    },
  });

  const errorCode = readErrorCode(body);
  const payment = readPayment(body);
  const paymentUrl = typeof payment?.paymentURL === "string" ? payment.paymentURL : "";
  if (errorCode !== "101" || !paymentUrl) {
    throw new NetopiaError(
      readErrorMessage(body) ?? "NETOPIA did not return a payment page"
    );
  }

  const ntpFromPayment = typeof payment?.ntpID === "string" ? payment.ntpID : "";
  const ntpFromUrl = readNtpFromUrl(paymentUrl);
  const status = typeof payment?.status === "number" ? payment.status : null;

  return {
    paymentUrl,
    ntpId: ntpFromPayment || ntpFromUrl || null,
    status,
  };
}

export type PaymentStatusResult = {
  status: number | null;
  ntpId: string | null;
  orderId: string | null;
  amount: number | null;
};

export async function getPaymentStatus(ntpId: string): Promise<PaymentStatusResult> {
  const config = getNetopiaConfig();
  const body = await postNetopia("/operation/status", {
    posID: config.posSignature,
    ntpID: ntpId,
  });
  return readStatusResult(body);
}

export function readStatusResult(body: JsonRecord): PaymentStatusResult {
  const payload = unwrap(body);
  const payment = readPayment(payload);
  const order = payload.order;
  const orderRecord =
    order && typeof order === "object" && !Array.isArray(order)
      ? (order as JsonRecord)
      : null;
  const amount =
    typeof payment?.amount === "number"
      ? payment.amount
      : typeof orderRecord?.amount === "number"
        ? orderRecord.amount
        : null;

  return {
    status: typeof payment?.status === "number" ? payment.status : null,
    ntpId: typeof payment?.ntpID === "string" ? payment.ntpID : null,
    orderId:
      typeof orderRecord?.orderID === "string" ? orderRecord.orderID : null,
    amount,
  };
}

function readErrorCode(body: JsonRecord): string | null {
  const error = body.error;
  if (!error || typeof error !== "object" || Array.isArray(error)) return null;
  const code = (error as JsonRecord).code;
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return null;
}

function readNtpFromUrl(paymentUrl: string): string | null {
  try {
    return new URL(paymentUrl).searchParams.get("p");
  } catch {
    return null;
  }
}
