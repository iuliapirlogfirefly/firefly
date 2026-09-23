"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getUploadUrl } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Bucket = "event-images" | "feed-media" | "newsletter-media";

async function uploadFile(bucket: Bucket, file: File): Promise<string> {
  const result = await getUploadUrl(bucket, file.name);
  if (!result.success) throw new Error(result.error);

  const { path, token } = result.data;
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file);

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

type SingleProps = {
  bucket?: Bucket;
  label?: string;
  hint?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  multiple?: false;
};

type MultiProps = {
  bucket?: Bucket;
  label?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple: true;
};

type Props = SingleProps | MultiProps;

export function ImageUploader(props: Props) {
  const { bucket = "event-images", label } = props;
  const t = useTranslations("event");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = pending || !isSupabaseConfigured();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setPending(true);

    try {
      if (props.multiple) {
        const uploaded = await Promise.all(
          Array.from(files).map((file) => uploadFile(bucket, file))
        );
        props.onChange([...props.value, ...uploaded]);
      } else {
        const url = await uploadFile(bucket, files[0]);
        props.onChange(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("uploadFailed"));
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const triggerPicker = () => inputRef.current?.click();

  return (
    <div>
      {label ? (
        <span className="mb-1.5 block text-xs font-medium text-foreground/50">
          {label}
        </span>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!!props.multiple}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {!props.multiple ? (
        props.value ? (
          <div className="group relative h-40 w-full overflow-hidden rounded-xl border border-firefly/20">
            <Image
              src={props.value}
              alt=""
              fill
              sizes="400px"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={triggerPicker}
                disabled={disabled}
                className="rounded-full bg-firefly px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {t("replace")}
              </button>
              <button
                type="button"
                onClick={() => props.onChange(null)}
                disabled={disabled}
                className="rounded-full border border-firefly/40 px-3 py-1.5 text-xs text-foreground disabled:opacity-50"
              >
                {t("remove")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={triggerPicker}
            disabled={disabled}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-firefly/30 text-sm text-foreground/50 transition-colors hover:border-firefly/60 hover:text-firefly disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            {pending ? t("uploading") : t("clickToUpload")}
          </button>
        )
      ) : (
        <div className="flex flex-wrap gap-3">
          {props.value.map((url, index) => (
            <div
              key={url + index}
              className="group relative h-24 w-24 overflow-hidden rounded-lg border border-firefly/20"
            >
              <Image src={url} alt="" fill sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() =>
                  props.onChange(props.value.filter((_, i) => i !== index))
                }
                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={t("removeImage")}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={triggerPicker}
            disabled={disabled}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-firefly/30 text-foreground/50 transition-colors hover:border-firefly/60 hover:text-firefly disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            <span className="text-[10px]">{pending ? t("uploading") : t("add")}</span>
          </button>
        </div>
      )}

      {!props.multiple && props.hint ? (
        <p className="mt-2 text-xs text-foreground/40">{props.hint}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {!isSupabaseConfigured() ? (
        <p className="mt-2 text-xs text-foreground/40">{t("mockModeHint")}</p>
      ) : null}
    </div>
  );
}
