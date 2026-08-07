// Gate 3 — Naraka.
//
// The first hard evidence the Wheel has stopped: a processing floor for souls
// awaiting judgment, and the queue has not moved. `docs/SPEC-CAMPAIGN.md` is
// explicit about the register — a bureaucracy that broke, not a torture
// chamber — so the beats below name a jam rather than a horror.
//
// Two new things arrive here. Kawach, the armoured grunt whose whole idea is
// that most of the move list does nothing to it — met alone first, same as
// the crossing taught the charger alone, so the tell (`GATE3_KAWACH_NOTE`) is
// learned before it is ever inferred out of a crowd. And Goru-Mukh, the
// gate's Warden and the campaign's second boss — see `Boss` in
// `src/game/boss.js` for what it shares with the Dwar-Rakshak and what it
// does not.
//
// Flat throughout, like the crossing: three chambers and the arena, joined by
// the same 3.8-unit gap gate 1 and gate 2 both settled on, which is the
// measured 26% reserve against this build's running jump. Nothing here climbs
// — Naraka is a floor to be processed on, not a summit.

import { GORU_MUKH } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Iron and red-black, per `docs/SPEC-CAMPAIGN.md`'s table. Where gate 1's fog
 * is violet and gate 2's is grey-blue, this one is ember behind a haze of
 * rust — the crystal accent doubles as the one warm colour in the realm, the
 * same trick gate 1's violet crystal and gate 2's cyan one both play.
 */
const REALM = {
  sky: { zenith: 0x120606, mid: 0x3a1210, horizon: 0x8a3420 },
  fog: { color: 0x4a1c14, near: 22, far: 118 },

  // Cinder and ash rather than grass — the same fields, the realm's own tone.
  grass: 0x3a2420,
  grassBlade: 0x5a2e22,
  grassBladeTip: 0xb5502c,
  rock: 0x4a2e28,
  rockDark: 0x241412,
  rockMoss: 0x6a2c1a,
  stone: 0x5c3a34,
  crystal: 0xff5a3a,

  mist: { back: 0x8a4030, front: 0x4a1c14 },
  ridges: [0x241412, 0x3a2018, 0x4a2820],
};

/**
 * Four chambers, every gap 3.8 — the same figure gate 1 and gate 2 measured
 * their reserve against, so nothing here needed re-deriving. Flat throughout:
 * a processing floor has no summit to offer, and gate 1 already owns the
 * climb.
 */
const SEGMENTS = [
  // Approach: nothing to fight yet, room to read the realm.
  { x0: -6, x1: 28, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // Kawach's chamber: sealed, and nothing else spawns in it — the same
  // isolation gate 2's causeway gave the charger.
  { x0: 31.8, x1: 64, top: 0, boulders: 2, pillars: 3, crystals: 1 },

  // The mixed chamber: Kawach alongside what gate 1 already taught.
  { x0: 67.8, x1: 104, top: 0, boulders: 3, pillars: 2, crystals: 2 },

  // Goru-Mukh's arena — long, flat, nowhere to run.
  { x0: 107.8, x1: 150, top: ARENA_TOP, boulders: 2, pillars: 2, crystals: 2, thickness: 6 },
];

/**
 * Naraka's Warden: the campaign's second boss. `GoruMukh extends Boss` in
 * `src/game/boss.js`; the numbers are its own rather than the Dwar-Rakshak's
 * elevated, because a boss is bespoke by definition — see `CONTEXT.md`.
 */
const WARDEN = {
  archetype: 'goruMukh',
  title: STRINGS.GATE3_WARDEN_TITLE,
  stats: GORU_MUKH,
};

/**
 * Three encounters: Kawach alone, Kawach alongside a raakchyas pair, then the
 * Warden. `tools/gatecheck.js`'s `soloDebut` check is what makes "alone" a
 * fact rather than an intention — Kawach's kind is the only one in the first
 * encounter's spawn list, so it is met and read before it is ever asked to
 * share a fight.
 */
const ENCOUNTERS = [
  {
    id: 'kawach-alone',
    trigger: 40,
    lock: [33, 62],
    intro: {
      title: STRINGS.GATE3_KAWACH_TITLE,
      body: STRINGS.GATE3_KAWACH_BODY,
      note: STRINGS.GATE3_KAWACH_NOTE,
    },
    spawns: [{ type: 'kawach', x: 50, delay: 0.3 }],
  },
  {
    id: 'the-queue',
    trigger: 76,
    lock: [69, 102],
    intro: {
      title: STRINGS.GATE3_PROCESSING_TITLE,
      body: STRINGS.GATE3_PROCESSING_BODY,
    },
    spawns: [
      { type: 'kawach', x: 85, delay: 0 },
      { type: 'raakchyas', x: 80, delay: 1.0 },
      { type: 'raakchyas', x: 92, delay: 1.8 },
    ],
  },
  {
    id: 'goru-mukh',
    trigger: 120,
    lock: [109, 149],
    boss: true,
    intro: { title: STRINGS.GATE3_GORUMUKH_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 135, delay: 0.9 }],
  },
];

/**
 * Two boundary beats, the same shape gate 2's own take: the System naming
 * what it sees on arrival, and a shorter line once the Warden is down.
 * Naraka is not the glitch gate2's crossing was — the realm is already
 * catalogued (`docs/DECISIONS.md`'s naming table: unchanged, already Nepali)
 * — so neither beat carries `glitch`.
 */
const BEATS = [
  {
    at: 'enter',
    title: STRINGS.GATE3_BEAT_ENTER_TITLE,
    big: STRINGS.GATE3_BEAT_ENTER_BIG,
    body: STRINGS.GATE3_BEAT_ENTER_BODY,
  },
  {
    at: 'cleared',
    title: STRINGS.GATE3_BEAT_CLEARED_TITLE,
    big: STRINGS.GATE3_BEAT_CLEARED_BIG,
    body: STRINGS.GATE3_BEAT_CLEARED_BODY,
  },
];

export const GATE_3 = {
  id: 'gate-3',
  name: STRINGS.GATE3_NAME,
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
