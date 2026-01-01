"use client";

import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
};

export function ImageUpload({
  value,
  onChange,
  maxImages = 14,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const remaining = maxImages - value.length;
      const filesToProcess = Array.from(files).slice(0, remaining);

      filesToProcess.forEach((file) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          onChange([...value, base64]);
        };
        reader.readAsDataURL(file);
      });
    },
    [value, onChange, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const openFilePicker = () => {
    if (value.length >= maxImages) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => handleFiles((e.target as HTMLInputElement).files);
    input.click();
  };

  const isFull = value.length >= maxImages;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isFull) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/50 hover:border-primary/40 hover:bg-muted/30",
          isFull && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isDragging ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
            )}
          >
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {isDragging ? (
                <span className="text-primary font-medium">Drop images here</span>
              ) : (
                <>
                  <span className="text-foreground font-medium">Click to upload</span>{" "}
                  or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {value.length}/{maxImages} images
            </p>
          </div>
        </div>
      </div>

      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {value.map((img, i) => (
            <div
              key={`img-${img.slice(-20)}`}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border/30 bg-muted/20 hover:border-border/60 transition-all"
            >
              <div className="absolute inset-0 checkerboard" />
              <img
                src={img}
                alt={`Upload ${i + 1}`}
                className="relative w-full h-full object-contain"
              />
              <button
                type="button"
                className="absolute top-1 right-1 w-5 h-5 rounded-md bg-background/90 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:border-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-sm text-[9px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
