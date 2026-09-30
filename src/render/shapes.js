// Organic geometry for the rigs: surfaces lofted through rings.
//
// The first generation of rigs was boxes, and boxes are what they read as —
// "3D boxes tied together" was the verdict, and a box's hard, flat faces are
// the cause, not the idea of a rig of rigid parts. A limb that tapers, a torso
// that narrows at the waist and a head with a jaw read as a body even at the
// size the game camera shows one. The rigs keep their joints, their node names
// and their `part()`-shaped contract; only the geometry inside each part is
// what changed (`docs/DECISIONS.md` § "The rigs are rebuilt from lofted forms").
//
// Everything here is a **loft**: rings stacked along an axis, each a
// superellipse with its own centre and radii, skinned into one smooth, closed,
// indexed surface. `p` is the ring's squareness — 2 is an ellipse, 4 is a
// rounded square — so one function makes a forearm, a breastplate, a boot and
// a pleated robe. Normals are smooth (averaged across shared vertices, the seam
// included), which is what lets the toon ramp draw a curved terminator instead
// of lighting each face as a flat card.
//
// Pure geometry: no materials, no meshes. Cached by shape key, the same
// contract `box()` has in models.js, so a crowd of anything costs one geometry
// per distinct shape.

import * as THREE from 'three';

const cache = new Map();

function cached(key, build) {
  let g = cache.get(key);
  if (!g) {
    g = build();
    cache.set(key, g);
  }
  return g;
}

/** A superellipse coordinate: `p` 2 is a circle's, higher squares it off. */
function se(c, p) {
  return Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
}

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * A closed surface through rings stacked along +Y, bottom ring first.
 *
 * A ring is `{ y, rx, rz, x = 0, z = 0, p = 2, wave = 0, waves = 0, phase = 0 }`:
 * a superellipse of radii `rx` (X, the facing axis) and `rz` (Z, lateral),
 * centred at (`x`, `y`, `z`). `wave` ruffles the radius around the ring —
 * `waves` lobes of relative amplitude `wave` — which is what a hem's folds
 * are. The ends close on a pole at `bottomY`/`topY` (default: the end ring's
 * own height), so a shape rounds off by letting its last rings shrink toward
 * the pole rather than by being capped flat.
 *
 * `seg` is the ring's vertex count. Twelve is plenty at the size the camera
 * shows a limb; heads and robes ask for more.
 */
export function loft(rings, { seg = 12, bottomY, topY } = {}) {
  const key = `loft:${seg}:${bottomY}:${topY}:${JSON.stringify(rings)}`;
  return cached(key, () => buildLoft(rings, seg, bottomY, topY));
}

/**
 * Two extra rings between an end ring and its pole, on a quarter ellipse, so
 * an end that stops short of its pole domes over instead of closing flat —
 * a flat fan under smooth normals shades as a dimple, a dark spot on a
 * rump or a snout. An end whose pole sits on the ring stays flat, as a belt
 * or a band wants.
 */
function roundEnds(rings, bottomY, topY) {
  const cap = (end, poleY) => {
    const d = poleY - end.y;
    if (poleY === undefined || Math.abs(d) < 1e-4) return [];
    // An end already closing on its pole (a limb's own cap) needs no help.
    if (Math.abs(d) < 0.35 * Math.max(end.rx, end.rz)) return [];
    return [
      [0.55, 0.835],
      [0.85, 0.527],
    ].map(([t, k]) => ({ ...end, y: end.y + d * t, rx: end.rx * k, rz: end.rz * k, wave: 0 }));
  };
  const lo = cap(rings[0], bottomY).reverse();
  const hi = cap(rings[rings.length - 1], topY);
  return [...lo, ...rings, ...hi];
}

function buildLoft(ringsIn, seg, bottomY, topY) {
  const rings = roundEnds(ringsIn, bottomY, topY);
  const R = rings.length;
  const cols = seg + 1; // the seam column is duplicated so UVs can wrap
  const pos = new Float32Array((R * cols + 2) * 3);
  const uv = new Float32Array((R * cols + 2) * 2);
  let v = 0;
  for (let k = 0; k < R; k++) {
    const r = rings[k];
    const p = r.p ?? 2;
    for (let i = 0; i < cols; i++) {
      const a = ((i % seg) / seg) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const ruffle = r.wave ? 1 + r.wave * Math.sin(a * (r.waves || 6) + (r.phase ?? 0)) : 1;
      pos[v * 3] = (r.x ?? 0) + r.rx * se(c, p) * ruffle;
      pos[v * 3 + 1] = r.y;
      pos[v * 3 + 2] = (r.z ?? 0) + r.rz * se(s, p) * ruffle;
      uv[v * 2] = i / seg;
      uv[v * 2 + 1] = k / (R - 1);
      v++;
    }
  }
  const bottom = v++;
  const b0 = rings[0];
  pos.set([b0.x ?? 0, bottomY ?? b0.y, b0.z ?? 0], bottom * 3);
  uv.set([0.5, 0], bottom * 2);
  const top = v++;
  const t0 = rings[R - 1];
  pos.set([t0.x ?? 0, topY ?? t0.y, t0.z ?? 0], top * 3);
  uv.set([0.5, 1], top * 2);

  const idx = [];
  for (let k = 0; k < R - 1; k++) {
    for (let i = 0; i < seg; i++) {
      const a = k * cols + i;
      const b = k * cols + i + 1;
      const c = (k + 1) * cols + i;
      const d = (k + 1) * cols + i + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  for (let i = 0; i < seg; i++) {
    idx.push(bottom, i, i + 1);
    const t = (R - 1) * cols;
    idx.push(top, t + i + 1, t + i);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // The duplicated seam column shades as a crease unless its two copies agree.
  const n = g.attributes.normal;
  const tmp = new THREE.Vector3();
  for (let k = 0; k < R; k++) {
    const a = k * cols;
    const b = a + seg;
    tmp.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, tmp.x, tmp.y, tmp.z);
    n.setXYZ(b, tmp.x, tmp.y, tmp.z);
  }
  g.userData.smooth = true;
  g.userData.rings = rings;
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/**
 * Where a loft's front (+X) surface is, at height `y` and lateral offset `z`.
 *
 * Decals — eyes, sigils, mouths — have to sit *on* a curved face rather than
 * float in front of it, and a box's front plane no longer exists to put them
 * on. Returns the surface point's `x` and the yaw its normal faces, so a decal
 * can be laid flat against the curve. Heights outside the rings clamp.
 */
export function frontOf(geo, y, z) {
  const rings = geo.userData.rings;
  if (!rings) return { x: 0, yaw: Math.PI / 2 };
  let k = 0;
  while (k < rings.length - 2 && rings[k + 1].y < y) k++;
  const r0 = rings[k];
  const r1 = rings[k + 1];
  const t = THREE.MathUtils.clamp((y - r0.y) / (r1.y - r0.y || 1), 0, 1);
  const rx = lerp(r0.rx, r1.rx, t);
  const rz = lerp(r0.rz, r1.rz, t);
  const cx = lerp(r0.x ?? 0, r1.x ?? 0, t);
  const cz = lerp(r0.z ?? 0, r1.z ?? 0, t);
  const p = lerp(r0.p ?? 2, r1.p ?? 2, t);
  const u = THREE.MathUtils.clamp(Math.abs(z - cz) / rz, 0, 0.98);
  const fx = Math.pow(1 - Math.pow(u, p), 1 / p);
  // The superellipse's normal: gradient of |x/rx|^p + |z/rz|^p.
  const nx = Math.pow(fx, p - 1) / rx;
  const nz = (Math.sign(z - cz) * Math.pow(u, p - 1)) / rz;
  return { x: cx + rx * fx, yaw: Math.atan2(nx, nz) };
}

// ---------------------------------------------------------------------------
// Ring recipes. Each returns rings for `loft`; the part helpers in models.js
// size them from a box's w/h/d so a box call converts one for one.
// ---------------------------------------------------------------------------

/**
 * A limb segment: a tapered capsule whose cap centres are the two joints —
 * y = 0 (the pivot) and y = -len. The caps overlap the neighbouring segments
 * like ball joints, which is what keeps a bent elbow closed where two boxes
 * gape open. `bulge` swells the upper part (a bicep, a calf).
 */
export function limbRings(rxT, rzT, rxB, rzB, len, { bulge = 0.08, bulgeAt = 0.3, p = 2, capRings = 2, body = 4 } = {}) {
  const rings = [];
  const capT = (rxT + rzT) / 2;
  const capB = (rxB + rzB) / 2;
  // The bottom cap, from just above its pole up to the bottom joint.
  for (let i = 1; i <= capRings; i++) {
    const phi = -Math.PI / 2 + (i / (capRings + 1)) * (Math.PI / 2);
    const c = Math.cos(phi);
    rings.push({ y: -len + capB * Math.sin(phi), rx: rxB * c, rz: rzB * c, p });
  }
  // The shaft, bottom joint to top joint, swelling toward the top.
  for (let j = 0; j <= body; j++) {
    const t = 1 - j / body; // 1 at the bottom joint, 0 at the top
    const u = t / (2 * bulgeAt);
    const swell = u < 1 ? 1 + bulge * Math.sin(Math.PI * u) : 1;
    rings.push({ y: -len * t, rx: lerp(rxT, rxB, t) * swell, rz: lerp(rzT, rzB, t) * swell, p });
  }
  // The top cap, from the pivot up to its pole.
  for (let i = 1; i <= capRings; i++) {
    const phi = (i / (capRings + 1)) * (Math.PI / 2);
    const c = Math.cos(phi);
    rings.push({ y: capT * Math.sin(phi), rx: rxT * c, rz: rzT * c, p });
  }
  return { rings, bottomY: -len - capB, topY: capT };
}

/** An ellipsoid (or, with `p` > 2, a rounded block) centred on the origin. */
export function blobRings(rx, ry, rz, { p = 2, pv = 2, n = 7 } = {}) {
  const rings = [];
  for (let i = 1; i < n; i++) {
    const phi = -Math.PI / 2 + (i / n) * Math.PI;
    const s = Math.sin(phi);
    const c = Math.cos(phi);
    rings.push({ y: ry * se(s, pv), rx: rx * se(c, pv), rz: rz * se(c, pv), p });
  }
  return { rings, bottomY: -ry, topY: ry };
}

/**
 * A soft block: flat faces, rounded edges. `r` is the edge radius as a
 * fraction of the smallest half-dimension, carried by the ring squareness in
 * plan and by an eased shoulder in elevation.
 */
export function blockRings(hx, hy, hz, { round = 0.35, p } = {}) {
  const e = Math.min(hx, hy, hz) * round;
  const sq = p ?? Math.max(2.6, 8 - round * 12);
  const rings = [];
  // A quarter circle of radius `e` at each horizontal edge, in four rings.
  const edge = (deg, cy) => {
    const a = (deg * Math.PI) / 180;
    const inset = e - e * Math.cos(a);
    rings.push({ y: cy + e * Math.sin(a), rx: hx - inset, rz: hz - inset, p: sq });
  };
  for (const deg of [-90, -60, -30, 0]) edge(deg, -hy + e);
  for (const deg of [0, 30, 60, 90]) edge(deg, hy - e);
  return { rings, bottomY: -hy, topY: hy };
}

/**
 * A torso from waist (y = 0) to the base of the neck (y = h), for a box of
 * half-depth `hx` (front-back) and half-width `hz` (shoulder to shoulder).
 *
 * `waist` narrows the bottom, `chest` pushes the ribcage forward, `belly`
 * pushes the gut forward and out (a giant's, a wrestler's), `taper` narrows
 * the top for a slight build, and `p` squares the section (armour).
 */
export function trunkRings(hx, h, hz, { waist = 0.8, chest = 0.08, belly = 0, taper = 1, p = 2.2, neck = 0.42 } = {}) {
  const B = belly;
  const prof = [
    // t, sx, sz, forward offset (as a fraction of hx)
    [0.0, waist * (1 + B * 0.3), waist * 0.96 * (1 + B * 0.25), B * 0.1],
    [0.14, waist * 0.98 * (1 + B * 0.55), waist * 0.94 * (1 + B * 0.35), B * 0.28],
    [0.34, (0.9 + (1 - waist) * 0.2) * (1 + B * 0.6), (0.86 + (1 - waist) * 0.2) * (1 + B * 0.3), chest * 0.4 + B * 0.34],
    [0.56, 0.99 * (1 + B * 0.3), 0.93 * (1 + B * 0.1), chest * 0.9 + B * 0.18],
    [0.74, 1.0, 0.98 * taper, chest],
    [0.87, 0.9, 0.99 * taper, chest * 0.5],
    [0.95, 0.66, 0.8 * taper, 0],
    [1.0, neck, neck * 1.05, -0.04],
  ];
  const rings = prof.map(([t, sx, sz, fx]) => ({ y: h * t, rx: hx * sx, rz: hz * sz, x: hx * fx, p }));
  return { rings, bottomY: -h * 0.02, topY: h * 1.02 };
}

/**
 * A head from the chin (y = 0) to the crown (y = h), face toward +X.
 *
 * The jaw is narrower than the cranium and sits forward of it; the crown sits
 * back. `jaw` widens or narrows the lower face (a brute's, a queen's), `snout`
 * pushes the mouth forward for anything not human.
 */
export function skullRings(hx, h, hz, { jaw = 0.72, snout = 0, crown = 1, p = 2.3 } = {}) {
  const prof = [
    [0.0, 0.34, 0.3, 0.32 + snout],
    [0.1, jaw * 0.92, jaw * 0.82, 0.14 + snout * 0.9],
    [0.26, 0.86 + jaw * 0.04, 0.72 + jaw * 0.12, 0.07 + snout * 0.6],
    [0.46, 0.97, 0.92, 0.03 + snout * 0.2],
    [0.64, 1.0, 0.98 * crown, 0.0],
    [0.8, 0.95, 0.95 * crown, -0.04],
    [0.92, 0.74, 0.76 * crown, -0.07],
    [0.985, 0.36, 0.38 * crown, -0.08],
  ];
  const rings = prof.map(([t, sx, sz, fx]) => ({ y: h * t, rx: hx * sx, rz: hz * sz, x: hx * fx, p }));
  return { rings, bottomY: h * -0.01, topY: h };
}

/**
 * A skirt or robe from the waist (y = 0) down to the hem (y = -len), flaring
 * from `rxT`/`rzT` to `rxB`/`rzB`. `folds` ruffles the lower rings into that
 * many pleats — the one detail that makes a hem read as cloth.
 */
export function skirtRings(rxT, rzT, rxB, rzB, len, { folds = 0, fold = 0.06, p = 2, belly = 0, steps } = {}) {
  const prof = steps ?? [
    [0, 0, 0],
    [0.2, 0.22, 0.2],
    [0.5, 0.58, 0.55],
    [0.8, 0.87, 0.85],
    [1, 1, 1],
  ];
  const rings = [{ y: 0.02, rx: rxT * 0.96, rz: rzT * 0.96, p }];
  for (const [t, s, f] of prof) {
    const w = t === 0 ? 0 : f;
    const bulge = belly * Math.sin(Math.PI * Math.min(t * 1.6, 1));
    rings.push({
      y: -len * t,
      rx: lerp(rxT, rxB, s) + bulge,
      rz: lerp(rzT, rzB, s),
      x: bulge * 0.5,
      p,
      wave: folds ? fold * w : 0,
      waves: folds,
    });
  }
  rings.reverse();
  // Closed underneath, just inside the hem, so the hollow never shows.
  return { rings, bottomY: -len * 0.9, topY: 0.03 };
}

/**
 * A loft along +X instead of +Y — a quadruped's barrel, a snout, a foot.
 * Rings are `{ x, ry, rz, y = 0, z = 0, p = 2 }`: a superellipse of radii
 * `ry` (up) and `rz` (lateral) centred at (`y`, `z`), stepping back to front.
 * Built as a Y-loft and turned onto X, which is why it is a function of its
 * own rather than an option on `loft`: the turn has to happen after caching.
 */
export function loftX(rings, { seg = 12, backX, frontX } = {}) {
  const key = `loftX:${seg}:${backX}:${frontX}:${JSON.stringify(rings)}`;
  return cached(key, () => {
    // Y-loft rings: `y` is the eventual X, `x` the eventual -Y.
    const yr = rings.map((r) => ({ y: r.x, rx: r.ry, rz: r.rz, x: -(r.y ?? 0), z: r.z ?? 0, p: r.p ?? 2, wave: r.wave, waves: r.waves }));
    const g = buildLoft(yr, seg, backX, frontX).clone();
    g.rotateZ(-Math.PI / 2);
    g.userData.smooth = true;
    g.userData.rings = null;
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  });
}

/**
 * A foot along +X, sole flat at y = -h: heel round, instep high, toe low and
 * rounded.
 */
export function bootGeo(w, h, d, { toe = 0.34, p = 2.6, seg = 10 } = {}) {
  const hw = w / 2;
  // [x fraction, height fraction, width fraction]
  const prof = [
    [-0.5, 0.52, 0.5],
    [-0.44, 0.84, 0.82],
    [-0.2, 1.0, 0.94],
    [0.12, 0.74, 1.0],
    [0.36, toe + 0.12, 0.94],
    [0.47, toe * 0.8, 0.62],
  ];
  const rings = prof.map(([fx, fh, fw]) => {
    const ry = (h * fh) / 2;
    return { x: hw * 2 * fx, ry, rz: (d / 2) * fw, y: -h + ry, p };
  });
  return loftX(rings, { seg, backX: -hw, frontX: hw });
}

/**
 * A tapered tube along a path — tails, horns, tusks, locks of hair, a sash.
 * `pts` is `[[x, y, z, r], ...]`; rings are laid perpendicular to the path on
 * parallel-transported frames, so a horn can curl without the section
 * twisting or pinching. The ends close on poles at the first and last point.
 */
export function tubeGeo(pts, { seg = 8, squash = 1 } = {}) {
  const key = `tube:${seg}:${squash}:${JSON.stringify(pts)}`;
  return cached(key, () => {
    const P = pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const N = P.length;
    const T = P.map((_, i) => {
      const a = P[Math.max(0, i - 1)];
      const b = P[Math.min(N - 1, i + 1)];
      return b.clone().sub(a).normalize();
    });
    // Parallel transport: start from any normal to the first tangent.
    const up = Math.abs(T[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    let nrm = new THREE.Vector3().crossVectors(T[0], up).normalize();
    const frames = [];
    for (let i = 0; i < N; i++) {
      if (i > 0) {
        const axis = new THREE.Vector3().crossVectors(T[i - 1], T[i]);
        const len = axis.length();
        if (len > 1e-6) {
          axis.divideScalar(len);
          const ang = Math.acos(THREE.MathUtils.clamp(T[i - 1].dot(T[i]), -1, 1));
          nrm = nrm.clone().applyAxisAngle(axis, ang);
        }
      }
      const bin = new THREE.Vector3().crossVectors(T[i], nrm).normalize();
      frames.push({ n: nrm.clone(), b: bin });
    }
    const cols = seg + 1;
    const pos = new Float32Array((N * cols + 2) * 3);
    let v = 0;
    for (let i = 0; i < N; i++) {
      const r = pts[i][3];
      const { n, b } = frames[i];
      for (let j = 0; j < cols; j++) {
        const a = ((j % seg) / seg) * Math.PI * 2;
        const c = Math.cos(a) * r;
        const s = Math.sin(a) * r * squash;
        pos[v * 3] = P[i].x + n.x * c + b.x * s;
        pos[v * 3 + 1] = P[i].y + n.y * c + b.y * s;
        pos[v * 3 + 2] = P[i].z + n.z * c + b.z * s;
        v++;
      }
    }
    const first = v++;
    const e0 = P[0].clone().addScaledVector(T[0], -pts[0][3] * 0.6);
    pos.set([e0.x, e0.y, e0.z], first * 3);
    const last = v++;
    const e1 = P[N - 1].clone().addScaledVector(T[N - 1], pts[N - 1][3] * 0.6);
    pos.set([e1.x, e1.y, e1.z], last * 3);
    const idx = [];
    for (let i = 0; i < N - 1; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * cols + j;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    for (let j = 0; j < seg; j++) {
      idx.push(first, j + 1, j);
      const t = (N - 1) * cols;
      idx.push(last, t + j, t + j + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const nA = g.attributes.normal;
    const tmp = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const a = i * cols;
      const b = a + seg;
      tmp.set(nA.getX(a) + nA.getX(b), nA.getY(a) + nA.getY(b), nA.getZ(a) + nA.getZ(b)).normalize();
      nA.setXYZ(a, tmp.x, tmp.y, tmp.z);
      nA.setXYZ(b, tmp.x, tmp.y, tmp.z);
    }
    g.userData.smooth = true;
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  });
}

/**
 * Several geometries as one, each placed by its own matrix — a hand and its
 * thumb, a skull and its jaw. One mesh and one outline instead of two of
 * each: the detail costs vertices, which are cheap, and not draw calls, which
 * on a phone are not.
 */
export function merge(key, pieces) {
  return cached(`merge:${key}`, () => {
    let nv = 0;
    let ni = 0;
    for (const { geo } of pieces) {
      nv += geo.attributes.position.count;
      ni += geo.index ? geo.index.count : geo.attributes.position.count;
    }
    const pos = new Float32Array(nv * 3);
    const nor = new Float32Array(nv * 3);
    const idx = [];
    let base = 0;
    const v = new THREE.Vector3();
    const nm = new THREE.Matrix3();
    for (const { geo, matrix } of pieces) {
      const m = matrix ?? new THREE.Matrix4();
      nm.getNormalMatrix(m);
      const P = geo.attributes.position;
      const N = geo.attributes.normal;
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m);
        pos.set([v.x, v.y, v.z], (base + i) * 3);
        v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
        nor.set([v.x, v.y, v.z], (base + i) * 3);
      }
      if (geo.index) for (let i = 0; i < geo.index.count; i++) idx.push(base + geo.index.getX(i));
      else for (let i = 0; i < P.count; i++) idx.push(base + i);
      base += P.count;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setIndex(idx);
    g.userData.smooth = true;
    // The first piece's rings, for `frontOf` — valid while it is placed at the
    // identity, which is how every caller that decals a merged head uses it.
    g.userData.rings = pieces[0].geo.userData.rings;
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  });
}

/** A matrix from position, Euler rotation and scale — `merge`'s placement. */
export function place(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz)
  );
}
