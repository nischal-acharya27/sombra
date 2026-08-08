// Gate 10 — Bhavachakra, the Wheel.
//
// Per `docs/SPEC-CAMPAIGN.md`'s table: "every palette bleeding" — not a
// tenth register but the nine before it un-sorted into one sky, because
// this is where they all lead rather than one more place among them. No new
// archetype arrives here either — the job this gate does is the one gates
// 6, 7, 8 and 9 already did, recombine everything the campaign taught, one
// last time, before Maun-Ankur — What Grew In The Stillness, the fourth and
// final Guardian-class boss `docs/DECISIONS.md`'s locked table names — closes
// the campaign. The Wheel itself is not a mechanic; the chaya's release and
// Yama taking the office back up are carried by `GATE10_BEAT_CLEARED_BODY`
// and the run-end screen, the same "a line, not a system" approach every
// prior narrative beat in the campaign has used — see the handoff note in
// `docs/DECISIONS.md` for what this deliberately leaves open.
//
// Flat throughout, like every gate since the crossing: the same 3.8-unit
// gap, the same measured 26% reserve against this build's running jump.

import { MAUN_ANKUR } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Every register the campaign has spent, read together rather than chosen
 * between: Naraka's iron, Yama-sabha's violet, Deva-lok's pastel, in one
 * sky. `crystal` doubles as Maun-Ankur's own `wheelCore`, the same trick
 * every prior gate's crystal accent plays against its boss's core.
 */
const REALM = {
  sky: { zenith: 0x1c1030, mid: 0x6a2e4a, horizon: 0xf2a35c },
  fog: { color: 0x4a2c48, near: 22, far: 128 },

  grass: 0x4a3648,
  grassBlade: 0x6a4a5c,
  grassBladeTip: 0xd98a5c,
  rock: 0x3a2838,
  rockDark: 0x1a1220,
  rockMoss: 0x4a4038,
  stone: 0x5a3e52,
  crystal: 0xc25cff,

  mist: { back: 0x6a2e4a, front: 0x2e1830 },
  ridges: [0x1a1220, 0x3a2838, 0x5a3e52],
};

/**
 * Four chambers, every gap the same 3.8 gates 2–9 already measured their
 * reserve against. Flat throughout — the Wheel has no summit to offer, and
 * gate 1 already owns the climb.
 */
const SEGMENTS = [
  // Approach: nothing to fight yet, room to read the realm.
  { x0: -6, x1: 28, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // The rim: raakchyas and bhoot-batti together, both already taught in
  // gate 1, met here on the last ground before the hub.
  { x0: 31.8, x1: 68, top: 0, boulders: 3, pillars: 3, crystals: 1 },

  // The spokes: every archetype the campaign has taught in one fight —
  // charger, kawach, tantrik, raakchyas — the same widest-roster shape gate
  // 9's nine thrones used, short of gate 7's own claim to the densest one.
  { x0: 71.8, x1: 108, top: 0, boulders: 3, pillars: 4, crystals: 2 },

  // The hub — Maun-Ankur's chamber, long and flat, the same reason every
  // prior Warden arena is: room to read a wind-up and room to answer it.
  { x0: 111.8, x1: 155, top: ARENA_TOP, boulders: 2, pillars: 2, crystals: 2, thickness: 6 },
];

/**
 * The Wheel's Warden: the campaign's fourth and final boss. `MaunAnkur
 * extends Boss` in `src/game/boss.js`; bespoke numbers and its own rig, the
 * same relationship the Chiranjivi has to the Hakim.
 */
const WARDEN = {
  archetype: 'maunAnkur',
  title: STRINGS.GATE10_WARDEN_TITLE,
  stats: MAUN_ANKUR,
};

/**
 * Three encounters: two grunt fights that recombine what earlier gates
 * taught, then the Warden, met alone — the same solo shape every Warden
 * fight in the campaign has used so far.
 */
const ENCOUNTERS = [
  {
    id: 'the-rim',
    trigger: 40,
    lock: [33, 66],
    intro: {
      title: STRINGS.GATE10_RIM_TITLE,
      body: STRINGS.GATE10_RIM_BODY,
    },
    spawns: [
      { type: 'raakchyas', x: 46, delay: 0 },
      { type: 'bhootBatti', x: 52, delay: 0.6 },
      { type: 'raakchyas', x: 60, delay: 1.1 },
    ],
  },
  {
    id: 'the-spokes',
    trigger: 80,
    lock: [73, 106],
    intro: {
      title: STRINGS.GATE10_SPOKES_TITLE,
      body: STRINGS.GATE10_SPOKES_BODY,
    },
    spawns: [
      { type: 'charger', x: 82, delay: 0 },
      { type: 'kawach', x: 90, delay: 0.5 },
      { type: 'tantrik', x: 98, delay: 1.0 },
      { type: 'raakchyas', x: 86, delay: 1.5 },
    ],
  },
  {
    id: 'maun-ankur',
    trigger: 130,
    lock: [113, 154],
    boss: true,
    intro: { title: STRINGS.GATE10_MAUNANKUR_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 135, delay: 0.9 }],
  },
];

/**
 * Two boundary beats. `cleared` breaks from "THE SYSTEM" the same way gates
 * 6 and 9 did at their own hinge moments — the campaign's last one belongs
 * to the chaya, not to a report about it.
 */
const BEATS = [
  {
    at: 'enter',
    title: STRINGS.GATE10_BEAT_ENTER_TITLE,
    big: STRINGS.GATE10_BEAT_ENTER_BIG,
    body: STRINGS.GATE10_BEAT_ENTER_BODY,
  },
  {
    at: 'cleared',
    title: STRINGS.GATE10_BEAT_CLEARED_TITLE,
    big: STRINGS.GATE10_BEAT_CLEARED_BIG,
    body: STRINGS.GATE10_BEAT_CLEARED_BODY,
  },
];

export const GATE_10 = {
  id: 'gate-10',
  name: STRINGS.GATE10_NAME,
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
