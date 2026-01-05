"use client";

import { useState } from "react";
import { Loader2, Mountain } from "lucide-react";
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
import { useAppStore, type SceneWithAsset } from "@/lib/store";
import { scenePresets } from "@/lib/config/scene-presets";

interface EditSceneFormProps {
  scene: SceneWithAsset;
}

export function EditSceneForm({ scene }: EditSceneFormProps) {
  const { clearActionContext, refreshCurrentProject } = useAppStore();

  // Form state
  const [name, setName] = useState(scene.name);
  const [description, setDescription] = useState(scene.description || "");
  const [artStyle, setArtStyle] = useState(scene.artStyle || "");
  const [mood, setMood] = useState(scene.mood || "");
  const [timeOfDay, setTimeOfDay] = useState(scene.timeOfDay || "");
  const [environment, setEnvironment] = useState(scene.environment || "");
  const [styleNotes, setStyleNotes] = useState(scene.styleNotes || "");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a scene name");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/scenes/${scene.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          artStyle: artStyle || null,
          mood: mood || null,
          timeOfDay: timeOfDay || null,
          environment: environment || null,
          styleNotes: styleNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update scene");
      }

      toast.success(`Scene "${name}" updated`);
      clearActionContext();
      await refreshCurrentProject();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update scene");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Primary Asset Preview */}
        {scene.primaryAsset && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={scene.primaryAsset.filePath}
                alt={scene.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {!scene.primaryAsset && (
          <div className="aspect-video rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Mountain className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No preview image</p>
            </div>
          </div>
        )}

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g., Enchanted Forest, Castle Interior"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Style Presets */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="artStyle" className="text-xs">
              Art Style
            </Label>
            <Select value={artStyle} onValueChange={setArtStyle} disabled={isLoading}>
              <SelectTrigger id="artStyle" className="w-full">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {scenePresets.styles.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mood" className="text-xs">
              Mood
            </Label>
            <Select value={mood} onValueChange={setMood} disabled={isLoading}>
              <SelectTrigger id="mood" className="w-full">
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                {scenePresets.moods.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="timeOfDay" className="text-xs">
              Time of Day
            </Label>
            <Select value={timeOfDay} onValueChange={setTimeOfDay} disabled={isLoading}>
              <SelectTrigger id="timeOfDay" className="w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {scenePresets.timeOfDay.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="environment" className="text-xs">
              Environment
            </Label>
            <Select value={environment} onValueChange={setEnvironment} disabled={isLoading}>
              <SelectTrigger id="environment" className="w-full">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {scenePresets.environments.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the scene..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            disabled={isLoading}
          />
        </div>

        {/* Style Notes */}
        <div className="space-y-2">
          <Label htmlFor="styleNotes">Style Notes</Label>
          <Textarea
            id="styleNotes"
            placeholder="Additional style guidance, specific elements to include..."
            value={styleNotes}
            onChange={(e) => setStyleNotes(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-border bg-sidebar p-4 space-y-3">
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
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
