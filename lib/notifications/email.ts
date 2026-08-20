import { Resend } from "resend";
import type { Locale } from "@/types";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export type EmailAttachment = {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
};

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  locale?: Locale;
  headers?: Record<string, string>;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

export async function sendEmail({
  to,
  subject,
  html,
  headers,
  replyTo,
  attachments,
}: SendEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping:", subject, to);
    return;
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "Firefly <noreply@firefly.app>";

  await getResend().emails.send({
    from,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(headers ? { headers } : {}),
    ...(attachments?.length
      ? {
          attachments: attachments.map((a) => ({
            filename: a.filename,
            ...(a.path ? { path: a.path } : {}),
            ...(a.content != null ? { content: a.content } : {}),
            ...(a.contentType ? { contentType: a.contentType } : {}),
          })),
        }
      : {}),
  });
}

export async function sendEventApprovedEmail(
  to: string,
  eventTitle: string,
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? `Evenimentul tău "${eventTitle}" a fost aprobat`
      : `Your event "${eventTitle}" has been approved`;

  const html =
    locale === "ro"
      ? `<p>Evenimentul <strong>${eventTitle}</strong> a fost aprobat și este acum publicat pe Firefly.</p>`
      : `<p>Your event <strong>${eventTitle}</strong> has been approved and is now live on Firefly.</p>`;

  await sendEmail({ to, subject, html, locale });
}

export async function sendEventRejectedEmail(
  to: string,
  eventTitle: string,
  reason: string,
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? `Evenimentul tău "${eventTitle}" a fost respins`
      : `Your event "${eventTitle}" was rejected`;

  const html =
    locale === "ro"
      ? `<p>Evenimentul <strong>${eventTitle}</strong> a fost respins.</p><p>Motiv: ${reason}</p>`
      : `<p>Your event <strong>${eventTitle}</strong> was rejected.</p><p>Reason: ${reason}</p>`;

  await sendEmail({ to, subject, html, locale });
}

export async function sendEventReminderEmail(
  to: string,
  eventTitle: string,
  startsAt: string,
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? `Reminder: ${eventTitle} începe curând`
      : `Reminder: ${eventTitle} is coming up`;

  const html =
    locale === "ro"
      ? `<p>Nu uita! <strong>${eventTitle}</strong> începe la ${startsAt}.</p>`
      : `<p>Don't forget! <strong>${eventTitle}</strong> starts at ${startsAt}.</p>`;

  await sendEmail({ to, subject, html, locale });
}

export async function sendBusinessApprovedEmail(
  to: string,
  businessName: string,
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? "Contul tău de business Firefly a fost aprobat"
      : "Your Firefly business account has been approved";

  const html =
    locale === "ro"
      ? `<p>Contul tău de business <strong>${businessName}</strong> a fost aprobat. Poți acum să trimiți evenimente.</p>`
      : `<p>Your business account <strong>${businessName}</strong> has been approved. You can now submit events.</p>`;

  await sendEmail({ to, subject, html, locale });
}

export async function sendBusinessRejectedEmail(
  to: string,
  businessName: string,
  reason: string,
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? "Contul tău de business Firefly a fost respins"
      : "Your Firefly business account was rejected";

  const html =
    locale === "ro"
      ? `<p>Contul tău de business <strong>${businessName}</strong> a fost respins.</p><p>Motiv: ${reason}</p>`
      : `<p>Your business account <strong>${businessName}</strong> was rejected.</p><p>Reason: ${reason}</p>`;

  await sendEmail({ to, subject, html, locale });
}

export type NearbyDigestEvent = {
  title: string;
  startsAt: string;
  venueName: string | null;
};

export async function sendContactMessageEmail(params: {
  to: string;
  businessName: string;
  subject: string;
  body: string;
  replyTo?: string | null;
}): Promise<void> {
  const { to, businessName, subject, body, replyTo } = params;
  const emailSubject = `[Firefly Support] ${businessName}: ${subject}`;
  const html = `
    <p><strong>${businessName}</strong> sent a support message via the business dashboard.</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p>${body.replace(/\n/g, "<br />")}</p>
    ${replyTo ? `<p><strong>Reply to:</strong> ${replyTo}</p>` : ""}
  `;

  await sendEmail({
    to,
    subject: emailSubject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

export async function sendNearbyEventsDigestEmail(
  to: string,
  events: NearbyDigestEvent[],
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? `${events.length} evenimente noi în apropiere`
      : `${events.length} new events near you`;

  const listItems = events
    .map(
      (event) =>
        `<li><strong>${event.title}</strong>${event.venueName ? ` · ${event.venueName}` : ""} · ${event.startsAt}</li>`
    )
    .join("");

  const html =
    locale === "ro"
      ? `<p>Iată evenimentele noi din zona ta:</p><ul>${listItems}</ul>`
      : `<p>Here are new events in your area:</p><ul>${listItems}</ul>`;

  await sendEmail({ to, subject, html, locale });
}

function formatRonAmount(amountCents: number, currency: string): string {
  if (currency.toLowerCase() === "ron") {
    return `${Math.round(amountCents / 100)} RON`;
  }
  return `${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function promotionsUrl(locale: Locale): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/${locale}/business/promotions`;
}

export async function sendPremiumPaymentFailedEmail(
  to: string,
  amountCents: number,
  currency: string,
  locale: Locale = "en"
): Promise<void> {
  const amount = formatRonAmount(amountCents, currency);
  const dashboardUrl = promotionsUrl(locale);
  const subject =
    locale === "ro"
      ? "Plata Firefly Premium a eșuat"
      : "Your Firefly Premium payment failed";

  const html =
    locale === "ro"
      ? `<p>Nu am putut procesa plata lunară de <strong>${amount}</strong>.</p><p>Te rugăm să actualizezi metoda de plată pentru a păstra beneficiile Premium active.</p><p><a href="${dashboardUrl}">Actualizează metoda de plată</a></p>`
      : `<p>We couldn't process your monthly payment of <strong>${amount}</strong>.</p><p>Please update your payment method to keep your Premium benefits active.</p><p><a href="${dashboardUrl}">Update payment method</a></p>`;

  await sendEmail({ to, subject, html, locale });
}

export async function sendPremiumUnpaidEmail(
  to: string,
  locale: Locale = "en"
): Promise<void> {
  const dashboardUrl = promotionsUrl(locale);
  const subject =
    locale === "ro"
      ? "Beneficiile Firefly Premium au fost suspendate"
      : "Your Firefly Premium benefits are paused";

  const html =
    locale === "ro"
      ? `<p>Nu am putut încasa plata Premium după mai multe încercări, iar beneficiile au fost suspendate.</p><p>Actualizează metoda de plată pentru a reactiva Premium.</p><p><a href="${dashboardUrl}">Actualizează metoda de plată</a></p>`
      : `<p>We couldn't collect your Premium payment after several attempts, so your benefits have been paused.</p><p>Update your payment method to reactivate Premium.</p><p><a href="${dashboardUrl}">Update payment method</a></p>`;

  await sendEmail({ to, subject, html, locale });
}
