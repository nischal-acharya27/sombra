// Gate 9 — Mathura's Akhada.
//
// This is gate 9 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Kamsa, not the retired Yama-sabha/Bakaya. Act 3's opener, and the act's one
// new-regular-enemy spend — a Mathura akhada wrestler/grappler, extending
// `Charger`'s chase-and-commit skeleton, giving literal form to the source
// detail that Kamsa staged a public wrestling tournament and set his
// champions against the boy before he ever reached the throne himself.
//
// The gate's own table gives it a moderate descent: tiered stone spectator
// stands stepping down into the packed-earth pit, flattening completely for
// both fights. One regular encounter — the wrestler, met alone, protecting
// its own solo debut per `tools/gatecheck.js`'s `soloDebut` check, since the
// table never combines it with anything anywhere in the campaign — then
// Kamsa: fast and grappling against his own heavy, armoured, committal kit
// (overhead shackle-iron mace smash, mid-range chain lash).
//
// Kamsa's own handoff is the one Warden entry on the roster that declines a
// dialogue-beat hook at the escalation moment outright — no phase-transition
// flag, and the ordinary enrage fires no line, only the wind-ups tightening.
// His 13 intro beats and 8 defeat beats carry the respectful-treatment note
// instead: every line stays on the prophecy and his fear of it, never on the
// children the prophecy cost, per the handoff's explicit instruction that
// the armour and the mace should carry that backstory worn, not narrated.

import { KAMSA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * "Divine-tyrant — gold and dark red, prophecy-coded" per
 * `docs/SPEC-CAMPAIGN.md`'s per-act table — a torch-lit court arena at night,
 * gold firelight against a dark maroon sky. Kamsa's own palette
 * (`mathuraPlate`/`mathuraIron` in `palette.js`) deliberately breaks from
 * this register into cold iron, per his entry's own case against a third
 * gold-and-oxblood court palette in a row; the *realm* still spends the
 * act's register, the same way gate 6's forest tones carried Act 2's own
 * table entry even where Shurpanakha's individual palette departed from it.
 * `crystal` ties to `P.amber` directly rather than a bespoke boss-core hex —
 * Kamsa has no core of his own, only the shared damage-signal amber his eyes
 * and mace already flare, so the accent doubles as his own tell rather than
 * inventing a colour nothing on his rig actually carries.
 */
const REALM = {
  sky: { zenith: 0x120a08, mid: 0x3a1810, horizon: 0xb87a2a },
  fog: { color: 0x2e1712, near: 18, far: 108 },

  grass: 0x3a2c1e,
  grassBlade: 0x54402a,
  grassBladeTip: 0xa0793a,
  rock: 0x4a3a2a,
  rockDark: 0x201812,
  rockMoss: 0x40301e,
  stone: 0x5e4c34,
  crystal: 0xffb347,

  mist: { back: 0x7a4a1e, front: 0x2e1712 },
  ridges: [0x1a120c, 0x2e1712, 0x4a3a2a],
};

/**
 * A descent, not a climb — tiered stands stepping down from the entrance to
 * the packed-earth pit, then flat for both fights. No jump-gated rise
 * anywhere in the stands themselves (dropping a tier costs nothing the way
 * climbing one does); the one real gap sits where the stands give way to the
 * pit proper, the same `?vtest`-validated 3.8-unit figure every gate's gap
 * is measured against.
 */
const SEGMENTS = [
  // The entrance tier — top of the stands, room to read the realm.
  { x0: -6, x1: 14, top: 6, barren: true, depth: 5, thickness: 1.0, boulders: 1, pillars: 1 },

  // Two more tiers, stepping down. `thickness: 1.0` on each — the
  // `?vtest`-validated figure every stacked ledge in the campaign uses, so a
  // step down never reads to the collision resolver as a wall.
  { x0: 10, x1: 28, top: 3, barren: true, depth: 5, thickness: 1.0, boulders: 1, pillars: 1 },
  { x0: 24, x1: 44, top: 0, barren: true, depth: 5, thickness: 1.0, boulders: 2, pillars: 1 },

  // The pit floor: flat and wide, the wrestler's own ground.
  { x0: 40, x1: 76, top: 0, barren: true, depth: 9, thickness: 6, pillars: 2 },

  // The one real gap — 3.8 wide — where the stands' floor gives way to
  // Kamsa's own arena.
  { x0: 79.8, x1: 130, top: ARENA_TOP, barren: true, depth: 10, thickness: 6, boulders: 2, pillars: 2 },
];

/**
 * Kamsa. Tier 2 — a new rig in `models.js`, but `Kamsa` in `enemies.js`
 * extends `Enemy` directly, the same shape `Bakasura` and `Kumbhakarna`
 * already use.
 */
const WARDEN = {
  archetype: 'kamsa',
  title: STRINGS.GATE9_WARDEN_TITLE,
  stats: KAMSA,
};

/**
 * The Mathura wrestler: gate 9's new regular archetype, met alone per the
 * gate's own table — its solo debut, protected the same way every new-rig
 * regular archetype's has been since the Lanka soldier's at gate 07.
 */
const ENCOUNTERS = [
  {
    id: 'the-pit',
    trigger: 46,
    lock: [42, 74],
    intro: {
      title: STRINGS.GATE9_PIT_TITLE,
      body: STRINGS.GATE9_PIT_BODY,
    },
    spawns: [
      { type: 'mathuraWrestler', x: 56, delay: 0 },
      { type: 'mathuraWrestler', x: 66, delay: 0.7 },
    ],
  },
  {
    id: 'kamsa',
    trigger: 100,
    lock: [82, 126],
    intro: { title: STRINGS.GATE9_KAMSA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 108, delay: 0.9 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line": thirteen paged 'intro' beats and eight paged 'cleared' beats, and no
 * `phase` beat between them — Kamsa's entry carries no phase-transition flag
 * and, uniquely on the roster so far, declines the ordinary enrage's
 * dialogue-beat hook too, per the respectful-treatment note above.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE9_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE9_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE9_KAMSA_INTRO_1_BIG, STRINGS.GATE9_KAMSA_INTRO_1_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_2_BIG, STRINGS.GATE9_KAMSA_INTRO_2_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_3_BIG, STRINGS.GATE9_KAMSA_INTRO_3_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_4_BIG, STRINGS.GATE9_KAMSA_INTRO_4_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_5_BIG, STRINGS.GATE9_KAMSA_INTRO_5_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_6_BIG, STRINGS.GATE9_KAMSA_INTRO_6_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_7_BIG, STRINGS.GATE9_KAMSA_INTRO_7_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_8_BIG, STRINGS.GATE9_KAMSA_INTRO_8_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_9_BIG, STRINGS.GATE9_KAMSA_INTRO_9_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_10_BIG, STRINGS.GATE9_KAMSA_INTRO_10_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_11_BIG, STRINGS.GATE9_KAMSA_INTRO_11_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_12_BIG, STRINGS.GATE9_KAMSA_INTRO_12_BODY),
  introBeat(STRINGS.GATE9_KAMSA_INTRO_13_BIG, STRINGS.GATE9_KAMSA_INTRO_13_BODY),
  clearedBeat(STRINGS.GATE9_KAMSA_DEFEAT_1_BIG, STRINGS.GATE9_KAMSA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE9_KAMSA_DEFEAT_2_BIG, STRINGS.GATE9_KAMSA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE9_KAMSA_DEFEAT_3_BIG, STRINGS.GATE9_KAMSA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE9_KAMSA_DEFEAT_4_BIG, STRINGS.GATE9_KAMSA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE9_KAMSA_DEFEAT_5_BIG, STRINGS.GATE9_KAMSA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE9_KAMSA_DEFEAT_6_BIG, STRINGS.GATE9_KAMSA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE9_KAMSA_DEFEAT_7_BIG, STRINGS.GATE9_KAMSA_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE9_KAMSA_DEFEAT_8_BIG, STRINGS.GATE9_KAMSA_DEFEAT_8_BODY),
];

export const GATE_9 = {
  id: 'gate-9',
  name: STRINGS.GATE9_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the lowest tier and the gap both. */
  voidY: -22,
  arenaTop: ARENA_TOP,
  exitX: 122,
  end: 130,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
