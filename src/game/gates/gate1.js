// Gate 1 — "The Loaded Sabha" (Mahabharata, Sabha Parva).
//
// A gate is a descriptor. This file holds everything that makes this gate this
// gate — its geometry, its encounters, its own constants, its act's palette
// and its Warden — and nothing that knows how any of it is built. `Level`
// turns a descriptor into geometry and answers collision queries against it;
// `Game` reads every per-gate number from the descriptor it was handed rather
// than importing one.
//
// This is gate 1 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Shakuni, not the retired Guardian/Dwar-Rakshak, and a royal dice hall in
// place of the old chasm-and-bridge geometry. "Mostly flat — verticality
// would obscure his die's telegraph" is the spec's own call for this gate, so
// unlike the build it replaces there is no chasm and no climb here: every
// segment below is contiguous with the next, a genuinely flat hall rather
// than a series of jumps.

import { SHAKUNI } from '../config.js';
import { STRINGS } from '../../ui/strings.js';
import { P } from '../../render/palette.js';

/**
 * Act 1's palette register — "Court/mortal: bronze, iron, regal-but-grounded"
 * per docs/SPEC-CAMPAIGN.md's per-act table. The campaign's one purely human
 * act gets the one register with nothing supernatural in it: no violet, no
 * crimson-cored monster, just warm bronze court light going to shadow at the
 * hall's far end.
 */
const REALM = {
  sky: { zenith: 0x241a0f, mid: 0x6b4a24, horizon: 0xc79a4e },
  fog: { color: 0x8a6a2e, near: 26, far: 132 },

  grass: 0x6b5a34,
  grassBlade: 0x7a6a3e,
  grassBladeTip: 0xd8c48a,
  rock: 0x5c4526,
  rockDark: 0x2b2013,
  rockMoss: 0x4a3a1e,
  stone: 0x8f8060,
  crystal: 0xf2b23c,

  mist: { back: 0xc9a35c, front: 0x8a6a2e },
  ridges: [0x2b2013, 0x3f2f1a, 0x5c4526],
};

/**
 * The hall floor, left to right — one continuous run. `docs/SPEC-CAMPAIGN.md`
 * calls gate 1 "mostly flat" specifically so Shakuni's die reads clearly: a
 * gap or a climb here would be traversal texture competing with the one tell
 * this gate exists to teach. Every `x1` below equals the next segment's `x0`,
 * so there is no void between them at all — the boundaries below are purely
 * where the decoration (and the encounters) change, not where the ground
 * does.
 */
const SEGMENTS = [
  // The colonnade approach: wide, safe, nothing to fight yet.
  { x0: -6, x1: 40, top: 0, barren: true, depth: 8, pillars: 4 },

  // The court guards' floor.
  { x0: 40, x1: 84, top: 0, barren: true, depth: 8, pillars: 2 },

  // The short walk toward Shakuni's own end of the hall.
  { x0: 84, x1: 100, top: 0, barren: true, depth: 8, pillars: 1 },

  // Shakuni's floor: long, flat, no cover — clear sightlines for a kit that
  // lives on being read at range, and nowhere for a hunter who ignores the
  // die's telegraph to blame the geometry instead of the read.
  { x0: 100, x1: 156, top: 0, barren: true, depth: 9, pillars: 3, thickness: 6 },
];

/**
 * Kawach, reskinned as the hall's own court guards rather than Naraka's
 * iron — bronze plate and a gold eye-tell, Act 1's own register, per
 * docs/SPEC-CAMPAIGN.md's gate-01 table ("Kawach → court guards"). Passed
 * through `Game._spawn`'s `s.skin`, not `w.skin`: they are the regular
 * enemy here, not the Warden.
 */
const COURT_GUARD_SKIN = { body: P.manavPlate, dark: P.manavPlateDark, eye: P.manavCore };

/**
 * The gate's Warden: an archetype, a title, and the numbers it is elevated
 * to. Shakuni is tier 2 (`docs/agents/villain-handoff.md`) — a new rig, but
 * `Shakuni` in `enemies.js` reads every number from the block it is handed
 * exactly as `Kawach`/`Raakchyas` do, the same seam that makes the other ten
 * Wardens configuration instead of ten more files.
 */
const WARDEN = {
  archetype: 'shakuni',
  title: STRINGS.GATE1_WARDEN_TITLE,
  stats: SHAKUNI,
};

/**
 * Encounters. `lock` seals the fight between two x positions until every
 * enemy it spawned is dead.
 */
const ENCOUNTERS = [
  {
    id: 'court-guards',
    trigger: 44,
    lock: [42, 82],
    intro: {
      title: STRINGS.GATE1_GUARDS_TITLE,
      body: STRINGS.GATE1_GUARDS_BODY,
      note: STRINGS.GATE1_GUARDS_NOTE,
    },
    spawns: [
      { type: 'kawach', x: 60, delay: 0, skin: COURT_GUARD_SKIN },
      { type: 'kawach', x: 70, delay: 0.6, skin: COURT_GUARD_SKIN },
    ],
  },
  {
    id: 'shakuni',
    trigger: 104,
    lock: [102, 154],
    intro: {
      title: STRINGS.GATE1_SHAKUNI_TITLE,
      body: WARDEN.title,
    },
    // `warden` rather than an archetype name: which enemy that is belongs to
    // the gate's Warden block, so the encounter does not have to say it twice.
    spawns: [{ type: 'warden', x: 130, delay: 0.8 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line" — Shakuni is the worked example: thirteen paged 'intro' beats (who
 * he is, what was done to his family, why he has never stopped playing,
 * ending on his signature line and the mechanical tell) and eight paged
 * 'cleared' beats once he loses. `docs/SPEC-CAMPAIGN.md`'s line 78 giving
 * him "no authored phase-transition line" is unchanged — his escalation is
 * still the die's own telegraphs tightening, not a rig or palette swap —
 * but that only ever ruled out a mid-fight beat, not a real scene at the
 * two boundaries every Warden already opens.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE1_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE1_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_1_BIG, STRINGS.GATE1_SHAKUNI_INTRO_1_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_2_BIG, STRINGS.GATE1_SHAKUNI_INTRO_2_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_3_BIG, STRINGS.GATE1_SHAKUNI_INTRO_3_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_4_BIG, STRINGS.GATE1_SHAKUNI_INTRO_4_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_5_BIG, STRINGS.GATE1_SHAKUNI_INTRO_5_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_6_BIG, STRINGS.GATE1_SHAKUNI_INTRO_6_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_7_BIG, STRINGS.GATE1_SHAKUNI_INTRO_7_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_8_BIG, STRINGS.GATE1_SHAKUNI_INTRO_8_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_9_BIG, STRINGS.GATE1_SHAKUNI_INTRO_9_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_10_BIG, STRINGS.GATE1_SHAKUNI_INTRO_10_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_11_BIG, STRINGS.GATE1_SHAKUNI_INTRO_11_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_12_BIG, STRINGS.GATE1_SHAKUNI_INTRO_12_BODY),
  introBeat(STRINGS.GATE1_SHAKUNI_INTRO_13_BIG, STRINGS.GATE1_SHAKUNI_INTRO_13_BODY),
  clearedBeat(STRINGS.GATE1_SHAKUNI_DEFEAT_1_BIG, STRINGS.GATE1_SHAKUNI_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE1_SHAKUNI_DEFEAT_2_BIG, STRINGS.GATE1_SHAKUNI_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE1_SHAKUNI_DEFEAT_3_BIG, STRINGS.GATE1_SHAKUNI_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE1_SHAKUNI_DEFEAT_4_BIG, STRINGS.GATE1_SHAKUNI_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE1_SHAKUNI_DEFEAT_5_BIG, STRINGS.GATE1_SHAKUNI_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE1_SHAKUNI_DEFEAT_6_BIG, STRINGS.GATE1_SHAKUNI_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE1_SHAKUNI_DEFEAT_7_BIG, STRINGS.GATE1_SHAKUNI_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE1_SHAKUNI_DEFEAT_8_BIG, STRINGS.GATE1_SHAKUNI_DEFEAT_8_BODY),
];

export const GATE_1 = {
  id: 'gate-1',
  name: STRINGS.GATE1_NAME,
  realm: REALM,

  spawnX: 4,
  /** Below this you have fallen out of the world. */
  voidY: -26,
  /** Every segment is `top: 0`, so the Warden's own floor height is trivial. */
  arenaTop: 0,
  exitX: 150,
  end: 156,

  /**
   * The fallen die: scenery, not a fight. It stands in for the "one
   * silhouette visible from the entrance" gate 1's original landmark was —
   * Shakuni's own signature weapon, at colossal scale, tipped among the
   * hall's broken pillars.
   */
  landmark: { kind: 'fallen-die', x: 128, y: -0.5, z: -19, rotY: -0.4 },

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
  beats: BEATS,
};
