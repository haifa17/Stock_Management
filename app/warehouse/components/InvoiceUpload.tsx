"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface InvoiceUploadProps {
  file: File | null;
  preview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function InvoiceUpload({
  file,
  preview,
  fileInputRef,
  onUpload,
  onRemove,
  disabled,
}: InvoiceUploadProps) {
  return (
    <div className="space-y-2">
      {!file ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full cursor-pointer"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Invoice
        </Button>
      ) : (
        <div className="relative border-2 border-green-300 rounded-lg p-3 bg-green-50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="absolute top-1 right-1 h-6 w-6 p-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>

          {preview ? (
            <img
              src={preview}
              alt="Invoice preview"
              className="w-full rounded"
            />
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {file.name}
                </p>
                <p className="text-xs text-green-600">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={onUpload}
        className="hidden"
      />
    </div>
  );
}
