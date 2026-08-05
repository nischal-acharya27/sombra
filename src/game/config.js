// Every tunable number in the game.
//
// Nothing gameplay-affecting is hard-coded anywhere else. Movement was solved
// backwards from the arc we wanted rather than dialled in by feel: for a jump
// apex height h at time t, v = 2h/t and g = 2h/t². The numbers below give a
// 3.4-unit rise in 0.33 s, which clears a 2-unit step comfortably and a
// 4.5-unit gap at a run.

export const PHYS = {
  gravity: 62,
  fallGravityMul: 1.45, // heavier on the way down; a symmetric arc feels floaty
  maxFall: 42,
  jumpVel: 20.5,
  doubleJumpVel: 17.5,
  jumpCutMul: 0.42, // velocity retained when jump is released early
  coyote: 0.11,
  apexGravityMul: 0.62, // brief float at the top of the arc: more air control
  apexWindow: 3.5, // |vy| under this counts as the apex
};

/**
 * The invisible walls an encounter raises while it is live.
 *
 * `y0`/`y1` are the collision slab and span the whole playable column — a
 * barrier is not something you jump over. `hw` is what makes a spawn point
 * "clear of the barriers": a body materialising inside this slab is ejected by
 * the collision solver, and the tier-1 checks read the same number `Level`
 * builds with rather than a second copy of it.
 */
export const BARRIER = {
  hw: 0.6,
  y0: -10,
  y1: 40,
};

/**
 * The way out of a gate.
 *
 * `reach` is how near the arch's centre the hunter has to be to be taken
 * through it, and the arch is a *place* rather than a line for a reason: a
 * Warden can die with the hunter standing beyond it — gate 1 spawns its
 * Guardian at x 190, the arch is at 196 and the arena runs to 204 — and a
 * threshold you can only cross rightwards would strand them, objective lit,
 * walking the wrong way into a wall. Comfortably inside the arch's legs, which
 * `Level._buildGateArch` stands at ±3.2.
 */
export const GATE_ARCH = { reach: 2.0 };

export const PLAYER = {
  hw: 0.34,
  hh: 0.85,
  runSpeed: 9.6,
  accel: 96,
  airAccel: 58,
  friction: 15,
  turnBoost: 2.1, // extra accel when reversing, so direction changes feel sharp

  maxHp: 120,
  maxMp: 100,
  mpRegen: 5.5, // per second
  hurtInvuln: 0.75,
  hurtKnock: 7,

  dashSpeed: 27,
  dashTime: 0.155,
  dashInvuln: 0.19, // slightly longer than the dash: the escape must actually work
  dashCooldown: 0.30,
  airDashes: 1,
  // Air swings per airtime, reset on landing. Air attacks suppress gravity for
  // their hang-time frames — that is what keeps a juggle in the air — so
  // without a cap, mashing attack is a slow-fall button and every pit in the
  // level becomes optional.
  airAttackLimit: 2,
  // Fraction of air acceleration you keep while swinging. Not 1: the lunge is
  // a commitment and should still read as one. Not 0 either, which is what it
  // was — see the `rooted` note in Player._move.
  airAttackSteer: 0.75,
};

/**
 * The move list.
 *
 * `active` is the window during which the hitbox exists, `cancel` the point
 * after which another attack, a dash or a jump may interrupt. Cancel always
 * lands inside recovery, never inside the active window — being able to cancel
 * out of a hit you have already landed is what makes a chain feel responsive
 * instead of mashy.
 *
 * `reach` is the hitbox in front of the hunter: cx/cy is its centre relative to
 * the feet, hw/hh its half extents.
 */
export const ATTACKS = {
  light1: {
    name: 'Shadow Slash', dur: 0.33, active: [0.085, 0.185], cancel: 0.17,
    damage: 13, lunge: 5.2, reach: { cx: 1.2, cy: 1.0, hw: 0.98, hh: 0.72 },
    knock: 3.5, launch: 0, hitstop: 0.05, style: 7, shake: 0.10, sfx: 'slash',
  },
  light2: {
    name: 'Shadow Slash', dur: 0.31, active: [0.075, 0.175], cancel: 0.16,
    damage: 15, lunge: 5.6, reach: { cx: 1.25, cy: 1.05, hw: 1.02, hh: 0.78 },
    knock: 4, launch: 0, hitstop: 0.055, style: 8, shake: 0.11, sfx: 'slash2',
  },
  light3: {
    // Reach is the finisher's identity. At hw 1.18 against 0.98 and 1.02 it was
    // three percent wider than the swings before it, which is invisible in the
    // hand — the animation said "heavy" and the hitbox said "identical".
    name: 'Rending Fang', dur: 0.54, active: [0.17, 0.30], cancel: 0.38,
    damage: 31, lunge: 6.4, reach: { cx: 1.5, cy: 1.0, hw: 1.6, hh: 1.2 },
    knock: 13, launch: 3.5, hitstop: 0.115, style: 18, shake: 0.30, sfx: 'heavy',
  },
  launcher: {
    name: "Ascensão", dur: 0.56, active: [0.16, 0.30], cancel: 0.30,
    damage: 21, lunge: 2.6, reach: { cx: 1.05, cy: 1.15, hw: 0.95, hh: 1.15 },
    // 13.0, not 16.5, and the number is not a feel choice.
    //
    // Under juggle gravity (62 × 0.40) a 16.5 launch peaks at 5.49 units. A
    // single jump peaks at 3.45. The launched enemy was therefore two units
    // above anything one `Space` could reach, and the juggle only worked if you
    // also spent the double jump — which nothing tells you and round 3 reported
    // as "the enemy is launched too high". 13.0 peaks at 3.41, just under the
    // single-jump apex, so K → Space → J is one jump and one swing.
    knock: 2, launch: 13.0, hitstop: 0.10, style: 20, shake: 0.22, sfx: 'launch',
    jumpCancel: true, // the whole point: launch, then chase it into the air
  },
  air1: {
    name: 'Aerial Rave', dur: 0.30, active: [0.07, 0.17], cancel: 0.16,
    damage: 12, lunge: 3.4, reach: { cx: 1.15, cy: 1.0, hw: 0.95, hh: 0.80 },
    knock: 2, launch: 1.2, hitstop: 0.05, style: 9, shake: 0.09, sfx: 'slash',
    hangTime: 0.16, // gravity is suppressed while swinging: juggles stay airborne
  },
  air2: {
    name: 'Aerial Rave', dur: 0.34, active: [0.08, 0.19], cancel: 0.19,
    damage: 16, lunge: 3.8, reach: { cx: 1.2, cy: 1.0, hw: 1.0, hh: 0.88 },
    knock: 3, launch: 1.4, hitstop: 0.06, style: 11, shake: 0.11, sfx: 'slash2',
    hangTime: 0.18,
  },
  slam: {
    name: 'Shadow Descent', dur: 0.75, active: [0, 0], cancel: 0.62,
    damage: 34, lunge: 0, reach: { cx: 0.9, cy: 0.7, hw: 1.5, hh: 0.9 },
    knock: 9, launch: 5.5, hitstop: 0.14, style: 24, shake: 0.42, sfx: 'slam',
    dive: 34, // downward velocity while diving
    // Trimmed from radius 4.6 / damage 22. Jump-then-slam was solving every
    // crowd in the game, which quietly retired the rest of the move list.
    // `landLock` is the real cost: 0.3 s rooted on impact, so spamming it into
    // a group now hands the group a free window.
    shockwave: { radius: 3.6, damage: 14, knock: 11, launch: 9 },
    landLock: 0.30,
  },
};

/**
 * Launched enemies fall slowly for a moment.
 *
 * Without this the juggle is not merely hard, it is impossible: at full gravity
 * a 13.0 launch is airborne for 0.42 s — less time than it takes to jump-cancel
 * the launcher and reach it. The playtest reported "the enemy is already down
 * before I get there", which was accurate.
 *
 * `gravityMul` is what the launch height was tuned against, so the two numbers
 * only mean anything together: 0.40 is what puts the apex at 3.41 units.
 */
export const JUGGLE = { time: 0.8, gravityMul: 0.40 };

export const MAGIC = {
  name: "Décret",
  // 16 of a 100 mana pool: six casts from full, and one back every three
  // seconds. Enough that reaching for it is never a resource crisis, far too
  // little to replace the sword — see the `ranged` probe in tools/sim.js.
  cost: 16,
  // Round 3: "it hits all the enemies on the way, and it deals a lot of damage".
  //
  // At 33 the bolt was doing something nobody intended: `WISP.hp` is 30, so one
  // cast killed a wisp outright, and at `pierce: 3` one cast killed all three
  // over the chasm. That is also, on the evidence, why the wisps stopped
  // reading as a threat — the same round asked for them to be made dangerous
  // again, and their interval, damage and wind-up were never the reason they
  // were easy. One dial explains both complaints, so only one dial moves.
  //
  // 23 puts a wisp at two casts and leaves the beast at two (46 hp). Pierce 1
  // makes a lined-up crowd a positioning reward rather than a free clear.
  damage: 23,
  speed: 34,
  life: 1.5,
  pierce: 1,
  cooldown: 0.34,
  knock: 5,
  hitstop: 0.06,
  style: 14,
  shake: 0.14,
};

export const BEAST = {
  hp: 5, // TEMP phone playtest — revert: git checkout -- src/game/config.js
  hw: 0.52,
  hh: 0.5,
  speed: 4.4,
  // Wider than any sealed arena. At 15 a beast could idle in the far corner of
  // the bridge while the hunter stood at the other end, leaving an encounter
  // that cannot be cleared without walking back to look for it.
  chaseRange: 30,
  // The pounce is the entire threat. Bodies are harmless to touch, so a clean
  // kill costs nothing and crowding is a positioning problem, not chip damage.
  pounce: { range: 4.6, windup: 0.42, vx: 13.5, vy: 12, damage: 14, active: 0.5, recover: 0.55 },
  // How close it walks before it stops. Crowding the player's own hitbox is the
  // enemy's mistake to avoid, not the player's problem to solve.
  stopAt: 2.0,
  exp: 30,
  contactDamage: 0,
};

/**
 * The charger — the enemy that punishes standing still.
 *
 * The beast comes to you and leaps; this one plants its feet at range and runs
 * a lane. That difference is the whole archetype, and every number here exists
 * to protect it:
 *
 * The threat is a *lane* rather than a lunge: it commits from a distance, and
 * crowded closer than `charge.minRange` it backs off to reopen one instead of
 * attacking. That is what makes "keep moving" the answer rather than "stand
 * behind it".
 *
 * `charge.windup` is 0.52 against the beast's 0.42, and that ordering is
 * checked rather than remembered: `telegraphs()` in `tools/gatecheck.js` holds
 * every tell in the game to the shortest one gate 1 taught, measured against
 * the same 250 ms reaction latency the suite's bots play at. A charge cannot be
 * walked out of once it starts, so it is the one tell that must not be the
 * tight one.
 *
 * `charge.recover` is the ticket. A committed charge that ends in a long,
 * rooted recovery is what makes reading the tell *pay* — the hunter is not
 * merely spared damage, they are handed the window they kill it in. The suite
 * measures the window at 59 of its 64 HP, so two of them kill it.
 *
 * `contactDamage: 0`, like everything else in the game. Nothing it *is* harms
 * the hunter; only what it *does*.
 */
export const CHARGER = {
  hp: 5, // TEMP phone playtest — revert: git checkout -- src/game/config.js
  hw: 0.62,
  hh: 0.62,
  // Slower on its feet than a beast. It is not a chaser — walking away from a
  // charger works, and is supposed to, right up until it plants and commits.
  speed: 3.0,
  chaseRange: 26,
  charge: {
    // These four numbers are one decision, and the arithmetic is the decision.
    //
    // A charge covers `speed × dur` = 8.1 units, which is deliberately longer
    // than `range`: a hunter who does not move is hit from anywhere the charger
    // is willing to commit from, with no distance to back into. That is the
    // "punishes standing still" half.
    //
    // The other half is that moving always works, with room to spare. The
    // hunter answers the tell 0.25 s in (the suite's reaction latency), leaving
    // 0.27 s of wind-up to spend: a dash is 4.19 units and the run out of it
    // adds about one more. So the charge starts from at least 3.0 + 5.2 = 8.2
    // units and closes at 18 − 9.6 = 8.4 a second, which needs 0.98 s against
    // the 0.45 s it has. Read the tell and it cannot reach you; ignore it and
    // nothing can save you.
    range: 7.5,
    // Inside this it has no room to build up, so it retreats to reopen a lane
    // rather than attacking. 3.0 is the number the escape margin above is
    // computed from — it is the worst case, not a comfort.
    minRange: 3.0,
    windup: 0.52,
    speed: 18,
    dur: 0.45,
    // The punish window, and the reason reading the tell *pays* rather than
    // merely costing nothing. A charge ends past the hunter, so the window has
    // to cover both running back in and swinging — which is why the suite
    // measures what it is worth rather than reading this number. It measures 59
    // of its 64 HP: a full light chain, so two read tells kill it and nothing
    // else does.
    recover: 1.3,
    // A charge into a wall costs it more, exactly as the Guardian's does: a
    // miss that ends against terrain is the biggest punish window it offers.
    wallRecover: 0.5,
    damage: 15,
    knock: 10,
    shake: 0.24,
  },
  /** Idle window between charges. */
  cooldown: [0.8, 1.5],
  /** How far above or below the hunter can be and still be in the lane. */
  laneHeight: 2.2,
  exp: 34,
  contactDamage: 0,
};

/**
 * SORGI — the extraction, the corpse window, and what rises from it.
 *
 * The ally runs its source archetype's own state machine (see `shadowOf` in
 * game/shadow.js) — a beast's remnant raises a beast-shaped ally, a charger's
 * raises a charger-shaped one — so this one block carries both shapes' fields
 * and each concrete shadow class reads only the ones its state machine needs.
 *
 * `channel` and `corpseWindow` are the whole cost of the mechanic. There is no
 * mana price on purpose — a mana price is bookkeeping, and you would work out
 * once whether the bolt or the shadow is the better spend and then always pick
 * it. Standing still for 0.8 s in a live fight is a decision you have to make
 * again every time, and it gambles against the telegraph system already in
 * place.
 */
export const SHADOW = {
  /** Seconds a body stays claimable. The shrinking shard is this number. */
  corpseWindow: 4.0,
  /**
   * How many bodies can lie about at once, and therefore how many shard rigs
   * the game pre-builds. Comfortably above the four beasts of the bridge
   * ambush. The oldest body gives up its shard if this is ever reached, which
   * is also the reason the number exists: allocating a shard mid-run would
   * spend the suite's seeded randomness. See buildShard in render/models.js.
   */
  maxCorpses: 12,
  /** Immobile channel. Long enough to be a real exposure, short enough to try. */
  channel: 0.8,
  /** How near the hunter must be to a body to start the channel. */
  extractRange: 2.4,
  /** ...and how near in height, so a body on a ledge above you is not claimable. */
  extractReachY: 2.0,

  hp: 58,
  hw: BEAST.hw,
  hh: BEAST.hh,
  // No `speed` here: `shadowOf` in game/shadow.js reads it off the source
  // archetype's own stats instead, so a beast-raised ally keeps a beast's pace
  // and a charger-raised one keeps a charger's — an ally that outruns or lags
  // the thing it was raised from stops reading as the same creature, which is
  // the only reason the recolour works.
  // Its own, because these are what an *ally* needs rather than what the enemy
  // needs: how far it looks for something to fight, and how close it crowds the
  // hunter it is following.
  chaseRange: 26,
  stopAt: 2.4,
  // The beast's pounce exactly, carrying its own damage.
  //
  // Identical timings are the point, not laziness: the player has already
  // learned to read this wind-up, and an ally whose leap reads differently would
  // make them learn a second tell for no gain. Damage is the one number that
  // must not be shared — the ally exists to change a fight, not to win it while
  // the hunter watches, and a shared number would mean every future tune of the
  // enemy silently tuned the player's ally.
  pounce: { ...BEAST.pounce, damage: 11 },
  /** Knockback its pounce deals, and takes. */
  knock: 5,

  // The charger-raised ally's own charge. Same relationship `pounce` above
  // has to `BEAST.pounce`: the timings are the hostile charger's own, already
  // learned, but the damage is tuned separately and low — a support ally's
  // hit carries far lower stakes than an attack the hunter has to dash
  // through. No `chain`: a shadow's charge never chains even when its source
  // could, so it always resolves to one commit.
  charge: { ...CHARGER.charge, damage: 6, knock: 4 },
  /** The charger-raised ally's own lane tolerance and idle window. */
  laneHeight: CHARGER.laneHeight,
  cooldown: CHARGER.cooldown,

  /**
   * Grace after being hit.
   *
   * A pounce's hitbox is live for half a second, and the ally walks straight
   * into it — without this it would take that damage on every frame of the
   * leap and evaporate. Same job as the hunter's `hurtInvuln`, shorter because
   * the shadow is not asked to escape anything.
   */
  hurtCooldown: 0.55,

  /** Horizontal distance from the hunter at which it re-forms beside them. */
  recallAt: 22,
  /** ...and how far below, which is what saves it from every pit in the level. */
  recallBelow: 14,
  /** Where it re-forms: just behind the hunter, and a little off the ground. */
  recallBehind: 1.6,
  recallAbove: 0.4,

  exp: 0, // it is not an enemy; nothing is paid for killing it
  contactDamage: 0,
};

/**
 * The Ferryman — the crossing's Warden.
 *
 * A charger, elevated: `docs/DECISIONS.md` § Wardens and bosses is explicit
 * that this is configuration, not a new file or a new state machine. The
 * hunter already reads a charge's tell in full, so the one thing this adds is
 * `charge.chain`: it does not stop at the far bank, it turns around and
 * crosses back — the same wind-up, the same eye-flare, run twice before the
 * recovery the hunter was taught to punish. No new telegraph, because there is
 * nothing left to teach; the ferry crossing twice is the whole idea.
 */
export const FERRYMAN = {
  ...CHARGER,
  hp: 5, // TEMP phone playtest — revert: git checkout -- src/game/config.js
  hw: 0.7,
  hh: 0.7,
  speed: 3.2,
  charge: {
    ...CHARGER.charge,
    // A longer lane for a longer arena — see gate 2's far bank — and the same
    // margin arithmetic CHARGER.charge is built from: still far short of what
    // a dash out of the wind-up needs to clear.
    range: 9,
    speed: 19,
    dur: 0.5,
    damage: 18,
    knock: 11,
    /** Charges twice before it recovers. The signature addition. */
    chain: 2,
  },
  exp: 140,
  contactDamage: 0,
};

export const WISP = {
  hp: 5, // TEMP phone playtest — revert: git checkout -- src/game/config.js
  hw: 0.38,
  hh: 0.38,
  speed: 3.0,
  hover: { amp: 0.7, freq: 1.5 },
  // A wisp should make you *change tool*, not make you *wait*. At 2.2 units up
  // and 7.5 out it sat outside the light attack's 1.72 ceiling and outside
  // every melee range, so the only answer was mana — and with regen at 5.5/s
  // that turned two wisps into a thirty-second stall where the hunter walks
  // underneath them taking chip damage. Now it drifts inside jump and launcher
  // range, and the bolt is the *efficient* answer rather than the only one.
  hoverAbove: 1.6,
  leash: 9, // never strays this far horizontally from where it spawned
  descend: 4.5, // ...nor this far below it, which keeps it out of the void
  keepDistance: 5.5,
  // Round 1 was 2.4 / 0.55 / 11 and read as too sharp; round 2 at 3.1 / 0.72 / 9
  // read as "now they are too easy — the previous difficulty was good enough".
  // So the interval and the damage go back, and only the wind-up stays long.
  //
  // That split is deliberate rather than a compromise. Four of seven round-1
  // deaths were falls while fighting wisps over the chasm, and the damage was
  // never what killed anyone — knockback arriving with no warning while
  // airborne was. The wind-up is the part that addressed that specifically, and
  // it is the part with no cost to the threat level: you can see the shot
  // coming and still have to deal with it.
  shoot: { interval: 2.5, windup: 0.66, speed: 15, damage: 11, life: 3 },
  exp: 22,
  contactDamage: 0,
};

export const GUARDIAN = {
  hp: 5, // TEMP phone playtest — revert: git checkout -- src/game/config.js
  hw: 1.5,
  hh: 1.9,
  speed: 3.6,
  exp: 320,
  // Every attack is telegraphed by a core flare before it commits. Nothing the
  // Guardian *is* deals damage — only what it *does*.
  contactDamage: 0,
  enrageAt: 0.5, // fraction of HP where it speeds up
  enrageSpeedMul: 1.32,
  // Enraged, every wind-up below is shortened by this — so these are the real
  // telegraphs of the second phase, and the numbers `telegraphs()` in
  // `tools/gatecheck.js` measures against the reaction floor. It lived in
  // `boss.js` as a literal until the charger's ticket needed to read it, which
  // is exactly the drift the "every tunable in config.js" rule exists to stop.
  enrageWindupMul: 0.78,
  attacks: {
    charge: { windup: 0.75, speed: 19, dur: 0.85, recover: 0.9, damage: 20, knock: 13, shake: 0.3 },
    slam: { windup: 0.68, rise: 0.34, fall: 0.24, recover: 1.0, damage: 24, radius: 5.6, knock: 15, shake: 0.55 },
    sweep: { windup: 0.55, active: 0.28, recover: 0.75, damage: 17, reach: 5.0, knock: 11, shake: 0.26 },
    volley: { windup: 0.7, shots: 3, gap: 0.22, recover: 0.8, damage: 13, speed: 17, shake: 0.12 },
  },
  cooldown: [0.9, 1.7], // idle window between attacks, shortened when enraged
};

/** Style ranks. `decay` is meter lost per second while not attacking. */
export const STYLE = {
  ranks: [
    { letter: 'D', word: 'DORMANT', at: 0 },
    { letter: 'C', word: 'CLEAN', at: 55 },
    { letter: 'B', word: 'BRUTAL', at: 130 },
    { letter: 'A', word: 'ASCENDANT', at: 230 },
    { letter: 'S', word: 'SOVEREIGN', at: 360 },
    { letter: 'SS', word: 'SOMBRA', at: 520 },
  ],
  max: 640,
  decay: 26,
  decayDelay: 1.5, // grace period after the last hit before the meter falls
  repeatPenalty: 0.42, // repeating the same move scores this fraction
  hitTakenLoss: 0.45, // fraction of meter kept after being hit
  comboWindow: 2.2,
  // The meter went unnoticed in playtest and changed nothing about how the game
  // was played, which makes it decoration. Mana regen scales with rank instead:
  // it rewards the variety the meter measures, it is felt rather than read, and
  // unlike a damage bonus it does not invalidate the verified boss tuning.
  // Kept modest. At [1 … 2.5] the pure-kiting bot went from losing the boss
  // fight to winning it with 86 of 134 HP left — a reward for style that makes
  // the safest, least stylish strategy the best one is self-defeating.
  mpRegenByRank: [1, 1.12, 1.26, 1.4, 1.55, 1.7],
};

/**
 * How long each System window stays up, in ms. `HUD.window` takes it as a
 * parameter rather than defaulting it, so every call site names one of these
 * instead of a literal.
 */
export const SYS_WINDOW = {
  /** The gate's name, on entry. */
  gateEnter: 1800,
  /** An encounter's intro with no teaching note. */
  encounter: 1700,
  /** An encounter's intro that carries a teaching note — a little longer to read. */
  encounterNote: 2600,
  /** A boss's intro. */
  bossIntro: 2400,
  /** The first-remnant teaching line: the longest window in the game. */
  remnantTeach: 3400,
  /** The Guardian's enrage warning. */
  enrage: 1800,
  /** Level-up. */
  levelUp: 2100,
  /**
   * A story beat at a gate boundary — the System naming a realm, or noting
   * something about it. Short on purpose: `docs/PLAYTEST.md` round 3 found a
   * System window read as too much text for too little time once a fight was
   * already live, and a beat that only ever opens at a boundary still has to
   * hold to the same "read at a glance" budget to keep that promise.
   */
  storyBeat: 2000,
};

export const PROGRESSION = {
  /**
   * EXP for the next level. Linear, and deliberately so.
   *
   * Levelling restores you to full and is the *only* heal in the game, which
   * makes this curve a difficulty control rather than a reward schedule: it is
   * tuned so a level-up lands two kills into the bridge ambush, the one fight
   * long enough to run a health bar dry. On the original 90·lvl^1.42 curve the
   * third level arrived after the ambush was over, and scripted runs died there
   * with one enemy left almost every time.
   */
  curve: (lvl) => 90 * lvl,
  hpPerLevel: 14,
  mpPerLevel: 8,
};
