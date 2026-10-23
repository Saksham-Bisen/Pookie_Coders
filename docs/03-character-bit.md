# Main Character — Bit

Bit is the hero of Pixa: a first-year engineering student at an Indian college who can bend the world with programmer powers. Bit records "commits" that replay as ghosts, copies and pastes objects, undoes mistakes and throws an ID card like a boomerang. Bit is small, quick and curious, and a little cheeky: there's a "BIT WAS HERE" carving on a back bench in L2.

Facts taken from the design docs are marked **(spec)**. Everything else is a suggestion that fits the spec and palette, so change it freely.

---

## Look at a glance

| Part | Description |
|---|---|
| Size | **16×24 px** at base scale, 64×96 at 4× **(spec)** |
| Build | Chibi proportions: the head is about 9 px, a third of the height, so faces read at tiny sizes |
| Head | Warm brown skin, messy black hair with one spiky tuft, two 1-px black eyes, no mouth when idle (a 1-px line for expressions) |
| Hoodie | **(spec)** Hoodie in mustard yellow, hood down, front pocket marked by one darker row of pixels, sleeves slightly too long |
| Lanyard + ID card | **(spec)** Cyan lanyard strap with an orange ID card (4×3 px) on the chest. This is the same card Bit throws, so when it's thrown the chest is visibly empty |
| Legs | Navy jeans (a shade lighter than the background so they don't vanish) and off-white sneakers |
| Cursor | **(spec)** A tiny glowing cursor floating 2–3 px above the head: an off-white 3×5 px text caret that blinks about once per second, with a 1-px cyan glow |

### Colours (all on the shared palette, plus a few new swatches)

| Use | Colour |
|---|---|
| Hoodie | **#FFD447** mustard (new swatch), shadow #C99A1E |
| Skin | #A86B4C, shadow #7A4A34 |
| Hair, eyes | #14162B (darker than the background navy) |
| Jeans | #3A4170 |
| Lanyard | cyan #3FD0FF |
| ID card | orange #FF9F43 with an off-white photo square |
| Sneakers, cursor | off-white #F2F2E9 |
| Outline | 1-px #14162B outline on the outside edge only |

**Why a yellow hoodie:** the other main colours already carry gameplay meaning. Green means ghost or success, cyan means wires, orange means something you can interact with and red means danger. Yellow is the only bright colour left, and it stands out well against the navy background.

---

## Personality in motion

- **Idle (2 frames):** a small breathing bob while the cursor blinks. After 5 s of no input, Bit could glance at the ID card (optional extra frames).
- **Run (6 frames):** leans forward, hood bouncing, lanyard swinging behind.
- **Jump / fall / land:** arms up on jump, hoodie flares on fall, 1-frame squash on landing.
- **Throw (3 frames):** pulls the card off the lanyard and flicks it sidearm like a frisbee.
- **Copy pose:** two fingers raised in a "pinch" with a dotted outline flash. **Paste pose:** palm forward, pushing the object out.
- **Hurt (2 frames):** the cursor turns red and glitches sideways.
- **Win (4 frames):** a fist pump, and the cursor turns into a green ✓.

## States and variants

- **Recording / draft:** a red "REC" dot next to the cursor, a scanline overlay on the sprite and a slight desaturation **(spec)**.
- **Ghost:** same frames in a single colour at 50% opacity, with a 6-character commit hash above the head such as `a1f3c9` **(spec)**. Three variants: green #3DFF8A, cyan #3FD0FF and violet **(spec)**. Ghosts have no blinking cursor, so it's easy to tell Bit apart from them.
- **Card thrown:** the lanyard hangs empty until the card comes back.

---

## Prompt ready to paste (image generator or Figma AI)

```
Pixel-art sprite of "Bit", the hero of a 2D puzzle-platformer set in an Indian
engineering college with a computer-science theme. Bit is a small, cheerful
first-year student, 16x24 pixels, chibi proportions (big head, a third of the
height). Warm brown skin, messy black hair with one spiky tuft, two dot eyes.
Wears an oversized mustard-yellow hoodie (#FFD447) with the hood down and
slightly-too-long sleeves, navy jeans (#3A4170), off-white sneakers. A cyan
lanyard (#3FD0FF) hangs round the neck holding a small orange ID card (#FF9F43).
A tiny glowing off-white text cursor/caret floats just above the head with a
faint cyan glow. Crisp pixel art, no anti-aliasing, no gradients, 1-px dark
navy outline (#14162B), limited 16-colour palette, deep navy background
(#1B1F3B). Show front-facing idle pose, plus a side-view run frame.
Upscale 4x with nearest-neighbour.
```

**Tips for generating it**
- Image models rarely give clean 16×24 pixel art. Generate at a larger size, then redraw or clean it up on a 16×24 grid in Aseprite, Piskel or Figma.
- Generate the **idle front pose first**, agree on it as a team, and then make the other frames from that pose so all three levels use the same Bit.
- Name the export `char_bit_idle.png`, `char_bit_run.png` and so on, following the snake_case naming rule in the design-system doc.
