"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Mail, Phone } from "lucide-react";
import { submitContactMessage } from "@/lib/actions/business";
import type { BusinessContactMessage } from "@/lib/queries/contact";

type Props = {
  supportEmail: string | null;
  supportPhone: string | null;
  messages: BusinessContactMessage[];
};

const inputClass =
  "w-full rounded-xl border border-firefly/20 bg-surface-1/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-firefly/50";

const labelClass = "mb-1.5 block text-xs font-medium text-foreground/50";

export function BusinessContact({
  supportEmail,
  supportPhone,
  messages,
}: Props) {
  const t = useTranslations("business");
  const tStatus = useTranslations("common.status");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await submitContactMessage(subject, body);
      if (result.success) {
        setSubject("");
        setBody("");
        setFeedback({
          type: "success",
          message: t("messageSuccess"),
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? t("messageFailed"),
        });
      }
    });
  };

  return (
    <div className="mt-8 space-y-6">
      {(supportEmail || supportPhone) && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-heading text-lg font-semibold">{t("reachTitle")}</h2>
          <p className="mt-1 text-sm text-foreground/60">
            {t("reachBody")}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
            {supportEmail ? (
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2 text-sm text-firefly hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {supportEmail}
              </a>
            ) : null}
            {supportPhone ? (
              <a
                href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 text-sm text-firefly hover:underline"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {supportPhone}
              </a>
            ) : null}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <div className="mb-4 space-y-2">
          <h2 className="font-heading text-lg font-semibold">{t("sendTitle")}</h2>
          <p className="text-xs text-foreground/50">
            {t("sendBody", {
              emailHint: supportEmail ? t("sendBodyEmailHint") : "",
            })}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="contact-subject" className={labelClass}>
              {t("subject")}
            </label>
            <input
              id="contact-subject"
              type="text"
              required
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
              placeholder={t("subjectPlaceholder")}
            />
          </div>
          <div>
            <label htmlFor="contact-body" className={labelClass}>
              {t("message")}
            </label>
            <textarea
              id="contact-body"
              required
              rows={5}
              maxLength={5000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`${inputClass} resize-y`}
              placeholder={t("messagePlaceholder")}
            />
          </div>

          {feedback ? (
            <p
              className={`text-sm ${
                feedback.type === "success"
                  ? "text-emerald-500"
                  : "text-destructive"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {pending ? t("sending") : t("sendMessage")}
          </button>
        </form>
      </div>

      {messages.length > 0 ? (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-heading text-lg font-semibold">{t("recentMessages")}</h2>
          <ul className="mt-4 space-y-4">
            {messages.map((message) => (
              <li
                key={message.id}
                className="border-b border-border/60 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-sm">{message.subject}</p>
                  <span className="text-xs text-foreground/40">
                    {new Date(message.createdAt).toLocaleString(locale)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/60">
                  {message.body}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-foreground/40">
                  {tStatus(message.status)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
