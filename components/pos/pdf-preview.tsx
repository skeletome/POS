"use client";

export default function PDFPreview({ url }: { url: string }) {
  return (
    <iframe
      src={url}
      title="Pratinjau Struk PDF"
      className="h-[70vh] w-full rounded-lg border border-border bg-muted"
    />
  );
}
