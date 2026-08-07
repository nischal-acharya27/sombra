// Gate 6 — Manav-lok.
//
// The human realm, and per `docs/SPEC-CAMPAIGN.md`'s table the campaign's
// hinge: the only realm from which liberation is doctrinally possible, and
// "the first real conversation in the game" — the beat where the hunter
// learns Yama stopped. No new archetype arrives here; the job this gate does
// is combine everything gates 1–4 already taught (raakchyas, bhoot-batti,
// charger's cousin kawach, tantrik) into a city that looks like home and
// reads as subtly wrong, before Hakim — the Magistrate, the campaign's third
// Guardian-class boss per `docs/DECISIONS.md`'s locked table — closes it.
//
// Flat throughout, like every gate since the crossing: the same 3.8-unit
// gap, the same measured 26% reserve against this build's running jump.
//
// The realm's own wrongness is carried by `GATE6_BEAT_ENTER_BODY` rather than
// anything mechanical — "every door here opens, nothing behind them is
// right" is a line, not a system, matching how gate 4 stayed sympathetic
// through text rather than through a changed rule.

import { HAKIM } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Warm brass and amber, per `docs/SPEC-CAMPAIGN.md`'s "warm, familiar,
 * wrong" — a palette that reads as a sunlit city rather than the iron of
 * Naraka or the choked green of Tiryak-lok. `crystal` doubles as Hakim's own
 * `manavCore` amber, the same trick every prior gate's crystal accent plays
 * against its boss's core.
 */
const REALM = {
  sky: { zenith: 0x3a2a1c, mid: 0x7a5a34, horizon: 0xd9a05c },
  fog: { color: 0x8a6a44, near: 20, far: 110 },

  grass: 0x6a5636,
  grassBlade: 0x8a7248,
  grassBladeTip: 0xd9b878,
  rock: 0x5a4a30,
  rockDark: 0x2e2418,
  rockMoss: 0x6a5a36,
  stone: 0x7a6238,
  crystal: 0xf2b23c,

  mist: { back: 0x8a6a44, front: 0x4a3a24 },
  ridges: [0x2e2418, 0x4a3a24, 0x5a4a30],
};

/**
 * Four chambers, every gap the same 3.8 gates 2–5 already measured their
 * reserve against. Flat throughout — a city street has no summit to offer,
 * and gate 1 already owns the climb.
 */
const SEGMENTS = [
  // Approach: nothing to fight yet, room to read the realm.
  { x0: -6, x1: 28, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // The market: raakchyas and bhoot-batti together, both already taught in
  // gate 1, met here in a setting neither was met in before.
  { x0: 31.8, x1: 68, top: 0, boulders: 3, pillars: 3, crystals: 1 },

  // The antechamber: kawach and tantrik, taught alone in gates 3 and 4,
  // sharing a fight for the first time — plus a raakchyas, so the queue is
  // never just the two newer tells.
  { x0: 71.8, x1: 108, top: 0, boulders: 3, pillars: 2, crystals: 2 },

  // Hakim's chamber — long and flat, the same reason every prior boss arena
  // is: a three-part melee kit needs room to close and to recover in.
  { x0: 111.8, x1: 155, top: ARENA_TOP, boulders: 2, pillars: 2, crystals: 2, thickness: 6 },
];

/**
 * Manav-lok's Warden: the campaign's third boss. `Hakim extends Boss` in
 * `src/game/boss.js`; bespoke numbers and its own rig, the same relationship
 * the Goru-Mukh has to the Dwar-Rakshak.
 */
const WARDEN = {
  archetype: 'hakim',
  title: STRINGS.GATE6_WARDEN_TITLE,
  stats: HAKIM,
};

/**
 * Three encounters: two grunt fights that combine what earlier gates taught
 * separately, then the Warden, met alone — the same solo shape every Warden
 * fight in the campaign has used so far.
 */
const ENCOUNTERS = [
  {
    id: 'the-market',
    trigger: 40,
    lock: [33, 66],
    intro: {
      title: STRINGS.GATE6_MARKET_TITLE,
      body: STRINGS.GATE6_MARKET_BODY,
    },
    spawns: [
      { type: 'raakchyas', x: 46, delay: 0 },
      { type: 'bhootBatti', x: 52, delay: 0.6 },
      { type: 'raakchyas', x: 60, delay: 1.1 },
    ],
  },
  {
    id: 'the-antechamber',
    trigger: 80,
    lock: [73, 106],
    intro: {
      title: STRINGS.GATE6_ANTECHAMBER_TITLE,
      body: STRINGS.GATE6_ANTECHAMBER_BODY,
    },
    spawns: [
      { type: 'kawach', x: 88, delay: 0 },
      { type: 'tantrik', x: 96, delay: 0.6 },
      { type: 'raakchyas', x: 82, delay: 1.2 },
    ],
  },
  {
    id: 'hakim',
    trigger: 130,
    lock: [113, 154],
    boss: true,
    intro: { title: STRINGS.GATE6_HAKIM_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 135, delay: 0.9 }],
  },
];

/**
 * Two boundary beats. The `cleared` one breaks from every prior gate's own
 * "THE SYSTEM" framing on purpose — see its comment in `strings.js` — because
 * this is the beat `docs/SPEC-CAMPAIGN.md` names as the campaign's hinge.
 */
const BEATS = [
  {
    at: 'enter',
    title: STRINGS.GATE6_BEAT_ENTER_TITLE,
    big: STRINGS.GATE6_BEAT_ENTER_BIG,
    body: STRINGS.GATE6_BEAT_ENTER_BODY,
  },
  {
    at: 'cleared',
    title: STRINGS.GATE6_BEAT_CLEARED_TITLE,
    big: STRINGS.GATE6_BEAT_CLEARED_BIG,
    body: STRINGS.GATE6_BEAT_CLEARED_BODY,
  },
];

export const GATE_6 = {
  id: 'gate-6',
  name: STRINGS.GATE6_NAME,
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
