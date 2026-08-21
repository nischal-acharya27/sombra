// Gate 10 — Gokul, Asleep.
//
// This is gate 10 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Putana, not the retired Bhavachakra/Maun-Ankur. Act 3's second gate, and
// the campaign's one deliberate pacing dip: "flat, minimal, deliberately
// intimate," zero regular encounters — a real first, and a real breather
// between gate 9's crowded akhada and gate 11's ahead. Padding the approach
// with a reskinned mob would work against the intimacy her respectful-
// treatment note asks the design to protect, so nothing here does that; the
// single encounter is the Warden herself, met alone, the way every Warden
// in the campaign is met.
//
// A household in Gokul at night, climbed rather than crossed: a courtyard,
// a two-riser stair to the loft, a few roof beams over gaps small enough to
// call forgiving, then down through the roof hatch into the nursery where
// she is waiting. Every rise and every gap reuses numbers
// already measured elsewhere in the campaign — no new traversal primitive,
// and nothing steeper than a gate this quiet can carry. The one thing this
// build deliberately does *not* do is give her own arena a second level:
// every Warden arena in the campaign flattens completely for the fight
// (Ravana's own gate 8 note: "a boulder in here is not cover, it is a thing
// to be pinned against") because a committed move needs open, readable
// ground, and that rule outranks the level-design brief's ask for a
// vertical-positioning encounter — see `docs/DECISIONS.md` for the call.

import { PUTANA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 3;

/**
 * "Divine-tyrant — gold and dark red, prophecy-coded" per
 * `docs/SPEC-CAMPAIGN.md`'s per-act table, held to its nocturnal register:
 * a sleeping village under a deep indigo night, lit from the ground up by
 * oil lamps rather than from the sky down. `crystal` carries `P.amber`
 * directly, the lamp-glow read doubling as her own shared damage-signal
 * telegraph colour, the same trick gate 9's realm already plays with
 * Kamsa's own core-less kit.
 */
const REALM = {
  sky: { zenith: 0x080512, mid: 0x1c1428, horizon: 0x3a1c1c },
  fog: { color: 0x241a2c, near: 16, far: 96 },

  grass: 0x241e28,
  grassBlade: 0x3a2e30,
  grassBladeTip: 0x8a6a3a,
  rock: 0x362a24,
  rockDark: 0x18120e,
  rockMoss: 0x342a1c,
  stone: 0x4a3a2c,
  crystal: 0xffb347,

  mist: { back: 0x4a2c2c, front: 0x1c1420 },
  ridges: [0x140e14, 0x241a20, 0x362a24],
};

/**
 * A climb, not a crossing — the household's own stair and roof, every
 * number reused from an earlier gate rather than invented for this one.
 * Courtyard → veranda → the loft (one two-step stair) → three roof beams
 * over small, forgiving gaps → the hatch down into the nursery. `thickness:
 * 1.0` on every ledge, a 3-unit rise on every climb and a 4-unit x-overlap
 * are the same `?vtest`-validated figures gate 6's canopy already measured;
 * the roof gaps (2.2–2.6) are deliberately narrower than the campaign's own
 * `?vtest`-validated 3.8-unit "real gap," which holds the reserve
 * `tools/gatecheck.js`'s `jumpReserve` checks well past its floor rather
 * than at it — the light, forgiving platforming the level-design brief
 * asked for, not a second copy of gate 8's climb.
 *
 * The 3-unit rise is not the gentler figure a "sleeping household" first
 * suggests: `headroomClear` derives its floor from `PLAYER.hh` and
 * `thickness: 1.0` (`(top - thickness) - low.top >= PLAYER.hh * 2 + 0.05`),
 * which a smaller rise cannot clear — at 1.5 units the ledge above reads to
 * the collision resolver as a wall, not a mezzanine to stand under. See
 * `docs/DECISIONS.md` for the reachability failure this caught.
 */
const SEGMENTS = [
  // The courtyard: a well, a gatepost, room to read the household before
  // anything asks to be climbed.
  { x0: -6, x1: 20, top: 0, boulders: 2, pillars: 1 },

  // The veranda — the stair's first riser.
  { x0: 16, x1: 38, top: 3.0, thickness: 1.0, boulders: 1 },

  // The loft landing — the stair's second riser, wide and flat: a
  // visually distinct mid-level room, sleeping mats and storage jars,
  // not a corridor.
  { x0: 34, x1: 62, top: 6.0, thickness: 1.0, depth: 7, boulders: 1, pillars: 2 },

  // The roof: three beams, two small gaps, the light platforming section —
  // jumping is the only way across, and each gap is well inside the
  // campaign's own measured reserve.
  { x0: 64.2, x1: 78, top: 6.0, thickness: 1.0, boulders: 1 },
  { x0: 80.4, x1: 94, top: 6.0, thickness: 1.0, boulders: 1 },
  { x0: 96.6, x1: 112, top: 6.0, thickness: 1.0, pillars: 1 },

  // Down through the hatch — a free 3-unit drop, no jump required, into the
  // nursery. Flat and wide from here on, the same convention every Warden
  // arena in the campaign holds to.
  { x0: 108, x1: 176, top: ARENA_TOP, barren: true, depth: 9, thickness: 6, boulders: 1, pillars: 2 },
];

/**
 * Putana. Tier 2 — a new rig for each of her two forms, but `Putana` in
 * `enemies.js` reads every number from the block it is handed, exactly as
 * `Kamsa` and `Shurpanakha` do.
 */
const WARDEN = {
  archetype: 'putana',
  title: STRINGS.GATE10_WARDEN_TITLE,
  stats: PUTANA,
};

/**
 * One encounter: Putana, met alone. Zero regular encounters — her own
 * table's explicit call, and the campaign's first gate to make it.
 */
const ENCOUNTERS = [
  {
    id: 'putana',
    trigger: 148,
    lock: [118, 172],
    intro: { title: STRINGS.GATE10_PUTANA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 150, delay: 0.9 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line": thirteen paged 'intro' beats and eight paged 'cleared' beats, with
 * one 'phase' beat between them — fired by `Putana.takeHit` in `enemies.js`
 * through `Game.firePhaseBeat` at her HP threshold. Written toward release
 * rather than a villainy recap or a victory the hunter celebrates, the same
 * escort-not-punishment framing Shurpanakha's reveal beat uses: nothing here
 * stages a feeding tableau, and nothing frames the clear as a monster put
 * down rather than a soul the stopped Wheel was holding in place.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE10_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE10_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE10_PUTANA_INTRO_1_BIG, STRINGS.GATE10_PUTANA_INTRO_1_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_2_BIG, STRINGS.GATE10_PUTANA_INTRO_2_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_3_BIG, STRINGS.GATE10_PUTANA_INTRO_3_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_4_BIG, STRINGS.GATE10_PUTANA_INTRO_4_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_5_BIG, STRINGS.GATE10_PUTANA_INTRO_5_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_6_BIG, STRINGS.GATE10_PUTANA_INTRO_6_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_7_BIG, STRINGS.GATE10_PUTANA_INTRO_7_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_8_BIG, STRINGS.GATE10_PUTANA_INTRO_8_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_9_BIG, STRINGS.GATE10_PUTANA_INTRO_9_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_10_BIG, STRINGS.GATE10_PUTANA_INTRO_10_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_11_BIG, STRINGS.GATE10_PUTANA_INTRO_11_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_12_BIG, STRINGS.GATE10_PUTANA_INTRO_12_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_13_BIG, STRINGS.GATE10_PUTANA_INTRO_13_BODY),
  {
    at: 'phase',
    title: STRINGS.GATE10_WARDEN_TITLE,
    big: STRINGS.GATE10_PUTANA_PHASE_BIG,
    body: STRINGS.GATE10_PUTANA_PHASE_BODY,
  },
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_1_BIG, STRINGS.GATE10_PUTANA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_2_BIG, STRINGS.GATE10_PUTANA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_3_BIG, STRINGS.GATE10_PUTANA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_4_BIG, STRINGS.GATE10_PUTANA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_5_BIG, STRINGS.GATE10_PUTANA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_6_BIG, STRINGS.GATE10_PUTANA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_7_BIG, STRINGS.GATE10_PUTANA_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_8_BIG, STRINGS.GATE10_PUTANA_DEFEAT_8_BODY),
];

export const GATE_10 = {
  id: 'gate-10',
  name: STRINGS.GATE10_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the lowest courtyard floor and the roof gaps both. */
  voidY: -20,
  arenaTop: ARENA_TOP,
  exitX: 168,
  end: 176,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
