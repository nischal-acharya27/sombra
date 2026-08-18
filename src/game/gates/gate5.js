// Gate 5 — Kaikeyi (Ramayana, Ayodhya Kanda).
//
// This is gate 5 under the fifteen-gate redesign (docs/SPEC-CAMPAIGN.md):
// Kaikeyi, not the retired Tiryak-lok. The roster's first tier-0, no-combat
// gate (docs/agents/villain-handoff.md): no `Enemy`/`Boss` ancestry, no
// encounters, no `warden` field — `Game._enterGate` already opens the way
// out for any gate authored without one. She has no monster form and no
// combat-victory beat to adapt; casting her as a boss to be fought would be
// the largest invention on the whole roster relative to the source, per
// docs/research/villain-roster.md's own "Cut-vs-keep, resolved" note.
//
// Flat throughout, per docs/SPEC-CAMPAIGN.md's own table for this gate — a
// single antechamber, not a fight arena. A linear sequence of four beats,
// each staged as a two-path fork the hunter resolves just by how they walk
// through it (`Game._updateForks`): grounded reads as 'low', airborne reads
// as 'jump', no new collision primitive and no wrong answer either way.
// Kaikeyi stands fixed past the far end of the antechamber for the whole
// gate, visible from the moment the hunter arrives — never repositioning,
// never fought, never won.
//
// Only three of the seven verbs carry meaning here — move/jump/dash — and
// the hunter never speaks: the fork's two readings shape what she says
// next, not an answer she's owed. See her handoff entry for the full
// "witnessing, not winning" reasoning this gate is built around.

import { STRINGS } from '../../ui/strings.js';

const ARENA_TOP = 0;

/**
 * A palace antechamber, not a forest — the one interior space the campaign
 * has built so far. Kept inside Act 2's own "Rakshasa/forest tones, moving
 * toward regal gold approaching Ravana" register (docs/SPEC-CAMPAIGN.md's
 * per-act table) by leaning into the gold half early rather than borrowing
 * gate 4's green: torch-warm stone, dulled by grief rather than lit for a
 * celebration, so it reads as court without reading as triumphant.
 */
const REALM = {
  sky: { zenith: 0x140e08, mid: 0x2e2010, horizon: 0x5a3e1c },
  fog: { color: 0x241608, near: 14, far: 80 },

  grass: 0x3a2c14,
  grassBlade: 0x4a3818,
  grassBladeTip: 0x8a6a2c,
  rock: 0x3c2e1a,
  rockDark: 0x1e160c,
  rockMoss: 0x4a3a1e,
  stone: 0x4a3820,
  crystal: 0xd9ad48,

  mist: { back: 0x5a3e1c, front: 0x241608 },
  ridges: [0x1e160c, 0x2c2010, 0x3c2e1a],
};

/**
 * One flat antechamber floor, in three dressed spans rather than one long
 * slab — pillars vary in count and spacing so the walk reads as a real
 * hall rather than a corridor repeating itself. Every span is `top: 0`,
 * per the gate's own "Flat" call; nothing here climbs.
 */
const SEGMENTS = [
  { x0: -6, x1: 40, top: ARENA_TOP, barren: true, depth: 9, pillars: 2 },
  { x0: 40, x1: 84, top: ARENA_TOP, barren: true, depth: 9, pillars: 3 },
  { x0: 84, x1: 130, top: ARENA_TOP, barren: true, depth: 9, pillars: 2 },
];

/**
 * Her four beats, chronological, each a two-path fork — the trigger x the
 * hunter's own position crosses, and `Game._updateForks` reads their y at
 * that instant to pick 'low' or 'jump'. Spaced well apart so one fork's
 * beat (a paged, player-advanced CONTINUE window, same shape as any other
 * story beat) always finishes well before the next trigger arrives.
 */
const FORKS = [
  { id: 'boon', x: 24 },
  { id: 'manthara', x: 52 },
  { id: 'invocation', x: 80 },
  { id: 'regret', x: 104 },
];

/** Kaikeyi herself — fixed, visible for the whole gate, facing the hunter's approach. */
const FIGURE = { kind: 'kaikeyi', x: 116, y: ARENA_TOP, facing: -1 };

const choiceBeat = (fork, path, big, body) => ({
  at: 'choice-made',
  fork,
  path,
  title: STRINGS.GATE5_KAIKEYI_TITLE,
  big,
  body,
});

const BEATS = [
  choiceBeat('boon', 'low', STRINGS.GATE5_BOON_LOW_BIG, STRINGS.GATE5_BOON_LOW_BODY),
  choiceBeat('boon', 'jump', STRINGS.GATE5_BOON_JUMP_BIG, STRINGS.GATE5_BOON_JUMP_BODY),
  choiceBeat('manthara', 'low', STRINGS.GATE5_MANTHARA_LOW_BIG, STRINGS.GATE5_MANTHARA_LOW_BODY),
  choiceBeat('manthara', 'jump', STRINGS.GATE5_MANTHARA_JUMP_BIG, STRINGS.GATE5_MANTHARA_JUMP_BODY),
  choiceBeat('invocation', 'low', STRINGS.GATE5_INVOCATION_LOW_BIG, STRINGS.GATE5_INVOCATION_LOW_BODY),
  choiceBeat('invocation', 'jump', STRINGS.GATE5_INVOCATION_JUMP_BIG, STRINGS.GATE5_INVOCATION_JUMP_BODY),
  choiceBeat('regret', 'low', STRINGS.GATE5_REGRET_LOW_BIG, STRINGS.GATE5_REGRET_LOW_BODY),
  choiceBeat('regret', 'jump', STRINGS.GATE5_REGRET_JUMP_BIG, STRINGS.GATE5_REGRET_JUMP_BODY),
];

export const GATE_5 = {
  id: 'gate-5',
  name: STRINGS.GATE5_NAME,
  realm: REALM,
  beats: BEATS,

  spawnX: 2,
  voidY: -20,
  arenaTop: ARENA_TOP,
  exitX: 118,
  end: 128,

  segments: SEGMENTS,
  // No `encounters`, no `warden` — nothing here fights. `_enterGate` opens
  // the way out the moment the hunter arrives, same as any gate with no
  // Warden to beat first.
  encounters: [],
  forks: FORKS,
  figure: FIGURE,
};
