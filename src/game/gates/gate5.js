// Gate 5 — Tiryak-lok.
//
// The animal realm. `docs/SPEC-CAMPAIGN.md` is explicit that no new archetype
// arrives here: "no judgment, no speech, no negotiation," and the densest
// beast encounters in the game. So the job this gate does is not teaching a
// new tell — it is making raakchyas and charger, both already taught, feel
// like a pack rather than a queue of solo fights: three grunt encounters
// that grow denser in sequence (Raakchyas ×3, then ×2 with a Charger, then
// ×3 with two Chargers), before the Pack-Mother — Vyaghri, Tiryak-lok's
// Warden — closes the gate.
//
// Vyaghri is an existing archetype elevated, same relationship `KEVAT` has to
// `CHARGER`, and gate 2 has already spent that pattern once — see `VYAGHRI`
// in `src/game/config.js` for why a second elevation of the same archetype is
// exactly what a beast-realm Warden should be, not a shortcut around
// authoring a new one. Its `charge.chain: 3` is one commitment further than
// the Kevat ever asks for.
//
// Flat throughout, like gates 2–4: the same 3.8-unit gap, the same measured
// 26% reserve against this build's running jump. Longer than any gate before
// it — five chambers instead of four — because density needed room the prior
// gates didn't.

import { VYAGHRI } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Choked green, per `docs/SPEC-CAMPAIGN.md`'s table — a canopy thick enough
 * that nothing above it reaches the floor. Where gate 4's palette went pale
 * against gate 3's dark, this goes dense and close against gate 4's open
 * washed-out dust.
 */
const REALM = {
  sky: { zenith: 0x0e1c10, mid: 0x1c331b, horizon: 0x3c4f28 },
  fog: { color: 0x24361f, near: 16, far: 92 },

  grass: 0x2c4022,
  grassBlade: 0x3a5528,
  grassBladeTip: 0x6f8f3a,
  rock: 0x30401f,
  rockDark: 0x1a2412,
  rockMoss: 0x3f5a25,
  stone: 0x3a4a2c,
  crystal: 0x8fd14a,

  mist: { back: 0x314a26, front: 0x1e2e17 },
  ridges: [0x18240f, 0x243219, 0x30401f],
};

/**
 * Five chambers: an approach, three grunt encounters that thicken in
 * sequence, and Vyaghri's arena. The same 3.8 gap gates 1–4 measured their
 * reserve against.
 */
const SEGMENTS = [
  // Approach: nothing to fight yet, room to read the realm.
  { x0: -6, x1: 28, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // The den: three raakchyas, nothing else — density without a new enemy.
  { x0: 31.8, x1: 66, top: 0, boulders: 3, pillars: 3, crystals: 1 },

  // The herd: raakchyas and a charger together for the first time since both
  // were taught separately.
  { x0: 69.8, x1: 104, top: 0, boulders: 4, pillars: 2, crystals: 2 },

  // The stampede: the densest pre-Warden encounter in the campaign so far.
  { x0: 107.8, x1: 140, top: 0, boulders: 3, pillars: 3, crystals: 2 },

  // Vyaghri's arena — long and flat, the same reason gate 2's far bank is:
  // a triple chain charge needs room to run three times.
  { x0: 143.8, x1: 185, top: ARENA_TOP, boulders: 2, pillars: 2, crystals: 2, thickness: 6 },
];

/**
 * Tiryak-lok's Warden: an existing archetype, elevated. `VYAGHRI` extends
 * `CHARGER` in `src/game/config.js` — the same relationship `KEVAT` has to
 * it — so the archetype named here is `charger`, not a fifth.
 */
const WARDEN = {
  archetype: 'charger',
  title: STRINGS.GATE5_WARDEN_TITLE,
  stats: VYAGHRI,
};

/**
 * Four encounters: three grunt fights that grow denser in sequence, then the
 * Warden, met alone — the same solo shape every Warden fight in the campaign
 * has used so far.
 */
const ENCOUNTERS = [
  {
    id: 'the-den',
    trigger: 40,
    lock: [33, 64],
    intro: {
      title: STRINGS.GATE5_DEN_TITLE,
      body: STRINGS.GATE5_DEN_BODY,
    },
    spawns: [
      { type: 'raakchyas', x: 46, delay: 0 },
      { type: 'raakchyas', x: 54, delay: 0.4 },
      { type: 'raakchyas', x: 60, delay: 0.9 },
    ],
  },
  {
    id: 'the-herd',
    trigger: 80,
    lock: [71, 102],
    intro: {
      title: STRINGS.GATE5_HERD_TITLE,
      body: STRINGS.GATE5_HERD_BODY,
    },
    spawns: [
      { type: 'charger', x: 88, delay: 0 },
      { type: 'raakchyas', x: 80, delay: 0.6 },
      { type: 'raakchyas', x: 96, delay: 1.1 },
    ],
  },
  {
    id: 'the-stampede',
    trigger: 118,
    lock: [109, 138],
    intro: {
      title: STRINGS.GATE5_STAMPEDE_TITLE,
      body: STRINGS.GATE5_STAMPEDE_BODY,
    },
    spawns: [
      { type: 'charger', x: 116, delay: 0 },
      { type: 'charger', x: 132, delay: 0.5 },
      { type: 'raakchyas', x: 122, delay: 1.0 },
      { type: 'raakchyas', x: 128, delay: 1.5 },
      { type: 'raakchyas', x: 135, delay: 2.0 },
    ],
  },
  {
    id: 'vyaghri',
    trigger: 160,
    lock: [145, 184],
    boss: true,
    intro: { title: STRINGS.GATE5_VYAGHRI_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 168, delay: 0.9 }],
  },
];

/**
 * Two boundary beats, the same shape every gate since 2 uses.
 */
const BEATS = [
  {
    at: 'enter',
    title: STRINGS.GATE5_BEAT_ENTER_TITLE,
    big: STRINGS.GATE5_BEAT_ENTER_BIG,
    body: STRINGS.GATE5_BEAT_ENTER_BODY,
  },
  {
    at: 'cleared',
    title: STRINGS.GATE5_BEAT_CLEARED_TITLE,
    big: STRINGS.GATE5_BEAT_CLEARED_BIG,
    body: STRINGS.GATE5_BEAT_CLEARED_BODY,
  },
];

export const GATE_5 = {
  id: 'gate-5',
  name: STRINGS.GATE5_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  voidY: -26,
  arenaTop: ARENA_TOP,
  exitX: 175,
  end: 185,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
