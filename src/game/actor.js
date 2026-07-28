// Shared physics body for everything that walks, falls or is hit.
//
// The simulation is a 2D AABB in the XY plane; Z exists only for the art. Axes
// are resolved separately (X first, then Y) which is the standard platformer
// trick for getting predictable wall-slide and landing behaviour out of very
// little code.

import * as THREE from 'three';
import { clamp } from '../engine/mathx.js';

/**
 * Yaw applied to every rig so characters angle toward the camera instead of
 * standing in flat profile. Models are authored facing +X and the camera sits
 * at +Z, so a negative yaw turns the face toward the viewer.
 */
export const TILT = 0.34;

export class Actor {
  constructor(level, { x = 0, y = 0, hw = 0.34, hh = 0.86, maxHp = 100 } = {}) {
    this.level = level;
    this.x = x;
    this.y = y; // feet
    this.vx = 0;
    this.vy = 0;
    this.hw = hw;
    this.hh = hh; // half-height of the collision box, measured from its centre
    this.facing = 1;
    this.grounded = false;
    this.wasGrounded = false;
    this.dead = false;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.invuln = 0;
    this.hitFlash = 0;
    this.root = new THREE.Group();
  }

  /** Collision box centre — the body is `hh` tall in each direction from it. */
  get cy() {
    return this.y + this.hh;
  }

  get box() {
    return { x0: this.x - this.hw, x1: this.x + this.hw, y0: this.y, y1: this.y + this.hh * 2 };
  }

  /**
   * Integrate and resolve against the level. Returns what was hit, so callers
   * can react (a wall-hit cancels a dash, a landing ends a fall state).
   */
  moveAndCollide(dt) {
    const solids = this.level.activeSolids();
    const hit = { wall: 0, ceiling: false, floor: false };

    // --- X ---
    this.x += this.vx * dt;
    let b = this.box;
    for (const s of solids) {
      if (b.x1 <= s.x0 || b.x0 >= s.x1 || b.y1 <= s.y0 || b.y0 >= s.y1) continue;
      if (this.vx > 0) {
        this.x = s.x0 - this.hw;
        hit.wall = 1;
      } else if (this.vx < 0) {
        this.x = s.x1 + this.hw;
        hit.wall = -1;
      }
      this.vx = 0;
      b = this.box;
    }

    // --- Y ---
    this.wasGrounded = this.grounded;
    this.grounded = false;
    this.y += this.vy * dt;
    b = this.box;
    for (const s of solids) {
      if (b.x1 <= s.x0 || b.x0 >= s.x1 || b.y1 <= s.y0 || b.y0 >= s.y1) continue;
      if (this.vy <= 0) {
        this.y = s.y1;
        this.grounded = true;
        hit.floor = true;
      } else {
        this.y = s.y0 - this.hh * 2;
        hit.ceiling = true;
      }
      this.vy = 0;
      b = this.box;
    }

    // A body resting on the floor moves less than a pixel per 120 Hz step, so
    // it generates no collision contact and would report itself airborne on
    // most frames. Probe explicitly instead of trusting the contact.
    if (!this.grounded && this.vy <= 0.001) {
      const probe = 0.06;
      for (const s of solids) {
        if (this.x + this.hw <= s.x0 || this.x - this.hw >= s.x1) continue;
        if (this.y >= s.y1 - probe && this.y <= s.y1 + probe) {
          this.y = s.y1;
          this.grounded = true;
          hit.floor = true;
          break;
        }
      }
    }

    return hit;
  }

  applyGravity(dt, g, maxFall = 46) {
    this.vy = Math.max(-maxFall, this.vy - g * dt);
  }

  /** Face a world x, unless mid-attack (callers decide). */
  faceToward(x) {
    if (Math.abs(x - this.x) > 0.05) this.facing = x > this.x ? 1 : -1;
  }

  /** Push the rig's transform to match the simulation. */
  syncRig() {
    this.root.position.set(this.x, this.y, 0);
    const target = this.facing > 0 ? -TILT : Math.PI + TILT;
    this.root.rotation.y = target;
  }

  takeDamage(amount) {
    if (this.dead || this.invuln > 0) return false;
    this.hp = clamp(this.hp - amount, 0, this.maxHp);
    this.hitFlash = 0.12;
    if (this.hp <= 0) this.dead = true;
    return true;
  }
}

/** Overlap test between two {x0,x1,y0,y1} boxes. */
export function boxHit(a, b) {
  return a.x1 > b.x0 && a.x0 < b.x1 && a.y1 > b.y0 && a.y0 < b.y1;
}
