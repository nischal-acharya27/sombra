// PUKAR — what a body leaves behind, and what rises from it.
//
// Two small things live here and they are two halves of one mechanic: the
// corpse is the offer, the chaya is what accepting it costs and buys.
//
// The design rule that shapes both: **one chaya at a time.** That is not
// enforced anywhere in this file, and deliberately so — the game holds a single
// slot rather than a list, so "one" is a property of the shape rather than a
// rule someone has to remember to check. Every readability rule in the combat
// design exists so the player always knows what happened to them, and four
// allies in a corridor arena destroy that.

import { Raakchyas, Charger, Kawach } from './enemies.js';
import { CHAYA } from './config.js';
import { P } from '../render/palette.js';
import { clamp } from '../engine/mathx.js';

/** How far the shard floats above the body it marks. */
const SHARD_HEIGHT = 0.95;

/** The ally wears its source's rig in the System's colours. See palette.js. */
const SKIN = {
  body: P.chayaBody,
  dark: P.chayaBodyDark,
  spine: P.chayaSpine,
  eye: P.chayaEye,
};

/**
 * A claimable body.
 *
 * It is not an enemy and it is not an actor: it does not move, it cannot be
 * hit, and nothing collides with it. Bodies are harmless to stand on and walk
 * through, which is the game's rule and the reason extraction had to be bound
 * to something other than plain heavy — standing next to a corpse is *correct*
 * play, so the launcher could not be allowed to become a root whenever one
 * happened to be in reach.
 */
export class Corpse {
  /**
   * Allocates nothing. The body is the dying enemy's own rig, left exactly
   * where and how it fell, and the shard is borrowed from a pool the game
   * built at construction time. That is a hard requirement rather than an
   * optimisation: three.js draws four `Math.random()` values per object for
   * its UUID, and the suite runs the game against a seeded `Math.random`, so
   * anything built during a run reaches into the gameplay stream and re-rolls
   * it.
   *
   * The two are kept as siblings rather than parented together because the
   * death animation squashes the body to a fifth of its height, and a shard
   * parented to it would inherit the squash.
   *
   * @param {THREE.Group} body the dying enemy's own rig
   * @param {THREE.Group} shard borrowed from the game's pool, returned on expiry
   * @param {Function} sourceClass the dying enemy's own class — `extract()`
   *   reads `sourceClass.chayaClass` off it to raise the matching ally.
   */
  constructor(x, y, body, shard, sourceClass) {
    this.x = x;
    this.y = y;
    this.windowT = CHAYA.corpseWindow;
    this.t = 0;
    this.body = body;
    this.shard = shard;
    this.sourceClass = sourceClass;
    shard.position.set(x, y + SHARD_HEIGHT, 0);
    shard.rotation.set(0, 0, 0);
    shard.scale.setScalar(1);
  }

  /**
   * The window *is* the tell.
   *
   * The shard shrinks with the time left, so the player reads the deadline off
   * the body instead of off a number in the corner. It never shrinks to
   * nothing: a shard too small to notice in the last second is a shard that
   * teaches the player the window ended early.
   */
  update(dt) {
    this.windowT -= dt;
    this.t += dt;
    const u = clamp(this.windowT / CHAYA.corpseWindow, 0, 1);
    this.shard.scale.setScalar(0.34 + u * 0.66);
    this.shard.rotation.y += dt * 2.4;
    this.shard.position.y = this.y + SHARD_HEIGHT + Math.sin(this.t * 3.2) * 0.07;
  }

  get expired() {
    return this.windowT <= 0;
  }
}

/**
 * The raised chaya: one melee ally that follows and fights, wearing its
 * source archetype's own rig and running its own state machine.
 *
 * A chaya is its source's own update loop pointed at a different target,
 * which is the single decision that makes this mechanic small. `Raakchyas.update`
 * and `Charger.update` already took their target as a parameter rather than
 * reaching for the player, so an ally is that same state machine handed the
 * nearest enemy instead — and when there is no enemy, handed the hunter, with
 * its commit gated off by `_canCommit`.
 *
 * `chayaOf(Base)` is the glue every ally shares regardless of what it wears:
 * never hostile toward the hunter, no corpse of its own, and it re-forms
 * beside the hunter when left behind. It obeys every rule the enemies obey —
 * no passive contact damage, it hurts things only by committing to its own
 * attack — and it is not in the enemy list, so the hunter's swings pass
 * through it and it can never hold an encounter open.
 *
 * Generated once per archetype, at module load, by the two concrete classes
 * below — not per instance, so raising a chaya still allocates nothing
 * beyond its rig.
 */
function chayaOf(Base) {
  // `speed`, `hw` and `hh` are pulled from the source archetype rather than
  // `CHAYA`: keeping up with the hunter is `recallAt`'s job, and an ally
  // that outruns, lags, or fights with a different archetype's hitbox stops
  // reading as the same creature, which is the only reason the recolour
  // reads as one at all. Computed once here, not per instance, and not by
  // mutating the shared `CHAYA` config that every archetype's ally reads.
  const cfg = { ...CHAYA, speed: Base.stats.speed, hw: Base.stats.hw, hh: Base.stats.hh };

  return class extends Base {
    constructor(level, ctx, x, y) {
      super(level, ctx, x, y, cfg, SKIN);
      this.hostile = false;
      /** Victims of the current commit, cleared between them. */
      this.hitSet = new Set();
      this.hurtCd = 0;
      /**
       * A dead chaya leaves nothing. Raising one from your own chaya's body
       * would make the corpse window irrelevant and the mechanic
       * self-sustaining, which is the opposite of a cost.
       */
      this.leavesCorpse = false;
    }

    /** No committing at the hunter it is following. */
    _canCommit() {
      return this.hostile;
    }

    update(dt, player, enemies) {
      this.hurtCd -= dt;
      if (this.state !== 'dying') this._recall(player);

      // Nearest living enemy, or the hunter to follow.
      let target = null;
      let best = Infinity;
      for (const e of enemies) {
        if (e.dead) continue;
        const d = Math.abs(e.x - this.x);
        if (d < best && d < this.cfg.chaseRange) {
          best = d;
          target = e;
        }
      }
      this.hostile = !!target;
      super.update(dt, target || player);
    }

    /**
     * Re-form beside the hunter when left behind or dropped out of the world.
     *
     * This is one rule standing in for a pathfinder. The ally would otherwise
     * be lost to every pit in the level, every encounter barrier that closes
     * behind the hunter, and every ledge its one-unit ledge check refuses to
     * walk off — and a slice meant to answer "does an ally make this combat
     * better" would instead spend its evidence on navigation. A chaya
     * appearing out of nowhere beside its master costs the fiction nothing,
     * which is the rare case where the cheap answer is also the right one.
     */
    _recall(player) {
      const behind = Math.abs(this.x - player.x) > CHAYA.recallAt;
      const below = this.y < player.y - CHAYA.recallBelow;
      if (!behind && !below) return;
      this.x = player.x - player.facing * CHAYA.recallBehind;
      this.y = player.y + CHAYA.recallAbove;
      this.vx = 0;
      this.vy = 0;
      this.state = 'chase';
      this.ctx.vfx?.shadowBurst(this.x, this.y + 0.4, 12, P.violet);
    }
  };
}

/** A chaya raised from a Raakchyas's remnant: chase-and-pounce, its own tell. */
export class RaakchyasChaya extends chayaOf(Raakchyas) {}

/** A chaya raised from a Charger's remnant: plant, telegraph, run a lane. */
export class ChargerChaya extends chayaOf(Charger) {}

/**
 * A chaya raised from a Kawach's remnant: plant, telegraph, one bash.
 *
 * Its armour rule does not come along for the ride — `chayaOf` builds `cfg`
 * from `CHAYA` plus the source's `speed`/`hw`/`hh` only, so this ally has no
 * `armorBreakLaunch` of its own and `Kawach.takeHit`'s guard simply reads
 * `undefined` as "nothing qualifies", never firing. That is the right
 * failure direction: an ally that could not be hit at all would be a bug, an
 * ally whose armour never mattered in the first place is merely one that
 * never had any to begin with.
 */
export class KawachChaya extends chayaOf(Kawach) {}

// `extract()` reads this off the dying enemy's own class (see `Corpse`
// above), rather than through a lookup table kept elsewhere — the same place
// each archetype already declares `leavesCorpse = true` is where a future
// archetype would add its own chaya class. It is assigned here, not in
// enemies.js, because `enemies.js` cannot import from this module: this
// module already imports `Raakchyas`, `Charger` and `Kawach` from it to build
// these classes, and a two-way import between them would make load order
// matter.
Raakchyas.chayaClass = RaakchyasChaya;
Charger.chayaClass = ChargerChaya;
Kawach.chayaClass = KawachChaya;
