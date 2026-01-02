"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAppStore } from "@/lib/store";
import { characterPresets } from "@/lib/config/character-presets";
import { cn } from "@/lib/utils";

interface NewAnimationFormProps {
  projectId: string;
  characterId?: string;
}

export function NewAnimationForm({
  projectId,
  characterId: initialCharacterId,
}: NewAnimationFormProps) {
  const { currentProject, clearActionContext, refreshCurrentProject, openTab } =
    useAppStore();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [characterId, setCharacterId] = useState(initialCharacterId || "");
  const [frameCount, setFrameCount] = useState("4");
  const [anglePreset, setAnglePreset] = useState("front");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const characters = currentProject?.characters || [];
  const selectedCharacter = characters.find((c) => c.id === characterId);
  const characterAssets = selectedCharacter?.assets || [];
  const primaryAsset = selectedCharacter?.primaryAsset;
  const hasCharacterAsset = characterAssets.length > 0 || !!primaryAsset;

  // Update selected asset when character changes
  const handleCharacterChange = (value: string) => {
    setCharacterId(value);
    const char = characters.find((c) => c.id === value);
    const defaultAsset = char?.primaryAsset?.id || char?.assets?.[0]?.id || "";
    setSelectedAssetId(defaultAsset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter an animation name");
      return;
    }

    if (!characterId) {
      toast.error("Please select a character");
      return;
    }

    const assetId = selectedAssetId || primaryAsset?.id;
    if (!assetId) {
      toast.error("Selected character has no assets");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter an animation description");
      return;
    }

    setIsLoading(true);

    try {
      // Create animation in DB with generation config
      const res = await fetch("/api/animations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          characterId,
          description: description.trim(),
          frameCount: parseInt(frameCount, 10),
          // Store generation config for animation-view to use
          generationConfig: {
            characterAssetId: assetId,
            anglePreset,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create animation");
      }

      const animation = await res.json();
      toast.success(`Animation "${name}" created`);

      // Refresh project to update sidebar
      await refreshCurrentProject();

      // Open animation tab (this will trigger generation in animation-view)
      openTab("animation", animation.id, name);

      // Close sidebar
      clearActionContext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create animation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Character selector */}
        <div className="space-y-2">
          <Label htmlFor="character">Character</Label>
          <Select
            value={characterId}
            onValueChange={handleCharacterChange}
            disabled={isLoading}
          >
            <SelectTrigger id="character">
              <SelectValue placeholder="Select a character" />
            </SelectTrigger>
            <SelectContent>
              {characters.length === 0 ? (
                <SelectItem value="" disabled>
                  No characters available
                </SelectItem>
              ) : (
                characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Character asset selector */}
        {characterId && hasCharacterAsset && (
          <div className="space-y-2">
            <Label>Reference Image</Label>
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

        {/* Animation name */}
        <div className="space-y-2">
          <Label htmlFor="name">Animation Name</Label>
          <Input
            id="name"
            placeholder="e.g., Walk, Run, Attack"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Frame count */}
        <div className="space-y-2">
          <Label htmlFor="frameCount">Frame Count</Label>
          <Select value={frameCount} onValueChange={setFrameCount} disabled={isLoading}>
            <SelectTrigger id="frameCount">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 4, 6, 8, 10, 12].map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} frames
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Angle preset */}
        <div className="space-y-2">
          <Label htmlFor="angle">Angle</Label>
          <Select value={anglePreset} onValueChange={setAnglePreset} disabled={isLoading}>
            <SelectTrigger id="angle">
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

        {/* Animation description */}
        <div className="space-y-2">
          <Label htmlFor="description">Animation Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the animation sequence, e.g., 'walking cycle, moving forward, arms swinging naturally'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-border bg-sidebar p-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={clearActionContext}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading || characters.length === 0 || !hasCharacterAsset}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Animation"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
