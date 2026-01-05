"use client";

import { useEffect, useState } from "react";
import { Download, Calendar, Loader2, Trash2, Grid3X3, Eye, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  useAppStore,
  type SpriteSheetWithAsset,
  type Character,
  type Project,
  type Asset,
} from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { characterPresets } from "@/lib/config/character-presets";

interface SpriteSheetWithDetails extends SpriteSheetWithAsset {
  project: Project;
  character: Character & { primaryAsset: Asset | null; assets: Asset[] };
}

interface SpriteSheetViewProps {
  spriteSheetId: string;
}

export function SpriteSheetView({ spriteSheetId }: SpriteSheetViewProps) {
  const { openTab, refreshCurrentProject, closeTab, tabs, activeTabId } =
    useAppStore();
  const [spriteSheet, setSpriteSheet] =
    useState<SpriteSheetWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAnimation, setIsCreatingAnimation] = useState(false);

  useEffect(() => {
    fetchSpriteSheet();
  }, [spriteSheetId]);

  const fetchSpriteSheet = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/spritesheets/${spriteSheetId}`);
      if (res.ok) {
        const data = await res.json();
        setSpriteSheet(data);
      }
    } catch (error) {
      console.error("Failed to fetch spritesheet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!spriteSheet) return;
    try {
      const res = await fetch(`/api/spritesheets/${spriteSheet.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Sprite sheet deleted");
        await refreshCurrentProject();
        // Close the current tab and navigate to character
        const currentTab = tabs.find((t) => t.id === activeTabId);
        if (currentTab) {
          closeTab(currentTab.id);
        }
        openTab("character", spriteSheet.character.id, spriteSheet.character.name);
      } else {
        toast.error("Failed to delete sprite sheet");
      }
    } catch {
      toast.error("Failed to delete sprite sheet");
    }
  };

  const handleDownload = () => {
    if (!spriteSheet) return;
    const link = document.createElement("a");
    link.href = spriteSheet.asset.filePath;
    link.download =
      spriteSheet.asset.filePath.split("/").pop() || `${spriteSheet.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sprite sheet downloaded");
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!spriteSheet) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Sprite sheet not found</p>
      </div>
    );
  }

  const generationSettings = spriteSheet.generationSettings as {
    frameCount?: number;
    anglePreset?: string;
  } | null;

  const frameCount = generationSettings?.frameCount ?? 0;
  const anglePreset = generationSettings?.anglePreset;
  const angleLabel = anglePreset
    ? characterPresets.angles.find((a) => a.value === anglePreset)?.label ?? anglePreset
    : null;

  const handleCreateAnimation = async () => {
    setIsCreatingAnimation(true);
    try {
      // 1. Create animation record
      const res = await fetch("/api/animations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: spriteSheet.character.id,
          name: `${spriteSheet.name} Animation`,
          description: `Extracted from spritesheet: ${spriteSheet.name}`,
          frameCount: generationSettings?.frameCount ?? 4,
          generationConfig: {
            sourceType: "spritesheet",
            spriteSheetId: spriteSheet.id,
            spriteSheetAssetId: spriteSheet.assetId,
            anglePreset: generationSettings?.anglePreset,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create animation");
      }

      const animation = await res.json();

      // 2. Start extraction job
      const extractRes = await fetch("/api/extract-frames-from-sprite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animationId: animation.id,
          spriteSheetId: spriteSheet.id,
        }),
      });

      if (!extractRes.ok) {
        const data = await extractRes.json();
        throw new Error(data.error || "Failed to start extraction");
      }

      // 3. Wait for job to start, then redirect
      const reader = extractRes.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let started = false;

        while (!started) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          if (text.includes('"type":"start"')) {
            started = true;
          }
        }

        // Cancel the reader - animation-view will handle the rest via polling
        reader.cancel();
      }

      await refreshCurrentProject();
      openTab("animation", animation.id, animation.name);
      toast.success("Extraction started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create animation");
    } finally {
      setIsCreatingAnimation(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {spriteSheet.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() =>
                    openTab(
                      "character",
                      spriteSheet.character.id,
                      spriteSheet.character.name,
                    )
                  }
                >
                  {spriteSheet.character.name}
                </button>
                {" · "}
                {spriteSheet.project.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateAnimation}
                disabled={isCreatingAnimation}
              >
                {isCreatingAnimation ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Film className="h-4 w-4 mr-1" />
                )}
                Create Animation
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          {spriteSheet.description && (
            <p className="text-sm text-muted-foreground">
              {spriteSheet.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created{" "}
              {formatDistanceToNow(new Date(spriteSheet.createdAt), {
                addSuffix: true,
              })}
            </span>
            {frameCount > 0 && (
              <span className="flex items-center gap-1">
                <Grid3X3 className="h-4 w-4" />
                {frameCount} frames
              </span>
            )}
            {angleLabel && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {angleLabel}
              </span>
            )}
          </div>
        </div>

        {/* Sprite Sheet Image */}
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="bg-muted/50 p-4 flex items-center justify-center min-h-[400px]">
              <img
                src={spriteSheet.asset.filePath}
                alt={spriteSheet.name}
                className="max-w-full max-h-[600px] object-contain"
              />
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
