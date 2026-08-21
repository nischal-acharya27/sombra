// Every tunable number in the game.
//
// Nothing gameplay-affecting is hard-coded anywhere else. Movement was solved
// backwards from the arc we wanted rather than dialled in by feel: for a jump
// apex height h at time t, v = 2h/t and g = 2h/t². The numbers below give a
// 3.4-unit rise in 0.33 s, which clears a 2-unit step comfortably and a
// 4.5-unit gap at a run.

import { STRINGS } from '../ui/strings.js';

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
  name: "Aago",
  // 16 of a 100 mana pool: six casts from full, and one back every three
  // seconds. Enough that reaching for it is never a resource crisis, far too
  // little to replace the sword — see the `ranged` probe in tools/sim.js.
  cost: 16,
  // Round 3: "it hits all the enemies on the way, and it deals a lot of damage".
  //
  // At 33 the bolt was doing something nobody intended: `BHOOT_BATTI.hp` is 30,
  // so one cast killed a bhoot-batti outright, and at `pierce: 3` one cast
  // killed all three over the chasm. That is also, on the evidence, why the
  // bhoot-battis stopped reading as a threat — the same round asked for them
  // to be made dangerous again, and their interval, damage and wind-up were
  // never the reason they were easy. One dial explains both complaints, so
  // only one dial moves.
  //
  // 23 puts a bhoot-batti at two casts and leaves the raakchyas at two (46 hp). Pierce 1
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

export const RAAKCHYAS = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.52,
  hh: 0.5,
  speed: 4.4,
  // Wider than any sealed arena. At 15 a raakchyas could idle in the far
  // corner of the bridge while the hunter stood at the other end, leaving an
  // encounter that cannot be cleared without walking back to look for it.
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
 * The raakchyas comes to you and leaps; this one plants its feet at range and
 * runs a lane. That difference is the whole archetype, and every number here
 * exists to protect it:
 *
 * The threat is a *lane* rather than a lunge: it commits from a distance, and
 * crowded closer than `charge.minRange` it backs off to reopen one instead of
 * attacking. That is what makes "keep moving" the answer rather than "stand
 * behind it".
 *
 * `charge.windup` is 0.52 against the raakchyas's 0.42, and that ordering is
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
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.62,
  hh: 0.62,
  // Slower on its feet than a raakchyas. It is not a chaser — walking away from a
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
 * Kawach — Naraka's armoured grunt.
 *
 * The raakchyas comes to you, the charger plants and runs a lane; this one
 * stands its ground and shrugs. Its threat is not a lane or a leap, it is
 * that most of the move list does nothing to it — see `Kawach.takeHit` in
 * `enemies.js`, and `armorBreakLaunch` below, which is the number that
 * decides "nothing" from "everything".
 */
export const KAWACH = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.66,
  hh: 0.76,
  speed: 2.6,
  chaseRange: 26,
  /** How close it walks in before it plants for a bash — a shield-bash needs no lane. */
  stopAt: 1.7,
  bash: {
    range: 2.3,
    // Comfortably clear of the 0.42 s floor `telegraphs()` in
    // `tools/gatecheck.js` holds every tell to. Nothing forces this one tight
    // the way the charger's lane math does — a planted, stationary swing has
    // no distance to close, so the tell can afford to be generous and still
    // teach "this one you cannot just walk through" on its own.
    windup: 0.6,
    active: 0.22,
    recover: 1.15,
    damage: 17,
    knock: 10,
    shake: 0.22,
  },
  cooldown: [0.9, 1.6],
  /**
   * The launcher's own `launch` value (see `ATTACKS.launcher` above), not a
   * boolean. `Kawach.takeHit` in `enemies.js` compares an incoming hit's
   * `launch` against this directly — matching the launcher's number exactly
   * means "what breaks the armor" is answerable by reading one existing
   * config entry rather than a second threshold that could quietly drift out
   * of sync with it.
   */
  armorBreakLaunch: 13.0,
  exp: 42,
  contactDamage: 0,
};

/**
 * PUKAR — the extraction, the corpse window, and what rises from it.
 *
 * The ally runs its source archetype's own state machine (see `chayaOf` in
 * game/shadow.js) — a raakchyas's remnant raises a raakchyas-shaped ally, a
 * charger's raises a charger-shaped one — so this one block carries both shapes' fields
 * and each concrete chaya class reads only the ones its state machine needs.
 *
 * `channel` and `corpseWindow` are the whole cost of the mechanic. There is no
 * mana price on purpose — a mana price is bookkeeping, and you would work out
 * once whether the bolt or the chaya is the better spend and then always pick
 * it. Standing still for 0.8 s in a live fight is a decision you have to make
 * again every time, and it gambles against the telegraph system already in
 * place.
 */
export const CHAYA = {
  /** Seconds a body stays claimable. The shrinking shard is this number. */
  corpseWindow: 4.0,
  /**
   * How many bodies can lie about at once, and therefore how many shard rigs
   * the game pre-builds. Comfortably above the four raakchyas of the bridge
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
  // No `hw`/`hh`/`speed` here: `chayaOf` in game/shadow.js reads them off the
  // source archetype's own stats instead, so a raakchyas-raised ally keeps a
  // raakchyas's pace and hitbox and a charger-raised one keeps a charger's — a
  // chaya that wears its source's rig but fights with another archetype's
  // hitbox would still be the bug this file exists to fix, just moved from
  // behaviour into collision geometry.
  // Its own, because these are what an *ally* needs rather than what the enemy
  // needs: how far it looks for something to fight, and how close it crowds the
  // hunter it is following.
  chaseRange: 26,
  stopAt: 2.4,
  // The raakchyas's pounce exactly, carrying its own damage.
  //
  // Identical timings are the point, not laziness: the player has already
  // learned to read this wind-up, and an ally whose leap reads differently would
  // make them learn a second tell for no gain. Damage is the one number that
  // must not be shared — the ally exists to change a fight, not to win it while
  // the hunter watches, and a shared number would mean every future tune of the
  // enemy silently tuned the player's ally.
  pounce: { ...RAAKCHYAS.pounce, damage: 11 },
  /** Knockback its pounce deals, and takes. */
  knock: 5,

  // The charger-raised ally's own charge. Same relationship `pounce` above
  // has to `RAAKCHYAS.pounce`: the timings are the hostile charger's own, already
  // learned, but the damage is tuned separately and low — a support ally's
  // hit carries far lower stakes than an attack the hunter has to dash
  // through. No `chain`: a chaya's charge never chains even when its source
  // could, so it always resolves to one commit.
  charge: { ...CHARGER.charge, damage: 6, knock: 4 },
  /** The charger-raised ally's own lane tolerance and idle window. */
  laneHeight: CHARGER.laneHeight,
  cooldown: CHARGER.cooldown,

  // The kawach-raised ally's own bash. Same relationship `pounce` and `charge`
  // above have to their sources: the timings are the hostile kawach's own,
  // already learned, but the damage is tuned down for a support ally's hit.
  bash: { ...KAWACH.bash, damage: 7, knock: 4 },

  /**
   * Grace after being hit.
   *
   * A pounce's hitbox is live for half a second, and the ally walks straight
   * into it — without this it would take that damage on every frame of the
   * leap and evaporate. Same job as the hunter's `hurtInvuln`, shorter because
   * the chaya is not asked to escape anything.
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
 * The Kevat — the crossing's Warden.
 *
 * A charger, elevated: `docs/DECISIONS.md` § Wardens and bosses is explicit
 * that this is configuration, not a new file or a new state machine. The
 * hunter already reads a charge's tell in full, so the one thing this adds is
 * `charge.chain`: it does not stop at the far bank, it turns around and
 * crosses back — the same wind-up, the same eye-flare, run twice before the
 * recovery the hunter was taught to punish. No new telegraph, because there is
 * nothing left to teach; the ferry crossing twice is the whole idea.
 */
export const KEVAT = {
  ...CHARGER,
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
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

export const BHOOT_BATTI = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.38,
  hh: 0.38,
  speed: 3.0,
  hover: { amp: 0.7, freq: 1.5 },
  // A bhoot-batti should make you *change tool*, not make you *wait*. At 2.2
  // units up and 7.5 out it sat outside the light attack's 1.72 ceiling and
  // outside every melee range, so the only answer was mana — and with regen at
  // 5.5/s that turned two bhoot-battis into a thirty-second stall where the
  // hunter walks underneath them taking chip damage. Now it drifts inside jump
  // and launcher range, and the bolt is the *efficient* answer rather than the
  // only one.
  hoverAbove: 1.6,
  leash: 9, // never strays this far horizontally from where it spawned
  descend: 4.5, // ...nor this far below it, which keeps it out of the void
  keepDistance: 5.5,
  // Round 1 was 2.4 / 0.55 / 11 and read as too sharp; round 2 at 3.1 / 0.72 / 9
  // read as "now they are too easy — the previous difficulty was good enough".
  // So the interval and the damage go back, and only the wind-up stays long.
  //
  // That split is deliberate rather than a compromise. Four of seven round-1
  // deaths were falls while fighting bhoot-battis over the chasm, and the
  // damage was never what killed anyone — knockback arriving with no warning while
  // airborne was. The wind-up is the part that addressed that specifically, and
  // it is the part with no cost to the threat level: you can see the shot
  // coming and still have to deal with it.
  shoot: { interval: 2.5, windup: 0.66, speed: 15, damage: 11, life: 3 },
  exp: 22,
  contactDamage: 0,
};

/**
 * Tantrik — Preta-lok's summoner.
 *
 * Every other grunt threatens with its own body committing to something; this
 * one never does — `Tantrik.attackBox` in `enemies.js` always returns null.
 * Its entire threat is the queue of raakchyas it keeps raising, which is user
 * story 13's whole ask: prioritising it over what it summons has to be the
 * winning play because nothing else about the fight rewards ignoring it.
 *
 * `keepDistance` is the ground version of `BHOOT_BATTI.keepDistance` — closes
 * when far, backs off when crowded — so melee only ever happens because the
 * hunter chose to close the distance, not because the Tantrik ran out of
 * somewhere to retreat to. `maxLiving` is the bound on the queue: reached, it
 * stops casting rather than stacking a fight nobody could clear in time.
 */
export const TANTRIK = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.42,
  hh: 0.64,
  speed: 2.4,
  chaseRange: 26,
  keepDistance: 6.5,
  summon: {
    // A plant, not a lane — nothing forces this tight the way a charger's
    // lane math does, so it is generous like Kawach's bash and clears the
    // 0.42s floor `telegraphs()` in `tools/gatecheck.js` holds every tell to.
    range: 20,
    windup: 0.62,
    active: 0.14,
    recover: 1.2,
    /** Raakchyas raised per cast. Atripta's one added move moves this to 2. */
    burst: 1,
  },
  cooldown: [1.8, 2.6],
  /** Live raakchyas this Tantrik tolerates before it stops casting again. */
  maxLiving: 2,
  exp: 44,
  contactDamage: 0,
};

/**
 * Atripta — The Unfilled, Preta-lok's Warden.
 *
 * An existing archetype, elevated, per `docs/SPEC-CAMPAIGN.md` § "Wardens are
 * configuration, not code" — the same relationship `KEVAT` has to `CHARGER`.
 * The one added move is `summon.burst: 2`: the same telegraph the hunter
 * already reads, just never satisfied by raising only one — fitting for a
 * hunger that is never filled, and the same shape as the Kevat's `charge.chain`.
 */
export const ATRIPTA = {
  ...TANTRIK,
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.56,
  hh: 0.82,
  speed: 2.1,
  summon: {
    ...TANTRIK.summon,
    windup: 0.66,
    recover: 1.4,
    burst: 2,
  },
  cooldown: [1.4, 2.0],
  maxLiving: 4,
  exp: 380,
  contactDamage: 0,
};

/**
 * Vyaghri — the Pack-Mother, the animal realm's Warden.
 *
 * An existing archetype, elevated, exactly as `KEVAT` is to `CHARGER` — gate
 * 5 introduces no new archetype per `docs/SPEC-CAMPAIGN.md`'s table, so its
 * Warden is a second elevation of the same one, not a fifth. The signature
 * addition is the same shape as the Kevat's: `charge.chain` goes to 3 rather
 * than 2, one more commitment than the hunter has ever had to read out of a
 * single wind-up — fitting a gate whose whole job is teaching that a beast
 * pack does not stop at two.
 *
 * `cooldown` is tighter than `CHARGER`'s and even `KEVAT`'s: the density this
 * gate spends four encounters building is the setup, and the Warden is meant
 * to read as what the pack has been rehearsing the whole way in.
 */
export const VYAGHRI = {
  ...CHARGER,
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.72,
  hh: 0.7,
  speed: 3.4,
  charge: {
    ...CHARGER.charge,
    range: 8,
    speed: 19,
    dur: 0.48,
    damage: 16,
    knock: 10,
    /** One more than the Kevat's — the Pack-Mother does not stop at two. */
    chain: 3,
  },
  cooldown: [0.7, 1.2],
  exp: 430,
  contactDamage: 0,
};

/**
 * Amar-Yoddha — the Ever-Warring, Asura-lok's Warden.
 *
 * An existing archetype, elevated, exactly as `KEVAT` and `VYAGHRI` are to
 * `CHARGER` — gate 7 introduces no new archetype per
 * `docs/SPEC-CAMPAIGN.md`'s table, and a third elevation of the same one is
 * the fit `docs/DECISIONS.md`'s Vyaghri entry already argued for reuse, not a
 * shortcut around authoring a fourth. The signature addition continues the
 * same escalation: `charge.chain: 4`, one more than the Pack-Mother's 3 — an
 * asura does not stop charging because it has already charged three times,
 * which is the whole idea of a war without end. `charge.windup` is untouched,
 * same as every prior elevation: no new telegraph, because there is nothing
 * left to teach.
 *
 * `cooldown` is the tightest of the three — Asura-lok is named "the most
 * fight-dense gate" in the spec, and the Warden closing it is meant to read
 * as the density the gate has been building the whole way in, the same job
 * `VYAGHRI.cooldown` already does for gate 5.
 */
export const AMAR_YODDHA = {
  ...CHARGER,
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.7,
  hh: 0.72,
  speed: 3.5,
  charge: {
    ...CHARGER.charge,
    range: 8.5,
    speed: 20,
    dur: 0.5,
    damage: 17,
    knock: 10,
    /** One more than the Pack-Mother's — the war does not stop at three. */
    chain: 4,
  },
  cooldown: [0.65, 1.1],
  exp: 500,
  contactDamage: 0,
};

/**
 * Shakuni — gate 1's Warden, per `docs/research/villain-roster.md`'s handoff
 * (`dfed2a1`): a courtier, not a warrior, so his kit is a summoned hazard
 * rather than a melee state machine. `hw`/`hh` sit a little past player
 * scale — enlarged along with the rig itself (`SHAKUNI_SCALE` in
 * `models.js`) so he reads as at least as big as the hunter rather than
 * slight, per playtest. Tier 2: a new rig in `models.js`, but the class
 * extends `Enemy` directly rather than copying `BhootBatti`'s flight —
 * Shakuni is grounded and walks a keep-distance ring the way `Kawach` paces,
 * not the way `BhootBatti` hovers.
 *
 * Two moves share `interval` as one cooldown — `Shakuni.update` in
 * `enemies.js` rolls which one fires each time it lapses — so "faster" means
 * both read off the same, shortened number rather than drifting apart.
 *
 * `die.windup` is how long the die sits at its landing point showing a face
 * before the zone it read resolves — the "read it before it commits" the
 * handoff calls his kit's honest answer to the roster's hardest entry. Face
 * (1–6, rolled at cast) scales `die.radius` between `dieRadiusRange` — a
 * bigger face is a wider zone to clear, so reading the face is not flavor.
 * `die.damage`/`die.knock` stay flat across faces: only the read changes,
 * not the punishment for missing it.
 *
 * `cards` is the die's opposite: a courtier's fan of ten thrown at once
 * across `spread` radians, punishing exactly the range the die's own
 * keep-away read leaves open. Per-card `damage` is low because standing in
 * the fan risks several cards landing at once, not one.
 */
export const SHAKUNI = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.46,
  hh: 1.15,
  speed: 3.2,
  chaseRange: 22,
  keepDistance: 8.5, // holds well back — a courtier, not a brawler
  interval: 1.35, // cooldown between casts, either move
  die: {
    cast: 0.28, // raise-and-throw flourish before the die is in flight
    windup: 0.85, // die down, face showing — the readable window
    radiusRange: [1.6, 3.6], // face 1 -> 1.6, face 6 -> 3.6
    damage: 16,
    knock: 9,
  },
  cards: {
    cast: 0.45, // fan-out flourish before the cards are in flight
    count: 10,
    spread: 0.62, // radians, full fan width
    speed: 15,
    damage: 8,
    life: 2.4,
    recover: 0.45,
  },
  exp: 260,
  contactDamage: 0,
  // No rig-swap, no reveal — per the handoff, escalation is the die's own
  // telegraphs tightening, not a palette or pose change. Implemented locally
  // (see `Shakuni._enrage` in enemies.js), the same call Shurpanakha's
  // handoff makes for a tier-2 Warden rather than waiting on the campaign's
  // shared `phases`/`Boss`-only enrage machinery.
  enrageAt: 0.5,
  enrageWindupMul: 0.68,
  enrageIntervalMul: 0.75,
};

/**
 * Bakasura — gate 2's Warden, per `docs/research/villain-roster.md`'s
 * handoff: a glutton-demon, not a warrior, beaten bare-handed in the source
 * rather than with a weapon. `hw 1.0`/`hh 1.25` is a proportion claim as
 * much as a size one — unusually close to parity for any enemy in the game,
 * "heavy-bellied" rather than merely tall. Tier 2: a new rig in
 * `models.js`, but `Bakasura` in `enemies.js` extends `Enemy` directly
 * following `Kawach`'s chase → telegraph → attack → recover skeleton, with
 * an offset attack box and a second telegraph variant as the only
 * departures.
 *
 * Two committed moves, picked by range the way `Charger` already varies by
 * distance without becoming a new tier: `grab` is the close-range signature
 * — an asymmetric box reaching `grab.reach` forward and only `grab.reachBack`
 * behind, since a grab lunges forward and not sideways — and `tackle` covers
 * the band just past it, so a hunter holding station at "just outside grab
 * range" is not free. No phase-transition: per the handoff, escalation (if
 * any) is the two windups tightening via `enrageWindupMul`, not a rig or
 * palette swap — the same locally-implemented `_enrage()` pattern
 * `SHAKUNI` above establishes for a tier-2 Warden.
 */
export const BAKASURA = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 1.0,
  hh: 1.25,
  speed: 2.3,
  chaseRange: 24,
  stopAt: 2.0,
  grab: {
    range: 2.6,
    windup: 0.62,
    active: 0.24,
    recover: 1.1,
    damage: 22,
    knock: 13,
    reach: 2.0, // ~2×hw, per the handoff
    reachBack: 0.15,
  },
  tackle: {
    range: 4.6,
    windup: 0.55,
    active: 0.32,
    recover: 0.95,
    speed: 8.5,
    damage: 15,
    knock: 10,
    wallRecover: 0.3,
  },
  cooldown: [0.9, 1.7],
  exp: 58,
  contactDamage: 0,
  enrageAt: 0.5,
  enrageWindupMul: 0.85,
};

/**
 * Taraka — gate 4's Warden, per `docs/research/villain-roster.md`'s handoff:
 * a curse victim, not a birth-monster, so her kit is "lightning speed" made
 * literal rather than a grapple or a weapon. Tier 2: a new rig in
 * `models.js` (both curse-phase meshes, built up front and swapped by a
 * `visible` flag — never rebuilt mid-run), but `Taraka` in `enemies.js`
 * extends `Charger` directly per the kit-shape call: claws close the
 * distance fast rather than wrestling for a throw, the same chase →
 * telegraphed windup → committed lane-charge shape a charge already is,
 * reskinned as a claw-swipe hitbox instead of a body check.
 *
 * `hw`/`hh` are fixed at the monstrous form's own silhouette for the whole
 * fight, never resized at the curse-reveal swap — the handoff's own call,
 * so the swap is cosmetic and never a fairness change. `speed` sits above
 * the rest of the Warden pack — the roster's other giant, `BAKASURA`, is
 * 2.3; this is faster than the base `CHARGER` itself — because "lightning
 * speed" is the one differentiator the source gives her, and the handoff
 * asks for it as a real stat rather than flavor text.
 */
export const TARAKA = {
  ...CHARGER,
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.78,
  hh: 1.3,
  speed: 4.0,
  chaseRange: 26,
  charge: {
    ...CHARGER.charge,
    // A shorter, quicker lane than the base charger's — a claw-pounce
    // rather than a lumbering body-check, closing at a higher rate over a
    // smaller range so "lightning speed" reads in the commit itself, not
    // only in her footspeed between commits.
    range: 6.5,
    minRange: 2.2,
    windup: 0.52,
    speed: 21,
    dur: 0.4,
    recover: 1.15,
    wallRecover: 0.4,
    damage: 20,
    knock: 12,
    shake: 0.24,
  },
  cooldown: [0.7, 1.3],
  exp: 62,
  contactDamage: 0,
  // The roster's first phase-transition: an HP threshold that fires a paged,
  // held story beat (`Game.firePhaseBeat`) rather than an instant swap —
  // the hunter watches the curse happen rather than reading about it. Kit
  // and hitbox are identical before and after; `phaseWindupMul` is the one
  // thing that actually tightens, the same "escalation is the windup, not
  // the kit" call `SHAKUNI`/`BAKASURA` already make for their own enrages.
  phaseAt: 0.5,
  // Clears `tools/gatecheck.js`'s telegraph floor by a comfortable margin
  // even at its tightest, post-reveal value (0.52 × 0.85 = 0.442s against a
  // 0.42s floor) — deliberately, unlike the Guardian's 9ms case, since
  // "lightning speed" is already the differentiator and the windup itself
  // does not need to be the thing that is barely fair.
  phaseWindupMul: 0.85,
};

/**
 * Kaikeyi's gate (5) — the roster's first tier-0, no-combat build
 * (`docs/agents/villain-handoff.md`). She has no `Enemy`/`Boss` stats block
 * at all; the one tunable her gate needs is how far off the ground the
 * hunter has to be, at a fork's trigger x, to read as "took the jump path"
 * rather than "walked it" — `Game._updateForks` in `game.js`. Comfortably
 * below `PLAYER.jumpVel`'s own apex (20.5² / (2 × 62) ≈ 3.39 units), so an
 * incidental hop still registers, and comfortably above 0 so ordinary
 * ground jitter never misreads as a jump.
 */
export const KAIKEYI_FORK = { jumpY: 0.4 };

/**
 * Shurpanakha — gate 6's Warden, and the roster's second phase-transition
 * after Taraka (`docs/research/villain-roster.md`).
 *
 * A `RAAKCHYAS` at heart, not a `CHARGER`: her entry's tier call is explicit
 * that the class extends the grunt directly and reuses its chase → windup →
 * pounce shape, because rakshasi is the feminine of the same demon-word the
 * grunt is named for. Every number below is that block, elevated — the same
 * "Wardens are configuration, not code" relationship `KEVAT` has to
 * `CHARGER` and `ATRIPTA` has to `TANTRIK`.
 *
 * One hitbox, not two. Her rig swaps at the reveal and her hitbox never
 * does — it is the true form's `hw 0.46 / hh 0.95` from the first hit, so
 * the swap can never be a fairness change. Exactly Taraka's precedent, and
 * for exactly her reason.
 */
export const SHURPANAKHA = {
  ...RAAKCHYAS,
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.46,
  hh: 0.95,
  // Slower than the grunt she extends and much slower than Taraka's 4.0
  // "lightning speed" two gates back — her threat is the one committed swipe,
  // not the approach, and the act does not need two fast Wardens in a row.
  speed: 3.4,
  chaseRange: 26,
  pounce: {
    ...RAAKCHYAS.pounce,
    // A step-in swipe rather than the grunt's full leap: she closes less
    // ground and lands sooner, which is what lets the same hitbox read as a
    // conjured feint before the reveal and a bare claw after it.
    range: 5.0,
    windup: 0.5,
    vx: 11.0,
    vy: 8.5,
    damage: 18,
    active: 0.42,
    recover: 0.9,
  },
  stopAt: 2.2,
  exp: 66,
  contactDamage: 0,
  // The reveal: an HP threshold firing a paged, held story beat
  // (`Game.firePhaseBeat`), same machinery Taraka's curse-reveal built and
  // this is its second consumer rather than a second bespoke wiring job. Kit
  // and hitbox are identical either side of it; `phaseWindupMul` is the only
  // thing that tightens, the same "escalation is the windup, not the kit"
  // call every enrage on the roster already makes.
  phaseAt: 0.5,
  // 0.5 × 0.88 = 0.44s against `tools/gatecheck.js`'s 0.42s telegraph floor —
  // a 20ms margin, tighter than Taraka's but still above the shortest tell
  // gate 1 ever taught, and `telegraphs()` holds the revealed number rather
  // than the disguised one for exactly that reason.
  phaseWindupMul: 0.88,
};

export const GUARDIAN = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
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

/**
 * Goru-Mukh — the Ox-Headed, Naraka's Warden.
 *
 * Three attacks rather than the Guardian's four: no volley. A judge of the
 * hells does not need to keep its distance, and the campaign already has one
 * ranged boss attack to teach — a second only for gate 3 to reuse would be
 * repetition dressed as a new fight. `horn` reuses the Guardian's `charge`
 * shape, `stamp` its `slam`, `sweep` its own name — same arithmetic, gate 3's
 * own numbers.
 *
 * Its sweep enraged is the tightest wind-up in the game after the Guardian's
 * own: 0.62 × 0.78 = 0.484 s, thirty-odd ms clear of the 0.42 s floor
 * `telegraphs()` holds every tell to. Worth knowing, not a number to shave.
 */
export const GORU_MUKH = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 1.7,
  hh: 2.0,
  speed: 3.4,
  exp: 360,
  contactDamage: 0,
  enrageAt: 0.5,
  enrageSpeedMul: 1.3,
  enrageWindupMul: 0.78,
  attacks: {
    charge: { windup: 0.78, speed: 18, dur: 0.8, recover: 0.95, damage: 22, knock: 13, shake: 0.3 },
    slam: { windup: 0.70, rise: 0.34, fall: 0.24, recover: 1.0, damage: 25, radius: 5.6, knock: 15, shake: 0.55 },
    sweep: { windup: 0.62, active: 0.30, recover: 0.8, damage: 18, reach: 5.2, knock: 11, shake: 0.28 },
  },
  cooldown: [0.9, 1.7],
};

/**
 * Hakim — the Magistrate, Manav-lok's Warden and the campaign's third boss
 * per `docs/SPEC-CAMPAIGN.md`'s table (gates 3, 6, 8, 10). Bespoke numbers and
 * its own rig (`buildHakim` in `models.js`), the same relationship the
 * Goru-Mukh has to the Dwar-Rakshak rather than an elevated grunt archetype —
 * gate 6 introduces no new grunt, and its Warden is boss-tier, not a second
 * elevation of an existing one.
 *
 * Same three-part kit as the Goru-Mukh (charge, slam, sweep) — a court's
 * verdict is delivered close, not from range, so there is no volley here
 * either. Its sweep enraged clears the 0.42 s reaction floor
 * `telegraphs()` in `tools/gatecheck.js` holds every tell to by 60 ms
 * (0.60 × 0.80 = 0.480 s), the same margin the campaign's other melee bosses
 * hold theirs by.
 */
export const HAKIM = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 1.6,
  hh: 1.95,
  speed: 3.5,
  exp: 460,
  contactDamage: 0,
  enrageAt: 0.5,
  enrageSpeedMul: 1.3,
  enrageWindupMul: 0.8,
  attacks: {
    charge: { windup: 0.76, speed: 18.5, dur: 0.82, recover: 0.92, damage: 23, knock: 13, shake: 0.3 },
    slam: { windup: 0.72, rise: 0.34, fall: 0.24, recover: 1.0, damage: 26, radius: 5.8, knock: 15, shake: 0.55 },
    sweep: { windup: 0.60, active: 0.30, recover: 0.8, damage: 19, reach: 5.3, knock: 11, shake: 0.28 },
  },
  cooldown: [0.9, 1.7],
};

/**
 * Chiranjivi — the Long-Lived, Deva-lok's Warden and the campaign's fourth
 * boss per `docs/SPEC-CAMPAIGN.md`'s table (gates 3, 6, 8, 10). Bespoke
 * numbers and its own rig (`buildChiranjivi` in `models.js`), the same
 * relationship the Hakim has to the Goru-Mukh — gate 8 introduces no new
 * grunt archetype either, and its Warden is boss-tier, not a fourth
 * elevation of an existing one.
 *
 * Same three-part kit as the Goru-Mukh and the Hakim (charge, slam, sweep):
 * a deva does not need to keep its distance any more than a judge or an ox-
 * headed warden did, and the campaign's one ranged boss attack stays the
 * Guardian's alone. Numbers step up from the Hakim's, matching the escalation
 * `VYAGHRI` → `AMAR_YODDHA` already set for the grunt-elevation line. Its
 * sweep enraged clears the 0.42 s reaction floor `telegraphs()` in
 * `tools/gatecheck.js` holds every tell to by 60 ms (0.60 × 0.80 = 0.480 s),
 * the same margin the campaign's other melee bosses hold theirs by.
 */
export const CHIRANJIVI = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 1.65,
  hh: 2.0,
  speed: 3.6,
  exp: 520,
  contactDamage: 0,
  enrageAt: 0.5,
  enrageSpeedMul: 1.3,
  enrageWindupMul: 0.8,
  attacks: {
    charge: { windup: 0.74, speed: 19, dur: 0.8, recover: 0.9, damage: 24, knock: 13, shake: 0.3 },
    slam: { windup: 0.70, rise: 0.34, fall: 0.24, recover: 1.0, damage: 27, radius: 5.9, knock: 15, shake: 0.55 },
    sweep: { windup: 0.60, active: 0.30, recover: 0.8, damage: 20, reach: 5.4, knock: 11, shake: 0.28 },
  },
  cooldown: [0.85, 1.6],
};

/**
 * Bakaya — the Backlog, Yama-sabha's Warden.
 *
 * An existing archetype, elevated a second time, exactly as `VYAGHRI` is to
 * `KEVAT` — gate 9 introduces no new archetype per `docs/SPEC-CAMPAIGN.md`'s
 * table, and `ATRIPTA` is the summoner-elevation line's first entry, not its
 * only one. The fit is the spec's own: "The Backlog — the accumulated
 * unjudged given shape — so the fight is against what his absence made rather
 * than against him." A summoner that never stops raising more than it did
 * last time *is* a backlog, mechanically as well as narratively — the same
 * escalation shape `charge.chain` already carries across `KEVAT` → `VYAGHRI`
 * → `AMAR_YODDHA`, continued on `summon.burst` instead: `ATRIPTA`'s 2 becomes
 * 3, one more unjudged soul raised per cast than the hunter has ever had to
 * answer at once. `summon.windup` moves by two hundredths of a second, same
 * as `ATRIPTA`'s own move off `TANTRIK` — no new telegraph, because there is
 * nothing left to teach, only more of what gate 4 already did.
 */
export const BAKAYA = {
  ...TANTRIK,
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 0.6,
  hh: 0.86,
  speed: 2.0,
  keepDistance: 7,
  summon: {
    ...TANTRIK.summon,
    windup: 0.68,
    recover: 1.5,
    burst: 3,
  },
  cooldown: [1.2, 1.8],
  /** Live raakchyas this Bakaya tolerates before it stops casting again. */
  maxLiving: 5,
  exp: 560,
  contactDamage: 0,
};

/**
 * Maun-Ankur — What Grew In The Stillness, the Wheel's Warden and the
 * campaign's fourth and final boss per `docs/SPEC-CAMPAIGN.md`'s table
 * (gates 3, 6, 8, 10). Bespoke numbers and its own rig (`buildMaunAnkur` in
 * `models.js`), the same relationship the Chiranjivi has to the Hakim rather
 * than an elevated grunt archetype — gate 10 introduces no new grunt, and
 * this Warden closes the campaign the way the other three Guardian-class
 * fights closed theirs.
 *
 * Same three-part kit as the Goru-Mukh, the Hakim and the Chiranjivi
 * (charge, slam, sweep) — the campaign's one ranged boss attack stays the
 * Guardian's alone, and a fourth boss earns its escalation on numbers, the
 * same way `CHIRANJIVI` earned its step up from `HAKIM`, not on a new tell
 * the hunter has never had to read. Its sweep enraged clears the 0.42 s
 * reaction floor `telegraphs()` in `tools/gatecheck.js` holds every tell to
 * by 60 ms (0.60 × 0.80 = 0.480 s), the same margin the campaign's other
 * melee bosses hold theirs by.
 */
export const MAUN_ANKUR = {
  hp: 5, // phone-playtest HP; see DECISIONS.md — stays until Android port
  hw: 1.7,
  hh: 2.05,
  speed: 3.7,
  exp: 600,
  contactDamage: 0,
  enrageAt: 0.5,
  enrageSpeedMul: 1.3,
  enrageWindupMul: 0.8,
  attacks: {
    charge: { windup: 0.72, speed: 19.5, dur: 0.8, recover: 0.9, damage: 25, knock: 14, shake: 0.3 },
    slam: { windup: 0.68, rise: 0.34, fall: 0.24, recover: 1.0, damage: 28, radius: 6.0, knock: 16, shake: 0.58 },
    sweep: { windup: 0.60, active: 0.30, recover: 0.8, damage: 21, reach: 5.5, knock: 12, shake: 0.28 },
  },
  cooldown: [0.8, 1.5],
};

/** Style ranks. `decay` is meter lost per second while not attacking. */
export const STYLE = {
  ranks: [
    { letter: STRINGS.RANK_0_LETTER, word: STRINGS.RANK_0_WORD, at: 0 },
    { letter: STRINGS.RANK_1_LETTER, word: STRINGS.RANK_1_WORD, at: 55 },
    { letter: STRINGS.RANK_2_LETTER, word: STRINGS.RANK_2_WORD, at: 130 },
    { letter: STRINGS.RANK_3_LETTER, word: STRINGS.RANK_3_WORD, at: 230 },
    { letter: STRINGS.RANK_4_LETTER, word: STRINGS.RANK_4_WORD, at: 360 },
    { letter: STRINGS.RANK_5_LETTER, word: STRINGS.RANK_5_WORD, at: 520 },
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
  /**
   * A Warden's name, on arrival. Shorter than the old freezing `bossIntro`
   * (2400ms) it replaces — nothing to read here but one word, and nothing
   * halts the fight to give it more time than that.
   */
  bossName: 1600,
  /**
   * A non-boss Warden's name, note and quote together — more to read than
   * `bossName` carries alone, so it gets longer on screen. See gate 1's
   * Shakuni for the first user; falls back to `bossName`'s plain toast for
   * any Warden whose `intro` has no `quote` yet.
   */
  wardenIntro: 2600,
  /** The first-remnant teaching line: the longest window in the game. */
  remnantTeach: 3400,
  /** Any boss or Warden's enrage warning — generic, not tied to one name. */
  enrage: 1800,
  /** Level-up. */
  levelUp: 2100,
  /** The training hall's closing line, once every verb has been taught. */
  tutorialDone: 2400,
};

/**
 * The training hall — issue #35. Its geometry is a gate descriptor (see
 * `gates/tutorial.js`); these are the numbers its own driver (`tutorial.js`)
 * needs and no gate does.
 */
export const TUTORIAL = {
  /** Grounded speed past which "move" counts as performed. */
  moveSpeed: 3,
  /**
   * How far below the floor counts as having fallen off it — should not be
   * reachable given how far `gates/tutorial.js`'s single segment is padded,
   * but the rule is "no death, ever" here, so a hunter who somehow clears the
   * padding is put back at the spawn rather than let fall forever.
   */
  fallResetY: -12,
  /** Harmless practice targets raised once the last step (PUKAR) clears. */
  dummyCount: 2,
  dummySpacing: 3,
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
