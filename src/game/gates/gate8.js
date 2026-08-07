// Gate 8 — Deva-lok.
//
// The devas, and per `docs/SPEC-CAMPAIGN.md`'s table the art direction's own
// payoff: "the most beautiful gate in the game, and the palette returns to
// gate 1's pastel... arriving as an echo." No new archetype arrives here
// either — the job this gate does is the same one gates 6 and 7 did, combine
// what earlier gates already taught (raakchyas, bhoot-batti, kawach, tantrik)
// into a realm that reads as radiant rather than as denser, before
// Chiranjivi — the Long-Lived, the campaign's fourth and final Guardian-class
// boss before gate 10 — closes it. The realm does not fight harder than
// Manav-lok or Asura-lok; it fights *prettier*, and refuses to notice
// anything is wrong, which is the whole point `docs/SPEC-CAMPAIGN.md` makes
// about it.
//
// Flat throughout, like every gate since the crossing: the same 3.8-unit
// gap, the same measured 26% reserve against this build's running jump.

import { CHIRANJIVI } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Light, cloud, pastel — per `docs/SPEC-CAMPAIGN.md`'s table, echoing gate
 * 1's violet rather than any of the iron, pale or brass registers between
 * them. `crystal` doubles as Chiranjivi's own `devaCore` gold, the same
 * trick every prior gate's crystal accent plays against its boss's core.
 */
const REALM = {
  sky: { zenith: 0x2e2a5c, mid: 0x6a72c9, horizon: 0xf2d9ff },
  fog: { color: 0xd9c9ff, near: 30, far: 140 },

  grass: 0xcfe0f5,
  grassBlade: 0xe8f0ff,
  grassBladeTip: 0xfff6e0,
  rock: 0xb9b8d9,
  rockDark: 0x8783ab,
  rockMoss: 0xc9d9c0,
  stone: 0xd9d2f0,
  crystal: 0xffe9a8,

  mist: { back: 0xf2e5ff, front: 0xc9b8e8 },
  ridges: [0x8783ab, 0xa89fc9, 0xc9b8e8],
};

/**
 * Four chambers, every gap the same 3.8 gates 2–7 already measured their
 * reserve against. Flat throughout — a court of light has no summit to
 * offer, and gate 1 already owns the climb.
 */
const SEGMENTS = [
  // Approach: nothing to fight yet, room to read the realm.
  { x0: -6, x1: 28, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // The terrace: raakchyas and bhoot-batti together, both already taught in
  // gate 1, met here in a setting neither was met in before.
  { x0: 31.8, x1: 68, top: 0, boulders: 3, pillars: 3, crystals: 1 },

  // The garden: kawach and tantrik, taught alone in gates 3 and 4, sharing a
  // fight for the first time here — plus a raakchyas, so the queue is never
  // just the two newer tells.
  { x0: 71.8, x1: 108, top: 0, boulders: 3, pillars: 2, crystals: 2 },

  // Chiranjivi's chamber — long and flat, the same reason every prior boss
  // arena is: a three-part melee kit needs room to close and to recover in.
  { x0: 111.8, x1: 155, top: ARENA_TOP, boulders: 2, pillars: 2, crystals: 2, thickness: 6 },
];

/**
 * Deva-lok's Warden: the campaign's fourth boss. `Chiranjivi extends Boss` in
 * `src/game/boss.js`; bespoke numbers and its own rig, the same relationship
 * the Hakim has to the Goru-Mukh.
 */
const WARDEN = {
  archetype: 'chiranjivi',
  title: STRINGS.GATE8_WARDEN_TITLE,
  stats: CHIRANJIVI,
};

/**
 * Three encounters: two grunt fights that combine what earlier gates taught
 * separately, then the Warden, met alone — the same solo shape every Warden
 * fight in the campaign has used so far.
 */
const ENCOUNTERS = [
  {
    id: 'the-terrace',
    trigger: 40,
    lock: [33, 66],
    intro: {
      title: STRINGS.GATE8_TERRACE_TITLE,
      body: STRINGS.GATE8_TERRACE_BODY,
    },
    spawns: [
      { type: 'raakchyas', x: 46, delay: 0 },
      { type: 'bhootBatti', x: 52, delay: 0.6 },
      { type: 'raakchyas', x: 60, delay: 1.1 },
    ],
  },
  {
    id: 'the-garden',
    trigger: 80,
    lock: [73, 106],
    intro: {
      title: STRINGS.GATE8_GARDEN_TITLE,
      body: STRINGS.GATE8_GARDEN_BODY,
    },
    spawns: [
      { type: 'kawach', x: 88, delay: 0 },
      { type: 'tantrik', x: 96, delay: 0.6 },
      { type: 'raakchyas', x: 82, delay: 1.2 },
    ],
  },
  {
    id: 'chiranjivi',
    trigger: 130,
    lock: [113, 154],
    boss: true,
    intro: { title: STRINGS.GATE8_CHIRANJIVI_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 135, delay: 0.9 }],
  },
];

/**
 * Two boundary beats, the same shape every gate since 2 uses.
 */
const BEATS = [
  {
    at: 'enter',
    title: STRINGS.GATE8_BEAT_ENTER_TITLE,
    big: STRINGS.GATE8_BEAT_ENTER_BIG,
    body: STRINGS.GATE8_BEAT_ENTER_BODY,
  },
  {
    at: 'cleared',
    title: STRINGS.GATE8_BEAT_CLEARED_TITLE,
    big: STRINGS.GATE8_BEAT_CLEARED_BIG,
    body: STRINGS.GATE8_BEAT_CLEARED_BODY,
  },
];

export const GATE_8 = {
  id: 'gate-8',
  name: STRINGS.GATE8_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  voidY: -26,
  arenaTop: ARENA_TOP,
  exitX: 145,
  end: 155,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
