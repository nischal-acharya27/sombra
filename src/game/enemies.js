// Raakchyas, bhoot-battis, and the projectiles both sides throw.
//
// Design rule shared by everything in this file: **no passive contact damage.**
// Touching an enemy is safe; only a committed, telegraphed action hurts. In a
// game where your own attacks lunge you into the enemy, contact damage means
// the correct play is never to attack — and it makes crowding an unavoidable
// tax rather than a positioning mistake.

import * as THREE from 'three';
import { Actor, boxHit } from './actor.js';
import { buildRaakchyas, buildCharger, buildKawach, buildBhootBatti, buildTantrik, buildShakuni, buildBakasura, buildTaraka } from '../render/models.js';
import { RAAKCHYAS, CHARGER, KAWACH, BHOOT_BATTI, TANTRIK, SHAKUNI, BAKASURA, TARAKA, PHYS, JUGGLE } from './config.js';
import { P } from '../render/palette.js';
import { clamp, damp, lerp, rand } from '../engine/mathx.js';

/**
 * Give a rig its own materials so it can flash white when hit. Models share
 * materials by colour for batching; a crowd of six is cheap enough to unshare.
 */
function unshareMaterials(root) {
  const list = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.material || o.material.isShaderMaterial) return; // skip outlines
    o.material = o.material.clone();
    if (o.material.color) list.push({ mat: o.material, base: o.material.color.clone() });
  });
  return list;
}

class Enemy extends Actor {
  constructor(level, ctx, cfg, opts) {
    super(level, opts);
    this.ctx = ctx;
    this.cfg = cfg;
    this.state = 'idle';
    this.stagger = 0;
    this.t = rand(0, 10);
    this.exp = cfg.exp;
    this.removeMe = false;
    this.deathT = 0;
    this.juggleT = 0; // launched: falls slowly, so a juggle is possible
    this.spawnT = 0.45; // rise-from-shadow entrance
  }

  finishSetup() {
    this.mats = unshareMaterials(this.root);
    this.root.scale.setScalar(0.01);
  }

  hurtBox() {
    return this.box;
  }

  /** Returns true if the hit landed (i.e. was not already dead). */
  takeHit({ damage, knock = 0, launch = 0, fromX = 0 }) {
    if (this.dead) return false;
    this.hp -= damage;
    this.hitFlash = 0.10;
    const dir = this.x >= fromX ? 1 : -1;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.state = 'dying';
      this.deathT = 0.42;
      this.vx = dir * knock * 0.7;
      this.vy = Math.max(launch * 0.4, 4.5);
      this.ctx.audio?.play('kill');
      return true;
    }
    this.stagger = launch > 0 ? 0.32 : 0.19;
    this.state = 'hurt';
    this.vx = dir * knock;
    if (launch > 0) {
      // A floor on upward speed, never an assignment.
      //
      // This is the same bug the player's air lunge had, in the same shape and
      // with the same symptom. `vy = launch` meant an aerial connecting with a
      // rising enemy *replaced* its launch velocity with air1's 1.2 —
      // so the one hit the juggle exists to set up was also the hit that ended
      // it. Measured: launch, jump, swing once, and the enemy peaked 1.42 units
      // up while the hunter sailed to 6.59. The playtest reported that as
      // "Space jumps too high and doesn't land", which was exactly right about
      // the symptom and had no way to see the cause.
      this.vy = Math.max(this.vy, launch);
      this.grounded = false;
      this.juggleT = JUGGLE.time;
    }
    this.ctx.audio?.play('impact');
    return true;
  }

  _flash(dt) {
    if (!this.mats) return;
    const f = clamp(this.hitFlash / 0.10, 0, 1);
    for (const m of this.mats) {
      if (f <= 0) {
        if (m.mat.color.equals(m.base)) continue;
        m.mat.color.copy(m.base);
      } else {
        m.mat.color.copy(m.base).lerp(WHITE, f);
      }
    }
  }

  _spawnAnim(dt) {
    this.spawnT -= dt;
    const u = clamp(1 - this.spawnT / 0.45, 0, 1);
    const e = 1 - Math.pow(1 - u, 3);
    this.root.scale.setScalar(lerp(0.01, 1, e));
    if (this.spawnT <= 0) this.root.scale.setScalar(1);
  }

  _dieAnim(dt) {
    this.deathT -= dt;
    const u = clamp(this.deathT / 0.42, 0, 1);
    this.root.scale.set(lerp(0.2, 1, u), lerp(0.05, 1, u), lerp(0.2, 1, u));
    this.applyGravity(dt, PHYS.gravity * 0.6);
    this.moveAndCollide(dt);
    this.syncRig();
    if (Math.random() < 0.7) {
      this.ctx.vfx.emit({
        x: this.x + rand(-0.5, 0.5),
        y: this.y + rand(0.2, 1.2),
        z: rand(-0.4, 0.4),
        vx: rand(-2, 2),
        vy: rand(1, 5),
        size: rand(0.1, 0.26),
        color: P.violet,
        life: rand(0.3, 0.7),
        grav: -1.5,
        drag: 1.6,
      });
    }
    if (this.deathT <= 0) this.removeMe = true;
  }
}

// ---------------------------------------------------------------------------
// Raakchyas
// ---------------------------------------------------------------------------

/**
 * The quadruped grunt — and, pointed at a different target and wearing a
 * different skin, the chaya the hunter raises from one. See `chayaOf` in
 * game/shadow.js.
 *
 * Every number below is read from `this.cfg` rather than from `RAAKCHYAS`
 * directly, which is what makes that reuse a subclass and not a copy.
 * Behaviour that an ally must *not* share is behind `_canCommit`.
 */
export class Raakchyas extends Enemy {
  /** The block it is built from when a gate does not hand it another. */
  static stats = RAAKCHYAS;

  constructor(level, ctx, x, y, cfg = RAAKCHYAS, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildRaakchyas(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.pounceCd = rand(0.4, 1.2);
    this.phase = 0; // pounce sub-phase timer
    this.homeX = x;
    this.legPhase = rand(0, 6);
    /** A raakchyas's body is claimable. Bhoot-battis and the Guardian leave nothing. */
    this.leavesCorpse = true;
  }

  /**
   * Whether it may commit to a pounce at all.
   *
   * Always, for a raakchyas. The chaya overrides it: an ally trailing the
   * hunter is running this same chase state with the hunter as its target, and
   * without this gate it would pounce them.
   */
  _canCommit() {
    return true;
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0 && this.state === 'hurt') this.state = 'idle';
    }

    switch (this.state) {
      case 'idle':
      case 'chase': {
        this.pounceCd -= dt;
        if (!canSee) {
          this.state = 'idle';
          this.vx = damp(this.vx, 0, 0.001, dt);
          break;
        }
        this.state = 'chase';
        this.faceToward(player.x);

        if (this._canCommit() && dist < this.cfg.pounce.range && this.pounceCd <= 0 && this.grounded) {
          this.state = 'windup';
          this.phase = this.cfg.pounce.windup;
          this.vx = 0;
          this.ctx.audio?.play('growl');
          break;
        }
        // Walk in, but stop short: crowding the player's own hitbox is the
        // enemy's mistake to avoid, not the player's problem to solve. The
        // chaya uses the same rule to keep out from under the hunter's feet.
        const want = dist > this.cfg.stopAt ? this.facing * this.cfg.speed : 0;
        // Don't walk off a ledge chasing.
        const ahead = this.x + this.facing * 0.9;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'windup': {
        // Frozen, crouched, eyes bright. Reading this is the whole fight.
        this.phase -= dt;
        this.vx = 0;
        this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'pounce';
          this.phase = this.cfg.pounce.active;
          this.vx = this.facing * this.cfg.pounce.vx;
          this.vy = this.cfg.pounce.vy;
          this.grounded = false;
          this.ctx.audio?.play('pounce');
          this.ctx.vfx.dust(this.x, this.y, 6);
        }
        break;
      }

      case 'pounce': {
        this.phase -= dt;
        if (this.grounded && this.phase < this.cfg.pounce.active - 0.12) {
          this.state = 'recover';
          this.phase = this.cfg.pounce.recover;
          this.vx = 0;
          this.ctx.vfx.dust(this.x, this.y, 5);
        } else if (this.phase <= 0) {
          this.state = 'recover';
          this.phase = this.cfg.pounce.recover;
        }
        break;
      }

      case 'recover': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0005, dt);
        if (this.phase <= 0) {
          this.state = 'chase';
          this.pounceCd = rand(0.9, 1.9);
        }
        break;
      }

      case 'hurt':
        this.vx = damp(this.vx, 0, 0.06, dt);
        break;
    }

    // A launched enemy hangs. At full gravity a 13.0 launch is airborne for
    // 0.42 s — less than it takes to jump-cancel the launcher and reach it, so
    // the juggle the launcher exists to set up was not merely hard but
    // impossible. Landing cancels the hang so it cannot be stacked.
    if (this.juggleT > 0) this.juggleT = this.grounded ? 0 : this.juggleT - dt;
    this.applyGravity(dt, PHYS.gravity * (this.juggleT > 0 ? JUGGLE.gravityMul : 1));
    this.moveAndCollide(dt);
    this._animate(dt);
    this.syncRig();
  }

  /** The pounce hitbox — live only while airborne on the leap. */
  attackBox() {
    if (this.state !== 'pounce' || this.dead) return null;
    return {
      x0: this.x - 0.62,
      x1: this.x + 0.62,
      y0: this.y,
      y1: this.y + 1.1,
    };
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    let bodyZ = 0;
    let bodyY = 0;
    let jaw = 0;
    let legSwing = 0;
    let neck = 0;

    if (this.state === 'windup') {
      const u = 1 - this.phase / this.cfg.pounce.windup;
      bodyY = -0.16 - u * 0.06;
      bodyZ = 0.16;
      neck = -0.3;
      jaw = -0.5 * u;
      // Eyes flare through the wind-up: the tell.
      const g = 0.3 + u * 0.7;
      n.eyeL.material.opacity = g;
      n.eyeR.material.opacity = g;
      n.eyeL.material.transparent = true;
      n.eyeR.material.transparent = true;
      n.eyeL.scale.setScalar(1 + u * 0.6);
      n.eyeR.scale.setScalar(1 + u * 0.6);
    } else {
      n.eyeL.scale.setScalar(damp(n.eyeL.scale.x, 1, 0.001, dt));
      n.eyeR.scale.setScalar(n.eyeL.scale.x);
      n.eyeL.material.opacity = 1;
      n.eyeR.material.opacity = 1;
    }

    if (this.state === 'pounce') {
      bodyZ = -0.35;
      jaw = -0.7;
      neck = 0.2;
      legSwing = -0.7;
    } else if (this.state === 'hurt') {
      bodyZ = 0.3;
      jaw = -0.3;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.4) {
      this.legPhase += dt * (7 + Math.abs(this.vx));
      legSwing = Math.sin(this.legPhase) * 0.75;
      bodyY = Math.abs(Math.cos(this.legPhase)) * 0.05;
      bodyZ = -0.06;
    } else {
      // Idle breathing.
      bodyY = Math.sin(this.t * 2.4) * 0.03;
      neck = Math.sin(this.t * 0.9) * 0.12;
    }

    n.body.rotation.z = lerp(n.body.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, 0.62 + bodyY, k);
    n.neck.rotation.z = lerp(n.neck.rotation.z, neck, k);
    n.jaw.rotation.z = lerp(n.jaw.rotation.z, jaw, k);
    n.tail.rotation.z = Math.sin(this.t * 3.1) * 0.25 + 0.15;
    n.tail.rotation.y = Math.sin(this.t * 2.2) * 0.35;

    for (let i = 0; i < 4; i++) {
      const leg = n['leg' + i];
      const sign = i < 2 ? 1 : -1;
      const off = (i % 2) * Math.PI;
      leg.rotation.z = lerp(leg.rotation.z, Math.sin(this.legPhase + off) * 0.75 * sign + legSwing * sign, k);
    }
  }
}

// ---------------------------------------------------------------------------
// Charger
// ---------------------------------------------------------------------------

/**
 * The enemy that punishes standing still.
 *
 * It plants, it announces, it commits to a lane, and it is rooted afterwards
 * for long enough that reading the tell is not merely safe but *profitable* —
 * the recovery is the window the hunter kills it in. That triangle is the whole
 * archetype, and it is the crossing's lesson in movement before the hells ask
 * for it.
 *
 * Three things it shares with the raakchyas rather than reinventing:
 *
 * The eye flare, because the hunter has already learned that eyes going bright
 * means something is about to commit, and a second visual language for the same
 * idea is a second thing to learn for no gain.
 *
 * `chargeHitSet`, which is the Guardian's convention read by `Game`'s combat
 * pass — one victim per charge, so running through the hunter costs one hit and
 * not one per frame.
 *
 * `leavesCorpse`, because PUKAR's promise cannot be selectively true.
 *
 * And the rule everything in this file obeys: no contact damage. Standing in
 * front of a charger is safe. Standing in front of a charge is not.
 */
export class Charger extends Enemy {
  static stats = CHARGER;

  /**
   * `buildRig` lets a subclass reuse this whole chase → telegraph → charge →
   * recover skeleton under a genuinely new silhouette (see `Taraka` below)
   * without a throwaway `buildCharger` rig getting built and discarded first
   * — the constructor asks for the model it actually wants, once.
   */
  constructor(level, ctx, x, y, cfg = CHARGER, skin = null, buildRig = buildCharger) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildRig(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.phase = 0;
    this.cooldown = rand(cfg.cooldown[0], cfg.cooldown[1]);
    this.legPhase = rand(0, 6);
    /** One victim per charge — the convention `Game._resolveCombat` reads. */
    this.chargeHitSet = new Set();
    this.leavesCorpse = true;
    /** Charges left in the current commitment. See `charge.chain`. */
    this.chargesLeft = 0;
  }

  /**
   * Whether it may commit to a charge at all. Always, for a hostile charger.
   * Mirrors `Raakchyas._canCommit` — the chaya overrides it so an ally trailing
   * the hunter never plants a lane at them.
   */
  _canCommit() {
    return true;
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const C = this.cfg.charge;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const dy = Math.abs(player.y - this.y);
    const canSee = dist < this.cfg.chaseRange && dy < 6;
    // A charge runs along the floor, so a hunter standing on something else is
    // not in the lane and is not what it commits at.
    const inLane = dy < this.cfg.laneHeight;

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0 && this.state === 'hurt') this.state = 'idle';
    }

    switch (this.state) {
      case 'idle':
      case 'chase': {
        this.cooldown -= dt;
        if (!canSee) {
          this.state = 'idle';
          this.vx = damp(this.vx, 0, 0.001, dt);
          break;
        }
        this.state = 'chase';
        this.faceToward(player.x);

        if (
          this._canCommit() &&
          this.cooldown <= 0 &&
          this.grounded &&
          inLane &&
          dist > C.minRange &&
          dist < C.range
        ) {
          this.state = 'telegraph';
          this.phase = C.windup;
          this.vx = 0;
          // `charge.chain` — the Kevat's signature. Charges left after this
          // one commits, so a fresh commitment (not a chained continuation)
          // is what resets the count.
          this.chargesLeft = (C.chain || 1) - 1;
          this.ctx.audio?.play('growl');
          break;
        }

        // Crowded, it backs off; far out, it closes. Both are in service of the
        // same thing: a charger with no room to run has nothing to threaten
        // with, and one that simply walked into the hunter and stopped would be
        // an enemy you beat by standing next to it — which is exactly the habit
        // this archetype exists to break.
        const want =
          dist < C.minRange ? -Math.sign(dx) * this.cfg.speed
          : dist > C.range - 1.5 ? Math.sign(dx) * this.cfg.speed
          : 0;
        // Don't back off a ledge, and don't walk off one either.
        const ahead = this.x + Math.sign(want) * 0.9;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'telegraph': {
        // Planted, head down, eyes bright. It tracks early and commits late —
        // a wind-up that turned with the hunter all the way through would be an
        // attack you cannot leave, which is the opposite of a tell.
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > C.windup * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'charging';
          this.phase = C.dur;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('pounce');
          this.ctx.vfx.dust(this.x, this.y, 7);
        }
        break;
      }

      case 'charging': {
        this.phase -= dt;
        this.vx = this.facing * C.speed;
        this.applyGravity(dt, PHYS.gravity);
        const hit = this.moveAndCollide(dt);
        // It stops at a ledge rather than running off one. A charger that
        // drowns itself in the crossing is a fight the hunter never has, and
        // the encounter it is introduced in would seal shut behind it.
        const ledge = !this.level.hasFloorAhead(this.x + this.facing * 1.0, this.y);
        if (this.phase <= 0 || hit.wall || ledge) {
          this.vx = 0;
          this.ctx.vfx.dust(this.x, this.y, 6);
          if (hit.wall) {
            this.ctx.shake?.(C.shake);
            this.ctx.vfx.groundBurst(this.x + this.facing * 0.8, this.y, 1.0);
            this.ctx.audio?.play('slam');
          }
          // The chain: run the same telegraph again rather than recovering,
          // for as many charges as `charge.chain` grants. Not off a ledge —
          // there is nothing to cross into.
          if (this.chargesLeft > 0 && !ledge) {
            this.chargesLeft--;
            this.state = 'telegraph';
            this.phase = C.windup;
            this.ctx.audio?.play('growl');
          } else {
            this.state = 'recover';
            this.phase = C.recover + (hit.wall ? C.wallRecover : 0);
          }
        }
        this._animate(dt);
        this.syncRig();
        return;
      }

      case 'recover': {
        // The punish window, and the reason the tell is worth reading.
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0005, dt);
        if (this.phase <= 0) {
          this.state = 'chase';
          this.cooldown = rand(this.cfg.cooldown[0], this.cfg.cooldown[1]);
        }
        break;
      }

      case 'hurt':
        this.vx = damp(this.vx, 0, 0.06, dt);
        break;
    }

    if (this.juggleT > 0) this.juggleT = this.grounded ? 0 : this.juggleT - dt;
    this.applyGravity(dt, PHYS.gravity * (this.juggleT > 0 ? JUGGLE.gravityMul : 1));
    this.moveAndCollide(dt);
    this._animate(dt);
    this.syncRig();
  }

  /** Live only while it is actually running. Standing next to one is safe. */
  attackBox() {
    if (this.state !== 'charging' || this.dead) return null;
    return {
      x0: this.x - this.hw - 0.25,
      x1: this.x + this.hw + 0.25,
      y0: this.y,
      y1: this.y + this.hh * 2,
    };
  }

  /**
   * What that box is worth. `Game.attackDamage` falls back to a pounce block
   * for anything that does not answer, and a charger has no pounce — so this is
   * not optional decoration, it is the only reason its charge does damage.
   */
  currentAttackDamage() {
    if (this.state !== 'charging' || this.dead) return null;
    return { damage: this.cfg.charge.damage, knock: this.cfg.charge.knock };
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const C = this.cfg.charge;
    let bodyZ = 0;
    let bodyY = 0;
    let neck = 0;
    let legSwing = 0;

    if (this.state === 'telegraph') {
      // Rocked back onto the hind legs, head dropped, horns levelled.
      const u = 1 - this.phase / C.windup;
      bodyZ = -0.10 - u * 0.10;
      bodyY = -0.05 - u * 0.05;
      neck = 0.30 + u * 0.18;
      const g = 0.3 + u * 0.7;
      n.eyeL.material.opacity = g;
      n.eyeR.material.opacity = g;
      n.eyeL.material.transparent = true;
      n.eyeR.material.transparent = true;
      n.eyeL.scale.setScalar(1 + u * 0.7);
      n.eyeR.scale.setScalar(1 + u * 0.7);
      // Hooves scraping. The wind-up has an audible, visible floor to it.
      this.legPhase += dt * 16;
      legSwing = Math.sin(this.legPhase) * 0.35;
    } else {
      n.eyeL.scale.setScalar(damp(n.eyeL.scale.x, 1, 0.001, dt));
      n.eyeR.scale.setScalar(n.eyeL.scale.x);
      n.eyeL.material.opacity = 1;
      n.eyeR.material.opacity = 1;
    }

    if (this.state === 'charging') {
      bodyZ = 0.16;
      bodyY = -0.08;
      neck = 0.42;
      this.legPhase += dt * 26;
      legSwing = Math.sin(this.legPhase) * 0.9;
      if (Math.random() < 0.5) this.ctx.vfx.dust(this.x - this.facing * 0.5, this.y, 1);
    } else if (this.state === 'recover') {
      // Slumped and stalled, which is the read: it is safe to be here now.
      const u = clamp(this.phase / C.recover, 0, 1);
      bodyZ = 0.26 * u;
      bodyY = -0.14 * u;
      neck = 0.5 * u;
    } else if (this.state === 'hurt') {
      bodyZ = -0.24;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.3) {
      this.legPhase += dt * (5 + Math.abs(this.vx));
      legSwing = Math.sin(this.legPhase) * 0.5;
      bodyY = Math.abs(Math.cos(this.legPhase)) * 0.04;
    } else if (this.state !== 'telegraph') {
      bodyY = Math.sin(this.t * 1.8) * 0.03;
      neck = 0.08 + Math.sin(this.t * 0.7) * 0.08;
    }

    n.body.rotation.z = lerp(n.body.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, 0.68 + bodyY, k);
    n.neck.rotation.z = lerp(n.neck.rotation.z, neck, k);
    n.tail.rotation.z = Math.sin(this.t * 2.4) * 0.18 + 0.1;

    for (let i = 0; i < 4; i++) {
      const leg = n['leg' + i];
      const sign = i < 2 ? 1 : -1;
      const off = (i % 2) * Math.PI;
      leg.rotation.z = lerp(leg.rotation.z, Math.sin(this.legPhase + off) * 0.5 * sign + legSwing * sign, k);
    }
  }
}

// ---------------------------------------------------------------------------
// Kawach
// ---------------------------------------------------------------------------

/**
 * Naraka's armoured grunt.
 *
 * It does not chase and it does not run a lane — it walks in close and
 * plants for one heavy, telegraphed bash. The archetype's whole idea lives in
 * `takeHit` below rather than in this state machine, which is otherwise the
 * charger's shape with a shorter approach and a stationary attack in place of
 * a charge: chase → telegraph → attack → recover, `_canCommit()` for the
 * same ally-reuse symmetry the raakchyas and charger keep, `chargeHitSet` for
 * one victim per commit, `leavesCorpse = true` because PUKAR's promise cannot
 * be selectively true.
 */
export class Kawach extends Enemy {
  static stats = KAWACH;

  constructor(level, ctx, x, y, cfg = KAWACH, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildKawach(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.phase = 0;
    this.cooldown = rand(cfg.cooldown[0], cfg.cooldown[1]);
    /** One victim per commit — the same convention the charger and Guardian read. */
    this.chargeHitSet = new Set();
    this.leavesCorpse = true;
  }

  /** Always, for a hostile Kawach. Mirrors `Charger._canCommit`. */
  _canCommit() {
    return true;
  }

  /**
   * Armour absorbs anything except a hit that qualifies as `armorBreakLaunch`
   * or better — see `KAWACH.armorBreakLaunch` in `config.js` for why that
   * number is the launcher's own `launch` value and not a separate one. A
   * shrugged-off hit does not so much as flinch the state machine: no hurt
   * state, no stagger, chase or telegraph or attack keeps running exactly as
   * it was. A qualifying hit gets none of that protection — it is `Enemy`'s
   * ordinary reaction, unabridged, because armour that breaks halfway is not
   * armour breaking.
   */
  takeHit({ damage, knock = 0, launch = 0, fromX = 0 }) {
    if (this.dead) return false;
    if (launch < this.cfg.armorBreakLaunch) {
      this.hitFlash = 0.05; // a duller flash than a real hit — a shrug, not a stagger
      this.ctx.audio?.play('impact');
      return true;
    }
    return super.takeHit({ damage, knock, launch, fromX });
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const B = this.cfg.bash;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0 && this.state === 'hurt') this.state = 'idle';
    }

    switch (this.state) {
      case 'idle':
      case 'chase': {
        this.cooldown -= dt;
        if (!canSee) {
          this.state = 'idle';
          this.vx = damp(this.vx, 0, 0.001, dt);
          break;
        }
        this.state = 'chase';
        this.faceToward(player.x);

        if (this._canCommit() && this.cooldown <= 0 && this.grounded && dist < B.range) {
          this.state = 'telegraph';
          this.phase = B.windup;
          this.vx = 0;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('growl');
          break;
        }

        const want = dist > this.cfg.stopAt ? this.facing * this.cfg.speed : 0;
        const ahead = this.x + this.facing * 0.9;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'telegraph': {
        // Planted, shield raised, eyes bright — the shared "about to commit"
        // vocabulary every archetype in this file uses.
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > B.windup * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'attack';
          this.phase = B.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('pounce');
        }
        break;
      }

      case 'attack': {
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'recover';
          this.phase = B.recover;
        }
        break;
      }

      case 'recover': {
        // The punish window a planted swing owes the hunter for reading it.
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0005, dt);
        if (this.phase <= 0) {
          this.state = 'chase';
          this.cooldown = rand(this.cfg.cooldown[0], this.cfg.cooldown[1]);
        }
        break;
      }

      case 'hurt':
        this.vx = damp(this.vx, 0, 0.06, dt);
        break;
    }

    if (this.juggleT > 0) this.juggleT = this.grounded ? 0 : this.juggleT - dt;
    this.applyGravity(dt, PHYS.gravity * (this.juggleT > 0 ? JUGGLE.gravityMul : 1));
    this.moveAndCollide(dt);
    this._animate(dt);
    this.syncRig();
  }

  /** Live only during the bash's active window — standing next to it otherwise is safe. */
  attackBox() {
    if (this.state !== 'attack' || this.dead) return null;
    return {
      x0: this.x - this.hw - 0.3,
      x1: this.x + this.hw + 0.3,
      y0: this.y,
      y1: this.y + this.hh * 2,
    };
  }

  currentAttackDamage() {
    if (this.state !== 'attack' || this.dead) return null;
    return { damage: this.cfg.bash.damage, knock: this.cfg.bash.knock };
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const B = this.cfg.bash;
    let bodyZ = 0;
    let bodyY = 0;
    let headZ = 0;

    if (this.state === 'telegraph') {
      const u = 1 - this.phase / B.windup;
      bodyZ = -0.08 - u * 0.14;
      bodyY = -0.05 - u * 0.05;
      headZ = 0.12 + u * 0.16;
      const g = 0.3 + u * 0.7;
      n.eyeL.material.opacity = g;
      n.eyeR.material.opacity = g;
      n.eyeL.material.transparent = true;
      n.eyeR.material.transparent = true;
      n.eyeL.scale.setScalar(1 + u * 0.6);
      n.eyeR.scale.setScalar(1 + u * 0.6);
    } else {
      n.eyeL.scale.setScalar(damp(n.eyeL.scale.x, 1, 0.001, dt));
      n.eyeR.scale.setScalar(n.eyeL.scale.x);
      n.eyeL.material.opacity = 1;
      n.eyeR.material.opacity = 1;
    }

    if (this.state === 'attack') {
      const u = clamp(1 - this.phase / B.active, 0, 1);
      bodyZ = lerp(0.22, -0.12, u);
      headZ = lerp(-0.2, 0.1, u);
      bodyY = -0.08;
    } else if (this.state === 'recover') {
      const u = clamp(this.phase / B.recover, 0, 1);
      bodyZ = -0.1 * u;
      bodyY = -0.06 * u;
    } else if (this.state === 'hurt') {
      bodyZ = 0.2;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.3) {
      bodyY = Math.abs(Math.sin(this.t * 6)) * 0.03;
    } else if (this.state !== 'telegraph') {
      bodyY = Math.sin(this.t * 1.6) * 0.025;
    }

    n.body.rotation.z = lerp(n.body.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, 0.72 + bodyY, k);
    n.head.rotation.z = lerp(n.head.rotation.z, headZ, k);
  }
}

// ---------------------------------------------------------------------------
// Bhoot-Batti
// ---------------------------------------------------------------------------

export class BhootBatti extends Enemy {
  static stats = BHOOT_BATTI;

  constructor(level, ctx, x, y, cfg = BHOOT_BATTI, skin = null) {
    super(level, ctx, BHOOT_BATTI, { x, y, hw: BHOOT_BATTI.hw, hh: BHOOT_BATTI.hh, maxHp: BHOOT_BATTI.hp });
    this.root = buildBhootBatti(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.baseY = y;
    this.homeX = x;
    this.shootCd = rand(0.8, BHOOT_BATTI.shoot.interval);
    this.windup = 0;
    this.driftPhase = rand(0, 7);
  }

  /** Bhoot-battis float: they ignore gravity and the level entirely. */
  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0) this.state = 'idle';
    }

    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    this.faceToward(player.x);

    if (this.state !== 'hurt') {
      // Hold a ring at keepDistance: close in when far, back off when crowded.
      let want = dist > BHOOT_BATTI.keepDistance + 1.5 ? Math.sign(dx) * BHOOT_BATTI.speed
        : dist < BHOOT_BATTI.keepDistance - 1.5 ? -Math.sign(dx) * BHOOT_BATTI.speed
        : Math.sin(this.t * 0.8) * BHOOT_BATTI.speed * 0.4;
      // Leashed to where it spawned. Without this a bhoot-batti will happily
      // follow the player over the edge and hound them all the way down the
      // pit, which turns a missed jump into an unrecoverable one.
      if (this.x < this.homeX - BHOOT_BATTI.leash) want = Math.max(want, BHOOT_BATTI.speed * 0.6);
      if (this.x > this.homeX + BHOOT_BATTI.leash) want = Math.min(want, -BHOOT_BATTI.speed * 0.6);
      this.vx = damp(this.vx, want, 0.002, dt);

      // Same for altitude: it tracks the player but never descends into the
      // void after them.
      const hover = Math.sin(this.t * BHOOT_BATTI.hover.freq + this.driftPhase) * BHOOT_BATTI.hover.amp;
      const targetY = clamp(player.y + BHOOT_BATTI.hoverAbove + hover, this.baseY - BHOOT_BATTI.descend, this.baseY + 5);
      this.vy = damp(this.vy, (targetY - this.y) * 2.2, 0.004, dt);

      this.shootCd -= dt;
      if (this.shootCd <= 0 && dist < 16 && this.windup <= 0) {
        this.windup = BHOOT_BATTI.shoot.windup;
      }
      if (this.windup > 0) {
        this.windup -= dt;
        this.vx *= 0.3;
        if (this.windup <= 0) {
          const a = Math.atan2(player.y + 1 - this.y, player.x - this.x);
          this.ctx.spawnEnemyBolt(this.x, this.y, Math.cos(a), Math.sin(a));
          this.shootCd = BHOOT_BATTI.shoot.interval * rand(0.8, 1.25);
          this.ctx.audio?.play('wispShot');
        }
      }
    } else {
      this.vx = damp(this.vx, 0, 0.02, dt);
      this.vy = damp(this.vy, 0, 0.02, dt);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this._animate(dt);
    this.root.position.set(this.x, this.y + this.hh, 0);
  }

  attackBox() {
    return null; // bhoot-battis threaten only at range
  }

  _animate(dt) {
    const n = this.n;
    n.ring.rotation.y += dt * 1.5;
    n.ring.rotation.z = Math.sin(this.t * 0.9) * 0.3;
    const charging = this.windup > 0;
    const pulse = charging
      ? 1 + (1 - this.windup / BHOOT_BATTI.shoot.windup) * 0.9
      : 1 + Math.sin(this.t * 3) * 0.09;
    n.core.scale.setScalar(pulse);
    n.halo.scale.setScalar(1 + Math.sin(this.t * 2.2) * 0.12 + (charging ? 0.5 : 0));
    n.core.material.color.setHex(charging ? P.crimson : P.wispCore);
    n.halo.material.opacity = charging ? 0.55 : 0.3;
  }
}

// ---------------------------------------------------------------------------
// Tantrik
// ---------------------------------------------------------------------------

/**
 * Preta-lok's summoner.
 *
 * It does no damage of its own — `attackBox` always returns null — because
 * its entire threat is the queue of raakchyas it keeps raising. User story 13
 * asks that it be prioritised over what it summons, and the way that holds
 * without a rule the player has to be told is to give the archetype nothing
 * else to threaten with: ignoring it and fighting what it raises instead is
 * the losing play by construction, not by a note in a System window.
 *
 * `keepDistance` is `BHOOT_BATTI`'s ring-hold walked instead of flown — close
 * when far, back off when crowded — so melee only happens because the hunter
 * chose to close the distance, not because it ran out of somewhere to
 * retreat to. `children`/`maxLiving` bound the queue: a Tantrik left alone
 * does not summon forever, it summons until it has two live and then waits.
 *
 * **It does not leave a remnant.** User story 16 asks that every new
 * archetype does, and this is a deliberate, disclosed exception rather than
 * an oversight — the same one `BhootBatti` already is. A PUKAR ally raised
 * from a Tantrik's body would have to either cast its one move against the
 * hunter's own enemies by raising a *hostile* raakchyas next to its own
 * master, which `chayaOf` in `game/shadow.js` has no hook to redirect, or
 * raise an allied one, which needs PUKAR's one-ally-at-a-time slot widened
 * into a list — a bigger job than this gate's build order calls for. Left as
 * a gap to close deliberately rather than papered over with an ally that
 * fights nothing.
 */
export class Tantrik extends Enemy {
  static stats = TANTRIK;

  constructor(level, ctx, x, y, cfg = TANTRIK, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildTantrik(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.phase = 0;
    this.cooldown = rand(cfg.cooldown[0], cfg.cooldown[1]);
    // No `this.leavesCorpse = true` — see the class doc.
    /** Raakchyas this Tantrik has raised and not yet lost. */
    this.children = [];
  }

  get liveChildren() {
    this.children = this.children.filter((c) => !c.dead);
    return this.children.length;
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const S = this.cfg.summon;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0 && this.state === 'hurt') this.state = 'idle';
    }

    switch (this.state) {
      case 'idle':
      case 'chase': {
        this.cooldown -= dt;
        if (!canSee) {
          this.state = 'idle';
          this.vx = damp(this.vx, 0, 0.001, dt);
          break;
        }
        this.state = 'chase';
        this.faceToward(player.x);

        if (this.cooldown <= 0 && this.grounded && dist < S.range && this.liveChildren < this.cfg.maxLiving) {
          this.state = 'telegraph';
          this.phase = S.windup;
          this.vx = 0;
          this.ctx.audio?.play('growl');
          break;
        }

        // Ring-hold: close in when far, back off when crowded — the ground
        // version of what BhootBatti does at range.
        const want =
          dist < this.cfg.keepDistance - 1.5 ? -Math.sign(dx) * this.cfg.speed
          : dist > this.cfg.keepDistance + 1.5 ? Math.sign(dx) * this.cfg.speed
          : 0;
        const ahead = this.x + Math.sign(want) * 0.9;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'telegraph': {
        // Planted, hands raised, eyes bright and the sigil climbing — the
        // shared "about to commit" vocabulary every archetype in this file
        // uses, read off a cast instead of a swing.
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > S.windup * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'casting';
          this.phase = S.active;
          this._raise();
        }
        break;
      }

      case 'casting': {
        this.phase -= dt;
        this.vx = 0;
        if (this.phase <= 0) {
          this.state = 'recover';
          this.phase = S.recover;
        }
        break;
      }

      case 'recover': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0005, dt);
        if (this.phase <= 0) {
          this.state = 'chase';
          this.cooldown = rand(this.cfg.cooldown[0], this.cfg.cooldown[1]);
        }
        break;
      }

      case 'hurt':
        this.vx = damp(this.vx, 0, 0.06, dt);
        break;
    }

    if (this.juggleT > 0) this.juggleT = this.grounded ? 0 : this.juggleT - dt;
    this.applyGravity(dt, PHYS.gravity * (this.juggleT > 0 ? JUGGLE.gravityMul : 1));
    this.moveAndCollide(dt);
    this._animate(dt);
    this.syncRig();
  }

  /**
   * Raises `summon.burst` raakchyas near itself — 1 for a Tantrik, 2 for
   * Atripta, whose one added move this is. Spawned through `ctx.spawnMinion`
   * rather than through the gate's own pending-spawn queue, because these
   * bodies do not exist until the cast lands; `encounter` is carried over so
   * the seal they were raised inside still waits on them.
   */
  _raise() {
    const S = this.cfg.summon;
    const burst = S.burst || 1;
    for (let i = 0; i < burst; i++) {
      const x = this.x + this.facing * (1.6 + i * 1.1);
      if (!this.level.hasFloorAhead(x, this.y)) continue;
      const y = this.level.groundAt(x) + 0.1;
      const raised = this.ctx.spawnMinion('raakchyas', x, y, this.encounter);
      if (raised) this.children.push(raised);
    }
    this.ctx.vfx.shadowBurst(this.x + this.facing * 1.2, this.y + 0.4, 18, P.violetDeep);
    this.ctx.audio?.play('systemOpen');
  }

  /** Never a live source of damage. Its threat is entirely what it raises. */
  attackBox() {
    return null;
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const S = this.cfg.summon;
    let bodyZ = 0;
    let bodyY = 0;
    let headZ = 0;
    let shLz = -0.2;
    let shRz = -0.2;

    if (this.state === 'telegraph') {
      const u = 1 - this.phase / S.windup;
      bodyZ = -0.05 - u * 0.05;
      headZ = -0.1 - u * 0.15;
      shLz = -0.3 - u * 1.6;
      shRz = -0.3 - u * 1.6;
      const g = 0.3 + u * 0.7;
      n.eyeL.material.opacity = g;
      n.eyeR.material.opacity = g;
      n.eyeL.material.transparent = true;
      n.eyeR.material.transparent = true;
      n.core.scale.setScalar(1 + u * 1.2);
      n.coreGlow.material.opacity = 0.2 + u * 0.6;
    } else if (this.state === 'casting') {
      const u = clamp(1 - this.phase / S.active, 0, 1);
      shLz = -1.9;
      shRz = -1.9;
      headZ = -0.25;
      n.core.scale.setScalar(lerp(2.2, 0.8, u));
      n.coreGlow.material.opacity = lerp(0.8, 0.2, u);
    } else {
      n.eyeL.material.opacity = 0.8;
      n.eyeR.material.opacity = 0.8;
      n.eyeL.material.transparent = true;
      n.eyeR.material.transparent = true;
      n.core.scale.setScalar(1 + Math.sin(this.t * 2) * 0.08);
      n.coreGlow.material.opacity = 0.25 + Math.sin(this.t * 2) * 0.05;
    }

    if (this.state === 'recover') {
      bodyZ = 0.12 * clamp(this.phase / S.recover, 0, 1);
    } else if (this.state === 'hurt') {
      bodyZ = 0.22;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.3) {
      bodyY = Math.abs(Math.sin(this.t * 5)) * 0.03;
    } else if (this.state !== 'telegraph' && this.state !== 'casting') {
      bodyY = Math.sin(this.t * 1.4) * 0.03;
      headZ = Math.sin(this.t * 0.8) * 0.08;
    }

    n.body.rotation.z = lerp(n.body.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, 0.64 + bodyY, k);
    n.head.rotation.z = lerp(n.head.rotation.z, headZ, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, shLz, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, shRz, k);
  }
}

// ---------------------------------------------------------------------------
// Shakuni — gate 1's Warden (Sabha Parva)
// ---------------------------------------------------------------------------

/**
 * A courtier, not a warrior — see `docs/research/villain-roster.md`'s
 * handoff (`dfed2a1`). Grounded keep-distance, walked rather than flown
 * (`BhootBatti`'s ring-hold arithmetic, adapted to `moveAndCollide` instead
 * of free flight — see `_pace` below), and a ranged/summoned-hazard kit: a
 * die cast at the player's own position, shown during a windup, resolving
 * into a zone the hunter has to have already left.
 *
 * The die's *visual* landing point is drawn directly in world space by
 * `vfx.shockRing`, not carried by a prop parented under this rig — see the
 * note on `buildShakuni` for why a child of a yaw-tilted root cannot mark a
 * distant world point honestly. `this.dieX/dieY` are Shakuni's own source of
 * truth for where the zone is; `ctx.shockwaveFromBoss` (despite its name, a
 * plain ctx-level point-radius hit against the player/chaya — see its
 * definition in `game.js`) reads those same numbers at resolve.
 */
export class Shakuni extends Enemy {
  static stats = SHAKUNI;

  constructor(level, ctx, x, y, cfg = SHAKUNI) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildShakuni();
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.state = 'chase';
    this.cooldown = rand(cfg.interval * 0.4, cfg.interval);
    this.phase = 0;
    this.enraged = false;
    this.pulseCd = 0;
    this.dieX = x;
    this.dieY = y;
    this.dieRadius = cfg.die.radiusRange[0];
    this.leavesCorpse = true;
  }

  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.enraged && this.hp <= this.maxHp * this.cfg.enrageAt) this._enrage();
    return landed;
  }

  _enrage() {
    this.enraged = true;
    this.ctx.onEnrage?.();
    this.ctx.audio?.play('enrage');
  }

  /** Never a melee threat — every hit he deals lands through `shockwaveFromBoss` at resolve. */
  attackBox() {
    return null;
  }

  _pace(dt, player, canSee) {
    const D = this.cfg;
    if (!canSee) {
      this.vx = damp(this.vx, 0, 0.001, dt);
      return;
    }
    this.faceToward(player.x);
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    let want = 0;
    if (dist > D.keepDistance + 1.5) want = Math.sign(dx) * D.speed;
    else if (dist < D.keepDistance - 1.5) want = -Math.sign(dx) * D.speed;
    const ahead = this.x + Math.sign(want || 1) * 0.9;
    if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) want = 0;
    this.vx = damp(this.vx, want, 0.001, dt);
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const D = this.cfg.die;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0 && this.state === 'hurt') this.state = 'chase';
    }

    switch (this.state) {
      case 'chase':
        this._pace(dt, player, canSee);
        this.cooldown -= dt;
        if (canSee && this.cooldown <= 0) {
          // Held past keep-distance, the die's own ground zone is a puzzle
          // with no stakes — moving out of a radius he telegraphed a full
          // second ago is free. The fan of cards is what makes range itself
          // the threat, so it is the move he favours once the hunter is
          // actually holding it; up close either read is live.
          const preferCards = dist > this.cfg.keepDistance + 1.5;
          if (preferCards || Math.random() < 0.5) {
            this.state = 'cardCast';
            this.phase = this.cfg.cards.cast;
          } else {
            this.state = 'cast';
            this.phase = D.cast;
          }
          this.ctx.audio?.play('growl');
        }
        break;

      case 'cast':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.faceToward(player.x);
        this.phase -= dt;
        if (this.phase <= 0) {
          // Read at the moment the die leaves his hand, not a frame later —
          // the target is where the hunter chose to stand, not a predicted
          // lead the way `Guardian._slamLand` aims its own leap.
          this.dieX = player.x;
          this.dieY = this.level.groundAt(this.dieX) + 0.05;
          const face = 1 + Math.floor(rand(0, 6));
          this.dieRadius = lerp(D.radiusRange[0], D.radiusRange[1], (face - 1) / 5);
          this.state = 'windup';
          this.phase = D.windup * (this.enraged ? this.cfg.enrageWindupMul : 1);
          this.pulseCd = 0;
          this.ctx.audio?.play('wispShot');
        }
        break;

      case 'windup':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.phase -= dt;
        this.pulseCd -= dt;
        if (this.pulseCd <= 0) {
          this.ctx.vfx.shockRing(this.dieX, this.dieY, this.dieRadius, P.crimson);
          this.pulseCd = 0.18;
        }
        if (this.phase <= 0) {
          this.state = 'recover';
          this.phase = 0.4;
          this.ctx.shockwaveFromBoss(this.dieX, this.dieY, {
            radius: this.dieRadius,
            damage: D.damage,
            knock: D.knock,
          });
          this.ctx.vfx.groundBurst(this.dieX, this.dieY, this.dieRadius * 0.6);
          this.ctx.vfx.shockRing(this.dieX, this.dieY, this.dieRadius, P.crimson);
          this.ctx.shake?.(0.16);
          this.ctx.audio?.play('slam');
        }
        break;

      case 'cardCast':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.faceToward(player.x);
        this.phase -= dt;
        if (this.phase <= 0) {
          this._throwCards(player);
          this.state = 'recover';
          this.phase = this.cfg.cards.recover;
        }
        break;

      case 'recover':
        this.vx = damp(this.vx, 0, 0.001, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'chase';
          this.cooldown = this.cfg.interval * (this.enraged ? this.cfg.enrageIntervalMul : 1);
        }
        break;

      case 'hurt':
        this.vx = damp(this.vx, 0, 0.06, dt);
        break;
    }

    this.applyGravity(dt, PHYS.gravity);
    this.moveAndCollide(dt);
    this._animate(dt);
    this.syncRig();
  }

  /**
   * Ten cards released at once across `cards.spread` radians, centred on the
   * player — a wall at close range (the fan's own spread barely separates
   * adjacent cards) that opens into gaps only at real distance, so standing
   * off past `keepDistance` is no longer the free read the die alone left.
   * `spawnEnemyBolt` is the same seam the Guardian's own `volley` fires
   * through in `boss.js`; each card is a full `Bolt` with its own hitbox, so
   * a hunter caught in the fan can take more than one, on purpose.
   */
  _throwCards(player) {
    const C = this.cfg.cards;
    const originX = this.x + Math.sign(player.x - this.x || this.facing || 1) * 0.35;
    const originY = this.y + 0.95;
    const base = Math.atan2(player.y + 0.9 - originY, player.x - originX);
    const half = C.spread / 2;
    for (let i = 0; i < C.count; i++) {
      const t = C.count === 1 ? 0.5 : i / (C.count - 1);
      const a = base - half + t * C.spread;
      this.ctx.spawnEnemyBolt(originX, originY, Math.cos(a), Math.sin(a), {
        speed: C.speed,
        damage: C.damage,
        life: C.life,
        color: P.crimson,
      });
    }
    this.ctx.vfx.shockRing(originX, originY, 0.6, P.crimson);
    this.ctx.audio?.play('wispShot');
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    let bodyZ = 0;
    let armZ = 0;

    if (this.state === 'cast' || this.state === 'windup' || this.state === 'cardCast') {
      const D = this.cfg.die;
      const total =
        this.state === 'cast' ? D.cast
        : this.state === 'cardCast' ? this.cfg.cards.cast
        : D.windup * (this.enraged ? this.cfg.enrageWindupMul : 1);
      const u = clamp(1 - this.phase / total, 0, 1);
      bodyZ = -0.05 - u * 0.08;
      armZ = -0.3 - u * 0.5;
    } else if (this.state === 'hurt') {
      bodyZ = 0.16;
    } else if (Math.abs(this.vx) > 0.3) {
      bodyZ = Math.sin(this.t * 5) * 0.03;
    }

    n.robe.rotation.z = lerp(n.robe.rotation.z, bodyZ, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
  }
}

// ---------------------------------------------------------------------------
// Bakasura
// ---------------------------------------------------------------------------

/**
 * Gate 2's Warden — a glutton-demon beaten bare-handed in the source, so its
 * kit is a grapple rather than a weapon. Follows `Kawach`'s chase →
 * telegraph → attack → recover skeleton (see that class's own header),
 * departing only where the handoff calls for it: two committed moves picked
 * by range instead of one, and an asymmetric attack box on the close one.
 */
export class Bakasura extends Enemy {
  static stats = BAKASURA;

  constructor(level, ctx, x, y, cfg = BAKASURA, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildBakasura(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.phase = 0;
    this.cooldown = rand(cfg.cooldown[0], cfg.cooldown[1]);
    this.chargeHitSet = new Set();
    this.leavesCorpse = true;
    this.enraged = false;
  }

  /** Always, for a hostile Bakasura. Mirrors `Charger._canCommit`. */
  _canCommit() {
    return true;
  }

  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.enraged && this.hp <= this.maxHp * this.cfg.enrageAt) this._enrage();
    return landed;
  }

  /**
   * No rig-swap, no reveal — per the handoff, escalation (if any) is the two
   * windups tightening via `enrageWindupMul`, the same locally-implemented
   * call `Shakuni._enrage` makes for its own tier-2 kit.
   */
  _enrage() {
    this.enraged = true;
    this.ctx.onEnrage?.();
    this.ctx.audio?.play('enrage');
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const G = this.cfg.grab;
    const T = this.cfg.tackle;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;
    const windupMul = this.enraged ? this.cfg.enrageWindupMul : 1;

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0 && this.state === 'hurt') this.state = 'idle';
    }

    switch (this.state) {
      case 'idle':
      case 'chase': {
        this.cooldown -= dt;
        if (!canSee) {
          this.state = 'idle';
          this.vx = damp(this.vx, 0, 0.001, dt);
          break;
        }
        this.state = 'chase';
        this.faceToward(player.x);

        // The grab takes the close band; the tackle takes the wider one just
        // past it, so a hunter holding station at "just outside grab range"
        // while it closes is not a fight it cannot lose — the handoff's own
        // "either he's in grab range or he's not" note.
        if (this._canCommit() && this.cooldown <= 0 && this.grounded) {
          if (dist < G.range) {
            this.state = 'grabTelegraph';
            this.phase = G.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          } else if (dist < T.range) {
            this.state = 'tackleTelegraph';
            this.phase = T.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          }
        }

        const want = dist > this.cfg.stopAt ? this.facing * this.cfg.speed : 0;
        const ahead = this.x + Math.sign(want || this.facing) * 0.9;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'grabTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > G.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'grabAttack';
          this.phase = G.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('pounce');
        }
        break;
      }

      case 'grabAttack': {
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'recover';
          this.phase = G.recover;
        }
        break;
      }

      case 'tackleTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > T.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'tackling';
          this.phase = T.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('pounce');
          this.ctx.vfx.dust(this.x, this.y, 6);
        }
        break;
      }

      case 'tackling': {
        this.phase -= dt;
        this.vx = this.facing * T.speed;
        this.applyGravity(dt, PHYS.gravity);
        const hit = this.moveAndCollide(dt);
        // Stops at a ledge rather than running off one — same rule
        // `Charger`'s own charge holds, for the same reason.
        const ledge = !this.level.hasFloorAhead(this.x + this.facing * 1.0, this.y);
        if (this.phase <= 0 || hit.wall || ledge) {
          this.vx = 0;
          this.ctx.vfx.dust(this.x, this.y, 5);
          if (hit.wall) {
            this.ctx.shake?.(0.16);
            this.ctx.audio?.play('slam');
          }
          this.state = 'recover';
          this.phase = T.recover + (hit.wall ? T.wallRecover : 0);
        }
        this._animate(dt);
        this.syncRig();
        return;
      }

      case 'recover': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0005, dt);
        if (this.phase <= 0) {
          this.state = 'chase';
          this.cooldown = rand(this.cfg.cooldown[0], this.cfg.cooldown[1]);
        }
        break;
      }

      case 'hurt':
        this.vx = damp(this.vx, 0, 0.06, dt);
        break;
    }

    if (this.juggleT > 0) this.juggleT = this.grounded ? 0 : this.juggleT - dt;
    this.applyGravity(dt, PHYS.gravity * (this.juggleT > 0 ? JUGGLE.gravityMul : 1));
    this.moveAndCollide(dt);
    this._animate(dt);
    this.syncRig();
  }

  /**
   * The grab's box is asymmetric — `grab.reach` forward, `grab.reachBack`
   * behind, since a grab lunges forward and not sideways. The tackle's is
   * the ordinary straddling box a moving body already uses, the same shape
   * `Charger.attackBox` returns for its own charge.
   */
  attackBox() {
    if (this.dead) return null;
    if (this.state === 'grabAttack') {
      const G = this.cfg.grab;
      return this.facing >= 0
        ? { x0: this.x - G.reachBack, x1: this.x + G.reach, y0: this.y, y1: this.y + this.hh * 2 }
        : { x0: this.x - G.reach, x1: this.x + G.reachBack, y0: this.y, y1: this.y + this.hh * 2 };
    }
    if (this.state === 'tackling') {
      return { x0: this.x - this.hw - 0.25, x1: this.x + this.hw + 0.25, y0: this.y, y1: this.y + this.hh * 2 };
    }
    return null;
  }

  currentAttackDamage() {
    if (this.state === 'grabAttack') return { damage: this.cfg.grab.damage, knock: this.cfg.grab.knock };
    if (this.state === 'tackling') return { damage: this.cfg.tackle.damage, knock: this.cfg.tackle.knock };
    return null;
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const G = this.cfg.grab;
    const T = this.cfg.tackle;
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    let glow = 0;

    if (this.state === 'grabTelegraph') {
      const u = 1 - this.phase / (G.windup * (this.enraged ? this.cfg.enrageWindupMul : 1));
      bodyZ = -0.1 - u * 0.16;
      bodyY = -0.06 - u * 0.06;
      armZ = 0.2 + u * 0.5;
      glow = 0.3 + u * 0.7;
    } else if (this.state === 'grabAttack') {
      const u = clamp(1 - this.phase / G.active, 0, 1);
      bodyZ = lerp(0.24, -0.1, u);
      armZ = lerp(-0.7, 0.35, u);
      bodyY = -0.08;
      glow = 1;
    } else if (this.state === 'tackleTelegraph') {
      const u = 1 - this.phase / (T.windup * (this.enraged ? this.cfg.enrageWindupMul : 1));
      bodyZ = -0.08 - u * 0.14;
      bodyY = -0.05 - u * 0.05;
    } else if (this.state === 'tackling') {
      bodyZ = 0.14;
      bodyY = -0.06;
    } else if (this.state === 'recover') {
      const total = Math.max(G.recover, T.recover);
      const u = clamp(this.phase / total, 0, 1);
      bodyZ = -0.1 * u;
      bodyY = -0.06 * u;
    } else if (this.state === 'hurt') {
      bodyZ = 0.18;
    } else if (Math.abs(this.vx) > 0.3) {
      bodyY = Math.abs(Math.sin(this.t * 5)) * 0.04;
    } else {
      bodyY = Math.sin(this.t * 1.4) * 0.03;
    }

    n.belly.rotation.z = lerp(n.belly.rotation.z, bodyZ, k);
    n.belly.position.y = lerp(n.belly.position.y, bodyY, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, -armZ, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);

    for (const key of ['L', 'R']) {
      const g = n['handGlow' + key];
      g.material.opacity = lerp(g.material.opacity, 0.35 + glow * 0.65, k);
    }
  }
}

// ---------------------------------------------------------------------------
// Taraka
// ---------------------------------------------------------------------------

/**
 * Gate 4's Warden — a curse victim whose whole threat is "lightning speed"
 * made literal. Extends `Charger` directly rather than copying its own
 * chase → telegraph → charge → recover skeleton: a claw-pounce is that
 * shape already, reskinned as a swipe hitbox instead of a body check, per
 * the handoff's own kit-shape call. `_animate` is the one thing this class
 * has to override in full — the base `Charger._animate` drives a
 * quadruped's neck/tail/four legs, and `buildTaraka`'s rig is a biped.
 */
export class Taraka extends Charger {
  static stats = TARAKA;

  constructor(level, ctx, x, y, cfg = TARAKA, skin = null) {
    super(level, ctx, x, y, cfg, skin, buildTaraka);
    this.forms = this.root.userData.forms;
    this.form = 'beautiful';
    this.n = this.forms.beautiful.nodes;
    /** Fires once, at the HP threshold — see `takeHit` below. */
    this.phaseFired = false;
  }

  /**
   * The curse-reveal: an HP threshold rather than the ordinary generic
   * enrage warning `Shakuni`/`Bakasura` fire, because this one is staged as
   * a held story beat (`Game.firePhaseBeat`) that pauses the fight for a
   * writhe/contort animation and a pained sound cue, not a toast. Kit and
   * hitbox never change here — only `this.form`/`this.n` do, once the beat
   * drains.
   */
  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.phaseFired && this.hp <= this.maxHp * this.cfg.phaseAt) {
      this.phaseFired = true;
      this.ctx.firePhaseBeat?.(() => this._curseReveal());
    }
    return landed;
  }

  /** Swaps the visible rig and the node table `_animate`/`syncRig` read. */
  _curseReveal() {
    this.form = 'monstrous';
    this.forms.beautiful.root.visible = false;
    this.forms.monstrous.root.visible = true;
    this.n = this.forms.monstrous.nodes;
    this.ctx.audio?.play('curseTransform');
    this.syncRig();
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const C = this.cfg.charge;
    const windupMul = this.phaseFired ? this.cfg.phaseWindupMul : 1;
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    let glow = 0;
    let legSwing = 0;

    if (this.state === 'telegraph') {
      // Crouched low onto the claws, not reared back — a pounce reads as a
      // gather, not a rock-back, the same distinction `Bakasura`'s grab
      // windup draws against `Charger`'s own.
      const u = 1 - this.phase / (C.windup * windupMul);
      bodyZ = -0.14 - u * 0.16;
      bodyY = -0.1 - u * 0.08;
      armZ = 0.15 + u * 0.55;
      glow = 0.3 + u * 0.7;
      this.legPhase += dt * 14;
      legSwing = Math.sin(this.legPhase) * 0.3;
    } else if (this.state === 'charging') {
      bodyZ = 0.2;
      bodyY = -0.1;
      armZ = -0.5;
      glow = 1;
      this.legPhase += dt * 30;
      legSwing = Math.sin(this.legPhase) * 0.9;
      if (Math.random() < 0.5) this.ctx.vfx.dust(this.x - this.facing * 0.5, this.y, 1);
    } else if (this.state === 'recover') {
      const u = clamp(this.phase / C.recover, 0, 1);
      bodyZ = 0.2 * u;
      bodyY = -0.12 * u;
    } else if (this.state === 'hurt') {
      bodyZ = -0.22;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.3) {
      this.legPhase += dt * (7 + Math.abs(this.vx));
      legSwing = Math.sin(this.legPhase) * 0.55;
      bodyY = Math.abs(Math.cos(this.legPhase)) * 0.05;
    } else {
      bodyY = Math.sin(this.t * 1.6) * 0.03;
    }

    n.torso.rotation.z = lerp(n.torso.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, n.baseY + bodyY, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, -armZ, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
    n.hipL.rotation.z = lerp(n.hipL.rotation.z, legSwing, k);
    n.hipR.rotation.z = lerp(n.hipR.rotation.z, -legSwing, k);

    for (const key of ['L', 'R']) {
      const g = n['handGlow' + key];
      g.material.opacity = lerp(g.material.opacity, 0.3 + glow * 0.7, k);
    }
  }
}

// ---------------------------------------------------------------------------
// Projectiles
// ---------------------------------------------------------------------------

const boltGeo = new THREE.CapsuleGeometry(0.14, 0.5, 4, 8);

export class Bolt {
  /**
   * @param {'player'|'enemy'} team
   */
  constructor(ctx, x, y, dx, dy, { team, speed, damage, life, pierce = 0, color, radius = 0.42 }) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = speed;
    this.damage = damage;
    this.life = life;
    this.pierce = pierce;
    this.team = team;
    this.radius = radius;
    this.hitSet = new Set();
    this.removeMe = false;

    this.root = new THREE.Group();
    const core = new THREE.Mesh(
      boltGeo,
      new THREE.MeshBasicMaterial({ color, fog: false, toneMapped: false })
    );
    core.rotation.z = -Math.PI / 2;
    this.root.add(core);
    const halo = new THREE.Mesh(
      boltGeo,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, fog: false, depthWrite: false, toneMapped: false })
    );
    halo.rotation.z = -Math.PI / 2;
    halo.scale.setScalar(2.1);
    this.root.add(halo);
    this.root.rotation.z = Math.atan2(dy, dx);
    this.color = color;
  }

  get box() {
    return { x0: this.x - this.radius, x1: this.x + this.radius, y0: this.y - this.radius, y1: this.y + this.radius };
  }

  update(dt, level) {
    this.life -= dt;
    if (this.life <= 0) return this._expire();
    this.x += this.dx * this.speed * dt;
    this.y += this.dy * this.speed * dt;
    this.root.position.set(this.x, this.y, 0);

    if (Math.random() < 0.75) {
      this.ctx.vfx.emit({
        x: this.x, y: this.y, z: rand(-0.15, 0.15),
        vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5),
        size: rand(0.09, 0.19), color: this.color,
        life: rand(0.12, 0.28), drag: 3,
      });
    }

    // Terrain stops projectiles.
    for (const s of level.activeSolids()) {
      if (boxHit(this.box, s)) return this._expire();
    }
  }

  _expire() {
    this.removeMe = true;
    this.ctx.vfx.hitSpark(this.x, this.y, Math.sign(this.dx) || 1, 0.35, this.color);
  }

  consumeHit() {
    if (this.pierce > 0) {
      this.pierce--;
      return false;
    }
    this._expire();
    return true;
  }
}

const WHITE = new THREE.Color(0xffffff);
