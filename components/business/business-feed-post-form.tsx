"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { submitFeedPost, updateFeedPost } from "@/lib/actions/business";
import { FEED_CATEGORIES } from "@/lib/constants/feed-categories";
import { ImageUploader } from "@/components/events/image-uploader";
import type { CreateFeedPostInput } from "@/types/events";
import type { FeedPostCategory, Locale } from "@/types";

type Props = {
  locale: Locale;
  mode?: "create" | "edit";
  postId?: string;
  initial?: CreateFeedPostInput & {
    status?: string;
    rejectionReason?: string | null;
  };
  onCancel?: () => void;
  onCreated?: () => void;
};

const inputClass =
  "w-full rounded-xl border border-firefly/20 bg-surface-1/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-firefly/50";

const labelClass = "mb-1.5 block text-xs font-medium text-foreground/50";

function StatusNote({
  mode,
  status,
  rejectionReason,
}: {
  mode: "create" | "edit";
  status?: string;
  rejectionReason?: string | null;
}) {
  if (mode === "create") {
    return (
      <p className="text-xs text-foreground/50">
        New posts are submitted for admin review before they appear in the
        public feed.
      </p>
    );
  }

  if (status === "published") {
    return (
      <p className="text-xs text-amber-warm">
        This post is live. Saving changes will take it offline and send it
        back for admin approval.
      </p>
    );
  }

  if (status === "pending") {
    return (
      <p className="text-xs text-amber-warm">
        This post is awaiting admin approval. Edits stay in the review queue.
      </p>
    );
  }

  if (status === "rejected") {
    return (
      <p className="text-xs text-destructive">
        This post was rejected
        {rejectionReason ? `: ${rejectionReason}` : "."} Update it and
        resubmit for review.
      </p>
    );
  }

  return null;
}

export function BusinessFeedPostForm({
  locale,
  mode = "create",
  postId,
  initial,
  onCancel,
  onCreated,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<FeedPostCategory>(
    initial?.category ?? "party_updates"
  );
  const [titleEn, setTitleEn] = useState(
    initial?.translations?.en?.title ?? ""
  );
  const [descEn, setDescEn] = useState(
    initial?.translations?.en?.description ?? ""
  );
  const [titleRo, setTitleRo] = useState(
    initial?.translations?.ro?.title ?? ""
  );
  const [descRo, setDescRo] = useState(
    initial?.translations?.ro?.description ?? ""
  );
  const [mediaUrl, setMediaUrl] = useState<string | null>(
    initial?.mediaUrl ?? null
  );

  const handleSubmit = () => {
    setError(null);

    if (!titleEn.trim() || !descEn.trim()) {
      setError("English title and description are required.");
      return;
    }

    const payload: CreateFeedPostInput = {
      category,
      translations: {
        en: { title: titleEn.trim(), description: descEn.trim() },
        ro:
          titleRo.trim() || descRo.trim()
            ? {
                title: titleRo.trim() || undefined,
                description: descRo.trim() || undefined,
              }
            : undefined,
      },
      mediaUrl: mediaUrl ?? undefined,
    };

    startTransition(async () => {
      if (mode === "edit") {
        const result = await updateFeedPost(postId!, payload);
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.push("/business/posts");
        router.refresh();
        return;
      }

      const result = await submitFeedPost(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }

      onCreated?.();
      router.refresh();
    });
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold">
            {mode === "edit" ? "Edit feed post" : "New feed post"}
          </h2>
          <StatusNote
            mode={mode}
            status={initial?.status}
            rejectionReason={initial?.rejectionReason}
          />
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-xs text-foreground/50 hover:text-foreground"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedPostCategory)}
            className={inputClass}
          >
            {Object.entries(FEED_CATEGORIES).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.icon} {meta.label[locale]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Title (EN)</label>
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className={inputClass}
            placeholder="SOLD OUT — Techno Night"
          />
        </div>

        <div>
          <label className={labelClass}>Description (EN)</label>
          <textarea
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="What happened, what's next..."
          />
        </div>

        <div>
          <label className={labelClass}>Title (RO, optional)</label>
          <input
            value={titleRo}
            onChange={(e) => setTitleRo(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description (RO, optional)</label>
          <textarea
            value={descRo}
            onChange={(e) => setDescRo(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Media (optional)</label>
          <ImageUploader
            bucket="feed-media"
            value={mediaUrl}
            onChange={setMediaUrl}
          />
        </div>

        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={handleSubmit}
          className="rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending
            ? "Submitting…"
            : mode === "edit"
              ? "Save & submit for review"
              : "Submit for review"}
        </button>
      </div>
    </div>
  );
}

export function BusinessFeedPostSection({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        New post
      </button>
    );
  }

  return (
    <div className="mt-8">
      <BusinessFeedPostForm
        locale={locale}
        mode="create"
        onCancel={() => setOpen(false)}
        onCreated={() => setOpen(false)}
      />
    </div>
  );
}
