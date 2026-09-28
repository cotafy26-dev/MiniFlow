"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function HtmlUploadField({
  id,
  value,
  onChange,
  label,
  hint,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint: string;
  error?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      } else {
        toast.error(pt.miniApps.form.uploadHtmlFileError);
      }
    };
    reader.onerror = () => toast.error(pt.miniApps.form.uploadHtmlFileError);
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <input
        ref={fileInputRef}
        type="file"
        accept=".html,text/html"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => fileInputRef.current?.click()}
        >
          {pt.miniApps.form.uploadHtmlFile}
        </Button>
        <p className="text-xs text-muted-foreground">{pt.miniApps.form.uploadHtmlFileHint}</p>
      </div>

      <Textarea
        id={id}
        rows={8}
        className="max-h-64 overflow-y-auto font-mono text-xs"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
      <FieldError errors={[error ? { message: error } : undefined]} />

      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setShowPreview((prev) => !prev)}>
        {pt.miniApps.form.previewHtml}
      </Button>

      {showPreview && (
        <iframe srcDoc={value || ""} sandbox="" className="h-64 w-full rounded-lg border bg-white" title="Preview" />
      )}
    </div>
  );
}
