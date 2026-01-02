"use client";

import { Star, Eye, Edit, Trash2, Loader2, Expand } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAppStore, type Asset } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AssetThumbnailProps {
  asset: Asset;
  isPrimary?: boolean;
  isSettingPrimary?: boolean;
  onSetPrimary?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function AssetThumbnail({
  asset,
  isPrimary = false,
  isSettingPrimary = false,
  onSetPrimary,
  onDelete,
  className,
}: AssetThumbnailProps) {
  const { openTab, setActionContext } = useAppStore();

  const filename = asset.filePath.split("/").pop() || "Asset";

  const handleView = () => {
    openTab("asset", asset.id, filename);
    setActionContext({ type: "view-asset", asset });
  };

  const handleEdit = () => {
    setActionContext({ type: "view-asset", asset });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "group relative aspect-square rounded-lg border bg-muted overflow-hidden cursor-pointer",
            isPrimary ? "border-primary ring-2 ring-primary/20" : "border-border",
            className,
          )}
          onClick={handleView}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleView();
          }}
        >
          <img
            src={asset.filePath}
            alt="Asset"
            className="w-full h-full object-cover"
          />
          {/* Primary badge */}
          {isPrimary && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Primary
            </Badge>
          )}
          {/* Set as primary button - top right */}
          {!isPrimary && onSetPrimary && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-yellow-500"
              onClick={(e) => {
                e.stopPropagation();
                onSetPrimary();
              }}
              disabled={isSettingPrimary}
            >
              {isSettingPrimary ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Star className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {/* Hover overlay with expand icon */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <Expand className="h-6 w-6 text-white" />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </ContextMenuItem>
        <ContextMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>
        {onSetPrimary && !isPrimary && (
          <ContextMenuItem onClick={onSetPrimary} disabled={isSettingPrimary}>
            <Star className="mr-2 h-4 w-4" />
            Set as Primary
          </ContextMenuItem>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
