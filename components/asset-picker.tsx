"use client";

import { Check, RefreshCw, ImageOff, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Asset = {
  filename: string;
  url: string;
  createdAt: string;
};

type AssetPickerProps = {
  folder: "characters" | "sprites" | "reference";
  value?: string;
  onChange: (url: string, base64?: string) => void;
  className?: string;
};

export function AssetPicker({
  folder,
  value,
  onChange,
  className,
}: AssetPickerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets?folder=${folder}`);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  const handleSelect = async (asset: Asset) => {
    try {
      const res = await fetch(asset.url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        onChange(asset.url, reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch {
      onChange(asset.url);
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-36 text-muted-foreground rounded-xl bg-muted/20 border border-border/30",
          className
        )}
      >
        <RefreshCw className="w-5 h-5 animate-spin mb-2" />
        <span className="text-sm">Loading assets...</span>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-36 text-muted-foreground rounded-xl bg-muted/20 border border-dashed border-border/50",
          className
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
          <FolderOpen className="w-5 h-5" />
        </div>
        <p className="text-sm">No {folder} found</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAssets}
          className="mt-2 h-7 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {assets.length} {folder}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAssets}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      <ScrollArea className="h-40 rounded-lg">
        <div className="grid grid-cols-5 gap-1.5 pr-3">
          {assets.map((asset) => {
            const isSelected = value === asset.url;
            return (
              <button
                type="button"
                key={asset.filename}
                onClick={() => handleSelect(asset)}
                className={cn(
                  "group relative aspect-square rounded-lg overflow-hidden transition-all duration-150",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-[0.98]"
                    : "hover:ring-1 hover:ring-border"
                )}
              >
                <div className="absolute inset-0 checkerboard" />
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="relative w-full h-full object-contain"
                />
                {/* Selection overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                {/* Hover overlay */}
                {!isSelected && (
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center">
                      <Check className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
