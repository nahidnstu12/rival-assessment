"use client";

import { Paperclip, Trash2, FileText, FileType, Image as ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  useAttachmentMutations,
  useTaskAttachments,
} from "@/hooks/useTaskAttachments";
import {
  ALLOWED_ATTACHMENT_MIME,
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENTS_PER_TASK,
  type TaskAttachment,
} from "@/types/attachment";

type AttachmentsSectionProps = {
  taskId: string;
};

const ACCEPT = ALLOWED_ATTACHMENT_MIME.join(",");

export function AttachmentsSection({ taskId }: AttachmentsSectionProps) {
  const { data, isLoading, isError, refetch } = useTaskAttachments(taskId);
  const { upload, remove } = useAttachmentMutations(taskId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const attachments = data?.data ?? [];
  const atLimit = attachments.length >= MAX_ATTACHMENTS_PER_TASK;

  function validate(file: File): string | null {
    if (!ALLOWED_ATTACHMENT_MIME.includes(file.type as (typeof ALLOWED_ATTACHMENT_MIME)[number])) {
      return "Unsupported file type";
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return "File exceeds 5 MB";
    }
    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (atLimit) return;

    const file = files[0]; // single-file upload (per phase doc)
    const err = validate(file);
    if (err) return;

    upload.mutate(file);
  }

  return (
    <section className="attachments-section" aria-label="Attachments">
      <header className="attachments-header">
        <h4 className="attachments-title">
          <Paperclip size={14} strokeWidth={2} aria-hidden /> Attachments
        </h4>
        <span className="attachments-count">
          {attachments.length}/{MAX_ATTACHMENTS_PER_TASK}
        </span>
      </header>

      <div
        className={`attachments-dropzone ${dragOver ? "is-over" : ""} ${atLimit ? "is-disabled" : ""}`}
        onDragOver={(e) => {
          if (atLimit) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !atLimit && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: "none" }}
          onChange={(e) => {
            handleFiles(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        {atLimit ? (
          <p className="attachments-hint">Limit reached — remove a file to add more</p>
        ) : (
          <p className="attachments-hint">
            {upload.isPending ? "Uploading…" : "Drop a file or click to upload (max 5 MB)"}
          </p>
        )}
      </div>

      {isLoading && <p className="attachments-empty">Loading…</p>}

      {isError && (
        <div className="attachments-empty">
          <p>Failed to load attachments</p>
          <button type="button" className="btn btn-ghost" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && attachments.length > 0 && (
        <ul className="attachments-list">
          {attachments.map((att) => (
            <AttachmentRow
              key={att.id}
              attachment={att}
              onDelete={() => remove.mutate(att)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function AttachmentRow({
  attachment,
  onDelete,
}: {
  attachment: TaskAttachment;
  onDelete: () => void;
}) {
  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <li className="attachment-row">
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="attachment-link"
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={attachment.url} alt={attachment.filename} className="attachment-thumb" />
        ) : (
          <span className="attachment-icon" aria-hidden>
            {iconForMime(attachment.mimeType)}
          </span>
        )}
        <span className="attachment-meta">
          <span className="attachment-name">{attachment.filename}</span>
          <span className="attachment-size">{formatBytes(attachment.size)}</span>
        </span>
      </a>
      <button
        type="button"
        className="icon-action"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Remove "${attachment.filename}"?`)) onDelete();
        }}
        aria-label={`Remove ${attachment.filename}`}
      >
        <Trash2 size={14} strokeWidth={2} />
      </button>
    </li>
  );
}

function iconForMime(mime: string) {
  if (mime === "application/pdf") return <FileType size={18} strokeWidth={2} />;
  if (mime === "text/plain") return <FileText size={18} strokeWidth={2} />;
  return <ImageIcon size={18} strokeWidth={2} />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
