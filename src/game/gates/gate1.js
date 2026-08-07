// Gate 1 — "Hollow of the Kneeling Stone".
//
// A gate is a descriptor. This file holds everything that makes this gate this
// gate — its geometry, its encounters, its own constants, its realm's palette
// and its Warden — and nothing that knows how any of it is built. `Level` turns
// a descriptor into geometry and answers collision queries against it; `Game`
// reads every per-gate number from the descriptor it was handed rather than
// importing one.
//
// Gate 1 came through that seam number for number, before gate 2 existed. It is
// the only content in the project with four playtest rounds behind it, which
// makes it the only usable control: change the shape that holds content and
// author new content in the same step and a failure has two candidate causes.
// See docs/SPEC-CAMPAIGN.md § Further Notes.

import { GUARDIAN } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

/** The arena floor. The Warden spawns on it and the exit arch stands on it. */
const ARENA_TOP = 3;

/**
 * The realm's palette: fog, sky and ground.
 *
 * `docs/DECISIONS.md` § Art direction darkens these left to right across a gate.
 * The endpoints belong to the realm rather than to the campaign, so each realm
 * moves across its own length instead of ten gates fading to black together.
 *
 * Lighting stays in `render/palette.js`. `skyFill` is also every toon material's
 * default rim, so it is not a realm's to own — the line is that a realm holds
 * what the hunter looks *at*, and the palette holds what lights it and what the
 * System, the chaya and the characters are made of.
 */
const REALM = {
  sky: { zenith: 0x140b2e, mid: 0x3a2160, horizon: 0x8a5a86 },
  // Fog matches the horizon so distance dissolves rather than clipping.
  fog: { color: 0x5c3f68, near: 26, far: 132 },

  grass: 0x7fae7a,
  grassBlade: 0x8fc48c,
  grassBladeTip: 0xd8e9a8,
  rock: 0x6d6a7d,
  rockDark: 0x3f3d4d,
  rockMoss: 0x5d7a5e,
  stone: 0x8b869a,
  crystal: 0x9d5cff,

  // Two mist bands: one behind the play plane, one in front of it.
  mist: { back: 0xc9a3ff, front: 0x8a5a86 },
  // Parallax ridges, nearest first. The fog does the aerial perspective, so
  // each layer only has to be lighter than the one in front of it.
  ridges: [0x3f3d4d, 0x4a3f60, 0x5d5077],
};

/**
 * Solid ground, left to right. Gaps between segments are real gaps — the
 * traversal beats of the gate are the spaces this list leaves out.
 *
 * Every gap is 3.8. A crossing therefore needs 4.48 of the measured 6.08-unit
 * running jump — 26% in reserve. That reserve is the whole point: at 4.5-unit
 * gaps the margin was small enough that the jump had to start within a few
 * centimetres of the lip, and both scripted bots died there repeatedly.
 *
 * The chasm was authored at 3.8 for that reason and the rest of the gate was
 * not — the approach, the climb and the bridge were laid out at 4.0 before the
 * reasoning existed, which is 23% and under the 25% the touch budget in
 * `docs/SPEC-CAMPAIGN.md` asks for. The tier-1 checks are what noticed; five
 * take-off lips moved 0.2 to the right and nothing else changed. Landing lips
 * stayed where they were, so no lock, trigger or spawn was authored against a
 * number that has since moved.
 */
const SEGMENTS = [
  // Approach: wide, safe, nothing to fight. Room to learn the controls.
  { x0: -6, x1: 30.2, top: 0, trees: 3, crystals: 2, boulders: 3, pillars: 2 },

  // First blood — a shallow bowl you cannot leave until it is clear.
  { x0: 34, x1: 68.2, top: 0, trees: 2, boulders: 4, crystals: 1, pillars: 1 },

  // The climb. Three steps, each a committed jump.
  { x0: 72, x1: 80.2, top: 1.6, boulders: 1, crystals: 1 },
  { x0: 84, x1: 91.2, top: 3.4, boulders: 1 },
  { x0: 95, x1: 103, top: 5.2, crystals: 2, boulders: 1 },

  // The chasm: small islands over the void, patrolled by bhoot-battis. The drop below
  // is what makes it read as dangerous; the gap width only decides whether it
  // is *fair*, and it is the same 3.8 the rest of the gate now uses.
  { x0: 106.8, x1: 111.8, top: 5.2, barren: true, depth: 5 },
  { x0: 115.6, x1: 120.6, top: 6.4, barren: true, depth: 5 },
  { x0: 124.4, x1: 129.4, top: 5.0, barren: true, depth: 5 },

  // The bridge, and the ambush on it.
  { x0: 133.2, x1: 162.2, top: 4.2, boulders: 3, pillars: 3, crystals: 2, trees: 1 },

  // The Warden's arena — long, flat, no cover, nowhere to run.
  { x0: 166, x1: 204, top: ARENA_TOP, depth: 9, boulders: 2, pillars: 2, thickness: 6 },
];

/**
 * The gate's Warden: an archetype, a title, and the numbers it is elevated to.
 *
 * Gate 1's is a boss — bespoke and multi-phase — so its archetype is a class of
 * its own rather than a raakchyas with a bigger health bar. The stats still
 * arrive this way, because `Guardian` reads every number from the block it is
 * handed exactly as `Raakchyas` does, and that is what makes the next nine Wardens
 * configuration instead of nine more files.
 */
const WARDEN = {
  archetype: 'guardian',
  title: STRINGS.GATE1_WARDEN_TITLE,
  stats: GUARDIAN,
};

/**
 * Encounters. `lock` seals the fight between two x positions until every enemy
 * it spawned is dead.
 */
const ENCOUNTERS = [
  {
    id: 'first-blood',
    trigger: 40,
    lock: [35, 67],
    // The one rule the whole combat design rests on, stated once, the first
    // time the player meets something that can hurt them — and stated *in the
    // intro window*, not after it.
    //
    // It used to be a second window: 37 words, opening at 1.7 s, for 4.2 s.
    // Raakchyas spawn at 0 s, 0.5 s and 1.4 s, so it arrived with all three
    // already on the player and left before any of them was dead. Round 3:
    // "too much text, for a short period of time... reading the texts while
    // fighting them is not very feasible." A rule nobody can read is a rule
    // nobody was taught, and if you believe touching a raakchyas hurts, crowding
    // reads as chip damage, backing off reads as correct, and the fight you are
    // actually being offered never starts.
    //
    // One line, on screen from 0 s, short enough to take in at a glance.
    intro: {
      title: STRINGS.GATE1_FIRSTBLOOD_TITLE,
      body: STRINGS.GATE1_FIRSTBLOOD_BODY,
      note: STRINGS.GATE1_FIRSTBLOOD_NOTE,
    },
    spawns: [
      { type: 'raakchyas', x: 52, delay: 0 },
      { type: 'raakchyas', x: 60, delay: 0.5 },
      { type: 'raakchyas', x: 46, delay: 1.4 },
    ],
  },
  {
    id: 'the-chasm',
    trigger: 105,
    // No lock: the chasm's threat is the fall, not the fight.
    spawns: [
      // Spawn altitude is the bhoot-batti's home altitude, and it only ranges a
      // few units either side of it — so these have to sit near where the
      // hunter will actually be, not far overhead.
      // Positioned over the *islands*, not the gaps. A bhoot-batti hovering
      // above a gap baits the player into jumping at it instead of across, and
      // the punishment for taking that bait is the void. Fights belong on floor.
      { type: 'bhootBatti', x: 109.3, y: 7.0, delay: 0 },
      { type: 'bhootBatti', x: 118.1, y: 8.2, delay: 0.3 },
      { type: 'bhootBatti', x: 126.9, y: 6.8, delay: 0.9 },
    ],
  },
  {
    id: 'the-bridge',
    trigger: 136,
    lock: [134, 161],
    intro: { title: STRINGS.GATE1_BRIDGE_TITLE, body: STRINGS.GATE1_BRIDGE_BODY },
    // Six enemies, but spread over seven seconds rather than dropped at once.
    // Arriving together, four raakchyas pounce often enough to out-damage the
    // hunter's entire health bar before the first one dies; arriving in waves,
    // the same six are a fight you can actually work through. The count is the
    // spectacle, the spacing is the difficulty.
    // Spawns stay clear of the barriers at 134 and 161. A body that
    // materialises overlapping one has to be ejected by the collision solver,
    // and "wherever the solver puts it" is not a spawn point.
    spawns: [
      { type: 'raakchyas', x: 147, delay: 0 },
      { type: 'raakchyas', x: 155, delay: 1.4 },
      { type: 'bhootBatti', x: 151, y: 6.2, delay: 2.8 },
      { type: 'raakchyas', x: 141, delay: 4.2 },
      { type: 'bhootBatti', x: 145, y: 6.6, delay: 5.6 },
      { type: 'raakchyas', x: 157, delay: 7.0 },
    ],
  },
  {
    id: 'guardian',
    trigger: 172,
    lock: [167, 203],
    boss: true,
    intro: { title: STRINGS.GATE1_GUARDIAN_TITLE, body: WARDEN.title },
    // `warden` rather than an archetype name: which enemy that is belongs to
    // the gate's Warden block, so the encounter does not have to say it twice.
    spawns: [{ type: 'warden', x: 190, delay: 0.9 }],
  },
];

export const GATE_1 = {
  id: 'gate-1',
  name: STRINGS.GATE1_NAME,
  realm: REALM,

  spawnX: 4,
  /** Below this you have fallen out of the world. */
  voidY: -26,
  arenaTop: ARENA_TOP,
  exitX: 196,
  end: 204,

  /**
   * The Kneeling Stone. Scenery, not a fight — the gate is named after it
   * because it is the one silhouette visible from the entrance, and the title
   * camera drifts across it.
   */
  landmark: { kind: 'kneeling-stone', x: 172, y: -0.5, z: -19, rotY: -0.42 },

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
