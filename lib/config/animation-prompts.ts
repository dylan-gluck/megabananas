import { characterPresets } from "./character-presets";

export interface BuildFramePromptParams {
  sequencePrompt: string;
  frameIndex: number;
  totalFrames: number;
  perFrameInstruction?: string;
  characterName: string;
  animationName: string;
  anglePreset?: string;
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
  } = params;

  const positionContext = getPositionContext(frameIndex, totalFrames);
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

  lines.push(
    "",
    positionContext,
    "",
    "Requirements:",
    "- Maintain exact character appearance, style, and proportions from the reference character image",
    "- Ensure smooth visual continuity with previous frame(s) shown in references",
    "- Keep consistent lighting, color palette, and art style throughout",
  );

  if (perFrameInstruction) {
    lines.push(
      "",
      `Specific instruction for this frame: ${perFrameInstruction}`,
    );
  }

  return lines.join("\n");
}

function getPositionContext(frameIndex: number, totalFrames: number): string {
  if (frameIndex === 0) {
    return "This is the FIRST frame - establish the starting pose of the animation sequence.";
  }
  if (frameIndex === totalFrames - 1) {
    return "This is the FINAL frame - complete the animation sequence, returning to or near the starting position for looping.";
  }
  const progress = Math.round(((frameIndex + 1) / totalFrames) * 100);
  return `This is frame ${frameIndex + 1} of ${totalFrames} (${progress}% through the sequence) - continue the motion smoothly from the previous frame.`;
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
