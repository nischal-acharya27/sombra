// The hunter: movement, the move list, and the animation that sells both.

import * as THREE from 'three';
import { Actor } from './actor.js';
import { buildHunter } from '../render/models.js';
import { PHYS, PLAYER, ATTACKS, MAGIC } from './config.js';
import { clamp, damp, lerp, approach } from '../engine/mathx.js';

const seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Player extends Actor {
  constructor(level, ctx) {
    super(level, { hw: PLAYER.hw, hh: PLAYER.hh, maxHp: PLAYER.maxHp });
    this.ctx = ctx; // { vfx, audio, shake, onHit, spawnBolt }

    this.mp = PLAYER.maxMp;
    this.maxMp = PLAYER.maxMp;

    this.state = 'fall';
    this.attack = null; // { key, def, t, hitSet, hitAny }
    this.comboIndex = 0;
    this.comboTimer = 0;
    this.coyote = 0;
    this.jumps = 0;
    this.maxJumps = 2;
    this.dashCd = 0;
    this.dashT = 0;
    this.airDashes = PLAYER.airDashes;
    this.airAttacks = 0;
    this.magicCd = 0;
    this.hurtT = 0;
    this.slamDiving = false;
    this.lock = 0; // rooted for this long, ignoring all input
    this.animT = 0;
    this.runPhase = 0;
    this.landSquash = 0;

    this.root = buildHunter();
    this.n = this.root.userData.nodes;
    this.swordTip = new THREE.Object3D();
    this.swordTip.position.y = 1.1;
    this.n.sword.add(this.swordTip);
    this._worldTip = new THREE.Vector3();
    this._prevTip = new THREE.Vector3();
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.dead = false;
    this.state = 'fall';
    this.attack = null;
    this.comboIndex = 0;
    this.invuln = 0;
    this.facing = 1;
    this.jumps = 0;
    this.airAttacks = 0;
    this.airDashes = PLAYER.airDashes;
    this.lock = 0;
  }

  // -- queries the combat system asks about ---------------------------------

  /** The hitbox this frame, or null. */
  hitbox() {
    const a = this.attack;
    if (!a) return null;
    const d = a.def;
    const live = a.key === 'slam' ? this.slamDiving : a.t >= d.active[0] && a.t <= d.active[1];
    if (!live) return null;
    const r = d.reach;
    const cx = this.x + this.facing * r.cx;
    const cy = this.y + r.cy;
    return { x0: cx - r.hw, x1: cx + r.hw, y0: cy - r.hh, y1: cy + r.hh };
  }

  // -- main update ----------------------------------------------------------

  update(dt, input) {
    this.animT += dt;
    this.invuln -= dt;
    this.dashCd -= dt;
    this.magicCd -= dt;
    this.hitFlash -= dt;
    this.comboTimer -= dt;
    this.lock = Math.max(0, this.lock - dt);
    this.landSquash = damp(this.landSquash, 0, 0.0004, dt);

    if (this.comboTimer <= 0) this.comboIndex = 0;
    if (this.mp < this.maxMp) {
      // Style pays out here rather than in damage: a damage bonus would
      // invalidate the boss tuning the suite verifies, mana regen does not.
      const styleMul = this.ctx.styleMul ? this.ctx.styleMul() : 1;
      this.mp = Math.min(this.maxMp, this.mp + PLAYER.mpRegen * styleMul * dt);
    }

    if (this.state === 'dead') {
      this.vx = damp(this.vx, 0, 0.001, dt);
      this.applyGravity(dt, PHYS.gravity);
      this.moveAndCollide(dt);
      this._animate(dt);
      this.syncRig();
      return;
    }

    if (this.attack) {
      this.attack.t += dt;
      // Fire the crescent when the hitbox opens, not when the input lands.
      // Spawned at t=0 it is a wind-up flourish that has already faded by the
      // time the swing can actually hit anything — the effect and the hit read
      // as two separate events instead of one.
      const a = this.attack;
      if (!a.arcFired && a.t >= a.def.active[0]) {
        a.arcFired = true;
        this.ctx.vfx?.slashArc(this, a.key);
      }
      if (a.t >= a.def.dur) this._endAttack();
    }
    if (this.state === 'dash') {
      this.dashT -= dt;
      if (this.dashT <= 0) this.state = this.grounded ? 'idle' : 'fall';
    }
    if (this.state === 'hurt') {
      this.hurtT -= dt;
      if (this.hurtT <= 0) this.state = this.grounded ? 'idle' : 'fall';
    }

    if (this.state !== 'hurt') this._actions(input);
    this._move(dt, input);
    this._animate(dt);
    this.syncRig();
  }

  // -- input ----------------------------------------------------------------

  /**
   * Read intent from the input buffer.
   *
   * **Every branch establishes it can act BEFORE it consumes the press.** This
   * previously read `input.pressed(x) && canCancel`, which consumes first and
   * validates second — so a press made during attack recovery was swallowed and
   * never replayed, the exact opposite of what a buffer is for. Measured cost:
   * three taps of J at 60 ms produced three consumed presses and one attack. It
   * ate early dash inputs and pre-landing jumps by the same mechanism.
   *
   * The rule this file now keeps: `pressed()` is the last term in the condition.
   */
  _actions(input) {
    if (this.lock > 0) return; // rooted — slam landing recovery

    const a = this.attack;
    const canCancel = !a || a.t >= a.def.cancel;

    // Dash first: it is the defensive option, and a player mashing dash under
    // pressure means it, whatever else is queued.
    const canDash =
      canCancel && this.dashCd <= 0 && this.state !== 'dash' && (this.grounded || this.airDashes > 0);
    if (canDash && input.pressed('dash')) {
      if (!this.grounded) this.airDashes--;
      this._startDash(input);
      return;
    }

    if (this.state === 'dash') return;

    if (canCancel && this.magicCd <= 0 && input.peek('magic')) {
      if (this.mp >= MAGIC.cost) {
        input.pressed('magic');
        this._castMagic();
        return;
      }
      // Out of mana: consume anyway, or the buffered press retries every frame
      // and the denial sound machine-guns for as long as the buffer lives.
      input.pressed('magic');
      this.ctx.audio?.play('deny');
      this.ctx.toast?.('NOT ENOUGH MANA', 'warn');
    }

    if (canCancel && input.pressed('heavy')) {
      this._startAttack(this.grounded ? 'launcher' : 'slam');
      return;
    }

    if (canCancel) {
      if (this.grounded) {
        if (input.pressed('light')) {
          const chain = ['light1', 'light2', 'light3'];
          this._startAttack(chain[this.comboIndex % 3]);
          this.comboIndex++;
          this.comboTimer = 0.55;
          return;
        }
      } else {
        // Air chain is two hits, and the budget is per airtime rather than per
        // chain — otherwise letting one swing finish and starting a fresh one
        // repeats the hang-time frames forever.
        const next = a && a.key === 'air1' ? 'air2' : a && a.key === 'air2' ? null : 'air1';
        if (next && this.airAttacks < PLAYER.airAttackLimit && input.pressed('light')) {
          this.airAttacks++;
          this._startAttack(next);
          return;
        }
      }
    }

    // A jump pressed just before landing must survive until the feet touch,
    // which it cannot do if the press is consumed while still airborne.
    const jumpCancelable = !a || a.t >= a.def.cancel || a.def.jumpCancel;
    const canJump = jumpCancelable && (this.grounded || this.coyote > 0 || this.jumps < this.maxJumps);
    if (canJump && input.pressed('jump')) {
      if (this.grounded || this.coyote > 0) this._jump(PHYS.jumpVel);
      else this._jump(PHYS.doubleJumpVel, true);
    }
  }

  _jump(vel, isDouble = false) {
    this.vy = vel;
    this.grounded = false;
    this.coyote = 0;
    this.jumps = isDouble ? this.maxJumps : 1;
    this.state = 'jump';
    if (this.attack) this._endAttack();
    this.ctx.audio?.play(isDouble ? 'dash' : 'jump');
    if (isDouble) this.ctx.vfx?.shadowBurst(this.x, this.y + 0.4);
  }

  _startDash(input) {
    const dir = input.moveX !== 0 ? input.moveX : this.facing;
    this.facing = dir;
    this.state = 'dash';
    this.dashT = PLAYER.dashTime;
    this.dashCd = PLAYER.dashTime + PLAYER.dashCooldown;
    this.invuln = Math.max(this.invuln, PLAYER.dashInvuln);
    this.vx = dir * PLAYER.dashSpeed;
    this.vy = 0;
    if (this.attack) this._endAttack();
    this.ctx.audio?.play('dash');
    this.ctx.vfx?.dashTrail(this.x, this.y, dir);
  }

  _castMagic() {
    this.mp -= MAGIC.cost;
    this.magicCd = MAGIC.cooldown;
    if (this.attack) this._endAttack();
    this.state = this.grounded ? 'cast' : 'cast';
    this.castT = 0.28;
    this.ctx.spawnBolt(this.x + this.facing * 0.7, this.y + 1.05, this.facing);
    this.ctx.audio?.play('magic');
    this.ctx.shake?.(MAGIC.shake);
    // A light brake to give the cast some weight — but only on the ground, and
    // nothing like a stop. Scrubbing 70% of speed here used to brake the hunter
    // mid-stride, and casting at a wisp while approaching a gap would silently
    // turn a comfortable jump into a fatal one.
    if (this.grounded) this.vx *= 0.75;
  }

  _startAttack(key) {
    const def = ATTACKS[key];
    this.attack = { key, def, t: 0, hitSet: new Set(), hitAny: false, arcFired: false };
    this.state = 'attack';
    if (key === 'slam') {
      this.slamDiving = true;
      this.vy = -def.dive;
      this.vx *= 0.25;
    } else {
      // Every swing carries the hunter forward. Attacks that leave you rooted
      // read as slow no matter how fast the animation is.
      let lunge = def.lunge;
      // ...but never off a cliff. A swing roots your steering, so a lunge that
      // clears the lip drops you straight down with no way to correct — the
      // player gets killed by the attack button, at a ledge they never chose to
      // leave. Clamp it when there is no floor to land the lunge on.
      if (this.grounded && !this.level.hasFloorAhead(this.x + this.facing * 1.5, this.y, 1.2)) {
        lunge = Math.min(lunge, 1.2);
      }
      if (this.grounded) {
        this.vx = this.facing * lunge;
      } else {
        // Airborne, the lunge sets a floor on speed, never a ceiling. Assigning
        // it outright turned a 9.6-unit running jump into a 3.4-unit one the
        // instant you attacked, which reads as the character stopping dead.
        const forward = this.vx * this.facing;
        this.vx = this.facing * Math.max(forward, lunge);
        this.vy = Math.max(this.vy, -2);
      }
    }
    this.ctx.audio?.play(def.sfx);
  }

  _endAttack() {
    if (this.attack?.key === 'slam') this.slamDiving = false;
    this.attack = null;
    if (this.state === 'attack') this.state = this.grounded ? 'idle' : 'fall';
  }

  /** Called by the combat system when a swing connects. */
  notifyHit() {
    if (this.attack) this.attack.hitAny = true;
  }

  // -- movement -------------------------------------------------------------

  _move(dt, input) {
    const a = this.attack;
    const attacking = !!a;
    const rooted = attacking && a.key !== 'slam';

    if (this.state === 'dash') {
      // Dash owns velocity outright; no gravity, no steering.
      const hit = this.moveAndCollide(dt);
      if (hit.wall) this.state = this.grounded ? 'idle' : 'fall';
      if (this.grounded) this.jumps = 0;
      this.ctx.vfx?.dashGhost(this);
      return;
    }

    if (this.state === 'cast') {
      this.castT -= dt;
      if (this.castT <= 0) this.state = this.grounded ? 'idle' : 'fall';
    }

    const dir = input ? input.moveX : 0;

    if (rooted) {
      // Attack lunge bleeds off fast, but steering is disabled: committing to a
      // swing has to mean something.
      //
      // In the air it barely bleeds at all. On the ground, planting your feet to
      // swing should kill your momentum; mid-jump there is nothing to plant, and
      // scrubbing 24% of speed per 25 ms made a running jump-attack read as
      // hitting a wall in mid-air.
      this.vx = damp(this.vx, 0, this.grounded ? 0.00002 : 0.55, dt);
    } else if (this.state !== 'hurt') {
      const accel = this.grounded ? PLAYER.accel : PLAYER.airAccel;
      if (dir !== 0) {
        const reversing = dir * this.vx < 0;
        const rate = accel * (reversing ? PLAYER.turnBoost : 1);
        this.vx = approach(this.vx, dir * PLAYER.runSpeed, rate * dt);
        if (!attacking) this.facing = dir;
      } else if (this.grounded) {
        this.vx = approach(this.vx, 0, PLAYER.friction * dt * 10);
      } else {
        this.vx = damp(this.vx, 0, 0.7, dt);
      }
    } else {
      this.vx = damp(this.vx, 0, 0.4, dt);
    }

    // Gravity, with three modifiers that together do most of the work of
    // making the arc feel good: hang time during air attacks, a lighter pull
    // near the apex, and a heavier one on the way down.
    let g = PHYS.gravity;
    if (a?.def.hangTime && a.t < a.def.hangTime) g = 0;
    else if (this.vy < 0) g *= PHYS.fallGravityMul;
    else if (Math.abs(this.vy) < PHYS.apexWindow) g *= PHYS.apexGravityMul;

    if (a?.key === 'slam') {
      this.vy = -a.def.dive; // dive is constant-velocity, not accelerating
    } else {
      this.applyGravity(dt, g, PHYS.maxFall);
    }

    // Variable jump height.
    if (input && input.released('jump') && this.vy > 0) this.vy *= PHYS.jumpCutMul;

    // moveAndCollide zeroes vy on contact, so the impact speed has to be read
    // before the call, not after.
    const impactVy = this.vy;
    this.moveAndCollide(dt);

    if (this.grounded) {
      if (!this.wasGrounded) this._onLand(impactVy);
      this.coyote = PHYS.coyote;
      this.jumps = 0;
      this.airDashes = PLAYER.airDashes;
      this.airAttacks = 0;
      if (this.state === 'jump' || this.state === 'fall') this.state = 'idle';
    } else {
      this.coyote -= dt;
      if (this.state === 'idle' || this.state === 'run') this.state = 'fall';
      if (this.vy < 0 && this.state === 'jump') this.state = 'fall';
    }

    if (this.grounded && !attacking && this.state !== 'hurt' && this.state !== 'cast') {
      this.state = Math.abs(this.vx) > 0.6 ? 'run' : 'idle';
    }
  }

  _onLand(impactVy) {
    const impact = clamp(-impactVy / 26, 0, 1);
    this.landSquash = 0.35 + impact * 0.65;
    if (this.slamDiving) {
      // Slam pays off on contact, not on the swing.
      const d = ATTACKS.slam.shockwave;
      this.ctx.shockwave(this.x, this.y, d);
      this.ctx.vfx?.groundBurst(this.x, this.y, 1.5);
      this.ctx.shake?.(ATTACKS.slam.shake);
      this.ctx.audio?.play('slam');
      this.slamDiving = false;
      this._endAttack();
      this.lock = ATTACKS.slam.landLock;
    } else {
      this.ctx.vfx?.dust(this.x, this.y, 3 + Math.round(impact * 7));
      if (impact > 0.15) this.ctx.audio?.play('land');
    }
  }

  hurt(amount, fromX) {
    if (this.invuln > 0 || this.dead) return false;
    const took = this.takeDamage(amount);
    if (!took) return false;
    this.invuln = PLAYER.hurtInvuln;
    this.ctx.shake?.(0.34);
    this.ctx.audio?.play('hurt');
    if (this.attack) this._endAttack();
    if (this.hp <= 0) {
      this.state = 'dead';
      this.vx = (this.x < fromX ? -1 : 1) * 5;
      this.vy = 9;
      this.ctx.audio?.play('death');
      return true;
    }
    this.state = 'hurt';
    this.hurtT = 0.32;
    this.vx = (this.x < fromX ? -1 : 1) * PLAYER.hurtKnock;
    this.vy = Math.max(this.vy, 5.5);
    this.facing = this.x < fromX ? 1 : -1;
    return true;
  }

  heal(amount) {
    this.hp = clamp(this.hp + amount, 0, this.maxHp);
  }

  // -- animation ------------------------------------------------------------

  _animate(dt) {
    const n = this.n;
    const k = 1 - Math.pow(0.0001, dt); // damping factor for pose blending
    const t = this.animT;

    // Reset the nodes the attack poses drive, so poses compose predictably.
    const target = {
      torsoZ: 0, torsoY: 0, torsoX: 0,
      headZ: 0, headY: 0,
      shRz: 0.15, shRx: 0, elRz: -0.25,
      shLz: -0.15, shLx: 0, elLz: -0.25,
      // Resting sword angle. The arm contributes ~-0.1 rad of its own, so this
      // lands the blade point-down and slightly forward, not out to the side.
      swordZ: -2.85, swordX: 0,
      hipLz: 0, hipRz: 0, kneeLz: 0, kneeRz: 0,
      hipsY: 0, coat: 0.1,
    };

    const setNow = { on: false };

    if (this.state === 'dead') {
      target.torsoZ = -1.35;
      target.headZ = 0.4;
      target.hipLz = 0.7;
      target.hipRz = 0.5;
      target.kneeLz = -1.2;
      target.kneeRz = -1.0;
      target.shRz = 2.2;
      target.shLz = -1.4;
      target.hipsY = -0.35;
    } else if (this.attack) {
      this._poseAttack(target);
      setNow.on = true;
    } else if (this.state === 'dash') {
      const u = 1 - this.dashT / PLAYER.dashTime;
      target.torsoZ = -0.55 + u * 0.2;
      target.headZ = 0.25;
      target.shRz = -1.9;
      target.shLz = 1.5;
      target.elRz = -0.4;
      target.hipLz = 0.9;
      target.hipRz = -0.7;
      target.kneeLz = -1.1;
      target.kneeRz = -0.3;
      target.swordZ = -2.9;
      target.hipsY = -0.12;
      setNow.on = true;
    } else if (this.state === 'hurt') {
      target.torsoZ = 0.55;
      target.headZ = -0.4;
      target.shRz = -0.9;
      target.shLz = -1.2;
      target.hipLz = -0.4;
      target.hipRz = 0.3;
      setNow.on = true;
    } else if (this.state === 'cast') {
      const u = 1 - this.castT / 0.28;
      target.shLz = 1.9 - u * 0.4;
      target.elLz = -0.7;
      target.torsoY = -0.35;
      target.shRz = -0.7;
      target.headZ = -0.1;
      setNow.on = true;
    } else if (!this.grounded) {
      const rising = this.vy > 0;
      target.torsoZ = rising ? -0.16 : 0.14;
      target.hipLz = rising ? -0.85 : 0.35;
      target.hipRz = rising ? -0.3 : -0.55;
      target.kneeLz = rising ? -0.9 : -0.35;
      target.kneeRz = rising ? -0.35 : -0.8;
      target.shRz = rising ? -0.9 : 0.7;
      target.shLz = rising ? -1.5 : -1.1;
      target.coat = rising ? -0.5 : 0.55;
      target.swordZ = -2.7;
    } else if (this.state === 'run') {
      const speed = Math.abs(this.vx);
      this.runPhase += dt * (5.2 + speed * 0.85);
      const p = this.runPhase;
      const s = Math.sin(p);
      const c = Math.cos(p);
      target.hipLz = s * 0.92;
      target.hipRz = -s * 0.92;
      target.kneeLz = -Math.max(0, -s) * 1.25 - 0.15;
      target.kneeRz = -Math.max(0, s) * 1.25 - 0.15;
      target.shRz = -s * 0.75 + 0.1;
      target.shLz = s * 0.75 - 0.1;
      target.elRz = -0.35 - Math.max(0, s) * 0.4;
      target.elLz = -0.35 - Math.max(0, -s) * 0.4;
      target.torsoZ = -0.22;
      target.headZ = 0.14;
      target.hipsY = Math.abs(c) * 0.055 - 0.03;
      target.coat = 0.35 + s * 0.2;
      target.torsoY = s * 0.12;
    } else {
      // Idle: a slow breath, and the sword arm never fully at rest.
      const b = Math.sin(t * 1.9);
      target.hipsY = b * 0.022;
      target.torsoZ = -0.05 + b * 0.02;
      target.headZ = 0.04 - b * 0.03;
      target.shRz = 0.18 + b * 0.05;
      target.shLz = -0.18 - b * 0.05;
      target.coat = 0.1 + b * 0.06;
      this.runPhase = 0;
    }

    // Attacks and reactions snap; locomotion blends. Interpolating an attack
    // pose is how a swing loses its impact.
    const blend = setNow.on ? 1 : k;
    const ap = (node, prop, value) => {
      node.rotation[prop] = lerp(node.rotation[prop], value, blend);
    };

    ap(n.torso, 'z', target.torsoZ);
    ap(n.torso, 'y', target.torsoY);
    ap(n.torso, 'x', target.torsoX);
    ap(n.head, 'z', target.headZ);
    ap(n.head, 'y', target.headY);
    ap(n.shoulderR, 'z', target.shRz);
    ap(n.shoulderR, 'x', target.shRx);
    ap(n.shoulderL, 'z', target.shLz);
    ap(n.shoulderL, 'x', target.shLx);
    ap(n.elbowR, 'z', target.elRz);
    ap(n.elbowL, 'z', target.elLz);
    ap(n.hipL, 'z', target.hipLz);
    ap(n.hipR, 'z', target.hipRz);
    ap(n.kneeL, 'z', target.kneeLz);
    ap(n.kneeR, 'z', target.kneeRz);
    ap(n.sword, 'z', target.swordZ);
    ap(n.sword, 'x', target.swordX);
    n.coatL.rotation.z = lerp(n.coatL.rotation.z, target.coat, k);
    n.coatR.rotation.z = lerp(n.coatR.rotation.z, target.coat * 0.85, k);
    n.hips.position.y = lerp(n.hips.position.y, 0.74 + target.hipsY, k);

    // Landing squash, applied to the whole rig.
    const sq = this.landSquash;
    this.root.scale.set(1 + sq * 0.16, 1 - sq * 0.2, 1 + sq * 0.16);

    // Invulnerability blink.
    const blink = this.invuln > 0 && Math.floor(this.animT * 22) % 2 === 0;
    this.root.visible = !blink || this.state === 'dead';

    // Eyes brighten with the style meter; the sigil pulses on low HP.
    const lowHp = this.hp / this.maxHp < 0.3;
    const pulse = lowHp ? 0.5 + Math.sin(t * 9) * 0.5 : 1;
    n.sigil.material.opacity = lowHp ? 0.35 + pulse * 0.65 : 1;
    n.sigil.material.transparent = true;
  }

  /** Direct pose for each attack, keyed off normalised attack time. */
  _poseAttack(target) {
    const { key, def, t } = this.attack;
    const u = clamp(t / def.dur, 0, 1);

    switch (key) {
      case 'light1': {
        // Wind back, then a flat horizontal cut across the body.
        const w = seg(u, 0, 0.26);
        const s = easeOut(seg(u, 0.26, 0.58));
        const r = seg(u, 0.58, 1);
        target.shRz = lerp(-1.1 - w * 1.4, 1.55, s) - r * 0.6;
        target.elRz = lerp(-0.9, -0.1, s);
        target.torsoY = lerp(0.5 * w, -0.55, s) + r * 0.3;
        target.torsoZ = -0.15 - s * 0.2;
        target.shLz = -0.9 + s * 0.5;
        target.swordZ = lerp(-1.3, -0.05, s);
        target.hipLz = 0.35;
        target.hipRz = -0.25;
        target.kneeRz = -0.3;
        break;
      }
      case 'light2': {
        // The mirror: a rising backhand from low-left to high-right.
        const w = seg(u, 0, 0.24);
        const s = easeOut(seg(u, 0.24, 0.56));
        const r = seg(u, 0.56, 1);
        target.shRz = lerp(1.5, -1.5, s) + r * 0.7;
        target.elRz = lerp(-0.2, -0.8, s);
        target.torsoY = lerp(-0.5, 0.5, s) - r * 0.25;
        target.torsoZ = -0.2 + w * 0.1;
        target.shLz = 0.6 - s * 1.2;
        target.swordZ = lerp(-0.2, -1.0, s);
        target.hipLz = -0.3;
        target.hipRz = 0.4;
        target.kneeLz = -0.35;
        break;
      }
      case 'light3': {
        // Finisher: a long overhead chop with a real pause at the top.
        const w = easeOut(seg(u, 0, 0.30));
        const hold = seg(u, 0.30, 0.36);
        const s = easeIn(seg(u, 0.36, 0.60));
        const r = seg(u, 0.60, 1);
        target.shRz = lerp(-2.75 * w, 1.85, s) - r * 0.5;
        target.elRz = lerp(-1.5 * w, -0.05, s);
        target.torsoZ = lerp(0.35 * w, -0.6, s) + r * 0.35;
        target.torsoY = 0.25 * w - 0.15 * s;
        target.shLz = -1.6 + s * 1.3;
        target.elLz = -1.0 + s * 0.7;
        target.swordZ = lerp(-0.6, 0.0, Math.max(w, s));
        target.hipLz = 0.5 - s * 0.9;
        target.hipRz = -0.4 + s * 0.8;
        target.kneeLz = -0.4;
        target.kneeRz = -0.5 + s * 0.2;
        target.hipsY = -0.05 - hold * 0.02 - s * 0.12;
        break;
      }
      case 'launcher': {
        // Crouch, then a full-body uppercut. The sword ends pointing straight up.
        const c = easeOut(seg(u, 0, 0.28));
        const s = easeOut(seg(u, 0.28, 0.54));
        const r = seg(u, 0.54, 1);
        target.shRz = lerp(1.9 * c, -2.5, s) + r * 0.55;
        target.elRz = lerp(-0.3, -0.15, s);
        target.torsoZ = lerp(0.5 * c, -0.35, s);
        target.hipsY = lerp(-0.22 * c, 0.06, s) - r * 0.04;
        target.hipLz = lerp(0.8 * c, -0.35, s);
        target.hipRz = lerp(0.6 * c, -0.2, s);
        target.kneeLz = lerp(-1.3 * c, -0.15, s);
        target.kneeRz = lerp(-1.1 * c, -0.2, s);
        target.shLz = -0.5 - s * 1.4;
        target.swordZ = lerp(-1.6, 0.15, s);
        target.headZ = -0.2 * s;
        break;
      }
      case 'air1': {
        const w = seg(u, 0, 0.22);
        const s = easeOut(seg(u, 0.22, 0.55));
        target.shRz = lerp(-2.2 - w * 0.3, 1.4, s);
        target.elRz = lerp(-1.0, -0.1, s);
        target.torsoZ = lerp(0.25, -0.45, s);
        target.torsoY = 0.3 - s * 0.6;
        target.shLz = -1.3 + s * 0.6;
        target.swordZ = lerp(-0.9, -0.05, s);
        target.hipLz = -0.6;
        target.hipRz = -0.2;
        target.kneeLz = -1.0;
        target.kneeRz = -0.5;
        break;
      }
      case 'air2': {
        const s = easeOut(seg(u, 0.18, 0.52));
        target.shRz = lerp(1.6, -1.9, s);
        target.elRz = lerp(-0.2, -0.7, s);
        target.torsoY = lerp(-0.45, 0.45, s);
        target.torsoZ = -0.2 + s * 0.25;
        target.shLz = 0.7 - s * 1.5;
        target.swordZ = lerp(-0.1, -0.9, s);
        target.hipLz = -0.4;
        target.hipRz = -0.7;
        target.kneeLz = -0.8;
        target.kneeRz = -1.0;
        break;
      }
      case 'slam': {
        // Point-down dive. Held rigid: the pose is the readable part.
        const s = easeOut(seg(u, 0, 0.18));
        target.shRz = lerp(-0.5, 2.9, s);
        target.elRz = -0.1;
        target.torsoZ = 0.1;
        target.swordZ = 0.15;
        target.shLz = 2.4 * s;
        target.hipLz = -0.5 * s;
        target.hipRz = -0.35 * s;
        target.kneeLz = -0.5 * s;
        target.kneeRz = -0.4 * s;
        target.headZ = -0.25 * s;
        break;
      }
    }
  }

  /**
   * World-space sword tip, for trail ribbons. Returns the previous sample too,
   * so callers can emit a quad rather than a point.
   */
  sampleTip() {
    this._prevTip.copy(this._worldTip);
    this.n.sword.updateWorldMatrix(true, false);
    this.swordTip.getWorldPosition(this._worldTip);
    return { now: this._worldTip, prev: this._prevTip };
  }
}
