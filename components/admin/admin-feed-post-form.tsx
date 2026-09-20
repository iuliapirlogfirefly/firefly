"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createAdminFeedPost,
  updateAdminFeedPost,
} from "@/lib/actions/admin";
import {
  FEED_CATEGORIES,
  getCategoryMeta,
} from "@/lib/constants/feed-categories";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ImageUploader } from "@/components/events/image-uploader";
import type { CreateFeedPostInput } from "@/types/events";
import type { FeedPostCategory } from "@/types";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30";

const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

type Props = {
  post?: {
    id: string;
    category: FeedPostCategory;
    translations: CreateFeedPostInput["translations"];
    mediaUrl: string | null;
  };
};

export function AdminFeedPostForm({ post }: Props) {
  const tEvent = useTranslations("event");
  const tBusiness = useTranslations("business");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("feedCategories");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<FeedPostCategory>(
    post?.category ?? "party_updates"
  );
  const [titleEn, setTitleEn] = useState(post?.translations.en.title ?? "");
  const [descEn, setDescEn] = useState(post?.translations.en.description ?? "");
  const [titleRo, setTitleRo] = useState(post?.translations.ro?.title ?? "");
  const [descRo, setDescRo] = useState(post?.translations.ro?.description ?? "");
  const [mediaUrl, setMediaUrl] = useState<string | null>(post?.mediaUrl ?? null);

  const isEdit = Boolean(post);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!titleEn.trim() || !descEn.trim()) {
      setError(tBusiness("enRequired"));
      return;
    }

    const data: CreateFeedPostInput = {
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
      if (isEdit && post) {
        const result = await updateAdminFeedPost(post.id, data);
        if (result.success) {
          router.push(`/admin/posts/${post.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
        return;
      }

      const result = await createAdminFeedPost(data);
      if (result.success) {
        router.push(`/admin/posts/${result.data.id}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <AdminCard className="space-y-6 p-6">
        <div>
          <label className={labelClass}>{tBusiness("category")}</label>
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

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>{tEvent("titleEn")}</label>
            <input
              className={inputClass}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder={tBusiness("titleEnPlaceholder")}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{tBusiness("titleRoOptional")}</label>
            <input
              className={inputClass}
              value={titleRo}
              onChange={(e) => setTitleRo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>{tEvent("descriptionEn")}</label>
            <textarea
              className={inputClass}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              rows={4}
              placeholder={tBusiness("descriptionEnPlaceholder")}
              required
            />
          </div>
          <div>
            <label className={labelClass}>
              {tBusiness("descriptionRoOptional")}
            </label>
            <textarea
              className={inputClass}
              value={descRo}
              onChange={(e) => setDescRo(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{tBusiness("mediaOptional")}</label>
          <ImageUploader
            bucket="feed-media"
            value={mediaUrl}
            onChange={setMediaUrl}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <AdminButton type="submit" size="md" pending={pending}>
            {pending
              ? tCommon("saving")
              : isEdit
                ? tCommon("save")
                : tEvent("createPublish")}
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() =>
              router.push(isEdit && post ? `/admin/posts/${post.id}` : "/admin/posts")
            }
          >
            {tCommon("cancel")}
          </AdminButton>
        </div>
      </AdminCard>
    </form>
  );
}
