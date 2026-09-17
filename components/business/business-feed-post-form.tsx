"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { submitFeedPost, updateFeedPost } from "@/lib/actions/business";
import {
  FEED_CATEGORIES,
  getCategoryMeta,
} from "@/lib/constants/feed-categories";
import { ImageUploader } from "@/components/events/image-uploader";
import type { CreateFeedPostInput } from "@/types/events";
import type { FeedPostCategory } from "@/types";

type Props = {
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
  const t = useTranslations("business");

  if (mode === "create") {
    return <p className="text-xs text-foreground/50">{t("postCreateHint")}</p>;
  }

  if (status === "published") {
    return <p className="text-xs text-amber-warm">{t("postPublishedHint")}</p>;
  }

  if (status === "pending") {
    return <p className="text-xs text-amber-warm">{t("postPendingHint")}</p>;
  }

  if (status === "rejected") {
    return (
      <p className="text-xs text-destructive">
        {t("postRejectedHint", {
          detail: rejectionReason ? `: ${rejectionReason}` : ".",
        })}
      </p>
    );
  }

  return null;
}

export function BusinessFeedPostForm({
  mode = "create",
  postId,
  initial,
  onCancel,
  onCreated,
}: Props) {
  const t = useTranslations("business");
  const tEvent = useTranslations("event");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("feedCategories");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

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

  const handleSubmit = async () => {
    if (savingRef.current) return;
    setError(null);

    if (!titleEn.trim() || !descEn.trim()) {
      setError(t("enRequired"));
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

    savingRef.current = true;
    setSaving(true);

    try {
      if (mode === "edit") {
        const result = await updateFeedPost(postId!, payload);
        if (!result.success) {
          savingRef.current = false;
          setError(result.error);
          setSaving(false);
          return;
        }
        router.push("/business/posts");
        return;
      }

      const result = await submitFeedPost(payload);
      if (!result.success) {
        savingRef.current = false;
        setError(result.error);
        setSaving(false);
        return;
      }

      onCreated?.();
      router.refresh();
    } catch {
      savingRef.current = false;
      setError(t("submitFailed"));
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold">
            {mode === "edit" ? t("editPostTitle") : t("createPostTitle")}
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
            {tCommon("cancel")}
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>{t("category")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedPostCategory)}
            className={inputClass}
          >
            {Object.entries(FEED_CATEGORIES).map(([key, icon]) => {
              const meta = getCategoryMeta(key as FeedPostCategory, tCategories);
              return (
                <option key={key} value={key}>
                  {icon} {meta.label}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className={labelClass}>{tEvent("titleEn")}</label>
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className={inputClass}
            placeholder={t("titleEnPlaceholder")}
          />
        </div>

        <div>
          <label className={labelClass}>{tEvent("descriptionEn")}</label>
          <textarea
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder={t("descriptionEnPlaceholder")}
          />
        </div>

        <div>
          <label className={labelClass}>{t("titleRoOptional")}</label>
          <input
            value={titleRo}
            onChange={(e) => setTitleRo(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t("descriptionRoOptional")}</label>
          <textarea
            value={descRo}
            onChange={(e) => setDescRo(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t("mediaOptional")}</label>
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
          disabled={saving}
          onClick={() => void handleSubmit()}
          className="rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving
            ? t("submitting")
            : mode === "edit"
              ? t("saveAndSubmitReview")
              : t("submitForReview")}
        </button>
      </div>
    </div>
  );
}

export function BusinessFeedPostSection() {
  const t = useTranslations("business");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 rounded-full bg-firefly px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        {t("newPost")}
      </button>
    );
  }

  return (
    <div className="mt-8">
      <BusinessFeedPostForm
        mode="create"
        onCancel={() => setOpen(false)}
        onCreated={() => setOpen(false)}
      />
    </div>
  );
}
