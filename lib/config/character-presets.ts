export type PresetOption = {
  value: string;
  label: string;
  promptFragment: string;
};

export type CharacterPresets = {
  backgroundColors: PresetOption[];
  styles: PresetOption[];
  angles: PresetOption[];
};

export const characterPresets: CharacterPresets = {
  backgroundColors: [
    {
      value: "white",
      label: "White",
      promptFragment: "solid white background (#FFFFFF)",
    },
    {
      value: "black",
      label: "Black",
      promptFragment: "solid black background (#000000)",
    },
    {
      value: "gray",
      label: "Gray",
      promptFragment: "neutral gray background (#808080)",
    },
    {
      value: "green-screen",
      label: "Green Screen",
      promptFragment: "bright green chroma key background (#00FF00)",
    },
  ],
  styles: [
    {
      value: "pixel-art",
      label: "Pixel Art",
      promptFragment:
        "pixel art style, 16-bit aesthetic, crisp edges, limited color palette",
    },
    {
      value: "anime",
      label: "Anime",
      promptFragment:
        "anime style, clean linework, expressive features, cel-shaded",
    },
    {
      value: "cartoon",
      label: "Cartoon",
      promptFragment:
        "cartoon style, bold outlines, exaggerated proportions, vibrant colors",
    },
    {
      value: "realistic",
      label: "Realistic",
      promptFragment:
        "realistic style, detailed rendering, natural proportions, subtle shading",
    },
    {
      value: "chibi",
      label: "Chibi",
      promptFragment:
        "chibi style, super-deformed, large head, small body, cute aesthetic",
    },
    {
      value: "flat",
      label: "Flat Design",
      promptFragment:
        "flat design style, minimal shading, solid colors, vector-like appearance",
    },
    {
      value: "3d-render",
      label: "3D Render",
      promptFragment:
        "3D rendered style, Cinema 4D aesthetic, soft lighting, smooth subsurface scattering, octane render quality",
    },
  ],
  angles: [
    {
      value: "front",
      label: "Front View",
      promptFragment: "front-facing view, looking directly at viewer",
    },
    {
      value: "3/4",
      label: "3/4 View",
      promptFragment: "three-quarter view angle, slight turn to the side",
    },
    {
      value: "side",
      label: "Side Profile",
      promptFragment: "side profile view, full silhouette visible",
    },
    {
      value: "back",
      label: "Back View",
      promptFragment: "back view, facing away from viewer",
    },
    {
      value: "dynamic",
      label: "Dynamic Pose",
      promptFragment: "dynamic action pose, expressive movement",
    },
    {
      value: "t-pose",
      label: "T-Pose",
      promptFragment: "T-pose stance, arms extended horizontally, neutral rigging pose",
    },
  ],
};

export function buildSystemPrompt(
  background: string,
  style: string,
  angle: string,
): string {
  const bgOption = characterPresets.backgroundColors.find(
    (o) => o.value === background,
  );
  const styleOption = characterPresets.styles.find((o) => o.value === style);
  const angleOption = characterPresets.angles.find((o) => o.value === angle);

  const fragments = [
    bgOption?.promptFragment,
    styleOption?.promptFragment,
    angleOption?.promptFragment,
  ].filter(Boolean);

  return `Generate a character image with the following specifications: ${fragments.join(", ")}.`;
}
