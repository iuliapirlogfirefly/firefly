"use client";

import { useTranslations } from "next-intl";

export function PaymentMarks({ className }: { className?: string }) {
  const t = useTranslations("footer");

  return (
    <a
      href="https://netopia-payments.com/"
      target="_blank"
      rel="noopener noreferrer"
      title={t("paymentMarks")}
      className={className}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/legal/netopia-cards.png"
        alt={t("paymentMarks")}
        width={212}
        height={40}
        className="h-10 w-auto"
      />
    </a>
  );
}
