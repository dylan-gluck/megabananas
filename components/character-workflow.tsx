"use client";

import {
  Loader2,
  Pencil,
  Sparkles,
  Wand2,
  ArrowRight,
  ImagePlus,
  Maximize2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AssetPicker } from "./asset-picker";
import { ImagePreview } from "./image-preview";
import { ImageUpload } from "./image-upload";
import { cn } from "@/lib/utils";

type Mode = "generate" | "edit";

export function CharacterWorkflow() {
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [sourceImage, setSourceImage] = useState<string>("");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    image: string;
    filename: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/gen-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, referenceImages, aspectRatio }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult({ image: data.image, filename: data.filename });
      toast.success("Character generated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!sourceImage) {
      toast.error("Please select a character to edit");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please enter edit instructions");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/edit-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImage,
          prompt,
          referenceImages,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult({ image: data.image, filename: data.filename });
      toast.success("Character edited!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Edit failed");
    } finally {
      setLoading(false);
    }
  };

  const useResultAsSource = () => {
    if (result) {
      setSourceImage(`data:image/png;base64,${result.image}`);
      setSourceUrl("");
      setMode("edit");
      setResult(null);
      setPrompt("");
      toast.success("Loaded as source for editing");
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr,400px] gap-6">
      {/* Left Panel - Controls */}
      <div className="space-y-5 stagger-children">
        {/* Mode Toggle */}
        <div className="panel p-1 inline-flex gap-1">
          <button
            onClick={() => setMode("generate")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "generate"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "edit"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        </div>

        {/* Edit Source Selection */}
        {mode === "edit" && (
          <div className="panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-accent/50 flex items-center justify-center">
                  <ImagePlus className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
                <h3 className="text-sm font-medium">Source Character</h3>
              </div>
            </div>
            <AssetPicker
              folder="characters"
              value={sourceUrl}
              onChange={(url, base64) => {
                setSourceUrl(url);
                if (base64) setSourceImage(base64);
              }}
            />
            {sourceImage && !sourceUrl && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Current source:
                </p>
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/50 checkerboard">
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt Section */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
              <Wand2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-medium">
              {mode === "generate" ? "Prompt" : "Edit Instructions"}
            </h3>
          </div>
          <Textarea
            placeholder={
              mode === "generate"
                ? "Describe your character... e.g., 'A brave knight with silver armor and a red cape, pixel art style'"
                : "Describe the changes... e.g., 'Add a wizard hat and change armor to purple'"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none bg-muted/30 border-border/50 focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Reference Images */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                <ImagePlus className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">Reference Images</h3>
            </div>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <ImageUpload value={referenceImages} onChange={setReferenceImages} />
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="w-28 bg-muted/30 border-border/50">
              <Maximize2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="4:3">4:3</SelectItem>
              <SelectItem value="3:4">3:4</SelectItem>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={mode === "generate" ? handleGenerate : handleEdit}
            disabled={loading}
            size="lg"
            className="flex-1 h-11 font-medium shadow-sm glow-primary-sm hover:glow-primary transition-shadow"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "generate" ? "Generating..." : "Editing..."}
              </>
            ) : (
              <>
                {mode === "generate" ? (
                  <Sparkles className="w-4 h-4 mr-2" />
                ) : (
                  <Pencil className="w-4 h-4 mr-2" />
                )}
                {mode === "generate" ? "Generate Character" : "Apply Edit"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Panel - Output */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Output</h3>
            {result && (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Generated
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4 animate-scale-in">
              <ImagePreview
                image={result.image}
                filename={result.filename}
                saved={true}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={useResultAsSource}
                className="w-full"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Continue Editing
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground",
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
                      Creating your character...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take a moment
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm">Your character will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
