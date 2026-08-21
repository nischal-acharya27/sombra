// Gate 3 — Kurukshetra, and the lake Duryodhana hides in.
//
// This is gate 3 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Duryodhana, not the retired Naraka/Goru-Mukh. Act 1's boss gate and its
// most eventful — a descent from the battlefield down to the lake he hides
// in per the source text (*Shalya Parva*), before the ground flattens into
// the duel arena every boss fight holds to. Two sequential single-archetype
// encounters first — `Charger` reskinned as charging cavalry, then `Kawach`
// as an infantry line — keeping the act's own rule that no two archetypes
// ever share a lock until Act 2 opens combination encounters.
//
// Duryodhana is the campaign's first tier-3 boss to swing a held prop — a
// gada — rather than attack with its own body. See `Duryodhana` in
// `src/game/boss.js` for the kit, and `buildDuryodhana` in
// `src/render/models.js` for the rig his roster entry's `/grilling` pass
// settled on.

import { DURYODHANA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';
import { P } from '../../render/palette.js';

/**
 * Dusk over the battlefield, going to ember at the horizon — Act 1's own
 * "bronze, iron, regal-but-grounded" register (per docs/SPEC-CAMPAIGN.md's
 * per-act table), pushed warmer and redder than gate 1's court hall and
 * gate 2's forest road so this reads as the war's own aftermath rather than
 * a third variation on the same light. The crystal accent doubles as
 * `kuruCore`, his own gada-head telegraph, the same trick every prior
 * gate's crystal plays against its Warden's core.
 */
const REALM = {
  sky: { zenith: 0x1c0e08, mid: 0x5a2e16, horizon: 0xc46a30 },
  fog: { color: 0x6a3a1c, near: 22, far: 120 },

  grass: 0x4a3a20,
  grassBlade: 0x5c4826,
  grassBladeTip: 0xd4a050,
  rock: 0x4a3624,
  rockDark: 0x241810,
  rockMoss: 0x3a2c18,
  stone: 0x6e5638,
  crystal: P.kuruCore,

  mist: { back: 0xa06838, front: 0x4a2410 },
  ridges: [0x1c1008, 0x2e1e10, 0x4a3420],
};

const ARENA_TOP = -6;

/**
 * The battlefield, then the descent, then the lake's own flat basin.
 *
 * The stacked-ledge climb gate 2 measured is reused here upside down: the
 * same 4-unit x-overlap and `thickness: 1.0` `?vtest`-validated clearance,
 * stepping the ground *down* by 3 a ledge instead of up. The one real gap —
 * 3.8 wide, the same width every gate's own gap is measured against per
 * `docs/DECISIONS.md`'s "6.08-unit running jump" entry — sits at the lake's
 * own edge, so the last thing crossed before the duel is the gap itself.
 * Flat and barren from there on, like every boss arena in the campaign: his
 * sweep reaches 5.0 units and his slam's shockwave 5.2, and a boulder in
 * here is a thing to be pinned against, not cover.
 */
const SEGMENTS = [
  // The battlefield: bare ground, the war's own debris rather than forest
  // scatter.
  { x0: -6, x1: 30, top: 0, barren: true, depth: 9, boulders: 3, pillars: 2 },

  // The cavalry's own ground — wide and flat, clear sightlines for a
  // charge's telegraph, the same "room to read it" call gate 1's hall
  // makes for Shakuni's die. Thin `thickness`, not the usual flat-ground 6:
  // this floor's x-range overlaps the descent ledge just past it, and a
  // thick floor's solid body reaches down far enough to bury that ledge —
  // `tools/gatecheck.js`'s `headroomClear` is what caught it.
  { x0: 30, x1: 66, top: 0, barren: true, depth: 9, pillars: 2, thickness: 1.0 },

  // The descent toward the lake: two stacked ledges, stepping down.
  { x0: 62, x1: 74, top: -3, barren: true, depth: 5, thickness: 1.0, boulders: 1 },
  { x0: 70, x1: 86, top: -6, barren: true, depth: 5, thickness: 1.0, boulders: 1 },

  // The infantry's line, at grade with the lake.
  { x0: 86, x1: 120, top: -6, barren: true, depth: 9, pillars: 2, thickness: 6 },

  // The one real gap, at the lake's own edge.
  { x0: 123.8, x1: 190, top: ARENA_TOP, barren: true, depth: 10, thickness: 6, boulders: 2, pillars: 2 },
];

/**
 * Charger, reskinned as Kuru cavalry — Act 1's own manav bronze, the same
 * skin gate 1's court guards wear, since this is the same king's army met
 * a gate later. Per docs/SPEC-CAMPAIGN.md's gate-03 table ("Charger →
 * cavalry"). Its solo debut here — met alone, ahead of Kawach — is what
 * resolves the archetype's own debut across the campaign: gate 9 combines
 * it with Kawach and Tantrik, and a hunter who has never met it alone would
 * be reading three tells at once.
 */
const CAVALRY_SKIN = { body: P.manavPlate, dark: P.manavPlateDark, eye: P.manavCore };

/**
 * Kawach, left at its own iron-brown plate rather than reskinned. Not every
 * archetype in a gate's table needs a palette override — its default already
 * reads as "armoured infantry" on its own, and a second manav-toned reskin
 * beside the cavalry's would blur the two into one force instead of two.
 */
const WARDEN = {
  archetype: 'duryodhana',
  title: STRINGS.GATE3_DURYODHANA_WARDEN_TITLE,
  stats: DURYODHANA,
};

/**
 * Three encounters, the table's own count: two before him, single-archetype
 * throughout, holding Act 1's own no-combination rule even at its boss gate.
 */
const ENCOUNTERS = [
  {
    id: 'cavalry',
    trigger: 46,
    lock: [32, 64],
    intro: {
      title: STRINGS.GATE3_CAVALRY_TITLE,
      body: STRINGS.GATE3_CAVALRY_BODY,
    },
    spawns: [{ type: 'charger', x: 50, delay: 0.3, skin: CAVALRY_SKIN }],
  },
  {
    id: 'infantry',
    trigger: 100,
    lock: [88, 118],
    intro: {
      title: STRINGS.GATE3_INFANTRY_TITLE,
      body: STRINGS.GATE3_INFANTRY_BODY,
    },
    spawns: [{ type: 'kawach', x: 103, delay: 0.3 }],
  },
  {
    id: 'duryodhana',
    trigger: 150,
    lock: [126, 188],
    boss: true,
    intro: { title: STRINGS.GATE3_DURYODHANA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 160, delay: 0.9 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line", extended to the act's boss per docs/SPEC-CAMPAIGN.md's own call:
 * thirteen paged 'intro' beats and eight paged 'cleared' beats, with one
 * 'phase' beat between them fired by `Duryodhana._enrage` in `boss.js`
 * through `Game.firePhaseBeat` — his "no phase-transition" flag is about the
 * rig, not the line, per his roster entry.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE3_DURYODHANA_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE3_DURYODHANA_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_1_BIG, STRINGS.GATE3_DURYODHANA_INTRO_1_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_2_BIG, STRINGS.GATE3_DURYODHANA_INTRO_2_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_3_BIG, STRINGS.GATE3_DURYODHANA_INTRO_3_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_4_BIG, STRINGS.GATE3_DURYODHANA_INTRO_4_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_5_BIG, STRINGS.GATE3_DURYODHANA_INTRO_5_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_6_BIG, STRINGS.GATE3_DURYODHANA_INTRO_6_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_7_BIG, STRINGS.GATE3_DURYODHANA_INTRO_7_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_8_BIG, STRINGS.GATE3_DURYODHANA_INTRO_8_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_9_BIG, STRINGS.GATE3_DURYODHANA_INTRO_9_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_10_BIG, STRINGS.GATE3_DURYODHANA_INTRO_10_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_11_BIG, STRINGS.GATE3_DURYODHANA_INTRO_11_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_12_BIG, STRINGS.GATE3_DURYODHANA_INTRO_12_BODY),
  introBeat(STRINGS.GATE3_DURYODHANA_INTRO_13_BIG, STRINGS.GATE3_DURYODHANA_INTRO_13_BODY),
  {
    at: 'phase',
    title: STRINGS.GATE3_DURYODHANA_WARDEN_TITLE,
    big: STRINGS.GATE3_DURYODHANA_ENRAGE_BIG,
    body: STRINGS.GATE3_DURYODHANA_ENRAGE_BODY,
  },
  clearedBeat(STRINGS.GATE3_DURYODHANA_DEFEAT_1_BIG, STRINGS.GATE3_DURYODHANA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE3_DURYODHANA_DEFEAT_2_BIG, STRINGS.GATE3_DURYODHANA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE3_DURYODHANA_DEFEAT_3_BIG, STRINGS.GATE3_DURYODHANA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE3_DURYODHANA_DEFEAT_4_BIG, STRINGS.GATE3_DURYODHANA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE3_DURYODHANA_DEFEAT_5_BIG, STRINGS.GATE3_DURYODHANA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE3_DURYODHANA_DEFEAT_6_BIG, STRINGS.GATE3_DURYODHANA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE3_DURYODHANA_DEFEAT_7_BIG, STRINGS.GATE3_DURYODHANA_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE3_DURYODHANA_DEFEAT_8_BIG, STRINGS.GATE3_DURYODHANA_DEFEAT_8_BODY),
];

export const GATE_3 = {
  id: 'gate-3',
  name: STRINGS.GATE3_DURYODHANA_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the descent's lowest ledge and the lake's own arena floor. */
  voidY: -32,
  arenaTop: ARENA_TOP,
  exitX: 184,
  end: 190,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
