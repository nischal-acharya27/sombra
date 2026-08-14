// Gate 2 — "The Road to Ekachakra" (Mahabharata, Adi Parva).
//
// A gate is a descriptor. This file holds everything that makes this gate this
// gate — its geometry, its encounters, its own constants, its act's palette
// and its Warden — and nothing that knows how any of it is built. `Level`
// turns a descriptor into geometry and answers collision queries against it;
// `Game` reads every per-gate number from the descriptor it was handed rather
// than importing one.
//
// This is gate 2 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Bakasura, not the retired Kevat/river-crossing. "Moderate — a few
// stacked-ledge rises, flat at the fight" is the spec's own call for this
// gate: the walk to Ekachakra climbs and drops via the stacked-ledge shape
// `prototype/vertical-traversal`'s `?vtest` gate validated by actually
// playing it (rise 3, thin `thickness`, a 4-unit x-overlap) — a shape reused
// below at a slightly thinner `thickness` than that branch's own 1.2, which
// only widens the proven-clear headroom rather than narrowing it. Then it
// flattens for both the raakchyas encounter and Bakasura's own arena, since
// his grab-slam/lunge kit needs open room the way Shakuni's die did in gate 1.

import { BAKASURA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';
import { P } from '../../render/palette.js';

/**
 * Act 1's palette register — "Court/mortal: bronze, iron, regal-but-grounded"
 * per docs/SPEC-CAMPAIGN.md's per-act table, the same family gate 1's hall
 * uses. Greener, cooler grass and a dimmer sky than the hall's own braziers —
 * this reads as outdoors, not lit, while staying inside the act's one warm
 * bronze/iron register rather than reaching for gate 2's old blue-grey water
 * palette, which belonged to the retired crossing and not to this gate.
 */
const REALM = {
  sky: { zenith: 0x1c150c, mid: 0x5a4020, horizon: 0xb08840 },
  fog: { color: 0x7a5c28, near: 24, far: 128 },

  grass: 0x5e6a2e,
  grassBlade: 0x6c7a36,
  grassBladeTip: 0xc9c46a,
  rock: 0x584324,
  rockDark: 0x2a1f10,
  rockMoss: 0x445a2a,
  stone: 0x86773e,
  crystal: 0xe0a83c,

  mist: { back: 0xc8a95a, front: 0x8a6a2e },
  ridges: [0x2a1f10, 0x3d2e16, 0x5c4526],
};

/**
 * The road, left to right: a rise of two stacked ledges, a matching descent
 * back to grade, one real gap, then flat ground the rest of the way.
 *
 * The 4-unit x-overlap between neighbours matches the validated `?vtest`
 * climb (`prototype/vertical-traversal`, `gate-vtest.js`) exactly; `thickness:
 * 1.0` is thinner than that branch's own 1.2, leaving 2.0 units of headroom
 * under each ledge against the hunter's 1.7-unit body rather than the 0.1
 * margin `?vtest` shipped with. `tools/gatecheck.js`'s `edge()` headroom
 * check (added alongside this gate) holds every pair here to that clearance
 * rather than to a generous guess.
 */
const SEGMENTS = [
  // The road out of the last gate: ordinary forest floor.
  { x0: -6, x1: 14, top: 0, trees: 3, boulders: 2 },

  // Two stacked ledges climbing to the road's high point — bare stone, not
  // forest floor, the way a rockier stretch of a road reads.
  { x0: 10, x1: 22, top: 3, barren: true, depth: 5, thickness: 1.0, boulders: 1 },
  { x0: 18, x1: 32, top: 6, barren: true, depth: 5, thickness: 1.0, boulders: 1 },

  // The descent, mirroring the climb.
  { x0: 28, x1: 40, top: 3, barren: true, depth: 5, thickness: 1.0 },
  { x0: 36, x1: 56, top: 0, trees: 2, boulders: 2 },

  // The one real gap on the road — a washed-out crossing, not a chasm.
  // 3.8 wide: the same width every gate's own gap is measured against, per
  // `docs/DECISIONS.md`'s "6.08-unit running jump" entry.
  { x0: 59.8, x1: 96, top: 0, trees: 2, boulders: 2, pillars: 1 },

  // Ekachakra's approach flattens completely for the fight — bare ground,
  // no cover, the same "clear sightlines" call gate 1's own Warden floor
  // makes for a kit that needs room to be read rather than to hide in.
  { x0: 96, x1: 152, top: 0, barren: true, depth: 9, boulders: 2, thickness: 6 },
];

/**
 * Raakchyas, reskinned as Ekachakra's own village rakshasa — earthy and
 * grounded rather than gate 1's court bronze, per docs/SPEC-CAMPAIGN.md's
 * gate-02 table ("Raakchyas → village rakshasa"). Only `body`/`dark` move:
 * `spine`/`eye` stay the archetype's own violet/red so the pounce tell reads
 * exactly as it always has — a reskin changes what it looks like standing
 * still, never what its telegraph looks like committing.
 */
const VILLAGE_RAKSHASA_SKIN = { body: P.manavAccent, dark: P.manavPlateDark, spine: P.violetDeep, eye: P.raakchyasEye };

/**
 * The gate's Warden: an archetype, a title, and the numbers it is elevated
 * to. Bakasura is tier 2 (`docs/agents/villain-handoff.md`) — a new rig, but
 * `Bakasura` in `enemies.js` reads every number from the block it is handed
 * exactly as `Kawach`/`Shakuni` do, the same seam that makes the other
 * Wardens configuration instead of another file each.
 */
const WARDEN = {
  archetype: 'bakasura',
  title: STRINGS.GATE2_WARDEN_TITLE,
  stats: BAKASURA,
};

/**
 * Two encounters: the village rakshasa met alone — its solo debut in the
 * fifteen-gate campaign, ahead of the story's own named terror — then
 * Bakasura himself. `lock` seals the fight between two x positions until
 * every enemy it spawned is dead.
 */
const ENCOUNTERS = [
  {
    id: 'village-rakshasa',
    trigger: 68,
    lock: [64, 94],
    intro: {
      title: STRINGS.GATE2_RAKSHASA_TITLE,
      body: STRINGS.GATE2_RAKSHASA_BODY,
      note: STRINGS.GATE2_RAKSHASA_NOTE,
    },
    spawns: [{ type: 'raakchyas', x: 80, delay: 0.3, skin: VILLAGE_RAKSHASA_SKIN }],
  },
  {
    id: 'bakasura',
    trigger: 106,
    lock: [100, 150],
    intro: {
      title: STRINGS.GATE2_BAKASURA_TITLE,
      body: WARDEN.title,
    },
    // `warden` rather than an archetype name: which enemy that is belongs to
    // the gate's Warden block, so the encounter does not have to say it twice.
    spawns: [{ type: 'warden', x: 128, delay: 0.8 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line" — six paged 'intro' beats (who he is, the town's own bargain with
 * him, Bhima's cart, ending on his signature line and the mechanical tell)
 * and four paged 'cleared' beats once he loses. Per
 * `docs/SPEC-CAMPAIGN.md`'s dialogue table, Bakasura carries no authored
 * phase-transition line — only the ordinary generic enrage warning
 * (`Bakasura._enrage` in enemies.js) — so there is no mid-fight beat here.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE2_BAKASURA_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE2_BAKASURA_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE2_BAKASURA_INTRO_1_BIG, STRINGS.GATE2_BAKASURA_INTRO_1_BODY),
  introBeat(STRINGS.GATE2_BAKASURA_INTRO_2_BIG, STRINGS.GATE2_BAKASURA_INTRO_2_BODY),
  introBeat(STRINGS.GATE2_BAKASURA_INTRO_3_BIG, STRINGS.GATE2_BAKASURA_INTRO_3_BODY),
  introBeat(STRINGS.GATE2_BAKASURA_INTRO_4_BIG, STRINGS.GATE2_BAKASURA_INTRO_4_BODY),
  introBeat(STRINGS.GATE2_BAKASURA_INTRO_5_BIG, STRINGS.GATE2_BAKASURA_INTRO_5_BODY),
  introBeat(STRINGS.GATE2_BAKASURA_INTRO_6_BIG, STRINGS.GATE2_BAKASURA_INTRO_6_BODY),
  clearedBeat(STRINGS.GATE2_BAKASURA_DEFEAT_1_BIG, STRINGS.GATE2_BAKASURA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE2_BAKASURA_DEFEAT_2_BIG, STRINGS.GATE2_BAKASURA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE2_BAKASURA_DEFEAT_3_BIG, STRINGS.GATE2_BAKASURA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE2_BAKASURA_DEFEAT_4_BIG, STRINGS.GATE2_BAKASURA_DEFEAT_4_BODY),
];

export const GATE_2 = {
  id: 'gate-2',
  name: STRINGS.GATE2_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the road and the gap both. */
  voidY: -24,
  /** Every arena segment is `top: 0`. */
  arenaTop: 0,
  exitX: 148,
  end: 154,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
