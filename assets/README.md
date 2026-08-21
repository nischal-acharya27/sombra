# assets/

Image textures. The only files in this repo that are not code.

The no-asset-files rule was lifted on 2026-08-21 for image textures **only** —
see `docs/DECISIONS.md` § "The no-asset-files rule is lifted". Still excluded:
model files (glTF/OBJ/FBX), audio files, any build step, and **text baked into
a texture** (localisation depends on all text being DOM text).

## How it works

`src/render/assets.js` holds the manifest — logical name to file — and is the
authority. `src/main.js` awaits `loadAssets()` **before** constructing `Game`,
because a texture created after the suite seeds `Math.random` would spend the
gameplay stream. Call sites ask for art by name:

```js
toonMaterial({ color: R.rock, map: 'stone.basalt' })
```

## Two rules for anything dropped in here

1. **A missing file is not an error.** Every slot has a procedural fallback and
   the game runs, and looks deliberate, with this directory empty. Delete
   everything here and the suite still passes.
2. **Assets decorate; they never carry meaning.** No telegraph, hitbox or
   readability cue may live only in a texture. A player whose textures failed
   to load must still be able to read every fight.

## Authoring notes

The maps here are **multiply** maps over `MeshToonMaterial`, so they modulate
the material's colour rather than replacing it — a near-white base with darker
detail. That is why one basalt file can serve a warm fortress wall and a cold
iron grate: the colour is the material's, the grain is the file's.

Keep detail clear of the tile border; `repeat` is set per manifest entry, and a
second tiling density of the same art is a second entry rather than a runtime
clone (a clone costs eight `Math.random()` draws).
