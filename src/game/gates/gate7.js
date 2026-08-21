// Gate 7 — Lanka's outer ramparts, into Kumbhakarna's sleeping-hall.
//
// This is gate 7 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Kumbhakarna, not the retired Asura-lok/Amar-Yoddha. Act 2's fourth fight,
// and the gate its own table hands two jobs that pull in opposite directions
// and are placed to stay out of each other's way.
//
// The first is the **solo debut of the Lanka soldier** — the act's one new
// regular-enemy archetype, and the campaign's first new regular since Act 1.
// Its whole lesson is a distance: a spear plants further out than the shield
// gate 1 taught, so the range the hunter learned to stand at is now inside
// the thrust. `tools/gatecheck.js`'s `soloDebut` check is what holds that
// debut to being met alone, and gate 08 is where it is first combined with
// anything (with `Kawach`, as Lanka royal guard).
//
// The second is **Kumbhakarna himself**, the largest silhouette in the game
// (`KUMBHAKARNA` in `src/game/config.js` — `hw 1.8`, `hh 2.2`, past every
// locked boss). The two jobs do not compete because his fight is about reach
// as well, at a completely different scale: the soldier teaches "a spear is
// longer than an arm" on ground that gives the hunter somewhere to retreat
// to, and he asks the same question with an uprooted tree in a room with no
// cover at all.
//
// Traversal escalates here, per the act's own table — the first gate since
// the crossing to stack three rises rather than two — and then flattens
// completely for the fight. The gaps hold at the same 3.8 units every gate
// since gate 2 has measured its reserve against.

import { KUMBHAKARNA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * Act 2's register arriving where it has been heading since gate 4: "Rakshasa/
 * forest tones, moving toward regal gold approaching Ravana" per
 * docs/SPEC-CAMPAIGN.md's per-act table. Gate 6 let the first gold into the
 * horizon and the crystal accent while staying in the canopy; this leaves the
 * canopy entirely for worked stone under a night sky, lit by the city's own
 * torches — so the gold is the brightest thing here rather than a tint on
 * something green. Gate 8 is where it becomes the whole palette.
 */
const REALM = {
  sky: { zenith: 0x0a0a14, mid: 0x2a1e2c, horizon: 0x8a6a2e },
  fog: { color: 0x3a2c22, near: 20, far: 110 },

  grass: 0x33301f,
  grassBlade: 0x4a4428,
  grassBladeTip: 0x8a7a3c,
  rock: 0x4a4034,
  rockDark: 0x231d17,
  rockMoss: 0x40412a,
  stone: 0x5c5240,
  crystal: 0xe0b455,

  mist: { back: 0x6a5636, front: 0x2a2118 },
  ridges: [0x1a161a, 0x2a2422, 0x40382e],
};

/**
 * The ramparts, then the hall.
 *
 * "Escalating, flattens for the fight" is the table's own level-shape call,
 * and the honest way to escalate over gate 6 without inventing a new
 * traversal verb is to add one more rise to the shape gates 4 and 6 already
 * measured: three stacked ledges climbing the outer wall instead of two,
 * still at the `?vtest`-validated `thickness: 1.0` with a 4-unit x-overlap,
 * and two real gaps on the way down instead of one. Both gaps are 3.8 wide —
 * `tools/gatecheck.js`'s `jumpReserve` holds them against this build's actual
 * running jump rather than against a remembered number.
 *
 * Everything past the last descent is flat and barren. It has to be: his
 * sweep reaches 8.2 units and his own body is 3.6 wide, so a boulder in the
 * arena is not cover, it is a thing the hunter gets pinned against.
 */
const SEGMENTS = [
  // Outside the wall — the approach, with room to read the realm before
  // anything is standing in it.
  { x0: -6, x1: 20, top: 0, barren: true, depth: 9, boulders: 2, pillars: 1 },

  // The rampart walk. Wide and flat, and the ground the soldiers hold: a
  // formation needs a line to stand in, and a corridor would decide the
  // hunter's approach angle for them.
  { x0: 20, x1: 58, top: 0, barren: true, depth: 9, pillars: 2, crystals: 1, thickness: 6 },

  // Three stacked ledges climbing the outer wall — gate 6's two, plus one.
  // This is the gate's whole escalation, and it is a step rather than a leap.
  { x0: 54, x1: 66, top: 3, barren: true, depth: 5, thickness: 1.0, pillars: 1 },
  { x0: 62, x1: 74, top: 6, barren: true, depth: 5, thickness: 1.0, crystals: 1 },
  { x0: 70, x1: 84, top: 9, barren: true, depth: 5, thickness: 1.0, pillars: 1 },

  // The descent inside the wall, with the gate's two gaps in it.
  { x0: 87.8, x1: 100, top: 6, barren: true, depth: 5, thickness: 1.0 },
  { x0: 103.8, x1: 118, top: 3, barren: true, depth: 5, thickness: 1.0, crystals: 1 },
  { x0: 114, x1: 132, top: 0, barren: true, depth: 9, boulders: 2, pillars: 1 },

  // The sleeping-hall. Long and flat and empty — see `SEGMENTS`'s own note
  // above for why nothing is scattered in it.
  { x0: 132, x1: 196, top: ARENA_TOP, barren: true, depth: 10, thickness: 6, crystals: 2 },
];

/**
 * The Lanka soldier, at its own numbers rather than a skin over someone
 * else's. The archetype named here is `lankaSoldier`, a real entry in
 * `ARCHETYPES`, not `kawach` wearing a palette — the reach genuinely moved,
 * and a reskin would have been a lie about the distance. Its numbers come
 * from `LANKA_SOLDIER` in `src/game/config.js` by way of the class's own
 * default, the same route every other grunt spawn in the campaign takes.
 */
const SOLDIER = { type: 'lankaSoldier' };

/**
 * The gate's Warden. Kumbhakarna is tier 2 (`docs/agents/villain-handoff.md`)
 * — a new rig, with `Kumbhakarna` in `enemies.js` reading every number from
 * the block it is handed, exactly as `Taraka`, `Bakasura` and `Shurpanakha`
 * already do.
 */
const WARDEN = {
  archetype: 'kumbhakarna',
  title: STRINGS.GATE7_WARDEN_TITLE,
  stats: KUMBHAKARNA,
};

/**
 * Two encounters, which is the table's own count: the soldiers, then him.
 *
 * The first is the archetype's solo debut and it is staged inside itself.
 * One soldier plants at the top of the rampart walk and is met alone — long
 * enough for the hunter to eat one thrust or dodge one, which is the entire
 * lesson — and only then do two more arrive to make it a line. `soloDebut`
 * measures archetypes within an encounter's spawn list, so three of one kind
 * is still a solo debut; the delays are what make it a *taught* one, and they
 * are the same "teach it, then complicate it" order gate 6's own combination
 * uses one gate back.
 *
 * The note names the reach outright. `docs/PLAYTEST.md` is unambiguous that
 * this game has never successfully taught a purely diegetic fact on the first
 * try, and "the range you are standing at is wrong" is exactly the kind of
 * fact a player misreads as the hitbox being broken.
 */
const ENCOUNTERS = [
  {
    id: 'the-ramparts',
    trigger: 30,
    lock: [22, 56],
    intro: {
      title: STRINGS.GATE7_RAMPARTS_TITLE,
      body: STRINGS.GATE7_RAMPARTS_BODY,
      note: STRINGS.GATE7_RAMPARTS_NOTE,
    },
    spawns: [
      { ...SOLDIER, x: 44, delay: 0 },
      { ...SOLDIER, x: 50, delay: 2.0 },
      { ...SOLDIER, x: 38, delay: 2.6 },
    ],
  },
  {
    id: 'kumbhakarna',
    trigger: 142,
    lock: [134, 192],
    intro: { title: STRINGS.GATE7_KUMBHAKARNA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 162, delay: 0.8 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line": thirteen paged 'intro' beats and eight paged 'cleared' beats, with
 * one 'phase' beat between them — fired by `Kumbhakarna.takeHit` in
 * `enemies.js` through `Game.firePhaseBeat` at his HP threshold. Same shape
 * as gates 4 and 6, and the third consumer of the same machinery rather than
 * a third wiring job.
 *
 * His is the one of the three whose phase beat has somewhere specific to be.
 * Taraka's is wordless and Shurpanakha's narrates what the hunter is being
 * shown; his *is* the source's own counsel-refused-fight-anyway moment, held
 * on the screen because his roster entry asks for exactly that and calls the
 * alternative — leaving it as a suggestion for a later session — the failure
 * mode. See the comment above these keys in `strings.js`.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE7_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE7_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_1_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_1_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_2_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_2_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_3_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_3_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_4_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_4_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_5_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_5_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_6_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_6_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_7_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_7_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_8_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_8_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_9_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_9_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_10_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_10_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_11_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_11_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_12_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_12_BODY),
  introBeat(STRINGS.GATE7_KUMBHAKARNA_INTRO_13_BIG, STRINGS.GATE7_KUMBHAKARNA_INTRO_13_BODY),
  {
    at: 'phase',
    title: STRINGS.GATE7_WARDEN_TITLE,
    big: STRINGS.GATE7_KUMBHAKARNA_PHASE_BIG,
    body: STRINGS.GATE7_KUMBHAKARNA_PHASE_BODY,
  },
  clearedBeat(STRINGS.GATE7_KUMBHAKARNA_DEFEAT_1_BIG, STRINGS.GATE7_KUMBHAKARNA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE7_KUMBHAKARNA_DEFEAT_2_BIG, STRINGS.GATE7_KUMBHAKARNA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE7_KUMBHAKARNA_DEFEAT_3_BIG, STRINGS.GATE7_KUMBHAKARNA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE7_KUMBHAKARNA_DEFEAT_4_BIG, STRINGS.GATE7_KUMBHAKARNA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE7_KUMBHAKARNA_DEFEAT_5_BIG, STRINGS.GATE7_KUMBHAKARNA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE7_KUMBHAKARNA_DEFEAT_6_BIG, STRINGS.GATE7_KUMBHAKARNA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE7_KUMBHAKARNA_DEFEAT_7_BIG, STRINGS.GATE7_KUMBHAKARNA_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE7_KUMBHAKARNA_DEFEAT_8_BIG, STRINGS.GATE7_KUMBHAKARNA_DEFEAT_8_BODY),
];

export const GATE_7 = {
  id: 'gate-7',
  name: STRINGS.GATE7_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the three-ledge climb and both gaps. */
  voidY: -28,
  arenaTop: ARENA_TOP,
  exitX: 190,
  end: 196,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
