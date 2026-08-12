import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
  pending?: boolean;
  pendingLabel?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-surface-2 disabled:opacity-50",
  danger:
    "border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50",
  ghost:
    "text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-50",
};

const sizes: Record<"sm" | "md", string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export function AdminButton({
  variant = "primary",
  size = "sm",
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {pending ? <Spinner className="h-3.5 w-3.5 shrink-0" /> : null}
      {pending && pendingLabel != null ? pendingLabel : children}
    </button>
  );
}
