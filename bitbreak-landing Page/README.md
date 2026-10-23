# BIT//BREAK — Campus of Puzzles

A responsive, pixel-art-inspired landing page for a MIT-WPU campus puzzle platformer.

## Run it

1. Keep `index.html`, `styles.css`, `landing.js`, and `campus-dome-pixel.png` in the same folder.
2. Open `index.html` in a browser, or use VS Code's Live Server extension.
3. No build step or package installation is required. The retro fonts load from Google Fonts when internet is available; fallback fonts are defined.

## File ownership

- `index.html`: landing page structure and content.
- `styles.css`: colors, layout, responsive ability cards, campus scene and student illustration.
- `landing.js`: landing-page UI interactions and modal content only.
- `campus-dome-pixel.png`: supplied pixelated campus-dome background image.

## Game-engine integration contract

The landing page does not implement game mechanics. Clicking **PLAY GAME** dispatches `bitbreak:play-request` on both `window` and `document`, with `detail.source === "landing-page"`. Your shared `main.js` can listen for it:

```js
document.addEventListener('bitbreak:play-request', () => {
  // Hide the landing screen and show the game canvas / game container.
  // Call the game engine's agreed start function here.
});
```

When the game is initialized, the engine may dispatch `bitbreak:game-ready` to dismiss the small landing-page toast. Keep the engine's state, rules, replay system, clipboard, rewind, logic gates and ID behavior in separate logic files.

## Notes

- The student illustration is CSS-built and intentionally kept separate from the game character sprite.
- The ability cards use the agreed five mechanics as descriptive landing-page content only.
- The control list is a provisional UI guide; adjust it to match the actual logic implementation before release.


### Character asset
The landing page uses `character.png`, created from the supplied 32×32 PixelLab character image. Its near-white background is transparent and the sprite is nearest-neighbour enlarged for crisp pixel rendering. Keep `character.png` beside `index.html`.
