import { createHash, createVerify } from "crypto";

export class IpnVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IpnVerificationError";
  }
}

type JwtPayload = {
  iss?: string;
  aud?: string | string[];
  sub?: string;
};

function publicKey(): string {
  const value = process.env.NETOPIA_PUBLIC_KEY?.trim();
  if (!value) throw new IpnVerificationError("NETOPIA_PUBLIC_KEY is not set");
  return value.replace(/\\n/g, "\n");
}

function allowedSignatures(): Set<string> {
  const primary = process.env.NETOPIA_POS_SIGNATURE?.trim();
  const extra = process.env.NETOPIA_POS_SIGNATURE_SET?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const values = [primary, ...(extra ?? [])].filter((item): item is string => Boolean(item));
  if (values.length === 0) {
    throw new IpnVerificationError("NETOPIA_POS_SIGNATURE is not set");
  }
  return new Set(values);
}

function decodeJson<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
}

function verifySignature(token: string, key: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new IpnVerificationError("Wrong_Verification_Token");
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJson<{ typ?: string; alg?: string }>(headerPart);
  if (header.typ !== "JWT") throw new IpnVerificationError("Wrong_Token_Type");
  if ((header.alg ?? "RS512") !== "RS512") {
    throw new IpnVerificationError("Unsupported_Algorithm");
  }

  const verifier = createVerify("RSA-SHA512");
  verifier.update(`${headerPart}.${payloadPart}`);
  verifier.end();
  const signature = Buffer.from(signaturePart, "base64url");
  if (!verifier.verify(key, signature)) {
    throw new IpnVerificationError("E_VERIFICATION_FAILED");
  }

  return decodeJson<JwtPayload>(payloadPart);
}

export function verifyIpn(verificationToken: string, rawBody: string): void {
  if (!verificationToken.trim()) {
    throw new IpnVerificationError("Missing Verification-Token");
  }

  const payload = verifySignature(verificationToken, publicKey());
  if (payload.iss !== "NETOPIA Payments") {
    throw new IpnVerificationError("Invalid Issuer");
  }

  const audience = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
  const allowed = allowedSignatures();
  const primary = process.env.NETOPIA_POS_SIGNATURE?.trim();
  if (!audience || audience !== primary || !allowed.has(audience)) {
    throw new IpnVerificationError("Invalid audience");
  }

  const bodyHash = createHash("sha512").update(rawBody).digest("base64");
  if (!payload.sub || payload.sub !== bodyHash) {
    throw new IpnVerificationError("Payload hash mismatch");
  }
}
