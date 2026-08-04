// Gate 2 — "The Crossing".
//
// Gate 1's exit does not lead home. It leads down to the river, and this is the
// river: grey-blue, walled in by mist, with black water where gate 1 has void.
//
// It is a walk, and — now — one fight. Falling into the water forgets rather
// than kills; see `forgivingVoid` below. The Ferryman is still its own ticket;
// see `docs/SPEC-CAMPAIGN.md` § The ten gates (02).
//
// The one fight is the charger, and it is here rather than anywhere else
// because the crossing is what teaches movement before the hells demand it. It
// is met **alone**: nothing else spawns in this gate, so the tell is learned in
// isolation rather than inferred out of a crowd and unlearned later. The
// `solo debut` check in `tools/gatecheck.js` holds every future archetype to
// the same thing.
//
// No Warden and no story beats yet. The descriptor still goes through every
// tier-1 check in `tools/gatecheck.js`, and the crossing's gaps are held to the
// same touch budget gate 1's are.

/**
 * The realm's palette.
 *
 * Everything gate 1 is warm about, this is cold about. The pastel violet dusk
 * becomes an overcast grey-blue; the moss and the leaf-green become drained
 * blue-greens; the void becomes water. That is the whole of "reads as a
 * different place at a glance", and it is deliberately a *static* palette:
 * `docs/DECISIONS.md` § Art direction describes a lerp across a gate's length
 * that has never been built, and this gate is not where it gets built.
 */
const REALM = {
  sky: { zenith: 0x0b1520, mid: 0x22394d, horizon: 0x7d94a3 },
  // Nearer and shorter than gate 1's 26/132. The crossing should feel walled
  // in — you cannot see either bank properly, which is most of why a flat
  // stretch of water reads as a place you are crossing rather than a pond.
  fog: { color: 0x54697a, near: 20, far: 110 },

  // Reeds rather than meadow. The same field, the same shader, drained.
  grass: 0x5b6f6a,
  grassBlade: 0x6d8079,
  grassBladeTip: 0xa9bcae,
  rock: 0x4b5762,
  rockDark: 0x252d36,
  rockMoss: 0x445a57,
  stone: 0x76838f,
  // Cold where gate 1's is violet. The crystals are the one bright thing here.
  crystal: 0x59d2e0,

  mist: { back: 0xc2d4de, front: 0x8fa6b4 },
  ridges: [0x2a333d, 0x36434f, 0x475766],

  /**
   * Black water, and where its surface sits.
   *
   * Below every platform top and above every platform's underside, so the
   * stones read as standing *in* it rather than floating over it. `voidY` is
   * far beneath: falling in is still a fall — `Game._fallInWater` is what
   * makes landing in it survivable, keyed off `forgivingVoid` below.
   */
  water: { y: -1.8, color: 0x04070c, sheen: 0x7fb9c9 },
};

/**
 * Solid ground, left to right: a bank, three stones, a causeway, two more
 * stones, and the far bank.
 *
 * Every gap is 3.6 or 3.8, which is 3.8 at the worst — the same width gate 1
 * settled on, needing 4.48 of the measured 6.08-unit running jump and leaving
 * 26% in reserve. The touch budget in `docs/SPEC-CAMPAIGN.md` asks for 25%, and
 * the tier-1 jump-reserve check holds this gate to it as a ratio against the
 * arc this build actually measures rather than against the literal 3.8.
 *
 * Rises are kept small and alternate up and down. A crossing is a rhythm rather
 * than a climb: gate 1 already owns the ascent, and repeating it here would
 * make the second gate read as more of the first.
 */
const SEGMENTS = [
  // The near bank. Wide, with somewhere to stand and look at where you are.
  { x0: -6, x1: 26, top: 0, boulders: 3, pillars: 2, crystals: 1 },

  // Three stones. Barren, so nothing grows on them — they are under water
  // often enough that nothing does.
  { x0: 29.8, x1: 35.8, top: 0.8, barren: true, depth: 5 },
  { x0: 39.4, x1: 45.4, top: 0.2, barren: true, depth: 5 },
  { x0: 49.2, x1: 55.2, top: 1.4, barren: true, depth: 5 },

  // The causeway: something that was built, and is still mostly standing.
  { x0: 58.8, x1: 88.8, top: 0.6, boulders: 2, pillars: 3, crystals: 1 },

  // Two more stones, where the causeway has gone.
  { x0: 92.6, x1: 98.6, top: 1.6, barren: true, depth: 5 },
  { x0: 102.2, x1: 108.2, top: 0.4, barren: true, depth: 5 },

  // The far bank, and the arch out of it.
  { x0: 112, x1: 150, top: 0, boulders: 3, pillars: 2, crystals: 2 },
];

/**
 * One encounter, one enemy, on the one piece of ground long enough to run on.
 *
 * The causeway is thirty units of flat, unobstructed floor, and that is the
 * point: a charger needs a lane, and an archetype introduced in a place that
 * denies it its own mechanic teaches nothing. Sealing it is what makes the
 * lesson unskippable — the crossing has no Warden, so its arch is lit from the
 * moment the hunter arrives, and an unsealed charger is a charger you walk
 * past.
 *
 * The seal is also what makes "alone" true rather than merely likely. Nothing
 * else spawns in this gate at all, so there is no wave to hide the tell in and
 * nothing else alive to blame a hit on.
 *
 * The intro window says the rule and the tell in one line, from 0 s. Round 3 of
 * the playtest log is unambiguous about the alternative: a rule delivered in
 * thirty-seven words while three enemies are already on you is a rule nobody
 * was taught, and a player who believes a body harms them plays a different
 * game from the one on offer.
 */
const ENCOUNTERS = [
  {
    id: 'the-charger',
    trigger: 64,
    lock: [61, 86],
    intro: {
      title: 'THREAT DETECTED',
      body: 'Charger × 1',
      note: 'Its body cannot harm you — only the <b>charge</b>, and it plants its feet first.',
    },
    // Far enough down the causeway to be seen planting before it is in range,
    // and clear of both barriers by a wide margin.
    spawns: [{ type: 'charger', x: 79, delay: 0.3 }],
  },
];

export const GATE_2 = {
  id: 'gate-2',
  name: 'The Crossing',
  realm: REALM,

  spawnX: 2,
  /** Below the water, below the plinths: nothing is down there to land on. */
  voidY: -22,
  /**
   * Lethe rather than gate 1's void: falling below `voidY` here returns the
   * hunter to `spawnX` at no health cost and costs the bound shadow, if any.
   * See `Game._fallInWater`.
   */
  forgivingVoid: true,
  /** The far bank, which is where the arch stands. No arena — no Warden yet. */
  arenaTop: 0,
  exitX: 142,
  end: 150,

  segments: SEGMENTS,
  encounters: ENCOUNTERS,
  // No Warden. The Ferryman is a separate ticket, and a gate with no Warden is
  // a gate whose way out is open from the moment the hunter arrives — see
  // `Game._enterGate`. Which is why the charger's encounter is sealed.
};
