import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: ReactNode;
};

export function PendingButton({
  pending = false,
  pendingLabel,
  children,
  disabled,
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-50 ${className}`}
      {...props}
    >
      {pending ? <Spinner className="h-4 w-4 shrink-0" /> : null}
      {pending && pendingLabel != null ? pendingLabel : children}
    </button>
  );
}
