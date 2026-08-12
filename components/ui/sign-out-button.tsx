"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled"> & {
  label?: string;
  pendingLabel?: string;
};

export function SignOutButton({
  className = "",
  label = "Sign out",
  pendingLabel = "Signing out…",
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={`inline-flex items-center gap-2 disabled:opacity-50 ${className}`}
      {...props}
    >
      {pending ? <Spinner className="h-3.5 w-3.5 shrink-0" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
