# NanoBanana Sprite Studio UI

Simple image-generating UI specifically focused on  charachter and sprite workflows, uses nanobanana models (gemini-2.5-flash-image & gemini-3-pro-image-preview).

<changelog>
* New project, just initialized. Requirements and reference added, basic Nextjs app.
</changelog>

---

## Requirements:

1. Nextjs app running locally. No auth, SPA. Internal tool only
2. Dashboard with two workflow views for generating/editing charachter or sprites
3. Backend routes: gen-character, gen-sprite, edit-character, edit-sprite
4. Assets folder with sub folder organization: "characters", "sprites", "reference"

### Workflows:

Workflow 1: Character Gen/Edit
* Generate character from text-prompt + reference images
* Iterate on character design "edit" image with prompt, optionally attach references. 

Workflow 2: Character -> sprite
* Generate sprite sheet/grid from character for flipbook animation
* Select character image from selection of assets in `/assets/characters/`
* Enter descriptions of one or more animation sequences and number of frames (sequence_name, sequence_description, sequence_length)
* Output: Sprite grid of all animations using input character

---

## Project Documentation:
* `./REFERENCE.md` - NanoBana API Documentation
