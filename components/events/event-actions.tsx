"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Bell, ExternalLink, Share2, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PendingButton } from "@/components/ui/pending-button";
import { Spinner } from "@/components/ui/spinner";
import {
  removeReminder,
  saveEvent,
  setReminder,
  unsaveEvent,
} from "@/lib/actions/saves";
import { trackShare } from "@/lib/actions/analytics";
import { SUPABASE_DISABLED_MESSAGE } from "@/lib/supabase/config";
import {
  canSetEventReminder,
  isEventTooFarForReminder,
} from "@/lib/utils/reminders";

const STORAGE_KEY = "firefly:saved";

function readSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSavedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

type Props = {
  eventId: string;
  eventTitle: string;
  startsAt: string;
  initialSaved: boolean;
  initialReminded: boolean;
  ticketUrl: string | null;
  websiteUrl: string | null;
};

export function EventActions({
  eventId,
  eventTitle,
  startsAt,
  initialSaved,
  initialReminded,
  ticketUrl,
  websiteUrl,
}: Props) {
  const t = useTranslations("event");
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [reminded, setReminded] = useState(initialReminded);
  const [pending, startTransition] = useTransition();
  const [reminderPending, startReminderTransition] = useTransition();

  const reminderTooFar = useMemo(
    () => isEventTooFarForReminder(startsAt),
    [startsAt]
  );
  const canRemind = useMemo(() => canSetEventReminder(startsAt), [startsAt]);

  useEffect(() => {
    setSaved(initialSaved || readSavedIds().has(eventId));
  }, [eventId, initialSaved]);

  useEffect(() => {
    setReminded(initialReminded);
  }, [eventId, initialReminded]);

  const toggleSaved = useCallback(() => {
    startTransition(async () => {
      const next = !saved;
      setSaved(next);

      const ids = readSavedIds();
      if (next) ids.add(eventId);
      else ids.delete(eventId);
      writeSavedIds(ids);

      const result = next
        ? await saveEvent(eventId)
        : await unsaveEvent(eventId);

      if (
        !result.success &&
        result.error !== SUPABASE_DISABLED_MESSAGE
      ) {
        setSaved(!next);
        if (next) ids.delete(eventId);
        else ids.add(eventId);
        writeSavedIds(ids);
      }
    });
  }, [eventId, saved]);

  const toggleReminder = useCallback(() => {
    startReminderTransition(async () => {
      if (reminded) {
        const result = await removeReminder(eventId);
        if (result.success || result.error === SUPABASE_DISABLED_MESSAGE) {
          setReminded(false);
        } else if (result.error === "Authentication required") {
          router.push("/auth");
        }
        return;
      }

      if (!canRemind) return;

      const result = await setReminder(eventId);
      if (result.success || result.error === SUPABASE_DISABLED_MESSAGE) {
        setReminded(true);
      } else if (result.error === "Authentication required") {
        router.push("/auth");
      }
    });
  }, [canRemind, eventId, reminded, router]);

  const share = useCallback(async () => {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title: eventTitle, url });
    } else {
      await navigator.clipboard.writeText(url);
    }

    void trackShare("event", eventId);
  }, [eventId, eventTitle]);

  return (
    <aside className="space-y-3 self-start lg:sticky lg:top-24">
      {ticketUrl ? (
        <a
          href={`/api/out/${eventId}`}
          className="flex items-center justify-center gap-2 rounded-full bg-firefly px-6 py-4 font-medium text-primary-foreground transition-all hover:firefly-glow"
        >
          <Ticket className="h-5 w-5" />
          {t("getTickets")}
        </a>
      ) : null}

      {websiteUrl ? (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full border border-firefly/30 px-6 py-4 font-medium text-foreground transition-all hover:bg-firefly/5"
        >
          <ExternalLink className="h-5 w-5" />
          {t("visitWebsite")}
        </a>
      ) : null}

      <PendingButton
        type="button"
        onClick={toggleSaved}
        pending={pending}
        pendingLabel={saved ? t("updating") : t("saving")}
        className={`w-full rounded-full border px-6 py-4 font-medium transition-all ${
          saved
            ? "border-firefly bg-firefly/10 text-firefly"
            : "border-firefly/30 text-foreground hover:bg-firefly/5"
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={saved ? "#FEF7A3" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {saved ? t("savedToJar") : t("saveNight")}
      </PendingButton>

      <div className="grid grid-cols-2 items-start gap-3">
        <div>
          <button
            type="button"
            onClick={toggleReminder}
            disabled={reminderPending || (!reminded && !canRemind)}
            aria-busy={reminderPending || undefined}
            className={`flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm transition-colors ${
              reminded
                ? "border-firefly bg-firefly/10 text-firefly"
                : "border-firefly/20 hover:border-firefly/50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {reminderPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {reminderPending
              ? t("updating")
              : reminded
                ? t("reminderSet")
                : t("remind")}
          </button>
          {reminderTooFar && !reminded ? (
            <p className="mt-1.5 text-center text-[11px] leading-snug text-foreground/40">
              {t("reminderTooFar")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void share()}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-firefly/20 px-4 py-3 text-sm transition-colors hover:border-firefly/50"
        >
          <Share2 className="h-4 w-4" />
          {t("share")}
        </button>
      </div>

      <p className="pt-3 text-center text-xs text-foreground/40">
        {t("ticketsDisclaimer")}
      </p>
    </aside>
  );
}
