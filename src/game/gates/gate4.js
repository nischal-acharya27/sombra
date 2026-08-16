// Gate 4 — Tataka-vana (Ramayana, Bala Kanda).
//
// This is gate 4 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Taraka, not the retired Preta-lok/Atripta. Act 2's first gate, and its own
// table's call — "Moderate — canopy-level stacked rises, flat at the fight"
// — mirrors gate 2's traversal texture rather than inventing a new shape:
// the hunter climbs into curse-touched canopy instead of walking a road, but
// the stacked-ledge geometry underneath is the same validated rise gate 2
// already proved (`?vtest`'s 4-unit x-overlap, `thickness: 1.0`), then
// flattens for the one grunt encounter and for Taraka's own arena, since her
// claw-pounce kit needs open room the way Bakasura's grab did.
//
// One new thing arrives here: the roster's first phase-transition, wired
// through `Game.firePhaseBeat` (see `docs/DECISIONS.md` § "Boss/Warden
// dialogue returns"). Taraka is fought in her beautiful, human-scale-looking
// rig from the first hit — hitbox and kit are already the monstrous form's,
// per the handoff, so the swap is never a fairness change — and the curse
// reveals itself at an HP threshold as a held, wordless story beat: a
// writhe/contort animation and a pained sound cue, not a toast.
//
// Single-archetype throughout, per docs/SPEC-CAMPAIGN.md's Act 2 call:
// Taraka and Kaikeyi both stay single-archetype/no-combat, so the act's
// first combination encounter waits for Shurpanakha's gate. `BhootBatti`,
// reskinned as forest wisps, is the one grunt this gate spends.

import { TARAKA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';
import { P } from '../../render/palette.js';

const ARENA_TOP = 0;

/**
 * Act 2's palette register — "Rakshasa/forest tones, moving toward regal
 * gold approaching Ravana" per docs/SPEC-CAMPAIGN.md's per-act table. This
 * is the act's first gate, so the register sits at its greenest, furthest
 * from the gold the act only reaches near gate 8 — deep canopy, not yet
 * court.
 */
const REALM = {
  sky: { zenith: 0x0a1408, mid: 0x1e3418, horizon: 0x4a6a2c },
  fog: { color: 0x2c4a1e, near: 20, far: 110 },

  grass: 0x2e4420,
  grassBlade: 0x3a5828,
  grassBladeTip: 0x8ac25a,
  rock: 0x3a3020,
  rockDark: 0x1c1810,
  rockMoss: 0x445a2a,
  stone: 0x4a4030,
  crystal: 0x9adf6a,

  mist: { back: 0x5a7a3e, front: 0x2c4a1e },
  ridges: [0x1c1810, 0x2a2418, 0x3a3020],
};

/**
 * Canopy climb, left to right: two stacked ledges up, a matching descent,
 * one real gap, then flat ground the rest of the way — the exact shape and
 * measurements gate 2's own `SEGMENTS` validated (`tools/gatecheck.js`'s
 * `edge()` headroom check holds these to the same clearance), re-dressed as
 * bare canopy stone rather than a road.
 */
const SEGMENTS = [
  // The way in from the last gate: forest floor, nothing climbing yet.
  { x0: -6, x1: 14, top: 0, trees: 3, boulders: 2 },

  // Two stacked ledges climbing into the canopy.
  { x0: 10, x1: 22, top: 3, barren: true, depth: 5, thickness: 1.0, boulders: 1 },
  { x0: 18, x1: 32, top: 6, barren: true, depth: 5, thickness: 1.0, boulders: 1 },

  // The descent, mirroring the climb.
  { x0: 28, x1: 40, top: 3, barren: true, depth: 5, thickness: 1.0 },
  { x0: 36, x1: 56, top: 0, trees: 2, boulders: 2 },

  // The one real gap — 3.8 wide, the same figure every gate's own gap is
  // measured against per docs/DECISIONS.md's "6.08-unit running jump" entry.
  { x0: 59.8, x1: 96, top: 0, trees: 2, boulders: 2, pillars: 1 },

  // Taraka's arena — flat, no cover, room for a claw-pounce to be read.
  { x0: 96, x1: 152, top: 0, barren: true, depth: 9, boulders: 2, thickness: 6 },
];

/**
 * `BhootBatti` reskinned as forest wisps — "slow and floating against her
 * own fast, committal ground melee," per docs/SPEC-CAMPAIGN.md's gate-04
 * table. Only the glow colours move; the hover/shoot behaviour underneath
 * is the archetype's own, unchanged, the same reskin discipline gate 2's
 * village-rakshasa skin follows.
 */
const FOREST_WISP_SKIN = { core: P.forestWispCore, halo: P.forestWispHalo, shard: P.forestWispHalo };

/**
 * The gate's Warden: Taraka is tier 2 (`docs/agents/villain-handoff.md`) —
 * a new rig, but `Taraka` in `enemies.js` reads every number from the block
 * it is handed exactly as `Bakasura`/`Shakuni` do.
 */
const WARDEN = {
  archetype: 'taraka',
  title: STRINGS.GATE4_WARDEN_TITLE,
  stats: TARAKA,
};

/**
 * Two encounters: the forest wisps met alone, then Taraka herself. Single
 * archetype per encounter throughout, per Act 2's own "Taraka and Kaikeyi
 * stay single-archetype" call — `tools/gatecheck.js`'s `soloDebut` check
 * makes the wisps' solo debut a fact rather than an intention.
 */
const ENCOUNTERS = [
  {
    id: 'forest-wisps',
    trigger: 68,
    lock: [64, 94],
    intro: {
      title: STRINGS.GATE4_WISP_TITLE,
      body: STRINGS.GATE4_WISP_BODY,
      note: STRINGS.GATE4_WISP_NOTE,
    },
    spawns: [
      { type: 'bhootBatti', x: 78, delay: 0.3, skin: FOREST_WISP_SKIN },
      { type: 'bhootBatti', x: 88, delay: 0.9, skin: FOREST_WISP_SKIN },
    ],
  },
  {
    id: 'taraka',
    trigger: 106,
    lock: [100, 150],
    intro: { title: STRINGS.GATE4_TARAKA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 128, delay: 0.8 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line": thirteen paged 'intro' beats (who she was, Sunda, Agastya's curse,
 * the forest that carries her name, and her own signature line) and eight
 * paged 'cleared' beats once she loses. Between them, one 'phase' beat —
 * the roster's first — fired by `Taraka.takeHit` in `enemies.js` through
 * `Game.firePhaseBeat` at her HP threshold: no text, per
 * `docs/SPEC-CAMPAIGN.md`'s own dialogue table ("no line — writhe/contort
 * animation and pained sound cue carry it"), just the held window and the
 * rig swap underneath it.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE4_TARAKA_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE4_TARAKA_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE4_TARAKA_INTRO_1_BIG, STRINGS.GATE4_TARAKA_INTRO_1_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_2_BIG, STRINGS.GATE4_TARAKA_INTRO_2_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_3_BIG, STRINGS.GATE4_TARAKA_INTRO_3_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_4_BIG, STRINGS.GATE4_TARAKA_INTRO_4_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_5_BIG, STRINGS.GATE4_TARAKA_INTRO_5_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_6_BIG, STRINGS.GATE4_TARAKA_INTRO_6_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_7_BIG, STRINGS.GATE4_TARAKA_INTRO_7_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_8_BIG, STRINGS.GATE4_TARAKA_INTRO_8_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_9_BIG, STRINGS.GATE4_TARAKA_INTRO_9_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_10_BIG, STRINGS.GATE4_TARAKA_INTRO_10_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_11_BIG, STRINGS.GATE4_TARAKA_INTRO_11_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_12_BIG, STRINGS.GATE4_TARAKA_INTRO_12_BODY),
  introBeat(STRINGS.GATE4_TARAKA_INTRO_13_BIG, STRINGS.GATE4_TARAKA_INTRO_13_BODY),
  { at: 'phase', title: STRINGS.GATE4_TARAKA_TITLE },
  clearedBeat(STRINGS.GATE4_TARAKA_DEFEAT_1_BIG, STRINGS.GATE4_TARAKA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE4_TARAKA_DEFEAT_2_BIG, STRINGS.GATE4_TARAKA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE4_TARAKA_DEFEAT_3_BIG, STRINGS.GATE4_TARAKA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE4_TARAKA_DEFEAT_4_BIG, STRINGS.GATE4_TARAKA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE4_TARAKA_DEFEAT_5_BIG, STRINGS.GATE4_TARAKA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE4_TARAKA_DEFEAT_6_BIG, STRINGS.GATE4_TARAKA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE4_TARAKA_DEFEAT_7_BIG, STRINGS.GATE4_TARAKA_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE4_TARAKA_DEFEAT_8_BIG, STRINGS.GATE4_TARAKA_DEFEAT_8_BODY),
];

export const GATE_4 = {
  id: 'gate-4',
  name: STRINGS.GATE4_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the climb and the gap both. */
  voidY: -24,
  /** Every arena segment is `top: 0`. */
  arenaTop: 0,
  exitX: 148,
  end: 154,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
