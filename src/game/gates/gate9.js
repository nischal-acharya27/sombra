// Gate 9 — Yama-sabha.
//
// Yama's court, per `docs/SPEC-CAMPAIGN.md`'s table: "Ten thrones, nine
// empty. Yama is present and does not fight. The Warden is The Backlog — the
// accumulated unjudged given shape — so the fight is against what his
// absence made rather than against him." No new archetype arrives here
// either — the job this gate does is the same one gates 6, 7 and 8 did,
// combine what earlier gates already taught (raakchyas, bhoot-batti, charger,
// kawach, tantrik — every archetype the campaign has, now that gate 7 taught
// the last combination) into a hall built for judgment nobody is rendering,
// before Bakaya — the Backlog, a second elevation of the summoner line
// `ATRIPTA` began, per `docs/DECISIONS.md`'s locked table — closes it.
//
// Flat throughout, like every gate since the crossing: the same 3.8-unit
// gap, the same measured 26% reserve against this build's running jump.
//
// Yama's own presence is carried by `GATE9_BEAT_ENTER_BODY` rather than
// anything mechanical, the same way gate 6's wrongness and gate 4's sympathy
// were: a line, not a system. He is not an entity the hunter can target —
// there is nothing here for the hunter's moveset to reach, which is the
// point the beat text makes without a rule enforcing it.

import { BAKAYA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Monochrome and violet, per `docs/SPEC-CAMPAIGN.md`'s table — grays and
 * near-blacks with one accent, rather than any register a prior gate owns.
 * `crystal` echoes gate 1's `0x9d5cff` deliberately rather than doubling as a
 * boss core the way gates 3, 6 and 8's do: Bakaya is an elevated grunt, not a
 * bespoke rig with a core to match, and the violet this gate spends instead
 * ties Yama-sabha back to the one dead violet eye the Kneeling Stone has
 * carried since gate 1 — the judge who put the work down, seen again at the
 * seat he stopped sitting in.
 */
const REALM = {
  sky: { zenith: 0x0c0c14, mid: 0x28273a, horizon: 0x5c4a72 },
  fog: { color: 0x38334a, near: 20, far: 116 },

  grass: 0x46434f,
  grassBlade: 0x5a5766,
  grassBladeTip: 0x8a7aae,
  rock: 0x38363f,
  rockDark: 0x18171d,
  rockMoss: 0x423f4a,
  stone: 0x68647a,
  crystal: 0x9d5cff,

  mist: { back: 0x5c4a72, front: 0x28273a },
  ridges: [0x18171d, 0x28273a, 0x38363f],
};

/**
 * Three chambers, every gap the same 3.8 gates 2–8 already measured their
 * reserve against. Flat throughout — a court has no summit to offer, and
 * gate 1 already owns the climb.
 */
const SEGMENTS = [
  // Approach: nothing to fight yet, room to read the realm.
  { x0: -6, x1: 28, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // The antechamber: raakchyas and bhoot-batti together, both already taught
  // in gate 1, met here in a setting neither was met in before.
  { x0: 31.8, x1: 68, top: 0, boulders: 3, pillars: 3, crystals: 1 },

  // The nine thrones: every archetype the campaign has taught, one to a
  // throne — the widest roster the campaign combines in a single encounter,
  // short of gate 7's own claim to the densest one.
  { x0: 71.8, x1: 108, top: 0, boulders: 3, pillars: 4, crystals: 2 },

  // Bakaya's chamber — long and flat, the same reason every prior Warden
  // arena is: room to read a wind-up and room for what it raises to stand.
  { x0: 111.8, x1: 155, top: ARENA_TOP, boulders: 2, pillars: 2, crystals: 2, thickness: 6 },
];

/**
 * Yama-sabha's Warden: a second elevation of the summoner line `ATRIPTA`
 * began, exactly as `VYAGHRI` is to `KEVAT`. `archetype: 'tantrik'` names the
 * same class Atripta does — the numbers in `BAKAYA` (`src/game/config.js`)
 * are the only thing that changes.
 */
const WARDEN = {
  archetype: 'tantrik',
  title: STRINGS.GATE9_WARDEN_TITLE,
  stats: BAKAYA,
};

/**
 * Three encounters: two grunt fights, the second combining every archetype
 * the campaign has taught, then the Warden, met alone — the same solo shape
 * every Warden fight in the campaign has used so far.
 */
const ENCOUNTERS = [
  {
    id: 'the-antechamber',
    trigger: 40,
    lock: [33, 66],
    intro: {
      title: STRINGS.GATE9_ANTECHAMBER_TITLE,
      body: STRINGS.GATE9_ANTECHAMBER_BODY,
    },
    spawns: [
      { type: 'raakchyas', x: 46, delay: 0 },
      { type: 'bhootBatti', x: 52, delay: 0.6 },
      { type: 'raakchyas', x: 60, delay: 1.1 },
    ],
  },
  {
    id: 'the-nine-thrones',
    trigger: 80,
    lock: [73, 106],
    intro: {
      title: STRINGS.GATE9_THRONES_TITLE,
      body: STRINGS.GATE9_THRONES_BODY,
    },
    spawns: [
      { type: 'charger', x: 82, delay: 0 },
      { type: 'kawach', x: 90, delay: 0.5 },
      { type: 'tantrik', x: 98, delay: 1.0 },
      { type: 'raakchyas', x: 86, delay: 1.5 },
    ],
  },
  {
    id: 'bakaya',
    trigger: 130,
    lock: [113, 154],
    boss: true,
    intro: { title: STRINGS.GATE9_BAKAYA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 135, delay: 0.9 }],
  },
];

/**
 * Two boundary beats. The `enter` one breaks from the prior gate's "THE
 * SYSTEM" framing on purpose, the same way gate 6's `cleared` beat did: Yama
 * himself is what the hunter meets walking in, and the System has nothing to
 * report about a figure it has never had to describe before.
 */
const BEATS = [
  {
    at: 'enter',
    title: STRINGS.GATE9_BEAT_ENTER_TITLE,
    big: STRINGS.GATE9_BEAT_ENTER_BIG,
    body: STRINGS.GATE9_BEAT_ENTER_BODY,
  },
  {
    at: 'cleared',
    title: STRINGS.GATE9_BEAT_CLEARED_TITLE,
    big: STRINGS.GATE9_BEAT_CLEARED_BIG,
    body: STRINGS.GATE9_BEAT_CLEARED_BODY,
  },
];

export const GATE_9 = {
  id: 'gate-9',
  name: STRINGS.GATE9_NAME,
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
