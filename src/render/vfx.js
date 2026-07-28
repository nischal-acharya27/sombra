// Hit feedback: sparks, slash arcs, dash smears, shockwaves, damage numbers.
//
// Everything here is pooled and allocated once. A hack & slash spawns effects
// in bursts — twenty sparks on a single connect — and doing that with fresh
// geometry per hit produces a GC pause exactly when the game is at its busiest.

import * as THREE from 'three';
import { P } from './palette.js';
import { rand, clamp, lerp } from '../engine/mathx.js';

const MAX_PARTICLES = 900;

const PARTICLE_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * 300.0 / max(-mv.z, 0.001);
    gl_Position = projectionMatrix * mv;
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // Round sprite with a soft edge, drawn procedurally — no texture needed.
    vec2 d = gl_PointCoord - 0.5;
    float r = dot(d, d);
    if (r > 0.25) discard;
    float a = smoothstep(0.25, 0.02, r);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

export class VFX {
  constructor(scene) {
    this.scene = scene;
    this.t = 0;

    // --- particle system ---
    this.p = {
      pos: new Float32Array(MAX_PARTICLES * 3),
      col: new Float32Array(MAX_PARTICLES * 3),
      size: new Float32Array(MAX_PARTICLES),
      alpha: new Float32Array(MAX_PARTICLES),
      vx: new Float32Array(MAX_PARTICLES),
      vy: new Float32Array(MAX_PARTICLES),
      vz: new Float32Array(MAX_PARTICLES),
      life: new Float32Array(MAX_PARTICLES),
      maxLife: new Float32Array(MAX_PARTICLES),
      grav: new Float32Array(MAX_PARTICLES),
      drag: new Float32Array(MAX_PARTICLES),
      size0: new Float32Array(MAX_PARTICLES),
    };
    this.pHead = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.p.pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.p.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.p.size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.p.alpha, 1));
    geo.setDrawRange(0, MAX_PARTICLES);
    this.points = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
    );
    this.points.frustumCulled = false;
    scene.add(this.points);

    // --- pooled quads/rings ---
    this.arcs = this._pool(16, () => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 1.55, 26, 1, 0, 2.3),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false,
          toneMapped: false,
        })
      );
      return m;
    });

    this.rings = this._pool(10, () => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(0.86, 1, 40),
        new THREE.MeshBasicMaterial({
          color: P.violetGlow,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false,
          toneMapped: false,
        })
      );
      m.rotation.x = -Math.PI / 2; // rings lie flat on the ground
      return m;
    });

    this.smears = this._pool(12, () => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: radialTexture(),
          color: P.violet,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          fog: false,
          toneMapped: false,
        })
      );
      return m;
    });

    // Impact flash. A plain quad here reads as a white *square* — additive,
    // full-brightness and hard-edged, it blows a hole in the frame and bloom
    // makes it worse. The radial falloff is what turns it into light.
    this.flashTex = radialTexture();
    this.flashes = this._pool(10, () => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: this.flashTex,
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false,
          toneMapped: false,
        })
      );
      return m;
    });

    // --- damage numbers ---
    this.labels = this._pool(20, () => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, fog: false, toneMapped: false })
      );
      s.renderOrder = 50;
      return s;
    });
    this.texCache = new Map();
  }

  _pool(n, make) {
    const items = [];
    for (let i = 0; i < n; i++) {
      const obj = make();
      obj.visible = false;
      obj.userData.life = 0;
      this.scene.add(obj);
      items.push(obj);
    }
    return { items, next: 0 };
  }

  _take(pool) {
    // Round-robin. Stealing the oldest effect under load is preferable to
    // allocating, and at these pool sizes it is never visible.
    const obj = pool.items[pool.next];
    pool.next = (pool.next + 1) % pool.items.length;
    obj.visible = true;
    return obj;
  }

  // -- particles ------------------------------------------------------------

  emit({ x, y, z = 0, vx = 0, vy = 0, vz = 0, size = 0.1, color = 0xffffff, life = 0.5, grav = 0, drag = 1.5 }) {
    const i = this.pHead;
    this.pHead = (this.pHead + 1) % MAX_PARTICLES;
    const p = this.p;
    p.pos[i * 3] = x;
    p.pos[i * 3 + 1] = y;
    p.pos[i * 3 + 2] = z;
    const c = TMP_COLOR.setHex(color);
    p.col[i * 3] = c.r;
    p.col[i * 3 + 1] = c.g;
    p.col[i * 3 + 2] = c.b;
    p.vx[i] = vx;
    p.vy[i] = vy;
    p.vz[i] = vz;
    p.size[i] = size;
    p.size0[i] = size;
    p.alpha[i] = 1;
    p.life[i] = life;
    p.maxLife[i] = life;
    p.grav[i] = grav;
    p.drag[i] = drag;
  }

  /** Sparks on a connect: a tight cone opposite the blade's travel. */
  hitSpark(x, y, dir, power = 1, color = P.violetGlow) {
    const n = Math.round(10 + power * 14);
    for (let i = 0; i < n; i++) {
      const a = rand(-1.0, 1.0);
      const sp = rand(5, 17) * (0.6 + power * 0.7);
      this.emit({
        x, y,
        z: rand(-0.35, 0.35),
        vx: Math.cos(a) * sp * dir,
        vy: Math.sin(a) * sp * 0.85,
        vz: rand(-3, 3),
        size: rand(0.06, 0.17) * (0.7 + power * 0.5),
        color: i % 4 === 0 ? 0xffffff : color,
        life: rand(0.18, 0.42),
        grav: 22,
        drag: 2.4,
      });
    }
    const f = this._take(this.flashes);
    f.position.set(x + dir * 0.3, y, 0.4);
    f.scale.setScalar(0.9 + power * 1.1);
    f.material.color.setHex(color);
    f.material.opacity = 0.55;
    f.userData.life = 0.10;
    f.userData.maxLife = 0.10;
    f.userData.kind = 'flash';
  }

  dust(x, y, n = 6) {
    for (let i = 0; i < n; i++) {
      this.emit({
        x: x + rand(-0.4, 0.4),
        y: y + 0.05,
        z: rand(-0.7, 0.7),
        vx: rand(-3.5, 3.5),
        vy: rand(0.6, 3.4),
        vz: rand(-1.6, 1.6),
        size: rand(0.10, 0.25),
        color: 0x9c8f7e,
        life: rand(0.3, 0.6),
        grav: 8,
        drag: 3.2,
      });
    }
  }

  shadowBurst(x, y, n = 16, color = P.violet) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.emit({
        x, y,
        z: rand(-0.3, 0.3),
        vx: Math.cos(a) * rand(3, 8),
        vy: Math.sin(a) * rand(2, 6) - 1,
        vz: rand(-2, 2),
        size: rand(0.09, 0.2),
        color,
        life: rand(0.25, 0.55),
        grav: -2,
        drag: 2.6,
      });
    }
  }

  /** The wispy motes that drift through the whole level. Ambience, not feedback. */
  ambientMote(x, y) {
    this.emit({
      x, y,
      z: rand(-4, 5),
      vx: rand(-0.4, 0.4),
      vy: rand(0.25, 0.9),
      vz: rand(-0.2, 0.2),
      size: rand(0.05, 0.12),
      color: Math.random() < 0.3 ? P.cyan : P.violetGlow,
      life: rand(2.4, 4.5),
      grav: -0.35,
      drag: 0.15,
    });
  }

  // -- shaped effects -------------------------------------------------------

  /** The crescent that follows a swing. Angle and sweep come from the move. */
  slashArc(player, key) {
    const spec = ARC_SPECS[key];
    if (!spec) return;
    const a = this._take(this.arcs);
    a.position.set(
      player.x + player.facing * spec.ox,
      player.y + spec.oy,
      0.85 // in front of the character, so it is never occluded by the body
    );
    // Ring geometry sweeps counter-clockwise from +X; rotate so the crescent
    // starts where the blade starts, and mirror it when facing left.
    a.rotation.set(0, 0, spec.rot * player.facing);
    a.scale.set(spec.scale * player.facing, spec.scale, 1);
    a.material.color.setHex(spec.color);
    a.material.opacity = 0.95;
    Object.assign(a.userData, {
      kind: 'arc',
      life: spec.life,
      maxLife: spec.life,
      spin: spec.spin * player.facing,
      grow: spec.grow,
      base: spec.scale,
      flip: player.facing,
    });
  }

  dashTrail(x, y, dir) {
    const s = this._take(this.smears);
    s.position.set(x - dir * 0.9, y + 0.85, 0.5);
    s.scale.set(3.6 * dir, 1.5, 1);
    s.material.opacity = 0.55;
    s.userData.kind = 'smear';
    s.userData.life = 0.20;
    s.userData.maxLife = 0.20;
    for (let i = 0; i < 8; i++) {
      this.emit({
        x: x - dir * rand(0, 1.2),
        y: y + rand(0.2, 1.6),
        z: rand(-0.3, 0.3),
        vx: -dir * rand(2, 7),
        vy: rand(-1, 1),
        size: rand(0.1, 0.22),
        color: P.violet,
        life: rand(0.16, 0.34),
        drag: 3,
      });
    }
  }

  /** Called every frame of a dash — a thin ribbon of afterimages. */
  dashGhost(player) {
    this.emit({
      x: player.x,
      y: player.y + rand(0.3, 1.5),
      z: rand(-0.2, 0.2),
      vx: -player.facing * rand(1, 3),
      vy: rand(-0.4, 0.6),
      size: rand(0.16, 0.3),
      color: P.violetDeep,
      life: 0.22,
      drag: 4,
    });
  }

  groundBurst(x, y, scale = 1) {
    const r = this._take(this.rings);
    r.position.set(x, y + 0.08, 0);
    r.scale.setScalar(0.6 * scale);
    r.material.color.setHex(P.violetGlow);
    r.material.opacity = 0.95;
    r.userData.kind = 'ring';
    r.userData.life = 0.42;
    r.userData.maxLife = 0.42;
    r.userData.grow = 11 * scale;
    this.dust(x, y, 14);
    this.shadowBurst(x, y + 0.2, 20);
  }

  shockRing(x, y, radius, color = P.crimson) {
    const r = this._take(this.rings);
    r.position.set(x, y + 0.08, 0);
    r.scale.setScalar(0.4);
    r.material.color.setHex(color);
    r.material.opacity = 0.9;
    r.userData.kind = 'ring';
    r.userData.life = 0.5;
    r.userData.maxLife = 0.5;
    r.userData.grow = radius * 2.4;
  }

  // -- damage numbers -------------------------------------------------------

  _labelTexture(text, color) {
    const key = `${text}|${color}`;
    let tex = this.texCache.get(key);
    if (tex) return tex;

    const pad = 12;
    const size = 64;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    g.font = `800 ${size}px 'Avenir Next Condensed', Helvetica, sans-serif`;
    const w = Math.ceil(g.measureText(text).width) + pad * 2;
    c.width = w;
    c.height = size + pad * 2;

    const g2 = c.getContext('2d');
    g2.font = `800 ${size}px 'Avenir Next Condensed', Helvetica, sans-serif`;
    g2.textAlign = 'center';
    g2.textBaseline = 'middle';
    g2.lineWidth = 8;
    g2.strokeStyle = 'rgba(6,4,14,0.95)';
    g2.strokeText(text, c.width / 2, c.height / 2);
    g2.fillStyle = color;
    g2.fillText(text, c.width / 2, c.height / 2);

    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.userData.aspect = c.width / c.height;
    this.texCache.set(key, tex);
    return tex;
  }

  damageNumber(x, y, text, { color = '#ffffff', scale = 1 } = {}) {
    const s = this._take(this.labels);
    const tex = this._labelTexture(String(text), color);
    s.material.map = tex;
    s.material.needsUpdate = true;
    s.position.set(x + rand(-0.3, 0.3), y, 0.9);
    const h = 0.62 * scale;
    s.scale.set(h * tex.userData.aspect, h, 1);
    s.material.opacity = 1;
    s.userData.kind = 'label';
    s.userData.life = 0.85;
    s.userData.maxLife = 0.85;
    s.userData.vy = 3.4;
    s.userData.vx = rand(-1.2, 1.2);
    s.userData.h = h;
  }

  // -- update ---------------------------------------------------------------

  update(dt) {
    this.t += dt;
    const p = this.p;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (p.life[i] <= 0) {
        if (p.alpha[i] !== 0) p.alpha[i] = 0;
        continue;
      }
      p.life[i] -= dt;
      if (p.life[i] <= 0) {
        p.alpha[i] = 0;
        continue;
      }
      const d = Math.max(0, 1 - p.drag[i] * dt);
      p.vx[i] *= d;
      p.vz[i] *= d;
      p.vy[i] = p.vy[i] * d - p.grav[i] * dt;
      p.pos[i * 3] += p.vx[i] * dt;
      p.pos[i * 3 + 1] += p.vy[i] * dt;
      p.pos[i * 3 + 2] += p.vz[i] * dt;
      const u = p.life[i] / p.maxLife[i];
      p.alpha[i] = u > 0.75 ? 1 : u / 0.75;
      p.size[i] = p.size0[i] * (0.35 + u * 0.65);
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aColor.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;

    for (const pool of [this.arcs, this.rings, this.smears, this.flashes, this.labels]) {
      for (const o of pool.items) {
        if (!o.visible) continue;
        o.userData.life -= dt;
        if (o.userData.life <= 0) {
          o.visible = false;
          o.material.opacity = 0;
          continue;
        }
        const u = o.userData.life / o.userData.maxLife;
        switch (o.userData.kind) {
          case 'arc': {
            o.material.opacity = u * u * 0.95;
            o.rotation.z += o.userData.spin * dt;
            const s = o.userData.base * (1 + (1 - u) * o.userData.grow);
            o.scale.set(s * o.userData.flip, s, 1);
            break;
          }
          case 'ring': {
            const s = lerp(o.scale.x, o.userData.grow, 1 - Math.pow(0.004, dt));
            o.scale.set(s, s, s);
            o.material.opacity = u * u * 0.9;
            break;
          }
          case 'smear':
            o.material.opacity = u * 0.55;
            o.scale.y = Math.max(0.05, o.scale.y * (1 - dt * 5));
            break;
          case 'flash':
            o.material.opacity = u * u * 0.6;
            o.scale.multiplyScalar(1 + dt * 5);
            break;
          case 'label': {
            o.userData.vy -= 7 * dt;
            o.position.y += o.userData.vy * dt;
            o.position.x += o.userData.vx * dt;
            o.material.opacity = clamp(u * 2.2, 0, 1);
            const pop = u > 0.86 ? 1 + (u - 0.86) * 4 : 1;
            o.scale.set(o.userData.h * o.material.map.userData.aspect * pop, o.userData.h * pop, 1);
            break;
          }
        }
      }
    }
  }
}

const TMP_COLOR = new THREE.Color();

/** A soft white disc that fades to nothing at the edge. Built once. */
function radialTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Per-move arc shape. `rot` orients the crescent's start, `spin` sweeps it
 * during its life, which is what reads as the blade travelling.
 */
const ARC_SPECS = {
  light1: { ox: 1.1, oy: 1.05, scale: 1.5, rot: 1.5, spin: -9, life: 0.17, grow: 0.35, color: 0xdfe8ff },
  light2: { ox: 1.1, oy: 1.05, scale: 1.5, rot: -1.9, spin: 9, life: 0.17, grow: 0.35, color: 0xdfe8ff },
  light3: { ox: 1.2, oy: 1.05, scale: 2.15, rot: 1.9, spin: -7, life: 0.28, grow: 0.5, color: P.violetGlow },
  launcher: { ox: 0.9, oy: 0.9, scale: 1.9, rot: -2.5, spin: 8, life: 0.26, grow: 0.55, color: P.cyan },
  air1: { ox: 1.05, oy: 1.0, scale: 1.45, rot: 1.4, spin: -9, life: 0.16, grow: 0.35, color: 0xdfe8ff },
  air2: { ox: 1.05, oy: 1.0, scale: 1.55, rot: -1.8, spin: 9, life: 0.18, grow: 0.4, color: 0xdfe8ff },
  slam: { ox: 0.4, oy: 0.9, scale: 1.7, rot: 0.4, spin: -3, life: 0.3, grow: 0.3, color: P.violet },
};
