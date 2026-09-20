"use client";

import { useTranslations } from "next-intl";

type Status =
  | "pending"
  | "active"
  | "approved"
  | "published"
  | "rejected"
  | "suspended"
  | "draft"
  | "default";

type Props = {
  status: Status | string;
  children: React.ReactNode;
};

const styles: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  active: "bg-emerald-500/15 text-emerald-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  published: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  suspended: "bg-zinc-500/15 text-zinc-400",
  draft: "bg-zinc-500/15 text-zinc-400",
  default: "bg-surface-2 text-muted-foreground",
};

export function AdminBadge({ status, children }: Props) {
  const tStatus = useTranslations("common.status");
  const key = (status in styles ? status : "default") as Status;
  const label =
    typeof children === "string" && tStatus.has(children)
      ? tStatus(children)
      : children;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[key]}`}
    >
      {label}
    </span>
  );
}
