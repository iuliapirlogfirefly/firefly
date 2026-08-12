"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, X } from "lucide-react";
import { sendNewsletter } from "@/lib/actions/admin";
import { getUploadUrl } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ImageUploader } from "@/components/events/image-uploader";
import { AdminButton } from "@/components/admin/ui/admin-button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";

type ArchiveItem = {
  id: string;
  subject: string;
  sentAt: string;
  recipients: number;
  opens: number;
};

type Props = {
  subscriberCount: number;
  archive: ArchiveItem[];
  isMockMode?: boolean;
};

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PDFS = 3;

async function uploadNewsletterFile(file: File): Promise<string> {
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

export function AdminNewsletterComposer({
  subscriberCount,
  archive,
  isMockMode,
}: Props) {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const insertImage = (url: string | null) => {
    if (!url) return;
    setHtmlContent(
      (current) =>
        `${current}${current ? "\n" : ""}<p><img src="${url}" alt="" style="max-width:100%;height:auto;" /></p>\n`
    );
  };

  const handlePdfFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFeedback(null);

    const remaining = MAX_PDFS - pdfUrls.length;
    if (remaining <= 0) {
      setFeedback({ type: "error", message: "Maximum 3 PDFs allowed" });
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    for (const file of selected) {
      if (file.type !== "application/pdf") {
        setFeedback({ type: "error", message: "Only PDF files are allowed" });
        return;
      }
      if (file.size > MAX_PDF_BYTES) {
        setFeedback({ type: "error", message: "PDF must be 10MB or smaller" });
        return;
      }
    }

    setUploadingPdf(true);
    try {
      const uploaded = await Promise.all(
        selected.map((file) => uploadNewsletterFile(file))
      );
      setPdfUrls((current) => [...current, ...uploaded]);
    } catch (e) {
      setFeedback({
        type: "error",
        message: e instanceof Error ? e.message : "PDF upload failed",
      });
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendNewsletter(subject, htmlContent, pdfUrls);
      setConfirmOpen(false);
      if (result.success) {
        setFeedback({
          type: "success",
          message: `Sent to ${result.data.sent.toLocaleString()} subscribers`,
        });
        setSubject("");
        setHtmlContent("");
        setPdfUrls([]);
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  return (
    <div data-route="admin-newsletters">
      <h1 className="font-heading text-2xl font-semibold md:text-3xl">
        Newsletters
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Compose and send to {subscriberCount.toLocaleString()} opted-in
        subscribers.
      </p>

      <AdminCard className="mt-8 space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Subject
          </label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="This weekend in Bucharest"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            HTML content
          </label>
          <textarea
            className="min-h-[200px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-foreground/30"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="<p>Your newsletter content...</p>"
            required
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Insert image (embeds in HTML, max 5MB)
            </p>
            <ImageUploader
              bucket="newsletter-media"
              value={null}
              onChange={(url) => {
                if (url) insertImage(url);
              }}
              label=""
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Upload inserts an &lt;img&gt; tag at the end of the HTML.
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Attach PDF (e.g. Canva export, max 10MB, up to 3)
            </p>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => void handlePdfFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={
                uploadingPdf ||
                !isSupabaseConfigured() ||
                pdfUrls.length >= MAX_PDFS
              }
              onClick={() => pdfInputRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
            >
              {uploadingPdf ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  Upload PDF
                </>
              )}
            </button>
            {pdfUrls.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {pdfUrls.map((url) => (
                  <li
                    key={url}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-muted-foreground hover:text-foreground"
                    >
                      {url.split("/").pop()}
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setPdfUrls((current) =>
                          current.filter((item) => item !== url)
                        )
                      }
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove PDF"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {feedback ? (
          <ActionFeedback message={feedback.message} type={feedback.type} />
        ) : null}
        <AdminButton
          size="md"
          disabled={pending || !subject || !htmlContent}
          onClick={() => setConfirmOpen(true)}
        >
          Send newsletter
        </AdminButton>
      </AdminCard>

      <ConfirmDialog
        open={confirmOpen}
        title="Send newsletter"
        description={`Send "${subject}" to ${subscriberCount.toLocaleString()} subscribers${
          pdfUrls.length
            ? ` with ${pdfUrls.length} PDF attachment${pdfUrls.length === 1 ? "" : "s"}`
            : ""
        }?`}
        confirmLabel="Send"
        confirmVariant="primary"
        onClose={() => setConfirmOpen(false)}
        pending={pending}
        onConfirm={handleSend}
      />

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recent sends{isMockMode ? " (demo)" : ""}
        </h2>
        <ul className="space-y-3">
          {archive.map((item) => (
            <AdminCard key={item.id} className="p-4">
              <div className="font-medium">{item.subject}</div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Sent {item.sentAt}</span>
                <span>{item.recipients.toLocaleString()} recipients</span>
                <span>{item.opens.toLocaleString()} opens</span>
              </div>
            </AdminCard>
          ))}
        </ul>
      </section>
    </div>
  );
}
