// Gate 6 — Panchavati (Ramayana, Aranya Kanda).
//
// This is gate 6 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Shurpanakha, not the retired Manav-lok. Act 2's third fight, and the gate
// its own table hands the campaign's **first combination encounter** —
// `Raakchyas` reskinned as a Panchavati forest-rakshasa alongside `Tantrik`
// reskinned as a jungle summoner-priest.
//
// The combination is the lesson. `Tantrik` does no damage itself and raises
// what does, so the fight only reads as a fight if the hunter re-orders their
// targets — which is why the act spends its combination lever on the one
// existing archetype already built to teach target-prioritization rather than
// inventing a new mechanic to teach the same thing. Both archetypes debuted
// solo long before this (gates 1 and 4 under the old campaign, and
// `tools/gatecheck.js`'s `soloDebut` check keeps that a fact rather than an
// intention) — except that under the fifteen-gate campaign `Tantrik` had no
// solo debut left anywhere, so this gate spends one of its own before the
// combination. See `ENCOUNTERS` for that whole reasoning.
//
// Traversal holds level with gate 04 rather than escalating on top of the
// newly-opened combination lever, per Act 2's own third call: the same forest
// register, the same canopy climb-and-descend, a different clearing.
//
// The roster's second phase-transition lands here, through the same
// `Game.firePhaseBeat` machinery Taraka's curse-reveal built two gates back
// (docs/DECISIONS.md § "Boss/Warden dialogue returns") — she is that
// machinery's second consumer, not a second bespoke wiring job. Hers carries
// a line where Taraka's is wordless: a curse landing on someone is not a
// disguise they were holding up themselves finally dropping, and only the
// second of those has anything to say.

import { SHURPANAKHA } from '../config.js';
import { STRINGS } from '../../ui/strings.js';
import { P } from '../../render/palette.js';

const ARENA_TOP = 0;

/**
 * Act 2's register, one gate further along than Taraka's: still deep forest
 * — "Rakshasa/forest tones, moving toward regal gold approaching Ravana"
 * per docs/SPEC-CAMPAIGN.md's per-act table — but with the first of the
 * act's gold creeping into the horizon and the crystal accent, since gate 8
 * is where that arc arrives. Gate 4 sat at the act's greenest; this sits a
 * step warmer without leaving the canopy.
 */
const REALM = {
  sky: { zenith: 0x0c1206, mid: 0x28361a, horizon: 0x6a6e2c },
  fog: { color: 0x33421c, near: 20, far: 110 },

  grass: 0x33421e,
  grassBlade: 0x415426,
  grassBladeTip: 0x9ac256,
  rock: 0x40361f,
  rockDark: 0x1f1a0f,
  rockMoss: 0x4c5a26,
  stone: 0x50442e,
  crystal: 0xc9b04a,

  mist: { back: 0x66763a, front: 0x33421c },
  ridges: [0x1f1a0f, 0x2e2814, 0x40361f],
};

/**
 * Gate 4's canopy shape, re-dressed rather than re-invented — the same two
 * stacked ledges up, the same mirrored descent, the same one real gap, the
 * same flat arena. "Moderate, same forest register as gate 04" is a
 * traversal-density call, and the honest way to hold density level is to
 * reuse the geometry that already measured at it: identical rises
 * (`thickness: 1.0`, 4-unit x-overlap, the `?vtest`-validated configuration)
 * and an identical 3.8-unit gap, which `tools/gatecheck.js`'s own
 * `jumpReserve` holds against this build's running jump rather than against
 * a remembered number.
 *
 * What differs is where the fight sits inside it. Gate 4 put its one grunt
 * encounter on the flat run *after* the gap; the combination encounter here
 * takes the wider ground *before* it, so the hunter has room to move between
 * two targets rather than a corridor that decides their order for them.
 */
const SEGMENTS = [
  // The way in: forest floor, dense enough to read as a different clearing
  // than Tataka-vana's.
  { x0: -6, x1: 12, top: 0, trees: 3, boulders: 2 },

  // The priest's own ground — it is met alone here before it is met beside
  // anything. See `ENCOUNTERS` for why this encounter exists at all.
  { x0: 12, x1: 40, top: 0, barren: true, depth: 9, boulders: 2, thickness: 6 },

  // The combination's ground — flat and wider. A fight that asks the hunter
  // to choose a target needs room to walk past the wrong one.
  { x0: 40, x1: 76, top: 0, barren: true, depth: 9, boulders: 2, thickness: 6 },

  // Two stacked ledges climbing into the canopy, then the mirrored descent —
  // gate 4's rises exactly, down to the 4-unit x-overlap.
  { x0: 72, x1: 84, top: 3, barren: true, depth: 5, thickness: 1.0, boulders: 1 },
  { x0: 80, x1: 94, top: 6, barren: true, depth: 5, thickness: 1.0, boulders: 1 },
  { x0: 90, x1: 102, top: 3, barren: true, depth: 5, thickness: 1.0 },
  { x0: 98, x1: 116, top: 0, trees: 2, boulders: 2 },

  // The one real gap — 3.8 wide, the figure every gate's gap is measured
  // against per docs/DECISIONS.md's "6.08-unit running jump" entry.
  { x0: 119.8, x1: 138, top: 0, trees: 2, boulders: 1, pillars: 1 },

  // Shurpanakha's clearing — flat, no cover. Her one move is a committed
  // step-in swipe, and a committed move needs open ground to be read in, the
  // same reason Taraka's arena and Bakasura's before it are bare.
  { x0: 138, x1: 186, top: ARENA_TOP, barren: true, depth: 9, boulders: 2, thickness: 6 },
];

/**
 * The forest rakshasa: `Raakchyas` pulled from court-violet to Panchavati
 * bark and leaf-rot. Only colour moves — the pounce underneath is the
 * archetype's own, unchanged, the same reskin discipline gate 2's village
 * rakshasa and gate 4's wisps keep.
 */
const FOREST_RAKSHASA_SKIN = {
  body: P.forestRakshasaBody,
  dark: P.forestRakshasaDark,
  spine: P.forestRakshasaSpine,
  eye: P.raakchyasEye,
};

/**
 * The jungle summoner-priest: `Tantrik` pulled from ash-linen to river-clay,
 * its sigil to a leaf-green. Same plant-and-cast, same 0.62s tell, same
 * "harmless itself, raises what isn't" shape the hunter met alone in gate 4
 * of the old campaign — which is precisely why it is the archetype this gate
 * spends its first combination on.
 */
const JUNGLE_PRIEST_SKIN = {
  robe: P.junglePriestRobe,
  dark: P.junglePriestRobeDark,
  eye: P.tantrikEye,
  sigil: P.junglePriestSigil,
};

/**
 * The gate's Warden: Shurpanakha is tier 2 (`docs/agents/villain-handoff.md`)
 * — a new rig for each of her two forms, but `Shurpanakha` in `enemies.js`
 * reads every number from the block it is handed, exactly as `Taraka` and
 * `Bakasura` do.
 */
const WARDEN = {
  archetype: 'shurpanakha',
  title: STRINGS.GATE6_WARDEN_TITLE,
  stats: SHURPANAKHA,
};

/**
 * Three encounters: the priest alone, the priest in company, then
 * Shurpanakha alone.
 *
 * The solo priest encounter is not in this gate's own table, and it is here
 * because the fifteen-gate campaign otherwise never introduces `Tantrik` at
 * all. Under the retired ten-gate content it debuted at that campaign's gate
 * 4; the fifteen-gate Act 1 spends `Kawach`, `Raakchyas` and `Charger`, and
 * Act 2's own new-archetype budget goes to the Lanka soldier at gate 07 —
 * which leaves the combination named here as `Tantrik`'s first appearance
 * anywhere. `tools/gatecheck.js`'s `soloDebut` check exists to catch exactly
 * that, and it caught it: an archetype's first meeting has to be a solo one,
 * because a hunter who meets two unknown tells at once learns neither.
 *
 * So the debut is spent here rather than deferred to a gate that has no
 * table entry for it. It costs one short encounter and it makes the
 * combination land the way its own spec says it should — the campaign's
 * first combination is still the first *combination*, and now it combines two
 * things the hunter has actually been taught.
 *
 * The order inside the combination is the teaching. The priest lands first
 * and furthest back, so it is already casting by the time the two rakshasa
 * are in reach — a hunter who works front-to-back finds the queue growing
 * behind them, which states the lesson as a consequence rather than as a
 * note. The note is there too, because "deals no damage" is the one fact the
 * fight cannot teach without first punishing.
 */
const ENCOUNTERS = [
  {
    id: 'the-priest',
    trigger: 20,
    lock: [14, 38],
    intro: {
      title: STRINGS.GATE6_PRIEST_TITLE,
      body: STRINGS.GATE6_PRIEST_BODY,
      note: STRINGS.GATE6_PRIEST_NOTE,
    },
    spawns: [{ type: 'tantrik', x: 32, delay: 0.3, skin: JUNGLE_PRIEST_SKIN }],
  },
  {
    id: 'the-clearing',
    trigger: 48,
    lock: [42, 74],
    intro: {
      title: STRINGS.GATE6_CLEARING_TITLE,
      body: STRINGS.GATE6_CLEARING_BODY,
      note: STRINGS.GATE6_CLEARING_NOTE,
    },
    spawns: [
      { type: 'tantrik', x: 68, delay: 0, skin: JUNGLE_PRIEST_SKIN },
      { type: 'raakchyas', x: 54, delay: 0.5, skin: FOREST_RAKSHASA_SKIN },
      { type: 'raakchyas', x: 62, delay: 1.1, skin: FOREST_RAKSHASA_SKIN },
    ],
  },
  {
    id: 'shurpanakha',
    trigger: 148,
    lock: [142, 182],
    intro: { title: STRINGS.GATE6_SHURPANAKHA_TITLE, body: WARDEN.title },
    spawns: [{ type: 'warden', x: 162, delay: 0.8 }],
  },
];

/**
 * `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
 * line": thirteen paged 'intro' beats and eight paged 'cleared' beats, with
 * one 'phase' beat between them — fired by `Shurpanakha.takeHit` in
 * `enemies.js` through `Game.firePhaseBeat` at her HP threshold.
 *
 * Unlike Taraka's wordless reveal one gate back, this one carries text: per
 * docs/SPEC-CAMPAIGN.md's dialogue table, she narrates what the hunter is
 * being shown. Her roster entry asks the surrounding narration to use
 * SORGI's escort framing rather than victory framing, and to give her the
 * interiority the source itself withholds — the beats in `strings.js` carry
 * both, and the comment above them says which line does what.
 */
const introBeat = (big, body) => ({ at: 'intro', title: STRINGS.GATE6_WARDEN_TITLE, big, body });
const clearedBeat = (big, body) => ({ at: 'cleared', title: STRINGS.GATE6_WARDEN_TITLE, big, body });

const BEATS = [
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_1_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_1_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_2_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_2_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_3_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_3_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_4_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_4_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_5_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_5_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_6_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_6_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_7_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_7_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_8_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_8_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_9_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_9_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_10_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_10_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_11_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_11_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_12_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_12_BODY),
  introBeat(STRINGS.GATE6_SHURPANAKHA_INTRO_13_BIG, STRINGS.GATE6_SHURPANAKHA_INTRO_13_BODY),
  {
    at: 'phase',
    title: STRINGS.GATE6_WARDEN_TITLE,
    big: STRINGS.GATE6_SHURPANAKHA_PHASE_BIG,
    body: STRINGS.GATE6_SHURPANAKHA_PHASE_BODY,
  },
  clearedBeat(STRINGS.GATE6_SHURPANAKHA_DEFEAT_1_BIG, STRINGS.GATE6_SHURPANAKHA_DEFEAT_1_BODY),
  clearedBeat(STRINGS.GATE6_SHURPANAKHA_DEFEAT_2_BIG, STRINGS.GATE6_SHURPANAKHA_DEFEAT_2_BODY),
  clearedBeat(STRINGS.GATE6_SHURPANAKHA_DEFEAT_3_BIG, STRINGS.GATE6_SHURPANAKHA_DEFEAT_3_BODY),
  clearedBeat(STRINGS.GATE6_SHURPANAKHA_DEFEAT_4_BIG, STRINGS.GATE6_SHURPANAKHA_DEFEAT_4_BODY),
  clearedBeat(STRINGS.GATE6_SHURPANAKHA_DEFEAT_5_BIG, STRINGS.GATE6_SHURPANAKHA_DEFEAT_5_BODY),
  clearedBeat(STRINGS.GATE6_SHURPANAKHA_DEFEAT_6_BIG, STRINGS.GATE6_SHURPANAKHA_DEFEAT_6_BODY),
  clearedBeat(STRINGS.GATE6_SHURPANAKHA_DEFEAT_7_BIG, STRINGS.GATE6_SHURPANAKHA_DEFEAT_7_BODY),
  clearedBeat(STRINGS.GATE6_SHURPANAKHA_DEFEAT_8_BIG, STRINGS.GATE6_SHURPANAKHA_DEFEAT_8_BODY),
];

export const GATE_6 = {
  id: 'gate-6',
  name: STRINGS.GATE6_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  /** Below the climb and the gap both, same as gate 4's canopy. */
  voidY: -24,
  arenaTop: ARENA_TOP,
  exitX: 182,
  end: 188,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  warden: WARDEN,
};
