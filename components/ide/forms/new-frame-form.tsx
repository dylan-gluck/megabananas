"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore, type AnimationWithCharacterAsset } from "@/lib/store";
import { characterPresets } from "@/lib/config/character-presets";
import { cn } from "@/lib/utils";

interface NewFrameFormProps {
  animation: AnimationWithCharacterAsset;
}

type FormStatus = "idle" | "generating" | "complete" | "failed";

export function NewFrameForm({ animation }: NewFrameFormProps) {
  const { clearActionContext, refreshCurrentProject } = useAppStore();

  // Get available reference images
  const characterAssets = animation.character.assets || [];
  const existingFrames = animation.frames || [];
  const lastFrameAsset =
    existingFrames.length > 0
      ? existingFrames[existingFrames.length - 1].asset
      : null;

  // Default to last frame if exists, otherwise character's primary asset
  const defaultAssetId =
    lastFrameAsset?.id ||
    animation.character.primaryAsset?.id ||
    characterAssets[0]?.id ||
    "";

  // Form state
  const [selectedAssetId, setSelectedAssetId] = useState(defaultAssetId);
  const [anglePreset, setAnglePreset] = useState("front");
  const [framePrompt, setFramePrompt] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const isLoading = status === "generating";
  const hasReferenceImages =
    characterAssets.length > 0 ||
    existingFrames.length > 0 ||
    !!animation.character.primaryAsset;

  const handleGenerate = async () => {
    if (!selectedAssetId) {
      toast.error("Please select a reference image");
      return;
    }

    setStatus("generating");

    try {
      const res = await fetch("/api/gen-animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animationId: animation.id,
          characterAssetId: selectedAssetId,
          sequencePrompt: framePrompt.trim() || animation.description || "",
          frameCount: 1,
          anglePreset,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate frame");
      }

      // Read SSE stream for single frame
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "complete") {
                setStatus("complete");
                toast.success("Frame generated");
                await refreshCurrentProject();
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message) {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err) {
      setStatus("failed");
      toast.error(err instanceof Error ? err.message : "Generation failed");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Animation Info */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-medium text-sm">{animation.character.name}</p>
          <p className="text-xs text-muted-foreground">
            {animation.name} · {existingFrames.length} existing frame
            {existingFrames.length !== 1 ? "s" : ""}
          </p>
        </div>

        {!hasReferenceImages && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>No reference images available.</span>
          </div>
        )}

        {/* Reference Image Selector */}
        {hasReferenceImages && (
          <div className="space-y-3">
            <Label>Reference Image</Label>

            {/* Existing Frames */}
            {existingFrames.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Existing Frames</p>
                <div className="grid grid-cols-4 gap-2">
                  {existingFrames.map((frame) => (
                    <button
                      key={frame.asset.id}
                      type="button"
                      onClick={() => setSelectedAssetId(frame.asset.id)}
                      disabled={isLoading}
                      className={cn(
                        "aspect-square rounded-md border-2 overflow-hidden transition-all relative",
                        selectedAssetId === frame.asset.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50",
                        isLoading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <img
                        src={frame.asset.filePath}
                        alt={`Frame ${frame.frameIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 text-white px-1 rounded">
                        {frame.frameIndex + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Character Assets */}
            {characterAssets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Character</p>
                <div className="grid grid-cols-4 gap-2">
                  {characterAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAssetId(asset.id)}
                      disabled={isLoading}
                      className={cn(
                        "aspect-square rounded-md border-2 overflow-hidden transition-all",
                        selectedAssetId === asset.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50",
                        isLoading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <img
                        src={asset.filePath}
                        alt="Character variation"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Angle Dropdown */}
        <div className="space-y-1.5">
          <Label htmlFor="angle" className="text-xs">
            Angle
          </Label>
          <Select
            value={anglePreset}
            onValueChange={setAnglePreset}
            disabled={isLoading}
          >
            <SelectTrigger id="angle" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {characterPresets.angles.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frame-specific Prompt */}
        <div className="space-y-2">
          <Label htmlFor="frame-prompt">Frame Description (Optional)</Label>
          <Textarea
            id="frame-prompt"
            placeholder="Describe this specific frame, e.g., 'left foot forward, arms mid-swing'"
            value={framePrompt}
            onChange={(e) => setFramePrompt(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the animation description
          </p>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-border bg-sidebar p-4 space-y-3">
        {status === "complete" && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>Frame generated</span>
          </div>
        )}

        {status === "failed" && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Generation failed</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={clearActionContext}
          >
            {status === "complete" ? "Done" : "Cancel"}
          </Button>
          {status !== "complete" && (
            <Button
              type="button"
              className="flex-1"
              onClick={handleGenerate}
              disabled={isLoading || !hasReferenceImages}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Frame"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
