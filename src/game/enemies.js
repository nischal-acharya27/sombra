// Raakchyas, bhoot-battis, and the projectiles both sides throw.
//
// Design rule shared by everything in this file: **no passive contact damage.**
// Touching an enemy is safe; only a committed, telegraphed action hurts. In a
// game where your own attacks lunge you into the enemy, contact damage means
// the correct play is never to attack — and it makes crowding an unavoidable
// tax rather than a positioning mistake.

import * as THREE from 'three';
import { Actor, boxHit } from './actor.js';
import { buildRaakchyas, buildCharger, buildKawach, buildBhootBatti, buildTantrik, buildShakuni, buildBakasura, buildTaraka, buildShurpanakha, buildLankaSoldier, buildKumbhakarna, buildMathuraWrestler, buildKamsa, buildPutana, buildNarakasura } from '../render/models.js';
import { RAAKCHYAS, CHARGER, KAWACH, BHOOT_BATTI, TANTRIK, SHAKUNI, BAKASURA, TARAKA, SHURPANAKHA, LANKA_SOLDIER, KUMBHAKARNA, MATHURA_WRESTLER, KAMSA, PUTANA, NARAKASURA, PHYS, JUGGLE } from './config.js';
import { P } from '../render/palette.js';
import { assets } from '../render/assets.js';
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

  /**
   * `buildRig` lets a subclass reuse this whole chase → windup → pounce →
   * recover skeleton under a genuinely new silhouette (see `Shurpanakha`
   * below) without a throwaway `buildRaakchyas` rig getting built and
   * discarded first — which would not merely be waste but a correctness
   * problem, since three.js draws four `Math.random()` values per object for
   * its UUID and the suite seeds `Math.random` globally. Exactly the
   * parameter, and exactly the reasoning, `Charger` already carries.
   */
  constructor(level, ctx, x, y, cfg = RAAKCHYAS, skin = null, buildRig = buildRaakchyas) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildRig(skin);
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

  /**
   * `buildRig` is the same escape hatch `Raakchyas` and `Charger` already
   * take as their last parameter, added here when `LankaSoldier` became the
   * third archetype to want this skeleton under a different silhouette. It
   * defaults to `buildKawach`, so every existing call site is unchanged.
   */
  constructor(level, ctx, x, y, cfg = KAWACH, skin = null, buildRig = buildKawach) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildRig(skin);
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
 * A courtier, not a warrior — see `docs/research/villain-roster.md`'s handoff
 * (`dfed2a1`), and the 2026-08-22 combat redesign in `docs/DECISIONS.md`
 * § "Shakuni is rebuilt as a courtier". Grounded keep-distance, walked rather
 * than flown, and a kit of four summoned hazards, every one of which is the
 * same statement in a different shape: *the result is decided before you are
 * allowed to see it, and reading it in time is the whole game.*
 *
 * - **Loaded Die** — a die is thrown at where the hunter stands, lands showing
 *   a face, and the face is the radius. Reading the number is worth something
 *   because a 1 and a 6 are different circles.
 * - **Court of Blades** — ten cards at once across a narrow fan. The die's
 *   opposite: it punishes the range the die's keep-away read leaves open.
 * - **Rigged Throw** — a zone that is lying. Gold, then crimson somewhere
 *   else. See `SHAKUNI.rigged` for the two numbers that keep it fair.
 * - **House Always Wins** — phase 2 only. Three zones around *him*, fixed
 *   spacing, guaranteed gaps, resolving in sequence.
 *
 * Every one of the three ground moves resolves through `ctx.shockwaveFromBoss`
 * — despite the name, a plain ctx-level point-radius hit against the
 * player/chaya, defined in `game.js`. There is no fourth kind of damage here
 * and no new combat subsystem: what the redesign added is dice, telegraphs and
 * a reason to look at the floor.
 *
 * Nothing this class draws in the world is parented to its own rig. A prop
 * under a yaw-tilted root drifts off the point it is meant to mark as the
 * offset grows (see `buildShakuni`), so `vfx.dieToss` and `vfx.dangerZone` are
 * both world-space, and `this.zones` is Shakuni's own source of truth for
 * where the danger is.
 */
/** The staff's own lean at rest, matching `buildShakuni`. See `_animate`. */
const STAFF_REST = 0.26;

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
    this.houseCd = 0;
    this.zoneIdx = 0;
    this.emberT = 0;
    // Rigged Throw's two secrets, decided at cast and read at the reveal.
    this.riggedSide = 1;
    this.riggedOffset = cfg.rigged.offsetRange[0];

    /**
     * Live danger zones, and the only truth about where damage will land.
     *
     * Three slots, allocated once here and mutated in place for the rest of the
     * run — never pushed to and never replaced. A gate's worth of frames is a
     * lot of frames to be allocating in, and the objects three.js builds behind
     * an array literal would each draw four values off the seeded stream.
     *
     * `n` is how many of the three are live. Everything below reads `zones[0]`
     * for the single-zone moves, so a die and a hall-wide attack share one path
     * into the resolve.
     */
    this.zones = [
      { x, y, r: cfg.die.radiusRange[0] },
      { x, y, r: cfg.house.radius },
      { x, y, r: cfg.house.radius },
    ];
    this.zoneCount = 1;

    this.leavesCorpse = true;
  }

  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.enraged && this.hp <= this.maxHp * this.cfg.enrageAt) this._enrage();
    return landed;
  }

  /**
   * The house stops pretending.
   *
   * A material and VFX change on the same rig, in the shape Kumbhakarna's
   * waking already established (`_retint`) — no second model, per gate 1's
   * original "no rig swap" call, which this keeps. What it reverses is that
   * call's *other* half: the crossing used to be invisible.
   *
   * Three things move, and each is one register going up an octave: the lit
   * elements (eyes, crest, pendant, every loaded pip) go ember → blaze, the
   * dice go bone → soaked, and the wine cloth goes wine → crimson. The gold
   * deliberately does not move. Then `House Always Wins` unlocks, seeded
   * short so the transition leads straight into it.
   */
  _enrage() {
    this.enraged = true;
    this._retint(this.n.emberMeshes, P.shakuniBlaze);
    this._retint(this.n.wineMeshes, 0x8e1220);
    this._retint(this.n.dice.map((d) => d.userData.nodes.body), P.shakuniDieLit);
    this.houseCd = 1.2;
    this.ctx.onEnrage?.();
    this.ctx.audio?.play('enrage');
    this.ctx.shake?.(0.35);
    this.ctx.vfx.shadowBurst(this.x, this.y + 1.2, 24, P.shakuniBlaze);
  }

  /**
   * Re-colour meshes for the rest of the run, `_flash`'s bookkeeping included.
   *
   * `Enemy.finishSetup` clones every material and caches its starting colour as
   * the `base` that `_flash` restores to after a hit, so setting
   * `material.color` alone would last exactly until the next sword swing. Same
   * method, same reasoning, as `Kumbhakarna._retint`.
   */
  _retint(meshes, color) {
    for (const mesh of meshes) {
      if (!mesh?.material?.color) continue;
      mesh.material.color.setHex(color);
      const entry = this.mats?.find((m) => m.mat === mesh.material);
      entry?.base.setHex(color);
    }
  }

  /** Never a melee threat — every hit he deals lands through a zone. */
  attackBox() {
    return null;
  }

  _windup(base) {
    return base * (this.enraged ? this.cfg.enrageWindupMul : 1);
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

  /** Where a zone's ring sits: the floor under `x`, a hair above it. */
  _groundAt(x) {
    return this.level.groundAt(x) + 0.05;
  }

  /** Draw the live zones for `life` seconds. Redrawn, never accumulated. */
  _showZones(life, { color = P.crimson, fill = 'shakuni.zone', decoy = false } = {}) {
    for (let i = 0; i < this.zoneCount; i++) {
      const z = this.zones[i];
      this.ctx.vfx.dangerZone(z.x, z.y, z.r, life, { color, fill, decoy });
    }
  }

  /** Resolve zone `i`: the damage, and the flash that says it was this circle. */
  _resolveZone(i, damage, knock) {
    const z = this.zones[i];
    this.ctx.shockwaveFromBoss(z.x, z.y, { radius: z.r, damage, knock });
    this.ctx.vfx.zoneCommit(z.x, z.y, z.r, P.crimson);
    this.ctx.vfx.groundBurst(z.x, z.y, z.r * 0.6);
    this.ctx.shake?.(0.16);
    this.ctx.audio?.play('slam');
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const C = this.cfg;
    const D = C.die;
    const R = C.rigged;
    const H = C.house;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < C.chaseRange && Math.abs(player.y - this.y) < 6;
    if (this.enraged) this.houseCd -= dt;

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0 && this.state === 'hurt') this.state = 'chase';
    }

    switch (this.state) {
      case 'chase': {
        this._pace(dt, player, canSee);
        this.cooldown -= dt;
        if (!canSee || this.cooldown > 0) break;

        // The hall-wide attack pre-empts the ordinary kit whenever it is off
        // cooldown, so phase 2 has a rhythm the hunter can count rather than a
        // move that might or might not turn up.
        if (this.enraged && this.houseCd <= 0) {
          this.state = 'houseCast';
          this.phase = H.cast;
          this.ctx.audio?.play('enrage');
          break;
        }

        // Held past keep-distance, a ground zone is a puzzle with no stakes —
        // leaving a circle he telegraphed a second ago is free. The fan of
        // cards is what makes range itself the threat, so it is the move he
        // favours once the hunter is actually holding it. Up close, all three
        // reads are live and which one it is has to be read off the floor.
        const preferCards = dist > C.keepDistance + 1.5;
        const roll = Math.random();
        if (preferCards || roll > 0.72) {
          this.state = 'cardCast';
          this.phase = C.cards.cast;
        } else if (roll < 0.38) {
          this.state = 'cast';
          this.phase = D.cast;
        } else {
          this.state = 'riggedCast';
          this.phase = R.cast;
        }
        this.ctx.audio?.play('growl');
        break;
      }

      // -- Loaded Die --------------------------------------------------------

      case 'cast':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.faceToward(player.x);
        this.phase -= dt;
        if (this.phase <= 0) {
          // Read at the moment the die leaves his hand, not a frame later —
          // the target is where the hunter chose to stand, not a predicted
          // lead the way `Guardian._slamLand` aims its own leap.
          const face = 1 + Math.floor(rand(0, 6));
          this.zoneCount = 1;
          this.zones[0].x = player.x;
          this.zones[0].y = this._groundAt(player.x);
          // The face *is* the radius, and that is the read the move exists to
          // teach: a 1 is a circle you can stand beside and a 6 is not.
          this.zones[0].r = lerp(D.radiusRange[0], D.radiusRange[1], (face - 1) / 5);
          this.ctx.vfx.dieToss(this.x + this.facing * 0.5, this.y + 1.25, this.zones[0].x, this.zones[0].y, {
            face,
            flight: D.flight,
            // Outlives the resolve on purpose: the die that decided the zone
            // stays lying where it fell for a beat afterwards, so the hunter
            // can see what it rolled *after* being hit by it and not only
            // before. Cause and effect, in that order, both visible.
            linger: this._windup(D.windup) + 0.9,
            // Measured, not chosen: at 1 (0.42 world units) the die was eight
            // pixels on the floor at combat distance and the rolled face — the
            // whole read this move is built on — could not be resolved at all.
            size: 1.5,
          });
          this.state = 'dieFlight';
          this.phase = D.flight;
          this.ctx.audio?.play('wispShot');
        }
        break;

      case 'dieFlight':
        // The die is in the air and there is no zone yet — deliberately. The
        // die *is* the telegraph for this beat; drawing the circle before it
        // lands would make the throw itself decorative.
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'windup';
          this.phase = this._windup(D.windup);
          this._showZones(this.phase);
        }
        break;

      case 'windup':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          this._resolveZone(0, D.damage, D.knock);
          this.state = 'recover';
          this.phase = 0.4;
        }
        break;

      // -- Court of Blades ---------------------------------------------------

      case 'cardCast':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.faceToward(player.x);
        this.phase -= dt;
        if (this.phase <= 0) {
          this._throwCards(player);
          this.state = 'recover';
          this.phase = C.cards.recover;
        }
        break;

      // -- Rigged Throw ------------------------------------------------------

      case 'riggedCast':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.faceToward(player.x);
        this.phase -= dt;
        if (this.phase <= 0) {
          // Three dice, at the hunter's feet, and all three are lying.
          this.zoneCount = 1;
          this.zones[0].x = player.x;
          this.zones[0].y = this._groundAt(player.x);
          this.zones[0].r = R.radius;
          // Decided now, shown later: which way the truth sits, and how far.
          this.riggedSide = Math.random() < 0.5 ? -1 : 1;
          this.riggedOffset = rand(R.offsetRange[0], R.offsetRange[1]);
          // Never onto his own feet. A crimson circle centred on the Warden
          // reads as an aura around him rather than as a place on the floor,
          // which is the one thing this zone must never be mistaken for. The
          // flip only fires when the hunter has put the feint between
          // themselves and him, so it costs the move nothing it was using.
          const trueX = this.zones[0].x + this.riggedSide * this.riggedOffset;
          if (Math.abs(trueX - this.x) < R.radius + this.cfg.hw) this.riggedSide *= -1;
          for (let i = 0; i < 3; i++) {
            this.ctx.vfx.dieToss(
              this.x + this.facing * 0.5,
              this.y + 1.25,
              this.zones[0].x + (i - 1) * 0.85,
              this.zones[0].y,
              { face: 1 + Math.floor(rand(0, 6)), flight: R.flight, linger: R.decoy + R.reveal, size: 0.95 }
            );
          }
          this.state = 'riggedFlight';
          this.phase = R.flight;
          this.ctx.audio?.play('wispShot');
        }
        break;

      case 'riggedFlight':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'riggedDecoy';
          this.phase = R.decoy;
          // Gold, and breathing rather than building — see `vfx.dangerZone`'s
          // `decoy`. It has to be tellable from the real thing on sight, or the
          // move is not a feint, it is a coin flip.
          this._showZones(R.decoy, { color: P.shakuniGold, fill: 'shakuni.zone.decoy', decoy: true });
        }
        break;

      case 'riggedDecoy':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          // The reveal: the zone moves, in full view, and then holds still for
          // `reveal` seconds. `reveal` is the entire reaction budget this move
          // asks for and it is the number `tools/gatecheck.js` measures.
          const from = this.zones[0].x;
          this.zones[0].x = from + this.riggedSide * this.riggedOffset;
          this.zones[0].y = this._groundAt(this.zones[0].x);
          this.state = 'riggedTrue';
          this.phase = this._windup(R.reveal);
          this._showZones(this.phase);
          // One die follows the lie to where the truth was always going to be,
          // so the move reads as sleight of hand rather than as a bug.
          this.ctx.vfx.dieToss(from, this.zones[0].y, this.zones[0].x, this.zones[0].y, {
            face: 1,
            flight: 0.22,
            linger: this.phase + 0.4,
            size: 0.95,
          });
          this.ctx.vfx.shockRing(from, this.zones[0].y, R.radius * 0.5, P.shakuniGold);
          this.ctx.audio?.play('growl');
        }
        break;

      case 'riggedTrue':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          this._resolveZone(0, R.damage, R.knock);
          this.state = 'recover';
          this.phase = R.recover;
        }
        break;

      // -- House Always Wins -------------------------------------------------

      case 'houseCast':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.faceToward(player.x);
        this.phase -= dt;
        if (this.phase <= 0) {
          // Three zones, centred on *him*, at fixed spacing. Not on the hunter,
          // and that is the design: the table is set by the house, in the same
          // shape every time, so the answer is to look at the floor rather than
          // to out-run a prediction. The gaps are 2.4 units wide and exist by
          // construction — see `SHAKUNI.house`.
          this.zoneCount = 3;
          // Offset half a spacing toward the hunter, so the trio spans the
          // floor *between* them rather than straddling Shakuni. Two reasons,
          // and the second is the real one: a zone centred on him dropped a
          // die on his own head, and the house does not sit at the table it
          // sets. He stands in the first gap, every time.
          const centre = this.x + this.facing * H.spacing * 0.5;
          for (let i = 0; i < 3; i++) {
            const zx = centre + (i - 1) * H.spacing;
            this.zones[i].x = zx;
            this.zones[i].y = this._groundAt(zx);
            this.zones[i].r = H.radius;
            this.ctx.vfx.dieToss(this.x, this.y + 1.6, zx, this.zones[i].y, {
              face: 6,
              flight: H.flight,
              linger: H.windup + H.stagger * 3,
              size: H.dieSize,
              tint: P.shakuniDieLit,
            });
          }
          this.state = 'houseFlight';
          this.phase = H.flight;
          this.ctx.shake?.(0.25);
        }
        break;

      case 'houseFlight':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'houseWindup';
          this.phase = H.windup;
          this._showZones(H.windup + H.stagger * 2, { fill: 'shakuni.zone.arena' });
        }
        break;

      case 'houseWindup':
        this.vx = damp(this.vx, 0, 0.0005, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'houseResolve';
          this.zoneIdx = 0;
          this.phase = 0;
        }
        break;

      case 'houseResolve':
        // Left to right, `stagger` apart. The gaps do not move while this runs,
        // so a hunter standing in one is safe for the whole sequence — the
        // stagger is drama, not a second thing to solve.
        this.phase -= dt;
        if (this.phase <= 0) {
          this._resolveZone(this.zoneIdx, H.damage, H.knock);
          this.zoneIdx++;
          this.phase = H.stagger;
          if (this.zoneIdx >= 3) {
            this.zoneCount = 1;
            this.state = 'recover';
            this.phase = H.recover;
            this.houseCd = H.cooldown;
          }
        }
        break;

      case 'recover':
        this.vx = damp(this.vx, 0, 0.001, dt);
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'chase';
          this.cooldown = C.interval * (this.enraged ? C.enrageIntervalMul : 1);
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
   *
   * `spawnEnemyBolt` is the same seam the Guardian's own `volley` fires
   * through in `boss.js`; each card is a full `Bolt` with its own hitbox, so a
   * hunter caught in the fan can take more than one, on purpose. `kind: 'card'`
   * changes how it is drawn and nothing else — see `Bolt`.
   */
  _throwCards(player) {
    const C = this.cfg.cards;
    const originX = this.x + Math.sign(player.x - this.x || this.facing || 1) * 0.35;
    const originY = this.y + 1.15;
    const base = Math.atan2(player.y + 0.9 - originY, player.x - originX);
    const half = C.spread / 2;
    for (let i = 0; i < C.count; i++) {
      const t = C.count === 1 ? 0.5 : i / (C.count - 1);
      const a = base - half + t * C.spread;
      this.ctx.spawnEnemyBolt(originX, originY, Math.cos(a), Math.sin(a), {
        speed: C.speed,
        damage: C.damage,
        life: C.life,
        // Gold, not crimson: the card's own crimson lives in its emblem, and
        // the crimson register belongs to the ground zones. A fan of ten
        // crimson projectiles would say "the floor is about to open" ten times
        // and be wrong ten times.
        color: P.shakuniGold,
        kind: 'card',
      });
    }
    this.ctx.vfx.shockRing(originX, originY, 0.6, P.shakuniGold);
    this.ctx.audio?.play('wispShot');
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    let bodyZ = 0;
    let armZ = 0; // the right arm: the throwing arm
    let staffZ = 0; // the left: the staff arm

    const casting =
      this.state === 'cast' || this.state === 'riggedCast' || this.state === 'houseCast';
    const holding =
      this.state === 'windup' || this.state === 'riggedTrue' || this.state === 'houseWindup' ||
      this.state === 'dieFlight' || this.state === 'riggedFlight' || this.state === 'houseFlight';

    if (casting || this.state === 'cardCast') {
      const total =
        this.state === 'cast' ? this.cfg.die.cast
        : this.state === 'riggedCast' ? this.cfg.rigged.cast
        : this.state === 'houseCast' ? this.cfg.house.cast
        : this.cfg.cards.cast;
      const u = clamp(1 - this.phase / total, 0, 1);
      // Winds up rather than reaching: he draws back over the whole cast and
      // the release is the frame the state changes, which is what makes the
      // throw legible from outside its own range.
      bodyZ = -0.06 - u * 0.10;
      armZ = -0.35 - u * 0.85;
      // The staff comes up too on the hall-wide attack — both hands, once.
      if (this.state === 'houseCast') staffZ = -u * 0.85;
    } else if (holding) {
      // Held out over the zone he has drawn. Still, which is the difference
      // between "committed" and "still deciding".
      bodyZ = -0.14;
      armZ = -1.05;
      if (this.state === 'houseWindup' || this.state === 'houseFlight') staffZ = -0.85;
    } else if (this.state === 'hurt') {
      bodyZ = 0.16;
    } else if (Math.abs(this.vx) > 0.3) {
      bodyZ = Math.sin(this.t * 5) * 0.03;
    }

    n.robe.rotation.z = lerp(n.robe.rotation.z, bodyZ, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, staffZ, k);
    // The staff stays upright no matter what the arm under it does. Without
    // this it swung with the shoulder and lay flat across his own face at full
    // extension — the raise is meant to *lift* the thing, not swing it — and a
    // counter-rotation is the only version of that which cannot intersect the
    // head for any value the animator happens to reach.
    n.staff.rotation.z = STAFF_REST - n.shoulderL.rotation.z;

    // The three dice turn on their ring and tumble in place, faster when he is
    // about to spend one. Never a *tell* — they speed up during recovery too,
    // and they never stop — so the ground stays the only thing that says a
    // zone is coming.
    const spin = 0.55 + (casting || holding ? 1.5 : 0) + (this.enraged ? 0.7 : 0);
    n.orbit.rotation.z += dt * spin;
    for (let i = 0; i < n.dice.length; i++) {
      const die = n.dice[i];
      die.rotation.y += dt * (0.9 + i * 0.22) * spin;
      die.rotation.x += dt * (0.6 + i * 0.15) * spin;
    }
    // Counter-turn the holders so the dice orbit without being dragged round
    // face-first, which reads as a carousel rather than as three objects
    // circling him.
    for (const holder of n.orbitHolders) holder.rotation.z = -n.orbit.rotation.z;

    // The beard drags behind the stoop by a fraction, which is most of what
    // sells an old man leaning into a throw.
    n.beard.rotation.z = lerp(n.beard.rotation.z, bodyZ * 0.55, k * 0.6);

    // Phase 2 burns. Rate-limited rather than per-frame, and every draw it
    // takes is deterministic under the suite's fixed step like the rest of him.
    if (!this.enraged) return;
    this.emberT -= dt;
    if (this.emberT > 0) return;
    this.emberT = 0.11;
    this.ctx.vfx.emit({
      x: this.x + rand(-0.45, 0.45),
      y: this.y + rand(0.3, 2.0),
      z: rand(-0.35, 0.35),
      vx: rand(-0.5, 0.5),
      vy: rand(0.7, 2.0),
      size: rand(0.05, 0.12),
      color: Math.random() < 0.4 ? P.shakuniGold : P.shakuniBlaze,
      life: rand(0.4, 0.9),
      grav: -1.2,
      drag: 1.4,
    });
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
// Shurpanakha
// ---------------------------------------------------------------------------

/**
 * Gate 6's Warden — a wronged, humiliated soul the stopped Wheel is holding,
 * not a monster to be put down. Extends `Raakchyas` directly rather than
 * copying its chase → windup → pounce skeleton: her entry's kit-shape call is
 * one attack, reskinned rather than replaced across the reveal, and the
 * grunt's pounce is that shape already.
 *
 * The reveal changes **presentation only**. Same hitbox, same timings, same
 * one move — a conjured decoy lands the hit before it, a bare claw lands the
 * identical hit after. This was never a design option rather than a
 * presentation one: tier 3 is reserved for the four locked bosses (issue
 * #40), and Taraka's precedent one act-slot back is explicitly cosmetic-only
 * for the same reason.
 *
 * `_animate` is the one thing this class overrides in full — the base
 * `Raakchyas._animate` drives a quadruped's neck/tail/four legs, and
 * `buildShurpanakha`'s rig is a biped. Same override, same reason, as
 * `Taraka` against `Charger`.
 */
export class Shurpanakha extends Raakchyas {
  static stats = SHURPANAKHA;

  constructor(level, ctx, x, y, cfg = SHURPANAKHA, skin = null) {
    super(level, ctx, x, y, cfg, skin, buildShurpanakha);
    this.forms = this.root.userData.forms;
    this.form = 'disguised';
    this.n = this.forms.disguised.nodes;
    /** Fires once, at the HP threshold — see `takeHit` below. */
    this.phaseFired = false;
  }

  /**
   * The reveal. An HP threshold rather than the generic enrage toast the
   * bosses fire, because this one is staged as a held, player-advanced story
   * beat (`Game.firePhaseBeat`) — her entry puts the weight of its
   * respectful-treatment note on exactly this moment, and a beat the hunter
   * has to page through is what keeps it from being something they cheer
   * past. Kit and hitbox never move here; only `this.form`/`this.n` do, once
   * the beat drains.
   */
  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.phaseFired && this.hp <= this.maxHp * this.cfg.phaseAt) {
      this.phaseFired = true;
      this.ctx.firePhaseBeat?.(() => this._reveal());
    }
    return landed;
  }

  /** Swaps the visible rig and the node table `_animate`/`syncRig` read. */
  _reveal() {
    this.form = 'revealed';
    this.forms.disguised.root.visible = false;
    this.forms.revealed.root.visible = true;
    this.n = this.forms.revealed.nodes;
    this.ctx.audio?.play('illusionBreak');
    this.syncRig();
  }

  /**
   * The windup shortens after the reveal — the one number that moves, held to
   * `tools/gatecheck.js`'s telegraph floor at its post-reveal value by
   * `TELLS`'s own `shurpanakha` row.
   */
  get _windup() {
    return this.cfg.pounce.windup * (this.phaseFired ? this.cfg.phaseWindupMul : 1);
  }

  update(dt, player) {
    super.update(dt, player);
    // `Raakchyas` sets `phase` to the base windup on commit; re-scale it the
    // frame it does, so the tightening lands without a second copy of the
    // whole state machine living here.
    if (this.state === 'windup' && this.phase > this._windup) this.phase = this._windup;
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const P_ = this.cfg.pounce;
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    let glow = 0;
    let legSwing = 0;

    if (this.state === 'windup') {
      // The arm draws back and across rather than the body gathering low:
      // a swipe reads as a wind, not a crouch, which is what separates her
      // tell from the grunt's leap the hunter has been reading since gate 1.
      const u = clamp(1 - this.phase / this._windup, 0, 1);
      bodyZ = 0.1 + u * 0.1;
      bodyY = -0.04 - u * 0.04;
      armZ = -0.3 - u * 0.9;
      glow = 0.3 + u * 0.7;
      this.legPhase += dt * 10;
      legSwing = Math.sin(this.legPhase) * 0.18;
    } else if (this.state === 'pounce') {
      // The swipe itself: the arm comes through, the body follows it.
      bodyZ = -0.3;
      armZ = 0.8;
      glow = 1;
      legSwing = -0.5;
      if (Math.random() < 0.4) this.ctx.vfx.dust(this.x - this.facing * 0.4, this.y, 1);
    } else if (this.state === 'recover') {
      const u = clamp(this.phase / P_.recover, 0, 1);
      bodyZ = -0.16 * u;
      armZ = 0.4 * u;
    } else if (this.state === 'hurt') {
      bodyZ = 0.24;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.3) {
      this.legPhase += dt * (6 + Math.abs(this.vx));
      legSwing = Math.sin(this.legPhase) * 0.5;
      bodyY = Math.abs(Math.cos(this.legPhase)) * 0.04;
    } else {
      bodyY = Math.sin(this.t * 1.8) * 0.025;
    }

    n.torso.rotation.z = lerp(n.torso.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, n.baseY + bodyY, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, -armZ * 0.4, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
    n.hipL.rotation.z = lerp(n.hipL.rotation.z, legSwing, k);
    n.hipR.rotation.z = lerp(n.hipR.rotation.z, -legSwing, k);

    // The eyes flare with the windup, the same tell `Raakchyas` teaches — the
    // hunter reads the same signal on a different silhouette.
    const eyeGlow = this.form === 'revealed' ? 0.35 + glow * 0.65 : 0.25 + glow * 0.5;
    n.eyeL.material.opacity = lerp(n.eyeL.material.opacity, eyeGlow, k);
    n.eyeR.material.opacity = n.eyeL.material.opacity;
    n.eyeL.material.transparent = true;
    n.eyeR.material.transparent = true;

    for (const key of ['L', 'R']) {
      const g = n['handGlow' + key];
      g.material.opacity = lerp(g.material.opacity, 0.2 + glow * 0.8, k);
    }
  }
}

// ---------------------------------------------------------------------------
// Lanka soldier
// ---------------------------------------------------------------------------

/**
 * Gate 7's new regular archetype, and Act 2's only one — Lanka on a war
 * footing, per `docs/SPEC-CAMPAIGN.md` § Act 2.
 *
 * Extends `Kawach` directly rather than copying its chase → telegraph →
 * attack → recover skeleton: the spec's own words are "extending `Kawach`'s
 * plant→telegraph→commit skeleton rather than a reskin or a bespoke state
 * machine", and a planted thrust *is* that shape. The state machine here is
 * inherited whole; nothing in this class touches it.
 *
 * Two methods override, and both are presentation or geometry rather than
 * behaviour:
 *
 * - `attackBox`, because a spear reaches forward and a shield bash straddles.
 *   `LANKA_SOLDIER.bash.reach`/`reachBack` carry it, the same asymmetric-box
 *   departure `Bakasura.attackBox` already makes for its grab.
 * - `_animate` in full, because `Kawach._animate` drives a shield-arm rig and
 *   this one drives a spear. Same override, same reason, as `Taraka` against
 *   `Charger` and `Shurpanakha` against `Raakchyas`.
 *
 * The armour is not overridden — it is configured off. `LANKA_SOLDIER`
 * sets `armorBreakLaunch: 0`, so `Kawach.takeHit`'s `launch < 0` test is
 * false for every hit and each one goes through to `Enemy.takeHit`
 * unabridged. One armour rule in the codebase, at two settings.
 */
export class LankaSoldier extends Kawach {
  static stats = LANKA_SOLDIER;

  constructor(level, ctx, x, y, cfg = LANKA_SOLDIER, skin = null) {
    super(level, ctx, x, y, cfg, skin, buildLankaSoldier);
    this.legPhase = 0;
  }

  /** Forward, not straddling — a spear goes one way. See `LANKA_SOLDIER.bash`. */
  attackBox() {
    if (this.state !== 'attack' || this.dead) return null;
    const B = this.cfg.bash;
    return this.facing >= 0
      ? { x0: this.x - B.reachBack, x1: this.x + B.reach, y0: this.y, y1: this.y + this.hh * 2 }
      : { x0: this.x - B.reach, x1: this.x + B.reachBack, y0: this.y, y1: this.y + this.hh * 2 };
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const B = this.cfg.bash;
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    let spearZ = 0;
    let spearX = 0;

    if (this.state === 'telegraph') {
      // The spear cocks back and levels, the body turns side-on behind it.
      // Deliberately the same *schedule* as Kawach's plant — eyes flare on
      // the same curve — with the arm doing something visibly different, so
      // the hunter reads "same tell, new distance" rather than a new tell.
      const u = 1 - this.phase / B.windup;
      bodyZ = -0.06 - u * 0.1;
      bodyY = -0.03 - u * 0.04;
      armZ = 0.3 + u * 0.5;
      spearZ = -0.2 - u * 0.35;
      spearX = -u * 0.5;
      const g = 0.3 + u * 0.7;
      n.eyeL.material.opacity = g;
      n.eyeR.material.opacity = g;
      n.eyeL.material.transparent = true;
      n.eyeR.material.transparent = true;
      n.eyeL.scale.setScalar(1 + u * 0.5);
      n.eyeR.scale.setScalar(1 + u * 0.5);
    } else {
      n.eyeL.scale.setScalar(damp(n.eyeL.scale.x, 1, 0.001, dt));
      n.eyeR.scale.setScalar(n.eyeL.scale.x);
      n.eyeL.material.opacity = 1;
      n.eyeR.material.opacity = 1;
    }

    if (this.state === 'attack') {
      // The thrust: the arm drives through and the haft comes level.
      const u = clamp(1 - this.phase / B.active, 0, 1);
      bodyZ = lerp(0.18, -0.06, u);
      armZ = lerp(-0.55, 0.15, u);
      spearZ = lerp(0.12, -0.05, u);
      bodyY = -0.05;
    } else if (this.state === 'recover') {
      // The punish window a planted thrust owes the hunter for reading it —
      // and at this reach, the one the hunter has to walk in to take.
      const u = clamp(this.phase / B.recover, 0, 1);
      bodyZ = -0.08 * u;
      bodyY = -0.05 * u;
      armZ = -0.2 * u;
    } else if (this.state === 'hurt') {
      bodyZ = 0.2;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.3) {
      this.legPhase += dt * (6 + Math.abs(this.vx));
      bodyY = Math.abs(Math.sin(this.legPhase)) * 0.03;
    } else if (this.state !== 'telegraph') {
      bodyY = Math.sin(this.t * 1.5) * 0.02;
    }

    n.body.rotation.z = lerp(n.body.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, 0.86 + bodyY, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, -armZ * 0.3, k);
    n.spear.rotation.z = lerp(n.spear.rotation.z, spearZ, k);
    n.spear.position.x = lerp(n.spear.position.x, 0.06 + spearX, k);
    const legSwing = this.state === 'chase' ? Math.sin(this.legPhase) * 0.4 : 0;
    n.hipL.rotation.z = lerp(n.hipL.rotation.z, legSwing, k);
    n.hipR.rotation.z = lerp(n.hipR.rotation.z, -legSwing, k);
  }
}

// ---------------------------------------------------------------------------
// Kumbhakarna
// ---------------------------------------------------------------------------

/**
 * Gate 7's Warden — Ravana's giant brother, who argued against the war in his
 * brother's own hall, was refused, and fought anyway. The largest silhouette
 * in the game (`KUMBHAKARNA.hw`/`hh`, and see that block for why being bigger
 * than a boss is not the same as being harder than one).
 *
 * Follows `Bakasura`'s skeleton rather than `Kawach`'s directly: `Enemy` with
 * two committed moves picked by range, which is what his roster entry's kit
 * shape asks for. The departure from Bakasura is that the long move does not
 * travel — the club supplies the reach — so there is no `tackling` state here
 * that moves the body under its own power.
 *
 * The phase-transition is the third consumer of `Game.firePhaseBeat`
 * (`docs/DECISIONS.md` § "Boss/Warden dialogue returns"), after Taraka's
 * curse-reveal and Shurpanakha's illusion break. Unlike both of theirs it
 * swaps no rig: one body, with the lids lifting, the skin re-tinting from
 * `kumbhaSkinDull` to `kumbhaSkin`, the wind-ups tightening and the walk
 * picking up. His entry is explicit that this is the difference — theirs are
 * two-rig transformations, his is a man waking up.
 */
/**
 * The club's resting angle — shouldered, angled up and back.
 *
 * Zero would hold a three-unit tree out horizontally at rest, which reads as
 * a man presenting a weapon rather than a man carrying one. Hanging it the
 * other way (the first thing tried) put the head through the floor at every
 * idle frame, because the club is longer than his arm is high. Shouldered is
 * the one resting pose a weapon this size has, and it leaves both wind-ups
 * most of a half-turn of travel to be read against.
 */
const REST_CLUB = 1.0;

export class Kumbhakarna extends Enemy {
  static stats = KUMBHAKARNA;

  constructor(level, ctx, x, y, cfg = KUMBHAKARNA, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildKumbhakarna(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.phase = 0;
    this.cooldown = rand(cfg.cooldown[0], cfg.cooldown[1]);
    this.chargeHitSet = new Set();
    this.leavesCorpse = true;
    /** Fires once, at the HP threshold — see `takeHit` below. */
    this.phaseFired = false;
    this.legPhase = 0;
  }

  /** Always, for a hostile Kumbhakarna. Mirrors `Bakasura._canCommit`. */
  _canCommit() {
    return true;
  }

  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.phaseFired && this.hp <= this.maxHp * this.cfg.phaseAt) {
      this.phaseFired = true;
      this.ctx.firePhaseBeat?.(() => this._wake());
    }
    return landed;
  }

  /**
   * The waking, fired by `Game.firePhaseBeat` once the held beat drains.
   *
   * Nothing about the *kit* moves here — same two moves, same boxes, same
   * damage. What moves is the wind-up multiplier and the walk speed (both
   * read live from `cfg` in `update`), the lids, and the skin. Same "escalation
   * is the wind-up, not the kit" rule Shakuni, Bakasura, Taraka and
   * Shurpanakha all already hold to.
   */
  _wake() {
    this._retint(this.n.skinMeshes, P.kumbhaSkin);
    this.ctx.audio?.play('waking');
    this.ctx.shake?.(0.4);
  }

  /**
   * Re-colour a set of meshes for the rest of the run, `_flash`'s bookkeeping
   * included.
   *
   * `Enemy.finishSetup` clones every material and caches its starting colour
   * as the `base` that `_flash` restores to after a hit. Setting
   * `material.color` alone would therefore last exactly until the next sword
   * swing, which is a bug that would have looked like the waking "not
   * sticking". The base moves with it.
   */
  _retint(meshes, color) {
    for (const mesh of meshes) {
      mesh.material.color.setHex(color);
      const entry = this.mats?.find((m) => m.mat === mesh.material);
      entry?.base.setHex(color);
    }
  }

  /** Both wind-ups tighten together once he is awake. */
  _windupMul() {
    return this.phaseFired ? this.cfg.phaseWindupMul : 1;
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const S = this.cfg.smash;
    const W = this.cfg.sweep;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;
    const windupMul = this._windupMul();
    const speed = this.cfg.speed * (this.phaseFired ? this.cfg.phaseSpeedMul : 1);

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

        // The smash takes the close band; the sweep takes the long one out to
        // club length. Same range-picked pair as Bakasura's grab and tackle,
        // and the same reason: holding station just outside the close move
        // must not be a fight he cannot answer.
        if (this._canCommit() && this.cooldown <= 0 && this.grounded) {
          if (dist < S.range) {
            this.state = 'smashTelegraph';
            this.phase = S.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          } else if (dist < W.range) {
            this.state = 'sweepTelegraph';
            this.phase = W.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          }
        }

        const want = dist > this.cfg.stopAt ? this.facing * speed : 0;
        const ahead = this.x + Math.sign(want || this.facing) * 1.4;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'smashTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > S.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'smash';
          this.phase = S.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('slam');
          this.ctx.shake?.(S.shake);
          this.ctx.vfx.dust(this.x + this.facing * 2.2, this.y, 9);
        }
        break;
      }

      case 'sweepTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > W.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'sweep';
          this.phase = W.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('pounce');
          this.ctx.shake?.(W.shake);
        }
        break;
      }

      case 'smash':
      case 'sweep': {
        this.phase -= dt;
        if (this.phase <= 0) {
          const done = this.state === 'smash' ? S : W;
          this.state = 'recover';
          this.phase = done.recover;
        }
        break;
      }

      case 'recover': {
        // The punish window. At his reach it is the only one the hunter gets,
        // which is why both moves pay a long one.
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

  /** Both boxes are forward-biased — see `KUMBHAKARNA.smash`'s own note. */
  attackBox() {
    if (this.dead) return null;
    const A = this.state === 'smash' ? this.cfg.smash : this.state === 'sweep' ? this.cfg.sweep : null;
    if (!A) return null;
    return this.facing >= 0
      ? { x0: this.x - A.reachBack, x1: this.x + A.reach, y0: this.y, y1: this.y + this.hh * 2 }
      : { x0: this.x - A.reach, x1: this.x + A.reachBack, y0: this.y, y1: this.y + this.hh * 2 };
  }

  currentAttackDamage() {
    if (this.state === 'smash') return { damage: this.cfg.smash.damage, knock: this.cfg.smash.knock };
    if (this.state === 'sweep') return { damage: this.cfg.sweep.damage, knock: this.cfg.sweep.knock };
    return null;
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const S = this.cfg.smash;
    const W = this.cfg.sweep;
    const windupMul = this._windupMul();
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    let clubZ = REST_CLUB;
    let glow = 0;
    let legSwing = 0;

    if (this.state === 'smashTelegraph') {
      // The club goes up and over — the readable half of a heavy overhead,
      // and at this scale it is visible from the far end of the hall, which
      // is the point of building the fight around reach. It travels most of a
      // half-turn from the resting hang, so there is no frame of the wind-up
      // that looks like the idle.
      const u = 1 - this.phase / (S.windup * windupMul);
      bodyZ = -0.1 - u * 0.14;
      bodyY = -0.06 - u * 0.08;
      armZ = 0.4 + u * 1.1;
      clubZ = lerp(REST_CLUB, 2.25, u);
      glow = 0.3 + u * 0.7;
    } else if (this.state === 'smash') {
      const u = clamp(1 - this.phase / S.active, 0, 1);
      bodyZ = lerp(0.3, 0.08, u);
      armZ = lerp(-1.3, -0.6, u);
      clubZ = lerp(2.25, -0.65, u); // straight down through the arc it raised
      bodyY = -0.12;
      glow = 1;
    } else if (this.state === 'sweepTelegraph') {
      // The club drops off the shoulder and winds back low, the opposite
      // direction from the overhead's raise — so the two wind-ups differ in
      // the one thing the hunter can read from eight units away: which way
      // the tree went.
      const u = 1 - this.phase / (W.windup * windupMul);
      bodyZ = 0.08 + u * 0.12;
      bodyY = -0.04 - u * 0.05;
      armZ = -0.3 - u * 0.5;
      clubZ = lerp(REST_CLUB, -0.55, u);
      glow = 0.3 + u * 0.7;
    } else if (this.state === 'sweep') {
      // Forward and level through the low arc it wound into — a sweep, not
      // a chop, which is what the long move is and what the arc has to say.
      const u = clamp(1 - this.phase / W.active, 0, 1);
      bodyZ = lerp(-0.24, 0.06, u);
      armZ = lerp(0.7, 0.1, u);
      clubZ = lerp(-0.55, 0.2, u);
      glow = 1;
      if (Math.random() < 0.5) this.ctx.vfx.dust(this.x + this.facing * 3.0, this.y, 2);
    } else if (this.state === 'recover') {
      const total = Math.max(S.recover, W.recover);
      const u = clamp(this.phase / total, 0, 1);
      bodyZ = -0.12 * u;
      bodyY = -0.08 * u;
      armZ = -0.15 * u;
    } else if (this.state === 'hurt') {
      bodyZ = 0.2;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.3) {
      this.legPhase += dt * (4 + Math.abs(this.vx));
      legSwing = Math.sin(this.legPhase) * 0.42;
      bodyY = Math.abs(Math.cos(this.legPhase)) * 0.09;
    } else {
      // The idle: a slow, heavy breath. Slower before the waking than after,
      // because the whole first phase is a man who has not finished getting up.
      bodyY = Math.sin(this.t * (this.phaseFired ? 1.5 : 0.85)) * 0.06;
    }

    n.torso.rotation.z = lerp(n.torso.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, n.baseY + bodyY, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, -armZ * 0.25, k);
    n.club.rotation.z = lerp(n.club.rotation.z, clubZ, k);
    n.hipL.rotation.z = lerp(n.hipL.rotation.z, legSwing, k);
    n.hipR.rotation.z = lerp(n.hipR.rotation.z, -legSwing, k);

    // The jaw hangs open a crack while groggy and shuts once he is awake —
    // the cheapest possible version of "this face changed", and the one the
    // camera can actually see at this scale.
    n.jaw.rotation.z = lerp(n.jaw.rotation.z, this.phaseFired ? 0 : 0.18, k);

    // The lids. Heavy-lidded through the whole first phase, per his entry's
    // default character read; they come up at the waking and stay up.
    const lid = this.phaseFired ? 0.12 : 1;
    for (const key of ['L', 'R']) {
      const l = n['lid' + key];
      l.scale.y = lerp(l.scale.y, lid, k);
      const e = n['eye' + key];
      e.material.transparent = true;
      e.material.opacity = lerp(e.material.opacity, (this.phaseFired ? 0.5 : 0.28) + glow * 0.5, k);
    }
  }
}

// ---------------------------------------------------------------------------
// Mathura wrestler — gate 09's regular archetype
// ---------------------------------------------------------------------------

/**
 * `docs/SPEC-CAMPAIGN.md` § Act 3: extends `Charger`'s chase → telegraph →
 * charge → recover skeleton under a new biped silhouette, the same
 * `buildRig` escape hatch `Taraka` already takes — a grapple-lunge is that
 * shape already, reskinned as a shorter, quicker close rather than a
 * lumbering body-check. `_animate` is the one thing this class overrides in
 * full, the same reason `Taraka`'s does: the base `Charger._animate` drives
 * a quadruped's neck/tail/four legs, and `buildMathuraWrestler`'s rig is a
 * biped.
 */
export class MathuraWrestler extends Charger {
  static stats = MATHURA_WRESTLER;

  constructor(level, ctx, x, y, cfg = MATHURA_WRESTLER, skin = null) {
    super(level, ctx, x, y, cfg, skin, buildMathuraWrestler);
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const C = this.cfg.charge;
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    let glow = 0;
    let legSwing = 0;

    if (this.state === 'telegraph') {
      // Crouched into a grappler's stance, arms drawn in rather than reared
      // back — a grapple reads as a gather, the same distinction Bakasura's
      // grab windup draws against Charger's own rock-back.
      const u = 1 - this.phase / C.windup;
      bodyZ = -0.16 - u * 0.14;
      bodyY = -0.08 - u * 0.06;
      armZ = 0.2 + u * 0.6;
      glow = 0.3 + u * 0.7;
      this.legPhase += dt * 15;
      legSwing = Math.sin(this.legPhase) * 0.3;
    } else if (this.state === 'charging') {
      bodyZ = 0.22;
      bodyY = -0.1;
      armZ = -0.55;
      glow = 1;
      this.legPhase += dt * 32;
      legSwing = Math.sin(this.legPhase) * 0.9;
      if (Math.random() < 0.5) this.ctx.vfx.dust(this.x - this.facing * 0.5, this.y, 1);
    } else if (this.state === 'recover') {
      const u = clamp(this.phase / C.recover, 0, 1);
      bodyZ = 0.18 * u;
      bodyY = -0.1 * u;
    } else if (this.state === 'hurt') {
      bodyZ = -0.2;
    } else if (this.state === 'chase' && Math.abs(this.vx) > 0.3) {
      this.legPhase += dt * (8 + Math.abs(this.vx));
      legSwing = Math.sin(this.legPhase) * 0.55;
      bodyY = Math.abs(Math.cos(this.legPhase)) * 0.05;
    } else {
      bodyY = Math.sin(this.t * 1.7) * 0.03;
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
// Kamsa — gate 09's Warden
// ---------------------------------------------------------------------------

/**
 * An overbuilt, armoured human tyrant, per `docs/research/villain-roster.md`
 * — not a monster. His entry's own kit-shape call is explicit against
 * `Charger`: "a heavy armored king is the opposite of that class's speed
 * identity." The kit is Bakasura's and Kumbhakarna's shape instead — `Enemy`
 * directly, two committed moves picked by range — with the mace and the
 * shoulder-chains supplying the two bands, the same relationship
 * Kumbhakarna's smash/sweep pair has to his own reach.
 *
 * No phase-transition: no boon, no reveal, matching his entry's "not
 * unmasked as something else." Escalation is the ordinary
 * `enrageAt`/`enrageSpeedMul`/`enrageWindupMul` every Warden already
 * carries, and — uniquely on the roster so far — it fires no dialogue-beat
 * hook at all. His respectful-treatment note declines one outright: no
 * version of a line about the infanticide backstory avoids staging it as
 * spectacle, so the armour and the mace carry the backstory instead, worn
 * rather than narrated.
 */
/** The mace's idle hang — `buildKamsa`'s grip is built laid along +X, so a rest rotation is what brings the head down at his side. */
const REST_MACE = -1.3;

export class Kamsa extends Enemy {
  static stats = KAMSA;

  constructor(level, ctx, x, y, cfg = KAMSA, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildKamsa(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.phase = 0;
    this.cooldown = rand(cfg.cooldown[0], cfg.cooldown[1]);
    this.chargeHitSet = new Set();
    this.leavesCorpse = true;
    this.enraged = false;
  }

  /** Always, for a hostile Kamsa. Mirrors `Kumbhakarna._canCommit`. */
  _canCommit() {
    return true;
  }

  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.enraged && this.hp <= this.maxHp * this.cfg.enrageAt) this._enrage();
    return landed;
  }

  /**
   * No rig-swap, no dialogue beat — per his entry, escalation is the two
   * wind-ups tightening (`enrageWindupMul`) and the approach quickening
   * (`enrageSpeedMul`), the same locally-implemented call `Bakasura._enrage`
   * makes for its own tier-2 kit.
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

    const S = this.cfg.smash;
    const L = this.cfg.lash;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;
    const windupMul = this.enraged ? this.cfg.enrageWindupMul : 1;
    const speed = this.cfg.speed * (this.enraged ? this.cfg.enrageSpeedMul : 1);

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

        // The smash takes the close band; the lash takes the wider one out
        // to chain length — the same range-picked pair Kumbhakarna's
        // smash/sweep and Bakasura's grab/tackle already use, and the same
        // reason: holding station just outside the close move must not be a
        // fight he cannot answer.
        if (this._canCommit() && this.cooldown <= 0 && this.grounded) {
          if (dist < S.range) {
            this.state = 'smashTelegraph';
            this.phase = S.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          } else if (dist < L.range) {
            this.state = 'lashTelegraph';
            this.phase = L.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            // The rattle: an audible tell before the chains ever move,
            // per his entry's explicit call.
            this.ctx.audio?.play('growl');
            break;
          }
        }

        const want = dist > this.cfg.stopAt ? this.facing * speed : 0;
        const ahead = this.x + Math.sign(want || this.facing) * 1.1;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'smashTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > S.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'smash';
          this.phase = S.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('slam');
          this.ctx.shake?.(S.shake);
          this.ctx.vfx.dust(this.x + this.facing * 1.8, this.y, 8);
        }
        break;
      }

      case 'lashTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > L.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'lash';
          this.phase = L.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('pounce');
          this.ctx.shake?.(L.shake);
        }
        break;
      }

      case 'smash':
      case 'lash': {
        this.phase -= dt;
        if (this.phase <= 0) {
          const done = this.state === 'smash' ? S : L;
          this.state = 'recover';
          this.phase = done.recover;
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

  /** Both boxes are forward-biased — see `KAMSA.smash`'s own note. */
  attackBox() {
    if (this.dead) return null;
    const A = this.state === 'smash' ? this.cfg.smash : this.state === 'lash' ? this.cfg.lash : null;
    if (!A) return null;
    return this.facing >= 0
      ? { x0: this.x - A.reachBack, x1: this.x + A.reach, y0: this.y, y1: this.y + this.hh * 2 }
      : { x0: this.x - A.reach, x1: this.x + A.reachBack, y0: this.y, y1: this.y + this.hh * 2 };
  }

  currentAttackDamage() {
    if (this.state === 'smash') return { damage: this.cfg.smash.damage, knock: this.cfg.smash.knock };
    if (this.state === 'lash') return { damage: this.cfg.lash.damage, knock: this.cfg.lash.knock };
    return null;
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const S = this.cfg.smash;
    const L = this.cfg.lash;
    const windupMul = this.enraged ? this.cfg.enrageWindupMul : 1;
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    // Rest hang: the grip is built laid along +X, so a rotation is what
    // brings the head down into a natural hang — the same job Kumbhakarna's
    // own `REST_CLUB` does for his club.
    let maceZ = REST_MACE;
    let glow = 0;

    if (this.state === 'smashTelegraph') {
      const u = 1 - this.phase / (S.windup * windupMul);
      bodyZ = -0.1 - u * 0.14;
      bodyY = -0.06 - u * 0.06;
      armZ = 0.3 + u * 1.0;
      maceZ = lerp(REST_MACE, 1.6, u);
      glow = 0.3 + u * 0.7;
    } else if (this.state === 'smash') {
      const u = clamp(1 - this.phase / S.active, 0, 1);
      bodyZ = lerp(0.26, 0.06, u);
      armZ = lerp(-1.0, -0.4, u);
      maceZ = lerp(1.6, -2.0, u);
      bodyY = -0.1;
      glow = 1;
    } else if (this.state === 'lashTelegraph') {
      // The chains rattle rather than travel — a small, fast shudder on the
      // shoulder chain-links, distinct from the mace's own wind, so the
      // hunter reads which weapon is coming before either commits.
      const u = 1 - this.phase / (L.windup * windupMul);
      bodyZ = -0.08 - u * 0.1;
      armZ = -0.2 - u * 0.4;
      glow = 0.3 + u * 0.7;
      for (const link of this.n.chainLinks) link.position.x = 0.28 + Math.sin(this.t * 40) * u * 0.02;
    } else if (this.state === 'lash') {
      const u = clamp(1 - this.phase / L.active, 0, 1);
      bodyZ = lerp(-0.18, 0.04, u);
      armZ = lerp(0.6, 0.1, u);
      glow = 1;
    } else if (this.state === 'recover') {
      const total = Math.max(S.recover, L.recover);
      const u = clamp(this.phase / total, 0, 1);
      bodyZ = -0.1 * u;
      bodyY = -0.06 * u;
    } else if (this.state === 'hurt') {
      bodyZ = 0.18;
    } else if (Math.abs(this.vx) > 0.3) {
      bodyY = Math.abs(Math.sin(this.t * 5)) * 0.03;
    } else {
      bodyY = Math.sin(this.t * 1.2) * 0.025;
    }

    n.torso.rotation.z = lerp(n.torso.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, n.baseY + bodyY, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, -armZ * 0.3, k);
    n.mace.rotation.z = lerp(n.mace.rotation.z, maceZ, k);

    for (const key of ['L', 'R']) {
      const e = n['eye' + key];
      e.material.transparent = true;
      e.material.opacity = lerp(e.material.opacity, 0.3 + glow * 0.5, k);
    }
    n.maceGlow.material.opacity = lerp(n.maceGlow.material.opacity, 0.2 + glow * 0.6, k);
  }
}

// ---------------------------------------------------------------------------
// Putana
// ---------------------------------------------------------------------------

/**
 * Gate 10's Warden. Extends `Enemy` directly, the same chase → telegraph →
 * attack → recover skeleton `Kamsa` already reskins — not `Raakchyas`: her
 * entry is explicit that she "closes distance as false hospitality rather
 * than aggression", not a speed-identity chaser. Two moves picked by range,
 * and a two-rig phase-transition reveal, the roster's fourth after Taraka,
 * Shurpanakha and Kumbhakarna — implemented Warden-locally exactly like
 * `Shurpanakha`'s own reveal, not routed through the bespoke `Boss` state
 * machine (tier 3 was never in play for her).
 */
export class Putana extends Enemy {
  static stats = PUTANA;

  constructor(level, ctx, x, y, cfg = PUTANA, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildPutana(skin);
    this.forms = this.root.userData.forms;
    this.form = 'disguised';
    this.n = this.forms.disguised.nodes;
    this.finishSetup();
    this.phase = 0;
    this.cooldown = rand(cfg.cooldown[0], cfg.cooldown[1]);
    this.chargeHitSet = new Set();
    this.leavesCorpse = true;
    /** Fires once, at the HP threshold — see `takeHit` below. */
    this.phaseFired = false;
  }

  /** Always, for a hostile Putana. Mirrors `Kamsa._canCommit`. */
  _canCommit() {
    return true;
  }

  /**
   * The reveal. An HP threshold firing a paged, held story beat
   * (`Game.firePhaseBeat`), the same machinery Taraka's curse-reveal built
   * and Shurpanakha's own reveal already consumes — she is its fourth
   * consumer. Her entry asks this beat to land, unlike Kamsa's, which
   * declines one outright: the source hands her a genuine redemptive angle,
   * and the reveal is where it has a mechanical home.
   */
  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.phaseFired && this.hp <= this.maxHp * this.cfg.phaseAt) {
      this.phaseFired = true;
      this.ctx.firePhaseBeat?.(() => this._reveal());
    }
    return landed;
  }

  /** Swaps the visible rig and the node table `_animate`/`syncRig` read. */
  _reveal() {
    this.form = 'revealed';
    this.forms.disguised.root.visible = false;
    this.forms.revealed.root.visible = true;
    this.n = this.forms.revealed.nodes;
    this.ctx.audio?.play('illusionBreak');
    this.syncRig();
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const E = this.cfg.embrace;
    const B = this.cfg.breath;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;
    const windupMul = this.phaseFired ? this.cfg.phaseWindupMul : 1;

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

        // The embrace takes the close band; the breath takes the wider one,
        // the same range-picked pair Kamsa's smash/lash already uses so
        // holding station just outside the embrace is never a free read.
        if (this._canCommit() && this.cooldown <= 0 && this.grounded) {
          if (dist < E.range) {
            this.state = 'embraceTelegraph';
            this.phase = E.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          } else if (dist < B.range) {
            this.state = 'breathTelegraph';
            this.phase = B.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          }
        }

        const want = dist > this.cfg.stopAt ? this.facing * this.cfg.speed : 0;
        const ahead = this.x + Math.sign(want || this.facing) * 1.0;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'embraceTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > E.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'embrace';
          this.phase = E.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('pounce');
          this.ctx.shake?.(E.shake);
        }
        break;
      }

      case 'breathTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > B.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'breath';
          this.phase = B.active;
          this.ctx.audio?.play('wispShot');
          this.ctx.shake?.(B.shake);
          // The exhale, spat a fixed distance ahead rather than aimed at
          // wherever the player is standing — a cloud, not a homing bolt.
          // `shockwaveFromBoss` is Shakuni's own ground-telegraph-then-
          // resolve zone, reused here rather than a new hazard-patch
          // subsystem; see `docs/DECISIONS.md`.
          const cx = this.x + this.facing * B.reach;
          const cy = this.level.groundAt(cx) + 0.4;
          this.ctx.vfx.groundBurst(cx, cy, B.radius * 0.6);
          this.ctx.shockwaveFromBoss(cx, cy, { radius: B.radius, damage: B.damage, knock: 0 });
        }
        break;
      }

      case 'embrace': {
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'recover';
          this.phase = E.recover;
        }
        break;
      }

      case 'breath': {
        this.phase -= dt;
        if (this.phase <= 0) {
          this.state = 'recover';
          this.phase = B.recover;
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

  /** Forward-biased, the same reason Kamsa's smash/lash boxes both are. */
  attackBox() {
    if (this.dead) return null;
    const A = this.state === 'embrace' ? this.cfg.embrace : null;
    if (!A) return null;
    return this.facing >= 0
      ? { x0: this.x - A.reachBack, x1: this.x + A.reach, y0: this.y, y1: this.y + this.hh * 2 }
      : { x0: this.x - A.reach, x1: this.x + A.reachBack, y0: this.y, y1: this.y + this.hh * 2 };
  }

  currentAttackDamage() {
    if (this.state === 'embrace') return { damage: this.cfg.embrace.damage, knock: this.cfg.embrace.knock };
    return null;
  }

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0002, dt);
    const E = this.cfg.embrace;
    const B = this.cfg.breath;
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    let glow = 0;
    let mouthGlow = this.form === 'revealed' ? 0.9 : 0.15;

    if (this.state === 'embraceTelegraph') {
      // Arms spreading in an inviting gesture — the false hospitality her
      // entry names, before a committed grab.
      const u = 1 - this.phase / (E.windup * (this.phaseFired ? this.cfg.phaseWindupMul : 1));
      bodyZ = -0.06 - u * 0.08;
      bodyY = -0.04 - u * 0.04;
      armZ = -0.4 - u * 0.8;
      glow = 0.3 + u * 0.7;
    } else if (this.state === 'embrace') {
      const u = clamp(1 - this.phase / E.active, 0, 1);
      bodyZ = lerp(-0.2, 0.08, u);
      armZ = lerp(0.6, -0.2, u);
      glow = 1;
    } else if (this.state === 'breathTelegraph') {
      const u = 1 - this.phase / (B.windup * (this.phaseFired ? this.cfg.phaseWindupMul : 1));
      bodyZ = 0.08 + u * 0.1;
      bodyY = -0.03 - u * 0.03;
      glow = 0.3 + u * 0.7;
      mouthGlow = lerp(mouthGlow, this.form === 'revealed' ? 1 : 0.6, u);
    } else if (this.state === 'breath') {
      bodyZ = 0.16;
      mouthGlow = this.form === 'revealed' ? 1 : 0.7;
    } else if (this.state === 'recover') {
      const total = Math.max(E.recover, B.recover);
      const u = clamp(this.phase / total, 0, 1);
      bodyZ = -0.06 * u;
      bodyY = -0.04 * u;
    } else if (this.state === 'hurt') {
      bodyZ = 0.2;
    } else if (Math.abs(this.vx) > 0.3) {
      bodyY = Math.abs(Math.sin(this.t * 5)) * 0.03;
    } else {
      bodyY = Math.sin(this.t * 1.4) * 0.025;
    }

    n.torso.rotation.z = lerp(n.torso.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, n.baseY + bodyY, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, -armZ * 0.3, k);

    n.mouth.material.transparent = true;
    n.mouth.material.opacity = lerp(n.mouth.material.opacity, mouthGlow, k);

    for (const key of ['L', 'R']) {
      const e = n['eye' + key];
      e.material.transparent = true;
      e.material.opacity = lerp(e.material.opacity, (this.form === 'revealed' ? 0.4 : 0.3) + glow * 0.5, k);
      const g = n['handGlow' + key];
      g.material.opacity = lerp(g.material.opacity, 0.2 + glow * 0.8, k);
    }
  }
}

// ---------------------------------------------------------------------------
// Projectiles
// ---------------------------------------------------------------------------

const boltGeo = new THREE.CapsuleGeometry(0.14, 0.5, 4, 8);

/**
 * The Court of Blades card — Shakuni's fan, and the one projectile in the game
 * that is not a bolt of light.
 *
 * A plane rather than a box, and double-sided, because a card *is* a plane:
 * spinning about its own face normal it flashes edge-on and vanishes for a
 * frame, which no capsule can do and which is most of what reads as "thrown
 * card" rather than "rectangle in flight".
 *
 * Built at module load, so it costs nothing from the seeded stream. Its
 * proportions are the reference art's 250×400.
 */
const cardGeo = new THREE.PlaneGeometry(0.30, 0.48);

export class Bolt {
  /**
   * @param {'player'|'enemy'} team
   * @param {'bolt'|'card'} kind - the shape it flies as. Purely visual: the
   *   hitbox is `radius` either way, and `update`/`consumeHit` do not branch on
   *   it. Deliberately so — a projectile that hits differently depending on how
   *   it is drawn is a bug waiting to be reported as unfairness.
   */
  constructor(ctx, x, y, dx, dy, { team, speed, damage, life, pierce = 0, color, radius = 0.42, kind = 'bolt' }) {
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

    this.kind = kind;
    this.spin = 0;

    // Exactly one Group, two Meshes and two Materials in both shapes, and that
    // symmetry is load-bearing rather than tidy: three.js draws four
    // `Math.random()` values per object for its UUID and the suite seeds that
    // stream globally, so a card that allocated one object more than a bolt
    // would re-roll every enemy's jitter behind it and send a fixed seed down
    // a different run. The card differs in geometry and material settings,
    // never in object count.
    this.root = new THREE.Group();
    const card = kind === 'card';
    const geo = card ? cardGeo : boltGeo;

    const core = new THREE.Mesh(
      geo,
      card
        ? new THREE.MeshBasicMaterial({
            // Ivory-lit rather than the projectile's own crimson: the card's
            // face is art and the crimson lives in its emblem, so tinting the
            // whole quad red would throw the reference art away.
            color: 0xf3ead6,
            map: assets().get('shakuni.card'),
            side: THREE.DoubleSide,
            transparent: true,
            fog: false,
            toneMapped: false,
          })
        : new THREE.MeshBasicMaterial({ color, fog: false, toneMapped: false })
    );
    if (!card) core.rotation.z = -Math.PI / 2;
    this.root.add(core);
    this.core = core;

    const halo = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: card ? 0.42 : 0.3,
        side: card ? THREE.DoubleSide : THREE.FrontSide,
        fog: false,
        depthWrite: false,
        blending: card ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped: false,
      })
    );
    if (!card) halo.rotation.z = -Math.PI / 2;
    halo.scale.setScalar(card ? 1.5 : 2.1);
    this.root.add(halo);
    this.halo = halo;

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

    if (this.kind === 'card') {
      // Spun about its own face normal, and wobbled about the travel axis so
      // it periodically turns edge-on. Driven off elapsed time, never off
      // `Math.random` — a projectile that drew from the seeded stream every
      // frame it was alive would make the number of cards in the air change
      // the behaviour of every enemy behind them.
      this.spin += dt * 11;
      this.core.rotation.z = this.spin;
      this.core.rotation.x = Math.sin(this.spin * 0.6) * 0.9;
      this.halo.rotation.z = this.spin;
    }

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
    // A card tears rather than bursting: the spark above stays exactly as it
    // was — its particle count is drawn from the seeded stream and must not
    // move — and the difference is a flat gold flash, which costs no draws at
    // all because a pooled flash takes none.
    if (this.kind === 'card') this.ctx.vfx.cardImpact(this.x, this.y);
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

// ---------------------------------------------------------------------------
// Narakasura
// ---------------------------------------------------------------------------

/** The spear hangs butt-down at rest; the grip is built laid along +X. */
const REST_SPEAR = -1.15;

/**
 * Gate 11's Warden, king of Pragjyotishapura. Extends `Enemy` directly — the
 * same chase → telegraph → attack → recover skeleton `Kamsa` and `Putana`
 * already reskin, and explicitly *not* `Charger`: his entry rules that out,
 * because a territorial king holds ground rather than speed-chasing. The
 * lower `speed` in his config is where that call becomes something the hunter
 * can feel.
 *
 * Two moves picked by range, the roster's standard pair:
 *
 * - **thrust** — the close, committed spear lunge, telegraphed by the stolen
 *   earrings flaring amber. Longer reach than any mace on the roster, which is
 *   what makes "there is a spear in this fight" legible from outside its range.
 * - **fissure** — the mid/long ground-slam, cracking stone toward the hunter.
 *   Resolved through `ctx.shockwaveFromBoss`, the shared ground-telegraph-then-
 *   resolve zone Shakuni's die and Putana's breath already spend. Reused, not
 *   reinvented: a lingering damage-over-time patch would be a new combat
 *   subsystem, and nothing about this gate justifies one.
 *
 * No rig swap and no second form — he is a tyrant king defeated in battle, not
 * unmasked as something else. What he does have, unlike Kamsa, is a *voice* on
 * the enrage threshold: `firePhaseBeat` pages a held, player-advanced beat
 * foreshadowing the coming liberation. His roster entry commits to that
 * explicitly, on the grounds that the mass-liberation resolution is the
 * strongest fit anywhere on the roster for the campaign's own release-focused
 * ending — so the theme gets a mechanical home rather than a closing note.
 */
export class Narakasura extends Enemy {
  static stats = NARAKASURA;

  constructor(level, ctx, x, y, cfg = NARAKASURA, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildNarakasura(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.phase = 0;
    this.cooldown = rand(cfg.cooldown[0], cfg.cooldown[1]);
    this.chargeHitSet = new Set();
    this.leavesCorpse = true;
    this.enraged = false;
    // Held while the enrage beat is paging, so the fight does not continue
    // under a dialogue window the player is still reading.
    this.speaking = false;
  }

  /** Always, for a hostile Narakasura. Mirrors `Kamsa._canCommit`. */
  _canCommit() {
    return !this.speaking;
  }

  takeHit(hit) {
    const landed = super.takeHit(hit);
    if (landed && !this.dead && !this.enraged && this.hp <= this.maxHp * this.cfg.enrageAt) this._enrage();
    return landed;
  }

  /**
   * The threshold, with a line on it. `firePhaseBeat` is `Game`'s own
   * player-advanced pager — the same one Taraka's curse-reveal uses — and it
   * falls straight through to `onComplete` for a gate that authors no
   * `at: 'phase'` beat, so this is safe for any future reskin that wants the
   * kit without the speech.
   */
  _enrage() {
    this.enraged = true;
    this.ctx.audio?.play('enrage');
    // Drop out of whatever was wound up. Speaking through a committed thrust
    // would leave the hitbox live behind the window.
    if (this.state !== 'dying') {
      this.state = 'idle';
      this.vx = 0;
    }
    this.speaking = true;
    this.ctx.firePhaseBeat?.(() => {
      this.speaking = false;
      this.cooldown = rand(this.cfg.cooldown[0], this.cfg.cooldown[1]);
    });
    if (!this.ctx.firePhaseBeat) this.speaking = false;
  }

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this._flash(dt);

    if (this.state === 'dying') return this._dieAnim(dt);
    if (this.spawnT > 0) this._spawnAnim(dt);

    const T = this.cfg.thrust;
    const F = this.cfg.fissure;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const canSee = dist < this.cfg.chaseRange && Math.abs(player.y - this.y) < 6;
    const windupMul = this.enraged ? this.cfg.enrageWindupMul : 1;
    const speed = this.cfg.speed * (this.enraged ? this.cfg.enrageSpeedMul : 1);

    if (this.stagger > 0) {
      this.stagger -= dt;
      if (this.stagger <= 0 && this.state === 'hurt') this.state = 'idle';
    }

    // Frozen mid-sentence. Gravity and collision still run below, so he does
    // not hang in the air if the beat opens while he is falling.
    if (this.speaking && this.state !== 'hurt') {
      this.vx = damp(this.vx, 0, 0.0005, dt);
      this.applyGravity(dt, PHYS.gravity);
      this.moveAndCollide(dt);
      this._animate(dt);
      this.syncRig();
      return;
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

        // The thrust takes the close band, the fissure everything out to its
        // own range — the same range-picked pair Kamsa's smash/lash and
        // Kumbhakarna's smash/sweep use, for the same reason: standing just
        // outside the close move must not be a fight he cannot answer.
        if (this._canCommit() && this.cooldown <= 0 && this.grounded) {
          if (dist < T.range) {
            this.state = 'thrustTelegraph';
            this.phase = T.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          } else if (dist < F.range) {
            this.state = 'fissureTelegraph';
            this.phase = F.windup * windupMul;
            this.vx = 0;
            this.chargeHitSet.clear();
            this.ctx.audio?.play('growl');
            break;
          }
        }

        const want = dist > this.cfg.stopAt ? this.facing * speed : 0;
        const ahead = this.x + Math.sign(want || this.facing) * 1.1;
        if (want !== 0 && !this.level.hasFloorAhead(ahead, this.y)) this.vx = 0;
        else this.vx = damp(this.vx, want, 0.0008, dt);
        break;
      }

      case 'thrustTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > T.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'thrust';
          this.phase = T.active;
          this.chargeHitSet.clear();
          this.ctx.audio?.play('slam');
          this.ctx.shake?.(T.shake);
        }
        break;
      }

      case 'fissureTelegraph': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        if (this.phase > F.windup * windupMul * 0.35) this.faceToward(player.x);
        if (this.phase <= 0) {
          this.state = 'fissure';
          this.phase = F.active;
          this.ctx.audio?.play('slam');
          this.ctx.shake?.(F.shake);
          // The crack opens a fixed distance ahead rather than under the
          // hunter — a fissure travelling out from where he struck, not a
          // homing hit. Standing still is what it punishes.
          const cx = this.x + this.facing * F.reach;
          const cy = this.level.groundAt(cx) + 0.4;
          this.ctx.vfx.groundBurst(cx, cy, F.radius * 0.6);
          this.ctx.vfx.dust(this.x + this.facing * 1.0, this.y, 10);
          this.ctx.shockwaveFromBoss(cx, cy, { radius: F.radius, damage: F.damage, knock: 0 });
        }
        break;
      }

      case 'thrust':
      case 'fissure': {
        this.phase -= dt;
        if (this.phase <= 0) {
          const done = this.state === 'thrust' ? T : F;
          this.state = 'recover';
          this.phase = done.recover;
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
   * Only the thrust has a box. The fissure does its damage through
   * `shockwaveFromBoss`'s own resolve zone, so giving it a body box too would
   * hit the hunter twice for one telegraph.
   */
  attackBox() {
    if (this.dead || this.state !== 'thrust') return null;
    const A = this.cfg.thrust;
    return this.facing >= 0
      ? { x0: this.x - A.reachBack, x1: this.x + A.reach, y0: this.y, y1: this.y + this.hh * 2 }
      : { x0: this.x - A.reach, x1: this.x + A.reachBack, y0: this.y, y1: this.y + this.hh * 2 };
  }

  /**
   * `{ damage, knock }`, or null when nothing is live — the contract
   * `Game.attackInfo` reads, the same shape `Kamsa` and `Putana` return.
   *
   * Returning a bare number here instead of the pair is what sent the
   * player's HP to `NaN` the first time this class was wired up:
   * `attackInfo` reads `.damage` off whatever it is handed, a number has no
   * such property, and `hp -= undefined` is silent. The 223-row suite stayed
   * green through it — nothing in `?sim` drives a hunter into gate 11's
   * Warden — and it took a screenshot with `NaN/120` in the corner to find.
   */
  currentAttackDamage() {
    if (this.state === 'thrust') return { damage: this.cfg.thrust.damage, knock: this.cfg.thrust.knock };
    return null;
  }

  _animate(dt) {
    const n = this.n;
    const k = Math.min(1, dt * 14);
    const T = this.cfg.thrust;
    const F = this.cfg.fissure;
    const windupMul = this.enraged ? this.cfg.enrageWindupMul : 1;
    let bodyZ = 0;
    let bodyY = 0;
    let armZ = 0;
    let spearZ = REST_SPEAR;
    let glow = 0;

    if (this.state === 'thrustTelegraph') {
      // Draws back and levels the spear — the wind-up reads as *aiming*, not
      // as a raised overhead, so it never reads as Kamsa's mace two gates back.
      const u = 1 - this.phase / (T.windup * windupMul);
      bodyZ = 0.08 + u * 0.12;
      bodyY = -0.04 - u * 0.05;
      armZ = -0.15 - u * 0.5;
      spearZ = lerp(REST_SPEAR, -0.05, u);
      glow = 0.3 + u * 0.7;
    } else if (this.state === 'thrust') {
      const u = clamp(1 - this.phase / T.active, 0, 1);
      bodyZ = lerp(-0.22, -0.04, u);
      armZ = lerp(-0.95, -0.55, u);
      spearZ = lerp(-0.05, 0.06, u);
      bodyY = -0.08;
      glow = 1;
    } else if (this.state === 'fissureTelegraph') {
      // Spear raised butt-first, both hands, before it comes down. A
      // deliberately *vertical* wind against the thrust's horizontal one, so
      // which move is coming is legible from the silhouette alone.
      const u = 1 - this.phase / (F.windup * windupMul);
      bodyZ = -0.06 - u * 0.16;
      bodyY = u * 0.06;
      armZ = 0.3 + u * 0.95;
      spearZ = lerp(REST_SPEAR, 1.5, u);
      glow = 0.3 + u * 0.7;
    } else if (this.state === 'fissure') {
      const u = clamp(1 - this.phase / F.active, 0, 1);
      bodyZ = lerp(0.3, 0.08, u);
      armZ = lerp(-0.9, -0.3, u);
      spearZ = lerp(1.5, -1.9, u);
      bodyY = -0.12;
      glow = 1;
    } else if (this.state === 'recover') {
      const total = Math.max(T.recover, F.recover);
      const u = clamp(this.phase / total, 0, 1);
      bodyZ = -0.1 * u;
      bodyY = -0.05 * u;
    } else if (this.state === 'hurt') {
      bodyZ = 0.18;
    } else if (Math.abs(this.vx) > 0.3) {
      bodyY = Math.abs(Math.sin(this.t * 4.4)) * 0.03;
    } else {
      bodyY = Math.sin(this.t * 1.1) * 0.025;
    }

    n.torso.rotation.z = lerp(n.torso.rotation.z, bodyZ, k);
    n.body.position.y = lerp(n.body.position.y, n.baseY + bodyY, k);
    n.shoulderR.rotation.z = lerp(n.shoulderR.rotation.z, armZ, k);
    n.shoulderL.rotation.z = lerp(n.shoulderL.rotation.z, -armZ * 0.3, k);
    n.spear.rotation.z = lerp(n.spear.rotation.z, spearZ, k);

    for (const key of ['L', 'R']) {
      const e = n['eye' + key];
      e.material.transparent = true;
      e.material.opacity = lerp(e.material.opacity, 0.3 + glow * 0.5, k);
    }
    // The tell lives on the earrings, and only there. The ember cracks below
    // hold a constant low glow on purpose — a hunter must never have to tell
    // two oranges apart to read an incoming attack.
    n.spearGlow.material.opacity = lerp(n.spearGlow.material.opacity, glow * 0.8, k);
  }
}
