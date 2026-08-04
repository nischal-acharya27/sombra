// Gate 2 — "The Crossing".
//
// Gate 1's exit does not lead home. It leads down to the river, and this is the
// river: grey-blue, walled in by mist, with black water where gate 1 has void.
//
// It is a walk, and two fights. Falling into the water forgets rather than
// kills; see `forgivingVoid` below.
//
// The first fight is the charger, met alone: nothing else spawns in this gate
// but its Warden, so the tell is learned in isolation rather than inferred out
// of a crowd and unlearned later. The `solo debut` check in
// `tools/gatecheck.js` holds every future archetype to the same thing.
//
// The far bank is the second: the Ferryman, the crossing's Warden. See
// `FERRYMAN` in `src/game/config.js` for what "elevated" means here and what
// its one signature addition is.
//
// Two story beats, both gate boundaries: on arrival, right after the System
// names the realm — this is where it glitches for the first time, having no
// record of the place — and again once the Ferryman is down, before the
// hunter reaches the arch. Neither can land while an encounter is live; see
// `Game._fireBeats`. The descriptor still goes through every tier-1 check in
// `tools/gatecheck.js`, and the crossing's gaps are held to the same touch
// budget gate 1's are.

import { FERRYMAN } from '../config.js';

/**
 * The far bank — the Ferryman's arena. Flat and open, same as the causeway the
 * charger taught on, only longer: the chain charge needs room to run twice.
 */
const ARENA_TOP = 0;

/**
 * The realm's palette.
 *
 * Everything gate 1 is warm about, this is cold about. The pastel violet dusk
 * becomes an overcast grey-blue; the moss and the leaf-green become drained
 * blue-greens; the void becomes water. That is the whole of "reads as a
 * different place at a glance", and it is deliberately a *static* palette:
 * `docs/DECISIONS.md` § Art direction describes a lerp across a gate's length
 * that has never been built, and this gate is not where it gets built.
 */
const REALM = {
  sky: { zenith: 0x0b1520, mid: 0x22394d, horizon: 0x7d94a3 },
  // Nearer and shorter than gate 1's 26/132. The crossing should feel walled
  // in — you cannot see either bank properly, which is most of why a flat
  // stretch of water reads as a place you are crossing rather than a pond.
  fog: { color: 0x54697a, near: 20, far: 110 },

  // Reeds rather than meadow. The same field, the same shader, drained.
  grass: 0x5b6f6a,
  grassBlade: 0x6d8079,
  grassBladeTip: 0xa9bcae,
  rock: 0x4b5762,
  rockDark: 0x252d36,
  rockMoss: 0x445a57,
  stone: 0x76838f,
  // Cold where gate 1's is violet. The crystals are the one bright thing here.
  crystal: 0x59d2e0,

  mist: { back: 0xc2d4de, front: 0x8fa6b4 },
  ridges: [0x2a333d, 0x36434f, 0x475766],

  /**
   * Black water, and where its surface sits.
   *
   * Below every platform top and above every platform's underside, so the
   * stones read as standing *in* it rather than floating over it. `voidY` is
   * far beneath: falling in is still a fall — `Game._fallInWater` is what
   * makes landing in it survivable, keyed off `forgivingVoid` below.
   */
  water: { y: -1.8, color: 0x04070c, sheen: 0x7fb9c9 },
};

/**
 * Solid ground, left to right: a bank, three stones, a causeway, two more
 * stones, and the far bank.
 *
 * Every gap is 3.6 or 3.8, which is 3.8 at the worst — the same width gate 1
 * settled on, needing 4.48 of the measured 6.08-unit running jump and leaving
 * 26% in reserve. The touch budget in `docs/SPEC-CAMPAIGN.md` asks for 25%, and
 * the tier-1 jump-reserve check holds this gate to it as a ratio against the
 * arc this build actually measures rather than against the literal 3.8.
 *
 * Rises are kept small and alternate up and down. A crossing is a rhythm rather
 * than a climb: gate 1 already owns the ascent, and repeating it here would
 * make the second gate read as more of the first.
 */
const SEGMENTS = [
  // The near bank. Wide, with somewhere to stand and look at where you are.
  { x0: -6, x1: 26, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // Three stones. Barren, so nothing grows on them — they are under water
  // often enough that nothing does.
  { x0: 29.8, x1: 35.8, top: 0.8, barren: true, depth: 5 },
  { x0: 39.4, x1: 45.4, top: 0.2, barren: true, depth: 5 },
  { x0: 49.2, x1: 55.2, top: 1.4, barren: true, depth: 5 },

  // The causeway: something that was built, and is still mostly standing.
  { x0: 58.8, x1: 88.8, top: 0.6, boulders: 2, pillars: 3, crystals: 1 },

  // Two more stones, where the causeway has gone.
  { x0: 92.6, x1: 98.6, top: 1.6, barren: true, depth: 5 },
  { x0: 102.2, x1: 108.2, top: 0.4, barren: true, depth: 5 },

  // The far bank, and the arch out of it. Long and flat: the Ferryman's arena,
  // and the chain charge needs the room a single-pass lane does not.
  { x0: 112, x1: 150, top: ARENA_TOP, boulders: 3, pillars: 2, crystals: 2 },
];

/**
 * The crossing's Warden: an existing archetype, elevated. See `FERRYMAN` in
 * `src/game/config.js` for the numbers and the one added move.
 */
const WARDEN = {
  archetype: 'charger',
  title: 'THE FERRYMAN',
  stats: FERRYMAN,
};

/**
 * Two encounters, two enemies met alone: the charger, then the Ferryman.
 *
 * The causeway is thirty units of flat, unobstructed floor, and that is the
 * point: a charger needs a lane, and an archetype introduced in a place that
 * denies it its own mechanic teaches nothing. Sealing it is what makes the
 * lesson unskippable, and an unsealed charger is a charger you walk past.
 *
 * The seal is also what makes "alone" true rather than merely likely. Nothing
 * else spawns alongside either fight, so there is no wave to hide a tell in
 * and nothing else alive to blame a hit on.
 *
 * The intro window says the rule and the tell in one line, from 0 s. Round 3 of
 * the playtest log is unambiguous about the alternative: a rule delivered in
 * thirty-seven words while three enemies are already on you is a rule nobody
 * was taught, and a player who believes a body harms them plays a different
 * game from the one on offer.
 */
const ENCOUNTERS = [
  {
    id: 'the-charger',
    trigger: 64,
    lock: [61, 86],
    intro: {
      title: 'THREAT DETECTED',
      body: 'Charger × 1',
      note: 'Its body cannot harm you — only the <b>charge</b>, and it plants its feet first.',
    },
    // Far enough down the causeway to be seen planting before it is in range,
    // and clear of both barriers by a wide margin.
    spawns: [{ type: 'charger', x: 79, delay: 0.3 }],
  },
  {
    id: 'the-ferryman',
    trigger: 118,
    lock: [113, 149],
    intro: {
      title: 'GATE WARDEN',
      body: WARDEN.title,
      note: 'The same tell — it just does not stop at the far bank. It charges twice.',
    },
    // `warden` rather than an archetype name: which enemy that is belongs to
    // the gate's Warden block, so the encounter does not have to say it twice.
    spawns: [{ type: 'warden', x: 136, delay: 0.6 }],
  },
];

/**
 * The crossing's story beats.
 *
 * `at` names the boundary each fires on — `Game._fireBeats` is the only
 * caller, and it is only ever called from a place in `game.js` where no
 * encounter is active. Two beats, both short enough to take in at a glance:
 * user story 5 asks for that, and round 3 of the playtest log is what it cost
 * to learn the alternative.
 *
 * The first is the glitch `docs/SPEC-CAMPAIGN.md` names for this gate — the
 * System has no record of the crossing, and `glitch: true` is what marks the
 * window as the System failing to report cleanly rather than the game failing
 * to render. The second lands once the Ferryman is down, and says the same
 * thing again a different way: whatever the System's records are missing,
 * this gate is in the gap.
 */
const BEATS = [
  {
    at: 'enter',
    title: 'THE SYSTEM',
    big: 'NO RECORD FOUND',
    body: 'It has never catalogued this realm.',
    glitch: true,
  },
  {
    at: 'cleared',
    title: 'THE SYSTEM',
    big: 'RECORD: INCOMPLETE',
    body: 'It logged the crossing. It could not say why.',
  },
];

export const GATE_2 = {
  id: 'gate-2',
  name: 'The Crossing',
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the water, below the plinths: nothing is down there to land on. */
  voidY: -22,
  /**
   * Lethe rather than gate 1's void: falling below `voidY` here returns the
   * hunter to `spawnX` at no health cost and costs the bound shadow, if any.
   * See `Game._fallInWater`.
   */
  forgivingVoid: true,
  /** The far bank, which is where the arch stands, and where the Ferryman does. */
  arenaTop: ARENA_TOP,
  exitX: 142,
  end: 150,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
