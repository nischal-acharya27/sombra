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

## Per-character folders

`Shakuni/` is the first of these: art supplied for one character rather than one
surface, and it is *reference plus textures*, not all textures. Five of its nine
files are in the manifest (the robe filigree, the card face, three ground-zone
fills). The other four are reference the rig and the VFX were built **from**:

- `shakuni_character_sprite_and_portrait.svg`, `shakuni_phase2.svg` — the
  character design. There is no billboard anywhere in this game to hang a
  sprite on; these were read and built as geometry.
- `ceremonial_staff.svg` — likewise, built as a shaft, three collars, a torus
  loop and a suspended die.
- `loaded_die_face_map.svg` — deliberately **not** loaded, and the clearest
  worked example of rule 2 above. A die's rolled face is the readability cue
  the whole Loaded Die attack is built on, so it is twenty-one pips of geometry
  and a rotation table (`DIE_FACE_UP`), not a texture. The file still did its
  job: it is where the crimson centre pip on the odd faces came from.

If you add another character folder, split it the same way, and put the reason a
file is *not* in the manifest next to the manifest entries that are.
