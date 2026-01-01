"use client";

import {
  Layers,
  Loader2,
  Plus,
  Trash2,
  Play,
  ArrowRight,
  Film,
  Hash,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssetPicker } from "./asset-picker";
import { ImagePreview } from "./image-preview";
import { cn } from "@/lib/utils";

type Sequence = {
  name: string;
  description: string;
  frames: number;
};

const defaultSequence: Sequence = { name: "", description: "", frames: 4 };

export function SpriteWorkflow() {
  const [characterImage, setCharacterImage] = useState<string>("");
  const [characterUrl, setCharacterUrl] = useState<string>("");
  const [sequences, setSequences] = useState<Sequence[]>([
    { ...defaultSequence },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    spriteGrid: string;
    filename: string;
  } | null>(null);

  const addSequence = () => {
    setSequences([...sequences, { ...defaultSequence }]);
  };

  const removeSequence = (index: number) => {
    if (sequences.length === 1) return;
    setSequences(sequences.filter((_, i) => i !== index));
  };

  const updateSequence = (
    index: number,
    field: keyof Sequence,
    value: string | number
  ) => {
    const updated = [...sequences];
    updated[index] = { ...updated[index], [field]: value };
    setSequences(updated);
  };

  const handleGenerate = async () => {
    if (!characterImage) {
      toast.error("Please select a character");
      return;
    }

    const validSequences = sequences.filter(
      (s) => s.name.trim() && s.description.trim()
    );
    if (validSequences.length === 0) {
      toast.error(
        "Please add at least one sequence with name and description"
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/gen-sprite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterImage, sequences: validSequences }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult({ spriteGrid: data.spriteGrid, filename: data.filename });
      toast.success("Sprite sheet generated!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Generation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const totalFrames = sequences.reduce((sum, s) => sum + (s.frames || 0), 0);
  const validSequenceCount = sequences.filter(
    (s) => s.name.trim() && s.description.trim()
  ).length;

  return (
    <div className="grid lg:grid-cols-[1fr,480px] gap-6">
      {/* Left Panel - Controls */}
      <div className="space-y-5 stagger-children">
        {/* Character Selection */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-medium">Source Character</h3>
          </div>
          <AssetPicker
            folder="characters"
            value={characterUrl}
            onChange={(url, base64) => {
              setCharacterUrl(url);
              if (base64) setCharacterImage(base64);
            }}
          />
        </div>

        {/* Animation Sequences */}
        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent/50 flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              <h3 className="text-sm font-medium">Animation Sequences</h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={addSequence}
              className="h-7 px-2.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {sequences.map((seq, i) => (
              <div
                key={i}
                className="group relative bg-muted/30 rounded-xl p-4 border border-border/30 hover:border-border/60 transition-colors"
              >
                {/* Sequence number badge */}
                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-secondary border border-border text-[10px] font-medium flex items-center justify-center text-secondary-foreground">
                  {i + 1}
                </div>

                <div className="space-y-3">
                  {/* Name and frame count row */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
                        Animation Name
                      </label>
                      <Input
                        placeholder="e.g., idle, walk, attack"
                        value={seq.name}
                        onChange={(e) =>
                          updateSequence(i, "name", e.target.value)
                        }
                        className="h-9 bg-background/50 border-border/50 text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 flex items-center gap-1">
                        <Hash className="w-2.5 h-2.5" />
                        Frames
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={16}
                        value={seq.frames}
                        onChange={(e) =>
                          updateSequence(
                            i,
                            "frames",
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="h-9 bg-background/50 border-border/50 text-sm text-center"
                      />
                    </div>
                    {sequences.length > 1 && (
                      <button
                        onClick={() => removeSequence(i)}
                        className="self-end h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe the animation movement..."
                      value={seq.description}
                      onChange={(e) =>
                        updateSequence(i, "description", e.target.value)
                      }
                      rows={2}
                      className="resize-none bg-background/50 border-border/50 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Play className="w-3 h-3" />
                {validSequenceCount} sequence{validSequenceCount !== 1 && "s"}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                {totalFrames} total frames
              </span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading || !characterImage}
          size="lg"
          className={cn(
            "w-full h-12 font-medium shadow-sm transition-all",
            !loading &&
              characterImage &&
              "glow-primary-sm hover:glow-primary"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Sprite Sheet...
            </>
          ) : (
            <>
              <Layers className="w-4 h-4 mr-2" />
              Generate Sprite Sheet
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Right Panel - Output */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Sprite Sheet</h3>
            {result && (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Generated
              </span>
            )}
          </div>

          {result ? (
            <div className="animate-scale-in">
              <ImagePreview
                image={result.spriteGrid}
                filename={result.filename}
                saved={true}
              />
            </div>
          ) : (
            <div
              className={cn(
                "aspect-video rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground min-h-[300px]",
                loading && "border-primary/30"
              )}
            >
              {loading ? (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto pulse-glow">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Creating sprite sheet...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generating {totalFrames} frames across{" "}
                      {validSequenceCount} sequence
                      {validSequenceCount !== 1 && "s"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm">Sprite sheet will appear here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a character and define your animations
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
