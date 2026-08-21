// Gate 11 — Pragjyotishapura, the fortress and its cells.
//
// This is a new file under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// `gate1.js`–`gate10.js` were rewritten in place, and `gate11.js`–`gate15.js`
// are genuinely new. Act 3's third gate, and its first combination encounter.
//
// The act table calls the level shape "escalating — barred corridors and
// ramparts into his audience hall", and that is what the segments below are: a
// climb out of the cell corridor onto the ramparts, then a flat hall for the
// fight, per the campaign's unbroken Warden/boss-arena convention.
//
// Visually the gate is continuous with Kamsa's prison iron two gates back but
// staged at fortress scale, and separated from it at the *material* level:
// Narakasura's stone is `bhauma*` basalt, "carved from the earth he commands",
// where Kamsa's is cold shackle-iron. The cages are `prag*` iron — colder than
// the walls on purpose, so the captives' architecture reads as brought here
// rather than quarried with the fortress.

import { NARAKASURA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';
import { P } from '../../render/palette.js';

/**
 * Act 3's palette register, at fortress scale. Kamsa's Mathura was court
 * regalia under a hot tournament sky; this is the same act's world seen from
 * inside a prison — a low, banked, rust-and-basalt dusk with the sky's only
 * warmth down at the horizon, where the ramparts cut it.
 *
 * The fog is deliberately tight (`near: 22`). A fortress is a place you cannot
 * see out of, and the fog is what makes the ramparts feel enclosed without
 * building a ceiling that would take the camera's light with it.
 */
const REALM = {
  sky: { zenith: 0x160f14, mid: 0x452232, horizon: 0xa8563a },
  fog: { color: 0x6b3a2e, near: 22, far: 124 },

  grass: 0x4a3a2c,
  grassBlade: 0x5a4632,
  grassBladeTip: 0x9c7a4e,
  rock: P.bhaumaStone,
  rockDark: P.bhaumaStoneDark,
  rockMoss: 0x54463a,
  stone: 0x8a7a68,
  crystal: P.bhaumaEmber,

  mist: { back: 0x8a4a38, front: 0x53302c },
  ridges: [0x241a18, 0x3a2622, 0x54382e],
};

/** The audience hall's floor. Every arena number below is measured off this. */
const ARENA_TOP = 12;

/**
 * The climb, left to right.
 *
 * Three visually distinct sections rather than three colour washes, which is
 * the direction gate 10 set:
 *
 * 1. **The cell corridor** (x -6 → 46, ground level). Flat, walled on the
 *    back side by a run of barred cell blocks. Nothing to jump; the hunter
 *    walks past the thing the gate is about before they fight anything.
 * 2. **The rampart stair** (x 46 → 108, rising 0 → 12 in four risers with two
 *    real gaps). The traversal section. Both gaps are well inside the
 *    campaign's frozen jump reserve — this is light and forgiving platforming,
 *    the "escalating" the act table asks for, not a precision section.
 * 3. **The audience hall** (x 108 → 176, flat at `ARENA_TOP`). Wide, open and
 *    deliberately bare: his kit is a long spear and a ground fissure, and both
 *    need sightlines. A hunter who ignores the earring flare must not be able
 *    to blame the geometry.
 */
const SEGMENTS = [
  // 1 — the cell corridor. `barren` throughout: this is a flagged prison
  // floor, and grass growing between the cells would say "abandoned ruin" in
  // a gate whose argument is that the fortress is still holding people.
  { x0: -6, x1: 22, top: 0, depth: 9, barren: true, pillars: 2 },
  { x0: 22, x1: 46, top: 0, depth: 9, barren: true, pillars: 2, boulders: 1 },

  // 2 — the rampart stair. Contiguous first riser, so the climb starts
  // without a jump and the hunter learns the shape before it asks anything.
  { x0: 46, x1: 66, top: 3.2, thickness: 1.2, depth: 7, barren: true, boulders: 1 },
  { x0: 66, x1: 84, top: 6.4, thickness: 1.2, depth: 7, barren: true },
  // The two gaps. A brazier stands just past each landing lip — the same job
  // gate 10's roof lamps do, and for the same reason: at this hour a dark
  // edge is a guess, and a light is an aim point.
  { x0: 86.4, x1: 100, top: 9.2, thickness: 1.2, depth: 7, barren: true },
  { x0: 102.6, x1: 116, top: ARENA_TOP, thickness: 1.4, depth: 8, barren: true },

  // 3 — the audience hall. One continuous flat run to the arch.
  { x0: 116, x1: 176, top: ARENA_TOP, thickness: 6, depth: 10, barren: true, pillars: 4 },
];

/**
 * The gate tower is the hero silhouette — the one `src/main.js` drifts the
 * title-card camera across. Stood behind the hall rather than at the entrance
 * so it is the thing the fight happens *under*, which is the read his own
 * "nothing here was built, it was told to stand" line wants.
 */
const HERO = { kind: 'prag-gate-tower', x: 150, y: ARENA_TOP, z: -19, rotY: -0.16, scale: 1.15 };

/**
 * Authored placements, through the seam gate 10 opened (`Level._buildLandmarks`).
 *
 * The cells are the point of this list. Four of them stand along the corridor's
 * back wall at descending scale, so the run reads as continuing past what the
 * camera can hold rather than stopping at the fourth. They are empty: nothing
 * in this game renders a person in a cage, and the liberation lands in the
 * cleared beats instead — see the note on `BEATS`.
 */
const LANDMARKS = [
  { kind: 'prag-cell', x: 2, y: 0, z: -7.5, rotY: 0.05 },
  { kind: 'prag-cell', x: 13, y: 0, z: -7.8, rotY: -0.04 },
  { kind: 'prag-cell', x: 25, y: 0, z: -8.2, rotY: 0.06, scale: 0.94 },
  { kind: 'prag-cell', x: 36, y: 0, z: -8.6, rotY: -0.03, scale: 0.88 },

  // One more cell up on the ramparts, so the corridor's motif does not simply
  // stop when the climb starts — the fortress is cells all the way up.
  { kind: 'prag-cell', x: 74, y: 6.4, z: -7.4, rotY: 0.1, scale: 0.8 },

  // Braziers: one at the foot of the stair, then one just past each of the two
  // gap landings, then two lighting the hall itself.
  { kind: 'prag-brazier', x: 49, y: 3.2, z: -3.4 },
  { kind: 'prag-brazier', x: 88.6, y: 9.2, z: -3.4 },
  { kind: 'prag-brazier', x: 104.8, y: ARENA_TOP, z: -3.4 },
  { kind: 'prag-brazier', x: 124, y: ARENA_TOP, z: -4.2, scale: 1.15 },
  { kind: 'prag-brazier', x: 168, y: ARENA_TOP, z: -4.2, scale: 1.15 },
];

/**
 * Two encounters, per the act table — and the act's first *combination*,
 * landing here rather than at Kamsa's or Putana's gate.
 *
 * Both reskins reuse archetypes that already debuted solo in Acts 1 and 2
 * (`Kawach` and `Raakchyas`), so nothing here needs `solo debut` protection —
 * which is exactly why the act put its combination at this gate.
 *
 * The first encounter lands the fortress guard alone, before the combination.
 * That is staging, not padding: `intro.body` is the only intro field a grunt
 * encounter actually renders, so the lesson has to be taught by the fight's
 * shape. Meeting the guard on its own once is what makes the garrison muscle
 * beside it legible when both arrive together.
 */
const WARDEN = {
  archetype: 'narakasura',
  title: STRINGS.GATE11_WARDEN_TITLE,
  stats: NARAKASURA,
};

const ENCOUNTERS = [
  {
    id: 'fortress-guard',
    trigger: 26,
    lock: [16, 46],
    intro: { body: STRINGS.GATE11_GUARD_TOAST },
    spawns: [
      { type: 'kawach', x: 40, delay: 0.2, skin: GUARD_SKIN() },
      { type: 'kawach', x: 44, delay: 1.1, skin: GUARD_SKIN() },
    ],
  },
  {
    // The combination, in the hall's mouth: two guards holding the line with
    // garrison muscle behind them. The rakshasas spawn deeper and later, so
    // the formation arrives as a line rather than a pile.
    id: 'garrison',
    trigger: 122,
    lock: [116, 150],
    intro: { body: STRINGS.GATE11_GARRISON_TOAST },
    spawns: [
      { type: 'kawach', x: 136, delay: 0.2, skin: GUARD_SKIN() },
      { type: 'raakchyas', x: 143, delay: 0.9, skin: GARRISON_SKIN() },
      { type: 'kawach', x: 140, delay: 1.6, skin: GUARD_SKIN() },
      { type: 'raakchyas', x: 147, delay: 2.3, skin: GARRISON_SKIN() },
    ],
  },
  {
    id: 'narakasura',
    trigger: 158,
    lock: [116, 176],
    intro: { title: STRINGS.GATE11_NARAKASURA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 166, delay: 0.9 }],
  },
];

/**
 * Pragjyotishapura's fortress guard: `Kawach` in basalt and prison iron. The
 * fortress's own stone on the plate, so the garrison reads as part of the
 * building the way Lanka's soldiers read as part of Lanka.
 */
function GUARD_SKIN() {
  return { body: P.bhaumaStone, dark: P.pragIronDark, eye: P.bhaumaEmber };
}

/**
 * Rakshasa garrison muscle: `Raakchyas` pulled toward the fortress's browns so
 * it stands beside the guard as one force rather than two unrelated spawns —
 * the differentiator against gate 12's court zealots, which reuse these same
 * two archetypes and are separated by setting and grouping instead.
 */
function GARRISON_SKIN() {
  return { body: 0x3a2a24, dark: 0x1f1614, spine: P.bhaumaStoneDark, eye: P.bhaumaEmber };
}

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a line":
 * twelve paged 'intro' beats, seven paged 'cleared' beats, and one 'phase'
 * beat between them — fired by `Narakasura.takeHit` through
 * `Game.firePhaseBeat` at his `enrageAt` threshold.
 *
 * The shape of the writing is his roster entry's ask, not a free choice. Two
 * calls it makes explicitly:
 *
 * - **The phase beat foreshadows the liberation** rather than recapping his
 *   villainy. His mass-liberation resolution is the strongest fit anywhere on
 *   the roster for the campaign's own release-focused ending, so the fight
 *   plays *toward* the captives' release instead of only ending there.
 * - **The telling stops at the liberation.** The epilogue in which the freed
 *   women are married to Krishna is a real part of the source and is routinely
 *   mishandled in adaptation as a punchline; his entry recommends omitting it,
 *   and the cleared beats below end on the doors opening and the captives
 *   leaving on their own terms, owed to nobody.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE11_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE11_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_1_BIG, STRINGS.GATE11_NARAKASURA_INTRO_1_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_2_BIG, STRINGS.GATE11_NARAKASURA_INTRO_2_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_3_BIG, STRINGS.GATE11_NARAKASURA_INTRO_3_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_4_BIG, STRINGS.GATE11_NARAKASURA_INTRO_4_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_5_BIG, STRINGS.GATE11_NARAKASURA_INTRO_5_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_6_BIG, STRINGS.GATE11_NARAKASURA_INTRO_6_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_7_BIG, STRINGS.GATE11_NARAKASURA_INTRO_7_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_8_BIG, STRINGS.GATE11_NARAKASURA_INTRO_8_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_9_BIG, STRINGS.GATE11_NARAKASURA_INTRO_9_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_10_BIG, STRINGS.GATE11_NARAKASURA_INTRO_10_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_11_BIG, STRINGS.GATE11_NARAKASURA_INTRO_11_BODY),
  introBeat(STRINGS.GATE11_NARAKASURA_INTRO_12_BIG, STRINGS.GATE11_NARAKASURA_INTRO_12_BODY),
  {
    at: 'phase',
    title: STRINGS.GATE11_WARDEN_TITLE,
    big: STRINGS.GATE11_NARAKASURA_PHASE_BIG,
    body: STRINGS.GATE11_NARAKASURA_PHASE_BODY,
  },
  clearedBeat(STRINGS.GATE11_NARAKASURA_DEFEAT_1_BIG, STRINGS.GATE11_NARAKASURA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE11_NARAKASURA_DEFEAT_2_BIG, STRINGS.GATE11_NARAKASURA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE11_NARAKASURA_DEFEAT_3_BIG, STRINGS.GATE11_NARAKASURA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE11_NARAKASURA_DEFEAT_4_BIG, STRINGS.GATE11_NARAKASURA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE11_NARAKASURA_DEFEAT_5_BIG, STRINGS.GATE11_NARAKASURA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE11_NARAKASURA_DEFEAT_6_BIG, STRINGS.GATE11_NARAKASURA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE11_NARAKASURA_DEFEAT_7_BIG, STRINGS.GATE11_NARAKASURA_DEFEAT_7_BODY),
];

export const GATE_11 = {
  id: 'gate-11',
  name: STRINGS.GATE11_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the corridor floor and every rampart drop. */
  voidY: -22,
  arenaTop: ARENA_TOP,
  exitX: 172,
  end: 180,

  segments: SEGMENTS,
  landmark: HERO,
  landmarks: LANDMARKS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
