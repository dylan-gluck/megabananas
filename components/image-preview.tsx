"use client";

import { Download, Save, Check, ExternalLink, ZoomIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImagePreviewProps = {
  image: string;
  filename?: string;
  onSave?: () => void;
  saved?: boolean;
  className?: string;
};

export function ImagePreview({
  image,
  filename,
  onSave,
  saved,
  className,
}: ImagePreviewProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.startsWith("data:")
      ? image
      : `data:image/png;base64,${image}`;
    link.download = filename || `image_${Date.now()}.png`;
    link.click();
  };

  const displayImage = image.startsWith("data:")
    ? image
    : `data:image/png;base64,${image}`;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Image container */}
      <div
        className="group relative rounded-xl overflow-hidden border border-border/50 shadow-lg"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Checkerboard background for transparency */}
        <div className="absolute inset-0 checkerboard" />

        {/* The image */}
        <img
          src={displayImage}
          alt="Generated"
          className="relative w-full h-auto"
        />

        {/* Hover overlay with actions */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex flex-col justify-end p-3 transition-opacity duration-200",
            isHovering ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="flex-1 h-8 bg-background/80 backdrop-blur-sm hover:bg-background/95 border border-border/50"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/95 border border-border/50"
              onClick={() => window.open(displayImage, "_blank")}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Saved badge */}
        {saved && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-medium shadow-lg">
            <Check className="w-3 h-3" />
            Saved
          </div>
        )}
      </div>

      {/* Action buttons (always visible) */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          className="flex-1 h-9"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Download
        </Button>
        {onSave && (
          <Button
            variant={saved ? "secondary" : "default"}
            size="sm"
            onClick={onSave}
            disabled={saved}
            className={cn("flex-1 h-9", saved && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Saved to Assets
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save to Assets
              </>
            )}
          </Button>
        )}
      </div>

      {/* Filename */}
      {filename && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate max-w-[200px] font-mono">{filename}</span>
        </div>
      )}
    </div>
  );
}
