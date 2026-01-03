"use client";

import { formatDistanceToNow } from "date-fns";
import { Calendar, MessageSquare, Settings, Image as ImageIcon, Download, Trash2, Copy } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppStore, type Asset } from "@/lib/store";

interface AssetMetadataPanelProps {
  asset: Asset;
}

export function AssetMetadataPanel({ asset }: AssetMetadataPanelProps) {
  const { clearActionContext, refreshCurrentProject, closeTab } = useAppStore();
  const generationSettings = asset.generationSettings as Record<string, unknown> | null;

  const handleDownload = async () => {
    try {
      const response = await fetch(asset.filePath);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = asset.filePath.split("/").pop() || "asset.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download asset");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Asset deleted");
        closeTab(`asset-${asset.id}`);
        clearActionContext();
        await refreshCurrentProject();
      } else {
        toast.error("Failed to delete asset");
      }
    } catch {
      toast.error("Failed to delete asset");
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4 space-y-6 overflow-hidden">
        {/* Preview thumbnail */}
        <div className="aspect-square rounded-lg border border-border bg-muted overflow-hidden">
          <img
            src={asset.filePath}
            alt="Asset preview"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>

        {/* Created date */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Created
          </Label>
          <p className="text-sm">
            {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Badge variant="secondary" className="capitalize">
            {asset.type}
          </Badge>
        </div>

        {/* User Prompt */}
        {asset.userPrompt && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              User Prompt
            </Label>
            <p className="text-sm text-foreground bg-muted/50 p-2 rounded-md break-words">
              {asset.userPrompt}
            </p>
          </div>
        )}

        {/* System Prompt */}
        {asset.systemPrompt && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              System Prompt
            </Label>
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md whitespace-pre-wrap break-words">
              {asset.systemPrompt}
            </p>
          </div>
        )}

        {/* Generation Settings */}
        {generationSettings && Object.keys(generationSettings).length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Generation Settings</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(generationSettings).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reference Assets */}
        {asset.referenceAssetIds && asset.referenceAssetIds.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Reference Assets ({asset.referenceAssetIds.length})
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {asset.referenceAssetIds.map((id) => (
                <Badge key={id} variant="secondary" className="text-xs font-mono">
                  {id.slice(0, 8)}...
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* File path */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">File Path</Label>
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0">
              {asset.filePath}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(asset.filePath);
                toast.success("Path copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
