// Gate 8 — Lanka's battlements, into Ravana's throne room.
//
// This is gate 8 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Ravana, not the retired Deva-lok/Chiranjivi. Act 2's climax and the
// campaign's first tier-3 fight since Duryodhana — four weapons on four
// dedicated arms, and a head-arc that announces which one is coming (see
// `Ravana` in `src/game/boss.js`).
//
// The gate's own table gives it three jobs. It is the **most eventful of the
// act**, capped at gate 03's peak: the ramparts gate 7 climbed become a wall
// climbed under siege and then descended into the city, one rise and one gap
// more than gate 7 spent, and no new traversal verb anywhere — the honest way
// to be the act's busiest gate is more of what the act already taught, not
// something the hunter has never done. It is where the **Lanka soldier is
// first combined with anything** (`Kawach`, reskinned as the household royal
// guard), which is the pairing gate 7's solo debut existed to make legible.
// And it flattens completely for the throne room, the same convention every
// boss arena in the campaign holds to.
//
// No new archetype is spent here. Act 2's one new-archetype budget went to
// the Lanka soldier at gate 07, and the boss is the gate's own new thing.

import { RAVANA } from '../config.js';
import { P } from '../../render/palette.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * "Rakshasa/forest tones, moving toward regal gold approaching Ravana" per
 * docs/SPEC-CAMPAIGN.md's per-act table — arriving. Gate 6 let the first gold
 * into the horizon, gate 7 left the canopy for worked stone under torchlight,
 * and here the gold *is* the realm: a burning city under a night sky, lit from
 * below rather than above. The crystal accent doubles as `lankaCore`, his own
 * telegraph gold, the same trick every prior gate's crystal plays against its
 * Warden's core.
 */
const REALM = {
  sky: { zenith: 0x0d0710, mid: 0x40182a, horizon: 0xd8863a },
  fog: { color: 0x4a2418, near: 18, far: 105 },

  grass: 0x3a2a1c,
  grassBlade: 0x5a4224,
  grassBladeTip: 0xa8823a,
  rock: 0x5a4632,
  rockDark: 0x2a1e14,
  rockMoss: 0x4a3520,
  stone: 0x6e5c3c,
  crystal: P.lankaCore,

  mist: { back: 0x8a4a24, front: 0x33190f },
  ridges: [0x1d1014, 0x33201c, 0x4e3324],
};

/**
 * The wall, the city, the hall.
 *
 * Gate 7 stacked three rises and two gaps and called that the act's
 * escalation. This adds one of each — four rises up the battlement, three
 * gaps on the descent — and nothing else: same `?vtest`-validated
 * `thickness: 1.0` on every ledge, same 4-unit x-overlap, same 3.8-unit gap
 * that `tools/gatecheck.js`'s `jumpReserve` holds against this build's actual
 * running jump rather than against a remembered number.
 *
 * Everything past the last descent is flat and barren, for the reason every
 * boss arena is: his sweep reaches 5.6 units, his trishul thrust 4.0 past a
 * body 3.4 wide, and the chakra crosses the whole room. A boulder in here is
 * not cover, it is a thing to be pinned against.
 */
const SEGMENTS = [
  // The beach-head below the wall — room to read the realm before anything
  // is standing in it.
  { x0: -6, x1: 22, top: 0, barren: true, depth: 9, boulders: 2, pillars: 1 },

  // The battlement walk. Wide and flat: the guard forms a line here, and a
  // corridor would pick the hunter's approach angle for them.
  { x0: 22, x1: 60, top: 0, barren: true, depth: 9, pillars: 2, crystals: 1, thickness: 6 },

  // Four ledges climbing the wall — gate 7's three, plus one.
  { x0: 56, x1: 68, top: 3, barren: true, depth: 5, thickness: 1.0, pillars: 1 },
  { x0: 64, x1: 76, top: 6, barren: true, depth: 5, thickness: 1.0, crystals: 1 },
  { x0: 72, x1: 84, top: 9, barren: true, depth: 5, thickness: 1.0, pillars: 1 },
  { x0: 80, x1: 94, top: 12, barren: true, depth: 5, thickness: 1.0, crystals: 1 },

  // The inner gate, held. Flat and wide enough for the second formation.
  { x0: 97.8, x1: 132, top: 9, barren: true, depth: 9, thickness: 6, pillars: 2 },

  // The descent into the city, with the gate's other two gaps in it.
  { x0: 135.8, x1: 150, top: 6, barren: true, depth: 5, thickness: 1.0, crystals: 1 },
  { x0: 153.8, x1: 168, top: 3, barren: true, depth: 5, thickness: 1.0, pillars: 1 },
  { x0: 164, x1: 182, top: 0, barren: true, depth: 9, boulders: 2, pillars: 1 },

  // The throne room. Long and flat and empty — see `SEGMENTS`'s note above.
  { x0: 182, x1: 248, top: ARENA_TOP, barren: true, depth: 10, thickness: 6, crystals: 2 },
];

/**
 * The royal guard: `Kawach` pulled from its own plate to Lanka's court gold.
 * Only colour moves — the plant-and-bash underneath is the archetype's own,
 * unchanged, the same reskin discipline every gate since 2 has kept.
 *
 * The Lanka soldier standing beside it is deliberately *not* reskinned. Its
 * spear's reach is the one thing gate 07 spent an entire solo debut teaching,
 * and repainting the silhouette that taught it is how a taught tell gets
 * untaught. The household guard is the new thing on the field here; the
 * soldier is the thing the hunter is supposed to already recognise.
 */
const ROYAL_GUARD_SKIN = {
  body: P.lankaGuardPlate,
  dark: P.lankaGuardPlateDark,
  eye: P.kawachEye,
};

const SOLDIER = { type: 'lankaSoldier' };
const GUARD = { type: 'kawach', skin: ROYAL_GUARD_SKIN };

/**
 * Ravana. Tier 3 — a bespoke `Boss` subclass per issue #40's locked four-boss
 * list, with its own rig (`buildRavana` in `models.js`) and its own numbers
 * (`RAVANA` in `config.js`), which is a different relationship to `boss.js`
 * than any Warden in the act has.
 */
const WARDEN = {
  archetype: 'ravana',
  title: STRINGS.GATE8_WARDEN_TITLE,
  stats: RAVANA,
};

/**
 * Three encounters, which is the table's own count: two before him.
 *
 * Both are combinations, and the first is the pairing this act has been
 * building toward — the spear the hunter learned alone at gate 07, now
 * standing behind a shield that most of the move list does nothing to. The
 * order inside it is the teaching: the guard plants first and nearest, so the
 * hunter who commits to breaking it is still inside the spear's reach when
 * the two soldiers arrive behind it. That is stated as a consequence and by
 * nothing else — there is no `note` here, because nothing renders one
 * (`docs/DECISIONS.md` § "regular-enemy encounter windows stop freezing the
 * game and stop describing the enemy", 2026-08-09), and five earlier gate
 * files already author a key that does nothing.
 *
 * The second is the same two archetypes at the inner gate with the ratio
 * inverted — two guards, two soldiers, no free angle — which is escalation on
 * count rather than on a tell the hunter has not read yet.
 *
 * `boss: true` on the third is a claim about rank and it is one this gate
 * actually has: Ravana is one of the four locked bosses, so the camera zoom
 * and the audio intensity it turns on are earned here where gates 5, 6 and 7
 * correctly omitted them.
 */
const ENCOUNTERS = [
  {
    id: 'the-battlements',
    trigger: 32,
    lock: [24, 58],
    intro: {
      title: STRINGS.GATE8_BATTLEMENTS_TITLE,
      body: STRINGS.GATE8_BATTLEMENTS_BODY,
    },
    spawns: [
      { ...GUARD, x: 44, delay: 0 },
      { ...SOLDIER, x: 52, delay: 1.4 },
      { ...SOLDIER, x: 38, delay: 2.0 },
    ],
  },
  {
    id: 'the-inner-gate',
    trigger: 106,
    lock: [99, 130],
    intro: {
      title: STRINGS.GATE8_INNER_GATE_TITLE,
      body: STRINGS.GATE8_INNER_GATE_BODY,
    },
    spawns: [
      { ...GUARD, x: 116, delay: 0 },
      { ...SOLDIER, x: 124, delay: 0.5 },
      { ...GUARD, x: 110, delay: 1.1 },
      { ...SOLDIER, x: 128, delay: 1.6 },
    ],
  },
  {
    id: 'ravana',
    trigger: 192,
    lock: [184, 244],
    boss: true,
    intro: { title: STRINGS.GATE8_RAVANA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 214, delay: 0.8 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line": thirteen paged 'intro' beats and eight paged 'cleared' beats, with
 * one 'phase' beat between them — fired here by `Ravana._enrage` in
 * `boss.js` through `Game.firePhaseBeat`, which makes this the fourth
 * consumer of that machinery and the first that is not a Warden.
 *
 * The scene is carrying the whole of his respectful-treatment note. See the
 * comment above these keys in `strings.js` for what each half of it is doing
 * and which half is deliberately left open.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE8_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE8_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE8_RAVANA_INTRO_1_BIG, STRINGS.GATE8_RAVANA_INTRO_1_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_2_BIG, STRINGS.GATE8_RAVANA_INTRO_2_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_3_BIG, STRINGS.GATE8_RAVANA_INTRO_3_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_4_BIG, STRINGS.GATE8_RAVANA_INTRO_4_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_5_BIG, STRINGS.GATE8_RAVANA_INTRO_5_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_6_BIG, STRINGS.GATE8_RAVANA_INTRO_6_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_7_BIG, STRINGS.GATE8_RAVANA_INTRO_7_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_8_BIG, STRINGS.GATE8_RAVANA_INTRO_8_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_9_BIG, STRINGS.GATE8_RAVANA_INTRO_9_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_10_BIG, STRINGS.GATE8_RAVANA_INTRO_10_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_11_BIG, STRINGS.GATE8_RAVANA_INTRO_11_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_12_BIG, STRINGS.GATE8_RAVANA_INTRO_12_BODY),
  introBeat(STRINGS.GATE8_RAVANA_INTRO_13_BIG, STRINGS.GATE8_RAVANA_INTRO_13_BODY),
  {
    at: 'phase',
    title: STRINGS.GATE8_WARDEN_TITLE,
    big: STRINGS.GATE8_RAVANA_PHASE_BIG,
    body: STRINGS.GATE8_RAVANA_PHASE_BODY,
  },
  clearedBeat(STRINGS.GATE8_RAVANA_DEFEAT_1_BIG, STRINGS.GATE8_RAVANA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE8_RAVANA_DEFEAT_2_BIG, STRINGS.GATE8_RAVANA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE8_RAVANA_DEFEAT_3_BIG, STRINGS.GATE8_RAVANA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE8_RAVANA_DEFEAT_4_BIG, STRINGS.GATE8_RAVANA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE8_RAVANA_DEFEAT_5_BIG, STRINGS.GATE8_RAVANA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE8_RAVANA_DEFEAT_6_BIG, STRINGS.GATE8_RAVANA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE8_RAVANA_DEFEAT_7_BIG, STRINGS.GATE8_RAVANA_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE8_RAVANA_DEFEAT_8_BIG, STRINGS.GATE8_RAVANA_DEFEAT_8_BODY),
];

export const GATE_8 = {
  id: 'gate-8',
  name: STRINGS.GATE8_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the four-ledge climb and all three gaps. */
  voidY: -30,
  arenaTop: ARENA_TOP,
  exitX: 242,
  end: 248,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
