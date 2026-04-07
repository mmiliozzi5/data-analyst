"use client";

import { useState, useRef } from "react";
import type { DatasetMetadata } from "@/lib/types";

interface PendingFile {
  file: File;
  description: string;
}

interface UploaderProps {
  onUpload: (file: File, description: string) => Promise<DatasetMetadata | null>;
}

export function Uploader({ onUpload }: UploaderProps) {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const accepted = Array.from(files).filter((f) =>
      f.name.match(/\.(csv|xlsx|xls)$/i)
    );
    setPending((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, description: "" })),
    ]);
  }

  function updateDescription(idx: number, description: string) {
    setPending((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, description } : p))
    );
  }

  function removeFile(idx: number) {
    setPending((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setUploading(true);
    setErrors({});
    const newErrors: Record<string, string> = {};

    for (const { file, description } of pending) {
      try {
        await onUpload(file, description);
      } catch (err) {
        newErrors[file.name] = err instanceof Error ? err.message : "Upload failed";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setPending([]);
    } else {
      setPending((prev) => prev.filter((p) => newErrors[p.file.name]));
    }
    setUploading(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Upload Datasets</h2>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-900/20"
            : "border-gray-600 hover:border-gray-400"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-gray-400 text-sm">
          Drop CSV or XLSX files here, or{" "}
          <span className="text-blue-400 underline">click to browse</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {pending.length > 0 && (
        <div className="mt-4 space-y-3">
          {pending.map(({ file, description }, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="bg-gray-800 rounded-lg p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-gray-400 hover:text-red-400 text-xs ml-2 shrink-0"
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => updateDescription(idx, e.target.value)}
                className="bg-gray-700 text-sm text-white rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
              />
              {errors[file.name] && (
                <p className="text-red-400 text-xs">{errors[file.name]}</p>
              )}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {uploading ? "Uploading…" : `Upload ${pending.length} file${pending.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
