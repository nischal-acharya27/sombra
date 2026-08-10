// The training hall — issue #35.
//
// Not a gate: it never joins `GATES` in `gates/index.js`, so it never touches
// `resumePoint`, per-gate style ranks, or the replay-a-cleared-gate machinery
// `docs/SPEC-CAMPAIGN.md` documents for the ten real ones. It is a descriptor
// in the same shape as one purely so `Level` — which only knows how to turn a
// descriptor into geometry — can build it without a second code path. See
// `src/game/tutorial.js`, which drives it the way `Game` drives a real gate,
// stripped to what a fight-free space needs.
//
// One long flat floor, padded far past where a hunter still finding their
// jump and dash could reach — there is no gap to fall into and nothing here
// is allowed to kill anyone, so the floor simply outruns them instead of
// needing a safety net.

import { STRINGS } from '../../ui/strings.js';

/**
 * The System's own palette rather than a realm's: cold blue-black and its one
 * accent, the cyan `docs/adr` already spends on the System everywhere else.
 * `docs/DECISIONS.md` § Art direction is about the ten realms darkening
 * across the campaign; this space is not one of them.
 */
const REALM = {
  sky: { zenith: 0x050914, mid: 0x0d1a33, horizon: 0x1c3350 },
  fog: { color: 0x0d1a33, near: 34, far: 150 },

  grass: 0x2a4a5c,
  grassBlade: 0x3a6a80,
  grassBladeTip: 0x8fd8e9,
  rock: 0x2c3540,
  rockDark: 0x181d24,
  rockMoss: 0x2c3540,
  stone: 0x3d4a58,
  crystal: 0x5fd8ff,

  mist: { back: 0x5fd8ff, front: 0x1c3350 },
  ridges: [0x181d24, 0x232b36, 0x30394a],
};

const SEGMENTS = [
  // `barren: true` caps it in stone rather than grass — an interior, not a
  // realm. One segment, no gaps: `x0`/`x1` reach well past `spawnX`/`exitX`
  // below so nothing a hunter still learning the moveset can do walks them
  // off the edge of the floor.
  { x0: -40, x1: 170, top: 0, barren: true, pillars: 6, crystals: 6, thickness: 6 },
];

export const GATE_TUTORIAL = {
  id: 'tutorial',
  name: STRINGS.TUTORIAL_NAME,
  realm: REALM,

  spawnX: 8,
  exitX: 150,
  end: 170,
  arenaTop: 0,

  segments: SEGMENTS,
  // `Level` needs the field to exist even though nothing here ever seals it.
  encounters: [],
};
