import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

export function AdminCard({ className = "", children, ...props }: Props) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
