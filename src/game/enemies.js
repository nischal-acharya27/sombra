// Shadow beasts, wisps, and the projectiles both sides throw.
//
// Design rule shared by everything in this file: **no passive contact damage.**
// Touching an enemy is safe; only a committed, telegraphed action hurts. In a
// game where your own attacks lunge you into the enemy, contact damage means
// the correct play is never to attack — and it makes crowding an unavoidable
// tax rather than a positioning mistake.

import * as THREE from 'three';
import { Actor, boxHit } from './actor.js';
import { buildBeast, buildWisp } from '../render/models.js';
import { BEAST, WISP, PHYS, JUGGLE } from './config.js';
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
// Shadow beast
// ---------------------------------------------------------------------------

/**
 * The quadruped grunt — and, pointed at a different target and wearing a
 * different skin, the shadow the hunter raises from one. See `Shadow` in
 * game/shadow.js.
 *
 * Every number below is read from `this.cfg` rather than from `BEAST` directly,
 * which is what makes that reuse a subclass and not a copy. Behaviour that an
 * ally must *not* share is behind `_canCommit`.
 */
export class Beast extends Enemy {
  constructor(level, ctx, x, y, cfg = BEAST, skin = null) {
    super(level, ctx, cfg, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.root = buildBeast(skin);
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.pounceCd = rand(0.4, 1.2);
    this.phase = 0; // pounce sub-phase timer
    this.homeX = x;
    this.legPhase = rand(0, 6);
    /** A beast's body is claimable. Wisps and the Guardian leave nothing. */
    this.leavesCorpse = true;
  }

  /**
   * Whether it may commit to a pounce at all.
   *
   * Always, for a beast. The shadow overrides it: an ally trailing the hunter
   * is running this same chase state with the hunter as its target, and without
   * this gate it would pounce them.
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
        // shadow uses the same rule to keep out from under the hunter's feet.
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
// Wisp
// ---------------------------------------------------------------------------

export class Wisp extends Enemy {
  constructor(level, ctx, x, y) {
    super(level, ctx, WISP, { x, y, hw: WISP.hw, hh: WISP.hh, maxHp: WISP.hp });
    this.root = buildWisp();
    this.n = this.root.userData.nodes;
    this.finishSetup();
    this.baseY = y;
    this.homeX = x;
    this.shootCd = rand(0.8, WISP.shoot.interval);
    this.windup = 0;
    this.driftPhase = rand(0, 7);
  }

  /** Wisps float: they ignore gravity and the level entirely. */
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
      let want = dist > WISP.keepDistance + 1.5 ? Math.sign(dx) * WISP.speed
        : dist < WISP.keepDistance - 1.5 ? -Math.sign(dx) * WISP.speed
        : Math.sin(this.t * 0.8) * WISP.speed * 0.4;
      // Leashed to where it spawned. Without this a wisp will happily follow
      // the player over the edge and hound them all the way down the pit,
      // which turns a missed jump into an unrecoverable one.
      if (this.x < this.homeX - WISP.leash) want = Math.max(want, WISP.speed * 0.6);
      if (this.x > this.homeX + WISP.leash) want = Math.min(want, -WISP.speed * 0.6);
      this.vx = damp(this.vx, want, 0.002, dt);

      // Same for altitude: it tracks the player but never descends into the
      // void after them.
      const hover = Math.sin(this.t * WISP.hover.freq + this.driftPhase) * WISP.hover.amp;
      const targetY = clamp(player.y + WISP.hoverAbove + hover, this.baseY - WISP.descend, this.baseY + 5);
      this.vy = damp(this.vy, (targetY - this.y) * 2.2, 0.004, dt);

      this.shootCd -= dt;
      if (this.shootCd <= 0 && dist < 16 && this.windup <= 0) {
        this.windup = WISP.shoot.windup;
      }
      if (this.windup > 0) {
        this.windup -= dt;
        this.vx *= 0.3;
        if (this.windup <= 0) {
          const a = Math.atan2(player.y + 1 - this.y, player.x - this.x);
          this.ctx.spawnEnemyBolt(this.x, this.y, Math.cos(a), Math.sin(a));
          this.shootCd = WISP.shoot.interval * rand(0.8, 1.25);
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
    return null; // wisps threaten only at range
  }

  _animate(dt) {
    const n = this.n;
    n.ring.rotation.y += dt * 1.5;
    n.ring.rotation.z = Math.sin(this.t * 0.9) * 0.3;
    const charging = this.windup > 0;
    const pulse = charging
      ? 1 + (1 - this.windup / WISP.shoot.windup) * 0.9
      : 1 + Math.sin(this.t * 3) * 0.09;
    n.core.scale.setScalar(pulse);
    n.halo.scale.setScalar(1 + Math.sin(this.t * 2.2) * 0.12 + (charging ? 0.5 : 0));
    n.core.material.color.setHex(charging ? P.crimson : P.wispCore);
    n.halo.material.opacity = charging ? 0.55 : 0.3;
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
