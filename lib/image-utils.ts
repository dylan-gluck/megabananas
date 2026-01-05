import ImageMagick from "magickwand.js";

let magickInstance: Awaited<typeof ImageMagick> | null = null;

async function getMagick() {
  if (!magickInstance) {
    magickInstance = await ImageMagick;
  }
  return magickInstance;
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.length; i++) {
    view[i] = buffer[i];
  }
  return ab;
}

export interface RemoveBackgroundOptions {
  fuzzPercent?: number; // Color tolerance (default: 10)
  cornerX?: number; // X coord for bg color sample (default: 0)
  cornerY?: number; // Y coord for bg color sample (default: 0)
}

/**
 * Remove background from an image using floodfill from corner.
 * Works best on solid/uniform backgrounds.
 */
export async function removeBackground(
  inputBuffer: Buffer,
  options: RemoveBackgroundOptions = {},
): Promise<Buffer> {
  const { Magick } = await getMagick();
  const { fuzzPercent = 10, cornerX = 0, cornerY = 0 } = options;

  const blob = new Magick.Blob(bufferToArrayBuffer(inputBuffer));
  const img = new Magick.Image();
  await img.readAsync(blob);

  // Enable alpha channel
  img.alpha(true);

  // Set fuzz tolerance - colorFuzz uses absolute values (0-65535 for 16-bit)
  // 65535 is max quantum, so fuzzPercent * 655.35 gives us percentage
  img.colorFuzz(fuzzPercent * 655.35);

  // Floodfill from corner - replace background color with transparent
  const transparent = new Magick.Color("transparent");
  const point = new Magick.Geometry(`+${cornerX}+${cornerY}`);
  await img.floodFillColorAsync(point, transparent);

  // Write to PNG (preserves transparency)
  await img.magickAsync("PNG");

  const outputBlob = new Magick.Blob();
  await img.writeAsync(outputBlob);

  return Buffer.from(await outputBlob.dataAsync());
}

export interface SplitSpritesheetOptions {
  cols: number;
  rows: number;
}

/**
 * Split a spritesheet into individual frame images.
 * Returns array of buffers in left-to-right, top-to-bottom order.
 */
export async function splitSpritesheet(
  inputBuffer: Buffer,
  options: SplitSpritesheetOptions,
): Promise<Buffer[]> {
  const { Magick } = await getMagick();
  const { cols, rows } = options;

  const blob = new Magick.Blob(bufferToArrayBuffer(inputBuffer));
  const img = new Magick.Image();
  await img.readAsync(blob);

  const size = img.size();
  const width = size.width();
  const height = size.height();

  const tileW = Math.floor(width / cols);
  const tileH = Math.floor(height / rows);

  const frames: Buffer[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Clone the source image for each frame
      const frame = new Magick.Image(img);

      // Crop to tile region: WxH+X+Y
      const geometry = `${tileW}x${tileH}+${col * tileW}+${row * tileH}`;
      frame.crop(geometry);

      // Reset virtual canvas (equivalent to +repage)
      frame.repage();

      // Ensure PNG output for transparency
      await frame.magickAsync("PNG");

      const frameBlob = new Magick.Blob();
      await frame.writeAsync(frameBlob);

      frames.push(Buffer.from(await frameBlob.dataAsync()));
    }
  }

  return frames;
}

/**
 * Get image dimensions from a buffer
 */
export async function getImageDimensions(
  inputBuffer: Buffer,
): Promise<{ width: number; height: number }> {
  const { Magick } = await getMagick();

  const blob = new Magick.Blob(bufferToArrayBuffer(inputBuffer));
  const img = new Magick.Image();
  await img.readAsync(blob);

  const size = img.size();
  return { width: size.width(), height: size.height() };
}
