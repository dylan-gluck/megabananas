import fs from "node:fs";
import path from "node:path";

/**
 * Ensures a directory exists, creating it recursively if necessary.
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Loads an image file as a base64 string.
 * @param filePath - Path relative to public directory
 */
export async function loadImageAsBase64(filePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), "public", filePath);
  const buffer = fs.readFileSync(fullPath);
  return buffer.toString("base64");
}

/**
 * Sanitizes a string for use as a filename.
 * Lowercases, replaces non-alphanumeric characters with dashes,
 * and removes leading/trailing dashes.
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Generates a timestamped filename.
 */
export function generateTimestampedFilename(
  prefix: string,
  extension = "png",
): string {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Saves a base64-encoded image to the filesystem.
 * @param base64Data - Base64-encoded image data (without data URL prefix)
 * @param directory - Full path to the target directory
 * @param filename - Name of the file to create
 * @returns The full path to the saved file
 */
export function saveBase64Image(
  base64Data: string,
  directory: string,
  filename: string,
): string {
  ensureDirectoryExists(directory);
  const fullPath = path.join(directory, filename);
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(fullPath, buffer);
  return fullPath;
}

/**
 * Saves a base64-encoded image to an asset path.
 * @param base64Data - Base64-encoded image data (without data URL prefix)
 * @param folder - Folder within public/assets (e.g., "characters", "projectId/frames")
 * @param prefix - Filename prefix
 * @returns The relative path for web access (e.g., "/assets/characters/char_123.png")
 */
export function saveImageToAssets(
  base64Data: string,
  folder: string,
  prefix: string,
): string {
  const filename = generateTimestampedFilename(prefix);
  const directory = path.join(process.cwd(), "public", "assets", folder);
  saveBase64Image(base64Data, directory, filename);
  return `/assets/${folder}/${filename}`;
}

/**
 * Gets the full filesystem path for an asset.
 * @param assetPath - Web-accessible path (e.g., "/assets/characters/char_123.png")
 */
export function getAssetFullPath(assetPath: string): string {
  // Remove leading slash if present
  const relativePath = assetPath.startsWith("/")
    ? assetPath.slice(1)
    : assetPath;
  return path.join(process.cwd(), "public", relativePath);
}
