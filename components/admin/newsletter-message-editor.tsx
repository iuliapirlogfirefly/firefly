"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Bold, ImagePlus, Italic, Link2, List, Loader2 } from "lucide-react";
import { getUploadUrl } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isNewsletterMessageEmpty } from "@/lib/newsletter/message-html";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Props = {
  value: string;
  onChange: (html: string) => void;
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

async function uploadNewsletterImage(file: File): Promise<string> {
  const result = await getUploadUrl("newsletter-media", file.name);
  if (!result.success) throw new Error(result.error);

  const { path, token } = result.data;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("newsletter-media")
    .uploadToSignedUrl(path, token, file);
  if (error) throw error;

  const { data } = supabase.storage.from("newsletter-media").getPublicUrl(path);
  return data.publicUrl;
}

export function NewsletterMessageEditor({ value, onChange }: Props) {
  const t = useTranslations("admin");
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [blank, setBlank] = useState(() => isNewsletterMessageEmpty(value));
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value !== "") return;
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== "") editor.innerHTML = "";
    setBlank(true);
  }, [value]);

  const rememberSelection = () => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection || selection.rangeCount === 0 || !editor) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    savedRange.current = range.cloneRange();
  };

  const restoreSelection = () => {
    const range = savedRange.current;
    const editor = editorRef.current;
    if (!range || !editor) {
      editor?.focus();
      return;
    }
    editor.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const publish = () => {
    const html = editorRef.current?.innerHTML ?? "";
    const empty = isNewsletterMessageEmpty(html);
    setBlank(empty);
    onChange(empty ? "" : html);
  };

  const runCommand = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    publish();
  };

  const applyLink = () => {
    const href = linkUrl.trim();
    let url = href;
    if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
      url = `https://${href}`;
    }
    restoreSelection();
    const selected = window.getSelection()?.toString() ?? "";
    if (selected) {
      document.execCommand("createLink", false, url);
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${escapeAttr(url)}">${escapeAttr(url)}</a>`
      );
    }
    setLinkOpen(false);
    setLinkUrl("https://");
    publish();
  };

  const insertImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(t("errorImageType"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t("errorImageSize"));
      return;
    }

    setUploading(true);
    try {
      const url = await uploadNewsletterImage(file);
      restoreSelection();
      document.execCommand(
        "insertHTML",
        false,
        `<p><img src="${escapeAttr(url)}" alt=""></p>`
      );
      publish();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorImageUpload"));
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        <ToolbarButton
          label={t("formatBold")}
          onMouseDown={rememberSelection}
          onClick={() => runCommand("bold")}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label={t("formatItalic")}
          onMouseDown={rememberSelection}
          onClick={() => runCommand("italic")}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label={t("formatList")}
          onMouseDown={rememberSelection}
          onClick={() => runCommand("insertUnorderedList")}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label={t("formatLink")}
          pressed={linkOpen}
          onMouseDown={rememberSelection}
          onClick={() => setLinkOpen((open) => !open)}
        >
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label={t("insertImage")}
          disabled={uploading || !isSupabaseConfigured()}
          onMouseDown={rememberSelection}
          onClick={() => imageInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
        </ToolbarButton>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void insertImage(event.target.files)}
        />
      </div>

      {linkOpen ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder={t("linkUrl")}
            aria-label={t("linkUrl")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
          />
          <button
            type="button"
            className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
            onMouseDown={(event) => event.preventDefault()}
            onClick={applyLink}
          >
            {t("addLink")}
          </button>
        </div>
      ) : null}

      <div className="relative">
        {blank ? (
          <p className="pointer-events-none absolute left-3 right-3 top-2 text-sm text-muted-foreground">
            {t("htmlPlaceholder")}
          </p>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label={t("htmlContent")}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[200px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-foreground/30 [&_a]:underline [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          onInput={publish}
          onBlur={rememberSelection}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            publish();
          }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{t("messageHint")}</p>
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ToolbarButton({
  label,
  children,
  pressed,
  disabled,
  onClick,
  onMouseDown,
}: {
  label: string;
  children: ReactNode;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  onMouseDown: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50 aria-pressed:bg-surface-2 aria-pressed:text-foreground"
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown();
      }}
      onClick={onClick}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
