// Gate 7 — Asura-lok.
//
// The asuras. `docs/SPEC-CAMPAIGN.md` names it "the most fight-dense gate" and
// is explicit that no new archetype arrives here: "war without end over
// something neither side remembers... they do not know the Wheel stopped and
// would not care." So the job this gate does is not teaching a new tell — it
// is throwing every archetype gates 1–4 already taught (raakchyas, charger,
// kawach, tantrik, bhoot-batti) into denser and denser combined fights, ending
// in the densest pre-Warden encounter the campaign has built, before
// Amar-Yoddha — the Ever-Warring, an existing archetype elevated a third
// time — closes it.
//
// Flat throughout, like every gate since the crossing: the same 3.8-unit
// gap, the same measured 26% reserve against this build's running jump.

import { AMAR_YODDHA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Gold and blood-orange, per `docs/SPEC-CAMPAIGN.md`'s table — a battlefield
 * lit like a wound that never closes, against gate 6's warm brass and gate
 * 5's choked green.
 */
const REALM = {
  sky: { zenith: 0x2c0e08, mid: 0x7a2c10, horizon: 0xd97a2c },
  fog: { color: 0x8a3a18, near: 18, far: 100 },

  grass: 0x5a2c14,
  grassBlade: 0x7a3c18,
  grassBladeTip: 0xd9822c,
  rock: 0x4a2410,
  rockDark: 0x241005,
  rockMoss: 0x5a3018,
  stone: 0x5e2c12,
  crystal: 0xf2942c,

  mist: { back: 0x7a3418, front: 0x3a1808 },
  ridges: [0x241005, 0x3a1808, 0x4a2410],
};

/**
 * Five chambers: an approach, three grunt encounters that grow denser and
 * combine more archetypes each time, and Amar-Yoddha's arena. The same 3.8
 * gap gates 1–5 already measured their reserve against.
 */
const SEGMENTS = [
  // Approach: nothing to fight yet, room to read the realm.
  { x0: -6, x1: 28, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // The vanguard: raakchyas and charger together, the combination gate 5
  // already taught, met here for the first time on this gate's own ground.
  { x0: 31.8, x1: 64, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // The line: kawach planted two abreast, with a raakchyas pressing behind
  // them — an armoured front rather than a lone shield.
  { x0: 67.8, x1: 100, top: 0, boulders: 3, pillars: 3, crystals: 1 },

  // The melee: every archetype the campaign has taught, together — the
  // densest pre-Warden encounter the campaign has built.
  { x0: 103.8, x1: 140, top: 0, boulders: 4, pillars: 3, crystals: 2 },

  // Amar-Yoddha's arena — long and flat, the same reason the Kevat's far
  // bank and the Pack-Mother's own arena are: a chained charge needs room to
  // run four times.
  { x0: 143.8, x1: 185, top: ARENA_TOP, boulders: 2, pillars: 2, crystals: 2, thickness: 6 },
];

/**
 * Asura-lok's Warden: an existing archetype, elevated a third time.
 * `AMAR_YODDHA` extends `CHARGER` in `src/game/config.js` — the same
 * relationship `KEVAT` and `VYAGHRI` already have to it — so the archetype
 * named here is `charger`, not a fourth.
 */
const WARDEN = {
  archetype: 'charger',
  title: STRINGS.GATE7_WARDEN_TITLE,
  stats: AMAR_YODDHA,
};

/**
 * Four encounters: three grunt fights that grow denser and combine more of
 * the campaign's archetypes each time, then the Warden, met alone — the same
 * solo shape every Warden fight in the campaign has used so far.
 */
const ENCOUNTERS = [
  {
    id: 'the-vanguard',
    trigger: 40,
    lock: [33, 62],
    intro: {
      title: STRINGS.GATE7_VANGUARD_TITLE,
      body: STRINGS.GATE7_VANGUARD_BODY,
    },
    spawns: [
      { type: 'raakchyas', x: 44, delay: 0 },
      { type: 'charger', x: 52, delay: 0.4 },
      { type: 'raakchyas', x: 58, delay: 0.9 },
    ],
  },
  {
    id: 'the-line',
    trigger: 80,
    lock: [69, 98],
    intro: {
      title: STRINGS.GATE7_LINE_TITLE,
      body: STRINGS.GATE7_LINE_BODY,
    },
    spawns: [
      { type: 'kawach', x: 82, delay: 0 },
      { type: 'kawach', x: 90, delay: 0.4 },
      { type: 'raakchyas', x: 86, delay: 1.0 },
    ],
  },
  {
    id: 'the-melee',
    trigger: 118,
    lock: [105, 138],
    intro: {
      title: STRINGS.GATE7_MELEE_TITLE,
      body: STRINGS.GATE7_MELEE_BODY,
    },
    spawns: [
      { type: 'charger', x: 112, delay: 0 },
      { type: 'kawach', x: 120, delay: 0.4 },
      { type: 'tantrik', x: 132, delay: 0.8 },
      { type: 'raakchyas', x: 116, delay: 1.2 },
      { type: 'raakchyas', x: 126, delay: 1.6 },
      { type: 'bhootBatti', x: 134, delay: 2.0 },
    ],
  },
  {
    id: 'amar-yoddha',
    trigger: 160,
    lock: [145, 184],
    boss: true,
    intro: { title: STRINGS.GATE7_YODDHA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 168, delay: 0.9 }],
  },
];

/**
 * Two boundary beats, the same shape every gate since 2 uses.
 */
const BEATS = [
  {
    at: 'enter',
    title: STRINGS.GATE7_BEAT_ENTER_TITLE,
    big: STRINGS.GATE7_BEAT_ENTER_BIG,
    body: STRINGS.GATE7_BEAT_ENTER_BODY,
  },
  {
    at: 'cleared',
    title: STRINGS.GATE7_BEAT_CLEARED_TITLE,
    big: STRINGS.GATE7_BEAT_CLEARED_BIG,
    body: STRINGS.GATE7_BEAT_CLEARED_BODY,
  },
];

export const GATE_7 = {
  id: 'gate-7',
  name: STRINGS.GATE7_NAME,
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
