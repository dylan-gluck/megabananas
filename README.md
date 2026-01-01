# NanoBanana Sprite Studio

Internal tool for generating and editing character images and sprite sheets using Gemini image models.

![Screenshot of v0](screenshot.png)

## Setup

1. Install dependencies:
```bash
bun install
```

2. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_key_here
```

3. Start the development server:
```bash
bun dev
```

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- @google/genai (Gemini API)

## Project Structure

```
app/
  api/
    gen-character/    POST: generate character from prompt + references
    edit-character/   POST: edit existing character with prompt
    gen-sprite/       POST: generate sprite sheet from character
    assets/           GET: list saved assets by folder
components/
  character-workflow.tsx
  sprite-workflow.tsx
  image-upload.tsx
  asset-picker.tsx
  image-preview.tsx
lib/
  gemini.ts           Gemini client and helpers
public/
  assets/
    characters/       Saved character images
    sprites/          Saved sprite sheets
    reference/        Reference images
```

## Workflows

**Character Generation/Editing**
- Generate new characters from text prompts with optional reference images
- Edit existing characters with modification prompts

**Sprite Sheet Generation**
- Select a character from saved assets
- Define animation sequences (name, description, frame count)
- Generate sprite grid for all sequences

## API Reference

See `REFERENCE.md` for Gemini API documentation.

## Changelog

- Initial implementation: dashboard with character and sprite workflows
- API routes for generation, editing, and asset management
- Drag-drop image upload with multi-image support
- Asset picker for saved images
- Auto-save generated images to assets folder
