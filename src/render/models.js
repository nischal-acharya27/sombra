// Every character in the game, built from boxes at load time.
//
// There are no asset files. Models are hierarchies of `part()` groups whose
// origin sits at the joint they rotate around, so animation is a matter of
// setting Euler angles on named nodes (see each character's animator).
//
// Orientation convention, and it matters everywhere: models are built facing
// **+X**, which is the direction of travel in this side-on game. That makes Z
// the character's lateral axis, so paired limbs are offset in Z, not X. The
// camera sits at +Z, so the rig is also yawed slightly toward it (see TILT in
// game/actor.js) to get a three-quarter read instead of a flat profile.

import * as THREE from 'three';
import { toonMaterial, glowMaterial, outlineFor, faceted } from './toon.js';
import { P } from './palette.js';
import { loft, loftX, frontOf, limbRings, blobRings, blockRings, trunkRings, skullRings, skirtRings, bootGeo, tubeGeo, merge, place } from './shapes.js';

/**
 * The page's own `Math.random`, captured when this module loads — before
 * `tools/sim.js` has seeded anything.
 */
const pageRandom = Math.random;

/**
 * Run `build` with the page's own `Math.random` in place, then put back
 * whatever stream was there.
 *
 * Three.js draws four `Math.random()` values for the UUID of every object,
 * geometry and material it constructs, and the suite plays the game against
 * a seeded `Math.random`. Enemies are built when their encounter spawns them,
 * mid-run, so every rig used to spend the gameplay stream by however many
 * objects it happened to contain — which made the *art* a gameplay input: a
 * redrawn horn re-rolled every enemy's jitter after the first spawn, and the
 * suite could not tell an art pass from a behaviour change. Wrapped in this,
 * a rig build draws nothing from the stream whatever it contains.
 *
 * Only the build goes inside. An enemy's gameplay draws (its first cooldown,
 * its leg phase) stay outside on the seeded stream, where they belong.
 */
export function unseeded(build) {
  const stream = Math.random;
  Math.random = pageRandom;
  try {
    return build();
  } finally {
    Math.random = stream;
  }
}

const matCache = new Map();

/** Shared cel material per colour, so a crowd of raakchyas costs one material. */
export function mat(color, opts = {}) {
  const key = `${color}|${JSON.stringify(opts)}`;
  let m = matCache.get(key);
  if (!m) {
    m = toonMaterial({ color, ...opts });
    matCache.set(key, m);
  }
  return m;
}

const geoCache = new Map();
function box(w, h, d) {
  const key = `${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    geoCache.set(key, g);
  }
  return g;
}

/**
 * A box whose group origin is at `pivot`, so rotating the group swings the box
 * from that joint. 'top' is what limbs want; 'center' is what a torso wants.
 */
export function part(w, h, d, color, { pivot = 'center', outline = 0.022, material, opts } = {}) {
  const g = new THREE.Group();
  const geo = box(w, h, d);
  const m = new THREE.Mesh(geo, material || mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  const dy = pivot === 'top' ? -h / 2 : pivot === 'bottom' ? h / 2 : 0;
  m.position.y = dy;
  g.add(m);
  if (outline > 0) {
    const o = outlineFor(geo, outline);
    o.position.y = dy;
    g.add(o);
  }
  g.userData.mesh = m;
  return g;
}

/**
 * A flat emissive quad sitting just outside a surface.
 *
 * Glow details must never be embedded *inside* the parent box. Intersecting
 * geometry has no correct draw order and the two surfaces z-fight into
 * confetti. DoubleSide matters too: characters turn by yawing 180°, and a
 * one-sided decal would vanish the moment they faced the other way.
 */
// ---------------------------------------------------------------------------
// Non-box primitives
//
// `part()` above is the whole game's vocabulary and stays that way: a box is
// the right answer for a limb, a torso, a plate, a plinth. It is the wrong
// answer for a flared robe, a skull, a crown band or a staff shaft, and gate
// 1's Warden needed all four (`docs/DECISIONS.md` § "Shakuni is rebuilt as a
// courtier"). These are the same shape as `part()` — a group whose origin is
// at the joint, a cel material from `mat()`, an inverted-hull outline — with
// the geometry handed in rather than derived from three numbers.
//
// Everything is cached by shape key for the same reason `box()` is: a crowd of
// anything must not cost a geometry each, and `faceted()` (which splits every
// vertex) is expensive enough that doing it twice for the same cylinder would
// be careless.

const shapeCache = new Map();
function cached(key, build) {
  let g = shapeCache.get(key);
  if (!g) {
    g = build();
    shapeCache.set(key, g);
  }
  return g;
}

/** A tapered cylinder, faceted. `seg` low: this is a cel-shaded game. */
export function cyl(rTop, rBot, h, seg = 8) {
  return cached(`cyl:${rTop},${rBot},${h},${seg}`, () =>
    faceted(new THREE.CylinderGeometry(rTop, rBot, h, seg))
  );
}

/** A low-poly sphere. Faceted, so it reads as carved rather than rendered. */
export function sph(r, wSeg = 10, hSeg = 7) {
  return cached(`sph:${r},${wSeg},${hSeg}`, () => faceted(new THREE.SphereGeometry(r, wSeg, hSeg)));
}

/** A ring of material — crown bands, staff collars, necklaces. */
export function tor(r, tube, radial = 6, tubular = 16) {
  return cached(`tor:${r},${tube},${radial},${tubular}`, () =>
    faceted(new THREE.TorusGeometry(r, tube, radial, tubular))
  );
}

export function cone(r, h, seg = 7) {
  return cached(`cone:${r},${h},${seg}`, () => faceted(new THREE.ConeGeometry(r, h, seg)));
}

/** A gem. Eight faces is the cheapest shape that catches light like a jewel. */
export function octa(r) {
  return cached(`octa:${r}`, () => faceted(new THREE.OctahedronGeometry(r)));
}

/**
 * A surface of revolution from a 2D profile — `[[radius, y], ...]`, bottom to
 * top. This is what a layered robe is: a silhouette that flares, steps in at
 * each layer's hem, and flares again. A stack of boxes cannot do it and a cone
 * cannot either, because the *steps* are the layering.
 */
export function lathe(profile, seg = 10) {
  return cached(`lathe:${JSON.stringify(profile)},${seg}`, () => {
    const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
    return faceted(new THREE.LatheGeometry(pts, seg));
  });
}

/**
 * `part()`'s shape, with the geometry handed in.
 *
 * `pivot` is resolved off the geometry's own bounding box rather than a passed
 * height, so a lathe and a sphere both hang correctly from 'top' without the
 * caller doing the arithmetic.
 */
export function shaped(geo, color, { pivot = 'center', outline = 0.02, outlineColor, material, opts } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, material || mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const dy = pivot === 'top' ? -bb.max.y : pivot === 'bottom' ? -bb.min.y : 0;
  m.position.y = dy;
  g.add(m);
  if (outline > 0) {
    const o = outlineFor(geo, outline, outlineColor);
    o.position.y = dy;
    g.add(o);
  }
  g.userData.mesh = m;
  return g;
}

export function decal(w, h, color, { opacity = 1 } = {}) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: opacity < 1,
      opacity,
      fog: false,
      toneMapped: false, // stays above the bloom threshold
    })
  );
  return m;
}

// ---------------------------------------------------------------------------
// Lofted parts
//
// The same contract as `part()` — a group whose origin is the joint it turns
// on, a cel material from `mat()`, an ink outline — with a lofted body from
// `shapes.js` inside instead of a box. Each takes the w/h/d of the box it
// replaces (w along X, the facing axis; d along Z, the lateral one), so a rig
// converts one call at a time and its joints, and therefore its animator,
// never move. See `docs/DECISIONS.md` § "The rigs are rebuilt from lofted
// forms".
// ---------------------------------------------------------------------------

/** A lofted geometry as a part. `dy` offsets the mesh inside its group, the way `part()` resolves a pivot. */
function softPart(geo, color, { outline = 0.02, opts, material, dy = 0, flip = false } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, material || mat(color, opts));
  // Cast, never receive. A curved surface self-shadowing under a 2048 map
  // breaks into blotches — a dark bruise across a belly or a breastplate —
  // where the toon ramp alone draws one clean terminator. The ground still
  // takes every character's shadow.
  m.castShadow = true;
  m.receiveShadow = false;
  m.position.y = dy;
  if (flip) m.rotation.z = Math.PI;
  g.add(m);
  if (outline > 0) {
    const o = outlineFor(geo, outline);
    o.position.y = dy;
    if (flip) o.rotation.z = Math.PI;
    g.add(o);
  }
  g.userData.mesh = m;
  g.userData.dy = dy;
  return g;
}

/**
 * A limb segment hanging from its joint: `w`×`d` at the joint, narrowing by
 * `taper` over `h` to the next joint, with round ends centred on both joints
 * so a bent elbow or knee stays closed. `up` stands it on its joint instead.
 */
export function limb(w, h, d, color, { taper = 0.8, bulge = 0.08, bulgeAt = 0.3, p = 2, seg = 10, outline = 0.018, up = false, opts, material } = {}) {
  const { rings, bottomY, topY } = limbRings(w / 2, d / 2, (w / 2) * taper, (d / 2) * taper, h, { bulge, bulgeAt, p });
  return softPart(loft(rings, { seg, bottomY, topY }), color, { outline, opts, material, flip: up });
}

/**
 * A torso standing on its hips (the group origin), `h` to the base of the
 * neck: waist, ribcage, shoulders, in one surface. See `trunkRings` for the
 * shaping options.
 */
export function trunk(w, h, d, color, { outline = 0.026, seg = 14, opts, material, ...shape } = {}) {
  const { rings, bottomY, topY } = trunkRings(w / 2, h, d / 2, shape);
  return softPart(loft(rings, { seg, bottomY, topY }), color, { outline, opts, material });
}

/** A head sitting on its neck (the group origin), face toward +X. See `skullRings`. */
export function skull(w, h, d, color, { outline = 0.02, seg = 16, opts, material, ...shape } = {}) {
  const { rings, bottomY, topY } = skullRings(w / 2, h, d / 2, shape);
  return softPart(loft(rings, { seg, bottomY, topY }), color, { outline, opts, material });
}

/** A rounded block — `part()` with its edges eased. `round` is the edge radius over the smallest half-size. */
export function block(w, h, d, color, { pivot = 'center', round = 0.35, p, seg = 12, outline = 0.02, opts, material } = {}) {
  const { rings, bottomY, topY } = blockRings(w / 2, h / 2, d / 2, { round, p });
  const dy = pivot === 'top' ? -h / 2 : pivot === 'bottom' ? h / 2 : 0;
  return softPart(loft(rings, { seg, bottomY, topY }), color, { outline, opts, material, dy });
}

/** An ellipsoid filling a w×h×d box. `p` above 2 squares its plan, `pv` its elevation. */
export function blob(w, h, d, color, { pivot = 'center', p = 2, pv = 2, seg = 12, n = 7, outline = 0.02, opts, material } = {}) {
  const { rings, bottomY, topY } = blobRings(w / 2, h / 2, d / 2, { p, pv, n });
  const dy = pivot === 'top' ? -h / 2 : pivot === 'bottom' ? h / 2 : 0;
  return softPart(loft(rings, { seg, bottomY, topY }), color, { outline, opts, material, dy });
}

/** A foot hanging from the ankle, toe toward +X, sole flat at `-h`. */
export function boot(w, h, d, color, { toe = 0.34, outline = 0.016, opts, material } = {}) {
  return softPart(bootGeo(w, h, d, { toe }), color, { outline, opts, material });
}

/** A skirt or robe hanging from the waist, flaring to the hem. See `skirtRings`. */
export function skirt(wT, dT, wB, dB, len, color, { outline = 0.024, seg = 18, opts, material, ...shape } = {}) {
  const { rings, bottomY, topY } = skirtRings(wT / 2, dT / 2, wB / 2, dB / 2, len, shape);
  return softPart(loft(rings, { seg, bottomY, topY }), color, { outline, opts, material });
}

/** A tapered tube along `[[x, y, z, r], ...]` — horns, tails, tusks, locks. */
export function tube(pts, color, { seg = 8, squash = 1, outline = 0.014, opts, material } = {}) {
  return softPart(tubeGeo(pts, { seg, squash }), color, { outline, opts, material });
}

/** A loft along +X as a part — a beast's barrel, a snout, a jaw. See `loftX`. */
export function barrel(rings, color, { seg = 12, backX, frontX, outline = 0.022, opts, material } = {}) {
  return softPart(loftX(rings, { seg, backX, frontX }), color, { outline, opts, material });
}

/** Any ring list as a part — for the one-off shapes (a collar, a hood) no recipe covers. */
export function ringed(rings, color, { seg = 12, bottomY, topY, outline = 0.02, opts, material, dy = 0 } = {}) {
  return softPart(loft(rings, { seg, bottomY, topY }), color, { outline, opts, material, dy });
}

/**
 * A hand hanging from the wrist: a rounded mitten and a thumb on its inner
 * side, merged into one mesh. `fist` balls it up, for a hand that grips.
 */
export function mitt(w, h, d, color, { fist = true, side = 1, outline = 0.012, opts, material } = {}) {
  const key = `mitt:${w},${h},${d},${fist},${side}`;
  const palm = blockRings(w / 2, h / 2, d / 2, { round: fist ? 0.7 : 0.5 });
  const thumb = limbRings(w * 0.2, w * 0.18, w * 0.15, w * 0.14, h * 0.42, { bulge: 0 });
  const geo = merge(key, [
    { geo: loft(palm.rings, { seg: 10, bottomY: palm.bottomY, topY: palm.topY }), matrix: place(0, -h / 2) },
    {
      geo: loft(thumb.rings, { seg: 8, bottomY: thumb.bottomY, topY: thumb.topY }),
      matrix: place(w * 0.34, -h * 0.18, side * -d * 0.22, side * 0.35, 0, 0.5),
    },
  ]);
  return softPart(geo, color, { outline, opts, material });
}

/**
 * A cap grown from a lofted head's own rings above `from` — hair, a helm, a
 * hood's crown — so it hugs the skull it sits on instead of being guessed
 * at and burying the face. `grow` scales it out from the skull, `back`
 * slides it toward the nape, and `brow` pulls the front edge further back
 * still so a fringe never crosses the eyes.
 */
export function capOf(head, from, color, { grow = 1.08, back = 0.0, brow = 0.0, hairline = Infinity, seg = 16, outline = 0.016, wave = 0, waves = 7, opts } = {}) {
  const geo = head.userData.mesh.geometry;
  const src = geo.userData.rings;
  const dy = head.userData.dy ?? 0;
  const bb = geo.boundingBox;
  // Grown about the skull's own centre rather than ring by ring, so the cap
  // stands off the crown as far as it does off the temples: scaling each
  // ring's radius leaves almost no margin where the radius is small.
  const cy = (bb.min.y + bb.max.y) / 2;
  // Start exactly at `from`: the skull's ring there, interpolated, then every
  // ring above it.
  const y0 = from - dy;
  let k = 0;
  while (k < src.length - 2 && src[k + 1].y < y0) k++;
  const a = src[k];
  const b = src[k + 1];
  const t = THREE.MathUtils.clamp((y0 - a.y) / (b.y - a.y || 1), 0, 1);
  const mix = (f) => (a[f] ?? 0) + ((b[f] ?? 0) - (a[f] ?? 0)) * t;
  const start = { y: y0, rx: mix('rx'), rz: mix('rz'), x: mix('x'), z: mix('z'), p: a.p ?? 2 };
  // `back` slides the cap's lower edge toward the nape, fading out toward the
  // crown; `brow` pulls its front edge clear of the face below `hairline`
  // and lets it come forward over the forehead above it.
  const list = [start, ...src.filter((r) => r.y > y0 + 1e-4)];
  const rings = list.map((r, i) => {
    const fade = 1 - i / Math.max(1, list.length - 1);
    const below = 1 - THREE.MathUtils.smoothstep(r.y + dy, hairline - 0.025, hairline + 0.025);
    const w = hairline === Infinity ? fade : below;
    return {
      ...r,
      y: cy + (r.y - cy) * grow + dy,
      rx: r.rx * grow - brow * 0.5 * w,
      rz: r.rz * grow,
      x: (r.x ?? 0) * grow - back * fade - brow * 0.5 * w,
      wave: i < 2 ? wave : 0,
      waves,
    };
  });
  const top = cy + (bb.max.y - cy) * grow + dy;
  const cap = ringed(rings, color, { seg, bottomY: rings[0].y, topY: top, outline, opts });
  head.parent ? head.parent.add(cap) : head.add(cap);
  cap.position.copy(head.position);
  return cap;
}

/**
 * A nose on a lofted face: bridge from `top` down to a tip `len` below it,
 * standing `jut` proud of the surface. The side camera sees every head in
 * near-profile, and a profile with no nose reads as a mannequin.
 */
export function nose(face, top, len, color, { jut = 0.03, r = 0.016, outline = 0.006 } = {}) {
  const geo = face.userData.mesh.geometry;
  const dy = face.userData.dy ?? 0;
  const at = (y) => frontOf(geo, y - dy, 0).x;
  const n = tube(
    [
      [at(top) - 0.004, top, 0, r * 0.7],
      [at(top - len * 0.6) + jut * 0.7, top - len * 0.6, 0, r],
      [at(top - len) + jut, top - len, 0, r * 0.9],
      [at(top - len) + jut * 0.4, top - len - r * 0.8, 0, r * 0.3],
    ],
    color,
    { seg: 6, outline }
  );
  face.add(n);
  return n;
}

/**
 * Lay a decal flat on a lofted part's front (+X) surface, at `y` in the
 * part's own frame and lateral offset `z`, lifted `lift` clear of it.
 *
 * A box had a front plane to put an eye on; a curved face does not, and a
 * decal parked where the plane used to be floats visibly clear of the cheek
 * the moment the rig turns. This finds the surface and its facing instead.
 */
export function onFront(target, d, y, z, lift = 0.004) {
  const geo = target.userData.mesh.geometry;
  const f = frontOf(geo, y - (target.userData.dy ?? 0), z);
  d.position.set(f.x + lift * Math.sin(f.yaw), y, z + lift * Math.cos(f.yaw));
  d.rotation.y = f.yaw;
  target.add(d);
  return d;
}

// ---------------------------------------------------------------------------
// The hunter
// ---------------------------------------------------------------------------

export function buildHunter() {
  const root = new THREE.Group();
  const n = {}; // named nodes the animator drives

  // Root origin is at the feet, so world position is ground contact.
  const hips = new THREE.Group();
  hips.position.y = 0.74;
  root.add(hips);
  n.hips = hips;

  // The seat of the trousers: what the thighs' ball joints turn inside, so a
  // stride never opens a gap at the crotch.
  const seat = blob(0.27, 0.2, 0.34, P.hunterCoatDark, { outline: 0.018 });
  seat.position.y = -0.03;
  hips.add(seat);

  // The coat: narrow at the belt, full through the chest, shoulders sloping
  // into a high collar.
  const torso = trunk(0.3, 0.5, 0.4, P.hunterCoat, { waist: 0.74, chest: 0.12 });
  hips.add(torso);
  n.torso = torso;

  // A standing collar, leaned back so it frames the jaw instead of hiding it.
  const collar = ringed(
    [
      { y: -0.02, rx: 0.1, rz: 0.13 },
      { y: 0.04, rx: 0.112, rz: 0.138 },
      { y: 0.1, rx: 0.124, rz: 0.148, x: -0.008 },
      { y: 0.125, rx: 0.118, rz: 0.142, x: -0.012 },
    ],
    P.hunterCoatDark,
    { seg: 14, outline: 0.016 }
  );
  collar.position.y = 0.44;
  collar.rotation.z = 0.32;
  torso.add(collar);

  // The coat's open front: a darker placket down the chest, and the belt.
  const placket = decal(0.05, 0.34, P.hunterCoatDark);
  onFront(torso, placket, 0.24, 0, 0.003);
  const belt = ringed(
    [
      { y: -0.005, rx: 0.123, rz: 0.158, p: 2.4 },
      { y: 0.07, rx: 0.121, rz: 0.156, p: 2.4 },
    ],
    P.hunterTrim,
    { seg: 14, outline: 0.012 }
  );
  torso.add(belt);
  const buckle = block(0.03, 0.06, 0.07, P.bladeSteel, { outline: 0.008, round: 0.4 });
  buckle.position.set(0.128, 0.032, 0);
  torso.add(buckle);

  // Coat tails — two loose panels behind the hips that the animator swings.
  for (const side of [-1, 1]) {
    const tail = ringed(
      [
        { y: -0.56, rx: 0.016, rz: 0.085, x: -0.07, p: 2.6 },
        { y: -0.52, rx: 0.024, rz: 0.1, x: -0.058, p: 2.6 },
        { y: -0.26, rx: 0.028, rz: 0.094, x: -0.02, p: 2.6 },
        { y: 0, rx: 0.032, rz: 0.084, p: 2.6 },
        { y: 0.03, rx: 0.022, rz: 0.07, p: 2.6 },
      ],
      P.hunterCoatDark,
      { seg: 10, outline: 0.014 }
    );
    tail.position.set(-0.08, 0.04, side * 0.095);
    hips.add(tail);
    n[side < 0 ? 'coatL' : 'coatR'] = tail;
  }

  // Chest sigil: the mark of the System.
  const sigil = decal(0.075, 0.075, P.cyan);
  onFront(torso, sigil, 0.32, 0.07, 0.006);
  sigil.rotation.z = Math.PI / 4;
  n.sigil = sigil;

  const head = new THREE.Group();
  head.position.y = 0.5;
  torso.add(head);
  n.head = head;

  const neck = limb(0.1, 0.08, 0.1, P.hunterSkin, { taper: 1, bulge: 0, outline: 0.012, up: true });
  neck.position.y = -0.04;
  head.add(neck);

  const face = skull(0.24, 0.27, 0.23, P.hunterSkin, { jaw: 0.68 });
  face.position.y = 0.02;
  head.add(face);

  // Hair: a swept mass over the crown and back, bangs over the brow, and
  // spikes raking back — the silhouette that says anime hunter at any size.
  const hair = ringed(
    [
      { y: 0.1, rx: 0.1, rz: 0.1, x: -0.06 },
      { y: 0.14, rx: 0.13, rz: 0.125, x: -0.03 },
      { y: 0.2, rx: 0.14, rz: 0.13, x: -0.01 },
      { y: 0.26, rx: 0.135, rz: 0.13, x: 0 },
      { y: 0.3, rx: 0.115, rz: 0.115, x: -0.005 },
      { y: 0.325, rx: 0.07, rz: 0.075, x: -0.01 },
    ],
    P.hunterHair,
    { seg: 14, outline: 0.016, topY: 0.335, bottomY: 0.1 }
  );
  hair.position.y = 0.02;
  head.add(hair);
  // Bangs: locks falling over the brow, and one at each temple, pointing
  // down and forward — the face-framing half of the silhouette.
  const bangs = [
    // z, length, lateral lean, forward reach
    [-0.075, 0.1, -0.35, 0.05],
    [-0.025, 0.13, -0.1, 0.06],
    [0.03, 0.12, 0.15, 0.06],
    [0.08, 0.09, 0.4, 0.045],
    [-0.115, 0.14, -0.1, 0.0],
    [0.115, 0.14, 0.1, 0.0],
  ];
  for (const [z, len, lean, reach] of bangs) {
    const temple = Math.abs(z) > 0.1;
    const x0 = temple ? 0.02 : 0.075;
    const lock = tube(
      [
        [x0, 0.31, z, 0.036],
        [x0 + reach, 0.28, z + lean * 0.04, 0.03],
        [x0 + reach * 1.25, 0.31 - len, z + lean * 0.08, 0.005],
      ],
      P.hunterHair,
      { seg: 6, outline: 0.011, squash: 0.62 }
    );
    lock.position.y = 0.02;
    head.add(lock);
  }

  // Spikes raking back off the crown and the nape, fanned in Z so the head
  // reads spiky from the side the camera sees, not just in profile.
  const spikes = [
    // x, y, z, length, radius, lateral spread, lift
    [0.0, 0.33, 0.0, 0.12, 0.05, 0.0, 0.45],
    [-0.05, 0.32, -0.07, 0.12, 0.045, -0.5, 0.35],
    [-0.05, 0.32, 0.07, 0.12, 0.045, 0.5, 0.35],
    [-0.1, 0.27, 0.0, 0.14, 0.05, 0.0, 0.15],
    [-0.1, 0.25, -0.09, 0.11, 0.04, -0.6, 0.05],
    [-0.1, 0.25, 0.09, 0.11, 0.04, 0.6, 0.05],
    [-0.11, 0.18, -0.05, 0.1, 0.04, -0.3, -0.25],
    [-0.11, 0.18, 0.05, 0.1, 0.04, 0.3, -0.25],
  ];
  for (const [x, y, z, len, r, spread, lift] of spikes) {
    const s = tube(
      [
        [x, y, z, r],
        [x - len * 0.55, y + len * lift * 0.6, z + spread * len * 0.35, r * 0.6],
        [x - len, y + len * lift, z + spread * len * 0.8, r * 0.08],
      ],
      P.hunterHair,
      { seg: 7, outline: 0.012 }
    );
    head.add(s);
  }

  nose(face, 0.15, 0.06, P.hunterSkin, { jut: 0.022, r: 0.014 });

  // Eyes on the face: the direction the model faces.
  for (const side of [-1, 1]) {
    const eye = decal(0.055, 0.032, P.cyan);
    onFront(face, eye, 0.155, side * 0.056, 0.004);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
    const brow = decal(0.06, 0.014, P.hunterHair);
    onFront(face, brow, 0.19, side * 0.058, 0.004);
    brow.rotation.z = side * 0.18;
  }

  // Arms. Offset in Z because the lateral axis is Z when facing +X.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.44, side * 0.21);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(0.135, 0.26, 0.135, P.hunterCoat, { taper: 0.84, bulge: 0.06 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.118, 0.25, 0.118, P.hunterCoatDark, { taper: 0.78, bulge: 0.07 });
    elbow.add(fore);
    const cuff = ringed(
      [
        { y: -0.235, rx: 0.052, rz: 0.052 },
        { y: -0.2, rx: 0.058, rz: 0.058 },
        { y: -0.16, rx: 0.056, rz: 0.056 },
      ],
      P.hunterTrim,
      { seg: 10, outline: 0.01 }
    );
    elbow.add(cuff);

    const hand = mitt(0.1, 0.1, 0.11, P.hunterSkin, { side });
    hand.position.y = -0.245;
    elbow.add(hand);
    n['hand' + key] = hand;
  }

  // Legs.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.1);
    hips.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.155, 0.34, 0.16, P.hunterCoatDark, { taper: 0.8, bulge: 0.1 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.34;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.13, 0.32, 0.135, P.hunterCoatDark, { taper: 0.72, bulge: 0.12, bulgeAt: 0.22 });
    knee.add(shin);
    // Boots to mid-shin: the trim colour, flared at the top.
    const shaft = ringed(
      [
        { y: -0.33, rx: 0.052, rz: 0.054 },
        { y: -0.22, rx: 0.058, rz: 0.06 },
        { y: -0.12, rx: 0.07, rz: 0.072 },
        { y: -0.1, rx: 0.066, rz: 0.068 },
      ],
      P.hunterTrim,
      { seg: 10, outline: 0.012 }
    );
    knee.add(shaft);

    const foot = boot(0.23, 0.09, 0.14, P.hunterTrim);
    foot.position.set(0.04, -0.31, 0);
    knee.add(foot);
  }

  // The blade, parented to the right hand.
  const sword = buildBlade();
  n.handR.add(sword);
  sword.position.set(0.02, -0.06, 0);
  n.sword = sword;

  root.userData.nodes = n;
  return root;
}

function buildBlade() {
  const g = new THREE.Group();

  const grip = part(0.05, 0.16, 0.05, 0x1a1626, { pivot: 'bottom', outline: 0.012 });
  g.add(grip);

  const guard = part(0.07, 0.04, 0.24, P.violetDeep, { pivot: 'bottom', outline: 0.012 });
  guard.position.y = 0.16;
  g.add(guard);

  const blade = buildKhukuriBlade();
  blade.position.y = 0.20;
  g.add(blade);

  // Fuller: a violet glow line down each face of the blade, offset outward so
  // it never intersects the blade mesh.
  for (const side of [-1, 1]) {
    const line = decal(0.035, 0.66, P.violetGlow);
    line.position.set(side * 0.024, 0.58, 0.03);
    line.rotation.y = Math.PI / 2;
    g.add(line);
  }

  g.userData.length = 1.0;
  return g;
}

/**
 * The khukuri: an inward-curved blade — the edge sweeps back toward the
 * handle rather than away from it, the opposite curl from a scimitar — with
 * a wide belly that narrows into the point, and a small notch (the *kaudi*,
 * or *cho*) cut into the edge where it meets the guard.
 *
 * Built as a 2D profile and extruded, not another `part()` box: the curve is
 * the entire point of a khukuri's silhouette and a box cannot bend. The
 * profile is drawn with `x` as the edge-side curve offset and `y` as the
 * length from guard (0) to point (1), because that is the plane a
 * `THREE.Shape` draws in; `rotateY` afterward swaps the extrude's thin
 * `z` axis (blade thickness) onto local `x` and the curve onto local `z`, so
 * the finished mesh drops into the rig exactly where the old box did — thin
 * on `x`, long on `y`, curving on `z`.
 */
function buildKhukuriBlade() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  // Spine: a shallow outward bow up to the point. Almost straight — the
  // curve that reads as "khukuri" belongs to the edge, not the spine.
  shape.quadraticCurveTo(-0.02, 0.55, 0, 0.97);
  shape.lineTo(0.015, 1.0); // the point
  // Edge, tip to belly: sweeps wide first — this is the widest the blade
  // gets, well past the halfway mark, which is what makes it read as a
  // khukuri's belly rather than a straight dagger.
  shape.quadraticCurveTo(0.17, 0.84, 0.21, 0.60);
  // Edge, belly to hilt: curves back *in* toward the handle line — the
  // inward curl that is the whole difference from a scimitar's outward one.
  shape.quadraticCurveTo(0.25, 0.38, 0.15, 0.21);
  shape.quadraticCurveTo(0.10, 0.13, 0.065, 0.095);
  shape.lineTo(0.065, 0.06);
  // The kaudi: a small notch cut into the edge right at the guard, the
  // detail that most reliably reads as "khukuri" rather than "curved knife".
  shape.absarc(0.035, 0.05, 0.028, 0, Math.PI, true);
  shape.lineTo(0, 0);

  const depth = 0.05;
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 });
  geo.translate(0, 0, -depth / 2);
  geo.rotateY(Math.PI / 2);
  faceted(geo);

  const m = new THREE.Mesh(geo, mat(P.bladeSteel));
  m.castShadow = true;
  m.receiveShadow = true;
  const g = new THREE.Group();
  g.add(m);
  g.add(outlineFor(geo, 0.015));
  g.userData.mesh = m;
  return g;
}

// ---------------------------------------------------------------------------
// Raakchyas — the quadruped grunt
// ---------------------------------------------------------------------------

/**
 * The quadruped grunt, and — with `skin` — the chaya raised from one.
 *
 * The ally is the same rig in different colours rather than a second model,
 * which is not laziness: measured, a second raakchyas costs zero extra shader
 * programs and at most two geometries, because `mat()` and `box()` both cache.
 * Recolouring changes uniform values, not the material type, so the ally
 * allocates essentially nothing and adds no compile.
 */
export function buildRaakchyas(skin = null) {
  const c = skin || { body: P.raakchyasBody, dark: P.raakchyasBodyDark, spine: P.violetDeep, eye: P.raakchyasEye };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.62;
  root.add(body);
  n.body = body;

  // A hound's barrel: deep through the chest, tucked at the waist, rising
  // again into the haunches — the silhouette of something built to lunge.
  const chest = barrel(
    [
      { x: -0.46, ry: 0.1, rz: 0.1, y: 0.03 },
      { x: -0.4, ry: 0.16, rz: 0.16, y: 0.03 },
      { x: -0.27, ry: 0.19, rz: 0.19, y: 0.04 },
      { x: -0.1, ry: 0.145, rz: 0.15, y: 0.06 },
      { x: 0.1, ry: 0.19, rz: 0.2, y: 0.01 },
      { x: 0.27, ry: 0.23, rz: 0.23, y: -0.01 },
      { x: 0.4, ry: 0.19, rz: 0.2, y: 0.03 },
      { x: 0.47, ry: 0.11, rz: 0.12, y: 0.06 },
    ],
    c.body,
    { seg: 14, backX: -0.5, frontX: 0.5, outline: 0.026 }
  );
  body.add(chest);
  n.chest = chest;

  // Spines along the back, raking toward the tail.
  for (let i = 0; i < 4; i++) {
    const len = 0.2 - i * 0.025;
    const x0 = 0.28 - i * 0.17;
    const spine = tube(
      [
        [x0, 0.17, 0, 0.04],
        [x0 - len * 0.35, 0.17 + len * 0.6, 0, 0.026],
        [x0 - len * 0.9, 0.17 + len * 0.95, 0, 0.004],
      ],
      c.spine,
      { seg: 6, outline: 0.012 }
    );
    body.add(spine);
  }

  const neck = new THREE.Group();
  neck.position.set(0.4, 0.1, 0);
  body.add(neck);
  n.neck = neck;

  // The head: a heavy brow over a tapering muzzle, ears laid back, fangs
  // hanging past the lip.
  const head = barrel(
    [
      { x: -0.06, ry: 0.07, rz: 0.08, y: 0.02 },
      { x: 0.02, ry: 0.13, rz: 0.15, y: 0.03 },
      { x: 0.13, ry: 0.135, rz: 0.155, y: 0.03 },
      { x: 0.24, ry: 0.095, rz: 0.11, y: 0.0 },
      { x: 0.34, ry: 0.075, rz: 0.085, y: -0.02 },
      { x: 0.39, ry: 0.05, rz: 0.06, y: -0.02 },
    ],
    c.dark,
    { seg: 12, backX: -0.1, frontX: 0.41, outline: 0.022 }
  );
  neck.add(head);
  for (const side of [-1, 1]) {
    const ear = tube(
      [
        [0.02, 0.12, side * 0.08, 0.035],
        [-0.06, 0.2, side * 0.11, 0.022],
        [-0.14, 0.24, side * 0.12, 0.004],
      ],
      c.dark,
      { seg: 6, outline: 0.012, squash: 0.55 }
    );
    neck.add(ear);
    const fang = tube(
      [
        [0.31, -0.06, side * 0.045, 0.016],
        [0.325, -0.12, side * 0.045, 0.01],
        [0.33, -0.16, side * 0.043, 0.002],
      ],
      P.bone,
      { seg: 5, outline: 0.006 }
    );
    neck.add(fang);
  }

  const jaw = barrel(
    [
      { x: -0.16, ry: 0.035, rz: 0.08, y: -0.04 },
      { x: -0.05, ry: 0.045, rz: 0.09, y: -0.045 },
      { x: 0.06, ry: 0.04, rz: 0.075, y: -0.045 },
      { x: 0.12, ry: 0.03, rz: 0.055, y: -0.04 },
    ],
    c.dark,
    { seg: 10, backX: -0.18, frontX: 0.14, outline: 0.016 }
  );
  jaw.position.set(0.26, -0.1, 0);
  neck.add(jaw);
  n.jaw = jaw;

  // Eyes set into the brow, angled forward and out so the near one faces
  // the camera as the rig turns.
  for (const side of [-1, 1]) {
    const eye = decal(0.08, 0.045, c.eye);
    eye.position.set(0.25, 0.065, side * 0.105);
    eye.rotation.set(0, Math.PI / 2 - side * 0.75, side * -0.2);
    neck.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  // Legs: straight at the front, a hock at the back. Each is one rigid
  // piece swung from its hip, as before.
  let i = 0;
  for (const fx of [0.3, -0.3]) {
    const front = fx > 0;
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(fx, -0.18, side * 0.17);
      body.add(hip);
      const pts = front
        ? [[0, 0.1, 0, 0.085], [0.01, -0.1, 0, 0.066], [0.0, -0.26, 0, 0.046], [0.03, -0.33, 0, 0.042]]
        : [[0, 0.12, 0, 0.1], [0.05, -0.08, 0, 0.075], [-0.04, -0.24, 0, 0.045], [0.0, -0.33, 0, 0.042]];
      const leg = tube(pts, c.dark, { seg: 8, outline: 0.016 });
      hip.add(leg);
      const paw = boot(0.17, 0.08, 0.14, c.dark, { toe: 0.45 });
      paw.position.set(0.03, -0.33, 0);
      hip.add(paw);
      n['leg' + i] = hip;
      i++;
    }
  }

  const tail = new THREE.Group();
  tail.position.set(-0.42, 0.08, 0);
  body.add(tail);
  n.tail = tail;
  const tailSeg = tube(
    [
      [0.04, 0, 0, 0.06],
      [-0.12, 0.02, 0, 0.045],
      [-0.26, 0.06, 0, 0.03],
      [-0.38, 0.12, 0, 0.012],
    ],
    c.dark,
    { seg: 7, outline: 0.014 }
  );
  tail.add(tailSeg);

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Charger — the enemy that punishes standing still
// ---------------------------------------------------------------------------

/**
 * Built low, long and front-heavy, because the silhouette has to say "this
 * travels in a straight line" before the hunter has ever seen it do so.
 *
 * The node names are the raakchyas's on purpose — `body`, `neck`, `eyeL`,
 * `eyeR`, `leg0..3`. The eye flare is the game's shared vocabulary for "this
 * is about to commit", and an enemy whose tell is animated through
 * differently named nodes is an enemy whose tell drifts out of agreement with
 * the others.
 *
 * `skin` follows `buildRaakchyas`'s lead, for the same reason: a chaya raised
 * from a Charger's remnant wears this rig in the System's colours rather than
 * the hostile charger's slate and bone. See `SKIN` in game/shadow.js.
 */
export function buildCharger(skin = null) {
  const c = skin || { body: P.chargerHide, dark: P.chargerHideDark, eye: P.chargerEye };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.68;
  root.add(body);
  n.body = body;

  // Front-heavy: a bull's depth through the chest falling away to narrow
  // hindquarters, so the mass visibly leads.
  const chest = barrel(
    [
      { x: -0.5, ry: 0.13, rz: 0.15, y: 0.04 },
      { x: -0.42, ry: 0.2, rz: 0.23, y: 0.03 },
      { x: -0.24, ry: 0.23, rz: 0.27, y: 0.02 },
      { x: -0.02, ry: 0.25, rz: 0.29, y: 0.0 },
      { x: 0.22, ry: 0.29, rz: 0.32, y: -0.02 },
      { x: 0.42, ry: 0.27, rz: 0.3, y: -0.03 },
      { x: 0.53, ry: 0.17, rz: 0.2, y: -0.05 },
    ],
    c.body,
    { seg: 14, backX: -0.56, frontX: 0.57, outline: 0.03 }
  );
  body.add(chest);

  // The slab over the shoulders: the part that arrives first, and the
  // heaviest thing on the model for that reason — plated, with a ridge.
  const plate = blob(0.46, 0.34, 0.7, c.dark, { p: 3.4, pv: 2.2, outline: 0.026, seg: 14 });
  plate.position.set(0.3, 0.2, 0);
  plate.rotation.z = -0.28;
  body.add(plate);
  for (let i = 0; i < 3; i++) {
    const ridge = tube(
      [
        [0.42 - i * 0.14, 0.34 - i * 0.02, 0, 0.045],
        [0.36 - i * 0.14, 0.44 - i * 0.03, 0, 0.03],
        [0.28 - i * 0.14, 0.5 - i * 0.04, 0, 0.005],
      ],
      P.bone,
      { seg: 6, outline: 0.012 }
    );
    body.add(ridge);
  }

  const neck = new THREE.Group();
  neck.position.set(0.48, -0.06, 0);
  body.add(neck);
  n.neck = neck;

  // A broad, low head: heavy brow, blunt snout, horns sweeping forward.
  const head = barrel(
    [
      { x: -0.02, ry: 0.13, rz: 0.17, y: 0.02 },
      { x: 0.1, ry: 0.17, rz: 0.2, y: 0.03 },
      { x: 0.22, ry: 0.15, rz: 0.18, y: 0.0 },
      { x: 0.33, ry: 0.12, rz: 0.15, y: -0.04 },
      { x: 0.4, ry: 0.1, rz: 0.13, y: -0.05 },
    ],
    c.dark,
    { seg: 12, backX: -0.06, frontX: 0.43, outline: 0.026 }
  );
  neck.add(head);

  for (const side of [-1, 1]) {
    const horn = tube(
      [
        [0.18, 0.12, side * 0.15, 0.05],
        [0.3, 0.2, side * 0.22, 0.04],
        [0.44, 0.26, side * 0.22, 0.026],
        [0.56, 0.25, side * 0.17, 0.006],
      ],
      P.bone,
      { seg: 7, outline: 0.014 }
    );
    neck.add(horn);
    const tusk = tube(
      [
        [0.36, -0.1, side * 0.09, 0.024],
        [0.43, -0.06, side * 0.11, 0.016],
        [0.46, 0.0, side * 0.1, 0.003],
      ],
      P.bone,
      { seg: 5, outline: 0.008 }
    );
    neck.add(tusk);

    const eye = decal(0.08, 0.05, c.eye);
    eye.position.set(0.3, 0.06, side * 0.155);
    eye.rotation.set(0, Math.PI / 2 - side * 0.7, side * -0.25);
    neck.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  // Four thick legs, front pair and back pair, offset laterally in Z, on
  // split hooves of bone.
  let i = 0;
  for (const fx of [0.32, -0.32]) {
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(fx, -0.25, side * 0.22);
      body.add(hip);
      const upper = limb(0.2, 0.28, 0.2, c.dark, { taper: 0.66, bulge: 0.12, bulgeAt: 0.25 });
      hip.add(upper);
      const hoof = ringed(
        [
          { y: -0.12, rx: 0.1, rz: 0.09, p: 2.4 },
          { y: -0.06, rx: 0.085, rz: 0.08, p: 2.4 },
          { y: 0.0, rx: 0.07, rz: 0.066, p: 2.4 },
        ],
        P.bone,
        { seg: 10, outline: 0.014 }
      );
      hoof.position.set(0.02, -0.28, 0);
      hip.add(hoof);
      n['leg' + i] = hip;
      i++;
    }
  }

  const tail = new THREE.Group();
  tail.position.set(-0.5, 0.1, 0);
  body.add(tail);
  n.tail = tail;
  const tailSeg = tube(
    [
      [0.04, 0, 0, 0.04],
      [-0.1, -0.02, 0, 0.028],
      [-0.22, -0.08, 0, 0.016],
    ],
    c.dark,
    { seg: 6, outline: 0.012 }
  );
  tail.add(tailSeg);
  const tuft = blob(0.08, 0.1, 0.07, c.dark, { outline: 0.01 });
  tuft.position.set(-0.25, -0.1, 0);
  tail.add(tuft);

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Kawach — Naraka's armoured grunt
// ---------------------------------------------------------------------------

/**
 * Bulkier and lower than anything gate 1 or 2 built: a plated torso, a
 * shield bolted to the near arm, a wide low-slung stance. The silhouette has
 * to say "this does not flinch" before the hunter has swung at it once —
 * `Kawach.takeHit` in `game/enemies.js` is what makes that literally true for
 * most of the move list.
 */
export function buildKawach(skin = null) {
  const c = skin || { body: P.kawachPlate, dark: P.kawachPlateDark, eye: P.kawachEye };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.72;
  root.add(body);
  n.body = body;

  // The cuirass is the torso: squared like plate rather than rounded like
  // flesh, deep through the chest, with a keel down the front, a gorget at
  // the neck and a belt at the waist.
  const torso = trunk(0.5, 0.56, 0.5, c.body, { waist: 0.8, chest: 0.12, p: 3.4, neck: 0.5, outline: 0.03 });
  body.add(torso);
  const keel = block(0.04, 0.3, 0.06, c.dark, { round: 0.45, outline: 0.01 });
  onFront(torso, keel, 0.3, 0, -0.01);
  const gorget = ringed(
    [
      { y: 0.5, rx: 0.15, rz: 0.17, p: 3 },
      { y: 0.56, rx: 0.14, rz: 0.16, p: 3 },
      { y: 0.62, rx: 0.12, rz: 0.13, p: 3 },
    ],
    c.dark,
    { seg: 14, outline: 0.016 }
  );
  torso.add(gorget);
  const belt = ringed(
    [
      { y: 0.0, rx: 0.205, rz: 0.205, p: 3.2 },
      { y: 0.08, rx: 0.205, rz: 0.205, p: 3.2 },
    ],
    c.dark,
    { seg: 14, outline: 0.014 }
  );
  torso.add(belt);

  // Tassets: a skirt of plates over the hips, which also hides where the
  // thighs meet the body.
  const tassets = skirt(0.48, 0.5, 0.56, 0.58, 0.2, c.dark, { p: 3.2, folds: 6, fold: 0.045, outline: 0.022 });
  tassets.position.y = 0.04;
  body.add(tassets);

  const head = new THREE.Group();
  head.position.y = 0.62;
  torso.add(head);
  n.head = head;

  // The helm: a bucket with a flared rim, a flat face plate and a brow
  // ridge over a dark visor band the eyes burn through, crested on top.
  const helm = ringed(
    [
      { y: 0.0, rx: 0.12, rz: 0.12, p: 3.2 },
      { y: 0.035, rx: 0.158, rz: 0.152, p: 3.2 },
      { y: 0.1, rx: 0.15, rz: 0.146, p: 3.2 },
      { y: 0.17, rx: 0.152, rz: 0.148, p: 3.2 },
      { y: 0.215, rx: 0.162, rz: 0.156, x: 0.006, p: 3.2 },
      { y: 0.26, rx: 0.142, rz: 0.142, x: -0.006, p: 3 },
      { y: 0.3, rx: 0.1, rz: 0.104, x: -0.018, p: 2.6 },
      { y: 0.322, rx: 0.05, rz: 0.055, x: -0.024, p: 2.4 },
    ],
    c.body,
    { seg: 16, outline: 0.024, bottomY: 0.0, topY: 0.328 }
  );
  head.add(helm);
  const crest = ringed(
    [
      { y: 0.26, rx: 0.13, rz: 0.02, x: -0.02 },
      { y: 0.34, rx: 0.15, rz: 0.026, x: -0.03 },
      { y: 0.39, rx: 0.1, rz: 0.02, x: -0.05 },
    ],
    c.dark,
    { seg: 10, outline: 0.012 }
  );
  head.add(crest);
  const visor = decal(0.055, 0.25, 0x0b0910);
  onFront(helm, visor, 0.14, 0, 0.003);
  visor.rotation.z = Math.PI / 2;

  // Eyes, in the game's shared vocabulary: they flare when a commit is near.
  for (const side of [-1, 1]) {
    const eye = decal(0.07, 0.036, c.eye);
    onFront(helm, eye, 0.14, side * 0.064, 0.006);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.46, side * 0.28);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    // Pauldron: a wide shell sloping down off the shoulder, over a smaller
    // lame beneath it.
    const pauldron = blob(0.32, 0.17, 0.26, c.body, { p: 3.2, pv: 2.2, outline: 0.022 });
    pauldron.position.set(0, 0.04, side * 0.03);
    pauldron.rotation.x = side * 0.32;
    shoulder.add(pauldron);
    const lame = blob(0.26, 0.12, 0.2, c.dark, { p: 3, pv: 2.2, outline: 0.018 });
    lame.position.set(0, -0.05, side * 0.06);
    lame.rotation.x = side * 0.45;
    shoulder.add(lame);

    const upper = limb(0.15, 0.28, 0.15, c.dark, { taper: 0.9, bulge: 0.05 });
    upper.position.y = -0.05;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.15, 0.24, 0.15, c.body, { taper: 0.88, bulge: 0.08, bulgeAt: 0.45, p: 2.8 });
    elbow.add(fore);
    const fist = mitt(0.12, 0.11, 0.13, c.dark, { side });
    fist.position.y = -0.25;
    elbow.add(fist);
  }

  // The shield, bolted to the near arm: a tower of plate with a raised boss
  // that reads "this doesn't flinch head-on" before the bash ever telegraphs.
  const shield = block(0.06, 0.52, 0.36, c.body, { round: 0.3, p: 4.5, outline: 0.022 });
  shield.position.set(0.1, -0.05, 0);
  n.elbowL.add(shield);
  const shieldRim = block(0.05, 0.44, 0.28, c.dark, { round: 0.3, p: 4.5, outline: 0.0 });
  shieldRim.position.set(0.012, 0, 0);
  shield.add(shieldRim);
  const shieldBoss = blob(0.07, 0.13, 0.13, c.body, { outline: 0.012 });
  shieldBoss.position.set(0.045, 0.02, 0);
  shield.add(shieldBoss);

  // Legs — wide, low. Standing armour, not something built to chase.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.15);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.2, 0.28, 0.2, c.dark, { taper: 0.84, bulge: 0.06 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.28;
    hip.add(knee);
    n['knee' + key] = knee;

    const greave = limb(0.17, 0.26, 0.17, c.body, { taper: 0.92, bulge: 0.08, bulgeAt: 0.25, p: 2.8 });
    knee.add(greave);
    const cop = blob(0.12, 0.13, 0.15, c.body, { p: 2.6, outline: 0.014 });
    cop.position.set(0.07, 0.01, 0);
    knee.add(cop);

    const foot = boot(0.27, 0.1, 0.19, c.dark, { toe: 0.4 });
    foot.position.set(0.04, -0.26, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

/**
 * The shard that marks a claimable body.
 *
 * This is the entire tell for the extraction window: it shrinks as the window
 * closes, so the timer is read off the world instead of off a HUD element. The
 * game has now failed to teach a purely diegetic mechanic twice — the launcher
 * went undiscovered for two playtest rounds and the style meter for three — so
 * the shard is deliberately loud: a glowing core, a halo around it, and it sits
 * above the body rather than inside it where the corpse's own dark palette
 * would swallow it.
 */
// Built once and shared by every shard, like `boltGeo` in game/enemies.js.
//
// This is not only the usual "don't allocate per instance" hygiene. Three.js
// gives every geometry, material and Object3D a UUID from `Math.random()` —
// four draws each — and `tools/sim.js` verifies the game against a *seeded*
// `Math.random`. So anything the game allocates mid-run silently consumes the
// gameplay stream and re-rolls every enemy's jitter after it. Building a shard
// per corpse spent 32 draws at the instant of every raakchyas's death, which
// was enough to send eight fixed seeds down entirely different playthroughs. See
// the note in docs/DECISIONS.md.
const shardCoreGeo = new THREE.OctahedronGeometry(0.19, 0);
const shardHaloGeo = new THREE.OctahedronGeometry(0.36, 0);
const shardCoreMat = glowMaterial({ color: P.violet });
const shardHaloMat = new THREE.MeshBasicMaterial({
  color: P.violetGlow,
  transparent: true,
  opacity: 0.26,
  fog: false,
  depthWrite: false,
  toneMapped: false,
});

export function buildShard() {
  const root = new THREE.Group();
  const core = new THREE.Mesh(shardCoreGeo, shardCoreMat);
  const halo = new THREE.Mesh(shardHaloGeo, shardHaloMat);
  root.add(core);
  root.add(halo);
  root.userData.nodes = { core, halo };
  return root;
}

// ---------------------------------------------------------------------------
// Bhoot-Batti — the floating ranged enemy
// ---------------------------------------------------------------------------

export function buildBhootBatti(skin = null) {
  const c = skin || { core: P.bhootBattiCore, halo: P.cyanDeep, shard: P.raakchyasBody };
  const root = new THREE.Group();
  const n = {};

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), glowMaterial({ color: c.core }));
  root.add(core);
  n.core = core;

  const halo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, 1),
    new THREE.MeshBasicMaterial({
      color: c.halo,
      transparent: true,
      opacity: 0.3,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    })
  );
  root.add(halo);
  n.halo = halo;

  // The lamp's cage: two thin bands crossed around the flame, so it reads
  // as a ghost-lantern (a *batti*) rather than as a loose ball of light.
  for (const tilt of [0.5, -0.5]) {
    const band = new THREE.Mesh(tor(0.27, 0.014, 5, 18), mat(c.shard, { rim: 0.3 }));
    band.rotation.set(Math.PI / 2, 0, tilt);
    halo.add(band);
  }

  // Orbiting shards, animated as a group: long crystals rather than chips.
  const ring = new THREE.Group();
  root.add(ring);
  n.ring = ring;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const shard = ringed(
      [
        { y: -0.13, rx: 0.004, rz: 0.004, p: 2 },
        { y: -0.02, rx: 0.045, rz: 0.028, p: 2 },
        { y: 0.05, rx: 0.04, rz: 0.024, p: 2 },
        { y: 0.15, rx: 0.004, rz: 0.004, p: 2 },
      ],
      c.shard,
      { seg: 6, outline: 0.012, bottomY: -0.14, topY: 0.16 }
    );
    shard.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.12, Math.sin(a) * 0.42);
    shard.rotation.set(a, a * 1.7, a * 0.5);
    ring.add(shard);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Tantrik — Preta-lok's summoner (and, elevated, Atripta)
// ---------------------------------------------------------------------------

/**
 * A hunched, robed figure — no shield, no pauldrons, nothing built to trade
 * blows. `n.core`/`n.coreGlow` is a floating sigil rather than a chest plate:
 * the same "a flare announces the commit" vocabulary the bosses' cores and
 * Goru-Mukh's seal already teach, read off an object that sits between the
 * raised hands so a cast reads as a cast and not a swing.
 */
export function buildTantrik(skin = null) {
  const c = skin || { robe: P.tantrikRobe, dark: P.tantrikRobeDark, eye: P.tantrikEye, sigil: P.tantrikSigil };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.64;
  root.add(body);
  n.body = body;

  // A hunched, narrow-shouldered robe, stooped forward over the sigil.
  const robe = trunk(0.4, 0.6, 0.42, c.robe, { waist: 0.92, chest: 0.02, taper: 0.8, neck: 0.5, outline: 0.028 });
  robe.rotation.z = -0.12;
  body.add(robe);

  // The hem: a wide, pleated skirt rather than jointed legs — a Tantrik never
  // runs, it keeps a ring and casts from inside it.
  const hem = skirt(0.4, 0.42, 0.62, 0.62, 0.62, c.dark, { folds: 7, fold: 0.07, outline: 0.026 });
  hem.position.y = 0.04;
  robe.add(hem);
  const sash = ringed(
    [
      { y: 0.02, rx: 0.19, rz: 0.2 },
      { y: 0.09, rx: 0.188, rz: 0.198 },
    ],
    c.sigil,
    { seg: 14, outline: 0.012, opts: { rim: 0.3 } }
  );
  robe.add(sash);

  const head = new THREE.Group();
  head.position.y = 0.56;
  robe.add(head);
  n.head = head;

  // The hood: a deep cowl peaked at the back, its dark mouth hiding the face
  // so only the eyes are ever seen.
  const hood = ringed(
    [
      { y: -0.04, rx: 0.15, rz: 0.16, x: -0.01 },
      { y: 0.06, rx: 0.155, rz: 0.15, x: 0.0 },
      { y: 0.16, rx: 0.14, rz: 0.135, x: -0.005 },
      { y: 0.24, rx: 0.11, rz: 0.1, x: -0.03 },
      { y: 0.3, rx: 0.06, rz: 0.05, x: -0.07 },
      { y: 0.33, rx: 0.02, rz: 0.018, x: -0.11 },
    ],
    c.dark,
    { seg: 14, outline: 0.022, bottomY: -0.05, topY: 0.34 }
  );
  head.add(hood);
  const shadow = decal(0.2, 0.2, 0x07050c);
  onFront(hood, shadow, 0.1, 0, 0.004);

  for (const side of [-1, 1]) {
    const eye = decal(0.05, 0.034, c.eye);
    onFront(hood, eye, 0.12, side * 0.05, 0.009);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  const sigil = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), glowMaterial({ color: c.sigil }));
  sigil.position.set(0.34, 0.32, 0);
  robe.add(sigil);
  n.core = sigil;

  const sigilGlow = decal(0.5, 0.5, c.sigil, { opacity: 0.32 });
  sigilGlow.position.set(0.345, 0.32, 0);
  sigilGlow.rotation.y = Math.PI / 2;
  robe.add(sigilGlow);
  n.coreGlow = sigilGlow;

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.5, side * 0.2);
    robe.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(0.12, 0.28, 0.12, c.dark, { taper: 0.9, bulge: 0 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    // A sleeve that flares to the wrist, and a thin grey hand out of it.
    const sleeve = skirt(0.1, 0.1, 0.17, 0.17, 0.24, c.robe, { outline: 0.016, seg: 10 });
    elbow.add(sleeve);
    const hand = mitt(0.07, 0.09, 0.07, P.bone, { side, fist: false, outline: 0.01 });
    hand.position.y = -0.24;
    elbow.add(hand);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Shakuni — gate 1's Warden (Sabha Parva)
//
// Rebuilt 2026-08-22 against the reference art in `assets/Shakuni/`. The rig
// this replaces was a correct reading of the roster handoff and a poor
// character: a beige box torso, a box hem, a box skull and a box beard, at a
// value so close to the hall's own bronze that the Warden of gate 1 read as
// furniture. Every prior decision it recorded is deliberately overridden here
// (see `docs/DECISIONS.md` § "Shakuni is rebuilt as a courtier"):
//
// - **"Slight through proportion, not stature"** → he now stands a head over
//   the hunter. Slight is carried by the *taper* — a narrow torso and thin
//   limbs under a wide robe — which says "old man in heavy court dress"
//   without saying "small".
// - **"Plain, dark eyes — deliberately not a glowing tell"** → he has an
//   ember-lit gaze in phase 1 and a crimson one in phase 2. The reasoning
//   behind the old call still stands and is honoured a different way: the eye
//   never brightens *per attack*, so it is characterisation, not a telegraph.
//   What tells you an attack is coming is still the die and the ground.
// - **"The held die is flavour, not the telegraph"** → unchanged and load
//   bearing. He now carries three dice and a staff-mounted fourth, and not one
//   of them marks a world point: a prop under a yaw-tilted root drifts off the
//   spot it is meant to mark as the offset grows. The die that matters is
//   thrown into the world by `vfx.dieToss` and the zone is drawn by
//   `vfx.dangerZone`, both in world space.
// ---------------------------------------------------------------------------

/**
 * The wrapper scale. A scale here rather than on `root`, because `Enemy
 * .finishSetup`/`_spawnAnim` drive `root.scale` for the rise-from-shadow
 * entrance (0.01 → 1) and would overwrite anything set on it.
 *
 * 1.42 puts the crown about 2.1 world units up, against the hunter's ~1.7 and
 * against his own collision box, which is 2.3 tall (`hh 1.15`). The first pass
 * used 1.25 and stood a rig noticeably *shorter* than the box it occupied —
 * which, combined with a skirt as wide as the box, is what made him read as a
 * bell rather than as the column the reference art draws. Height was the
 * cheaper half of that fix; see the skirt profile for the other half.
 */
const SHAKUNI_SCALE = 1.42;

/**
 * Which way a face of `buildDie` points, and what it is worth.
 *
 * Opposite faces sum to seven, as on a real die — 1/6 on ±Y, 2/5 on ±X, 3/4 on
 * ±Z. That is not pedantry: it is what makes `DIE_FACE_UP` below a rotation
 * rather than a lookup into six different models, and a die that reads wrong
 * to anyone who has held one is a die nobody trusts to be telling the truth.
 */
const DIE_FACES = [
  { value: 1, rot: [-Math.PI / 2, 0, 0] }, // +Y
  { value: 6, rot: [Math.PI / 2, 0, 0] }, // -Y
  { value: 2, rot: [0, Math.PI / 2, 0] }, // +X
  { value: 5, rot: [0, -Math.PI / 2, 0] }, // -X
  { value: 3, rot: [0, 0, 0] }, // +Z
  { value: 4, rot: [0, Math.PI, 0] }, // -Z
];

/**
 * Pip layout per face value, in units of the face's own pip pitch. A plane's
 * local axes after the face rotation above are (u, v) = (x, y).
 */
const PIP_LAYOUT = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
  5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]],
  6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]],
};

/**
 * The Euler that brings face `n` to point up (+Y). Derived from `DIE_FACES`
 * rather than written out, so the two cannot drift apart.
 */
export const DIE_FACE_UP = (() => {
  const up = {};
  // Inverse of each face's own orientation, composed so that face's normal
  // lands on +Y. Worked per face because there are six and they are trivial.
  up[1] = [0, 0, 0];
  up[6] = [Math.PI, 0, 0];
  up[2] = [0, 0, Math.PI / 2];
  up[5] = [0, 0, -Math.PI / 2];
  up[3] = [-Math.PI / 2, 0, 0];
  up[4] = [Math.PI / 2, 0, 0];
  return up;
})();

const pipGeoCache = new Map();
function pipGeo(r) {
  const key = r.toFixed(4);
  let g = pipGeoCache.get(key);
  if (!g) {
    g = new THREE.CircleGeometry(r, 8);
    pipGeoCache.set(key, g);
  }
  return g;
}

const basicCache = new Map();
/** Shared unlit material for pips and glows. Cached like `mat()`, same reason. */
function unlit(color) {
  let m = basicCache.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, fog: false, toneMapped: false });
    basicCache.set(color, m);
  }
  return m;
}

/**
 * Shakuni's die, at any size — the signature the redesign is built around.
 *
 * Near-black bone with a **gold inverted-hull outline** rather than the game's
 * usual ink one, which is the single cheapest thing that makes it read as his
 * rather than as a crate: the reference art draws every die as a dark square
 * with a gold stroke, and `outlineFor` takes a colour.
 *
 * `pips`:
 * - `'full'` — all twenty-one, laid out per `PIP_LAYOUT`, so any face can be
 *   turned up and *read*. This is what the thrown die needs and it is the
 *   whole reason the face is a rotation instead of a texture: a rolled face is
 *   a readability cue, and readability cues may not live in a file.
 * - `'signature'` — one loaded pip on the two faces the camera can see at the
 *   sizes he wears them. Twenty-one pips on a die 8cm across is eighty-odd
 *   draw calls to render something nobody can resolve.
 *
 * The centre pip is `shakuniEmber`, not gold: on a real die the 1, 3 and 5 all
 * carry a centre pip, and his is lit on every one of them. That is the loading,
 * visible on the object, before he throws it.
 */
export function buildDie(size, { pips = 'full', body = P.shakuniDie } = {}) {
  const g = new THREE.Group();
  const half = size / 2;

  const geo = box(size, size, size);
  // A quarter of the usual rim. At the default 0.55 the cool sky rim washed the
  // whole up-face of a landed die pale blue — on a near-black object with a
  // large flat top facing the sky that term is most of the shading, and it made
  // three dice on the floor read as three ice cubes.
  const m = new THREE.Mesh(geo, mat(body, { steps: 3, rim: 0.14 }));
  m.castShadow = true;
  g.add(m);
  g.add(outlineFor(geo, size * 0.055, P.shakuniGold));
  g.userData.mesh = m;

  const pipR = size * 0.085;
  const pitch = size * 0.26;
  const lift = half + size * 0.012; // clear of the surface: see `decal`'s note
  const gold = [];
  const ember = [];

  for (const face of DIE_FACES) {
    const layout = PIP_LAYOUT[face.value];
    const holder = new THREE.Group();
    holder.rotation.set(face.rot[0], face.rot[1], face.rot[2]);
    holder.position.set(0, 0, 0);
    g.add(holder);

    for (const [u, v] of layout) {
      const centre = u === 0 && v === 0;
      if (pips === 'signature' && !(centre && (face.value === 1 || face.value === 6))) continue;
      // The 6 has no centre pip, so `signature` puts its loaded mark where the
      // 1's is on the opposite face — the two faces a tumbling die shows most.
      const isEmber = centre || (pips === 'signature' && face.value === 6);
      const dot = new THREE.Mesh(pipGeo(centre ? pipR * 1.35 : pipR), unlit(isEmber ? P.shakuniEmber : P.shakuniGold));
      dot.position.set(u * pitch, v * pitch, lift);
      holder.add(dot);
      (isEmber ? ember : gold).push(dot);
    }

    if (pips === 'signature' && face.value === 6) {
      const dot = new THREE.Mesh(pipGeo(pipR * 1.35), unlit(P.shakuniEmber));
      dot.position.set(0, 0, lift);
      holder.add(dot);
      ember.push(dot);
    }
  }

  g.userData.nodes = { body: m, gold, ember };
  return g;
}

/**
 * An aged, aristocratic Gandharan courtier — intelligent and composed, never
 * powerful. Read the reference in `assets/Shakuni/` alongside this.
 *
 * The silhouette is the brief and it is built in this order: a wide layered
 * skirt that never moves, a narrow stooped torso, a tall crowned head, a long
 * silver beard cutting down the chest, a staff standing a head above the crown,
 * and three dice orbiting at chest height. Every one of those is a shape a box
 * could not make, which is why this rig is the first in the game to use
 * `lathe`, `cyl`, `sph`, `tor`, `cone` and `octa` instead of `part` alone.
 *
 * Built facing +X with Z as the lateral axis, like everything else here.
 */
export function buildShakuni() {
  const root = new THREE.Group();
  const n = {};
  /** Meshes phase 2 recolours. Collected as they are built, per Kumbhakarna. */
  /** Gold and bronze trim. Untouched by the phase change — the court's own
   *  metal does not care what he becomes, and holding it steady is what keeps
   *  phase 2 a change of *temperature* rather than a change of character. */
  n.goldMeshes = [];
  /** Wine cloth: the sash, the crown band, the tail. These go up. */
  n.wineMeshes = [];
  /** Everything lit: eyes, crest, pendant, every loaded pip. */
  n.emberMeshes = [];
  n.dice = [];

  const rig = new THREE.Group();
  rig.scale.setScalar(SHAKUNI_SCALE);
  root.add(rig);
  n.rig = rig;

  // -- the robe, floor up ----------------------------------------------------
  //
  // A surface of revolution, not a hem box. Court dress is *layers*, and a
  // layer reads as a step in the silhouette: the profile steps inward twice on
  // the way up, so the outline has three hems in it rather than one
  // skirt-shaped block. It is also the reason he has no legs — he paces a
  // ring, he never runs, and cloth to the floor is what an old courtier wears.
  //
  // **A column, not a bell**, and this is the second pass. The first flared
  // from the waist and put its widest point at 0.35 — as wide as the collision
  // box, on a rig shorter than that box — so his aspect ratio came out near
  // 2.1:1 against roughly 3:1 in the reference art. Read side by side he was
  // squat, which is the one word the brief could least afford to lose.
  //
  // The fix is in the *shape* of the profile as much as in its numbers: the
  // coat now hangs nearly straight from the waist to below the knee and opens
  // only in the last fifth of its height, which is how the reference draws it
  // and is what makes the flare read as a hem rather than as a skirt.
  const robeSkirt = ringed(
    [
      { y: 0.01, rx: 0.268, rz: 0.268, wave: 0.035, waves: 9 },
      { y: 0.042, rx: 0.268, rz: 0.268, wave: 0.035, waves: 9 },
      { y: 0.058, rx: 0.232, rz: 0.232, wave: 0.02, waves: 9 }, // the hem, and the only real flare on him
      { y: 0.17, rx: 0.214, rz: 0.214, wave: 0.012, waves: 9 },
      { y: 0.186, rx: 0.196, rz: 0.196 }, // second layer's hem
      { y: 0.47, rx: 0.192, rz: 0.192 },
      { y: 0.492, rx: 0.172, rz: 0.172 }, // third layer's hem
      { y: 0.7, rx: 0.166, rz: 0.166 },
      { y: 0.86, rx: 0.152, rz: 0.152 },
    ],
    P.shakuniRobe,
    { seg: 20, bottomY: 0.0, topY: 0.87, outline: 0.026, opts: { map: 'shakuni.robe', steps: 3 } }
  );
  rig.add(robeSkirt);
  n.skirt = robeSkirt;

  // The gold hem running round the floor edge — the reference draws it as the
  // robe's brightest element, and at combat distance it is what separates the
  // silhouette from the floor it stands on.
  const hemRing = shaped(tor(0.250, 0.020, 5, 18), P.shakuniGoldDim, { outline: 0.012 });
  hemRing.rotation.x = Math.PI / 2;
  hemRing.position.y = 0.048;
  rig.add(hemRing);
  n.goldMeshes.push(hemRing.userData.mesh);

  const body = new THREE.Group();
  body.position.y = 0.82;
  rig.add(body);
  n.body = body;

  // The permanent stoop, on its own wrapper. `_animate` lerps `n.robe`'s own
  // rotation back to zero whenever he is merely idle, so a stoop set there
  // would straighten out within a few frames of play — an old man's posture
  // does not reset between casts the way a fighting stance does.
  const stoop = new THREE.Group();
  stoop.rotation.z = -0.10;
  body.add(stoop);

  // -- torso -----------------------------------------------------------------
  //
  // Tapered and narrow: 0.135 at the shoulder against the skirt's 0.35 at the
  // floor. That ratio is the whole "slender aristocrat" read, and it is a
  // proportion a stack of boxes states far less clearly than a cone frustum.
  const robe = trunk(0.27, 0.5, 0.29, P.shakuniRobe, {
    waist: 1.04,
    chest: 0.06,
    taper: 0.88,
    neck: 0.44,
    outline: 0.024,
    opts: { map: 'shakuni.robe', steps: 3 },
  });
  stoop.add(robe);
  n.robe = robe;

  // The asymmetric wine sash, over the right shoulder and down to the left
  // hip. Two panels, front and back, so it reads from either facing — he turns
  // by yawing 180°, and a one-sided sash would vanish half the time.
  // The asymmetric wine sash, over the right shoulder and down to the left
  // hip, and round the back again — one band wrapping the body, so it reads
  // from either facing (he turns by yawing 180°).
  const sashPts = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    // A tilted ellipse round the torso: high at the right shoulder (+Z, a=π/2),
    // low at the left hip (-Z, a=3π/2).
    const y = 0.28 + 0.2 * Math.sin(a);
    const r = 0.125 + 0.03 * (1 - Math.sin(a)) * 0.5;
    sashPts.push([Math.cos(a) * (r + 0.02), y, Math.sin(a) * (r + 0.03), 0.028]);
  }
  const sash = tube(sashPts, P.shakuniWine, { seg: 6, squash: 2.2, outline: 0.012 });
  stoop.add(sash);
  n.wineMeshes.push(sash.userData.mesh);

  // A gold cord where the sash crosses the waist.
  const cord = shaped(tor(0.150, 0.016, 5, 16), P.shakuniGold, { outline: 0.011 });
  cord.rotation.x = Math.PI / 2;
  cord.position.y = 0.08;
  robe.add(cord);
  n.goldMeshes.push(cord.userData.mesh);

  // -- jewellery -------------------------------------------------------------
  //
  // Two collars at different radii, which is how court jewellery actually
  // hangs and what stops it reading as one thick necklace, plus a pendant gem.
  for (const [r, y, tube, col] of [
    [0.108, 0.455, 0.015, P.shakuniGold],
    [0.132, 0.410, 0.012, P.shakuniBronze],
  ]) {
    const collar = shaped(tor(r, tube, 5, 16), col, { outline: 0.010 });
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y;
    robe.add(collar);
    n.goldMeshes.push(collar.userData.mesh);
  }

  const pendant = shaped(octa(0.045), P.shakuniWine, { outline: 0.012 });
  pendant.position.set(0.118, 0.375, 0);
  robe.add(pendant);
  n.pendant = pendant;
  n.emberMeshes.push(pendant.userData.mesh);

  // -- head ------------------------------------------------------------------
  const head = new THREE.Group();
  head.position.y = 0.56;
  robe.add(head);
  n.head = head;

  // A neck, thin and visibly holding a heavy head up. Two boxes of skull would
  // have hidden this joint; a narrow cylinder makes it a feature.
  const neck = limb(0.11, 0.12, 0.11, P.shakuniSkin, { taper: 1.15, bulge: 0, outline: 0.01 });
  neck.position.y = 0.04;
  head.add(neck);

  // The skull, long and narrow — sunken, not round. At 0.155 wide the head
  // was as wide as the shoulders and read as a mask on a stick; the taper is
  // where "aged" lives on a face this size.
  const face = skull(0.25, 0.32, 0.23, P.shakuniSkin, { jaw: 0.6, outline: 0.018 });
  face.position.y = -0.02;
  head.add(face);
  n.skull = face;

  // A heavy brow, the one hard edge on the face. Everything else about him is
  // soft and curved; this is what stops "elderly" reading as "kindly".
  const brow = ringed(
    [
      { y: -0.016, rx: 0.02, rz: 0.1, p: 3 },
      { y: 0.0, rx: 0.03, rz: 0.105, p: 3 },
      { y: 0.016, rx: 0.018, rz: 0.098, p: 3 },
    ],
    P.shakuniSkin,
    { seg: 10, outline: 0.01 }
  );
  brow.position.set(0.1, 0.185, 0);
  brow.rotation.z = 0.16;
  head.add(brow);

  const nose = tube(
    [
      [0.1, 0.17, 0, 0.02],
      [0.13, 0.13, 0, 0.022],
      [0.14, 0.105, 0, 0.012],
    ],
    P.shakuniSkin,
    { seg: 6, outline: 0.008 }
  );
  head.add(nose);

  // The eyes. Sunk *under* the brow rather than sitting on the face, which is
  // what makes them read as watching rather than staring. Ember in phase 1,
  // crimson in phase 2 — never brighter for an attack: see this section's
  // header for why that distinction is the whole justification for lighting
  // them at all.
  for (const side of [-1, 1]) {
    const eye = decal(0.030, 0.020, P.shakuniEmber);
    eye.position.set(0.128, 0.158, side * 0.048);
    eye.rotation.y = Math.PI / 2;
    head.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
    n.emberMeshes.push(eye);
  }

  // -- beard -----------------------------------------------------------------
  //
  // Forked and long, in near-white silver. This is the rig's single strongest
  // silhouette element and its brightest value: against a charcoal robe it is
  // the shape that says "old courtier" from across the hall, which is exactly
  // the job the old rig gave to a 0.14-unit box and did not get done.
  // Hung *forward* of the chest, not against it. At x 0.085 the lower half of
  // every strand was inside the torso cylinder — a real intersection, invisible
  // in a wireframe and obvious the moment it was photographed, and the reason
  // the beard looked like it stopped at the collar when it reaches the waist.
  // Hung from the jaw line (head-local y ≈ 0), not from the cheek. Started at
  // 0.05 it covered the nose and the eyes — the face was gone behind its own
  // beard, which is a different failure from the one before it and just as
  // visible in a photograph.
  const beardGroup = new THREE.Group();
  beardGroup.position.set(0.13, -0.02, 0);
  beardGroup.rotation.z = 0.20; // and it sweeps further out as it falls
  head.add(beardGroup);
  n.beard = beardGroup;

  for (const [len, r, z, x] of [
    [0.56, 0.055, 0, 0.024],
    [0.44, 0.038, 0.052, 0.002],
    [0.44, 0.038, -0.052, 0.002],
  ]) {
    const strand = tube(
      [
        [x, 0.03, z, r * 0.9],
        [x + 0.01, -len * 0.3, z * 1.1, r],
        [x - 0.005, -len * 0.62, z * 1.25, r * 0.62],
        [x + 0.012, -len, z * 1.35, r * 0.08],
      ],
      P.shakuniBeard,
      { seg: 7, outline: 0.012 }
    );
    beardGroup.add(strand);
  }

  // The moustache, joining the beard to the nose so the face is one mass.
  for (const side of [-1, 1]) {
    const tache = tube(
      [
        [0.13, 0.085, side * 0.005, 0.016],
        [0.13, 0.07, side * 0.045, 0.018],
        [0.11, 0.035, side * 0.07, 0.008],
      ],
      P.shakuniBeard,
      { seg: 6, outline: 0.008 }
    );
    head.add(tache);
  }

  // -- headwear --------------------------------------------------------------
  //
  // Gandharan: a wound band with a domed crown rising out of it and a crest
  // gem at the front. Deliberately *not* a wizard's point, a demon's horns or
  // a monk's shaven head — the three silhouettes the brief rules out — and
  // deliberately not the flat gold wrap the old rig wore, which read as a
  // headband on a box.
  const band = shaped(tor(0.163, 0.038, 6, 18), P.shakuniWineDark, { outline: 0.014 });
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.235;
  head.add(band);
  n.wineMeshes.push(band.userData.mesh);

  const bandTrim = shaped(tor(0.168, 0.012, 5, 18), P.shakuniGold, { outline: 0.008 });
  bandTrim.rotation.x = Math.PI / 2;
  bandTrim.position.y = 0.262;
  head.add(bandTrim);
  n.goldMeshes.push(bandTrim.userData.mesh);

  const crown = blob(0.284, 0.26, 0.272, P.shakuniRobeDark, { outline: 0.016, seg: 14 });
  crown.position.y = 0.3;
  head.add(crown);

  const crownTrim = shaped(tor(0.10, 0.014, 5, 16), P.shakuniGold, { outline: 0.008 });
  crownTrim.rotation.x = Math.PI / 2;
  crownTrim.position.y = 0.355;
  head.add(crownTrim);
  n.goldMeshes.push(crownTrim.userData.mesh);

  // The crest gem — the crown's one lit element, and the piece that ties the
  // headwear to the dice. Ember in phase 1, blaze in phase 2, like the eyes.
  const crest = shaped(octa(0.055), P.shakuniWine, { outline: 0.012 });
  crest.position.set(0.115, 0.32, 0);
  crest.rotation.z = 0.3;
  head.add(crest);
  n.crest = crest;
  n.emberMeshes.push(crest.userData.mesh);

  // A short cloth tail off the back of the band, so the head has weight from
  // behind as well as in front.
  const tail = ringed(
    [
      { y: -0.24, rx: 0.02, rz: 0.06, x: -0.02, p: 2.6 },
      { y: -0.2, rx: 0.03, rz: 0.08, x: -0.012, p: 2.6 },
      { y: -0.06, rx: 0.036, rz: 0.075, p: 2.6 },
      { y: 0.0, rx: 0.04, rz: 0.07, p: 2.6 },
    ],
    P.shakuniWineDark,
    { seg: 10, outline: 0.014, topY: 0.03 }
  );
  tail.position.set(-0.14, 0.24, 0);
  tail.rotation.z = -0.25;
  head.add(tail);
  n.wineMeshes.push(tail.userData.mesh);

  // -- arms ------------------------------------------------------------------
  //
  // Thin, and thin on purpose: the taper from a 0.055 upper arm to a 0.045
  // hand is what an old man's forearm does, and it is the read the wide sleeve
  // of the robe sets up. Cylinders rather than boxes here because the arms are
  // the part of him that moves most and a box limb rotating in a cel outline
  // shears visibly at the joint.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.452, side * 0.126);
    robe.add(shoulder);
    n['shoulder' + key] = shoulder;

    // A sleeve cap, wider than the arm inside it — court dress again.
    const cap = blob(0.15, 0.12, 0.15, P.shakuniRobeDark, { outline: 0.013 });
    shoulder.add(cap);

    const upper = limb(0.11, 0.235, 0.11, P.shakuniRobeDark, { taper: 0.84, bulge: 0.03, outline: 0.012 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.235;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    // Sleeved, not bare. A skin-toned forearm on a charcoal robe read as a
    // naked arm at combat distance — the one place the reference art's own
    // layering had been dropped, and the only pale mass on the body competing
    // with the beard, which is the read the whole silhouette is built on.
    const fore = skirt(0.09, 0.09, 0.13, 0.13, 0.19, P.shakuniRobeDark, { outline: 0.011, seg: 10 });
    elbow.add(fore);

    // A bangle at the wrist. Small, but it is the detail that makes a bare
    // forearm read as ornamented rather than undressed.
    const bangle = shaped(tor(0.045, 0.011, 5, 12), P.shakuniGold, { outline: 0.007 });
    bangle.rotation.x = Math.PI / 2;
    bangle.position.y = -0.185;
    elbow.add(bangle);
    n.goldMeshes.push(bangle.userData.mesh);

    const hand = mitt(0.08, 0.09, 0.075, P.shakuniSkin, { side, outline: 0.01 });
    hand.position.y = -0.195;
    elbow.add(hand);
    n['hand' + key] = hand;
  }

  // -- the ceremonial staff --------------------------------------------------
  //
  // In the left hand, and genuinely parented to it: the hand is the node the
  // animator drives, so the staff swings with the arm rather than floating
  // beside it. Built to stand well past the crown, because its whole job in
  // the silhouette is to give him a vertical he does not otherwise have — a
  // stooped man in a wide robe is all horizontal without it.
  // Leaned **back**, over the shoulder, and this is the third position tried.
  // The hand hangs at the body's own x while the face and beard sit forward of
  // it, so a shaft standing straight up out of the grip crosses the head from
  // the camera's three-quarter angle, and leaning it forward crosses the whole
  // body. Back is the only direction that clears both — and it is how a staff
  // is actually carried at rest, so the pose reads as a man holding something
  // rather than as a man being held up by it.
  const staff = new THREE.Group();
  // Pushed further out laterally than the first pass, because the torso got
  // narrower with the column: at z -0.06 the shaft crossed the robe's own front
  // instead of standing beside it.
  staff.position.set(-0.02, -0.02, -0.115);
  staff.rotation.z = 0.26;
  n.handL.add(staff);
  n.staff = staff;

  const shaft = shaped(cyl(0.023, 0.028, 1.62, 7), P.shakuniBronze, { outline: 0.011 });
  shaft.position.y = 0.42;
  staff.add(shaft);

  for (const y of [-0.24, 0.36, 0.86]) {
    const collar = shaped(tor(0.034, 0.013, 5, 12), P.shakuniGold, { outline: 0.008 });
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y;
    staff.add(collar);
    n.goldMeshes.push(collar.userData.mesh);
  }

  // The finial: an open crown loop with a die suspended inside it, straight
  // off `ceremonial_staff.svg`. A torus lies in the XY plane by default, which
  // is exactly the plane a side-on camera reads a loop in.
  const loop = shaped(tor(0.125, 0.024, 6, 20), P.shakuniGold, { outline: 0.012 });
  loop.position.y = 1.16;
  staff.add(loop);
  n.goldMeshes.push(loop.userData.mesh);

  const finialDie = buildDie(0.115, { pips: 'signature' });
  finialDie.position.y = 1.16;
  staff.add(finialDie);
  n.staffDie = finialDie;
  n.dice.push(finialDie);
  n.emberMeshes.push(...finialDie.userData.nodes.ember);

  // -- the three dice --------------------------------------------------------
  //
  // The signature, and the reason the fight reads as gambling before he has
  // thrown anything. They orbit at chest height in the rig's own XY plane,
  // which is the plane the camera sees as a circle; `_animate` turns the
  // group and tumbles each die inside it.
  //
  // Decorative, and it matters that they are: the die that can hurt you is
  // always one thrown into the world by `vfx.dieToss`, never one of these.
  const orbit = new THREE.Group();
  orbit.position.set(0.05, 1.22, 0);
  rig.add(orbit);
  n.orbit = orbit;

  for (let i = 0; i < 3; i++) {
    const holder = new THREE.Group();
    const a = (i / 3) * Math.PI * 2;
    // Close enough to read as *his*. At 0.44 they sat far enough off the body
    // to look like three unrelated objects that happened to be nearby.
    holder.position.set(Math.cos(a) * 0.40, Math.sin(a) * 0.40, 0);
    orbit.add(holder);

    const die = buildDie(0.12, { pips: 'signature' });
    holder.add(die);
    n.dice.push(die);
    n.emberMeshes.push(...die.userData.nodes.ember);
  }
  n.orbitHolders = orbit.children;

  root.userData.nodes = n;
  return root;
}


// ---------------------------------------------------------------------------
// Bakasura — gate 2's Warden
// ---------------------------------------------------------------------------

/**
 * A glutton-demon: heavy-bellied and wide before it is tall, per the
 * handoff's "a proportion claim, not just a size one" — `hw`/`hh` sit far
 * closer to parity than any other rig in the game. Built bottom-up like
 * `buildKawach`, with `body` standing in for Kawach's own torso group: legs
 * hang off it directly, and the belly/chest/head stack rises from the same
 * origin rather than from a separate hips group, since there is no waist to
 * separate them at.
 */
export function buildBakasura(skin = null) {
  const c = skin || {
    body: P.bakasuraSkin,
    dark: P.bakasuraSkinDark,
    bruise: P.bakasuraBruise,
    hand: P.bakasuraHand,
    hair: P.bakasuraHair,
  };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 1.0;
  root.add(body);
  n.body = body;

  // The belly: wide and deep before it is tall, sagging low and forward
  // ahead of a narrower chest — the one proportion this rig exists to get
  // right, and a proportion a box could only ever state as "large".
  const belly = ringed(
    [
      { y: 0.0, rx: 0.36, rz: 0.36, x: 0.04 },
      { y: 0.1, rx: 0.5, rz: 0.44, x: 0.1 },
      { y: 0.26, rx: 0.56, rz: 0.47, x: 0.12 },
      { y: 0.42, rx: 0.52, rz: 0.45, x: 0.08 },
      { y: 0.56, rx: 0.42, rz: 0.4, x: 0.03 },
      { y: 0.66, rx: 0.3, rz: 0.33, x: 0.0 },
    ],
    c.body,
    { seg: 18, bottomY: -0.06, topY: 0.7, outline: 0.036 }
  );
  body.add(belly);
  n.belly = belly;

  // Bruise-purple worked into the sag itself, a decal rather than new
  // geometry so it rides the belly's own squash-stretch for free.
  const sag = decal(0.46, 0.26, c.bruise, { opacity: 0.55 });
  onFront(belly, sag, 0.16, 0, 0.006);
  const navel = decal(0.05, 0.07, c.dark);
  onFront(belly, navel, 0.3, 0, 0.004);

  const chest = trunk(0.62, 0.52, 0.8, c.body, { waist: 0.78, chest: 0.06, neck: 0.5, outline: 0.034 });
  chest.position.y = 0.58;
  belly.add(chest);
  n.chest = chest;

  const head = new THREE.Group();
  head.position.y = 0.52;
  chest.add(head);
  n.head = head;

  // A squat head over a jaw wider than the skull: the predatory glutton's.
  const face = skull(0.42, 0.42, 0.42, c.body, { jaw: 1.02, snout: 0.06, outline: 0.03 });
  head.add(face);
  nose(face, 0.23, 0.08, c.body, { jut: 0.04, r: 0.038, outline: 0.01 });

  // Heavy jowls hanging past the jaw — the "predatory glutton" face read.
  for (const side of [-1, 1]) {
    const jowl = blob(0.18, 0.2, 0.16, c.body, { outline: 0.02 });
    jowl.position.set(0.1, 0.07, side * 0.17);
    face.add(jowl);
  }

  // The fanged grin: a dark slot and a row of pale points along it.
  const mouth = decal(0.26, 0.07, P.outline);
  onFront(face, mouth, 0.07, 0, 0.004);
  for (let i = -2; i <= 2; i++) {
    const z = i * 0.048;
    const fx = frontOf(face.userData.mesh.geometry, 0.095, z).x;
    const fang = tube(
      [
        [fx - 0.005, 0.1, z, 0.016],
        [fx + 0.004, 0.07, z, 0.012],
        [fx + 0.006, 0.04, z, 0.002],
      ],
      P.bone,
      { seg: 5, outline: 0.006 }
    );
    face.add(fang);
  }

  // Plain, dark eyes — like Shakuni, the menace never reads off the face;
  // it reads off the hands.
  for (const side of [-1, 1]) {
    const eye = decal(0.06, 0.035, P.outline);
    onFront(face, eye, 0.24, side * 0.085, 0.004);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
    const brow = decal(0.08, 0.02, c.dark);
    onFront(face, brow, 0.28, side * 0.09, 0.004);
    brow.rotation.z = side * -0.35;
  }

  // Long, loose hair spilling from under the helm, down the back.
  const hair = ringed(
    [
      { y: -0.26, rx: 0.1, rz: 0.2, x: -0.14 },
      { y: -0.1, rx: 0.15, rz: 0.23, x: -0.12 },
      { y: 0.06, rx: 0.17, rz: 0.24, x: -0.1 },
      { y: 0.14, rx: 0.15, rz: 0.22, x: -0.08 },
    ],
    c.hair,
    { seg: 12, bottomY: -0.32, topY: 0.18, outline: 0.022 }
  );
  hair.position.y = 0.3;
  face.add(hair);
  for (const side of [-1, 1]) {
    const lock = tube(
      [
        [-0.04, 0.32, side * 0.2, 0.05],
        [-0.02, 0.14, side * 0.24, 0.045],
        [-0.04, -0.04, side * 0.23, 0.03],
        [-0.02, -0.14, side * 0.21, 0.006],
      ],
      c.hair,
      { seg: 7, outline: 0.014 }
    );
    face.add(lock);
  }

  // The horned skull-crest helm — a static silhouette read, not a
  // telegraph: it sits still through every state the animator drives.
  const helm = ringed(
    [
      { y: 0.0, rx: 0.19, rz: 0.2 },
      { y: 0.05, rx: 0.2, rz: 0.21 },
      { y: 0.12, rx: 0.18, rz: 0.19, x: -0.01 },
      { y: 0.18, rx: 0.12, rz: 0.13, x: -0.02 },
    ],
    c.dark,
    { seg: 14, bottomY: 0.0, topY: 0.21, outline: 0.024 }
  );
  helm.position.y = 0.3;
  face.add(helm);
  for (const side of [-1, 1]) {
    const horn = tube(
      [
        [0.0, 0.08, side * 0.15, 0.055],
        [-0.02, 0.2, side * 0.24, 0.045],
        [-0.08, 0.34, side * 0.27, 0.03],
        [-0.18, 0.42, side * 0.24, 0.006],
      ],
      P.bone,
      { seg: 7, outline: 0.014 }
    );
    helm.add(horn);
  }
  // The crest's skull: a small bone face riding the brow of the helm.
  const crestSkull = blob(0.09, 0.1, 0.11, P.bone, { outline: 0.012 });
  crestSkull.position.set(0.17, 0.08, 0);
  helm.add(crestSkull);
  for (const side of [-1, 1]) {
    const socket = decal(0.03, 0.025, P.outline);
    socket.position.set(0.218, 0.09, side * 0.025);
    socket.rotation.y = Math.PI / 2;
    helm.add(socket);
  }

  // The vertebra-bead necklace, skull pendant at the sternum.
  const necklace = new THREE.Group();
  necklace.position.set(0.3, 0.42, 0);
  chest.add(necklace);
  for (let i = -3; i <= 3; i++) {
    const bead = blob(0.055, 0.05, 0.055, P.bone, { outline: 0.008 });
    bead.position.set(Math.cos(i * 0.25) * 0.02 - Math.abs(i) * 0.015, -Math.abs(i) * 0.03, i * 0.065);
    necklace.add(bead);
  }
  const pendant = blob(0.07, 0.1, 0.08, P.bone, { pivot: 'top', outline: 0.012 });
  pendant.position.set(0.02, -0.14, 0);
  necklace.add(pendant);

  // Arms — oversized forearms and hands, banded in stacked bone rings: the
  // actual grabbing instrument, and the combat-readable tell during the
  // windup, the same job Charger's lowered horns or Kawach's raised shield
  // do for their own commits.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.05, 0.42, side * 0.42);
    chest.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(0.24, 0.34, 0.24, c.body, { taper: 0.9, bulge: 0.08 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    // Wider than the upper arm — the taper runs backward from a grunt's.
    const fore = limb(0.24, 0.36, 0.24, c.body, { taper: 1.2, bulge: 0.06, bulgeAt: 0.6 });
    elbow.add(fore);
    for (let i = 0; i < 3; i++) {
      const r = 0.135 + i * 0.012;
      const ring = ringed(
        [
          { y: -0.022, rx: r, rz: r },
          { y: 0.022, rx: r, rz: r },
        ],
        P.bone,
        { seg: 12, outline: 0.01 }
      );
      ring.position.y = -0.1 - i * 0.09;
      elbow.add(ring);
    }

    const hand = mitt(0.24, 0.24, 0.22, c.body, { side, fist: false, outline: 0.02 });
    hand.position.y = -0.36;
    elbow.add(hand);
    n['hand' + key] = hand;

    // The inflamed glow, sitting just outside the hand rather than inside
    // it — flares during a grab's windup, the same vocabulary Kawach's eyes
    // and Shakuni's own eyes already use for "about to commit".
    const glow = decal(0.26, 0.26, c.hand, { opacity: 0.55 });
    glow.position.set(0.14, -0.46, 0);
    glow.rotation.y = Math.PI / 2;
    elbow.add(glow);
    n['handGlow' + key] = glow;
  }

  // A loincloth under the belly's overhang.
  const loin = skirt(0.62, 0.66, 0.66, 0.7, 0.3, c.dark, { folds: 6, fold: 0.05, outline: 0.022 });
  loin.position.y = 0.06;
  body.add(loin);

  // Legs — short and heavy under all that weight.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.26);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.34, 0.4, 0.34, c.body, { taper: 0.86, bulge: 0.08 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.28, 0.36, 0.28, c.dark, { taper: 0.82, bulge: 0.12, bulgeAt: 0.25 });
    knee.add(shin);

    const foot = boot(0.36, 0.12, 0.28, c.dark, { toe: 0.42 });
    foot.position.set(0.07, -0.36, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Duryodhana — gate 3's boss, the campaign's first
// ---------------------------------------------------------------------------

const roundedGeoCache = new Map();

/**
 * A box vertex projected onto the rounded-box SDF surface (clamp to the
 * shrunk "inner" box, then push out by `radius`) — cheap, and it composes
 * with the existing outline/toon pipeline unchanged since the result is
 * still one ordinary `BufferGeometry`. Validated in the `/prototype` rig
 * that settled Duryodhana's design: a human king reads wrong as a stack of
 * hard-edged LEGO boxes in a way a rakshasa's or a machine's silhouette
 * does not, so he is the rig this joins the box/decal toolkit for.
 */
function roundedBox(w, h, d, radius, segments = 3) {
  const key = `${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)},${radius.toFixed(3)},${segments}`;
  let g = roundedGeoCache.get(key);
  if (g) return g;

  const hw = w / 2, hh = h / 2, hd = d / 2;
  const r = Math.min(radius, hw, hh, hd);
  g = new THREE.BoxGeometry(w, h, d, segments, segments, segments);
  const pos = g.attributes.position;
  const ix = hw - r, iy = hh - r, iz = hd - r;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const cx = THREE.MathUtils.clamp(x, -ix, ix);
    const cy = THREE.MathUtils.clamp(y, -iy, iy);
    const cz = THREE.MathUtils.clamp(z, -iz, iz);
    const qx = x - cx, qy = y - cy, qz = z - cz;
    const len = Math.sqrt(qx * qx + qy * qy + qz * qz);
    if (len > 1e-6) {
      const s = r / len;
      pos.setXYZ(i, cx + qx * s, cy + qy * s, cz + qz * s);
    }
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  roundedGeoCache.set(key, g);
  return g;
}

/** `part()`'s rounded-corner sibling — same pivot/outline contract, `radius` defaulting to a fifth of the part's smallest dimension. */
function roundedPart(w, h, d, color, { pivot = 'center', outline = 0.022, radius, segments = 3, opts } = {}) {
  const g = new THREE.Group();
  const rad = radius != null ? radius : Math.min(w, h, d) * 0.2;
  const geo = roundedBox(w, h, d, rad, segments);
  const m = new THREE.Mesh(geo, mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  const dy = pivot === 'top' ? -h / 2 : pivot === 'bottom' ? h / 2 : 0;
  m.position.y = dy;
  g.add(m);
  if (outline > 0) {
    const o = outlineFor(geo, outline);
    o.position.y = dy;
    g.add(o);
  }
  g.userData.mesh = m;
  return g;
}

/**
 * The Kuru king. A human warrior-king in full war regalia, not a monster —
 * `hw ≈ 0.68, hh ≈ 1.35` per the roster entry, deliberately well short of
 * every other locked boss's scale since none of them read as human and he
 * has to. A real neck part separates head from torso (no hump), a
 * chest-plate sits proud of the torso's own front face, and the crown is
 * worn low at the brow line rather than balanced on top — see
 * `prototype-duryodhana-rig.html` for the pass that found each of those.
 */
export function buildDuryodhana() {
  const root = new THREE.Group();
  const n = {};

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0.92, side * 0.19);
    root.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.26, 0.5, 0.26, P.kuruPlateDark, { taper: 0.8, bulge: 0.1 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.5;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.22, 0.46, 0.22, P.kuruPlateDark, { taper: 0.74, bulge: 0.12, bulgeAt: 0.25 });
    knee.add(shin);

    // A greave from the knee to mid-shin, fluted at its upper edge.
    const greave = ringed(
      [
        { y: -0.3, rx: 0.1, rz: 0.1 },
        { y: -0.12, rx: 0.12, rz: 0.12 },
        { y: 0.02, rx: 0.14, rz: 0.135, wave: 0.08, waves: 6 },
        { y: 0.05, rx: 0.13, rz: 0.125, wave: 0.08, waves: 6 },
      ],
      P.kuruPlate,
      { seg: 12, outline: 0.024 }
    );
    knee.add(greave);

    const foot = boot(0.32, 0.12, 0.23, P.kuruPlateDark);
    foot.position.set(0.06, -0.46, 0);
    knee.add(foot);
  }

  const hips = new THREE.Group();
  hips.position.y = 0.92;
  root.add(hips);
  n.hips = hips;

  // A king's war-dress over the hips: pleated tassets in the armour's gold.
  const tassets = skirt(0.5, 0.56, 0.58, 0.64, 0.3, P.kuruPlate, { folds: 8, fold: 0.05, outline: 0.026 });
  tassets.position.y = 0.06;
  hips.add(tassets);

  const torso = trunk(0.5, 0.62, 0.5, P.kuruPlate, { waist: 0.8, chest: 0.12, p: 2.5, outline: 0.034 });
  hips.add(torso);
  n.torso = torso;

  // The breastplate: a brighter shell proud of the torso's own front, with a
  // ridge down its centre — the piece of armour a flat torso never has.
  const chestPlate = blob(0.16, 0.36, 0.42, P.kuruPlateLight, { p: 2.6, outline: 0.028 });
  chestPlate.position.set(0.19, 0.4, 0);
  torso.add(chestPlate);
  const ridge = decal(0.04, 0.3, P.kuruPlateDark);
  onFront(chestPlate, ridge, 0.0, 0, 0.004);

  // The belt: the reference-corroborated green waist-wrap, worked in low
  // rather than at the face, with the crimson danger accent as its own gem,
  // and its knot's two tails hanging down the front of the war-dress.
  const belt = ringed(
    [
      { y: 0.0, rx: 0.215, rz: 0.215, p: 2.4 },
      { y: 0.07, rx: 0.225, rz: 0.222, p: 2.4 },
      { y: 0.13, rx: 0.212, rz: 0.21, p: 2.4 },
    ],
    P.kuruWrap,
    { seg: 16, outline: 0.022 }
  );
  torso.add(belt);
  const beltGem = decal(0.08, 0.08, P.kuruCore);
  onFront(belt, beltGem, 0.065, 0, 0.004);
  beltGem.rotation.z = Math.PI / 4;
  for (const side of [-1, 1]) {
    const tail = ringed(
      [
        { y: -0.34, rx: 0.012, rz: 0.04, x: 0.02, p: 2.6 },
        { y: -0.3, rx: 0.018, rz: 0.05, x: 0.012, p: 2.6 },
        { y: -0.1, rx: 0.02, rz: 0.045, p: 2.6 },
        { y: 0.0, rx: 0.02, rz: 0.04, p: 2.6 },
      ],
      P.kuruWrap,
      { seg: 8, outline: 0.012, topY: 0.02 }
    );
    tail.position.set(0.23, 0.04, side * 0.06);
    tail.rotation.x = side * 0.12;
    torso.add(tail);
  }

  // The neck — its own part, so the head has somewhere to sit above the
  // shoulder line instead of sinking into it.
  const neck = limb(0.15, 0.14, 0.15, P.kuruSkin, { taper: 1.1, bulge: 0, outline: 0.02, up: true });
  neck.position.y = 0.62;
  torso.add(neck);
  n.neck = neck;

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.02, 0.6, side * 0.24);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = blob(0.26, 0.17, 0.24, P.kuruPlateLight, { p: 2.8, pv: 2.2, outline: 0.03 });
    pauldron.position.set(0, 0.03, side * 0.03);
    pauldron.rotation.x = side * 0.3;
    shoulder.add(pauldron);

    const upper = limb(0.17, 0.34, 0.17, P.kuruPlate, { taper: 0.84, bulge: 0.08 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.15, 0.3, 0.15, P.kuruSkin, { taper: 0.76, bulge: 0.1 });
    elbow.add(fore);

    const vambrace = limb(0.16, 0.14, 0.16, P.kuruPlateLight, { taper: 0.86, bulge: 0, p: 2.6, outline: 0.02 });
    vambrace.position.y = -0.12;
    elbow.add(vambrace);

    const hand = mitt(0.13, 0.13, 0.12, P.kuruSkin, { side });
    hand.position.y = -0.3;
    elbow.add(hand);
    n['hand' + key] = hand;
  }

  const head = new THREE.Group();
  head.position.y = 0.15;
  neck.add(head);
  n.head = head;

  const face = skull(0.28, 0.28, 0.26, P.kuruSkin, { jaw: 0.8, outline: 0.026 });
  head.add(face);
  nose(face, 0.17, 0.07, P.kuruSkin, { jut: 0.026, r: 0.018 });

  for (const side of [-1, 1]) {
    const brow = decal(0.1, 0.028, 0x0a0813);
    onFront(face, brow, 0.2, side * 0.07, 0.005);
    brow.rotation.z = side * 0.4;
  }

  // Eyes lit in a hot glowing red so the face itself reads as a threat, not
  // just the mace.
  for (const side of [-1, 1]) {
    const eyeWhite = decal(0.065, 0.04, 0x0a0813);
    onFront(face, eyeWhite, 0.16, side * 0.068, 0.004);
    const eyeGlow = decal(0.04, 0.022, P.kuruEye, { opacity: 0.6 });
    onFront(face, eyeGlow, 0.16, side * 0.068, 0.007);
    n['eyeGlow' + (side < 0 ? 'L' : 'R')] = eyeGlow;
  }

  // A king's moustache, and under it the exaggerated grin: a wide dark mouth
  // upturned at the corners with two pairs of fangs, so the snarl reads at a
  // glance even this small.
  for (const side of [-1, 1]) {
    const tache = tube(
      [
        [0.142, 0.1, side * 0.01, 0.014],
        [0.14, 0.09, side * 0.05, 0.016],
        [0.12, 0.1, side * 0.085, 0.01],
        [0.105, 0.13, side * 0.095, 0.003],
      ],
      0x1a0f0c,
      { seg: 6, outline: 0.006 }
    );
    face.add(tache);
  }
  const mouth = decal(0.15, 0.026, 0x0a0813);
  onFront(face, mouth, 0.065, 0, 0.004);
  for (const side of [-1, 1]) {
    const corner = decal(0.055, 0.028, 0x0a0813);
    onFront(face, corner, 0.08, side * 0.08, 0.004);
    corner.rotation.z = side * -0.75;
    const fx = frontOf(face.userData.mesh.geometry, 0.06, side * 0.058).x;
    const fang = tube(
      [
        [fx - 0.004, 0.066, side * 0.058, 0.012],
        [fx + 0.003, 0.04, side * 0.058, 0.008],
        [fx + 0.004, 0.02, side * 0.058, 0.001],
      ],
      P.bone,
      { seg: 5, outline: 0.005 }
    );
    face.add(fang);
    const innerFang = tube(
      [
        [fx - 0.002, 0.062, side * 0.022, 0.009],
        [fx + 0.004, 0.044, side * 0.022, 0.005],
        [fx + 0.005, 0.03, side * 0.022, 0.001],
      ],
      P.bone,
      { seg: 5, outline: 0.004 }
    );
    face.add(innerFang);
  }

  // The crown: worn, not balanced — it starts low at the brow line, tucks
  // behind the face rather than burying the eyes, and rises in tiers well
  // past the skull's own top to a spire of points.
  const crown = new THREE.Group();
  crown.position.y = 0.2;
  face.add(crown);

  const crownBody = ringed(
    [
      { y: -0.01, rx: 0.13, rz: 0.165, x: -0.012, p: 2.4 },
      { y: 0.04, rx: 0.135, rz: 0.172, x: -0.012, p: 2.4 },
      { y: 0.05, rx: 0.13, rz: 0.19, x: -0.014, p: 2.4 },
      { y: 0.2, rx: 0.13, rz: 0.19, x: -0.016, p: 2.4 },
      { y: 0.215, rx: 0.1, rz: 0.14, x: -0.018, p: 2.4 },
      { y: 0.3, rx: 0.095, rz: 0.13, x: -0.02, p: 2.4 },
      { y: 0.34, rx: 0.07, rz: 0.09, x: -0.02, p: 2.4 },
    ],
    P.kuruCrown,
    { seg: 16, bottomY: -0.01, topY: 0.35, outline: 0.024 }
  );
  crown.add(crownBody);
  const band = ringed(
    [
      { y: 0.04, rx: 0.136, rz: 0.193, x: -0.013, p: 2.4 },
      { y: 0.09, rx: 0.136, rz: 0.193, x: -0.014, p: 2.4 },
    ],
    P.kuruCrownDark,
    { seg: 16, outline: 0.0 }
  );
  crown.add(band);

  for (let i = -3; i <= 3; i++) {
    const h = 0.24 - Math.abs(i) * 0.04;
    const z = i * 0.04;
    const spike = tube(
      [
        [-0.02, 0.3, z, 0.028],
        [-0.02, 0.3 + h * 0.6, z * 1.08, 0.018],
        [-0.022, 0.3 + h, z * 1.12, 0.003],
      ],
      P.kuruCrown,
      { seg: 6, outline: 0.012 }
    );
    crown.add(spike);
  }

  const gem = decal(0.08, 0.08, 0x3aa0d6);
  onFront(crownBody, gem, 0.13, 0, 0.004);
  gem.rotation.z = Math.PI / 4;
  const gemGlow = decal(0.045, 0.045, P.kuruCore);
  onFront(crownBody, gemGlow, 0.13, 0, 0.007);
  gemGlow.rotation.z = Math.PI / 4;

  // The gada — the source's own signature weapon, held two-handed at idle,
  // a shaft topped with a flanged head that flares as the fight's one
  // telegraph.
  const gadaGrip = new THREE.Group();
  gadaGrip.position.set(0.02, -0.28, 0);
  n.handR.add(gadaGrip);
  n.gadaGrip = gadaGrip;

  const shaft = limb(0.05, 0.5, 0.05, P.bone, { taper: 1, bulge: 0, seg: 8, outline: 0.012 });
  gadaGrip.add(shaft);
  const gadaHead = ringed(
    [
      { y: -0.02, rx: 0.05, rz: 0.05 },
      { y: -0.06, rx: 0.1, rz: 0.1, wave: 0.14, waves: 8 },
      { y: -0.13, rx: 0.14, rz: 0.14, wave: 0.14, waves: 8 },
      { y: -0.2, rx: 0.13, rz: 0.13, wave: 0.14, waves: 8 },
      { y: -0.25, rx: 0.08, rz: 0.08, wave: 0.1, waves: 8 },
    ],
    P.kuruPlateDark,
    { seg: 24, bottomY: -0.28, topY: -0.01, outline: 0.03 }
  );
  gadaHead.position.y = -0.48;
  gadaGrip.add(gadaHead);
  n.gadaHead = gadaHead;
  const gadaGlow = decal(0.26, 0.26, P.kuruCore, { opacity: 0 });
  gadaGlow.position.set(0.15, -0.62, 0);
  gadaGlow.rotation.y = Math.PI / 2;
  gadaGrip.add(gadaGlow);
  n.gadaGlow = gadaGlow;

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Hiranyakashipu — gate 12's boss, and the campaign's last
// ---------------------------------------------------------------------------

/** A soft, see-through glow sphere, faded by opacity; one material per rig, since each is animated on its own. */
function glowBall(color) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
}

/** One factor for the whole body, the way `SHAKUNI_SCALE` does it: `hh ≈ 1.85` against Duryodhana's 1.35. */
const HIRANYA_SCALE = 1.38;

/**
 * The Daitya king. A regal, physically dominant humanoid asura — one head,
 * two arms, no weapon, per his roster entry: he carries nothing because he
 * does not believe anything can touch him, which is the boon's "nor by any
 * weapon" clause stated as a silhouette. Bare-chested, the oxblood register
 * carried in the skin; gold only as crown, collar and bands.
 *
 * Two things ride hidden inside the rig, built once here so nothing is ever
 * built mid-fight:
 *
 * - `doorway` — the boon-summoned threshold he stands in during his one
 *   vulnerable move, lit in `hiranyaBoon`. Posts at the rig's front and back
 *   (local ±X) so they frame him left and right on screen whichever way he
 *   faces.
 * - `narasimha` — the finishing beat. A figure of light who steps out of the
 *   threshold while he dies: not the hunter in a costume (his roster note is
 *   explicit that nothing should put the hunter in the avatar's role), and
 *   not a weapon anyone wields. Unlit materials, so he reads as light rather
 *   than as another painted body in the scene.
 */
export function buildHiranyakashipu() {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.setScalar(HIRANYA_SCALE);
  root.add(rig);
  const n = {};

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0.92, side * 0.2);
    rig.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.3, 0.5, 0.3, P.hiranyaCloth, { taper: 0.8, bulge: 0.1 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.5;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.22, 0.44, 0.22, P.hiranyaSkin, { taper: 0.7, bulge: 0.14, bulgeAt: 0.22 });
    knee.add(shin);
    const anklet = ringed(
      [
        { y: -0.4, rx: 0.075, rz: 0.075 },
        { y: -0.34, rx: 0.08, rz: 0.08 },
      ],
      P.hiranyaGold,
      { seg: 12, outline: 0.014 }
    );
    knee.add(anklet);
    const foot = boot(0.32, 0.11, 0.2, P.hiranyaSkinDark, { toe: 0.4 });
    foot.position.set(0.06, -0.44, 0);
    knee.add(foot);
  }

  const hips = new THREE.Group();
  hips.position.y = 0.92;
  rig.add(hips);
  n.hips = hips;

  // The dhoti: pleated from the waist to the thigh, and its front fall
  // hanging between the legs.
  const dhoti = skirt(0.52, 0.5, 0.6, 0.6, 0.34, P.hiranyaCloth, { folds: 9, fold: 0.05, outline: 0.024 });
  dhoti.position.y = 0.06;
  hips.add(dhoti);
  const fall = ringed(
    [
      { y: -0.5, rx: 0.02, rz: 0.08, x: 0.03, p: 2.6 },
      { y: -0.44, rx: 0.03, rz: 0.1, x: 0.02, p: 2.6, wave: 0.1, waves: 4 },
      { y: -0.2, rx: 0.035, rz: 0.1, p: 2.6, wave: 0.08, waves: 4 },
      { y: 0.0, rx: 0.04, rz: 0.09, p: 2.6 },
    ],
    P.hiranyaCloth,
    { seg: 10, outline: 0.016, topY: 0.03 }
  );
  fall.position.set(0.25, 0.04, 0);
  hips.add(fall);

  // Bare-chested: a sculpted torso, broad through the chest and narrow at
  // the waist, with the muscle carried by the shape and a few drawn lines.
  const torso = trunk(0.56, 0.68, 0.5, P.hiranyaSkin, { waist: 0.74, chest: 0.16, outline: 0.034 });
  hips.add(torso);
  n.torso = torso;
  for (const side of [-1, 1]) {
    const pec = decal(0.16, 0.022, P.hiranyaSkinDark);
    onFront(torso, pec, 0.42, side * 0.1, 0.004);
    pec.rotation.z = side * -0.25;
  }
  const midline = decal(0.022, 0.26, P.hiranyaSkinDark);
  onFront(torso, midline, 0.22, 0, 0.004);

  const waist = ringed(
    [
      { y: -0.01, rx: 0.215, rz: 0.195 },
      { y: 0.06, rx: 0.225, rz: 0.2 },
      { y: 0.12, rx: 0.215, rz: 0.19 },
    ],
    P.hiranyaGold,
    { seg: 16, outline: 0.022 }
  );
  torso.add(waist);

  // The collar: a broad gold necklace-plate at the base of the neck,
  // scalloped at its lower edge.
  const collar = ringed(
    [
      { y: 0.56, rx: 0.22, rz: 0.24, x: 0.03, wave: 0.08, waves: 10 },
      { y: 0.6, rx: 0.22, rz: 0.24, x: 0.03, wave: 0.06, waves: 10 },
      { y: 0.66, rx: 0.17, rz: 0.19, x: 0.01 },
      { y: 0.7, rx: 0.12, rz: 0.13, x: 0.0 },
    ],
    P.hiranyaGold,
    { seg: 20, outline: 0.02 }
  );
  torso.add(collar);

  const neck = limb(0.18, 0.14, 0.18, P.hiranyaSkin, { taper: 1.1, bulge: 0, outline: 0.02, up: true });
  neck.position.y = 0.66;
  torso.add(neck);
  n.neck = neck;

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.02, 0.6, side * 0.3);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const delt = blob(0.24, 0.22, 0.24, P.hiranyaSkin, { outline: 0.026 });
    delt.position.y = 0.02;
    shoulder.add(delt);

    const upper = limb(0.2, 0.36, 0.2, P.hiranyaSkin, { taper: 0.84, bulge: 0.14 });
    shoulder.add(upper);
    const band = ringed(
      [
        { y: -0.16, rx: 0.1, rz: 0.1 },
        { y: -0.09, rx: 0.105, rz: 0.105 },
      ],
      P.hiranyaGold,
      { seg: 12, outline: 0.016 }
    );
    shoulder.add(band);

    const elbow = new THREE.Group();
    elbow.position.y = -0.36;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.17, 0.3, 0.17, P.hiranyaSkin, { taper: 0.78, bulge: 0.12 });
    elbow.add(fore);
    const bracer = limb(0.18, 0.12, 0.18, P.hiranyaGold, { taper: 0.9, bulge: 0, outline: 0.016 });
    bracer.position.y = -0.14;
    elbow.add(bracer);

    const hand = mitt(0.16, 0.15, 0.14, P.hiranyaSkin, { side, fist: false });
    hand.position.y = -0.3;
    elbow.add(hand);
    n['hand' + key] = hand;

    // The claws he fights with — bone, three to a hand.
    for (let i = -1; i <= 1; i++) {
      const claw = tube(
        [
          [0.05, -0.13, i * 0.04, 0.02],
          [0.08, -0.2, i * 0.042, 0.014],
          [0.09, -0.26, i * 0.042, 0.002],
        ],
        P.bone,
        { seg: 5, outline: 0.006 }
      );
      hand.add(claw);
    }
    // Two lights on each hand, never on at once: amber is an attack coming
    // (the roster's shared threat colour), the boon's violet-white is the
    // opening. Separate glows rather than one re-tinted one, so no frame can
    // ever show the wrong colour mid-blend — and spheres, not quads: a flat
    // decal seen edge-on from the side camera read as a playing card.
    const threat = new THREE.Mesh(sph(0.15), glowBall(P.amber));
    threat.position.set(0.05, -0.17, 0);
    hand.add(threat);
    n['clawThreat' + key] = threat;
    const boon = new THREE.Mesh(sph(0.17), glowBall(P.hiranyaBoon));
    boon.position.set(0.05, -0.17, 0);
    hand.add(boon);
    n['clawBoon' + key] = boon;
  }

  const head = new THREE.Group();
  head.position.y = 0.15;
  neck.add(head);
  n.head = head;

  const face = skull(0.3, 0.3, 0.28, P.hiranyaSkin, { jaw: 0.84, outline: 0.026 });
  head.add(face);
  nose(face, 0.17, 0.07, P.hiranyaSkin, { jut: 0.028, r: 0.019 });

  for (const side of [-1, 1]) {
    const brow = decal(0.11, 0.032, 0x0a0813);
    onFront(face, brow, 0.22, side * 0.075, 0.005);
    brow.rotation.z = side * 0.45;

    const socket = decal(0.07, 0.04, 0x0a0813);
    onFront(face, socket, 0.175, side * 0.074, 0.004);
    const eye = decal(0.045, 0.022, P.hiranyaEye, { opacity: 0.7 });
    onFront(face, eye, 0.175, side * 0.074, 0.007);
    n['eyeGlow' + (side < 0 ? 'L' : 'R')] = eye;

    // The moustache, swept up at the ends — a king's, not a brute's.
    const tash = tube(
      [
        [0.148, 0.115, side * 0.01, 0.014],
        [0.146, 0.105, side * 0.05, 0.016],
        [0.125, 0.12, side * 0.09, 0.011],
        [0.11, 0.15, side * 0.1, 0.003],
      ],
      P.hiranyaSkinDark,
      { seg: 6, outline: 0.006 }
    );
    face.add(tash);
    const fx = frontOf(face.userData.mesh.geometry, 0.07, side * 0.04).x;
    const fang = tube(
      [
        [fx - 0.004, 0.085, side * 0.04, 0.012],
        [fx + 0.003, 0.06, side * 0.04, 0.008],
        [fx + 0.004, 0.04, side * 0.04, 0.001],
      ],
      P.bone,
      { seg: 5, outline: 0.005 }
    );
    face.add(fang);
  }
  const mouth = decal(0.12, 0.022, 0x0a0813);
  onFront(face, mouth, 0.085, 0, 0.004);

  // The crown: a tall, tapering kirita, worn low at the brow so it tucks
  // behind the face rather than burying the eyes.
  const crown = ringed(
    [
      { y: 0.2, rx: 0.15, rz: 0.17, x: -0.01, p: 2.4 },
      { y: 0.26, rx: 0.155, rz: 0.175, x: -0.012, p: 2.4 },
      { y: 0.28, rx: 0.13, rz: 0.15, x: -0.014, p: 2.4 },
      { y: 0.4, rx: 0.12, rz: 0.135, x: -0.018, p: 2.4 },
      { y: 0.42, rx: 0.095, rz: 0.1, x: -0.02, p: 2.4 },
      { y: 0.5, rx: 0.075, rz: 0.08, x: -0.022 },
      { y: 0.58, rx: 0.04, rz: 0.042, x: -0.024 },
      { y: 0.64, rx: 0.012, rz: 0.012, x: -0.026 },
    ],
    P.hiranyaGold,
    { seg: 16, bottomY: 0.2, topY: 0.67, outline: 0.022 }
  );
  face.add(crown);
  const jewel = decal(0.06, 0.08, P.hiranyaEye);
  onFront(crown, jewel, 0.33, 0, 0.005);

  // -- the threshold -------------------------------------------------------
  const doorway = new THREE.Group();
  doorway.position.z = -0.42;
  doorway.visible = false;
  rig.add(doorway);
  n.doorway = doorway;
  n.doorGlow = [];
  for (const side of [-1, 1]) {
    const post = block(0.24, 2.7, 0.24, P.daityaStone, { pivot: 'bottom', round: 0.3, outline: 0.03 });
    post.position.x = side * 1.02;
    doorway.add(post);
    const base = block(0.34, 0.16, 0.34, P.daityaStoneDark, { pivot: 'bottom', round: 0.3, outline: 0.024 });
    base.position.x = side * 1.02;
    doorway.add(base);
    // On both faces: the rig yaws half a turn to face left, and a strip on
    // one face alone ends up behind its own post.
    for (const face_ of [-1, 1]) {
      const strip = decal(0.14, 2.4, P.hiranyaBoon, { opacity: 0 });
      strip.position.set(side * 1.02, 1.35, face_ * 0.13);
      doorway.add(strip);
      n.doorGlow.push(strip);
    }
  }
  const lintel = block(2.5, 0.26, 0.32, P.daityaStone, { pivot: 'bottom', round: 0.3, outline: 0.03 });
  lintel.position.y = 2.7;
  doorway.add(lintel);
  for (const face_ of [-1, 1]) {
    const lintelGlow = decal(2.1, 0.1, P.hiranyaBoon, { opacity: 0 });
    lintelGlow.position.set(0, 2.83, face_ * 0.17);
    doorway.add(lintelGlow);
    n.doorGlow.push(lintelGlow);
  }

  // -- Narasimha -----------------------------------------------------------
  //
  // Stands in the threshold, just behind the king, and is scaled from zero
  // by the death animation rather than faded — a scale needs no transparent
  // material, and "steps out of the threshold" is what a growing figure
  // looks like from the side. A figure of light: every part unlit.
  const narasimha = new THREE.Group();
  narasimha.position.set(-0.3, 0, -0.5);
  narasimha.scale.setScalar(0.001);
  narasimha.visible = false;
  rig.add(narasimha);
  n.narasimha = narasimha;
  const light = { material: unlit(P.narasimhaLight), outline: 0.02 };
  const maneLook = { material: unlit(P.narasimhaMane), outline: 0.016 };
  const halo = unlit(P.narasimhaHalo);

  for (const side of [-1, 1]) {
    const leg = limb(0.26, 0.9, 0.26, 0, { ...light, taper: 0.7, bulge: 0.1, up: true });
    leg.position.set(0, 0.06, side * 0.19);
    narasimha.add(leg);
  }
  const nTorso = trunk(0.54, 0.8, 0.5, 0, { ...light, waist: 0.72, chest: 0.16 });
  nTorso.position.y = 0.9;
  narasimha.add(nTorso);
  for (const side of [-1, 1]) {
    const arm = limb(0.19, 0.72, 0.19, 0, { ...light, taper: 0.76, bulge: 0.12 });
    arm.position.set(0.1, 1.64, side * 0.34);
    arm.rotation.z = 0.55; // reaching forward, toward the king at his feet
    narasimha.add(arm);
  }
  const nHead = new THREE.Group();
  nHead.position.y = 1.76;
  narasimha.add(nHead);
  // The mane first, so the face sits in front of it: a ruff of locks around
  // the head in the plane behind the face, the lion read carried by
  // silhouette alone.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const lock = tube(
      [
        [-0.04, 0.2 + Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.07],
        [-0.12, 0.2 + Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.05],
        [-0.16, 0.2 + Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0.006],
      ],
      0,
      { ...maneLook, seg: 6 }
    );
    nHead.add(lock);
  }
  const nFace = skull(0.36, 0.38, 0.34, 0, { ...light, jaw: 0.9, snout: 0.22 });
  nFace.position.y = 0.02;
  nHead.add(nFace);
  const crownN = ringed(
    [
      { y: 0.34, rx: 0.14, rz: 0.15, x: -0.02 },
      { y: 0.42, rx: 0.13, rz: 0.14, x: -0.02 },
      { y: 0.52, rx: 0.06, rz: 0.06, x: -0.03 },
    ],
    0,
    { ...maneLook, seg: 12, bottomY: 0.34, topY: 0.58 }
  );
  nHead.add(crownN);
  const ring = new THREE.Mesh(tor(0.62, 0.035, 6, 28), halo);
  ring.rotation.y = Math.PI / 2;
  ring.position.set(-0.22, 0.2, 0);
  nHead.add(ring);

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Taraka — gate 4's Warden, two curse-phase rigs sharing one node vocabulary
// ---------------------------------------------------------------------------

/**
 * One biped skeleton, built twice at different proportions and palettes —
 * once beautiful, once monstrous — so `Taraka._animate` in `enemies.js` can
 * drive whichever is currently visible through the identical node names
 * (`shoulderL`/`shoulderR`, `hipL`/`hipR`, `eyeL`/`eyeR`) without knowing
 * which form it is looking at. The monstrous form is taller and narrower
 * than `BAKASURA`'s round-bellied giant (`hh ≈ 1.3`, `hw ≈ 0.78` per the
 * handoff, an athletic rather than heavy-bellied read) and carries claws at
 * the hand the beautiful form does not; both wear the same raw-hide pelt,
 * so the swap reads as violence done *to* a person rather than a costume
 * change.
 */
function buildTarakaForm(monstrous, c) {
  const skin = monstrous ? c.monsterSkin : c.beautySkin;
  const dark = monstrous ? c.monsterDark : c.beautyHair;
  const s = monstrous ? 1 : 0.7; // scale everything below off one factor

  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.62 * s + (monstrous ? 0.3 : 0);
  root.add(body);
  n.body = body;
  /** `_animate`'s idle-bob baseline — read back rather than re-derived, so the two forms never drift out of sync with what was actually built. */
  n.baseY = body.position.y;

  // The same body plan twice: a dancer's line in the beautiful form, a
  // hunched predator's in the monstrous one — chest thrown forward, waist
  // pulled in, shoulders high.
  const torso = monstrous
    ? trunk(0.5, 0.62, 0.44, skin, { waist: 0.7, chest: 0.2, outline: 0.03 })
    : trunk(0.5 * s, 0.62 * s, 0.4 * s, skin, { waist: 0.66, chest: 0.12, taper: 0.9, outline: 0.024 });
  body.add(torso);
  n.torso = torso;
  if (monstrous) torso.rotation.z = -0.12;

  // The raw-hide pelt, slung low across the hip — identity in both forms,
  // per the handoff's explicit call against skull/bone jewelry (Bakasura's
  // own motif, dropped here so the two giants don't repeat each other). A
  // ragged hem of hide, and a band of the same hide across the chest.
  const pelt = skirt(0.46 * s, 0.44 * s, 0.56 * s, 0.54 * s, 0.26 * s, c.pelt, { folds: 5, fold: 0.12, outline: 0.02 });
  pelt.position.y = 0.05 * s;
  torso.add(pelt);
  const band = ringed(
    [
      { y: 0.3 * s, rx: 0.232 * s, rz: 0.19 * s, x: (monstrous ? 0.08 : 0.04) * s },
      { y: 0.36 * s, rx: 0.25 * s, rz: 0.196 * s, x: (monstrous ? 0.1 : 0.05) * s },
      { y: 0.44 * s, rx: 0.25 * s, rz: 0.198 * s, x: (monstrous ? 0.11 : 0.055) * s, wave: monstrous ? 0.08 : 0, waves: 5 },
    ],
    c.pelt,
    { seg: 14, outline: 0.016 }
  );
  torso.add(band);

  const head = new THREE.Group();
  head.position.y = 0.6 * s;
  torso.add(head);
  n.head = head;

  const neck = limb(0.13 * s, 0.1 * s, 0.13 * s, skin, { taper: 1.1, bulge: 0, outline: 0.014, up: true });
  neck.position.y = -0.05 * s;
  head.add(neck);

  const face = monstrous
    ? skull(0.34, 0.32, 0.3, skin, { jaw: 0.98, snout: 0.2, outline: 0.026 })
    : skull(0.3 * s, 0.32 * s, 0.27 * s, skin, { jaw: 0.6, outline: 0.02 });
  head.add(face);
  if (!monstrous) nose(face, 0.13, 0.045, skin, { jut: 0.016, r: 0.011 });

  if (monstrous) {
    // A distorted, jutting jaw and a row of teeth — "prominent teeth and an
    // enraged expression" per the reference description, built rather than
    // referenced since no image survived for this form.
    const jaw = barrel(
      [
        { x: -0.1, ry: 0.05, rz: 0.12, y: -0.03 },
        { x: 0.02, ry: 0.07, rz: 0.13, y: -0.04 },
        { x: 0.12, ry: 0.06, rz: 0.11, y: -0.04 },
        { x: 0.2, ry: 0.045, rz: 0.08, y: -0.03 },
      ],
      dark,
      { seg: 12, backX: -0.13, frontX: 0.23, outline: 0.02 }
    );
    jaw.position.set(0.06, 0.02, 0);
    face.add(jaw);
    for (let i = -1; i <= 1; i++) {
      const fang = tube(
        [
          [0.24, 0.0, i * 0.05, 0.016],
          [0.25, 0.05, i * 0.052, 0.011],
          [0.25, 0.09, i * 0.05, 0.002],
        ],
        P.bone,
        { seg: 5, outline: 0.006 }
      );
      face.add(fang);
    }
    // Bark-ridged brows and a crest of it down the skull — the forest's
    // own curse grown into her.
    for (let i = 0; i < 4; i++) {
      const spike = tube(
        [
          [0.06 - i * 0.09, 0.3 - i * 0.02, 0, 0.03],
          [0.0 - i * 0.09, 0.38 - i * 0.03, 0, 0.02],
          [-0.08 - i * 0.09, 0.42 - i * 0.04, 0, 0.003],
        ],
        dark,
        { seg: 6, outline: 0.01 }
      );
      face.add(spike);
    }
  } else {
    // Long, loose human hair down the back — the one detail the monstrous
    // form sheds entirely.
    const hair = ringed(
      [
        { y: -0.34, rx: 0.05, rz: 0.1, x: -0.12 },
        { y: -0.22, rx: 0.08, rz: 0.13, x: -0.11 },
        { y: -0.02, rx: 0.1, rz: 0.13, x: -0.09 },
        { y: 0.12, rx: 0.12, rz: 0.12, x: -0.05 },
        { y: 0.2, rx: 0.12, rz: 0.115, x: -0.02 },
        { y: 0.24, rx: 0.1, rz: 0.1, x: -0.015 },
      ],
      dark,
      { seg: 12, bottomY: -0.4, topY: 0.255, outline: 0.016 }
    );
    head.add(hair);
    for (const side of [-1, 1]) {
      const lock = tube(
        [
          [0.02, 0.2, side * 0.1, 0.03],
          [0.0, 0.08, side * 0.12, 0.028],
          [-0.02, -0.06, side * 0.11, 0.02],
          [0.0, -0.18, side * 0.09, 0.004],
        ],
        dark,
        { seg: 6, outline: 0.01 }
      );
      head.add(lock);
    }
  }

  for (const side of [-1, 1]) {
    const eye = decal(monstrous ? 0.09 : 0.05, monstrous ? 0.05 : 0.03, c.eye, { opacity: monstrous ? 1 : 0.75 });
    onFront(face, eye, (monstrous ? 0.2 : 0.14) * (monstrous ? 1 : 1), side * (monstrous ? 0.085 : 0.05), 0.005);
    if (monstrous) eye.rotation.z = side * -0.3;
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  // Arms — claws only on the monstrous form; the beautiful form's hands are
  // bare, per the handoff's "contrast, not corruption" call for this pair.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.06 * s, 0.44 * s, side * 0.28 * s);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(0.16 * s, 0.32 * s, 0.16 * s, skin, { taper: 0.8, bulge: monstrous ? 0.14 : 0.04 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.32 * s;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.15 * s, 0.3 * s, 0.15 * s, skin, { taper: 0.72, bulge: monstrous ? 0.12 : 0.04 });
    elbow.add(fore);

    const hand = mitt(0.13 * s, 0.14 * s, 0.13 * s, skin, { side, fist: false });
    hand.position.y = -0.3 * s;
    elbow.add(hand);
    n['hand' + key] = hand;

    if (monstrous) {
      for (let i = -1; i <= 1; i++) {
        const claw = tube(
          [
            [0.05, -0.4, i * 0.05, 0.022],
            [0.1, -0.47, i * 0.055, 0.016],
            [0.12, -0.54, i * 0.055, 0.002],
          ],
          P.bone,
          { seg: 5, outline: 0.007 }
        );
        elbow.add(claw);
      }
    }

    // The claw-swipe telegraph flare — `P.amber`, the roster's shared
    // damage-signal accent (Bakasura's hands, Shurpanakha's and
    // Kumbhakarna's eyes), not a fourth invented hue.
    const glow = decal(0.2 * s, 0.2 * s, c.eye, { opacity: 0.5 });
    glow.position.set(0.1, -0.3 * s, 0);
    glow.rotation.y = Math.PI / 2;
    elbow.add(glow);
    n['handGlow' + key] = glow;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.16 * s);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.2 * s, 0.36 * s, 0.2 * s, dark, { taper: 0.78, bulge: 0.1 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.36 * s;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.17 * s, 0.32 * s, 0.17 * s, dark, { taper: 0.68, bulge: 0.12, bulgeAt: 0.22 });
    knee.add(shin);

    const foot = boot(0.22 * s, 0.1 * s, 0.15 * s, dark, { toe: 0.4 });
    foot.position.set(0.05, -0.32 * s, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

/**
 * Both curse-phase rigs, pre-built and toggled by `visible` — the same
 * gate-transition pattern `Game` already uses, never rebuilt mid-run.
 * `Taraka.constructor` reads `root.userData.forms` to swap `visible` and its
 * own `this.n` reference at the HP-threshold reveal.
 */
export function buildTaraka(skin = null) {
  const c = skin || {
    beautySkin: P.tarakaSkin,
    beautyHair: P.tarakaHair,
    monsterSkin: P.tarakaMoss,
    monsterDark: P.tarakaMossDark,
    pelt: P.tarakaPelt,
    eye: P.tarakaEye,
  };
  const root = new THREE.Group();

  const beautiful = buildTarakaForm(false, c);
  const monstrous = buildTarakaForm(true, c);
  monstrous.visible = false;
  root.add(beautiful, monstrous);

  root.userData.forms = {
    beautiful: { root: beautiful, nodes: beautiful.userData.nodes },
    monstrous: { root: monstrous, nodes: monstrous.userData.nodes },
  };
  root.userData.nodes = beautiful.userData.nodes;
  return root;
}

// ---------------------------------------------------------------------------
// Shurpanakha — gate 6's Warden, the roster's second phase-transition
// ---------------------------------------------------------------------------

/**
 * One of Shurpanakha's two rigs. `true_` selects the rakshasi form; the other
 * is the human disguise she wears into the fight.
 *
 * Both are deliberately **human-scaled** (`hw 0.46 / hh 0.95` true, `0.38 /
 * 0.88` disguised, per docs/research/villain-roster.md) — the giant-scale
 * demon-form reference is overridden on purpose, because Taraka is already a
 * giant two gates back and Kumbhakarna is one two gates ahead, and three
 * giants in a row would flatten the act's silhouette read.
 *
 * The two forms share a hair colour and a body plan and differ in skin,
 * jewelry and hair discipline: bound and ornate under the headdress in the
 * disguise, loose and wild at the reveal. Hair stays black in both, the same
 * "violence done to a person, not a costume change" call Taraka's pelt makes
 * across her own pair. No horns anywhere — one demon-form reference has them,
 * the other does not, and the roster already spends that motif on Charger's
 * windup tell and Bakasura's skull-crest.
 */
function buildShurpanakhaForm(true_, c) {
  const skin = true_ ? c.ash : c.skin;
  const dark = true_ ? c.ashDark : c.drapeDark;
  const s = true_ ? 1 : 0.93; // broader and slightly taller after the reveal

  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.72 * s;
  root.add(body);
  n.body = body;
  /** `_animate`'s idle-bob baseline, read back rather than re-derived — the same guard `buildTaraka`'s own forms use against the pair drifting apart. */
  n.baseY = body.position.y;

  const torso = trunk(0.34 * s, 0.66 * s, 0.32 * s, skin, { waist: true_ ? 0.78 : 0.68, chest: 0.1, taper: true_ ? 1 : 0.9, outline: 0.026 });
  body.add(torso);
  n.torso = torso;

  if (!true_) {
    // The red drape, worn over one shoulder and across the torso — the
    // disguise's own reference detail, shed at the reveal — and a pleated
    // skirt of the same cloth to the knee.
    const drape = ringed(
      [
        { y: 0.18, rx: 0.15, rz: 0.15, x: 0.012 },
        { y: 0.32, rx: 0.165, rz: 0.158, x: 0.02 },
        { y: 0.46, rx: 0.172, rz: 0.162, x: 0.024 },
        { y: 0.56, rx: 0.15, rz: 0.158, x: 0.012 },
      ],
      c.drape,
      { seg: 14, outline: 0.02 }
    );
    torso.add(drape);
    const pallu = tube(
      [
        [0.02, 0.58, 0.14, 0.035],
        [-0.12, 0.5, 0.15, 0.04],
        [-0.17, 0.3, 0.14, 0.04],
        [-0.16, 0.1, 0.12, 0.03],
      ],
      c.drape,
      { seg: 6, squash: 0.45, outline: 0.012 }
    );
    torso.add(pallu);
    const dress = skirt(0.3, 0.3, 0.44, 0.42, 0.42, c.drape, { folds: 8, fold: 0.05, outline: 0.02 });
    dress.position.y = 0.04;
    torso.add(dress);

    // Gold at the waist and throat — jewelry, not armour, and simpler than
    // Kaikeyi's three-strand coin cascade one gate back, which is the
    // concrete difference her entry asks these two women's palettes to carry.
    const sash = ringed(
      [
        { y: 0.11, rx: 0.137, rz: 0.137 },
        { y: 0.16, rx: 0.14, rz: 0.14 },
      ],
      c.gold,
      { seg: 14, outline: 0.012 }
    );
    torso.add(sash);
    const necklace = shaped(tor(0.085, 0.012, 5, 14), c.gold, { outline: 0.008 });
    necklace.rotation.x = Math.PI / 2 - 0.35;
    necklace.position.set(0.02, 0.6, 0);
    torso.add(necklace);
  } else {
    // A ragged remnant of the drape at the hip, and dried-blood vein-cracks
    // across the chest, dull rather than danger-red so they never compete
    // with a live telegraph.
    const wrap = skirt(0.32, 0.32, 0.38, 0.36, 0.22, dark, { folds: 5, fold: 0.14, outline: 0.018 });
    wrap.position.y = 0.06;
    torso.add(wrap);
    for (let i = 0; i < 3; i++) {
      const vein = decal(0.018, 0.26 - i * 0.05, c.vein);
      onFront(torso, vein, 0.48 - i * 0.06, (i - 1) * 0.07, 0.004);
      vein.rotation.z = (i - 1) * 0.3;
    }
  }

  const head = new THREE.Group();
  head.position.y = 0.64 * s;
  torso.add(head);
  n.head = head;

  const neck = limb(0.09 * s, 0.1 * s, 0.09 * s, skin, { taper: 1.1, bulge: 0, outline: 0.012, up: true });
  neck.position.y = -0.06 * s;
  head.add(neck);
  const face = skull(0.2 * s, 0.24 * s, 0.19 * s, skin, { jaw: 0.6, outline: 0.02 });
  head.add(face);
  if (!true_) nose(face, 0.125, 0.045, skin, { jut: 0.016, r: 0.011 });

  if (true_) {
    // The vein-cracks again, on the face this time — the one place the
    // hunter is actually looking when the reveal lands.
    for (const side of [-1, 1]) {
      const crack = decal(0.016, 0.12, c.vein);
      onFront(face, crack, 0.15, side * 0.05, 0.004);
      crack.rotation.z = side * 0.25;
    }
    // The wound itself, at the centre of the face: the nose Lakshmana took.
    // Recessed rather than added — a mark of dried blood laid flat where the
    // rig's other faces carry nothing — because her phase-transition line
    // points straight at it ("look at it properly, this time"), and a reveal
    // that narrates a mutilation the model does not actually show is the
    // reveal failing at the one job it has. It is never staged as something
    // the hunter delivers or witnesses: it is already old when she arrives,
    // and she is the only one who ever describes it.
    const wound = decal(0.04, 0.05, c.vein);
    onFront(face, wound, 0.1, 0, 0.004);

    // Loose, wild hair — the disguise's headdress gone, the same black
    // underneath it always was.
    const mane = capOf(face, 0.1, c.hair, { grow: 1.12, back: 0.012, brow: 0.05, hairline: 0.148, wave: 0.12 });
    const fall = ringed(
      [
        { y: -0.2, rx: 0.06, rz: 0.15, x: -0.13 },
        { y: -0.06, rx: 0.09, rz: 0.17, x: -0.12, wave: 0.12, waves: 7 },
        { y: 0.1, rx: 0.1, rz: 0.15, x: -0.1 },
        { y: 0.2, rx: 0.07, rz: 0.1, x: -0.08 },
      ],
      c.hair,
      { seg: 12, bottomY: -0.27, topY: 0.24, outline: 0.02 }
    );
    head.add(fall);
    for (let i = 0; i < 6; i++) {
      const a = -1 + (i / 5) * 2;
      const lock = tube(
        [
          [-0.06, 0.16, a * 0.12, 0.035],
          [-0.16, 0.08 - Math.abs(a) * 0.04, a * 0.2, 0.028],
          [-0.24, -0.06 - Math.abs(a) * 0.05, a * 0.24, 0.004],
        ],
        c.hair,
        { seg: 6, outline: 0.01 }
      );
      head.add(lock);
    }
  } else {
    // Bound hair under a cowrie-shell-banded headdress: the shell band is the
    // silhouette tell that vanishes at the reveal.
    const bound = capOf(face, 0.1, c.hair, { grow: 1.08, back: 0.01, brow: 0.05, hairline: 0.15 });
    const bun = blob(0.12, 0.1, 0.11, c.hair, { outline: 0.014 });
    bun.position.set(-0.12, 0.18, 0);
    head.add(bun);

    const shellBand = ringed(
      [
        { y: 0.158, rx: 0.1, rz: 0.102, x: -0.004 },
        { y: 0.19, rx: 0.1, rz: 0.1, x: -0.008 },
      ],
      c.shell,
      { seg: 14, outline: 0.01 }
    );
    head.add(shellBand);

    const crest = blob(0.08, 0.1, 0.12, c.gold, { pivot: 'bottom', p: 2.4, outline: 0.012 });
    crest.position.set(0.04, 0.2, 0);
    head.add(crest);
  }

  // Heavy kohl in the disguise, amber flare in the true form — one accent
  // slot, two readings, so the eye the hunter tracks for a windup never
  // moves on the rig.
  for (const side of [-1, 1]) {
    const eye = decal(true_ ? 0.07 : 0.05, true_ ? 0.04 : 0.024, c.eye, { opacity: true_ ? 1 : 0.7 });
    onFront(face, eye, 0.14 * s, side * 0.045 * s, 0.004);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.04 * s, 0.5 * s, side * 0.2 * s);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(0.11 * s, 0.3 * s, 0.11 * s, skin, { taper: 0.8, bulge: 0.04 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.3 * s;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.1 * s, 0.28 * s, 0.1 * s, skin, { taper: 0.72, bulge: 0.04 });
    elbow.add(fore);

    const hand = mitt(0.09 * s, 0.11 * s, 0.09 * s, skin, { side, fist: false });
    hand.position.y = -0.28 * s;
    elbow.add(hand);
    n['hand' + key] = hand;

    if (true_) {
      // Claws — natural, not wielded, matching both demon-form references and
      // the source's own language. The disguise's hands are bare: the swipe
      // that lands after the reveal is the feint that landed before it.
      for (let i = -1; i <= 1; i++) {
        const claw = tube(
          [
            [0.04, -0.36, i * 0.04, 0.018],
            [0.09, -0.44, i * 0.045, 0.013],
            [0.11, -0.52, i * 0.045, 0.002],
          ],
          P.bone,
          { seg: 5, outline: 0.006 }
        );
        elbow.add(claw);
      }
    } else {
      // Gold bangles where the claws will be — the disguise wearing ornament
      // exactly where the true form carries the weapon.
      const bangle = shaped(tor(0.05, 0.014, 5, 12), c.gold, { outline: 0.008 });
      bangle.rotation.x = Math.PI / 2;
      bangle.position.y = -0.24 * s;
      elbow.add(bangle);
    }

    // The one attack's telegraph flare, in the shared damage-signal amber
    // (`P.amber`, via `c.eye`). It sits on the same node in both forms, so
    // the tell the hunter learned pre-reveal is the tell they read after it —
    // which is the whole point of a reskinned kit rather than a replaced one.
    const glow = decal(0.16 * s, 0.16 * s, c.eye, { opacity: 0.4 });
    glow.position.set(0.08, -0.28 * s, 0);
    glow.rotation.y = Math.PI / 2;
    elbow.add(glow);
    n['handGlow' + key] = glow;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.12 * s);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.15 * s, 0.36 * s, 0.15 * s, dark, { taper: 0.76, bulge: 0.08 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.36 * s;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.13 * s, 0.32 * s, 0.13 * s, dark, { taper: 0.66, bulge: 0.1, bulgeAt: 0.22 });
    knee.add(shin);

    const foot = boot(0.17 * s, 0.07 * s, 0.11 * s, true_ ? dark : c.skin, { toe: 0.4 });
    foot.position.set(0.04, -0.32 * s, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

/**
 * Both of Shurpanakha's rigs, pre-built and toggled by `visible` — never
 * rebuilt mid-run, the same rule `buildTaraka` and `Game`'s own gate
 * transitions follow, and for the same reason: three.js draws four
 * `Math.random()` values per object for its UUID, and a rig built mid-run
 * spends the gameplay stream the suite seeds.
 *
 * `Shurpanakha.constructor` in `enemies.js` reads `root.userData.forms` and
 * swaps both the `visible` flag and its own `this.n` at the reveal.
 */
export function buildShurpanakha(skin = null) {
  const c = skin || {
    skin: P.shurpaSkin,
    drape: P.shurpaDrape,
    drapeDark: P.shurpaDrapeDark,
    gold: P.shurpaGold,
    shell: P.shurpaShell,
    hair: P.shurpaHair,
    ash: P.shurpaAsh,
    ashDark: P.shurpaAshDark,
    vein: P.shurpaVein,
    eye: P.shurpaEye,
  };
  const root = new THREE.Group();

  const disguised = buildShurpanakhaForm(false, c);
  const revealed = buildShurpanakhaForm(true, c);
  revealed.visible = false;
  root.add(disguised, revealed);

  root.userData.forms = {
    disguised: { root: disguised, nodes: disguised.userData.nodes },
    revealed: { root: revealed, nodes: revealed.userData.nodes },
  };
  root.userData.nodes = disguised.userData.nodes;
  return root;
}

// ---------------------------------------------------------------------------
// Lanka soldier — gate 7's new regular archetype
// ---------------------------------------------------------------------------

/**
 * Lanka on a war footing: a rakshasa-soldier with a spear, per
 * `docs/SPEC-CAMPAIGN.md` § Act 2 — the act's one new regular-enemy archetype,
 * and the first *regular* enemy since Act 1 to get a rig of its own rather
 * than a reskin.
 *
 * The silhouette exists to answer one question the hunter asks from across the
 * ramparts: is this the shield thing again? So it is built as `Kawach`'s
 * opposite at every proportion the eye reads first — taller, narrower, no
 * shield slab, and a haft that sticks a metre and a half past the body it
 * belongs to. `LankaSoldier` in `game/enemies.js` extends `Kawach`, so the
 * *tell* is deliberately the same one (plant, eyes flare, commit); the reach
 * is the only thing that moved, and the silhouette is what has to say so
 * before the first thrust lands.
 *
 * Node vocabulary matches `buildKawach`'s (`body`, `head`, `eyeL`/`eyeR`,
 * `shoulderL`/`shoulderR`, `hipL`/`hipR`) plus `spear`, which the animator
 * drives through the thrust.
 */
export function buildLankaSoldier(skin = null) {
  const c = skin || {
    body: P.lankaSoldierPlate,
    dark: P.lankaSoldierPlateDark,
    skin: P.lankaSoldierSkin,
    eye: P.lankaSoldierEye,
    haft: P.lankaSpearHaft,
    head: P.lankaSpearHead,
  };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.86;
  root.add(body);
  n.body = body;

  // Narrow and upright where Kawach is wide and low-slung — a formation
  // fighter stands in a line, it does not brace alone.
  const torso = trunk(0.34, 0.62, 0.38, c.skin, { waist: 0.76, chest: 0.12, outline: 0.026 });
  body.add(torso);

  // Lamellar rather than a bolted chest slab: three overlapping bands, each
  // flaring at its lower edge, layered and war-worn rather than one piece.
  for (let i = 0; i < 3; i++) {
    const y0 = 0.08 + i * 0.13;
    const hx = 0.17 + (i === 1 ? 0.012 : 0) - i * 0.004;
    const hz = 0.19 - i * 0.004;
    const lame = ringed(
      [
        { y: y0 - 0.075, rx: hx * 1.06, rz: hz * 1.04, x: 0.02, p: 2.6 },
        { y: y0 - 0.06, rx: hx * 1.09, rz: hz * 1.07, x: 0.02, p: 2.6 },
        { y: y0 + 0.07, rx: hx * 1.02, rz: hz * 0.99, x: 0.018, p: 2.6 },
      ],
      i === 1 ? c.body : c.dark,
      { seg: 14, outline: 0.014 }
    );
    torso.add(lame);
  }
  const loin = skirt(0.3, 0.34, 0.34, 0.38, 0.24, c.dark, { folds: 5, fold: 0.05, outline: 0.018 });
  loin.position.y = 0.02;
  body.add(loin);

  const head = new THREE.Group();
  head.position.y = 0.66;
  torso.add(head);
  n.head = head;

  const face = skull(0.25, 0.27, 0.24, c.skin, { jaw: 0.8 });
  head.add(face);
  nose(face, 0.15, 0.06, c.skin, { jut: 0.024, r: 0.015 });

  // A conical helm with a back-swept crest — height added at the top of the
  // silhouette, which is where a lineup of them reads as a line.
  const helm = ringed(
    [
      { y: 0.16, rx: 0.14, rz: 0.135 },
      { y: 0.2, rx: 0.145, rz: 0.14 },
      { y: 0.28, rx: 0.12, rz: 0.115, x: -0.01 },
      { y: 0.36, rx: 0.06, rz: 0.058, x: -0.03 },
      { y: 0.42, rx: 0.015, rz: 0.015, x: -0.05 },
    ],
    c.dark,
    { seg: 14, outline: 0.02, bottomY: 0.16, topY: 0.43 }
  );
  face.add(helm);
  const crest = tube(
    [
      [-0.04, 0.38, 0, 0.035],
      [-0.16, 0.44, 0, 0.03],
      [-0.28, 0.4, 0, 0.018],
      [-0.36, 0.3, 0, 0.004],
    ],
    c.body,
    { seg: 6, squash: 0.45, outline: 0.012 }
  );
  face.add(crest);
  for (const side of [-1, 1]) {
    const tusk = tube(
      [
        [0.1, 0.04, side * 0.05, 0.014],
        [0.125, 0.08, side * 0.058, 0.009],
        [0.13, 0.11, side * 0.052, 0.002],
      ],
      P.bone,
      { seg: 5, outline: 0.006 }
    );
    face.add(tusk);
  }

  // Eyes, in the shared vocabulary: they flare when a commit is near — the
  // same signal on the same schedule as the Kawach this extends.
  for (const side of [-1, 1]) {
    const eye = decal(0.06, 0.034, c.eye);
    onFront(face, eye, 0.15, side * 0.058, 0.004);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.5, side * 0.24);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = blob(0.22, 0.13, 0.2, c.dark, { p: 3, pv: 2.2, outline: 0.018 });
    pauldron.position.set(0, 0.03, side * 0.02);
    pauldron.rotation.x = side * 0.35;
    shoulder.add(pauldron);

    const upper = limb(0.13, 0.28, 0.13, c.skin, { taper: 0.82, bulge: 0.1 });
    upper.position.y = -0.04;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.12, 0.26, 0.12, c.skin, { taper: 0.76, bulge: 0.1 });
    elbow.add(fore);

    const bracer = limb(0.13, 0.12, 0.13, c.dark, { taper: 0.9, bulge: 0, p: 2.6, outline: 0.012 });
    bracer.position.y = -0.1;
    elbow.add(bracer);
    const hand = mitt(0.1, 0.1, 0.11, c.skin, { side });
    hand.position.y = -0.26;
    elbow.add(hand);
  }

  // The spear, carried in the far arm and pivoting from the grip so the
  // animator swings the whole length from one node. Built along +X, which is
  // the direction it thrusts — see this file's orientation note.
  const spear = new THREE.Group();
  spear.position.set(0.06, -0.24, 0);
  n.elbowR.add(spear);
  n.spear = spear;

  const haft = new THREE.Group();
  haft.rotation.z = -Math.PI / 2; // lay it down along +X (a +90° z-turn would point it backwards)
  spear.add(haft);
  const shaft = limb(0.05, 1.98, 0.05, c.haft, { taper: 0.9, bulge: 0, seg: 8, outline: 0.012, up: true });
  shaft.position.y = -0.53; // grip sits a third of the way up, not at the butt
  haft.add(shaft);
  // A leaf blade: widest a third of the way up, thin through its width, so
  // the head reads as a spear rather than as the haft in a paler colour.
  const tip = ringed(
    [
      { y: 0.0, rx: 0.03, rz: 0.03 },
      { y: 0.06, rx: 0.024, rz: 0.05 },
      { y: 0.14, rx: 0.02, rz: 0.075 },
      { y: 0.26, rx: 0.014, rz: 0.05 },
      { y: 0.36, rx: 0.006, rz: 0.012 },
    ],
    c.head,
    { seg: 10, outline: 0.01, bottomY: -0.01, topY: 0.4 }
  );
  tip.position.y = 1.45;
  haft.add(tip);
  const collar = blob(0.07, 0.06, 0.07, c.body, { outline: 0.008 });
  collar.position.y = 1.45;
  haft.add(collar);

  // Legs — long, planted. It walks in and stops at spear length, which is a
  // very different distance from the one the shield taught.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.13);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.16, 0.36, 0.16, c.dark, { taper: 0.8, bulge: 0.08 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.36;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.14, 0.34, 0.14, c.skin, { taper: 0.7, bulge: 0.12, bulgeAt: 0.22 });
    knee.add(shin);
    const greave = limb(0.15, 0.2, 0.15, c.dark, { taper: 0.8, bulge: 0.04, p: 2.6, outline: 0.012 });
    greave.position.y = -0.08;
    knee.add(greave);

    const foot = boot(0.22, 0.08, 0.15, c.dark);
    foot.position.set(0.04, -0.34, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Kumbhakarna — gate 7's Warden, the largest silhouette in the game
// ---------------------------------------------------------------------------

/**
 * `hw 1.8`, `hh 2.2` — by his roster entry's own instruction, made
 * *exceptionally* giant rather than merely the roster's biggest Warden, which
 * puts him past every one of the four locked bosses (`GoruMukh`'s `hw 1.7` was
 * the prior largest; the bosses top out at `hh 2.0`). That deliberately breaks
 * the assumption Bakasura's entry left standing — that Wardens stay under boss
 * scale — and it is safe to break because `contactDamage: 0` and the
 * no-passive-contact rule mean the collision box is a movement-space fact, not
 * a threat multiplier.
 *
 * Bare-chested with an actual face, not armoured: the respectful-treatment
 * note needs a face to land pathos on, and an inhuman war-machine read would
 * work against it. So the scale-up echoes the `Guardian`/`Boss` rig's
 * *proportions* only, never its plate-and-blank-faceplate identity.
 *
 * One rig, not two. His phase-transition is groggy → awake, which is pose,
 * speed and palette — `Kumbhakarna._wake` in `game/enemies.js` re-tints the
 * meshes collected in `n.skinMeshes` and lifts `n.lidL`/`n.lidR`, rather than
 * toggling a second pre-built body the way `buildTaraka` and
 * `buildShurpanakha` do for their own reveals.
 */
export function buildKumbhakarna(skin = null) {
  const c = skin || {
    skin: P.kumbhaSkinDull, // opens groggy; `_wake` re-tints to `kumbhaSkin`
    dark: P.kumbhaSkinDark,
    wrap: P.kumbhaWrap,
    hair: P.kumbhaHair,
    club: P.kumbhaClub,
    clubDark: P.kumbhaClubDark,
    eye: P.kumbhaEye,
  };
  const root = new THREE.Group();
  const n = {};
  /** Every mesh wearing the skin colour, so `_wake` can re-tint in one pass. */
  n.skinMeshes = [];
  const flesh = (g) => {
    n.skinMeshes.push(g.userData.mesh);
    return g;
  };

  const body = new THREE.Group();
  body.position.y = 1.9;
  root.add(body);
  n.body = body;
  /** `_animate`'s idle-bob baseline, read back rather than re-derived. */
  n.baseY = body.position.y;

  // The trunk: mountain-like, per the source's own word for him. Wide and
  // deep, and unlike Bakasura it is a chest rather than a belly — he is a
  // giant, not a glutton, and the two must not read as the same build scaled.
  const torso = flesh(trunk(1.5, 1.5, 1.4, c.skin, { waist: 0.84, chest: 0.16, belly: 0.06, neck: 0.5, outline: 0.05, seg: 18 }));
  body.add(torso);
  n.torso = torso;

  // The wrap — minimal warrior garb, the only garment on him, and no jewelry
  // anywhere: the inverse of Bakasura's bone-heavy read, on purpose.
  const wrap = skirt(1.3, 1.24, 1.44, 1.38, 0.62, c.wrap, { folds: 9, fold: 0.05, outline: 0.034, seg: 20 });
  wrap.position.y = 0.2;
  torso.add(wrap);
  const knot = ringed(
    [
      { y: 0.1, rx: 0.64, rz: 0.6, x: 0.02 },
      { y: 0.26, rx: 0.66, rz: 0.62, x: 0.03 },
    ],
    c.wrap,
    { seg: 18, outline: 0.03 }
  );
  torso.add(knot);

  const head = new THREE.Group();
  head.position.y = 1.46;
  torso.add(head);
  n.head = head;

  const face = flesh(skull(0.86, 0.84, 0.82, c.skin, { jaw: 0.9, snout: 0.05, outline: 0.04, seg: 18 }));
  head.add(face);
  n.skinMeshes.push(nose(face, 0.5, 0.16, c.skin, { jut: 0.07, r: 0.055, outline: 0.012 }).userData.mesh);

  // A heavy jaw, hung open a crack — a face caught mid-yawn is the whole
  // default character read his entry asks for. It sits forward of the face
  // so it breaks the skull's own outline.
  const jaw = flesh(
    barrel(
      [
        { x: -0.3, ry: 0.1, rz: 0.28, y: -0.12 },
        { x: -0.1, ry: 0.14, rz: 0.3, y: -0.14 },
        { x: 0.1, ry: 0.13, rz: 0.26, y: -0.14 },
        { x: 0.2, ry: 0.1, rz: 0.2, y: -0.12 },
      ],
      c.skin,
      { seg: 14, backX: -0.34, frontX: 0.24, outline: 0.028 }
    )
  );
  jaw.position.set(0.26, 0.26, 0);
  face.add(jaw);
  n.jaw = jaw;
  const mouth = decal(0.34, 0.1, 0x1a0c0a);
  onFront(face, mouth, 0.24, 0, 0.006);

  // Disheveled hair and beard — this is a man who has been asleep for a very
  // long time, and it is the only untidy thing on a rig that wears no
  // ornament at all: a matted crown, a mane down the back, and a beard that
  // frames the jaw rather than hanging into the chest below it.
  const crown = capOf(face, 0.5, c.hair, { grow: 1.1, back: 0.06, brow: 0.12, hairline: 0.66, wave: 0.12, waves: 9, outline: 0.03 });
  const mane = ringed(
    [
      { y: -0.3, rx: 0.12, rz: 0.36, x: -0.5, wave: 0.14, waves: 9 },
      { y: 0.0, rx: 0.2, rz: 0.42, x: -0.46, wave: 0.14, waves: 9 },
      { y: 0.36, rx: 0.26, rz: 0.44, x: -0.36 },
      { y: 0.66, rx: 0.24, rz: 0.4, x: -0.24 },
    ],
    c.hair,
    { seg: 16, bottomY: -0.42, topY: 0.74, outline: 0.03 }
  );
  mane.position.y = 0.3;
  face.add(mane);
  const beard = ringed(
    [
      { y: -0.24, rx: 0.14, rz: 0.36, x: 0.34, wave: 0.16, waves: 8 },
      { y: -0.08, rx: 0.2, rz: 0.46, x: 0.28, wave: 0.12, waves: 8 },
      { y: 0.12, rx: 0.2, rz: 0.44, x: 0.2 },
      { y: 0.3, rx: 0.12, rz: 0.4, x: 0.12 },
    ],
    c.hair,
    { seg: 16, bottomY: -0.32, topY: 0.36, outline: 0.03 }
  );
  beard.position.y = 0.16;
  face.add(beard);

  // Eyes and lids. The eye is the telegraph — the shared damage-signal amber,
  // per his entry — and the lid sitting over most of it is the groggy read.
  // `_wake` raises the lids; nothing else about the face moves.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const eye = decal(0.2, 0.12, c.eye, { opacity: 0.5 });
    onFront(face, eye, 0.52, side * 0.2, 0.01);
    n['eye' + key] = eye;

    const lid = flesh(blob(0.08, 0.1, 0.26, c.skin, { pivot: 'top', outline: 0.01 }));
    const f = frontOf(face.userData.mesh.geometry, 0.58, side * 0.2);
    lid.position.set(f.x + 0.01, 0.6, side * 0.2);
    lid.rotation.y = f.yaw - Math.PI / 2;
    face.add(lid);
    n['lid' + key] = lid;
    const brow = decal(0.26, 0.05, c.hair);
    onFront(face, brow, 0.64, side * 0.2, 0.012);
    brow.rotation.z = side * 0.18;
  }

  // Arms. The club is carried in the far arm; the near arm hangs — a
  // two-handed grip would hide the weapon behind the body at this scale, and
  // the club is the silhouette's whole second half.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.08, 1.24, side * 0.84);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = flesh(limb(0.54, 0.86, 0.54, c.skin, { taper: 0.84, bulge: 0.12, outline: 0.036 }));
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.86;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = flesh(limb(0.48, 0.8, 0.48, c.skin, { taper: 0.8, bulge: 0.14, outline: 0.034 }));
    elbow.add(fore);

    const hand = flesh(mitt(0.44, 0.42, 0.42, c.skin, { side, outline: 0.03 }));
    hand.position.y = -0.8;
    elbow.add(hand);
    n['hand' + key] = hand;
  }

  // The uprooted tree. Settles his entry's open "bare hands or a club"
  // question in favour of the club — bare hands would leave him sharing both
  // Bakasura's `Enemy` skeleton and Bakasura's unarmed identity, and the
  // wielded weapon is what keeps the two giants apart at the kit level.
  //
  // Pivoting from the grip, laid along +X like the Lanka soldier's spear, so
  // the animator swings the whole length from one node.
  const club = new THREE.Group();
  club.position.set(0.1, -0.9, 0);
  n.elbowR.add(club);
  n.club = club;

  const trunkGroup = new THREE.Group();
  trunkGroup.rotation.z = -Math.PI / 2; // along +X, same as the soldier's haft
  club.add(trunkGroup);
  // A knotted bole that thickens toward the root end, not a turned handle.
  const bole = tube(
    [
      [0, -0.5, 0, 0.13],
      [0.02, 0.2, 0.01, 0.16],
      [-0.02, 0.8, -0.01, 0.15],
      [0.03, 1.3, 0.02, 0.19],
      [-0.02, 1.8, 0, 0.22],
      [0.0, 2.2, 0, 0.3],
    ],
    c.club,
    { seg: 10, outline: 0.03 }
  );
  trunkGroup.add(bole);
  // The head end: still carrying its root ball and its roots.
  const knot2 = blob(0.66, 0.6, 0.62, c.clubDark, { outline: 0.032, p: 2.2 });
  knot2.position.y = 2.3;
  trunkGroup.add(knot2);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const root_ = tube(
      [
        [Math.cos(a) * 0.2, 2.45, Math.sin(a) * 0.2, 0.09],
        [Math.cos(a) * 0.42, 2.62, Math.sin(a) * 0.42, 0.06],
        [Math.cos(a) * 0.52, 2.86, Math.sin(a) * 0.5, 0.03],
        [Math.cos(a) * 0.5, 3.02, Math.sin(a) * 0.48, 0.005],
      ],
      c.clubDark,
      { seg: 6, outline: 0.014 }
    );
    trunkGroup.add(root_);
  }

  // Legs — heavy columns. Nothing here is built for speed, and the fight is
  // written around that.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.5);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = flesh(limb(0.64, 1.0, 0.64, c.skin, { taper: 0.84, bulge: 0.08, outline: 0.04 }));
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -1.0;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = flesh(limb(0.56, 0.86, 0.56, c.skin, { taper: 0.8, bulge: 0.12, bulgeAt: 0.25, outline: 0.036 }));
    knee.add(shin);

    const foot = boot(0.7, 0.22, 0.52, c.dark, { toe: 0.4, outline: 0.026 });
    foot.position.set(0.1, -0.86, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Kaikeyi — gate 5's tier-0 figure (no Enemy/Boss ancestry, see figure.js)
// ---------------------------------------------------------------------------

/**
 * A grieving human queen, not a monster — the roster's first tier-0 build
 * (`docs/agents/villain-handoff.md`). Scale sits close to the hunter's own
 * (`hw ≈ 0.36, hh ≈ 0.85` per the handoff) rather than either tyrant-king's
 * bulk: every oversized figure on the roster earns its size from being a
 * physical threat, and she never is. No weapon prop anywhere on the rig —
 * "she carries nothing because nothing in this encounter is a weapon."
 *
 * Exposes `head` and `body` on `userData.nodes` for `game/figure.js`'s
 * `Kaikeyi.posture()` to rotate; nothing here animates on its own.
 */
export function buildKaikeyi() {
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.62;
  root.add(body);
  n.body = body;

  const robe = trunk(0.3, 0.62, 0.3, P.kaikeyiRobe, { waist: 0.72, chest: 0.08, taper: 0.9, outline: 0.026 });
  body.add(robe);
  n.robe = robe;

  // A bridal/coronation hem, heavier and more layered than Shakuni's plain
  // skirt — dressed for the day the boons were granted, not for court
  // business: two tiers, the lower one pleated and pooling at the floor.
  const hem = skirt(0.3, 0.3, 0.48, 0.46, 0.64, P.kaikeyiRobeDark, { folds: 10, fold: 0.05, outline: 0.024 });
  hem.position.y = 0.04;
  robe.add(hem);
  const overskirt = skirt(0.3, 0.3, 0.42, 0.4, 0.36, P.kaikeyiRobe, { folds: 7, fold: 0.06, outline: 0.02 });
  overskirt.position.y = 0.06;
  robe.add(overskirt);
  // The overskirt's gold border, pleated with it so it reads as one hem.
  const border = ringed(
    [
      { y: -0.37, rx: 0.214, rz: 0.204, wave: 0.06, waves: 7 },
      { y: -0.33, rx: 0.21, rz: 0.2, wave: 0.055, waves: 7 },
    ],
    P.kaikeyiGold,
    { seg: 18, outline: 0.01 }
  );
  border.position.y = 0.06;
  robe.add(border);

  // The cascading multi-strand gold coin-necklace reaching the waist — the
  // handoff's own differentiator from Shurpanakha's simpler gold jewelry.
  for (let i = 0; i < 3; i++) {
    const len = 0.5 - i * 0.06;
    const z = (i - 1) * 0.05;
    const strand = tube(
      [
        [0.08, 0.56, z * 2.2, 0.012],
        [0.16, 0.46, z * 1.2, 0.012],
        [0.17, 0.56 - len * 0.7, z, 0.012],
        [0.165, 0.56 - len, z * 0.8, 0.01],
      ],
      P.kaikeyiGold,
      { seg: 5, outline: 0.006 }
    );
    robe.add(strand);
  }

  const sash = ringed(
    [
      { y: 0.17, rx: 0.12, rz: 0.12 },
      { y: 0.23, rx: 0.125, rz: 0.124 },
    ],
    P.kaikeyiGold,
    { seg: 14, outline: 0.014 }
  );
  robe.add(sash);

  const head = new THREE.Group();
  head.position.y = 0.52;
  robe.add(head);
  n.head = head;

  const neck = limb(0.08, 0.1, 0.08, P.kaikeyiSkin, { taper: 1.1, bulge: 0, outline: 0.01, up: true });
  neck.position.y = -0.06;
  head.add(neck);
  const face = skull(0.19, 0.23, 0.18, P.kaikeyiSkin, { jaw: 0.6, outline: 0.018 });
  head.add(face);
  nose(face, 0.13, 0.045, P.kaikeyiSkin, { jut: 0.016, r: 0.011 });

  // Loose, wavy hair under the veil — Shurpanakha's own hair is bound and
  // ornate under her headdress, a concrete, checkable difference rather
  // than a mood contrast.
  capOf(face, 0.1, P.kaikeyiHair, { grow: 1.08, back: 0.01, brow: 0.045, hairline: 0.145, wave: 0.06 });
  const hair = ringed(
    [
      { y: -0.26, rx: 0.05, rz: 0.1, x: -0.09, wave: 0.1, waves: 6 },
      { y: -0.1, rx: 0.07, rz: 0.11, x: -0.08, wave: 0.08, waves: 6 },
      { y: 0.08, rx: 0.08, rz: 0.11, x: -0.06 },
      { y: 0.18, rx: 0.06, rz: 0.09, x: -0.05 },
    ],
    P.kaikeyiHair,
    { seg: 12, bottomY: -0.32, topY: 0.22, outline: 0.014 }
  );
  head.add(hair);

  // The veil, over the hair rather than the face — ceremonial, not
  // concealing: a drape from the crown down the back to the shoulders.
  const veil = ringed(
    [
      { y: -0.2, rx: 0.07, rz: 0.15, x: -0.1 },
      { y: -0.06, rx: 0.09, rz: 0.15, x: -0.09 },
      { y: 0.1, rx: 0.1, rz: 0.13, x: -0.06 },
      { y: 0.22, rx: 0.09, rz: 0.105, x: -0.03 },
      { y: 0.26, rx: 0.06, rz: 0.07, x: -0.03 },
    ],
    P.kaikeyiRobeDark,
    { seg: 14, bottomY: -0.24, topY: 0.275, outline: 0.016 }
  );
  head.add(veil);

  // The paisley crown and its single teardrop ruby, distinct from
  // Duryodhana's tiered jeweled crown and Ravana's ten-head arc.
  const crown = ringed(
    [
      { y: 0.17, rx: 0.1, rz: 0.1, x: -0.004 },
      { y: 0.2, rx: 0.104, rz: 0.104, x: -0.004 },
      { y: 0.24, rx: 0.07, rz: 0.08, x: 0.0, wave: 0.2, waves: 5 },
      { y: 0.28, rx: 0.03, rz: 0.03, x: 0.02 },
    ],
    P.kaikeyiGold,
    { seg: 15, bottomY: 0.17, topY: 0.3, outline: 0.012 }
  );
  head.add(crown);
  const ruby = decal(0.035, 0.05, P.crimson);
  onFront(face, ruby, 0.19, 0, 0.012);

  // A large gold nose ring (nath) — unclaimed elsewhere on the roster.
  const f = frontOf(face.userData.mesh.geometry, 0.1, 0.03);
  const nath = shaped(tor(0.015, 0.004, 4, 12), P.kaikeyiGold, { outline: 0.003 });
  nath.position.set(f.x + 0.012, 0.085, 0.03);
  nath.rotation.y = Math.PI / 2 - 0.3;
  face.add(nath);

  // Heavy kohl — "an expression that reads as weighted rather than
  // triumphant or cruel," the reference's own read.
  for (const side of [-1, 1]) {
    const eye = decal(0.042, 0.02, P.outline);
    onFront(face, eye, 0.135, side * 0.042, 0.004);
    eye.rotation.z = side * 0.1;
  }

  // Arms, clasped and empty.
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.42, side * 0.14);
    robe.add(shoulder);

    const upper = limb(0.085, 0.22, 0.085, P.kaikeyiRobe, { taper: 0.84, bulge: 0.02, outline: 0.014 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.22;
    shoulder.add(elbow);

    const fore = limb(0.07, 0.2, 0.07, P.kaikeyiSkin, { taper: 0.78, bulge: 0.03, outline: 0.012 });
    elbow.add(fore);
    const bangle = shaped(tor(0.034, 0.009, 4, 12), P.kaikeyiGold, { outline: 0.005 });
    bangle.rotation.x = Math.PI / 2;
    bangle.position.y = -0.17;
    elbow.add(bangle);

    const hand = mitt(0.065, 0.08, 0.07, P.kaikeyiSkin, { side, fist: false, outline: 0.01 });
    hand.position.y = -0.2;
    elbow.add(hand);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------

export function buildGuardian() {
  const root = new THREE.Group();
  const n = {};

  const hips = new THREE.Group();
  hips.position.y = 1.72;
  root.add(hips);
  n.hips = hips;

  const torso = part(0.86, 1.16, 1.10, P.bossPlate, { pivot: 'bottom', outline: 0.05 });
  hips.add(torso);
  n.torso = torso;

  // The core. Its brightness is the fight's health readout, and the animator
  // flares it during the wind-up of every attack — the whole telegraph.
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.30, 1), glowMaterial({ color: P.bossCore }));
  core.position.set(0.46, 0.72, 0);
  torso.add(core);
  n.core = core;

  const coreGlow = decal(0.9, 0.9, P.bossCore, { opacity: 0.4 });
  coreGlow.position.set(0.47, 0.72, 0);
  coreGlow.rotation.y = Math.PI / 2;
  torso.add(coreGlow);
  n.coreGlow = coreGlow;

  // Cracks radiating from the core, in the plate itself.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const crack = decal(0.05, 0.44 + Math.random() * 0.3, P.violetDeep);
    crack.position.set(0.44, 0.72 + Math.sin(a) * 0.3, Math.cos(a) * 0.3);
    crack.rotation.set(0, Math.PI / 2, a);
    torso.add(crack);
  }

  const head = new THREE.Group();
  head.position.y = 1.16;
  torso.add(head);
  n.head = head;

  const skull = part(0.56, 0.48, 0.60, P.bossPlateDark, { pivot: 'bottom', outline: 0.04 });
  head.add(skull);

  // A blank faceplate with one slit — no eyes, which is more unsettling.
  const slit = decal(0.06, 0.34, P.bossCore);
  slit.position.set(0.30, 0.24, 0);
  slit.rotation.set(0, Math.PI / 2, Math.PI / 2);
  head.add(slit);
  n.slit = slit;

  for (const side of [-1, 1]) {
    const horn = part(0.12, 0.62, 0.12, P.bossHorn, { pivot: 'bottom', outline: 0.03 });
    horn.position.set(-0.10, 0.40, side * 0.22);
    horn.rotation.z = 0.42;
    horn.rotation.x = side * 0.28;
    head.add(horn);
  }

  // Arms — deliberately oversized. The silhouette should read "this hits hard"
  // before it ever does.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 1.0, side * 0.62);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = part(0.52, 0.36, 0.44, P.bossPlate, { outline: 0.04 });
    pauldron.position.y = 0.06;
    shoulder.add(pauldron);

    const upper = part(0.30, 0.62, 0.30, P.bossPlateDark, { pivot: 'top', outline: 0.032 });
    upper.position.y = -0.12;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.72;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.36, 0.60, 0.36, P.bossPlate, { pivot: 'top', outline: 0.032 });
    elbow.add(fore);

    const fist = part(0.46, 0.42, 0.46, P.bossPlateDark, { pivot: 'top', outline: 0.036 });
    fist.position.y = -0.60;
    elbow.add(fist);
    n['fist' + key] = fist;

    const knuckle = decal(0.34, 0.34, P.bossCore, { opacity: 0.85 });
    knuckle.position.set(0.24, -0.80, 0);
    knuckle.rotation.y = Math.PI / 2;
    elbow.add(knuckle);
    n['knuckle' + key] = knuckle;
  }

  // Legs.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.32);
    hips.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.36, 0.86, 0.40, P.bossPlateDark, { pivot: 'top', outline: 0.034 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.86;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.32, 0.78, 0.34, P.bossPlate, { pivot: 'top', outline: 0.032 });
    knee.add(shin);

    const foot = part(0.60, 0.20, 0.44, P.bossPlateDark, { pivot: 'top', outline: 0.03 });
    foot.position.set(0.10, -0.78, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Goru-Mukh — gate 3's Warden
// ---------------------------------------------------------------------------

/**
 * The Ox-Headed. Broader than the Dwar-Rakshak, with a snout and a pair of
 * forward-curving horns rather than the Guardian's short ones — the
 * silhouette has to read "ox" from across the arena. Naraka's iron and
 * red-black in place of the Guardian's violet plate, and its own flare: a
 * branded seal in the chest, ember rather than violet, so the two boss
 * fights don't blur into one even though the rig underneath borrows the same
 * joints.
 */
export function buildGoruMukh() {
  const root = new THREE.Group();
  const n = {};

  const hips = new THREE.Group();
  hips.position.y = 1.68;
  root.add(hips);
  n.hips = hips;

  const torso = part(1.0, 1.14, 1.16, P.narakaIron, { pivot: 'bottom', outline: 0.05 });
  hips.add(torso);
  n.torso = torso;

  // The branded seal — Naraka's processing mark, the ember that flares before
  // it commits. Same telegraph vocabulary as the Dwar-Rakshak's core, read
  // off a different object.
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), glowMaterial({ color: P.narakaCore }));
  core.position.set(0.50, 0.70, 0);
  torso.add(core);
  n.core = core;

  const coreGlow = decal(0.86, 0.86, P.narakaCore, { opacity: 0.4 });
  coreGlow.position.set(0.51, 0.70, 0);
  coreGlow.rotation.y = Math.PI / 2;
  torso.add(coreGlow);
  n.coreGlow = coreGlow;

  const head = new THREE.Group();
  head.position.y = 1.14;
  torso.add(head);
  n.head = head;

  const skull = part(0.62, 0.46, 0.66, P.narakaIronDark, { pivot: 'bottom', outline: 0.04 });
  head.add(skull);

  // The snout: a box extending past the skull on +X, which is what makes the
  // silhouette read "ox" rather than "helmed" at a glance.
  const snout = part(0.30, 0.24, 0.34, P.narakaIronDark, { outline: 0.03 });
  snout.position.set(0.42, -0.08, 0);
  head.add(snout);

  for (const side of [-1, 1]) {
    const eye = decal(0.07, 0.05, P.narakaCore);
    eye.position.set(0.32, 0.10, side * 0.14);
    eye.rotation.y = Math.PI / 2;
    head.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  // Horns — bigger and forward-curving, unlike the Dwar-Rakshak's short pair.
  for (const side of [-1, 1]) {
    const horn = part(0.14, 0.74, 0.14, P.narakaHorn, { pivot: 'bottom', outline: 0.03 });
    horn.position.set(0.10, 0.32, side * 0.30);
    horn.rotation.z = 0.30;
    horn.rotation.x = side * 0.5;
    head.add(horn);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 1.0, side * 0.66);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = part(0.54, 0.36, 0.46, P.narakaIron, { outline: 0.04 });
    pauldron.position.y = 0.06;
    shoulder.add(pauldron);

    const upper = part(0.32, 0.62, 0.32, P.narakaIronDark, { pivot: 'top', outline: 0.032 });
    upper.position.y = -0.12;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.72;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.38, 0.60, 0.38, P.narakaIron, { pivot: 'top', outline: 0.032 });
    elbow.add(fore);

    const fist = part(0.48, 0.42, 0.48, P.narakaIronDark, { pivot: 'top', outline: 0.036 });
    fist.position.y = -0.60;
    elbow.add(fist);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.34);
    hips.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.38, 0.86, 0.42, P.narakaIronDark, { pivot: 'top', outline: 0.034 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.86;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.34, 0.78, 0.36, P.narakaIron, { pivot: 'top', outline: 0.032 });
    knee.add(shin);

    const foot = part(0.62, 0.20, 0.46, P.narakaIronDark, { pivot: 'top', outline: 0.03 });
    foot.position.set(0.10, -0.78, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Hakim — gate 6's Warden
// ---------------------------------------------------------------------------

/**
 * The Magistrate. Brass and bone in place of the Dwar-Rakshak's violet plate
 * or the Goru-Mukh's iron — Manav-lok reads as home, so its judge has to look
 * like an official rather than a monster at first glance. No horns: in their
 * place a judge's tall headdress, and a pair of floating seal-tablets at the
 * shoulders standing in for the Guardian's pauldrons — the same "flare before
 * it commits" vocabulary read off objects that belong to a court rather than
 * a beast. `hakimSick` marks the one wrong note, a thin band on the
 * headdress that doesn't belong on anything else in the rig.
 */
export function buildHakim() {
  const root = new THREE.Group();
  const n = {};

  const hips = new THREE.Group();
  hips.position.y = 1.7;
  root.add(hips);
  n.hips = hips;

  const torso = part(0.92, 1.18, 1.08, P.manavPlate, { pivot: 'bottom', outline: 0.05 });
  hips.add(torso);
  n.torso = torso;

  // The seal of judgment — the same telegraph vocabulary as the Dwar-Rakshak's
  // core and the Goru-Mukh's brand, read off a magistrate's own emblem.
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.29, 1), glowMaterial({ color: P.manavCore }));
  core.position.set(0.48, 0.74, 0);
  torso.add(core);
  n.core = core;

  const coreGlow = decal(0.88, 0.88, P.manavCore, { opacity: 0.4 });
  coreGlow.position.set(0.49, 0.74, 0);
  coreGlow.rotation.y = Math.PI / 2;
  torso.add(coreGlow);
  n.coreGlow = coreGlow;

  const head = new THREE.Group();
  head.position.y = 1.18;
  torso.add(head);
  n.head = head;

  const skull = part(0.5, 0.44, 0.54, P.manavPlateDark, { pivot: 'bottom', outline: 0.04 });
  head.add(skull);

  // The judge's headdress in place of horns — tall, brass, with the one wrong
  // stripe running up it.
  const headdress = part(0.4, 0.5, 0.36, P.manavAccent, { pivot: 'bottom', outline: 0.03 });
  headdress.position.y = 0.44;
  head.add(headdress);
  const sickBand = decal(0.07, 0.46, P.hakimSick);
  sickBand.position.set(0.19, 0.68, 0);
  sickBand.rotation.set(0, Math.PI / 2, Math.PI / 2);
  head.add(sickBand);

  for (const side of [-1, 1]) {
    const seal = decal(0.07, 0.05, P.manavCore);
    seal.position.set(0.30, 0.10, side * 0.14);
    seal.rotation.y = Math.PI / 2;
    head.add(seal);
    n[side < 0 ? 'sealL' : 'sealR'] = seal;
  }

  // A pair of floating seal-tablets at the shoulders — the Guardian's
  // pauldrons and the Goru-Mukh's horns both read as "this hits hard" from
  // the silhouette; a magistrate's read the same way as "this rules on you".
  for (const side of [-1, 1]) {
    const tablet = part(0.1, 0.5, 0.34, P.manavAccent, { pivot: 'bottom', outline: 0.03 });
    tablet.position.set(-0.1, 0.30, side * 0.42);
    tablet.rotation.z = side * 0.18;
    head.add(tablet);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 1.0, side * 0.64);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = part(0.52, 0.36, 0.44, P.manavPlate, { outline: 0.04 });
    pauldron.position.y = 0.06;
    shoulder.add(pauldron);

    const upper = part(0.31, 0.62, 0.31, P.manavPlateDark, { pivot: 'top', outline: 0.032 });
    upper.position.y = -0.12;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.72;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.37, 0.60, 0.37, P.manavPlate, { pivot: 'top', outline: 0.032 });
    elbow.add(fore);

    const fist = part(0.47, 0.42, 0.47, P.manavPlateDark, { pivot: 'top', outline: 0.036 });
    fist.position.y = -0.60;
    elbow.add(fist);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.33);
    hips.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.37, 0.86, 0.41, P.manavPlateDark, { pivot: 'top', outline: 0.034 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.86;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.33, 0.78, 0.35, P.manavPlate, { pivot: 'top', outline: 0.032 });
    knee.add(shin);

    const foot = part(0.61, 0.20, 0.45, P.manavPlateDark, { pivot: 'top', outline: 0.03 });
    foot.position.set(0.10, -0.78, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

export function buildChiranjivi() {
  const root = new THREE.Group();
  const n = {};

  const hips = new THREE.Group();
  hips.position.y = 1.72;
  root.add(hips);
  n.hips = hips;

  const torso = part(0.9, 1.2, 1.06, P.devaPlate, { pivot: 'bottom', outline: 0.05 });
  hips.add(torso);
  n.torso = torso;

  // The Long-Lived's core — the same "an attack is announced before it
  // lands" vocabulary every prior boss's core or seal taught, read off a
  // deva's own radiance.
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), glowMaterial({ color: P.devaCore }));
  core.position.set(0.48, 0.76, 0);
  torso.add(core);
  n.core = core;

  const coreGlow = decal(0.9, 0.9, P.devaCore, { opacity: 0.4 });
  coreGlow.position.set(0.49, 0.76, 0);
  coreGlow.rotation.y = Math.PI / 2;
  torso.add(coreGlow);
  n.coreGlow = coreGlow;

  const head = new THREE.Group();
  head.position.y = 1.2;
  torso.add(head);
  n.head = head;

  const skull = part(0.48, 0.44, 0.52, P.devaPlateDark, { pivot: 'bottom', outline: 0.04 });
  head.add(skull);

  // A crown of light in place of the Goru-Mukh's horns and the Hakim's
  // headdress — a deva that is fading rather than one that rules.
  const crown = part(0.36, 0.42, 0.34, P.devaGold, { pivot: 'bottom', outline: 0.03 });
  crown.position.y = 0.42;
  head.add(crown);

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const aura = decal(0.08, 0.06, P.devaCore);
    aura.position.set(0.28, 0.08, side * 0.14);
    aura.rotation.y = Math.PI / 2;
    head.add(aura);
    n['aura' + key] = aura;
  }

  // A pair of folded wings at the shoulders, in place of the Hakim's
  // floating seal-tablets — the silhouette a deva reads as from a distance.
  for (const side of [-1, 1]) {
    const wing = part(0.08, 0.62, 0.5, P.devaWing, { pivot: 'bottom', outline: 0.03 });
    wing.position.set(-0.15, 0.28, side * 0.5);
    wing.rotation.z = side * 0.24;
    head.add(wing);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 1.0, side * 0.64);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = part(0.52, 0.36, 0.44, P.devaPlate, { outline: 0.04 });
    pauldron.position.y = 0.06;
    shoulder.add(pauldron);

    const upper = part(0.31, 0.62, 0.31, P.devaPlateDark, { pivot: 'top', outline: 0.032 });
    upper.position.y = -0.12;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.72;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.37, 0.60, 0.37, P.devaPlate, { pivot: 'top', outline: 0.032 });
    elbow.add(fore);

    const fist = part(0.47, 0.42, 0.47, P.devaPlateDark, { pivot: 'top', outline: 0.036 });
    fist.position.y = -0.60;
    elbow.add(fist);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.33);
    hips.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.37, 0.86, 0.41, P.devaPlateDark, { pivot: 'top', outline: 0.034 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.86;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.33, 0.78, 0.35, P.devaPlate, { pivot: 'top', outline: 0.032 });
    knee.add(shin);

    const foot = part(0.61, 0.20, 0.45, P.devaPlateDark, { pivot: 'top', outline: 0.03 });
    foot.position.set(0.10, -0.78, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

export function buildMaunAnkur() {
  const root = new THREE.Group();
  const n = {};

  const hips = new THREE.Group();
  hips.position.y = 1.74;
  root.add(hips);
  n.hips = hips;

  const torso = part(0.92, 1.22, 1.08, P.wheelPlate, { pivot: 'bottom', outline: 0.05 });
  hips.add(torso);
  n.torso = torso;

  // What Grew In The Stillness's core — the same "an attack is announced
  // before it lands" vocabulary every prior boss's core or seal taught, read
  // off the accumulation the empty ninth throne left behind.
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.31, 1), glowMaterial({ color: P.wheelCore }));
  core.position.set(0.49, 0.78, 0);
  torso.add(core);
  n.core = core;

  const coreGlow = decal(0.94, 0.94, P.wheelCore, { opacity: 0.4 });
  coreGlow.position.set(0.50, 0.78, 0);
  coreGlow.rotation.y = Math.PI / 2;
  torso.add(coreGlow);
  n.coreGlow = coreGlow;

  const head = new THREE.Group();
  head.position.y = 1.22;
  torso.add(head);
  n.head = head;

  const skull = part(0.49, 0.45, 0.53, P.wheelPlateDark, { pivot: 'bottom', outline: 0.04 });
  head.add(skull);

  // A crown of tangled growth in place of the Hakim's headdress and the
  // Chiranjivi's crown of light — this Warden is what nine gates of unjudged
  // backlog grew into left alone, not a rank or an office.
  const crown = part(0.38, 0.44, 0.36, P.wheelBloom, { pivot: 'bottom', outline: 0.03 });
  crown.position.y = 0.44;
  head.add(crown);

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const aura = decal(0.09, 0.07, P.wheelCore);
    aura.position.set(0.29, 0.08, side * 0.14);
    aura.rotation.y = Math.PI / 2;
    head.add(aura);
    n['aura' + key] = aura;
  }

  // A broken ring at the shoulders in place of the Chiranjivi's wings — the
  // Wheel itself, seized rather than turning, the silhouette this Warden
  // reads as from a distance.
  for (const side of [-1, 1]) {
    const spoke = part(0.09, 0.64, 0.52, P.wheelPlateDark, { pivot: 'bottom', outline: 0.03 });
    spoke.position.set(-0.15, 0.30, side * 0.52);
    spoke.rotation.z = side * 0.3;
    head.add(spoke);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 1.02, side * 0.66);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = part(0.53, 0.37, 0.45, P.wheelPlate, { outline: 0.04 });
    pauldron.position.y = 0.06;
    shoulder.add(pauldron);

    const upper = part(0.32, 0.63, 0.32, P.wheelPlateDark, { pivot: 'top', outline: 0.032 });
    upper.position.y = -0.12;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.73;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.38, 0.61, 0.38, P.wheelPlate, { pivot: 'top', outline: 0.032 });
    elbow.add(fore);

    const fist = part(0.48, 0.43, 0.48, P.wheelPlateDark, { pivot: 'top', outline: 0.036 });
    fist.position.y = -0.61;
    elbow.add(fist);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.34);
    hips.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.38, 0.87, 0.42, P.wheelPlateDark, { pivot: 'top', outline: 0.034 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.87;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.34, 0.79, 0.36, P.wheelPlate, { pivot: 'top', outline: 0.032 });
    knee.add(shin);

    const foot = part(0.62, 0.20, 0.46, P.wheelPlateDark, { pivot: 'top', outline: 0.03 });
    foot.position.set(0.10, -0.79, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Ravana — gate 8's boss, and Act 2's climax
// ---------------------------------------------------------------------------

/**
 * The ten-headed king, compressed.
 *
 * Two compressions carry this rig, both named in `docs/research/villain-roster.md`
 * and both spent on something functional rather than on saving geometry:
 *
 * **Heads.** Five, not ten — one main head with an arc of four fanned behind
 * it, the crown/fan arrangement temple art and Ravana Purnima effigies both
 * settle on. Only three are visible when the fight opens (`headC`, `headL1`,
 * `headR1`); `headL2`/`headR2` are built at zero scale and revealed by
 * `Ravana._enrage`. Each visible head owns a telegraph flare in `n.flares`,
 * and which head lights says which weapon is about to swing — the compression
 * is the tell, which is the one thing that keeps the extra heads from becoming
 * decoration the player stops reading after the first "ten heads" beat lands.
 *
 * **Arms.** Twenty is not buildable here either, so four are real weapon-arms
 * (`armSweep`/`armCharge`/`armVolley`/`armSlam`, each carrying its own prop
 * and each swung by the animator), the ordinary pair is kept for walking and
 * posing, and a fan of static stubs behind them implies the rest. The four
 * weapons are not one prop reskinned per attack: Chandrahas, trishul, chakra
 * and torch are four objects, each hanging off the arm that swings it, which
 * is what makes the twenty-arms motif mechanical rather than flavor.
 *
 * The skin is a warm bronze — see `lankaSkin` in `palette.js` for why it is
 * deliberately not blue and deliberately not an exotic monster tone.
 */
export function buildRavana() {
  const root = new THREE.Group();
  const n = {};
  /** The per-head telegraph flares, index 0 = the main head. See `Ravana._animate`. */
  n.flares = [];
  /** The two heads that do not exist until the threshold. See `Ravana._enrage`. */
  n.hiddenHeads = [];

  const hips = new THREE.Group();
  hips.position.y = 1.74;
  root.add(hips);
  n.hips = hips;

  const torso = trunk(0.98, 1.3, 1.1, P.lankaPlate, { waist: 0.8, chest: 0.12, p: 2.4, neck: 0.44, outline: 0.05, seg: 18 });
  hips.add(torso);
  n.torso = torso;

  // The vermillion drape: a dhoti from the waist, pleated, and a sash of the
  // same cloth wrapped from shoulder to hip — the one large non-gold mass on
  // him, and what stops the chest reading as a slab.
  const robe = skirt(0.86, 0.96, 1.04, 1.16, 0.9, P.lankaRobe, { folds: 10, fold: 0.05, outline: 0.03, seg: 22 });
  robe.position.y = 0.36;
  torso.add(robe);
  const sashPts = [];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const y = 0.72 + 0.34 * Math.sin(a);
    sashPts.push([Math.cos(a) * 0.5, y, Math.sin(a) * 0.56, 0.07]);
  }
  const sash = tube(sashPts, P.lankaRobe, { seg: 6, squash: 2.4, outline: 0.02 });
  torso.add(sash);

  // Heavy court gold at the collar and the belt: "richly adorned" is explicit
  // in his entry where it was not in Duryodhana's, and it is the ornament
  // rather than the scale that separates the two kings' silhouettes.
  const collar = ringed(
    [
      { y: 1.02, rx: 0.5, rz: 0.58, x: 0.02, wave: 0.07, waves: 12 },
      { y: 1.08, rx: 0.5, rz: 0.58, x: 0.02, wave: 0.05, waves: 12 },
      { y: 1.2, rx: 0.42, rz: 0.5, x: 0.0 },
      { y: 1.28, rx: 0.3, rz: 0.36, x: -0.02 },
    ],
    P.lankaPlateDark,
    { seg: 24, outline: 0.03 }
  );
  torso.add(collar);
  const belt = ringed(
    [
      { y: 0.02, rx: 0.42, rz: 0.47, p: 2.4 },
      { y: 0.1, rx: 0.44, rz: 0.49, p: 2.4 },
      { y: 0.2, rx: 0.42, rz: 0.47, p: 2.4 },
    ],
    P.lankaPlateDark,
    { seg: 18, outline: 0.03 }
  );
  torso.add(belt);

  // -- the head arc ---------------------------------------------------------

  // The neck sits above the collar and above every arm root below, which is
  // the whole reason the arc is legible: the first build put the weapon arms
  // level with it and the props swung straight across his face.
  const neck = new THREE.Group();
  neck.position.y = 1.4;
  torso.add(neck);
  n.head = neck;

  /**
   * One head: face, crown, moustache, eyes, and the flare decal that is this
   * head's own telegraph. `lateral` is the Z offset (paired limbs offset in
   * Z, not X — models face +X), `back` pulls the outer heads behind the main
   * one and `lift` raises them, so the arc reads as a fan from the
   * three-quarter angle the camera actually holds.
   */
  const buildHead = (scale, lateral, back, lift, tilt) => {
    const g = new THREE.Group();
    g.position.set(back, lift, lateral);
    g.rotation.z = tilt;
    g.scale.setScalar(scale);
    neck.add(g);

    const face = skull(0.5, 0.52, 0.5, P.lankaSkin, { jaw: 0.8, outline: 0.04, seg: 16 });
    g.add(face);
    nose(face, 0.29, 0.1, P.lankaSkin, { jut: 0.045, r: 0.032, outline: 0.01 });

    // A worn crown per head — ten crowned heads is what both anchor
    // references independently agree on, and an uncrowned head in the arc
    // would read as a severed one. A tiered mukuta rising to a finial.
    const crown = ringed(
      [
        { y: 0.36, rx: 0.24, rz: 0.26, x: -0.02, p: 2.4 },
        { y: 0.44, rx: 0.26, rz: 0.28, x: -0.02, p: 2.4 },
        { y: 0.46, rx: 0.22, rz: 0.24, x: -0.02, p: 2.4 },
        { y: 0.62, rx: 0.19, rz: 0.2, x: -0.03, p: 2.4 },
        { y: 0.64, rx: 0.15, rz: 0.16, x: -0.03, p: 2.4 },
        { y: 0.78, rx: 0.1, rz: 0.1, x: -0.04 },
        { y: 0.9, rx: 0.04, rz: 0.04, x: -0.05 },
      ],
      P.lankaPlate,
      { seg: 16, bottomY: 0.36, topY: 1.02, outline: 0.03 }
    );
    g.add(crown);
    const band = decal(0.12, 0.12, P.lankaCore);
    onFront(crown, band, 0.5, 0, 0.006);
    band.rotation.z = Math.PI / 4;

    // The jaw, hung a crack open — the head that bares its teeth before its
    // arm commits is the whole per-head telegraph.
    const jaw = barrel(
      [
        { x: -0.14, ry: 0.05, rz: 0.16, y: -0.04 },
        { x: 0.0, ry: 0.07, rz: 0.17, y: -0.05 },
        { x: 0.1, ry: 0.06, rz: 0.13, y: -0.05 },
      ],
      P.lankaSkinDark,
      { seg: 12, backX: -0.17, frontX: 0.14, outline: 0.02 }
    );
    jaw.position.set(0.15, 0.14, 0);
    g.add(jaw);

    for (const side of [-1, 1]) {
      const eye = decal(0.11, 0.06, P.lankaCore);
      onFront(face, eye, 0.3, side * 0.11, 0.006);
      eye.rotation.z = side * -0.2;
      const tache = tube(
        [
          [0.25, 0.2, side * 0.02, 0.022],
          [0.25, 0.18, side * 0.1, 0.026],
          [0.2, 0.2, side * 0.17, 0.016],
          [0.16, 0.25, side * 0.19, 0.004],
        ],
        0x2a1a10,
        { seg: 6, outline: 0.008 }
      );
      g.add(tache);
    }

    // The flare: a halo standing just off the face, driven per-head by the
    // animator. Its `base` is stripped out of the hit-flash bookkeeping in
    // `Ravana`'s constructor, or a sword swing would repaint every tell white.
    // Wider than the face and never opaque: at full strength a face-sized quad
    // stops reading as a glow and starts reading as a mask over the eyes, which
    // costs the tell the one thing it is for.
    const flare = decal(0.88, 0.88, P.lankaCore, { opacity: 0.0 });
    flare.position.set(0.34, 0.3, 0);
    flare.rotation.y = Math.PI / 2;
    g.add(flare);
    n.flares.push(flare);
    return g;
  };

  // The main head, then the arc: inner pair, then the outer pair that is not
  // there yet. Order matters — `n.flares[0]` is the main head's.
  n.headC = buildHead(1.0, 0, 0.04, 0, 0);
  n.headL1 = buildHead(0.78, -0.38, -0.36, 0.44, 0.3);
  n.headR1 = buildHead(0.78, 0.38, -0.36, 0.44, -0.3);
  n.headL2 = buildHead(0.6, -0.64, -0.76, 0.82, 0.58);
  n.headR2 = buildHead(0.6, 0.64, -0.76, 0.82, -0.58);
  for (const h of [n.headL2, n.headR2]) {
    h.userData.shownScale = h.scale.x;
    h.scale.setScalar(0.001);
    n.hiddenHeads.push(h);
  }

  // The backglow the remaining five heads are implied by: one halo behind the
  // whole arc, per the entry's "others implied by silhouette/backglow". Kept
  // small enough to sit behind the heads rather than to become a panel.
  const coreGlow = decal(1.4, 0.62, P.lankaCore, { opacity: 0.07 });
  coreGlow.position.set(-0.66, 0.5, 0);
  coreGlow.rotation.y = Math.PI / 2;
  neck.add(coreGlow);
  n.coreGlow = coreGlow;

  // `Boss`'s constructor skips exactly one node when it clones materials for
  // the hit-flash, and this is the name it looks for. The main head's flare
  // takes it; the other four are filtered out in `Ravana`'s constructor.
  n.core = n.flares[0];

  // -- arms -----------------------------------------------------------------

  // The ordinary pair: bare, ringed, and what the walk and the idle are posed
  // on. They carry nothing — every weapon hangs off a dedicated arm below.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(-0.04, 1.04, side * 0.64);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = blob(0.56, 0.34, 0.46, P.lankaPlate, { p: 2.8, pv: 2.2, outline: 0.04 });
    pauldron.position.set(0, 0.08, side * 0.04);
    pauldron.rotation.x = side * 0.3;
    shoulder.add(pauldron);

    const upper = limb(0.3, 0.7, 0.3, P.lankaSkin, { taper: 0.84, bulge: 0.12 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.7;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.28, 0.58, 0.28, P.lankaSkin, { taper: 0.8, bulge: 0.1 });
    elbow.add(fore);

    const band = ringed(
      [
        { y: -0.54, rx: 0.13, rz: 0.13 },
        { y: -0.44, rx: 0.145, rz: 0.145 },
      ],
      P.lankaPlateDark,
      { seg: 12, outline: 0.02 }
    );
    elbow.add(band);

    const fist = mitt(0.3, 0.3, 0.3, P.lankaSkinDark, { side, outline: 0.028 });
    fist.position.y = -0.58;
    elbow.add(fist);
  }

  /**
   * A weapon-arm: one shoulder group with an upper/forearm under it and its
   * prop hanging from the wrist. The animator swings whichever one the
   * committed attack belongs to and leaves the rest in the fan.
   *
   * Rotating `z` by +a swings the arm from hanging (-Y) toward forward (+X),
   * which is the whole vocabulary the pose table below is written in. Every
   * prop hangs *down* from the grip rather than being laid along +X: pointed
   * forward at rest they crossed his own face, which is exactly the "look at
   * the thing" failure `docs/agents/gate-build.md` warns a screenshot catches
   * and `?sim` never will.
   */
  const buildArm = (name, lateral, rest) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(-0.08, 0.92, lateral);
    shoulder.rotation.z = rest;
    torso.add(shoulder);
    n[name] = shoulder;
    /** The fanned pose the animator returns this arm to. Read, not re-derived. */
    shoulder.userData.rest = rest;

    const upper = limb(0.24, 0.52, 0.24, P.lankaSkin, { taper: 0.86, bulge: 0.1, outline: 0.026 });
    shoulder.add(upper);

    const cuff = ringed(
      [
        { y: -0.53, rx: 0.12, rz: 0.12 },
        { y: -0.43, rx: 0.13, rz: 0.13 },
      ],
      P.lankaPlateDark,
      { seg: 12, outline: 0.02 }
    );
    shoulder.add(cuff);

    const fore = limb(0.22, 0.5, 0.22, P.lankaSkin, { taper: 0.8, bulge: 0.08, outline: 0.026 });
    fore.position.y = -0.54;
    shoulder.add(fore);

    const hand = mitt(0.2, 0.2, 0.2, P.lankaSkinDark, { outline: 0.02 });
    hand.position.y = -1.0;
    shoulder.add(hand);

    const grip = new THREE.Group();
    grip.position.y = -1.04;
    shoulder.add(grip);
    return grip;
  };

  // Chandrahas — the curved sword, and the one signature both anchor
  // references carry. Cold moon-steel, on the near-camera side, because it is
  // the weapon the player has to recognise fastest. A true crescent now: a
  // thin blade widening toward the tip and sweeping back in Z as it falls.
  const swordGrip = buildArm('armSweep', -0.96, -0.35);
  {
    const hilt = limb(0.1, 0.24, 0.1, P.lankaPlateDark, { taper: 1, bulge: 0, outline: 0.02 });
    swordGrip.add(hilt);
    const guard = blob(0.16, 0.08, 0.34, P.lankaPlate, { outline: 0.022 });
    guard.position.y = -0.2;
    swordGrip.add(guard);
    const blade = ringed(
      [
        { y: -1.52, rx: 0.008, rz: 0.01, z: 0.36 },
        { y: -1.4, rx: 0.02, rz: 0.1, z: 0.26 },
        { y: -1.1, rx: 0.024, rz: 0.13, z: 0.14 },
        { y: -0.74, rx: 0.024, rz: 0.11, z: 0.05 },
        { y: -0.4, rx: 0.022, rz: 0.08, z: 0.0 },
        { y: -0.24, rx: 0.02, rz: 0.07, z: 0.0 },
      ],
      P.lankaSword,
      { seg: 10, bottomY: -1.56, topY: -0.22, outline: 0.018 }
    );
    swordGrip.add(blade);
  }

  // The trishul — the reach thrust. The longest prop on him, because this is
  // the weapon that closes distance, and the rest angle is what keeps its
  // prongs off the floor between attacks.
  const trishulGrip = buildArm('armCharge', 0.46, 0.8);
  {
    const haft = limb(0.09, 1.72, 0.09, P.lankaPlateDark, { taper: 0.9, bulge: 0, outline: 0.02 });
    trishulGrip.add(haft);
    const socket = blob(0.16, 0.12, 0.16, P.lankaPlate, { outline: 0.016 });
    socket.position.y = -1.72;
    trishulGrip.add(socket);
    const mid = tube(
      [
        [0, -1.72, 0, 0.05],
        [0, -2.0, 0, 0.04],
        [0, -2.26, 0, 0.004],
      ],
      P.lankaPlate,
      { seg: 6, outline: 0.016 }
    );
    trishulGrip.add(mid);
    for (const side of [-1, 1]) {
      const prong = tube(
        [
          [0, -1.74, side * 0.04, 0.04],
          [0, -1.82, side * 0.2, 0.036],
          [0, -1.98, side * 0.22, 0.03],
          [0, -2.12, side * 0.16, 0.004],
        ],
        P.lankaPlate,
        { seg: 6, outline: 0.016 }
      );
      trishulGrip.add(prong);
    }
  }

  // The chakra — thrown, so it is the one prop that has to read as a disc from
  // the side. A ring of eight spokes around a gold hub, held flat against the
  // camera so the throw is legible before it leaves his hand.
  const chakraGrip = buildArm('armVolley', -0.46, -0.5);
  {
    const hub = blob(0.2, 0.2, 0.08, P.lankaPlateDark, { outline: 0.022 });
    hub.position.y = -0.24;
    chakraGrip.add(hub);
    n.chakra = hub;
    const ring = shaped(tor(0.34, 0.045, 6, 28), P.lankaPlate, { outline: 0.016 });
    hub.add(ring);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const spoke = tube(
        [
          [Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0, 0.03],
          [Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0, 0.022],
        ],
        P.lankaPlate,
        { seg: 5, outline: 0.012 }
      );
      hub.add(spoke);
      const tooth = tube(
        [
          [Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0, 0.035],
          [Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0, 0.004],
        ],
        P.lankaPlate,
        { seg: 5, outline: 0.012 }
      );
      hub.add(tooth);
    }
    const rim = decal(0.72, 0.72, P.lankaCore, { opacity: 0.22 });
    rim.position.z = 0.06;
    hub.add(rim);
  }

  // The torch — the fourth weapon, replacing the miniature painting's hooked
  // mace on purpose: Duryodhana's entire signature *is* a gada, and a second
  // locked boss swinging one would dilute his one identity. The flame is
  // `lankaFlame`, kept out of the orange band so it never reads as the
  // hunter's own fire coming back at them.
  const torchGrip = buildArm('armSlam', 0.96, 0.55);
  {
    const haft = limb(0.11, 1.0, 0.11, P.lankaPlateDark, { taper: 0.9, bulge: 0, outline: 0.022 });
    torchGrip.add(haft);
    const bowl = ringed(
      [
        { y: -1.02, rx: 0.08, rz: 0.08 },
        { y: -1.1, rx: 0.15, rz: 0.15, wave: 0.1, waves: 8 },
        { y: -1.2, rx: 0.17, rz: 0.17, wave: 0.1, waves: 8 },
      ],
      P.lankaPlate,
      { seg: 16, outline: 0.024 }
    );
    torchGrip.add(bowl);
    // The flame hangs below the bowl at rest, and burns *away* from it — a
    // teardrop whose point trails, which is the shape fire takes when the
    // arm swings it.
    const fire = ringed(
      [
        { y: -1.62, rx: 0.01, rz: 0.01 },
        { y: -1.48, rx: 0.07, rz: 0.07, wave: 0.2, waves: 5 },
        { y: -1.32, rx: 0.13, rz: 0.13, wave: 0.12, waves: 5 },
        { y: -1.2, rx: 0.12, rz: 0.12 },
      ],
      P.lankaFlame,
      { seg: 12, bottomY: -1.66, topY: -1.16, outline: 0 }
    );
    torchGrip.add(fire);
    n.torchFire = fire;
    const fireGlow = decal(0.5, 0.6, P.lankaFlame, { opacity: 0.4 });
    fireGlow.position.y = -1.34;
    torchGrip.add(fireGlow);
    n.torchGlow = fireGlow;
  }

  // The remaining sixteen, implied: static stubs fanned *behind* the four that
  // work, compressed exactly the way the heads are. They never move, and they
  // sit at -X so they thicken the silhouette without joining the clutter in
  // front of him.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const stub = new THREE.Group();
      stub.position.set(-0.34, 0.86 - i * 0.22, side * (0.3 + i * 0.34));
      stub.rotation.z = -(0.6 + i * 0.4);
      torso.add(stub);
      const upper = limb(0.17, 0.46, 0.17, P.lankaSkinDark, { taper: 0.86, bulge: 0.08, outline: 0.022 });
      stub.add(upper);
      const fore = limb(0.15, 0.4, 0.15, P.lankaSkinDark, { taper: 0.8, bulge: 0.06, outline: 0.022 });
      fore.position.y = -0.46;
      fore.rotation.z = side * 0.4;
      stub.add(fore);
    }
  }

  // -- legs -----------------------------------------------------------------

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.34);
    hips.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.4, 0.88, 0.42, P.lankaPlateDark, { taper: 0.82, bulge: 0.08 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.88;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.34, 0.8, 0.36, P.lankaPlate, { taper: 0.82, bulge: 0.1, bulgeAt: 0.25, p: 2.4 });
    knee.add(shin);

    const foot = boot(0.64, 0.2, 0.44, P.lankaPlateDark, { toe: 0.36, outline: 0.03 });
    foot.position.set(0.1, -0.8, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Kamsa — gate 9's Warden
// ---------------------------------------------------------------------------

/**
 * An overbuilt human tyrant-king, not a monster, per
 * `docs/research/villain-roster.md`: `hw 0.58 / hh 1.05`, bulkier than any
 * other human-scale figure on the roster but well short of Kumbhakarna's
 * giant or the tier-3 cluster. Every ornament on him is the cell he kept
 * Devaki in, worn as regalia — he is the jailer, not the prisoner, and the
 * irony is the point his entry makes explicit:
 *
 * - a barred gorget collar (literal bar-shapes, not a smooth ruff),
 * - heavy shackle-cuffs at both wrists, worn unused,
 * - a chain drape looped from both pauldrons across the chest,
 * - an iron circlet-crown with bar-like spikes rather than gold/jewels.
 *
 * `mathuraIron` carries all four — the coldest, least "regal" material on
 * the roster, so the prison-iron reads as bolted onto the armour rather than
 * matching it. The mace's head is the same iron, a fused mass of
 * shackle-iron rather than a plain flanged weight, settling the entry's own
 * "mace or heavy sword" question in the mace's favour.
 */
export function buildKamsa(skin = null) {
  const c = skin || {
    plate: P.mathuraPlate,
    plateDark: P.mathuraPlateDark,
    iron: P.mathuraIron,
    skin: P.mathuraSkin,
    eye: P.amber,
  };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.92;
  root.add(body);
  n.body = body;
  n.baseY = body.position.y;

  const torso = trunk(0.6, 0.72, 0.54, c.plate, { waist: 0.86, chest: 0.1, belly: 0.06, p: 2.6, neck: 0.5, outline: 0.04 });
  body.add(torso);
  n.torso = torso;

  const belt = ringed(
    [
      { y: -0.02, rx: 0.27, rz: 0.245, p: 2.6 },
      { y: 0.06, rx: 0.28, rz: 0.25, p: 2.6 },
      { y: 0.13, rx: 0.27, rz: 0.245, p: 2.6 },
    ],
    c.plateDark,
    { seg: 16, outline: 0.026 }
  );
  torso.add(belt);
  const warDress = skirt(0.54, 0.5, 0.62, 0.58, 0.34, c.plateDark, { folds: 8, fold: 0.05, outline: 0.024 });
  warDress.position.y = 0.04;
  body.add(warDress);

  // The pauldrons, wide enough to anchor the chain drape strung between them.
  for (const side of [-1, 1]) {
    const pauldron = blob(0.26, 0.17, 0.26, c.plateDark, { p: 2.8, pv: 2.2, outline: 0.024 });
    pauldron.position.set(0.02, 0.62, side * 0.32);
    pauldron.rotation.x = side * 0.3;
    torso.add(pauldron);
  }

  // The barred gorget: a collar ring with bar-shapes standing proud of it,
  // read across the neck rather than smoothed into a ruff.
  const gorget = ringed(
    [
      { y: 0.62, rx: 0.17, rz: 0.2, p: 2.6 },
      { y: 0.7, rx: 0.18, rz: 0.21, p: 2.6 },
      { y: 0.76, rx: 0.15, rz: 0.17, p: 2.6 },
    ],
    c.iron,
    { seg: 16, outline: 0.022 }
  );
  torso.add(gorget);
  for (let i = -2; i <= 2; i++) {
    const a = i * 0.42;
    const bar = limb(0.04, 0.2, 0.04, c.iron, { taper: 1, bulge: 0, outline: 0.012, up: true });
    bar.position.set(Math.cos(a) * 0.17, 0.62, Math.sin(a) * 0.2);
    torso.add(bar);
  }

  // The chain drape: links strung from each pauldron down to the chest's
  // centre line — armour motif and, per his kit, the chain lash's own
  // weapon, doing double duty rather than sitting on the rig as decoration.
  // Carried on a group standing off the breastplate, because the animator
  // rattles each link about the x it was hung at.
  const chain = new THREE.Group();
  chain.position.x = 0.07;
  torso.add(chain);
  n.chainLinks = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const link = shaped(tor(0.038, 0.012, 5, 12), c.iron, { outline: 0.008 });
      const u = i / 2;
      link.position.set(0.28, 0.58 - u * 0.24 - Math.sin(u * Math.PI) * 0.04, side * (0.32 - u * 0.32));
      link.rotation.set(i % 2 ? Math.PI / 2 : 0, side * 0.6, 0);
      chain.add(link);
      n.chainLinks.push(link);
    }
  }

  const head = new THREE.Group();
  head.position.y = 0.86;
  torso.add(head);
  n.head = head;

  const neck = limb(0.16, 0.14, 0.16, c.skin, { taper: 1.05, bulge: 0, outline: 0.016, up: true });
  neck.position.y = -0.1;
  head.add(neck);
  const face = skull(0.32, 0.34, 0.3, c.skin, { jaw: 0.9, outline: 0.03 });
  head.add(face);
  nose(face, 0.19, 0.075, c.skin, { jut: 0.03, r: 0.02 });

  // A tyrant's face: a heavy brow, a thick moustache swept down into a
  // short beard along the jaw.
  for (const side of [-1, 1]) {
    const brow = decal(0.11, 0.03, 0x1a100a);
    onFront(face, brow, 0.22, side * 0.075, 0.005);
    brow.rotation.z = side * 0.3;
    const tache = tube(
      [
        [0.158, 0.13, side * 0.01, 0.018],
        [0.155, 0.12, side * 0.06, 0.02],
        [0.13, 0.08, side * 0.09, 0.014],
        [0.11, 0.04, side * 0.1, 0.004],
      ],
      0x1a100a,
      { seg: 6, outline: 0.006 }
    );
    face.add(tache);
  }
  const beard = ringed(
    [
      { y: -0.02, rx: 0.06, rz: 0.08, x: 0.11 },
      { y: 0.03, rx: 0.1, rz: 0.13, x: 0.07 },
      { y: 0.09, rx: 0.12, rz: 0.15, x: 0.04 },
    ],
    0x1a100a,
    { seg: 12, bottomY: -0.05, topY: 0.1, outline: 0.012 }
  );
  face.add(beard);

  // The iron circlet-crown, bar-spiked rather than gold and jewelled —
  // deliberately not competing with Duryodhana's or Ravana's opulence.
  const circlet = ringed(
    [
      { y: 0.26, rx: 0.16, rz: 0.155, x: -0.01 },
      { y: 0.32, rx: 0.165, rz: 0.16, x: -0.01 },
    ],
    c.iron,
    { seg: 16, outline: 0.018 }
  );
  face.add(circlet);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.38;
    const spike = limb(0.028, 0.12, 0.028, c.iron, { taper: 0.5, bulge: 0, outline: 0.008, up: true });
    spike.position.set(Math.cos(a) * 0.16 - 0.01, 0.31, Math.sin(a) * 0.155);
    face.add(spike);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const eye = decal(0.06, 0.034, c.eye, { opacity: 0.7 });
    onFront(face, eye, 0.18, side * 0.07, 0.005);
    n['eye' + key] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.02, 0.58, side * 0.34);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(0.2, 0.34, 0.2, c.skin, { taper: 0.84, bulge: 0.12 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.18, 0.32, 0.18, c.skin, { taper: 0.8, bulge: 0.1 });
    elbow.add(fore);

    const hand = mitt(0.16, 0.16, 0.16, c.skin, { side });
    hand.position.y = -0.32;
    elbow.add(hand);
    n['hand' + key] = hand;

    // The shackle-cuff, worn unused — the jailer wearing his own prisoners'
    // irons as regalia, with a broken link still hanging off it.
    const cuff = ringed(
      [
        { y: -0.28, rx: 0.09, rz: 0.09 },
        { y: -0.2, rx: 0.095, rz: 0.095 },
      ],
      c.iron,
      { seg: 12, outline: 0.014 }
    );
    elbow.add(cuff);
    const dangle = shaped(tor(0.034, 0.011, 5, 12), c.iron, { outline: 0.007 });
    dangle.position.set(0.05, -0.31, side * 0.06);
    dangle.rotation.y = Math.PI / 2;
    elbow.add(dangle);
  }

  // The mace, carried in the right hand: a fused mass of shackle-iron —
  // cuffs and chain-links hammered into the head — settling the entry's own
  // open "mace or heavy sword" question. Pivots from the grip, laid along
  // +X like Kumbhakarna's club and the Lanka soldier's spear.
  const mace = new THREE.Group();
  mace.position.set(0.06, -0.3, 0);
  n.elbowR.add(mace);
  n.mace = mace;

  const grip = new THREE.Group();
  grip.rotation.z = -Math.PI / 2;
  mace.add(grip);
  const shaft = limb(0.09, 1.5, 0.09, c.plateDark, { taper: 0.95, bulge: 0, outline: 0.018, up: true });
  shaft.position.y = -0.1;
  grip.add(shaft);

  const macehead = ringed(
    [
      { y: 1.3, rx: 0.08, rz: 0.08 },
      { y: 1.38, rx: 0.17, rz: 0.17, wave: 0.18, waves: 6 },
      { y: 1.5, rx: 0.2, rz: 0.2, wave: 0.18, waves: 6 },
      { y: 1.62, rx: 0.17, rz: 0.17, wave: 0.18, waves: 6 },
      { y: 1.7, rx: 0.08, rz: 0.08 },
    ],
    c.iron,
    { seg: 18, bottomY: 1.26, topY: 1.74, outline: 0.026 }
  );
  grip.add(macehead);
  // Cuffs and links, hammered into the head — the same shackle motif as the
  // wrists, spent again here rather than a new ornament.
  for (const side of [-1, 1]) {
    const stud = shaped(tor(0.06, 0.02, 5, 12), c.plateDark, { outline: 0.01 });
    stud.position.set(0, 1.5, side * 0.2);
    grip.add(stud);
  }
  const maceGlow = decal(0.5, 0.5, c.eye, { opacity: 0.4 });
  maceGlow.position.y = 1.5;
  maceGlow.rotation.y = Math.PI / 2;
  grip.add(maceGlow);
  n.maceGlow = maceGlow;

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.2);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.25, 0.4, 0.25, c.plateDark, { taper: 0.82, bulge: 0.08 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.21, 0.36, 0.21, c.plateDark, { taper: 0.8, bulge: 0.1, bulgeAt: 0.25 });
    knee.add(shin);

    const foot = boot(0.28, 0.1, 0.19, c.plateDark);
    foot.position.set(0.05, -0.36, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Mathura wrestler — gate 09's regular archetype, its own solo debut
// ---------------------------------------------------------------------------

/**
 * An akhada wrestler/grappler, per `docs/SPEC-CAMPAIGN.md` § Act 3: fast and
 * committal against Kamsa's own heavy, armoured kit. Extends `Charger`'s
 * chase → telegraph → charge → recover skeleton under a new biped
 * silhouette — the same `buildRig` escape hatch `Taraka` already takes,
 * reskinned here as a grapple-lunge rather than a claw-pounce.
 *
 * Bare-chested and unarmoured on purpose: nothing on this rig competes with
 * Kamsa's own jailer-iron regalia one encounter later, and the akhada's own
 * dress code is a loincloth and oiled skin, not court dress.
 */
export function buildMathuraWrestler(skin = null) {
  const c = skin || {
    skin: P.mathuraWrestlerSkin,
    dark: P.mathuraWrestlerSkinDark,
    cloth: P.mathuraWrestlerCloth,
    eye: P.mathuraWrestlerEye,
  };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.76;
  root.add(body);
  n.body = body;
  n.baseY = body.position.y;

  // A pehlwan's build: a barrel chest over a thick waist, all of it bare.
  const torso = trunk(0.38, 0.5, 0.34, c.skin, { waist: 0.9, chest: 0.16, belly: 0.12, outline: 0.028 });
  body.add(torso);
  n.torso = torso;

  const langot = ringed(
    [
      { y: -0.2, rx: 0.1, rz: 0.12 },
      { y: -0.12, rx: 0.16, rz: 0.17, x: 0.01 },
      { y: -0.02, rx: 0.19, rz: 0.17, x: 0.012 },
      { y: 0.06, rx: 0.185, rz: 0.165, x: 0.012 },
    ],
    c.cloth,
    { seg: 14, outline: 0.02, bottomY: -0.24 }
  );
  langot.position.y = 0.02;
  torso.add(langot);
  const knot = blob(0.07, 0.09, 0.08, c.cloth, { outline: 0.01 });
  knot.position.set(0.19, 0.03, 0.05);
  torso.add(knot);

  const head = new THREE.Group();
  head.position.y = 0.48;
  torso.add(head);
  n.head = head;

  const neck = limb(0.15, 0.08, 0.15, c.skin, { taper: 1.05, bulge: 0, outline: 0.016, up: true });
  neck.position.y = -0.03;
  head.add(neck);
  const face = skull(0.24, 0.25, 0.23, c.skin, { jaw: 0.86 });
  face.position.y = 0.02;
  head.add(face);
  nose(face, 0.14, 0.06, c.skin, { jut: 0.024, r: 0.016 });

  // Cropped topknot — akhada custom, and a silhouette tell distinct from
  // every other biped's own hair/headdress. And the moustache every akhada
  // champion wears, curled at the ends.
  const topknot = blob(0.09, 0.1, 0.09, c.dark, { outline: 0.012 });
  topknot.position.set(-0.03, 0.29, 0);
  head.add(topknot);
  for (const side of [-1, 1]) {
    const tache = tube(
      [
        [0.118, 0.1, side * 0.012, 0.014],
        [0.118, 0.092, side * 0.05, 0.016],
        [0.1, 0.1, side * 0.085, 0.011],
        [0.085, 0.125, side * 0.09, 0.004],
      ],
      c.dark,
      { seg: 6, outline: 0.006 }
    );
    face.add(tache);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const eye = decal(0.05, 0.028, c.eye, { opacity: 0.6 });
    onFront(face, eye, 0.14, side * 0.055, 0.004);
    n['eye' + key] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.04, 0.42, side * 0.22);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(0.15, 0.28, 0.15, c.skin, { taper: 0.82, bulge: 0.16, bulgeAt: 0.35 });
    shoulder.add(upper);

    // A wrestler's arm-band, akhada-plain — the roster's own note that
    // nothing here should compete with Kamsa's regalia.
    const band = ringed(
      [
        { y: -0.1, rx: 0.074, rz: 0.074 },
        { y: -0.06, rx: 0.076, rz: 0.076 },
      ],
      c.cloth,
      { seg: 10, outline: 0.008 }
    );
    upper.add(band);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.13, 0.26, 0.13, c.skin, { taper: 0.8, bulge: 0.14 });
    elbow.add(fore);

    const hand = mitt(0.12, 0.12, 0.12, c.skin, { side, fist: false });
    hand.position.y = -0.26;
    elbow.add(hand);
    n['hand' + key] = hand;

    // The grapple's telegraph flare — the shared damage-signal amber, on the
    // hands that do the actual grabbing.
    const glow = decal(0.16, 0.16, c.eye, { opacity: 0.4 });
    glow.position.set(0.08, -0.26, 0);
    glow.rotation.y = Math.PI / 2;
    elbow.add(glow);
    n['handGlow' + key] = glow;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.13);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.18, 0.34, 0.18, c.skin, { taper: 0.78, bulge: 0.12 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.34;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.15, 0.3, 0.15, c.skin, { taper: 0.66, bulge: 0.14, bulgeAt: 0.22 });
    knee.add(shin);

    const foot = boot(0.2, 0.08, 0.13, c.skin, { toe: 0.4 });
    foot.position.set(0.04, -0.3, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Putana — gate 10's Warden
// ---------------------------------------------------------------------------

/**
 * Both of Putana's rigs. Unlike Shurpanakha's disguise/reveal, which share
 * one silhouette at two scales (`s`), her entry gives the two forms
 * genuinely different proportions — human-scale disguise, "bloated/swollen"
 * true form — so each is built to its own absolute dimensions rather than
 * one shared skeleton scaled. The physics box stays fixed at construction
 * either way (`PUTANA.hw`/`hh`, read by `Enemy`'s constructor once): only
 * the visible rig and `this.n` move at the reveal, the same "kit and hitbox
 * never move" rule Shurpanakha's handoff already set.
 *
 * No feeding tableau anywhere in this rig, in either form — the source's
 * "milk" is abstracted into breath and touch from this geometry decision
 * onward, per her entry's respectful-treatment note.
 */
function buildPutanaForm(true_, c) {
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = true_ ? 0.86 : 0.7;
  root.add(body);
  n.body = body;
  n.baseY = body.position.y;

  const skin = true_ ? c.trueSkin : c.skin;
  const dark = true_ ? c.trueSkinDark : c.robeGold;

  // The true form reads bloated rather than tall — a rounder, heavier torso
  // on a shorter rise, so the size increase carries "poison filling her
  // body" instead of a fourth tall giant.
  const torso = true_
    ? trunk(0.5, 0.62, 0.48, skin, { waist: 1.0, chest: 0.04, belly: 0.3, neck: 0.46, outline: 0.034 })
    : trunk(0.32, 0.62, 0.3, skin, { waist: 0.7, chest: 0.1, taper: 0.9, outline: 0.026 });
  body.add(torso);
  n.torso = torso;

  if (!true_) {
    // The bold crimson-and-mustard striped drape, the folk-painting anchor:
    // a bodice band, a skirt to the shin with a gold border, and the end of
    // the drape thrown back over one shoulder.
    const drape = ringed(
      [
        { y: 0.2, rx: 0.14, rz: 0.14, x: 0.012 },
        { y: 0.34, rx: 0.155, rz: 0.15, x: 0.02 },
        { y: 0.46, rx: 0.16, rz: 0.152, x: 0.022 },
        { y: 0.54, rx: 0.14, rz: 0.15, x: 0.012 },
      ],
      c.robe,
      { seg: 14, outline: 0.02 }
    );
    torso.add(drape);
    const stripe = ringed(
      [
        { y: 0.36, rx: 0.158, rz: 0.153, x: 0.021 },
        { y: 0.42, rx: 0.161, rz: 0.155, x: 0.022 },
      ],
      c.robeGold,
      { seg: 14, outline: 0.0 }
    );
    torso.add(stripe);
    const pallu = tube(
      [
        [0.03, 0.56, -0.13, 0.034],
        [-0.12, 0.48, -0.14, 0.04],
        [-0.16, 0.26, -0.13, 0.04],
        [-0.15, 0.04, -0.11, 0.03],
      ],
      c.robe,
      { seg: 6, squash: 0.45, outline: 0.012 }
    );
    torso.add(pallu);
    const dress = skirt(0.3, 0.3, 0.46, 0.44, 0.56, c.robe, { folds: 9, fold: 0.05, outline: 0.02 });
    dress.position.y = 0.04;
    torso.add(dress);
    const hem = ringed(
      [
        { y: -0.52, rx: 0.228, rz: 0.218 },
        { y: -0.47, rx: 0.222, rz: 0.212 },
      ],
      c.robeGold,
      { seg: 18, outline: 0.012 }
    );
    hem.position.y = 0.04;
    torso.add(hem);
    // Silver jewelry at the throat — `bladeSteel` reused rather than a
    // redundant new accent.
    const necklace = shaped(tor(0.08, 0.013, 5, 14), P.bladeSteel, { outline: 0.008 });
    necklace.rotation.x = Math.PI / 2 - 0.35;
    necklace.position.set(0.02, 0.58, 0);
    torso.add(necklace);
  } else {
    // Dull vein-cracks, the poison showing through rather than a wound —
    // the true form's own damage-signal telegraph accent, `putanaToxin`.
    for (let i = 0; i < 3; i++) {
      const vein = decal(0.022, 0.24 - i * 0.05, c.toxin);
      onFront(torso, vein, 0.4 - i * 0.07, (i - 1) * 0.09, 0.005);
      vein.rotation.z = (i - 1) * 0.35;
    }
    const wrap = skirt(0.46, 0.44, 0.52, 0.5, 0.24, c.trueSkinDark, { folds: 6, fold: 0.14, outline: 0.02 });
    wrap.position.y = 0.05;
    torso.add(wrap);
  }

  const head = new THREE.Group();
  head.position.y = true_ ? 0.58 : 0.6;
  torso.add(head);
  n.head = head;

  const neck = limb(true_ ? 0.14 : 0.09, 0.1, true_ ? 0.14 : 0.09, skin, { taper: 1.1, bulge: 0, outline: 0.012, up: true });
  neck.position.y = -0.06;
  head.add(neck);
  const face = true_
    ? skull(0.26, 0.28, 0.26, skin, { jaw: 0.96, snout: 0.08, outline: 0.026 })
    : skull(0.2, 0.24, 0.19, skin, { jaw: 0.6, outline: 0.02 });
  head.add(face);
  nose(face, true_ ? 0.16 : 0.13, true_ ? 0.06 : 0.045, skin, { jut: true_ ? 0.03 : 0.016, r: true_ ? 0.022 : 0.011 });

  if (!true_) {
    // Loose dark hair under a simple gold circlet — the disguise reads as
    // an ordinary, welcoming woman.
    capOf(face, 0.1, c.hair ?? P.putanaHair, { grow: 1.08, back: 0.01, brow: 0.05, hairline: 0.15 });
    const fall = ringed(
      [
        { y: -0.3, rx: 0.04, rz: 0.1, x: -0.1 },
        { y: -0.16, rx: 0.06, rz: 0.12, x: -0.1 },
        { y: 0.04, rx: 0.08, rz: 0.12, x: -0.08 },
        { y: 0.18, rx: 0.07, rz: 0.1, x: -0.06 },
      ],
      c.hair ?? P.putanaHair,
      { seg: 12, bottomY: -0.36, topY: 0.22, outline: 0.016 }
    );
    head.add(fall);
    const circlet = shaped(tor(0.105, 0.012, 5, 16), c.robeGold, { outline: 0.008 });
    circlet.rotation.x = Math.PI / 2;
    circlet.rotation.z = 0.12;
    circlet.position.set(-0.004, 0.19, 0);
    head.add(circlet);
  } else {
    // A ragged, matted mane where the disguise's hair was — the same "kept
    // the disguise's own material, made feral" move Taraka's pelts and
    // Shurpanakha's hair both already use across their own reveals.
    capOf(face, 0.12, c.trueSkinDark, { grow: 1.12, back: 0.02, brow: 0.06, hairline: 0.18, wave: 0.14 });
    const mane = ringed(
      [
        { y: -0.2, rx: 0.08, rz: 0.18, x: -0.14, wave: 0.16, waves: 7 },
        { y: 0.0, rx: 0.12, rz: 0.2, x: -0.12, wave: 0.14, waves: 7 },
        { y: 0.18, rx: 0.12, rz: 0.17, x: -0.08 },
        { y: 0.26, rx: 0.08, rz: 0.12, x: -0.06 },
      ],
      c.trueSkinDark,
      { seg: 14, bottomY: -0.28, topY: 0.3, outline: 0.02 }
    );
    head.add(mane);
  }

  // The mouth glow — `putanaToxin` on the true form, dim in the disguise:
  // one accent slot doing double duty, present but unlit before the reveal.
  const mouth = decal(true_ ? 0.12 : 0.05, true_ ? 0.05 : 0.018, c.toxin, { opacity: true_ ? 0.9 : 0.15 });
  onFront(face, mouth, true_ ? 0.07 : 0.06, 0, 0.005);
  n.mouth = mouth;

  for (const side of [-1, 1]) {
    const eye = decal(true_ ? 0.07 : 0.05, true_ ? 0.04 : 0.024, true_ ? c.toxin : c.eye, { opacity: true_ ? 1 : 0.7 });
    onFront(face, eye, true_ ? 0.17 : 0.14, side * (true_ ? 0.065 : 0.045), 0.005);
    if (true_) eye.rotation.z = side * -0.25;
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.04, true_ ? 0.48 : 0.5, side * (true_ ? 0.28 : 0.2));
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(true_ ? 0.16 : 0.11, true_ ? 0.32 : 0.3, true_ ? 0.16 : 0.11, skin, { taper: 0.8, bulge: true_ ? 0.14 : 0.04 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = true_ ? -0.32 : -0.3;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(true_ ? 0.15 : 0.1, true_ ? 0.3 : 0.28, true_ ? 0.15 : 0.1, skin, { taper: 0.74, bulge: true_ ? 0.1 : 0.04 });
    elbow.add(fore);

    const hand = mitt(true_ ? 0.14 : 0.09, true_ ? 0.15 : 0.11, true_ ? 0.14 : 0.09, skin, { side, fist: false });
    hand.position.y = true_ ? -0.3 : -0.28;
    elbow.add(hand);
    n['hand' + key] = hand;

    if (true_) {
      // Full rakshasi claws — sized up from the disguise's hint.
      for (let i = -1; i <= 1; i++) {
        const claw = tube(
          [
            [0.05, -0.4, i * 0.05, 0.022],
            [0.11, -0.48, i * 0.055, 0.015],
            [0.13, -0.58, i * 0.055, 0.002],
          ],
          P.bone,
          { seg: 5, outline: 0.007 }
        );
        elbow.add(claw);
      }
    } else {
      // A subtly clawed nail on each hand — the tell hidden in plain
      // sight, per her entry's own reference reading.
      for (let i = -1; i <= 1; i++) {
        const nail = tube(
          [
            [0.04, -0.36, i * 0.028, 0.009],
            [0.06, -0.4, i * 0.03, 0.006],
            [0.065, -0.43, i * 0.03, 0.001],
          ],
          P.bone,
          { seg: 5, outline: 0.004 }
        );
        elbow.add(nail);
      }
    }

    // The embrace's telegraph flare — the shared damage-signal amber, on
    // the same node in both forms so the reveal never moves the tell.
    const glow = decal(0.15, 0.15, P.amber, { opacity: 0.35 });
    glow.position.set(0.08, true_ ? -0.3 : -0.28, 0);
    glow.rotation.y = Math.PI / 2;
    elbow.add(glow);
    n['handGlow' + key] = glow;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * (true_ ? 0.18 : 0.12));
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(true_ ? 0.2 : 0.15, true_ ? 0.38 : 0.36, true_ ? 0.2 : 0.15, dark, { taper: 0.78, bulge: 0.1 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = true_ ? -0.38 : -0.36;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(true_ ? 0.17 : 0.13, true_ ? 0.34 : 0.32, true_ ? 0.17 : 0.13, dark, { taper: 0.7, bulge: 0.1, bulgeAt: 0.22 });
    knee.add(shin);

    const foot = boot(true_ ? 0.22 : 0.17, 0.08, true_ ? 0.15 : 0.11, true_ ? dark : skin, { toe: 0.4 });
    foot.position.set(0.04, true_ ? -0.34 : -0.32, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}

/**
 * Both rigs, pre-built at spawn and swapped on a `visible` flag, never built
 * mid-run — the same rule `buildTaraka`/`buildShurpanakha` follow and for
 * the same reason (three.js draws four `Math.random()` values per object
 * for its UUID; the suite seeds `Math.random` globally).
 *
 * `Putana`'s constructor in `enemies.js` reads `root.userData.forms` and
 * swaps both the `visible` flag and its own `this.n` at the reveal.
 */
export function buildPutana(skin = null) {
  const c = skin || {
    robe: P.putanaRobe,
    robeGold: P.putanaRobeGold,
    skin: P.putanaSkin,
    trueSkin: P.putanaTrueSkin,
    trueSkinDark: P.putanaTrueSkinDark,
    toxin: P.putanaToxin,
    eye: P.amber,
  };
  const root = new THREE.Group();

  const disguised = buildPutanaForm(false, c);
  const revealed = buildPutanaForm(true, c);
  revealed.visible = false;
  root.add(disguised, revealed);

  root.userData.forms = {
    disguised: { root: disguised, nodes: disguised.userData.nodes },
    revealed: { root: revealed, nodes: revealed.userData.nodes },
  };
  root.userData.nodes = disguised.userData.nodes;
  return root;
}

// ---------------------------------------------------------------------------
// Narakasura — gate 11's Warden, king of Pragjyotishapura
// ---------------------------------------------------------------------------

/**
 * A tyrant-king in the same register as Kamsa two gates back, differentiated
 * at the material level rather than the pose: his armour is **stone**, not
 * metal — "carved from the earth he commands", per his roster entry — where
 * Kamsa's is cold shackle-iron. That is the whole reason `bhaumaStone` exists
 * as a separate palette entry instead of borrowing `mathuraPlate`.
 *
 * Three calls from the roster entry that are decisions, not detail:
 *
 * - **Horns, not a snout.** All five reference images independently gave him
 *   large horns while agreeing on nothing else, which is weak evidence of a
 *   convergent shorthand worth adopting. They grow from an otherwise humanoid
 *   demon face — gate 3's Goru-Mukh is already "the Ox-Headed" with a bestial
 *   horned skull, and the two must not converge on "horned boss" as one
 *   silhouette category. The horn-crown sits *outside* the collision box as a
 *   visual topper, the same precedent as Kumbhakarna's tusks: it makes him
 *   read taller than Kamsa despite a deliberately smaller hitbox.
 * - **Two arms.** Two of the five references gave him four, dual-wielding.
 *   Rejected: Ravana's entry already owns multi-armed iconography on this
 *   roster, and a second multi-armed villain would collide with that signature
 *   directly.
 * - **A spear with the stolen earrings fused to it.** No single canonical
 *   weapon is well attested, so his entry combines the two candidates into one
 *   prop rather than choosing. It also keeps him off the roster's third mace
 *   (Kamsa and Duryodhana) and second sword (Ravana). The earrings are
 *   `devaGold` — Aditi's gold, looted — which is the one deliberately
 *   wrong-feeling colour on his body, so the theft is legible in the palette
 *   and not only in the backstory.
 *
 * The ember cracks are ambient and passive. The attack tell is `amber` flaring
 * at the earrings, the same convention every other Warden's weapon-flare
 * already holds, and nothing else on this rig is allowed to compete with it.
 */
export function buildNarakasura(skin = null) {
  const c = skin || {
    stone: P.bhaumaStone,
    stoneDark: P.bhaumaStoneDark,
    skin: P.bhaumaSkin,
    ember: P.bhaumaEmber,
    gold: P.devaGold,
    eye: P.amber,
  };
  const root = new THREE.Group();
  const n = {};

  const body = new THREE.Group();
  body.position.y = 0.88;
  root.add(body);
  n.body = body;
  n.baseY = body.position.y;

  // Rounded plate rather than hard boxes: the roster's design language for a
  // crowned villain (see `buildDuryodhana`), and here it also reads as rock
  // weathered round rather than forged square.
  const torso = trunk(0.6, 0.7, 0.54, c.stone, { waist: 0.84, chest: 0.12, p: 2.8, neck: 0.5, outline: 0.04 });
  body.add(torso);
  n.torso = torso;

  const belt = ringed(
    [
      { y: -0.02, rx: 0.26, rz: 0.235, p: 2.8 },
      { y: 0.06, rx: 0.27, rz: 0.245, p: 2.8 },
      { y: 0.13, rx: 0.26, rz: 0.235, p: 2.8 },
    ],
    c.stoneDark,
    { seg: 16, outline: 0.026 }
  );
  torso.add(belt);
  const faulds = skirt(0.52, 0.48, 0.62, 0.58, 0.32, c.stoneDark, { p: 2.8, folds: 7, fold: 0.06, outline: 0.024 });
  faulds.position.y = 0.04;
  body.add(faulds);

  // Strata across the chest — the earth motif carried as geology rather than
  // as ornament. Passive decoration; see the note above about the tell.
  for (let i = 0; i < 3; i++) {
    const seam = decal(0.44, 0.03, c.stoneDark);
    onFront(torso, seam, 0.22 + i * 0.16, 0, 0.004);
    seam.rotation.z = (i - 1) * 0.08;
  }

  // The ember cracks: rust-magma fissures in the plate, lit but never flaring.
  n.embers = [];
  for (const [ey, ez, ew, tilt] of [
    [0.16, 0.1, 0.16, 0.4],
    [0.42, -0.12, 0.12, -0.3],
    [0.56, 0.06, 0.1, 0.5],
  ]) {
    const crack = decal(0.03, ew, c.ember, { opacity: 0.55 });
    onFront(torso, crack, ey, ez, 0.006);
    crack.rotation.z = tilt;
    n.embers.push(crack);
  }

  for (const side of [-1, 1]) {
    const pauldron = blob(0.28, 0.19, 0.3, c.stoneDark, { p: 2.6, pv: 2.2, outline: 0.024 });
    pauldron.position.set(0.02, 0.6, side * 0.32);
    pauldron.rotation.x = side * 0.3;
    torso.add(pauldron);
  }

  const head = new THREE.Group();
  head.position.y = 0.84;
  torso.add(head);
  n.head = head;

  const neck = limb(0.15, 0.14, 0.15, c.skin, { taper: 1.05, bulge: 0, outline: 0.016, up: true });
  neck.position.y = -0.1;
  head.add(neck);
  const face = skull(0.31, 0.33, 0.3, c.skin, { jaw: 0.86, outline: 0.03 });
  head.add(face);
  nose(face, 0.19, 0.075, c.skin, { jut: 0.03, r: 0.02 });

  // A demon's humanoid face: heavy brows, fangs at the corners of a grim
  // mouth, a short black beard.
  for (const side of [-1, 1]) {
    const brow = decal(0.11, 0.032, 0x1a100c);
    onFront(face, brow, 0.22, side * 0.07, 0.005);
    brow.rotation.z = side * 0.35;
    const fx = frontOf(face.userData.mesh.geometry, 0.08, side * 0.05).x;
    const fang = tube(
      [
        [fx - 0.004, 0.09, side * 0.05, 0.013],
        [fx + 0.004, 0.12, side * 0.052, 0.009],
        [fx + 0.004, 0.15, side * 0.05, 0.001],
      ],
      P.bone,
      { seg: 5, outline: 0.005 }
    );
    face.add(fang);
  }
  const mouth = decal(0.12, 0.022, 0x1a100c);
  onFront(face, mouth, 0.085, 0, 0.004);
  const beard = ringed(
    [
      { y: -0.04, rx: 0.05, rz: 0.07, x: 0.12 },
      { y: 0.02, rx: 0.1, rz: 0.13, x: 0.07 },
      { y: 0.08, rx: 0.12, rz: 0.15, x: 0.035 },
    ],
    0x1a100c,
    { seg: 12, bottomY: -0.07, topY: 0.09, outline: 0.012 }
  );
  face.add(beard);

  // A low stone diadem, not a jewelled crown — he is a king, but the horns are
  // the silhouette and a tall crown would fight them for the same space.
  const diadem = ringed(
    [
      { y: 0.26, rx: 0.155, rz: 0.15, x: -0.01, p: 2.6 },
      { y: 0.31, rx: 0.16, rz: 0.155, x: -0.012, p: 2.6 },
      { y: 0.33, rx: 0.15, rz: 0.145, x: -0.014, p: 2.6 },
    ],
    c.stoneDark,
    { seg: 16, outline: 0.018 }
  );
  face.add(diadem);

  // The horns. Swept up and back, growing from the temples of a humanoid
  // face — one tapering, curling tube a side rather than four stacked
  // blocks. This is the read the whole rig is built around, so it is the one
  // thing given real size.
  n.horns = [];
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hornRoot = new THREE.Group();
    hornRoot.position.set(-0.02, 0.26, side * 0.15);
    // Splayed out along Z as well as swept back, so the pair reads as a spread
    // from the three-quarter angle `actor.js`'s TILT yaws every rig to. The
    // first build kept them near the centre line and they disappeared into the
    // skull at gameplay distance — which fails the one thing his roster entry
    // asks this rig to do, since the horns *are* his distinguishing silhouette.
    // (+0.5 about X leans a +Z horn further toward +Z: out, not across. The
    // box build had the sign the other way and its horns crossed overhead.)
    hornRoot.rotation.x = side * 0.5;
    face.add(hornRoot);
    n['horn' + key] = hornRoot;
    const horn = tube(
      [
        [0, -0.02, 0, 0.075],
        [0.0, 0.2, 0, 0.066],
        [-0.06, 0.42, 0, 0.052],
        [-0.18, 0.6, 0, 0.036],
        [-0.34, 0.68, 0, 0.02],
        [-0.46, 0.64, 0, 0.004],
      ],
      c.stone,
      { seg: 9, outline: 0.016 }
    );
    hornRoot.add(horn);
    // Ridged: two dark bands of the same stone, the way a horn grows in rings.
    for (const [y, x, r] of [[0.14, -0.005, 0.072], [0.32, -0.03, 0.062]]) {
      const ridge = shaped(tor(r, 0.012, 5, 14), c.stoneDark, { outline: 0.006 });
      ridge.position.set(x, y, 0);
      ridge.rotation.set(Math.PI / 2, 0, 0.2);
      hornRoot.add(ridge);
    }
    n.horns.push(hornRoot);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const eye = decal(0.06, 0.036, c.eye, { opacity: 0.75 });
    onFront(face, eye, 0.18, side * 0.068, 0.005);
    n['eye' + key] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.02, 0.56, side * 0.33);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = limb(0.19, 0.33, 0.19, c.skin, { taper: 0.84, bulge: 0.12 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.33;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = limb(0.17, 0.31, 0.17, c.skin, { taper: 0.8, bulge: 0.1 });
    elbow.add(fore);

    // Stone vambrace — the plate motif reaching down the arm, so the spear is
    // held by something that matches the body it grows out of.
    const vambrace = limb(0.19, 0.16, 0.19, c.stoneDark, { taper: 0.88, bulge: 0, p: 2.6, outline: 0.016 });
    vambrace.position.y = -0.12;
    elbow.add(vambrace);

    const hand = mitt(0.15, 0.15, 0.15, c.skin, { side });
    hand.position.y = -0.31;
    elbow.add(hand);
    n['hand' + key] = hand;
  }

  // The spear, right hand, laid along +X like Kumbhakarna's club and the Lanka
  // soldier's haft. Reach is the point: it reads as a mechanically distinct
  // silhouette from a mace or a sword before it is ever swung.
  const spear = new THREE.Group();
  spear.position.set(0.06, -0.3, 0);
  n.elbowR.add(spear);
  n.spear = spear;

  const grip = new THREE.Group();
  grip.rotation.z = -Math.PI / 2;
  spear.add(grip);

  const haft = limb(0.07, 2.08, 0.07, c.stoneDark, { taper: 0.9, bulge: 0, outline: 0.016, up: true });
  haft.position.y = -0.48;
  grip.add(haft);

  // The head: a leaf blade of the same stone as his plate.
  const blade = ringed(
    [
      { y: 1.58, rx: 0.03, rz: 0.03 },
      { y: 1.66, rx: 0.026, rz: 0.06 },
      { y: 1.78, rx: 0.024, rz: 0.08 },
      { y: 1.96, rx: 0.018, rz: 0.055 },
      { y: 2.14, rx: 0.006, rz: 0.012 },
    ],
    c.stone,
    { seg: 10, bottomY: 1.56, topY: 2.2, outline: 0.02 }
  );
  grip.add(blade);

  // Aditi's earrings, fused to the haft below the blade. Looted gold on a
  // stone weapon: the one thing on him that does not belong to him.
  n.earrings = [];
  for (const side of [-1, 1]) {
    const hoop = shaped(tor(0.05, 0.014, 5, 14), c.gold, { outline: 0.008 });
    hoop.position.set(0, 1.46, side * 0.07);
    grip.add(hoop);
    const drop = blob(0.04, 0.07, 0.03, c.gold, { outline: 0.008 });
    drop.position.set(0, 1.37, side * 0.07);
    grip.add(drop);
    n.earrings.push(hoop, drop);
  }

  // The tell. Flares amber at the earrings before a thrust — the same
  // convention every other Warden's weapon-flare holds, which is why it is
  // `amber` and not `bhaumaEmber`: the ember cracks are ambient, and a hunter
  // must never have to tell two oranges apart to read an attack.
  const flare = decal(0.44, 0.44, c.eye, { opacity: 0 });
  flare.position.y = 1.46;
  flare.rotation.y = Math.PI / 2;
  grip.add(flare);
  n.spearGlow = flare;

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.19);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = limb(0.24, 0.39, 0.24, c.stoneDark, { taper: 0.82, bulge: 0.08 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.39;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = limb(0.2, 0.35, 0.2, c.stoneDark, { taper: 0.8, bulge: 0.1, bulgeAt: 0.25, p: 2.4 });
    knee.add(shin);

    const foot = boot(0.27, 0.1, 0.19, c.stoneDark);
    foot.position.set(0.05, -0.35, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}
