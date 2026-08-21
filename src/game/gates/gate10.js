// Gate 10 — Gokul, Asleep.
//
// This is gate 10 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Putana, not the retired Bhavachakra/Maun-Ankur. Act 3's second gate, and
// the campaign's one deliberate pacing dip: "flat, minimal, deliberately
// intimate," zero regular encounters — a real first, and a real breather
// between gate 9's crowded akhada and gate 11's ahead. Padding the approach
// with a reskinned mob would work against the intimacy her respectful-
// treatment note asks the design to protect, so nothing here does that; the
// single encounter is the Warden herself, met alone, the way every Warden
// in the campaign is met.
//
// A household in Gokul at night, climbed rather than crossed: a courtyard,
// a two-riser stair to the loft, a few roof beams over gaps small enough to
// call forgiving, then down through the roof hatch into the nursery where
// she is waiting. Four stations, and each one is told apart by the
// architecture standing in it rather than by how many boulders its segment
// asked for — the well and the byre in the yard, the neighbour's ridge level
// with the loft, the village dropping away below the roof beams, the empty
// cradle at the end of the nursery. That composition is the whole point of
// the rebuild and it lives in `LANDMARKS` below.
//
// Every rise and every gap reuses numbers already measured elsewhere in the
// campaign — no new traversal primitive,
// and nothing steeper than a gate this quiet can carry. The one thing this
// build deliberately does *not* do is give her own arena a second level:
// every Warden arena in the campaign flattens completely for the fight
// (Ravana's own gate 8 note: "a boulder in here is not cover, it is a thing
// to be pinned against") because a committed move needs open, readable
// ground, and that rule outranks the level-design brief's ask for a
// vertical-positioning encounter — see `docs/DECISIONS.md` for the call.

import { PUTANA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 3;

/**
 * "Divine-tyrant — gold and dark red, prophecy-coded" per
 * `docs/SPEC-CAMPAIGN.md`'s per-act table, held to its nocturnal register:
 * a sleeping village under a deep indigo night, lit from the ground up by
 * oil lamps rather than from the sky down. `crystal` carries `P.amber`
 * directly, the lamp-glow read doubling as her own shared damage-signal
 * telegraph colour, the same trick gate 9's realm already plays with
 * Kamsa's own core-less kit.
 */
const REALM = {
  sky: { zenith: 0x080512, mid: 0x1c1428, horizon: 0x3a1c1c },
  fog: { color: 0x241a2c, near: 16, far: 96 },

  grass: 0x241e28,
  grassBlade: 0x3a2e30,
  grassBladeTip: 0x8a6a3a,
  rock: 0x362a24,
  rockDark: 0x18120e,
  rockMoss: 0x342a1c,
  stone: 0x4a3a2c,
  crystal: 0xffb347,

  mist: { back: 0x4a2c2c, front: 0x1c1420 },
  ridges: [0x140e14, 0x241a20, 0x362a24],
};

/**
 * A climb, not a crossing — the household's own stair and roof, every
 * number reused from an earlier gate rather than invented for this one.
 * Courtyard → veranda → the loft (one two-step stair) → three roof beams
 * over small, forgiving gaps → the hatch down into the nursery. `thickness:
 * 1.0` on every ledge, a 3-unit rise on every climb and a 4-unit x-overlap
 * are the same `?vtest`-validated figures gate 6's canopy already measured;
 * the roof gaps (2.2–2.6) are deliberately narrower than the campaign's own
 * `?vtest`-validated 3.8-unit "real gap," which holds the reserve
 * `tools/gatecheck.js`'s `jumpReserve` checks well past its floor rather
 * than at it — the light, forgiving platforming the level-design brief
 * asked for, not a second copy of gate 8's climb.
 *
 * The 3-unit rise is not the gentler figure a "sleeping household" first
 * suggests: `headroomClear` derives its floor from `PLAYER.hh` and
 * `thickness: 1.0` (`(top - thickness) - low.top >= PLAYER.hh * 2 + 0.05`),
 * which a smaller rise cannot clear — at 1.5 units the ledge above reads to
 * the collision resolver as a wall, not a mezzanine to stand under. See
 * `docs/DECISIONS.md` for the reachability failure this caught.
 */
const SEGMENTS = [
  // The courtyard: the yard itself, and the only ground in the gate deep
  // enough to stand a well and a shrine on without either hanging off the
  // back lip. `depth: 9` is the arena's own figure, spent here for the same
  // reason — this is a room the hunter is meant to stop and read, not a
  // corridor they are meant to leave.
  { x0: -6, x1: 20, top: 0, depth: 9, boulders: 2 },

  // The veranda — the stair's first riser. `barren` from here up to the
  // hatch: everything above the yard is the household's own timber and
  // thatch, and grass growing on a roof is the one detail that would say
  // "ruin" in a gate whose whole argument is that the place is asleep and
  // still lived in.
  { x0: 16, x1: 38, top: 3.0, thickness: 1.0, barren: true, boulders: 1 },

  // The loft landing — the stair's second riser, wide and flat: a
  // visually distinct mid-level room, not a corridor. What makes it distinct
  // is now its architecture rather than its scatter count: the rooftop tulsi
  // shrine at its far end, and the neighbouring house standing ridge-level
  // with it behind. See `LANDMARKS`.
  { x0: 34, x1: 62, top: 6.0, thickness: 1.0, barren: true, depth: 7 },

  // The roof: three beams, two small gaps, the light platforming section —
  // jumping is the only way across, and each gap is well inside the
  // campaign's own measured reserve. A lamp stands just past each of the
  // three landing lips, so at night the crossing is a line of lights to aim
  // at rather than three dark edges to guess at.
  { x0: 64.2, x1: 78, top: 6.0, thickness: 1.0, barren: true },
  { x0: 80.4, x1: 94, top: 6.0, thickness: 1.0, barren: true },
  { x0: 96.6, x1: 112, top: 6.0, thickness: 1.0, barren: true },

  // Down through the hatch — a free 3-unit drop, no jump required, into the
  // nursery. Flat and wide from here on, the same convention every Warden
  // arena in the campaign holds to.
  //
  // Shortened from 68 units to 54 in the rebuild. The old arena put 36 units
  // of empty floor between the hatch and the trigger, which is six seconds of
  // walking with nothing to meet and nothing to look at — the single largest
  // stretch of unrewarded ground in the gate, and the easiest thing to spend
  // against the brief's 2–4 minute target. What is left is an approach the
  // hunter crosses in about three seconds, lit on one side and ending at the
  // cradle, and an arena still wider than gate 9's for a Warden whose longest
  // reach is 6 units.
  { x0: 108, x1: 162, top: ARENA_TOP, barren: true, depth: 9, thickness: 6, boulders: 1 },
];

/**
 * Where the household stands.
 *
 * This array is what the rebuild exists for. Before it, a gate could say how
 * many boulders a segment had and never where any of them went, so "the
 * courtyard", "the loft" and "the boss approach" were three stretches of the
 * same scatter at three different realm-lit heights (`docs/DECISIONS.md`
 * § "Gate 10's rebuild opens one authoring seam"). Here each station is told
 * apart by *what stands in it* — the yard has the well, the loft has the
 * rooftop shrine, the roofs have the village falling away below them, the
 * nursery has the cradle — and none of them needs a different scatter density
 * to be a different place. That is also why the pillar counts are gone from
 * `SEGMENTS` entirely: a broken temple pillar is the wrong ruin for a village
 * that is asleep rather than abandoned, and it was only ever there to keep the
 * eye busy.
 *
 * Three things bind every number below.
 *
 * **Landmarks have no collision.** `Level.solids` is built from `segments`
 * alone. Nothing here can be stood on, climbed or walked into, so nothing here
 * is load-bearing for traversal — the stair is still the stair. These make the
 * segments read as a household; the segments remain the household.
 *
 * **Scenery lives at negative Z.** The camera sits at +Z. The small kinds sit
 * a couple of units behind the play plane, at the back of the platform they
 * stand on, the same band `Level._dress` scatters into. The houses sit at
 * z −13 and further: a house's veranda posts reach 7.2 units toward +z in its
 * own local space, so anything nearer would put timber in front of the fight.
 *
 * **The village floor is y 0 and the hunter climbs off it.** Every house is
 * placed at y 0 whatever the segment in front of it is doing, because at
 * z −13 there is no floor at all — only backdrop — and one consistent ground
 * plane behind the play plane is what turns the climb into a climb. It is the
 * whole reason the loft reads as a loft: at y 6 the hunter is standing level
 * with the neighbour's ridge, and by the third roof beam they are looking down
 * on one. The nursery inherits the same trick from the other end — its floor
 * is 3 units above the village, so it is an upper storey rather than a field.
 */
const LANDMARKS = [
  // -- the courtyard: a household seen from outside ------------------------
  // Read in the order they are walked past: the shrine at the threshold, then
  // the yard's own lamp, then the well at its centre, then the lamp at the
  // foot of the stair. The byre is `gokul-house` turned a quarter and shrunk
  // to just over half — a sixth kind was declined in favour of exactly this.
  { kind: 'gokul-shrine', x: 6, y: 0, z: -2.8 },
  { kind: 'gokul-lamp', x: 9.5, y: 0, z: -1.8 },
  { kind: 'gokul-well', x: 13, y: 0, z: -2.6 },
  { kind: 'gokul-lamp', x: 15, y: 0, z: -2.2 },
  { kind: 'gokul-house', x: -2, y: 0, z: -13, rotY: Math.PI / 2, scale: 0.55 },

  // -- the climb ------------------------------------------------------------
  // One lamp on the veranda riser and nothing else. The veranda is a step, not
  // a station, and the first placement tried here — a full-scale house square
  // behind it — put a twelve-unit mud wall at the hunter's own eye level and
  // swallowed the whole frame. Standing on a 3-unit riser is exactly the wrong
  // height to be near a house that stands on 0.
  { kind: 'gokul-lamp', x: 26, y: 3, z: -2.0 },

  // -- the loft: a rooftop, and the one green thing in the gate ------------
  // The neighbour's house is the loft's own set-piece: full scale, square to
  // the camera, ridge capping at 7.15 against a loft floor of 6. That single
  // measurement is what makes the mid-level area feel like one — the hunter is
  // level with a roofline instead of standing on a wider ledge. It sits at
  // z −17, four units further back than any other house on the climb, because
  // at −13 a roof this close to eye level reads as a wall.
  { kind: 'gokul-lamp', x: 40, y: 6, z: -2.4 },
  { kind: 'gokul-house', x: 44, y: 0, z: -17 },
  { kind: 'gokul-shrine', x: 57, y: 6, z: -2.6 },

  // -- the roofs: the village falling away ---------------------------------
  // One lamp just past each landing lip — 64.2, 80.4 and 96.6 — so every jump
  // is made toward a light. The house behind is at 0.75 scale and turned off
  // square, which caps its ridge at 5.4 against a beam top of 6: from up here
  // the hunter is looking down on a roof they were looking up at two stations
  // ago.
  { kind: 'gokul-lamp', x: 65.5, y: 6, z: -2.2 },
  { kind: 'gokul-lamp', x: 81.8, y: 6, z: -2.2 },
  { kind: 'gokul-house', x: 88, y: 0, z: -13, rotY: -0.4, scale: 0.75 },
  { kind: 'gokul-lamp', x: 98.0, y: 6, z: -2.2 },

  // -- the nursery: the approach, and what is at the end of it -------------
  // The approach is lit and the arena is not: two lamps between the hatch and
  // the trigger, then bare floor. The tableau at the far end is a cradle with
  // a lamp at either shoulder, which is the composition a shrine gets — and
  // Putana spawns at 138, between the hunter and it. Nothing else is in her
  // arena, per the flat-arena rule; the cradle and its lamps are scenery, and
  // she can be fought straight through them.
  //
  // The cradle is empty and stays empty. Her respectful-treatment note rules
  // out a feeding tableau anywhere in this gate, and the kind is built hollow
  // so that the emptiness is the thing the hunter can actually see.
  { kind: 'gokul-lamp', x: 112, y: ARENA_TOP, z: -3.6 },
  { kind: 'gokul-lamp', x: 122, y: ARENA_TOP, z: -3.6 },
  { kind: 'gokul-lamp', x: 143.4, y: ARENA_TOP, z: -3.4 },
  { kind: 'gokul-cradle', x: 146, y: ARENA_TOP, z: -3.4 },
  { kind: 'gokul-lamp', x: 148.6, y: ARENA_TOP, z: -3.4 },
];

/**
 * The hero silhouette — the one `src/main.js` drifts the title-card camera
 * across, and gate 10's first: the prior build had no `landmark` at all and
 * fell back to the midpoint of a gate with nothing standing at its midpoint.
 *
 * It is the house the nursery is inside, standing behind the arena at the far
 * end. Every other gate's landmark is a monument the hunter walks past; this
 * one is a destination, which is the honest shape for a gate whose whole
 * traversal is climbing into a single house. Turned slightly off square so the
 * drift crosses a corner rather than sliding along a flat wall, and left at
 * y 0 with the rest of the village so the nursery floor above it still reads
 * as an upper storey.
 *
 * Held at z −19, further back than any other house in the gate. Nearer, its
 * eaves crossed the cradle at the same screen height and the two read as one
 * confused mass; from here it frames the tableau instead of sitting on it.
 */
const HERO = { kind: 'gokul-house', x: 150, y: 0, z: -19, rotY: 0.18 };

/**
 * Putana. Tier 2 — a new rig for each of her two forms, but `Putana` in
 * `enemies.js` reads every number from the block it is handed, exactly as
 * `Kamsa` and `Shurpanakha` do.
 */
const WARDEN = {
  archetype: 'putana',
  title: STRINGS.GATE10_WARDEN_TITLE,
  stats: PUTANA,
};

/**
 * One encounter: Putana, met alone. Zero regular encounters — her own
 * table's explicit call, and the campaign's first gate to make it.
 */
const ENCOUNTERS = [
  {
    // She spawns 2 units past the trigger and 10 units short of the cradle, so
    // the hunter's first sight of her is her standing in front of it.
    id: 'putana',
    trigger: 136,
    lock: [116, 158],
    intro: { title: STRINGS.GATE10_PUTANA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 138, delay: 0.9 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line": thirteen paged 'intro' beats and eight paged 'cleared' beats, with
 * one 'phase' beat between them — fired by `Putana.takeHit` in `enemies.js`
 * through `Game.firePhaseBeat` at her HP threshold. Written toward release
 * rather than a villainy recap or a victory the hunter celebrates, the same
 * escort-not-punishment framing Shurpanakha's reveal beat uses: nothing here
 * stages a feeding tableau, and nothing frames the clear as a monster put
 * down rather than a soul the stopped Wheel was holding in place.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE10_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE10_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE10_PUTANA_INTRO_1_BIG, STRINGS.GATE10_PUTANA_INTRO_1_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_2_BIG, STRINGS.GATE10_PUTANA_INTRO_2_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_3_BIG, STRINGS.GATE10_PUTANA_INTRO_3_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_4_BIG, STRINGS.GATE10_PUTANA_INTRO_4_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_5_BIG, STRINGS.GATE10_PUTANA_INTRO_5_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_6_BIG, STRINGS.GATE10_PUTANA_INTRO_6_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_7_BIG, STRINGS.GATE10_PUTANA_INTRO_7_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_8_BIG, STRINGS.GATE10_PUTANA_INTRO_8_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_9_BIG, STRINGS.GATE10_PUTANA_INTRO_9_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_10_BIG, STRINGS.GATE10_PUTANA_INTRO_10_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_11_BIG, STRINGS.GATE10_PUTANA_INTRO_11_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_12_BIG, STRINGS.GATE10_PUTANA_INTRO_12_BODY),
  introBeat(STRINGS.GATE10_PUTANA_INTRO_13_BIG, STRINGS.GATE10_PUTANA_INTRO_13_BODY),
  {
    at: 'phase',
    title: STRINGS.GATE10_WARDEN_TITLE,
    big: STRINGS.GATE10_PUTANA_PHASE_BIG,
    body: STRINGS.GATE10_PUTANA_PHASE_BODY,
  },
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_1_BIG, STRINGS.GATE10_PUTANA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_2_BIG, STRINGS.GATE10_PUTANA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_3_BIG, STRINGS.GATE10_PUTANA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_4_BIG, STRINGS.GATE10_PUTANA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_5_BIG, STRINGS.GATE10_PUTANA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_6_BIG, STRINGS.GATE10_PUTANA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_7_BIG, STRINGS.GATE10_PUTANA_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE10_PUTANA_DEFEAT_8_BIG, STRINGS.GATE10_PUTANA_DEFEAT_8_BODY),
];

export const GATE_10 = {
  id: 'gate-10',
  name: STRINGS.GATE10_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the lowest courtyard floor and the roof gaps both. */
  voidY: -20,
  arenaTop: ARENA_TOP,
  exitX: 154,
  end: 162,

  segments: SEGMENTS,
  landmark: HERO,
  landmarks: LANDMARKS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
