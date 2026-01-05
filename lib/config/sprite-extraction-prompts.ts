import { characterPresets } from "./character-presets";

export interface BuildExtractionPromptParams {
  frameIndex: number;
  totalFrames: number;
  characterName: string;
  animationName: string;
  anglePreset?: string;
  /** Reference mode: sprite (frame 0) or dual (frames 1+) */
  referenceMode: "sprite" | "dual";
  gridInfo: {
    cols: number;
    rows: number;
  };
}

export function buildExtractionPrompt(
  params: BuildExtractionPromptParams,
): string {
  const {
    frameIndex,
    totalFrames,
    characterName,
    animationName,
    anglePreset,
    referenceMode,
    gridInfo,
  } = params;

  const angleOption = characterPresets.angles.find(
    (o) => o.value === anglePreset,
  );
  const angleFragment = angleOption?.promptFragment || "";

  // Calculate grid position (left-to-right, top-to-bottom)
  const col = frameIndex % gridInfo.cols;
  const row = Math.floor(frameIndex / gridInfo.cols);

  const lines = [
    `EXTRACT frame ${frameIndex + 1} of ${totalFrames} from the provided spritesheet.`,
    "",
    `Character: ${characterName}`,
    `Animation: ${animationName}`,
  ];

  if (angleFragment) {
    lines.push(`View angle: ${angleFragment}`);
  }

  lines.push("");
  lines.push(
    `Spritesheet grid: ${gridInfo.cols} columns × ${gridInfo.rows} rows`,
    `Target cell: column ${col + 1}, row ${row + 1} (0-indexed: col ${col}, row ${row})`,
    "",
  );

  if (referenceMode === "sprite") {
    // Frame 0: spritesheet only
    lines.push(
      "The reference image is a SPRITESHEET containing multiple animation frames arranged in a grid.",
      "",
      "Instructions:",
      "- ISOLATE the frame at the specified grid position",
      "- Extract ONLY that single character pose from the spritesheet",
      "- Center the character in the output image",
      "- Maintain the exact visual style, proportions, and colors",
      "- Output a clean, single-frame image with transparent or matching background",
      "",
      "This is the FIRST frame - establish consistent positioning for subsequent extractions.",
    );
  } else {
    // Frames 1+: spritesheet + previous frame
    lines.push(
      "Two reference images are provided:",
      "1. SPRITESHEET (first image) - the source containing all frames in a grid",
      "2. PREVIOUS EXTRACTED FRAME (second image) - use for position/scale reference",
      "",
      "Instructions:",
      "- ISOLATE the frame at the specified grid position from the spritesheet",
      "- Extract ONLY that single character pose",
      "- Match the EXACT center position and scale of the previous extracted frame",
      "- Maintain identical visual style, proportions, and colors",
      "- Output a clean, single-frame image with matching background style",
      "",
      getExtractionProgressContext(frameIndex, totalFrames),
    );
  }

  lines.push(
    "",
    "CRITICAL: This is an EXTRACTION task, not generation. Copy the exact frame from the spritesheet.",
    "The character should be centered and occupy the same relative position as the previous frame.",
  );

  return lines.join("\n");
}

function getExtractionProgressContext(
  frameIndex: number,
  totalFrames: number,
): string {
  const progress = Math.round(((frameIndex + 1) / totalFrames) * 100);
  const isFinal = frameIndex === totalFrames - 1;

  if (isFinal) {
    return `This is the FINAL frame (${totalFrames} of ${totalFrames}).`;
  }
  return `Frame ${frameIndex + 1} of ${totalFrames} (${progress}% through extraction).`;
}
