"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { submitFeedPost } from "@/lib/actions/business";
import { FEED_CATEGORIES } from "@/lib/constants/feed-categories";
import { ImageUploader } from "@/components/events/image-uploader";
import type { FeedPostCategory, Locale } from "@/types";

type Props = {
  locale: Locale;
};

const inputClass =
  "w-full rounded-xl border border-firefly/20 bg-surface-1/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-firefly/50";

const labelClass = "mb-1.5 block text-xs font-medium text-foreground/50";

export function BusinessFeedPostSection({ locale }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<FeedPostCategory>("party_updates");
  const [titleEn, setTitleEn] = useState("");
  const [descEn, setDescEn] = useState("");
  const [titleRo, setTitleRo] = useState("");
  const [descRo, setDescRo] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const reset = () => {
    setCategory("party_updates");
    setTitleEn("");
    setDescEn("");
    setTitleRo("");
    setDescRo("");
    setMediaUrl(null);
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);

    if (!titleEn.trim() || !descEn.trim()) {
      setError("English title and description are required.");
      return;
    }

    startTransition(async () => {
      const result = await submitFeedPost({
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
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-8 rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          New post
        </button>
      ) : (
        <div className="glass mt-8 rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">New feed post</h2>
            <button
              type="button"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
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
              {pending ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
