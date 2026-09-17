"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AdminCard } from "./admin-card";
import { formatDelta } from "@/lib/utils/percent-change";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number | null;
  href?: string;
};

function DeltaBadge({ delta }: { delta: number | null | undefined }) {
  const t = useTranslations("common");
  const text = formatDelta(delta);
  if (!text || delta == null) return null;
  const color =
    delta > 0
      ? "text-emerald-400"
      : delta < 0
        ? "text-red-400"
        : "text-muted-foreground";
  return (
    <div className={`mt-1 text-xs font-medium ${color}`}>
      {text} {t("mom")}
    </div>
  );
}

export function AdminStatCard({ label, value, hint, delta, href }: Props) {
  const content = (
    <AdminCard
      className={`p-5 ${href ? "transition-colors hover:bg-surface-2" : ""}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-heading text-3xl font-semibold text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <DeltaBadge delta={delta} />
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </AdminCard>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
