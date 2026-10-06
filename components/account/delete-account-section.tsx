"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteOwnAccount } from "@/lib/actions/account";

type Props = {
  email: string;
  variant: "user" | "business";
};

export function DeleteAccountSection({ email, variant }: Props) {
  const t = useTranslations("accountDeletion");
  const router = useRouter();
  const [typedEmail, setTypedEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailMatches =
    typedEmail.trim().toLowerCase() === email.trim().toLowerCase();

  const close = () => {
    if (pending) return;
    setOpen(false);
    setError(null);
  };

  const onConfirm = async () => {
    if (!emailMatches) return;
    setPending(true);
    setError(null);

    const result = await deleteOwnAccount(typedEmail.trim());
    if (!result.success) {
      setPending(false);
      setError(result.error);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <section className="mt-8 glass rounded-3xl border border-destructive/20 p-6">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-destructive">
        {t("eyebrow")}
      </div>
      <h2 className="font-heading text-2xl font-semibold">{t("title")}</h2>
      <p className="mt-2 max-w-xl text-sm text-foreground/60">
        {variant === "business" ? t("businessBody") : t("userBody")}
      </p>

      <label className="mt-5 block max-w-md">
        <span className="font-mono text-[10px] uppercase tracking-wider-2 text-foreground/40">
          {t("emailLabel")}
        </span>
        <input
          type="email"
          autoComplete="off"
          value={typedEmail}
          onChange={(event) => setTypedEmail(event.target.value)}
          disabled={pending}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-destructive/40"
        />
      </label>

      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!emailMatches || pending}
        className="mt-4 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("delete")}
      </button>

      <ConfirmDialog
        open={open}
        title={t("dialogTitle")}
        description={
          variant === "business" ? t("businessWarning") : t("userWarning")
        }
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        pendingLabel={t("deleting")}
        pending={pending}
        error={error}
        onClose={close}
        onConfirm={() => void onConfirm()}
      />
    </section>
  );
}
