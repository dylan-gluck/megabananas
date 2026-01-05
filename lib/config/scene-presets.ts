export type PresetOption = {
  value: string;
  label: string;
  promptFragment: string;
};

export type ScenePresets = {
  styles: PresetOption[];
  moods: PresetOption[];
  timeOfDay: PresetOption[];
  environments: PresetOption[];
};

export const scenePresets: ScenePresets = {
  styles: [
    {
      value: "pixel-art",
      label: "Pixel Art",
      promptFragment: "pixel art style, 16-bit aesthetic, limited color palette",
    },
    {
      value: "anime",
      label: "Anime",
      promptFragment: "anime style background, cel-shaded, detailed scenery",
    },
    {
      value: "cartoon",
      label: "Cartoon",
      promptFragment: "cartoon style, bold colors, simplified shapes",
    },
    {
      value: "realistic",
      label: "Realistic",
      promptFragment: "realistic style, detailed rendering, natural lighting",
    },
    {
      value: "watercolor",
      label: "Watercolor",
      promptFragment: "watercolor painting style, soft edges, flowing colors",
    },
    {
      value: "flat",
      label: "Flat Design",
      promptFragment: "flat design style, minimal shading, solid colors, vector-like",
    },
    {
      value: "painterly",
      label: "Painterly",
      promptFragment: "painterly style, visible brushstrokes, artistic interpretation",
    },
  ],
  moods: [
    {
      value: "peaceful",
      label: "Peaceful",
      promptFragment: "peaceful atmosphere, calm, serene environment",
    },
    {
      value: "mysterious",
      label: "Mysterious",
      promptFragment: "mysterious atmosphere, fog, shadows, intrigue",
    },
    {
      value: "dramatic",
      label: "Dramatic",
      promptFragment: "dramatic atmosphere, intense lighting, high contrast",
    },
    {
      value: "whimsical",
      label: "Whimsical",
      promptFragment: "whimsical atmosphere, playful, fantastical elements",
    },
    {
      value: "dark",
      label: "Dark",
      promptFragment: "dark atmosphere, ominous, moody shadows",
    },
    {
      value: "cheerful",
      label: "Cheerful",
      promptFragment: "cheerful atmosphere, bright colors, uplifting",
    },
    {
      value: "epic",
      label: "Epic",
      promptFragment: "epic atmosphere, grand scale, awe-inspiring",
    },
  ],
  timeOfDay: [
    {
      value: "dawn",
      label: "Dawn",
      promptFragment: "dawn lighting, soft pink and orange sky, early morning",
    },
    {
      value: "morning",
      label: "Morning",
      promptFragment: "morning light, bright daylight, fresh atmosphere",
    },
    {
      value: "noon",
      label: "Noon",
      promptFragment: "midday sun, harsh shadows, bright illumination",
    },
    {
      value: "afternoon",
      label: "Afternoon",
      promptFragment: "afternoon light, warm golden tones, long shadows",
    },
    {
      value: "dusk",
      label: "Dusk",
      promptFragment: "dusk lighting, orange and purple sky, sunset colors",
    },
    {
      value: "night",
      label: "Night",
      promptFragment: "night scene, moonlight, stars, dark blue tones",
    },
    {
      value: "stormy",
      label: "Stormy",
      promptFragment: "stormy weather, dark clouds, dramatic lighting",
    },
  ],
  environments: [
    {
      value: "forest",
      label: "Forest",
      promptFragment: "forest environment, trees, foliage, natural setting",
    },
    {
      value: "castle",
      label: "Castle",
      promptFragment: "castle interior or exterior, medieval architecture, stone walls",
    },
    {
      value: "village",
      label: "Village",
      promptFragment: "village setting, small buildings, rustic atmosphere",
    },
    {
      value: "dungeon",
      label: "Dungeon",
      promptFragment: "dungeon environment, dark corridors, torchlight",
    },
    {
      value: "mountain",
      label: "Mountain",
      promptFragment: "mountain landscape, peaks, rocky terrain, scenic views",
    },
    {
      value: "beach",
      label: "Beach",
      promptFragment: "beach scene, ocean, sand, coastal atmosphere",
    },
    {
      value: "city",
      label: "City",
      promptFragment: "city environment, buildings, urban landscape",
    },
    {
      value: "cave",
      label: "Cave",
      promptFragment: "cave interior, rock formations, dim lighting",
    },
    {
      value: "space",
      label: "Space",
      promptFragment: "space environment, stars, planets, cosmic setting",
    },
    {
      value: "underwater",
      label: "Underwater",
      promptFragment: "underwater scene, ocean floor, aquatic life",
    },
  ],
};

export function buildSceneSystemPrompt(selections: {
  style?: string;
  mood?: string;
  timeOfDay?: string;
  environment?: string;
}): string {
  const styleOption = scenePresets.styles.find(
    (o) => o.value === selections.style
  );
  const moodOption = scenePresets.moods.find(
    (o) => o.value === selections.mood
  );
  const timeOption = scenePresets.timeOfDay.find(
    (o) => o.value === selections.timeOfDay
  );
  const envOption = scenePresets.environments.find(
    (o) => o.value === selections.environment
  );

  const fragments = [
    styleOption?.promptFragment,
    moodOption?.promptFragment,
    timeOption?.promptFragment,
    envOption?.promptFragment,
  ].filter(Boolean);

  return `Generate a background scene image with the following specifications: ${fragments.join(", ")}.`;
}
