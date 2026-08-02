// The 2.5D chase camera.
//
// It stays on a rail parallel to the play plane and never orbits — the game is
// side-on and the player's spatial reasoning depends on that staying true. What
// it does do is lead the player, settle vertically much more slowly than
// horizontally (so jumps don't make the world lurch), and pull back when a
// fight needs more room.

import { damp, clamp, lerp, noise1 } from '../engine/mathx.js';

const BASE = {
  dist: 11.5,
  height: 3.2,
  lookHeight: 1.9, // above the hunter's waist: puts the horizon high and keeps
  //                  the platform's front face out of the bottom of the frame
  lookAhead: 2.6, // how far in front of the player the frame sits, at full speed
};

export class GameCamera {
  constructor(camera) {
    this.cam = camera;
    this.x = 0;
    this.y = 0;
    this.dist = BASE.dist;
    this.targetDist = BASE.dist;
    this.lead = 0;
    this.trauma = 0;
    this.t = 0;
    this.bounds = null; // {x0, x1} to keep the frame inside an arena
  }

  snapTo(player) {
    this.x = player.x;
    this.y = player.y;
    this.lead = 0;
  }

  /** Screen shake is trauma-based: it decays, and offset scales with its square. */
  shake(amount) {
    this.trauma = clamp(this.trauma + amount, 0, 1);
  }

  setBounds(b) {
    this.bounds = b;
  }

  zoom(dist) {
    this.targetDist = dist;
  }

  update(dt, player, focus = null) {
    this.t += dt;

    // Lead the player by their velocity, but only once they are actually
    // moving — leading off facing alone makes the camera twitch on every turn.
    const leadTarget = clamp(player.vx / 9.6, -1, 1) * BASE.lookAhead;
    this.lead = damp(this.lead, leadTarget, 0.02, dt);

    let tx = player.x + this.lead;
    let ty = player.y;

    // With a second point of interest (a boss), frame both.
    if (focus) {
      tx = lerp(player.x, focus.x, 0.38) + this.lead * 0.4;
      ty = lerp(player.y, focus.y + 1, 0.3);
      const spread = Math.abs(focus.x - player.x);
      this.targetDist = clamp(BASE.dist + spread * 0.42, BASE.dist, 26);
    }

    this.x = damp(this.x, tx, 0.0009, dt);
    // Vertical lag is deliberately much heavier, and heavier still while
    // airborne, so a jump moves the character up the frame instead of moving
    // the world down.
    this.y = damp(this.y, ty, player.grounded ? 0.004 : 0.06, dt);
    this.dist = damp(this.dist, this.targetDist, 0.05, dt);

    if (this.bounds) {
      const halfW = this.dist * Math.tan((this.cam.fov * Math.PI) / 360) * this.cam.aspect;
      const min = this.bounds.x0 + halfW * 0.82;
      const max = this.bounds.x1 - halfW * 0.82;
      if (min < max) this.x = clamp(this.x, min, max);
    }

    // Shake: two decorrelated noise channels, plus a roll, all scaled by
    // trauma². The square is what makes small hits feel small.
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    const s = this.trauma * this.trauma;
    const sx = noise1(this.t * 34) * s * 1.15;
    const sy = noise1(this.t * 31 + 17.3) * s * 0.9;
    const roll = noise1(this.t * 27 + 41.7) * s * 0.045;

    this.cam.position.set(this.x + sx, this.y + BASE.height + sy, this.dist);
    this.cam.lookAt(this.x + this.lead * 0.35, this.y + BASE.lookHeight, 0);
    this.cam.rotateZ(roll);
  }
}
