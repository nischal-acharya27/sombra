// Scenery: grass, rocks, spirit trees, mist and the parallax backdrop.
//
// The stylised-open-world look leans almost entirely on two things — a dense
// field of swaying grass on every walkable surface, and layered silhouettes
// receding into fog. Both are cheap: grass is one InstancedMesh for the whole
// level, and the backdrop is flat boxes with no lighting cost that matters.

import * as THREE from 'three';
import { toonMaterial, glowMaterial, outlineFor, faceted } from './toon.js';
import { P } from './palette.js';
import { rand, randInt, clamp } from '../engine/mathx.js';

// ---------------------------------------------------------------------------
// Grass
// ---------------------------------------------------------------------------

/** A tapered blade, pivot at the base, so scaling and bending act from the ground. */
function bladeGeometry() {
  const g = new THREE.BufferGeometry();
  // Four verts: wide base, narrow tip. Two triangles.
  // Sized against a 1.8-unit character: at 0.26 a blade comes to mid-shin,
  // which is what reads as a lawn. Taller blades read as a wheat field and
  // swallow the enemies you are meant to be tracking.
  const w = 0.04;
  const h = 0.26;
  const verts = new Float32Array([
    -w, 0, 0, w, 0, 0, w * 0.22, h, 0,
    -w, 0, 0, w * 0.22, h, 0, -w * 0.22, h, 0,
  ]);
  const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
  const normals = new Float32Array(18);
  for (let i = 0; i < 6; i++) normals[i * 3 + 2] = 1;
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return g;
}

const WIND_CHUNK = /* glsl */ `
  #include <begin_vertex>
  // Bend proportional to height up the blade, phase-offset by instance
  // position so the field ripples rather than pulsing as one.
  vec3 iPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float phase = uTime * 1.35 + iPos.x * 0.55 + iPos.z * 0.42;
  float gust = sin(uTime * 0.4 + iPos.x * 0.08) * 0.5 + 0.5;
  float sway = (sin(phase) * 0.09 + sin(phase * 2.3) * 0.03) * (0.45 + gust);
  float up = clamp(uv.y, 0.0, 1.0);
  transformed.x += sway * up * up;
  transformed.y -= abs(sway) * up * 0.25;
`;

export class GrassField {
  /**
   * @param {{x:number,y:number,z:number}[]} points  one entry per blade
   * @param {{blade:number,tip:number}} colors  from the realm being built
   */
  constructor(points, { blade, tip }) {
    const geo = bladeGeometry();
    this.uniforms = { uTime: { value: 0 } };

    const material = toonMaterial({
      color: blade,
      steps: 3,
      rim: 0.35,
      rimColor: tip,
      rimBias: 0.35,
      side: THREE.DoubleSide,
    });

    const baseCompile = material.onBeforeCompile;
    material.onBeforeCompile = (shader) => {
      if (baseCompile) baseCompile(shader);
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', WIND_CHUNK);
    };
    material.customProgramCacheKey = () => 'grass-wind';

    this.mesh = new THREE.InstancedMesh(geo, material, points.length);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false; // thousands of shadow casters for no visual gain
    this.mesh.frustumCulled = false;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      pos.set(p.x, p.y, p.z);
      e.set(0, rand(-Math.PI, Math.PI), rand(-0.2, 0.2));
      q.setFromEuler(e);
      const s = rand(0.6, 1.1);
      scl.set(s, s * rand(0.75, 1.15), s);
      m.compose(pos, q, scl);
      this.mesh.setMatrixAt(i, m);
      // Per-blade tint so the field isn't one flat colour.
      color.setHex(Math.random() < 0.22 ? tip : blade);
      color.offsetHSL(rand(-0.03, 0.03), rand(-0.08, 0.05), rand(-0.09, 0.09));
      this.mesh.setColorAt(i, color);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(t) {
    this.uniforms.uTime.value = t;
  }
}

/**
 * Scatter blade positions across the top face of a platform box.
 *
 * Blades are placed in clumps rather than uniformly. Uniform scatter reads as
 * a texture swatch; real ground has bare patches and dense tufts, and getting
 * that for free is just a matter of picking centres first.
 *
 * @param density blades per square unit
 */
export function scatterGrass(out, { x, y, w, d = 3.4, density = 20 }) {
  const area = Math.max(1, (w - 0.4) * d);
  const total = Math.max(6, Math.floor(area * density));
  const clumps = Math.max(2, Math.floor(total / 9));
  for (let c = 0; c < clumps; c++) {
    const cx = x + rand(-w / 2 + 0.2, w / 2 - 0.2);
    const cz = rand(-d / 2, d / 2);
    const spread = rand(0.25, 0.95);
    const n = Math.round(total / clumps);
    for (let i = 0; i < n; i++) {
      out.push({
        x: clamp(cx + rand(-spread, spread), x - w / 2 + 0.1, x + w / 2 - 0.1),
        y,
        z: clamp(cz + rand(-spread, spread), -d / 2, d / 2),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * A chunky faceted rock. Low-poly icosahedron with the vertices kicked around.
 * `color` has no default: rock is a realm's colour, and a default here would be
 * a second place to look for it.
 */
export function makeRock(radius = 1, { color, detail = 1, outline = 0.02 }) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // Gentle jitter only. Squashing Y hard turns every boulder into a tent.
    pos.setXYZ(
      i,
      pos.getX(i) * rand(0.82, 1.18),
      pos.getY(i) * rand(0.78, 1.12),
      pos.getZ(i) * rand(0.82, 1.18)
    );
  }
  // Icosahedron geometry is already non-indexed, so recomputed normals are
  // per-face and the rock reads as chiselled rather than lumpy.
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, toonMaterial({ color, steps: 3, rim: 0.28 }));
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  if (outline > 0) g.add(outlineFor(geo, outline * radius));
  return g;
}

/** A mana crystal — the gate's only naturally bright object. */
export function makeCrystal(height = 1.2, color = P.violet) {
  const g = new THREE.Group();
  const geo = new THREE.ConeGeometry(height * 0.26, height, 5);
  const m = new THREE.Mesh(
    geo,
    toonMaterial({ color, steps: 3, rim: 0.9, rimColor: P.violetGlow, emissive: color, emissiveIntensity: 0.5 })
  );
  m.castShadow = true;
  m.position.y = height / 2;
  g.add(m);
  const glow = new THREE.Mesh(
    new THREE.ConeGeometry(height * 0.4, height * 1.3, 5),
    new THREE.MeshBasicMaterial({
      color: P.violetGlow,
      transparent: true,
      opacity: 0.15,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    })
  );
  glow.position.y = height / 2;
  g.add(glow);
  return g;
}

/**
 * A dead spirit tree: bare trunk, forked limbs, glowing motes instead of
 * leaves. Recursive so the branching stays consistent at any scale.
 */
export function makeTree(height = 5) {
  const g = new THREE.Group();
  const barkMat = toonMaterial({ color: 0x3a2e3f, steps: 3, rim: 0.3 });

  const branch = (parent, len, radius, depth) => {
    const geo = new THREE.CylinderGeometry(radius * 0.7, radius, len, 5);
    const m = new THREE.Mesh(geo, barkMat);
    m.castShadow = true;
    m.position.y = len / 2;
    const node = new THREE.Group();
    node.add(m);
    if (depth <= 1) {
      const outline = outlineFor(geo, 0.03);
      outline.position.y = len / 2;
      node.add(outline);
    }
    parent.add(node);

    if (depth >= 4) {
      // Tip: a cluster of glowing motes.
      const mote = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius * 2.4, 0),
        glowMaterial({ color: P.cyan, transparent: true, opacity: 0.85 })
      );
      mote.position.y = len;
      node.add(mote);
      return;
    }
    const forks = depth < 2 ? 3 : 2;
    for (let i = 0; i < forks; i++) {
      const child = new THREE.Group();
      child.position.y = len * rand(0.75, 0.98);
      child.rotation.y = rand(0, Math.PI * 2);
      child.rotation.z = rand(0.3, 0.72) * (i % 2 ? 1 : -1);
      node.add(child);
      branch(child, len * rand(0.6, 0.75), radius * 0.62, depth + 1);
    }
  };

  branch(g, height * 0.42, height * 0.055, 0);
  return g;
}

/** A soft mist band. Several translucent planes, no depth write, never fogged out. */
export function makeMist(width, height, { color = P.violetGlow, opacity = 0.055, layers = 3 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < layers; i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      })
    );
    m.position.set(rand(-width * 0.05, width * 0.05), rand(-height * 0.1, height * 0.1), -i * 1.4);
    g.add(m);
  }
  return g;
}

/**
 * A flat sheet of water, and a sheen drifting across it.
 *
 * Unlit on purpose. `MeshBasicMaterial` at a near-black colour is the cheapest
 * thing that reads as deep water, and it is the *right* thing rather than a
 * shortcut: a toon-shaded surface would take the same key light as the rock and
 * come back grey. Fog still applies, so the far bank dissolves instead of
 * ending in a line.
 *
 * The sheen is a second, barely-there plane the caller slides around each
 * frame — see `Level.update`. It is what stops the surface reading as a hole
 * cut in the world, and it costs no allocation to animate.
 */
export function makeWater(width, depth, { color = 0x04070c, sheen = P.violetGlow } = {}) {
  const g = new THREE.Group();

  const surface = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ color }));
  surface.rotation.x = -Math.PI / 2;
  g.add(surface);

  // Wider than the water it sits on, by more than it is ever slid. An edge is
  // the one thing a sheen must not have: at 0.9 of the width its border ran
  // down the middle of the view as a hard vertical seam, because nothing here
  // is far enough away for fog to soften it.
  const gloss = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.1, depth * 1.1),
    new THREE.MeshBasicMaterial({ color: sheen, transparent: true, opacity: 0.055, depthWrite: false })
  );
  gloss.rotation.x = -Math.PI / 2;
  gloss.position.y = 0.05;
  g.add(gloss);
  g.userData.sheen = gloss;

  return g;
}

/**
 * Parallax backdrop. Successive ridges of jagged silhouettes pushed back in Z;
 * the fog does the aerial perspective, so each layer only needs to be further
 * away to read as lighter and flatter.
 *
 * Takes whatever it should hang off rather than the scene: a gate's scenery
 * belongs to the gate, so that switching gates is one `visible` flag.
 */
export function buildBackdrop(parent, { from, to, ridges }) {
  const group = new THREE.Group();

  const layers = [
    { z: -34, h: [7, 16], color: ridges[0], step: 7, y: -3 },
    { z: -58, h: [14, 30], color: ridges[1], step: 11, y: -5 },
    { z: -92, h: [26, 52], color: ridges[2], step: 17, y: -8 },
  ];

  for (const layer of layers) {
    for (let x = from - 40; x < to + 40; x += layer.step) {
      const h = rand(layer.h[0], layer.h[1]);
      const w = layer.step * rand(1.1, 2.0);
      const peak = new THREE.Mesh(
        faceted(new THREE.ConeGeometry(w * 0.62, h, randInt(4, 6))),
        toonMaterial({ color: layer.color, steps: 3, rim: 0.15 })
      );
      peak.position.set(x + rand(-3, 3), layer.y + h / 2, layer.z + rand(-6, 6));
      peak.rotation.y = rand(0, Math.PI);
      group.add(peak);
    }
  }

  // Floating shards drifting over the void — the clearest "this is not your
  // world" cue available for the cost of a few dozen triangles.
  for (let i = 0; i < 26; i++) {
    const r = rand(0.6, 2.6);
    const shard = makeRock(r, { color: ridges[0], outline: 0 });
    shard.position.set(rand(from - 20, to + 20), rand(6, 40), rand(-70, -16));
    shard.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    shard.userData.drift = { base: shard.position.y, amp: rand(0.5, 1.8), speed: rand(0.15, 0.4), phase: rand(0, 7) };
    group.add(shard);
  }

  parent.add(group);
  return group;
}
