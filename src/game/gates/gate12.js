// Gate 12 — the Daitya palace's pillared galleries, into the boon-hall.
//
// Hiranyakashipu: the Krishna-cycle's boss and, since the campaign was cut to
// twelve gates on 2026-09-29, the campaign's finale (`docs/DECISIONS.md` §
// "Amended 2026-09-29: the campaign is twelve gates"). Its closing beats carry
// the ending the fifteen-gate spec gave Mahishasura: the chaya is let go.
//
// The spec's row asks for the act's **most eventful** approach — a rising,
// multi-tier climb through pillared galleries that foreshadows the pillar his
// fight stages around — and then a boon-hall that opens flat. No new
// archetype: the act spent its budget on the Mathura wrestler, and the boss
// is the gate's new thing. Both regular archetypes debuted long ago.

import { HIRANYAKASHIPU } from '../config.js';
import { P } from '../../render/palette.js';
import { STRINGS } from '../../ui/strings.js';

/**
 * Twilight — "neither day nor night" carried by the realm itself, so the
 * finishing beat needs no lighting trick of its own: the whole gate is the
 * hour the boon could not name. Indigo above, a low rose-gold horizon, and
 * the palace stone pale enough to catch it.
 */
const REALM = {
  sky: { zenith: 0x17142e, mid: 0x4e3462, horizon: 0xe29a76 },
  fog: { color: 0x5e4466, near: 20, far: 118 },

  grass: 0x3e3040,
  grassBlade: 0x524052,
  grassBladeTip: 0x9a7e8e,
  rock: P.daityaStone,
  rockDark: P.daityaStoneDark,
  rockMoss: 0x5a4656,
  stone: 0xb49ca2,
  crystal: P.hiranyaGold,

  mist: { back: 0x9a6a86, front: 0x44304e },
  ridges: [0x1c1730, 0x2c2342, 0x423456],
};

/** The boon-hall's floor. Every arena number below is measured off this. */
const ARENA_TOP = 12;

/**
 * Up, and then flat.
 *
 * The first gallery at ground level for the palace guard; four ledges up the
 * palace face, gate 8's validated climb unchanged (three-unit rises,
 * `thickness: 1.0`, four units of overlap); the upper gallery at the top for
 * the zealots; then one 3.8-unit gap — the same gap `tools/gatecheck.js`'s
 * `jumpReserve` has held against the running jump on every gate — into the
 * boon-hall. Pillars stand in every gallery, which is the foreshadowing the
 * spec asks for; the hall itself is barren of scatter, for the reason every
 * boss arena is — his slam reaches 5.4 units and his sweep 5.2, and the only
 * pillar in there should be the doorway he summons.
 */
const SEGMENTS = [
  { x0: -6, x1: 24, top: 0, barren: true, depth: 9, pillars: 2 },
  { x0: 24, x1: 60, top: 0, barren: true, depth: 9, thickness: 6, pillars: 3 },

  { x0: 56, x1: 68, top: 3, barren: true, depth: 5, thickness: 1.0, pillars: 1 },
  { x0: 64, x1: 76, top: 6, barren: true, depth: 5, thickness: 1.0, crystals: 1 },
  { x0: 72, x1: 84, top: 9, barren: true, depth: 5, thickness: 1.0, pillars: 1 },

  // The last rise lands on a thin ledge first, as gate 8's does: a thick
  // gallery starting here would swallow the top of the ledge below it where
  // the two overlap, and leave a wall where the step should be.
  { x0: 80, x1: 94, top: ARENA_TOP, barren: true, depth: 5, thickness: 1.0, pillars: 1 },
  { x0: 94, x1: 132, top: ARENA_TOP, barren: true, depth: 9, thickness: 6, pillars: 3 },

  { x0: 135.8, x1: 206, top: ARENA_TOP, barren: true, depth: 10, thickness: 6, crystals: 2 },
];

/** Palace guard and court zealots: colour only, the archetypes' own tells untouched. */
const GUARD = { type: 'kawach', skin: { body: P.daityaGuardPlate, dark: P.daityaGuardPlateDark, eye: P.kawachEye } };
const ZEALOT = {
  type: 'raakchyas',
  skin: { body: P.daityaZealot, dark: P.daityaZealotDark, spine: P.hiranyaSkinDark, eye: P.raakchyasEye },
};

/**
 * Tier 3 — a bespoke `Boss` subclass, the last of the locked bosses the
 * campaign kept (`Hiranyakashipu` in `boss.js`, `buildHiranyakashipu` in
 * `models.js`).
 */
const WARDEN = {
  archetype: 'hiranyakashipu',
  title: STRINGS.GATE12_WARDEN_TITLE,
  stats: HIRANYAKASHIPU,
};

/**
 * The table's three: the guard alone at the foot of the palace, then guard
 * and zealots together in the upper gallery, then the king.
 *
 * The first is one Kawach and nothing else, so its armour — which since
 * 2026-09-29 turns aside most of a hit rather than all of it — is met on its
 * own before anything stands behind it. The second puts two zealots behind
 * the next one, landing either side of it, so a hunter who commits to the
 * shield is inside two pounces.
 *
 * `boss: true` on the third is earned: he is a locked boss.
 */
const ENCOUNTERS = [
  {
    id: 'palace-guard',
    trigger: 32,
    lock: [26, 58],
    intro: { body: STRINGS.GATE12_GUARD_TOAST },
    spawns: [{ ...GUARD, x: 46, delay: 0.3 }],
  },
  {
    id: 'court-zealots',
    trigger: 100,
    lock: [94, 130],
    intro: { body: STRINGS.GATE12_ZEALOTS_TOAST },
    spawns: [
      { ...GUARD, x: 116, delay: 0.2 },
      { ...ZEALOT, x: 124, delay: 0.8 },
      { ...ZEALOT, x: 108, delay: 1.4 },
    ],
  },
  {
    id: 'hiranyakashipu',
    trigger: 146,
    lock: [138, 202],
    boss: true,
    intro: { title: STRINGS.GATE12_HIRANYA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 172, delay: 0.8 }],
  },
];

const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE12_WARDEN_TITLE, big, body });
const endingBeat = (big, body, extra = {}) => ({ at: 'cleared', title: STRINGS.SYS_TITLE, big, body, ...extra });

/**
 * Thirteen intro beats and one phase beat, his; eight closing beats, the
 * System's. The sixth carries `release` — `Game._showBeatQueue` lets the
 * chaya go the moment it opens, so the words and the leaving are one beat.
 */
const BEATS = [
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_1_BIG, STRINGS.GATE12_HIRANYA_INTRO_1_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_2_BIG, STRINGS.GATE12_HIRANYA_INTRO_2_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_3_BIG, STRINGS.GATE12_HIRANYA_INTRO_3_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_4_BIG, STRINGS.GATE12_HIRANYA_INTRO_4_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_5_BIG, STRINGS.GATE12_HIRANYA_INTRO_5_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_6_BIG, STRINGS.GATE12_HIRANYA_INTRO_6_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_7_BIG, STRINGS.GATE12_HIRANYA_INTRO_7_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_8_BIG, STRINGS.GATE12_HIRANYA_INTRO_8_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_9_BIG, STRINGS.GATE12_HIRANYA_INTRO_9_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_10_BIG, STRINGS.GATE12_HIRANYA_INTRO_10_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_11_BIG, STRINGS.GATE12_HIRANYA_INTRO_11_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_12_BIG, STRINGS.GATE12_HIRANYA_INTRO_12_BODY),
  introBeat(STRINGS.GATE12_HIRANYA_INTRO_13_BIG, STRINGS.GATE12_HIRANYA_INTRO_13_BODY),
  {
    at: 'phase',
    title: STRINGS.GATE12_WARDEN_TITLE,
    big: STRINGS.GATE12_HIRANYA_PHASE_BIG,
    body: STRINGS.GATE12_HIRANYA_PHASE_BODY,
  },
  endingBeat(STRINGS.GATE12_ENDING_1_BIG, STRINGS.GATE12_ENDING_1_BODY),
  endingBeat(STRINGS.GATE12_ENDING_2_BIG, STRINGS.GATE12_ENDING_2_BODY),
  endingBeat(STRINGS.GATE12_ENDING_3_BIG, STRINGS.GATE12_ENDING_3_BODY),
  endingBeat(STRINGS.GATE12_ENDING_4_BIG, STRINGS.GATE12_ENDING_4_BODY),
  endingBeat(STRINGS.GATE12_ENDING_5_BIG, STRINGS.GATE12_ENDING_5_BODY),
  endingBeat(STRINGS.GATE12_ENDING_6_BIG, STRINGS.GATE12_ENDING_6_BODY, { release: true }),
  endingBeat(STRINGS.GATE12_ENDING_7_BIG, STRINGS.GATE12_ENDING_7_BODY),
  endingBeat(STRINGS.GATE12_ENDING_8_BIG, STRINGS.GATE12_ENDING_8_BODY),
];

export const GATE_12 = {
  id: 'gate-12',
  name: STRINGS.GATE12_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the palace climb and the one gap. */
  voidY: -30,
  arenaTop: ARENA_TOP,
  exitX: 200,
  end: 206,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
