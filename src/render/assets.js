// External image textures — the one thing in this project loaded from a file.
//
// The no-asset-files rule was lifted on 2026-08-21 for image textures only
// (docs/DECISIONS.md § "The no-asset-files rule is lifted"). That decision
// attached three conditions, and all three are enforced here rather than left
// to the call sites:
//
// 1. **Everything is loaded before the seeded stream is touched.** Three.js
//    draws four `Math.random()` values per UUID and a texture is two objects
//    (`Texture` and its `Source`), so every file costs eight draws. The suite
//    seeds `Math.random` globally, so an asset resolving mid-run would spend
//    the gameplay stream and re-roll every enemy's jitter after it. `main.js`
//    therefore awaits `loadAssets()` *before* `new Game(...)`, and once the
//    registry is installed nothing here allocates again — `get()` is a Map
//    lookup and cannot create a texture.
//
// 2. **A missing file is not an error.** Every lookup returns `null` when the
//    file is absent, and every call site has a procedural fallback that is what
//    the game looked like before this decision. `assets/` may be entirely
//    empty; the game must still run and still look deliberate. This is what
//    keeps "clone it and it runs" true, and it is what let gate 11 be built
//    before any art existed for it.
//
// 3. **Assets decorate and never carry meaning.** Nothing gameplay-legible —
//    a telegraph, a hitbox, a readability cue — may live only in a texture.
//    That one is a rule for call sites; this file cannot enforce it, so it is
//    written down here as the thing a code review looks for.
//
// Textures are addressed by *name*, never by object. That is deliberate: it
// keeps `models.js`'s material cache key (`${color}|${JSON.stringify(opts)}`)
// working unchanged, and it means a call site referring to art that does not
// exist yet is ordinary rather than a crash.

import * as THREE from 'three';

/**
 * Every texture the game knows about.
 *
 * In code, not JSON — a manifest that can 404 is a worse failure mode than one
 * that cannot, and this way a typo is a missing key rather than a fetch error.
 *
 * - `file`   — relative to `assets/`. PNG or SVG.
 * - `size`   — raster size. SVG is vector and has to be told; PNG is resampled
 *              to this, which also caps what a careless 4k drop-in can cost.
 * - `repeat` — [x, y] tiling, applied once at load. Per-material repeat would
 *              mean cloning the texture, and a clone is eight more draws, so
 *              a second tiling of the same art is a second manifest entry.
 * - `srgb`   — colour art (default). `false` for data-ish maps that must not
 *              be colour-managed.
 */
export const MANIFEST = {
  // Gate 11 — Pragjyotishapura. Basalt is the fortress's own material, per
  // Narakasura's roster entry: "carved from the earth he commands", not metal.
  'stone.basalt': { file: 'stone-basalt.svg', size: 256, repeat: [3, 3] },
  'stone.basalt.fine': { file: 'stone-basalt.svg', size: 256, repeat: [8, 8] },
  'iron.plate': { file: 'iron-plate.svg', size: 256, repeat: [2, 2] },

  // Gate 1 — Shakuni. Art supplied for the 2026-08-22 redesign, in
  // `assets/Shakuni/`. Every one of these is decoration over geometry that
  // already carries the meaning, per condition 3 above:
  //
  // - `shakuni.robe` multiplies filigree over the robe's own charcoal. The
  //   robe's silhouette is a lathe, not this file.
  // - `shakuni.card` faces the Court of Blades projectiles. The card is a
  //   `Bolt` with its own hitbox either way; this makes it a court card
  //   rather than a lozenge.
  // - `shakuni.zone`, `shakuni.zone.decoy` and `shakuni.zone.arena` fill the
  //   three flavours of ground telegraph. **The radius is drawn by a
  //   procedural ring at the true radius in every case** — these only fill
  //   the disc inside it, and the fill is deliberately dimmer than the ring.
  //   With `assets/` empty the fills fall back to the built-in radial disc
  //   and the telegraph is unchanged, which is the test that matters.
  //
  // Not loaded, deliberately: `loaded_die_face_map.svg`. It is the reference
  // the die's pip layout was built from (crimson centre pip on the odd faces),
  // but a die's rolled face is a readability cue and readability cues do not
  // live in files — the pips are geometry, and the face is a rotation.
  // `shakuni_character_sprite_and_portrait.svg` and `shakuni_phase2.svg` are
  // likewise reference for the rig, not runtime art: there is no billboard
  // anywhere in this game to hang them on.
  'shakuni.robe': { file: 'Shakuni/shakuni_robe_and_slash_texture.svg', size: 256, repeat: [1, 1] },
  'shakuni.card': { file: 'Shakuni/court_of_blades.svg', size: 128 },
  'shakuni.zone': { file: 'Shakuni/attack_decal.svg', size: 256 },
  'shakuni.zone.decoy': { file: 'Shakuni/rigged_throw.svg', size: 256 },
  'shakuni.zone.arena': { file: 'Shakuni/House_always_wins_phase2_arena_pattern.svg', size: 256 },
};

/** What `get()` hands back when there is no such art. Named, so it reads. */
const ABSENT = null;

export class Assets {
  constructor(textures = new Map(), missing = []) {
    this._t = textures;
    this.missing = missing;
  }

  /**
   * The texture called `name`, or `null` if it is not loaded.
   *
   * A pure lookup — it never loads and never allocates, so it is safe to call
   * from anywhere including mid-run. `null` is an ordinary answer, not an
   * error: every caller is required to have a procedural fallback.
   */
  get(name) {
    return this._t.get(name) ?? ABSENT;
  }

  has(name) {
    return this._t.get(name) != null;
  }

  get count() {
    return this._t.size;
  }
}

// The installed registry. A module singleton rather than a value threaded
// through every builder: `toonMaterial` is called from several hundred places
// across `models.js`, `env.js` and `landmarks.js`, and passing a registry to
// all of them to serve an optional decoration would be a far larger seam than
// the feature deserves. Installed exactly once, during boot, before `Game`.
let REGISTRY = new Assets();

/** The installed registry. Empty and harmless before `loadAssets` runs. */
export function assets() {
  return REGISTRY;
}

/**
 * Decode one image file into a texture, or resolve `null` if it is not there.
 *
 * Goes through an `Image` and a canvas rather than `TextureLoader` for two
 * reasons: it is the only way to rasterise an SVG at a size *we* choose rather
 * than whatever the file's intrinsic dimensions happen to be, and it turns a
 * 404 into a resolved `null` instead of an unhandled loader error.
 */
function loadOne(url, { size = 256 }) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0, size, size);
      resolve(c);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Load the manifest. Call once, from `main.js`, and `await` it before `Game`
 * is constructed — see condition 1 in this file's header.
 *
 * Never rejects. A file that is missing, malformed or unreachable is reported
 * in `missing` and the game runs without it.
 */
export async function loadAssets(base = 'assets/', manifest = MANIFEST) {
  const textures = new Map();
  const missing = [];

  // Every file at once. They are independent, and serialising them would make
  // boot latency the sum of the set rather than its slowest member.
  const entries = Object.entries(manifest);
  const canvases = await Promise.all(
    entries.map(([, spec]) => loadOne(base + spec.file, spec).catch(() => null))
  );

  entries.forEach(([name, spec], i) => {
    const canvas = canvases[i];
    if (!canvas) {
      missing.push(name);
      return;
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = spec.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (spec.repeat) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(spec.repeat[0], spec.repeat[1]);
    }
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    textures.set(name, tex);
  });

  REGISTRY = new Assets(textures, missing);
  return REGISTRY;
}
