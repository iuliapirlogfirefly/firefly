"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Bell, Share2, Ticket } from "lucide-react";
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

function computeRemindAt(startsAt: string): string | null {
  const start = new Date(startsAt);
  const now = new Date();

  if (start <= now) return null;

  const twentyFourHoursBefore = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourBefore = new Date(start.getTime() - 60 * 60 * 1000);

  let remindAt =
    twentyFourHoursBefore > now ? twentyFourHoursBefore : oneHourBefore;

  if (remindAt <= now) remindAt = oneHourFromNow;
  if (remindAt >= start) return null;

  return remindAt.toISOString();
}

type Props = {
  eventId: string;
  eventTitle: string;
  startsAt: string;
  initialSaved: boolean;
  initialReminded: boolean;
  ticketUrl: string | null;
};

export function EventActions({
  eventId,
  eventTitle,
  startsAt,
  initialSaved,
  initialReminded,
  ticketUrl,
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [reminded, setReminded] = useState(initialReminded);
  const [pending, startTransition] = useTransition();
  const [reminderPending, startReminderTransition] = useTransition();

  const remindAt = useMemo(() => computeRemindAt(startsAt), [startsAt]);

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

      if (!remindAt) return;

      const result = await setReminder(eventId, remindAt);
      if (result.success || result.error === SUPABASE_DISABLED_MESSAGE) {
        setReminded(true);
      } else if (result.error === "Authentication required") {
        router.push("/auth");
      }
    });
  }, [eventId, reminded, remindAt, router]);

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
          Get tickets
        </a>
      ) : null}

      <PendingButton
        type="button"
        onClick={toggleSaved}
        pending={pending}
        pendingLabel={saved ? "Updating…" : "Saving…"}
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
        {saved ? "Saved to your jar" : "Save this night"}
      </PendingButton>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={toggleReminder}
          disabled={reminderPending || (!reminded && !remindAt)}
          aria-busy={reminderPending || undefined}
          className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm transition-colors ${
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
            ? "Updating…"
            : reminded
              ? "Reminder set"
              : "Remind"}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="flex items-center justify-center gap-2 rounded-full border border-firefly/20 px-4 py-3 text-sm transition-colors hover:border-firefly/50"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      <p className="pt-3 text-center text-xs text-foreground/40">
        Tickets handled by external partners. Secure checkout.
      </p>
    </aside>
  );
}
