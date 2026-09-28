"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { uploadMiniAppFilesAction } from "@/core/mini-apps/actions";
import type { MiniAppFile } from "@/core/mini-apps/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * webkitRelativePath includes the picked folder's own name as the first
 * segment (e.g. "dist/index.html") — stripped here since the site's
 * root should be whatever the user selected, not that folder's name.
 */
function relativePath(file: File): string {
  const raw = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (!raw) return file.name;
  const segments = raw.split("/");
  return segments.slice(1).join("/") || segments[segments.length - 1];
}

export function MiniAppFilesUploadForm({
  miniAppId,
  initialFiles,
}: {
  miniAppId: string;
  initialFiles: MiniAppFile[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<{ path: string; file: File }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      // webkitdirectory isn't part of React's typed input attributes —
      // set it imperatively instead of fighting the JSX types.
      inputRef.current.setAttribute("webkitdirectory", "");
      inputRef.current.setAttribute("directory", "");
    }
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setSelected(files.map((file) => ({ path: relativePath(file), file })));
    setError(null);
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    for (const { path, file } of selected) formData.append(path, file);

    const result = await uploadMiniAppFilesAction(miniAppId, formData);
    setIsSubmitting(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
        <Button type="button" variant="outline" className="w-fit" onClick={() => inputRef.current?.click()}>
          {pt.miniApps.files.chooseFolderButton}
        </Button>
        {selected.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {pt.miniApps.files.filesSelectedCount.replace("{count}", String(selected.length))}
          </p>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex max-h-48 flex-col divide-y overflow-y-auto rounded-lg border text-xs">
          {selected.map(({ path, file }) => (
            <div key={path} className="flex items-center justify-between px-3 py-1.5">
              <span className="truncate font-mono">{path}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="button" disabled={isSubmitting || selected.length === 0} className="w-fit" onClick={handleSubmit}>
        {isSubmitting ? pt.miniApps.files.submitting : pt.miniApps.files.submitContent}
      </Button>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{pt.miniApps.files.uploadedFilesTitle}</h3>
        {initialFiles.length === 0 ? (
          <p className="text-xs text-muted-foreground">{pt.miniApps.files.noFilesYet}</p>
        ) : (
          <>
            <div className="flex flex-col divide-y rounded-lg border text-xs">
              {initialFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between px-3 py-1.5">
                  <span className="truncate font-mono">{file.path}</span>
                  <span className="shrink-0 text-muted-foreground">{formatBytes(file.size_bytes)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{pt.miniApps.files.replaceAllHint}</p>
          </>
        )}
      </div>
    </div>
  );
}
