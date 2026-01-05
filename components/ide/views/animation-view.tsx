"use client";

import { useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Film,
  Play,
  Pause,
  Plus,
  Download,
  Calendar,
  Loader2,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  useAppStore,
  type AnimationWithFrames,
  type AnimationGenerationSettings,
  type FrameWithAsset,
  type Character,
  type Project,
  type Asset,
} from "@/lib/store";
import { AssetThumbnail } from "@/components/ui/asset-thumbnail";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AnimationWithDetails extends Omit<AnimationWithFrames, "generationSettings"> {
  project: Project;
  character: Character & { primaryAsset: Asset | null; assets: Asset[] };
  generationSettings: AnimationGenerationSettings | null;
}

interface AnimationViewProps {
  animationId: string;
}

type GenerationStatus = "idle" | "generating" | "complete" | "failed";
type FrameStatus = "pending" | "generating" | "complete" | "failed";

interface GeneratingFrame {
  index: number;
  status: FrameStatus;
  filePath?: string;
  error?: string;
}

type SSEEvent =
  | { type: "start"; totalFrames: number }
  | { type: "frame_start"; index: number }
  | { type: "frame_complete"; index: number; assetId: string; filePath: string }
  | { type: "frame_error"; index: number; error: string }
  | { type: "complete"; totalGenerated: number }
  | { type: "error"; message: string };

export function AnimationView({ animationId }: AnimationViewProps) {
  const { openTab, setActionContext, refreshCurrentProject } = useAppStore();
  const [animation, setAnimation] = useState<AnimationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [fps, setFps] = useState(8);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generation state
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [generatingFrames, setGeneratingFrames] = useState<GeneratingFrame[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const generationStartedRef = useRef(false);

  useEffect(() => {
    fetchAnimation();
  }, [animationId]);

  // Auto-start generation when animation loads with no frames (only for non-spritesheet sources)
  useEffect(() => {
    if (
      animation &&
      animation.frames.length === 0 &&
      animation.generationSettings &&
      animation.generationSettings.sourceType !== "spritesheet" &&
      !generationStartedRef.current &&
      generationStatus === "idle"
    ) {
      generationStartedRef.current = true;
      startGeneration();
    }
  }, [animation]);

  // Poll for frame updates when spritesheet extraction is running externally
  useEffect(() => {
    if (
      animation?.generationSettings?.sourceType === "spritesheet" &&
      animation.frames.length < (animation.frameCount || 4)
    ) {
      const pollInterval = setInterval(async () => {
        await fetchAnimation();
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [animation?.id, animation?.frames.length, animation?.frameCount]);

  useEffect(() => {
    if (isPlaying && animation && animation.frames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % animation.frames.length);
      }, 1000 / fps);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, fps, animation?.frames.length]);

  const fetchAnimation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/animations/${animationId}`);
      if (res.ok) {
        const data = await res.json();
        setAnimation(data);
      }
    } catch (error) {
      console.error("Failed to fetch animation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSEEvent = (event: SSEEvent) => {
    switch (event.type) {
      case "start":
        setGeneratingFrames(
          Array.from({ length: event.totalFrames }, (_, i) => ({
            index: i,
            status: "pending" as FrameStatus,
          }))
        );
        break;
      case "frame_start":
        setGeneratingFrames((prev) =>
          prev.map((f) =>
            f.index === event.index ? { ...f, status: "generating" } : f
          )
        );
        break;
      case "frame_complete":
        setGeneratingFrames((prev) =>
          prev.map((f) =>
            f.index === event.index
              ? { ...f, status: "complete", filePath: event.filePath }
              : f
          )
        );
        break;
      case "frame_error":
        setGeneratingFrames((prev) =>
          prev.map((f) =>
            f.index === event.index
              ? { ...f, status: "failed", error: event.error }
              : f
          )
        );
        break;
    }
  };

  const startGeneration = async () => {
    if (!animation?.generationSettings) return;

    setGenerationStatus("generating");
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Determine endpoint and payload based on source type
      const isSpritesheetSource = animation.generationSettings.sourceType === "spritesheet";
      const endpoint = isSpritesheetSource
        ? "/api/extract-frames-from-sprite"
        : "/api/gen-animation";

      const payload = isSpritesheetSource
        ? {
            animationId: animation.id,
            spriteSheetId: animation.generationSettings.spriteSheetId,
          }
        : {
            animationId: animation.id,
            characterAssetId: animation.generationSettings.characterAssetId,
            sequencePrompt: animation.description || "",
            frameCount: animation.frameCount,
            anglePreset: animation.generationSettings.anglePreset,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start generation");
      }

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
              const event = JSON.parse(line.slice(6)) as SSEEvent;
              handleSSEEvent(event);

              if (event.type === "complete") {
                setGenerationStatus("complete");
                toast.success(`Generated ${event.totalGenerated} frames`);
                await fetchAnimation();
                await refreshCurrentProject();
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (parseErr) {
              console.warn("Failed to parse SSE event:", parseErr);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.info("Generation cancelled");
      } else {
        setGenerationStatus("failed");
        toast.error(err instanceof Error ? err.message : "Generation failed");
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setGenerationStatus("idle");
    }
  };

  const togglePlayback = () => {
    setIsPlaying((prev) => !prev);
  };

  const goToFrame = (index: number) => {
    setIsPlaying(false);
    setCurrentFrame(index);
  };

  const prevFrame = () => {
    if (animation) {
      setIsPlaying(false);
      setCurrentFrame(
        (prev) => (prev - 1 + animation.frames.length) % animation.frames.length
      );
    }
  };

  const nextFrame = () => {
    if (animation) {
      setIsPlaying(false);
      setCurrentFrame((prev) => (prev + 1) % animation.frames.length);
    }
  };

  const handleDeleteFrame = async (frameId: string) => {
    try {
      const res = await fetch(`/api/frames/${frameId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Frame deleted");
        await fetchAnimation();
        if (animation && currentFrame >= animation.frames.length - 1) {
          setCurrentFrame(Math.max(0, animation.frames.length - 2));
        }
      } else {
        toast.error("Failed to delete frame");
      }
    } catch {
      toast.error("Failed to delete frame");
    }
  };

  const handleDeleteAnimation = async () => {
    if (!animation) return;
    try {
      const res = await fetch(`/api/animations/${animation.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Animation deleted");
        await refreshCurrentProject();
        // Close the current tab
        openTab("character", animation.character.id, animation.character.name);
      } else {
        toast.error("Failed to delete animation");
      }
    } catch {
      toast.error("Failed to delete animation");
    }
  };

  const handleDownloadFrames = async () => {
    if (!animation || animation.frames.length === 0) return;

    for (const frame of animation.frames) {
      const link = document.createElement("a");
      link.href = frame.asset.filePath;
      link.download = frame.asset.filePath.split("/").pop() || `frame-${frame.frameIndex}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Small delay between downloads to avoid browser blocking
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    toast.success(`Downloaded ${animation.frames.length} frames`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !animation || active.id === over.id) return;

    const oldIndex = animation.frames.findIndex((f) => f.id === active.id);
    const newIndex = animation.frames.findIndex((f) => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update local state
    const newFrames = arrayMove(animation.frames, oldIndex, newIndex);
    setAnimation({ ...animation, frames: newFrames });

    // Adjust currentFrame if needed
    if (currentFrame === oldIndex) {
      setCurrentFrame(newIndex);
    } else if (oldIndex < currentFrame && newIndex >= currentFrame) {
      setCurrentFrame(currentFrame - 1);
    } else if (oldIndex > currentFrame && newIndex <= currentFrame) {
      setCurrentFrame(currentFrame + 1);
    }

    // Persist to server
    try {
      const res = await fetch(`/api/animations/${animation.id}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameIds: newFrames.map((f) => f.id) }),
      });
      if (!res.ok) {
        throw new Error("Failed to reorder");
      }
    } catch {
      // Revert on error
      toast.error("Failed to reorder frames");
      await fetchAnimation();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!animation) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Animation not found</p>
      </div>
    );
  }

  const currentFrameData = animation.frames[currentFrame];
  const hasFrames = animation.frames.length > 0;
  const isGenerating = generationStatus === "generating";

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              {animation.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              <button
                type="button"
                className="hover:underline"
                onClick={() =>
                  openTab(
                    "character",
                    animation.character.id,
                    animation.character.name
                  )
                }
              >
                {animation.character.name}
              </button>
              {" · "}
              {animation.project.name}
            </p>
            {animation.description && (
              <p className="text-sm text-muted-foreground">
                {animation.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created{" "}
                {formatDistanceToNow(new Date(animation.createdAt), {
                  addSuffix: true,
                })}
              </span>
              <span>{animation.frames.length} frames</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setActionContext({
                  type: "new-frame",
                  animation: animation,
                })
              }
              disabled={isGenerating}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Frame
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFrames}
              disabled={isGenerating || !hasFrames}
            >
              <Download className="h-4 w-4 mr-1" />
              Download Frames
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAnimation}
              disabled={isGenerating}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <section className="space-y-4">
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    Generating frames...
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={cancelGeneration}>
                  Cancel
                </Button>
              </div>

              {/* Progress grid */}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {generatingFrames.map((frame) => (
                  <div
                    key={frame.index}
                    className={cn(
                      "aspect-square rounded-md border overflow-hidden relative",
                      frame.status === "pending" && "bg-muted border-border",
                      frame.status === "generating" &&
                        "bg-muted border-primary animate-pulse",
                      frame.status === "complete" && "border-green-500/50",
                      frame.status === "failed" &&
                        "bg-destructive/10 border-destructive/50"
                    )}
                  >
                    {frame.status === "complete" && frame.filePath ? (
                      <img
                        src={frame.filePath}
                        alt={`Frame ${frame.index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {frame.status === "pending" && (
                          <span className="text-xs text-muted-foreground">
                            {frame.index + 1}
                          </span>
                        )}
                        {frame.status === "generating" && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {frame.status === "failed" && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                    {frame.status === "complete" && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-400" />
                          <span className="text-[10px] text-white">
                            {frame.index + 1}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Generation Failed */}
        {generationStatus === "failed" && !hasFrames && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Generation failed</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                generationStartedRef.current = false;
                setGenerationStatus("idle");
                startGeneration();
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Preview Player */}
        {(hasFrames || generationStatus === "complete") && (
          <section className="space-y-4">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Preview Area */}
              <div className="aspect-square max-w-md mx-auto bg-muted/50 relative">
                {hasFrames && currentFrameData ? (
                  <img
                    src={currentFrameData.asset.filePath}
                    alt={`Frame ${currentFrame + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Film className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No frames generated
                      </p>
                    </div>
                  </div>
                )}

                {/* Frame counter */}
                {hasFrames && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {currentFrame + 1} / {animation.frames.length}
                  </div>
                )}
              </div>

              {/* Playback Controls */}
              {hasFrames && (
                <div className="p-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevFrame}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextFrame}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentFrame(0);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 max-w-xs mx-auto">
                    <span className="text-xs text-muted-foreground w-8">
                      {fps} fps
                    </span>
                    <Slider
                      value={[fps]}
                      onValueChange={([value]) => setFps(value)}
                      min={1}
                      max={24}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Frame Timeline */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Frames</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setActionContext({
                  type: "new-frame",
                  animation: animation,
                })
              }
              disabled={isGenerating}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Frame
            </Button>
          </div>

          {!hasFrames && !isGenerating ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Film className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                No frames yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add frames to this animation sequence
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setActionContext({
                    type: "new-frame",
                    animation: animation,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Frame
              </Button>
            </div>
          ) : hasFrames ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={animation.frames.map((f) => f.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {animation.frames.map((frame, index) => (
                    <SortableFrame
                      key={frame.id}
                      frame={frame}
                      index={index}
                      isActive={index === currentFrame}
                      onDelete={() => handleDeleteFrame(frame.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : null}
        </section>
      </div>
    </ScrollArea>
  );
}

interface SortableFrameProps {
  frame: FrameWithAsset;
  index: number;
  isActive: boolean;
  onDelete: () => void;
}

function SortableFrame({ frame, index, isActive, onDelete }: SortableFrameProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: frame.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/frame">
      <AssetThumbnail
        asset={frame.asset}
        onDelete={onDelete}
        className={cn(isActive && "ring-2 ring-primary")}
      />
      {/* Frame index overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 pointer-events-none rounded-b-lg">
        <span className="text-[10px] text-white font-medium">{index + 1}</span>
      </div>
      {/* Drag handle + delete - higher z-index to stay above thumbnail hover */}
      <div
        className={cn(
          "absolute top-1 left-1 z-20 flex gap-0.5 transition-opacity",
          isDragging ? "opacity-100" : "opacity-0 group-hover/frame:opacity-100"
        )}
      >
        <div
          {...attributes}
          {...listeners}
          className="p-1 rounded bg-black/60 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3 text-white" />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded bg-black/60 hover:bg-red-600 transition-colors"
        >
          <Trash2 className="h-3 w-3 text-white" />
        </button>
      </div>
    </div>
  );
}
