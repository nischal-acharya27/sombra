// Gate 4 — Preta-lok.
//
// The hungry ghosts. `docs/SPEC-CAMPAIGN.md` is explicit about the register:
// pale and bright, deliberately, against Naraka's dark, and pretas are drawn
// sympathetically — waiting for something that stopped coming, not malice.
//
// Two new things arrive here. Tantrik, the summoner whose entire threat is
// the queue of raakchyas it keeps raising — met alone first, same shape as
// gate 3's Kawach, so `GATE4_TANTRIK_NOTE` teaches "prioritise it" before it
// is ever inferred out of a crowd. And Atripta — The Unfilled — Preta-lok's
// Warden: an elevated Tantrik per `docs/SPEC-CAMPAIGN.md`'s "Wardens are
// configuration, not code," not a fourth boss (only gates 3, 6, 8 and 10 are
// boss-tier).
//
// Flat throughout, like the crossing and Naraka: the same 3.8-unit gap, the
// same measured 26% reserve against this build's running jump.

import { ATRIPTA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Pale dust, washed out — per `docs/SPEC-CAMPAIGN.md`'s table, and
 * deliberately the opposite register from gate 3's iron and red-black. The
 * sigil's own pale lavender (`P.tantrikSigil`) doubles as the one accent
 * colour, the same trick every realm's crystal plays.
 */
const REALM = {
  sky: { zenith: 0xcfd6e8, mid: 0xd8ceb8, horizon: 0xe8dcc4 },
  fog: { color: 0xd4c9ae, near: 24, far: 122 },

  // Ash-pale ground rather than cinder or turf — a floor nothing is fed by.
  grass: 0xbdb49c,
  grassBlade: 0xa89f86,
  grassBladeTip: 0xe4d9ff,
  rock: 0x9a927c,
  rockDark: 0x6e6558,
  rockMoss: 0x8a8268,
  stone: 0xaba296,
  crystal: 0xe4d9ff,

  mist: { back: 0xe4dbc4, front: 0xc9bd9e },
  ridges: [0x8a8268, 0xa89f86, 0xbdb49c],
};

/**
 * Four chambers, the same 3.8 gap gates 1–3 measured their reserve against.
 * Flat throughout: a realm of waiting has no summit to offer.
 */
const SEGMENTS = [
  // Approach: nothing to fight yet, room to read the realm.
  { x0: -6, x1: 28, top: 0, boulders: 2, pillars: 2, crystals: 1 },

  // Tantrik's chamber: sealed, and nothing else spawns in it — the same
  // isolation gate 3 gave Kawach.
  { x0: 31.8, x1: 64, top: 0, boulders: 2, pillars: 3, crystals: 1 },

  // The waiting chamber: Tantrik alongside what gate 1 already taught.
  { x0: 67.8, x1: 104, top: 0, boulders: 3, pillars: 2, crystals: 2 },

  // Atripta's arena — long, flat, nowhere for a queue to hide.
  { x0: 107.8, x1: 150, top: ARENA_TOP, boulders: 2, pillars: 2, crystals: 2, thickness: 6 },
];

/**
 * Preta-lok's Warden: an existing archetype, elevated. `ATRIPTA` extends
 * `TANTRIK` in `src/game/config.js` — the same relationship `KEVAT` has to
 * `CHARGER` — so the archetype named here is `tantrik`, not a fourth boss.
 */
const WARDEN = {
  archetype: 'tantrik',
  title: STRINGS.GATE4_WARDEN_TITLE,
  stats: ATRIPTA,
};

/**
 * Three encounters: Tantrik alone, Tantrik alongside a raakchyas pair already
 * taught in gate 1, then the Warden. `tools/gatecheck.js`'s `soloDebut` check
 * makes "alone" a fact rather than an intention.
 */
const ENCOUNTERS = [
  {
    id: 'tantrik-alone',
    trigger: 40,
    lock: [33, 62],
    intro: {
      title: STRINGS.GATE4_TANTRIK_TITLE,
      body: STRINGS.GATE4_TANTRIK_BODY,
      note: STRINGS.GATE4_TANTRIK_NOTE,
    },
    spawns: [{ type: 'tantrik', x: 50, delay: 0.3 }],
  },
  {
    id: 'the-waiting',
    trigger: 76,
    lock: [69, 102],
    intro: {
      title: STRINGS.GATE4_WAITING_TITLE,
      body: STRINGS.GATE4_WAITING_BODY,
    },
    spawns: [
      { type: 'tantrik', x: 85, delay: 0 },
      { type: 'raakchyas', x: 80, delay: 1.0 },
      { type: 'raakchyas', x: 92, delay: 1.8 },
    ],
  },
  {
    id: 'atripta',
    trigger: 120,
    lock: [109, 149],
    boss: true,
    intro: { title: STRINGS.GATE4_ATRIPTA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 135, delay: 0.9 }],
  },
];

/**
 * Two boundary beats, the same shape gates 2 and 3 use.
 */
const BEATS = [
  {
    at: 'enter',
    title: STRINGS.GATE4_BEAT_ENTER_TITLE,
    big: STRINGS.GATE4_BEAT_ENTER_BIG,
    body: STRINGS.GATE4_BEAT_ENTER_BODY,
  },
  {
    at: 'cleared',
    title: STRINGS.GATE4_BEAT_CLEARED_TITLE,
    big: STRINGS.GATE4_BEAT_CLEARED_BIG,
    body: STRINGS.GATE4_BEAT_CLEARED_BODY,
  },
];

export const GATE_4 = {
  id: 'gate-4',
  name: STRINGS.GATE4_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  voidY: -26,
  arenaTop: ARENA_TOP,
  exitX: 140,
  end: 150,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
