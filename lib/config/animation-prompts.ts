import { characterPresets } from "./character-presets";

export interface BuildFramePromptParams {
  sequencePrompt: string;
  frameIndex: number;
  totalFrames: number;
  perFrameInstruction?: string;
  characterName: string;
  animationName: string;
  anglePreset?: string;
  /** Reference mode: character (frame 0), previous (frames 1-3), dual (frames 4+) */
  referenceMode?: "character" | "previous" | "dual";
}

export function buildFramePrompt(params: BuildFramePromptParams): string {
  const {
    sequencePrompt,
    frameIndex,
    totalFrames,
    perFrameInstruction,
    characterName,
    animationName,
    anglePreset,
    referenceMode = frameIndex === 0 ? "character" : "previous",
  } = params;

  const angleOption = characterPresets.angles.find(
    (o) => o.value === anglePreset,
  );
  const angleFragment = angleOption?.promptFragment || "";

  const lines = [
    `Generate frame ${frameIndex + 1} of ${totalFrames} for a "${animationName}" animation sequence.`,
    "",
    `Character: ${characterName}`,
    `Animation: ${sequencePrompt}`,
  ];

  if (angleFragment) {
    lines.push(`View angle: ${angleFragment}`);
  }

  lines.push("");

  // Reference context based on what images are provided
  if (referenceMode === "character") {
    // Frame 0: only character reference
    lines.push(
      "The reference image shows the character. Use it to establish:",
      "- Exact visual style, proportions, and rendering",
      "- Color palette and character details",
      "",
      "This is the FIRST frame - create the starting pose for the animation.",
      "The pose should naturally lead into the subsequent motion.",
    );
  } else if (referenceMode === "dual") {
    // Frames 4+: character + previous frame
    lines.push(
      "Two reference images are provided:",
      "1. CHARACTER reference (first image) - match this exact style and appearance",
      "2. PREVIOUS FRAME (second image) - continue the motion from this pose",
      "",
      getMotionProgressContext(frameIndex, totalFrames),
      "",
      "Requirements:",
      "- Match character style/colors from the character reference",
      "- ADVANCE the motion from the previous frame's pose",
      "- Keep consistent lighting and art style",
    );
  } else {
    // Frames 1-3: only previous frame
    lines.push(
      "The reference image shows the PREVIOUS frame in this sequence.",
      "",
      getMotionProgressContext(frameIndex, totalFrames),
      "",
      "Requirements:",
      "- Match the exact visual style from the reference",
      "- ADVANCE the motion - show the next phase of movement",
      "- Keep consistent lighting, proportions, and colors",
    );
  }

  if (perFrameInstruction) {
    lines.push(
      "",
      `Specific instruction for this frame: ${perFrameInstruction}`,
    );
  }

  return lines.join("\n");
}

function getMotionProgressContext(
  frameIndex: number,
  totalFrames: number,
): string {
  const progress = Math.round(((frameIndex + 1) / totalFrames) * 100);
  const isFinal = frameIndex === totalFrames - 1;

  if (isFinal) {
    return "This is the FINAL frame - complete the motion, returning toward the starting pose for seamless looping.";
  }
  return `Frame ${frameIndex + 1} of ${totalFrames} (${progress}% through) - progress the motion naturally.`;
}

export function buildSystemPromptForAnimation(
  stylePreset?: string,
  backgroundPreset?: string,
): string {
  const parts = [
    "Generate a single animation frame image.",
    "The image should show the character in the exact pose described.",
    "Match the style and appearance of the reference character exactly.",
  ];

  if (stylePreset) {
    parts.push(`Style: ${stylePreset}`);
  }
  if (backgroundPreset) {
    parts.push(`Background: ${backgroundPreset}`);
  }

  return parts.join(" ");
}
