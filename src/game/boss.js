// The Gate Guardian.
//
// The fight has one rule and everything else follows from it: **the Guardian's
// body is harmless, and every source of damage is an action it commits to,
// announced in advance by the core in its chest flaring.** A boss this wide
// with contact damage is unwinnable at melee range, because the player's own
// attack lunge pushes them into it — the correct play becomes "never attack",
// which is not a fight. Making all threat telegraphed also means the fight is
// readable: you lose because you missed the tell, not because you touched it.

import * as THREE from 'three';
import { Actor } from './actor.js';
import { buildGuardian } from '../render/models.js';
import { GUARDIAN, PHYS } from './config.js';
import { P } from '../render/palette.js';
import { clamp, damp, lerp, rand, pick } from '../engine/mathx.js';

const WHITE = new THREE.Color(0xffffff);

export class Guardian extends Actor {
  constructor(level, ctx, x, y, cfg = GUARDIAN) {
    super(level, { x, y, hw: cfg.hw, hh: cfg.hh, maxHp: cfg.hp });
    this.ctx = ctx;
    this.cfg = cfg;

    this.root = buildGuardian();
    this.n = this.root.userData.nodes;
    this.mats = [];
    this.root.traverse((o) => {
      if (!o.isMesh || !o.material || o.material.isShaderMaterial) return;
      if (o === this.n.core) return; // the core is driven separately
      o.material = o.material.clone();
      if (o.material.color) this.mats.push({ mat: o.material, base: o.material.color.clone() });
    });

    this.state = 'entering';
    this.phase = 2.4;
    this.attackName = null;
    this.sub = 0;
    this.cooldown = 1.4;
    this.enraged = false;
    this.t = 0;
    this.walkPhase = 0;
    this.stagger = 0;
    this.hitFlash = 0;
    this.removeMe = false;
    this.deathT = 0;
    this.shots = 0;
    this.coreFlare = 0;
    this.hasHitThisSwing = false;
    this.chargeHitSet = new Set();
    this.facing = -1;
  }

  get alive() {
    return !this.dead;
  }

  hurtBox() {
    return { x0: this.x - 1.5, x1: this.x + 1.5, y0: this.y, y1: this.y + 3.9 };
  }

  /** Live damage box for whatever the Guardian is currently doing, or null. */
  attackBox() {
    if (this.dead) return null;
    const f = this.facing;
    switch (this.state) {
      case 'charging':
        return { x0: this.x - 1.7, x1: this.x + 1.7, y0: this.y, y1: this.y + 3.4 };
      case 'sweeping': {
        const a = this.cfg.attacks.sweep;
        if (this.sub > a.active) return null;
        const cx = this.x + f * (a.reach * 0.5 + 0.6);
        return { x0: cx - a.reach * 0.5, x1: cx + a.reach * 0.5, y0: this.y, y1: this.y + 2.9 };
      }
      default:
        return null;
    }
  }

  currentAttackDamage() {
    const a = this.cfg.attacks;
    switch (this.state) {
      case 'charging': return { damage: a.charge.damage, knock: a.charge.knock };
      case 'sweeping': return { damage: a.sweep.damage, knock: a.sweep.knock };
      default: return null;
    }
  }

  takeHit({ damage, knock = 0, fromX = 0 }) {
    if (this.dead) return false;
    this.hp -= damage;
    this.hitFlash = 0.09;
    // No knockback and no stagger from ordinary hits: a boss you can shove is
    // a boss that never gets to finish an attack. Poise is the whole point.
    if (!this.enraged && this.hp <= this.maxHp * this.cfg.enrageAt) this._enrage();
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.state = 'dying';
      this.deathT = 3.0;
      this.ctx.audio?.play('bossDeath');
      this.ctx.shake?.(0.8);
      return true;
    }
    return true;
  }

  _enrage() {
    this.enraged = true;
    this.ctx.onEnrage?.();
    this.ctx.shake?.(0.5);
    this.ctx.audio?.play('enrage');
    this.coreFlare = 1;
    this.ctx.vfx.shadowBurst(this.x, this.y + 2.2, 40, P.crimson);
  }

  // -- brain ----------------------------------------------------------------

  update(dt, player) {
    this.t += dt;
    this.hitFlash -= dt;
    this.coreFlare = Math.max(0, this.coreFlare - dt * 1.8);
    this._flash();

    if (this.state === 'dying') return this._die(dt, player);

    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    const speedMul = this.enraged ? this.cfg.enrageSpeedMul : 1;
    const A = this.cfg.attacks;

    switch (this.state) {
      case 'entering': {
        this.phase -= dt;
        this.vx = 0;
        if (this.phase <= 0) this.state = 'idle';
        break;
      }

      case 'idle': {
        this.faceToward(player.x);
        this.cooldown -= dt;
        // Close the gap, but stop at melee spacing rather than standing on top
        // of the player.
        const want = dist > 5.5 ? Math.sign(dx) * this.cfg.speed * speedMul
          : dist < 3.2 ? -Math.sign(dx) * this.cfg.speed * 0.5
          : 0;
        this.vx = damp(this.vx, want, 0.002, dt);
        if (this.cooldown <= 0) this._chooseAttack(dist);
        break;
      }

      case 'telegraph': {
        // Planted, core flaring, no tracking in the last third — committing to
        // a direction is what makes dodging possible.
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0001, dt);
        const total = this._windupTime();
        if (this.phase > total * 0.35) this.faceToward(player.x);
        this.coreFlare = clamp(1 - this.phase / total, 0, 1);
        if (this.phase <= 0) this._commit(player);
        break;
      }

      case 'charging': {
        this.sub -= dt;
        this.vx = this.facing * A.charge.speed * speedMul;
        const hit = this.moveAndCollide(dt);
        if (this.sub <= 0 || hit.wall) {
          this.state = 'recover';
          this.phase = A.charge.recover;
          this.chargeHitSet.clear();
          if (hit.wall) {
            this.ctx.shake?.(0.5);
            this.ctx.vfx.groundBurst(this.x + this.facing * 1.5, this.y, 1.2);
            this.ctx.audio?.play('slam');
            this.phase += 0.5; // a missed charge is a real punish window
          }
        }
        this._trailDust();
        this._animate(dt);
        this.syncRig();
        return;
      }

      case 'leaping': {
        this.sub -= dt;
        this.applyGravity(dt, PHYS.gravity * 1.15);
        const hit = this.moveAndCollide(dt);
        if (hit.floor && this.sub < A.slam.rise) {
          this._slamLand();
        }
        this._animate(dt);
        this.syncRig();
        return;
      }

      case 'sweeping': {
        this.sub -= dt;
        this.vx = damp(this.vx, this.facing * 3.5, 0.001, dt);
        if (this.sub <= -0.05) {
          this.state = 'recover';
          this.phase = A.sweep.recover;
          this.hasHitThisSwing = false;
        }
        break;
      }

      case 'volley': {
        this.sub -= dt;
        this.vx = damp(this.vx, 0, 0.001, dt);
        if (this.sub <= 0 && this.shots > 0) {
          this.shots--;
          this.sub = A.volley.gap;
          const a = Math.atan2(player.y + 1 - (this.y + 2.4), player.x - this.x);
          const spread = (rand(-1, 1) * 0.09);
          this.ctx.spawnEnemyBolt(
            this.x + this.facing * 1.2,
            this.y + 2.4,
            Math.cos(a + spread),
            Math.sin(a + spread),
            { speed: A.volley.speed, damage: A.volley.damage, color: P.bossCore }
          );
          this.ctx.audio?.play('wispShot');
          this.coreFlare = 0.8;
          if (this.shots === 0) {
            this.state = 'recover';
            this.phase = A.volley.recover;
          }
        }
        break;
      }

      case 'recover': {
        this.phase -= dt;
        this.vx = damp(this.vx, 0, 0.0004, dt);
        if (this.phase <= 0) {
          this.state = 'idle';
          const [lo, hi] = this.cfg.cooldown;
          this.cooldown = rand(lo, hi) * (this.enraged ? 0.62 : 1);
        }
        break;
      }
    }

    this.applyGravity(dt, PHYS.gravity);
    this.moveAndCollide(dt);
    this._animate(dt);
    this.syncRig();
  }

  _windupTime() {
    return this.cfg.attacks[this.attackName].windup * (this.enraged ? 0.78 : 1);
  }

  _chooseAttack(dist) {
    const opts = [];
    if (dist < 7) opts.push('sweep', 'slam', 'sweep');
    if (dist >= 5 && dist < 20) opts.push('charge', 'charge');
    if (dist > 9) opts.push('volley');
    if (this.enraged) opts.push('slam', 'charge');
    this.attackName = pick(opts.length ? opts : ['charge']);
    this.state = 'telegraph';
    this.phase = this._windupTime();
    this.ctx.audio?.play('bossTell');
    this.ctx.onTelegraph?.(this.attackName);
  }

  _commit(player) {
    const A = this.cfg.attacks;
    this.coreFlare = 1;
    // One hit per committed attack, whichever attack it is.
    this.chargeHitSet.clear();
    switch (this.attackName) {
      case 'charge':
        this.state = 'charging';
        this.sub = A.charge.dur;
        this.chargeHitSet.clear();
        this.ctx.audio?.play('bossCharge');
        this.ctx.shake?.(0.18);
        break;
      case 'slam': {
        this.state = 'leaping';
        this.sub = A.slam.rise + A.slam.fall;
        this.vy = 15;
        // Lead the player so the landing is a real threat, but cap the reach
        // so it cannot cross the whole arena.
        const target = clamp(player.x - this.x, -11, 11);
        this.vx = target / (A.slam.rise + A.slam.fall) * 1.05;
        this.grounded = false;
        this.ctx.audio?.play('bossLeap');
        break;
      }
      case 'sweep':
        this.state = 'sweeping';
        this.sub = A.sweep.active;
        this.hasHitThisSwing = false;
        this.ctx.audio?.play('bossSweep');
        this.ctx.shake?.(0.14);
        break;
      case 'volley':
        this.state = 'volley';
        this.shots = A.volley.shots + (this.enraged ? 2 : 0);
        this.sub = 0;
        break;
    }
  }

  _slamLand() {
    const a = this.cfg.attacks.slam;
    this.state = 'recover';
    this.phase = a.recover;
    this.vx = 0;
    this.ctx.shockwaveFromBoss(this.x, this.y, {
      radius: a.radius * (this.enraged ? 1.2 : 1),
      damage: a.damage,
      knock: a.knock,
    });
    this.ctx.vfx.groundBurst(this.x, this.y, 2.2);
    this.ctx.vfx.shockRing(this.x, this.y, a.radius * (this.enraged ? 1.2 : 1), P.bossCore);
    this.ctx.shake?.(a.shake);
    this.ctx.audio?.play('slam');
    this.coreFlare = 1;
  }

  _trailDust() {
    if (Math.random() < 0.6) this.ctx.vfx.dust(this.x - this.facing * 1.2, this.y, 2);
  }

  _die(dt, player) {
    this.deathT -= dt;
    this.vx = damp(this.vx, 0, 0.001, dt);
    this.applyGravity(dt, PHYS.gravity);
    this.moveAndCollide(dt);

    const u = clamp(this.deathT / 3.0, 0, 1);
    // Collapse: the core dims, then the body folds and comes apart.
    this.n.core.scale.setScalar(clamp(u * 1.4, 0.05, 1.4));
    this.n.core.material.color.setHex(u > 0.5 ? P.bossCore : P.violetDeep);
    this.n.coreGlow.material.opacity = u * 0.4;

    const fold = 1 - u;
    this.n.torso.rotation.z = fold * 0.9;
    this.n.head.rotation.z = fold * 0.6;
    this.n.hipL.rotation.z = fold * 1.5;
    this.n.hipR.rotation.z = fold * 1.2;
    this.n.kneeL.rotation.z = -fold * 2.0;
    this.n.kneeR.rotation.z = -fold * 1.7;
    this.n.shoulderL.rotation.z = -fold * 1.2;
    this.n.shoulderR.rotation.z = fold * 1.4;
    this.root.position.y = this.y - fold * 0.9;

    if (Math.random() < 0.85) {
      this.ctx.vfx.emit({
        x: this.x + rand(-1.6, 1.6),
        y: this.y + rand(0.4, 3.6),
        z: rand(-1, 1),
        vx: rand(-2.5, 2.5),
        vy: rand(1, 6),
        size: rand(0.14, 0.4),
        color: Math.random() < 0.4 ? P.crimson : P.violet,
        life: rand(0.5, 1.3),
        grav: -1.2,
        drag: 1.2,
      });
    }
    if (this.deathT <= 0) this.removeMe = true;
    this.syncRigNoY();
  }

  syncRigNoY() {
    const target = this.facing > 0 ? -0.34 : Math.PI + 0.34;
    this.root.rotation.y = target;
    this.root.position.x = this.x;
  }

  _flash() {
    const f = clamp(this.hitFlash / 0.09, 0, 1);
    for (const m of this.mats) {
      if (f <= 0) {
        if (!m.mat.color.equals(m.base)) m.mat.color.copy(m.base);
      } else {
        m.mat.color.copy(m.base).lerp(WHITE, f * 0.8);
      }
    }
  }

  // -- animation ------------------------------------------------------------

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0004, dt);
    const A = this.cfg.attacks;

    // The core is the health bar and the telegraph in one object.
    const hpFrac = this.hp / this.maxHp;
    const flare = this.coreFlare;
    const baseScale = 0.7 + hpFrac * 0.3;
    n.core.scale.setScalar(baseScale * (1 + flare * 0.85 + Math.sin(this.t * 3) * 0.05));
    n.core.material.color.setHex(this.enraged ? P.crimson : P.bossCore);
    n.coreGlow.material.opacity = 0.25 + flare * 0.55;
    n.coreGlow.scale.setScalar(1 + flare * 0.9);
    n.slit.material.opacity = 0.5 + flare * 0.5;
    n.slit.material.transparent = true;
    for (const s of ['L', 'R']) {
      n['knuckle' + s].material.opacity = 0.3 + flare * 0.7;
      n['knuckle' + s].material.transparent = true;
    }

    let t = {
      torsoZ: 0, torsoY: 0, headZ: 0,
      shLz: 0, shRz: 0, elLz: -0.2, elRz: -0.2, shLx: 0, shRx: 0,
      hipLz: 0, hipRz: 0, kneeLz: 0, kneeRz: 0, hipsY: 0,
    };
    let snap = false;

    switch (this.state) {
      case 'entering': {
        const u = clamp(1 - this.phase / 2.4, 0, 1);
        // Rises from a kneel: the arena's statue, standing up.
        t.hipsY = lerp(-1.5, 0, u);
        t.hipLz = lerp(1.6, 0, u);
        t.kneeLz = lerp(-2.4, 0, u);
        t.hipRz = lerp(0.7, 0, u);
        t.kneeRz = lerp(-1.5, 0, u);
        t.torsoZ = lerp(0.7, 0, u);
        t.headZ = lerp(0.9, 0, u);
        t.shLz = lerp(-0.9, 0, u);
        t.shRz = lerp(0.5, 0, u);
        break;
      }
      case 'telegraph': {
        const total = this._windupTime();
        const u = clamp(1 - this.phase / total, 0, 1);
        snap = false;
        if (this.attackName === 'charge') {
          t.torsoZ = -0.45 * u;
          t.headZ = 0.3 * u;
          t.shLz = -1.5 * u;
          t.shRz = -1.3 * u;
          t.elLz = -1.4 * u;
          t.elRz = -1.4 * u;
          t.hipLz = -0.5 * u;
          t.hipRz = 0.4 * u;
          t.kneeLz = -0.4 * u;
        } else if (this.attackName === 'slam') {
          t.hipsY = -0.75 * u;
          t.hipLz = 0.9 * u;
          t.hipRz = 0.9 * u;
          t.kneeLz = -1.7 * u;
          t.kneeRz = -1.7 * u;
          t.shLz = -1.9 * u;
          t.shRz = -1.9 * u;
          t.torsoZ = 0.25 * u;
        } else if (this.attackName === 'sweep') {
          t.shRz = -2.3 * u;
          t.elRz = -0.9 * u;
          t.torsoY = 0.9 * u;
          t.torsoZ = -0.15 * u;
          t.shLz = 0.7 * u;
        } else {
          t.shLz = -1.2 * u;
          t.shRz = -1.2 * u;
          t.elLz = -1.9 * u;
          t.elRz = -1.9 * u;
          t.torsoZ = -0.2 * u;
          t.headZ = -0.15 * u;
        }
        break;
      }
      case 'charging': {
        t.torsoZ = -0.55;
        t.headZ = 0.35;
        t.shLz = -1.9;
        t.shRz = -1.7;
        t.elLz = -1.5;
        t.elRz = -1.5;
        this.walkPhase += dt * 15;
        t.hipLz = Math.sin(this.walkPhase) * 0.9;
        t.hipRz = -Math.sin(this.walkPhase) * 0.9;
        t.kneeLz = -Math.max(0, -Math.sin(this.walkPhase)) * 1.3;
        t.kneeRz = -Math.max(0, Math.sin(this.walkPhase)) * 1.3;
        snap = true;
        break;
      }
      case 'leaping': {
        const rising = this.vy > 0;
        t.hipLz = rising ? -0.9 : 0.5;
        t.hipRz = rising ? -0.9 : 0.5;
        t.kneeLz = rising ? -1.6 : -0.3;
        t.kneeRz = rising ? -1.6 : -0.3;
        t.shLz = rising ? -2.6 : -2.9;
        t.shRz = rising ? -2.6 : -2.9;
        t.elLz = -0.3;
        t.elRz = -0.3;
        t.torsoZ = rising ? -0.2 : 0.3;
        snap = true;
        break;
      }
      case 'sweeping': {
        const u = clamp(1 - this.sub / A.sweep.active, 0, 1);
        t.shRz = lerp(-2.3, 1.9, u);
        t.elRz = lerp(-0.9, -0.1, u);
        t.torsoY = lerp(0.9, -0.8, u);
        t.torsoZ = -0.2;
        t.shLz = lerp(0.7, -0.9, u);
        t.hipLz = 0.3;
        t.hipRz = -0.3;
        snap = true;
        break;
      }
      case 'volley': {
        t.shLz = -1.35;
        t.shRz = -1.35;
        t.elLz = -1.8;
        t.elRz = -1.8;
        t.torsoZ = -0.15;
        break;
      }
      case 'recover': {
        t.torsoZ = 0.22;
        t.headZ = -0.15;
        t.shLz = 0.25;
        t.shRz = 0.25;
        t.elLz = -0.35;
        t.elRz = -0.35;
        t.hipsY = -0.16;
        t.kneeLz = -0.25;
        t.kneeRz = -0.25;
        break;
      }
      default: {
        // Idle walk / stand.
        const moving = Math.abs(this.vx) > 0.5;
        if (moving) {
          this.walkPhase += dt * (3.4 + Math.abs(this.vx) * 0.6);
          const s = Math.sin(this.walkPhase);
          t.hipLz = s * 0.55;
          t.hipRz = -s * 0.55;
          t.kneeLz = -Math.max(0, -s) * 0.85;
          t.kneeRz = -Math.max(0, s) * 0.85;
          t.shLz = -s * 0.4;
          t.shRz = s * 0.4;
          t.hipsY = Math.abs(Math.cos(this.walkPhase)) * 0.1 - 0.05;
          t.torsoZ = -0.08;
        } else {
          const b = Math.sin(this.t * 1.3);
          t.hipsY = b * 0.06;
          t.torsoZ = b * 0.03;
          t.shLz = b * 0.06;
          t.shRz = -b * 0.06;
        }
      }
    }

    const blend = snap ? 1 : k;
    const ap = (node, prop, v) => {
      node.rotation[prop] = lerp(node.rotation[prop], v, blend);
    };
    ap(n.torso, 'z', t.torsoZ);
    ap(n.torso, 'y', t.torsoY);
    ap(n.head, 'z', t.headZ);
    ap(n.shoulderL, 'z', t.shLz);
    ap(n.shoulderR, 'z', t.shRz);
    ap(n.shoulderL, 'x', t.shLx);
    ap(n.shoulderR, 'x', t.shRx);
    ap(n.elbowL, 'z', t.elLz);
    ap(n.elbowR, 'z', t.elRz);
    ap(n.hipL, 'z', t.hipLz);
    ap(n.hipR, 'z', t.hipRz);
    ap(n.kneeL, 'z', t.kneeLz);
    ap(n.kneeR, 'z', t.kneeRz);
    n.hips.position.y = lerp(n.hips.position.y, 1.72 + t.hipsY, blend);
  }
}
