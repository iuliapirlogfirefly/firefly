"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import {
  dismissDuplicatePair,
  mergeEvents,
} from "@/lib/actions/duplicates";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import type { DuplicateEventGroup } from "@/lib/queries/duplicates";

type Props = {
  group: DuplicateEventGroup;
};

export function AdminDuplicateActions({ group }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const run = (action: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setFeedback({ type: "success", message: "Updated" });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error ?? "Action failed",
        });
      }
    });
  };

  if (group.events.length < 2) return null;

  const [first, second] = group.events;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <AdminButton
          size="sm"
          onClick={() => run(() => mergeEvents(first.id, second.id))}
          pending={pending}
          pendingLabel="Merging…"
        >
          Keep &ldquo;{first.title}&rdquo;
        </AdminButton>
        <AdminButton
          size="sm"
          variant="secondary"
          onClick={() => run(() => mergeEvents(second.id, first.id))}
          pending={pending}
          pendingLabel="Merging…"
        >
          Keep &ldquo;{second.title}&rdquo;
        </AdminButton>
        <AdminButton
          size="sm"
          variant="secondary"
          onClick={() =>
            run(() => dismissDuplicatePair(first.id, second.id))
          }
          pending={pending}
          pendingLabel="Dismissing…"
        >
          Not duplicates
        </AdminButton>
      </div>
      {feedback ? (
        <ActionFeedback message={feedback.message} type={feedback.type} />
      ) : null}
    </div>
  );
}
