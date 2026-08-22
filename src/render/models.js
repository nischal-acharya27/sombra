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
// The hunter
// ---------------------------------------------------------------------------

export function buildHunter() {
  const root = new THREE.Group();
  const n = {}; // named nodes the animator drives

  const coat = { color: P.hunterCoat };
  const coatDark = { color: P.hunterCoatDark };

  // Root origin is at the feet, so world position is ground contact.
  const hips = new THREE.Group();
  hips.position.y = 0.74;
  root.add(hips);
  n.hips = hips;

  const torso = part(0.30, 0.50, 0.40, P.hunterCoat, { pivot: 'bottom' });
  hips.add(torso);
  n.torso = torso;

  // Coat tails — two loose panels behind the hips that the animator swings.
  for (const side of [-1, 1]) {
    const tail = part(0.24, 0.52, 0.16, P.hunterCoatDark, { pivot: 'top' });
    tail.position.set(-0.06, 0.04, side * 0.11);
    hips.add(tail);
    n[side < 0 ? 'coatL' : 'coatR'] = tail;
  }

  const belt = part(0.32, 0.07, 0.42, P.hunterTrim, { outline: 0.015 });
  belt.position.y = 0.03;
  torso.add(belt);

  // Chest sigil: the mark of the System.
  const sigil = decal(0.12, 0.16, P.cyan);
  sigil.position.set(0.16, 0.30, 0);
  sigil.rotation.y = Math.PI / 2;
  torso.add(sigil);
  n.sigil = sigil;

  const head = new THREE.Group();
  head.position.y = 0.50;
  torso.add(head);
  n.head = head;

  const skull = part(0.24, 0.26, 0.24, P.hunterSkin, { pivot: 'bottom', outline: 0.02 });
  head.add(skull);

  const hair = part(0.26, 0.16, 0.27, P.hunterHair, { pivot: 'bottom', outline: 0.02 });
  hair.position.y = 0.17;
  head.add(hair);
  // Spikes, front to back, shrinking — reads as anime hair in silhouette.
  for (let i = 0; i < 4; i++) {
    const s = part(0.10 - i * 0.012, 0.14 - i * 0.02, 0.20, P.hunterHair, { pivot: 'bottom', outline: 0.016 });
    s.position.set(0.09 - i * 0.07, 0.24, 0);
    s.rotation.z = 0.5 - i * 0.16;
    head.add(s);
  }

  // Eyes on the +X face: the direction the model faces.
  for (const side of [-1, 1]) {
    const eye = decal(0.055, 0.035, P.cyan);
    eye.position.set(0.125, 0.15, side * 0.06);
    eye.rotation.y = Math.PI / 2;
    head.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  // Arms. Offset in Z because the lateral axis is Z when facing +X.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.44, side * 0.21);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = part(0.13, 0.26, 0.13, P.hunterCoat, { pivot: 'top', outline: 0.018 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.115, 0.25, 0.115, P.hunterCoatDark, { pivot: 'top', outline: 0.018 });
    elbow.add(fore);

    const hand = part(0.11, 0.10, 0.12, P.hunterSkin, { pivot: 'top', outline: 0.015 });
    hand.position.y = -0.25;
    elbow.add(hand);
    n['hand' + key] = hand;
  }

  // Legs.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.10);
    hips.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.15, 0.34, 0.16, P.hunterCoatDark, { pivot: 'top', outline: 0.018 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.34;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.13, 0.32, 0.14, P.hunterCoatDark, { pivot: 'top', outline: 0.018 });
    knee.add(shin);

    const foot = part(0.22, 0.08, 0.15, P.hunterTrim, { pivot: 'top', outline: 0.015 });
    foot.position.set(0.04, -0.32, 0);
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

  const chest = part(0.86, 0.42, 0.46, c.body, { outline: 0.026 });
  body.add(chest);
  n.chest = chest;

  // Spines along the back.
  for (let i = 0; i < 4; i++) {
    const spine = part(0.07, 0.18 - i * 0.02, 0.06, c.spine, { pivot: 'bottom', outline: 0.014 });
    spine.position.set(0.26 - i * 0.17, 0.20, 0);
    spine.rotation.z = -0.35;
    body.add(spine);
  }

  const neck = new THREE.Group();
  neck.position.set(0.40, 0.10, 0);
  body.add(neck);
  n.neck = neck;

  const head = part(0.40, 0.28, 0.32, c.dark, { outline: 0.024 });
  head.position.x = 0.18;
  neck.add(head);

  const jaw = part(0.26, 0.10, 0.26, c.dark, { pivot: 'top', outline: 0.018 });
  jaw.position.set(0.26, -0.10, 0);
  neck.add(jaw);
  n.jaw = jaw;

  for (const side of [-1, 1]) {
    const eye = decal(0.10, 0.07, c.eye);
    eye.position.set(0.38, 0.06, side * 0.09);
    eye.rotation.y = Math.PI / 2;
    neck.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  // Legs: front pair and back pair, each offset laterally in Z.
  let i = 0;
  for (const fx of [0.3, -0.3]) {
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(fx, -0.18, side * 0.17);
      body.add(hip);
      const upper = part(0.13, 0.26, 0.13, c.dark, { pivot: 'top', outline: 0.016 });
      hip.add(upper);
      const paw = part(0.17, 0.10, 0.15, c.dark, { pivot: 'top', outline: 0.014 });
      paw.position.set(0.02, -0.26, 0);
      hip.add(paw);
      n['leg' + i] = hip;
      i++;
    }
  }

  const tail = new THREE.Group();
  tail.position.set(-0.42, 0.08, 0);
  body.add(tail);
  n.tail = tail;
  const tailSeg = part(0.34, 0.09, 0.09, c.dark, { outline: 0.014 });
  tailSeg.position.x = -0.17;
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

  const chest = part(1.02, 0.54, 0.62, c.body, { outline: 0.03 });
  body.add(chest);

  // The slab over the shoulders. This is the part that arrives first, and it
  // is the heaviest thing on the model for that reason.
  const plate = part(0.40, 0.44, 0.66, c.dark, { outline: 0.026 });
  plate.position.set(0.34, 0.09, 0);
  body.add(plate);

  const neck = new THREE.Group();
  neck.position.set(0.48, -0.06, 0);
  body.add(neck);
  n.neck = neck;

  const head = part(0.40, 0.32, 0.40, c.dark, { outline: 0.026 });
  head.position.x = 0.19;
  neck.add(head);

  for (const side of [-1, 1]) {
    const horn = part(0.34, 0.10, 0.10, P.bone, { outline: 0.016 });
    horn.position.set(0.40, 0.11, side * 0.16);
    horn.rotation.z = 0.40;
    horn.rotation.y = side * 0.22;
    neck.add(horn);

    const eye = decal(0.09, 0.07, c.eye);
    eye.position.set(0.40, 0.02, side * 0.13);
    eye.rotation.y = Math.PI / 2;
    neck.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  // Four thick legs, front pair and back pair, offset laterally in Z.
  let i = 0;
  for (const fx of [0.32, -0.32]) {
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(fx, -0.25, side * 0.22);
      body.add(hip);
      const upper = part(0.18, 0.28, 0.18, c.dark, { pivot: 'top', outline: 0.018 });
      hip.add(upper);
      const hoof = part(0.22, 0.12, 0.20, P.bone, { pivot: 'top', outline: 0.016 });
      hoof.position.set(0.02, -0.28, 0);
      hip.add(hoof);
      n['leg' + i] = hip;
      i++;
    }
  }

  const tail = new THREE.Group();
  tail.position.set(-0.50, 0.10, 0);
  body.add(tail);
  n.tail = tail;
  const tailSeg = part(0.26, 0.10, 0.10, c.dark, { outline: 0.014 });
  tailSeg.position.x = -0.13;
  tail.add(tailSeg);

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

  const torso = part(0.48, 0.56, 0.48, c.body, { pivot: 'bottom', outline: 0.03 });
  body.add(torso);

  // The plate: a slab bolted over the chest, wider than the body beneath it.
  const plate = part(0.56, 0.34, 0.54, c.dark, { outline: 0.028 });
  plate.position.set(0.02, 0.30, 0);
  torso.add(plate);

  const head = new THREE.Group();
  head.position.y = 0.62;
  torso.add(head);
  n.head = head;

  const helm = part(0.30, 0.26, 0.30, c.dark, { pivot: 'bottom', outline: 0.024 });
  head.add(helm);

  // Eyes, in the game's shared vocabulary: they flare when a commit is near.
  for (const side of [-1, 1]) {
    const eye = decal(0.07, 0.045, c.eye);
    eye.position.set(0.155, 0.13, side * 0.075);
    eye.rotation.y = Math.PI / 2;
    head.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.46, side * 0.28);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = part(0.22, 0.20, 0.22, c.dark, { outline: 0.022 });
    shoulder.add(pauldron);

    const upper = part(0.15, 0.28, 0.15, c.body, { pivot: 'top', outline: 0.02 });
    upper.position.y = -0.05;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.13, 0.26, 0.13, c.dark, { pivot: 'top', outline: 0.02 });
    elbow.add(fore);
  }

  // The shield, bolted to the near arm: a slab that reads "this doesn't
  // flinch head-on" before the bash ever telegraphs.
  const shield = part(0.05, 0.48, 0.34, c.dark, { outline: 0.02 });
  shield.position.set(0.10, -0.05, 0);
  n.elbowL.add(shield);

  // Legs — wide, low. Standing armour, not something built to chase.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.15);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.19, 0.28, 0.19, c.dark, { pivot: 'top', outline: 0.022 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.28;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.17, 0.26, 0.17, c.body, { pivot: 'top', outline: 0.02 });
    knee.add(shin);

    const foot = part(0.25, 0.09, 0.19, c.dark, { pivot: 'top', outline: 0.018 });
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

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.20, 0), glowMaterial({ color: c.core }));
  root.add(core);
  n.core = core;

  const halo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, 0),
    new THREE.MeshBasicMaterial({
      color: c.halo,
      transparent: true,
      opacity: 0.30,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    })
  );
  root.add(halo);
  n.halo = halo;

  // Orbiting shards, animated as a group.
  const ring = new THREE.Group();
  root.add(ring);
  n.ring = ring;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const shard = part(0.09, 0.20, 0.05, c.shard, { outline: 0.014 });
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

  const robe = part(0.42, 0.6, 0.42, c.robe, { pivot: 'bottom', outline: 0.03 });
  body.add(robe);

  // The hem: a wide skirt rather than jointed legs — a Tantrik never runs, it
  // keeps a ring and casts from inside it.
  const hem = part(0.5, 0.3, 0.5, c.dark, { pivot: 'top', outline: 0.026 });
  robe.add(hem);

  const head = new THREE.Group();
  head.position.y = 0.56;
  robe.add(head);
  n.head = head;

  const hood = part(0.26, 0.28, 0.26, c.dark, { pivot: 'bottom', outline: 0.024 });
  head.add(hood);

  for (const side of [-1, 1]) {
    const eye = decal(0.055, 0.045, c.eye);
    eye.position.set(0.135, 0.12, side * 0.07);
    eye.rotation.y = Math.PI / 2;
    head.add(eye);
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
    shoulder.position.set(0, 0.5, side * 0.22);
    robe.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = part(0.1, 0.28, 0.1, c.dark, { pivot: 'top', outline: 0.018 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.09, 0.24, 0.09, c.robe, { pivot: 'top', outline: 0.016 });
    elbow.add(fore);
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
  const skirt = shaped(
    lathe(
      [
        [0.0, 0.0],
        [0.268, 0.010],
        [0.268, 0.042],
        [0.232, 0.058], // the hem, and the only real flare on him
        [0.214, 0.170],
        [0.196, 0.186], // second layer's hem
        [0.192, 0.470],
        [0.172, 0.492], // third layer's hem
        [0.166, 0.700],
        [0.152, 0.860],
      ],
      12
    ),
    P.shakuniRobe,
    { outline: 0.026, opts: { map: 'shakuni.robe', steps: 3 } }
  );
  rig.add(skirt);
  n.skirt = skirt;

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
  const robe = shaped(cyl(0.118, 0.152, 0.50, 9), P.shakuniRobe, {
    pivot: 'bottom',
    outline: 0.024,
    opts: { map: 'shakuni.robe', steps: 3 },
  });
  stoop.add(robe);
  n.robe = robe;

  // The asymmetric wine sash, over the right shoulder and down to the left
  // hip. Two panels, front and back, so it reads from either facing — he turns
  // by yawing 180°, and a one-sided sash would vanish half the time.
  for (const sign of [1, -1]) {
    const sash = part(0.045, 0.68, 0.10, P.shakuniWine, { outline: 0.014 });
    sash.position.set(sign * 0.098, 0.25, 0);
    sash.rotation.x = sign * 0.42;
    stoop.add(sash);
    n.wineMeshes.push(sash.userData.mesh);
  }

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
  const neck = shaped(cyl(0.055, 0.065, 0.12, 7), P.shakuniSkin, { pivot: 'top', outline: 0.010 });
  neck.position.y = 0.02;
  head.add(neck);

  // The skull, scaled long and narrow — sunken, not round.
  const skull = shaped(sph(0.135, 10, 7), P.shakuniSkin, { outline: 0.018 });
  // Long and narrow. At 0.155 the head was as wide as the shoulders and read
  // as a mask on a stick; the taper is where "aged" lives on a face this size.
  skull.scale.set(0.92, 1.18, 0.86);
  skull.position.y = 0.14;
  head.add(skull);
  n.skull = skull;

  // A heavy brow, the one hard edge on the face. Everything else about him is
  // soft and curved; this is what stops "elderly" reading as "kindly".
  const brow = part(0.055, 0.035, 0.20, P.shakuniSkin, { outline: 0.010 });
  brow.position.set(0.098, 0.185, 0);
  brow.rotation.z = 0.16;
  head.add(brow);

  const nose = shaped(cone(0.032, 0.09, 5), P.shakuniSkin, { outline: 0.008 });
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(0.122, 0.125, 0);
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
    const strand = shaped(cone(r, len, 6), P.shakuniBeard, { outline: 0.012 });
    strand.rotation.z = Math.PI; // apex down
    strand.position.set(x, -len / 2 + 0.02, z);
    beardGroup.add(strand);
  }

  // The moustache, joining the beard to the nose so the face is one mass.
  const tache = part(0.05, 0.03, 0.11, P.shakuniBeard, { outline: 0.008 });
  tache.position.set(0.118, 0.075, 0);
  head.add(tache);

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

  const crown = shaped(sph(0.148, 9, 5), P.shakuniRobeDark, { outline: 0.016 });
  crown.scale.set(0.96, 1.05, 0.92);
  crown.position.y = 0.26;
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
  const tail = part(0.09, 0.24, 0.16, P.shakuniWineDark, { pivot: 'top', outline: 0.014 });
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
    const cap = shaped(sph(0.072, 8, 6), P.shakuniRobeDark, { outline: 0.013 });
    cap.scale.set(1, 0.85, 1);
    shoulder.add(cap);

    const upper = shaped(cyl(0.046, 0.058, 0.22, 7), P.shakuniRobeDark, { pivot: 'top', outline: 0.012 });
    upper.position.y = -0.02;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.235;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    // Sleeved, not bare. A skin-toned forearm on a charcoal robe read as a
    // naked arm at combat distance — the one place the reference art's own
    // layering had been dropped, and the only pale mass on the body competing
    // with the beard, which is the read the whole silhouette is built on.
    const fore = shaped(cyl(0.039, 0.046, 0.20, 7), P.shakuniRobeDark, { pivot: 'top', outline: 0.011 });
    elbow.add(fore);

    // A bangle at the wrist. Small, but it is the detail that makes a bare
    // forearm read as ornamented rather than undressed.
    const bangle = shaped(tor(0.045, 0.011, 5, 12), P.shakuniGold, { outline: 0.007 });
    bangle.rotation.x = Math.PI / 2;
    bangle.position.y = -0.185;
    elbow.add(bangle);
    n.goldMeshes.push(bangle.userData.mesh);

    const hand = shaped(sph(0.05, 8, 6), P.shakuniSkin, { outline: 0.010 });
    hand.scale.set(0.9, 1.0, 0.8);
    hand.position.y = -0.215;
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

  // The belly: wide and deep before it is tall, sagging low ahead of a
  // narrower chest — the one proportion this rig exists to get right.
  const belly = part(1.0, 0.62, 0.86, c.body, { pivot: 'bottom', outline: 0.036 });
  body.add(belly);
  n.belly = belly;

  // Bruise-purple worked into the sag itself, a decal rather than new
  // geometry so it rides the belly's own squash-stretch for free.
  const sag = decal(0.5, 0.3, c.bruise, { opacity: 0.55 });
  sag.position.set(0.44, 0.16, 0);
  sag.rotation.y = Math.PI / 2;
  belly.add(sag);

  const chest = part(0.7, 0.5, 0.66, c.body, { pivot: 'bottom', outline: 0.034 });
  chest.position.y = 0.62;
  belly.add(chest);
  n.chest = chest;

  const head = new THREE.Group();
  head.position.y = 0.52;
  chest.add(head);
  n.head = head;

  const skull = part(0.42, 0.4, 0.42, c.body, { pivot: 'bottom', outline: 0.03 });
  head.add(skull);

  // Heavy jowls hanging past the jaw — the "predatory glutton" face read.
  for (const side of [-1, 1]) {
    const jowl = part(0.14, 0.18, 0.16, c.body, { pivot: 'top', outline: 0.02 });
    jowl.position.set(0.13, 0.08, side * 0.16);
    skull.add(jowl);
  }

  // The fanged grin: a dark slot and a row of pale points along it.
  const mouth = decal(0.24, 0.08, P.outline);
  mouth.position.set(0.21, 0.06, 0);
  mouth.rotation.y = Math.PI / 2;
  skull.add(mouth);
  for (let i = -2; i <= 2; i++) {
    const fang = part(0.02, 0.05, 0.02, P.bone, { pivot: 'top', outline: 0.006 });
    fang.position.set(0.215, 0.08, i * 0.045);
    skull.add(fang);
  }

  // Plain, dark eyes — like Shakuni, the menace never reads off the face;
  // it reads off the hands.
  for (const side of [-1, 1]) {
    const eye = decal(0.05, 0.035, P.outline);
    eye.position.set(0.2, 0.2, side * 0.09);
    eye.rotation.y = Math.PI / 2;
    head.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  // Long, loose hair spilling from under the helm.
  const hair = part(0.3, 0.3, 0.3, c.hair, { pivot: 'top', outline: 0.024 });
  hair.position.set(-0.1, 0.28, 0);
  skull.add(hair);

  // The horned skull-crest helm — a static silhouette read, not a
  // telegraph: it sits still through every state the animator drives.
  const helm = part(0.32, 0.16, 0.32, c.dark, { pivot: 'bottom', outline: 0.026 });
  helm.position.y = 0.28;
  skull.add(helm);
  for (const side of [-1, 1]) {
    const horn = part(0.06, 0.32, 0.06, P.bone, { pivot: 'bottom', outline: 0.014 });
    horn.position.set(-0.02, 0.14, side * 0.1);
    horn.rotation.z = 0.3;
    horn.rotation.x = side * 0.22;
    helm.add(horn);
  }

  // The vertebra-bead necklace, skull pendant at the sternum.
  const necklace = new THREE.Group();
  necklace.position.set(0.32, 0.4, 0);
  chest.add(necklace);
  for (let i = -3; i <= 3; i++) {
    const bead = part(0.05, 0.05, 0.05, P.bone, { outline: 0.008 });
    bead.position.set(Math.cos(i * 0.25) * 0.02, -Math.abs(i) * 0.03, i * 0.06);
    necklace.add(bead);
  }
  const pendant = part(0.08, 0.09, 0.05, P.bone, { pivot: 'top', outline: 0.012 });
  pendant.position.set(0.02, -0.16, 0);
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

    const upper = part(0.22, 0.34, 0.22, c.body, { pivot: 'top', outline: 0.026 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    // Wider than the upper arm — the taper runs backward from a grunt's.
    const fore = part(0.27, 0.36, 0.27, c.body, { pivot: 'top', outline: 0.028 });
    elbow.add(fore);
    for (let i = 0; i < 3; i++) {
      const ring = part(0.3, 0.05, 0.3, P.bone, { outline: 0.012 });
      ring.position.y = -0.1 - i * 0.09;
      elbow.add(ring);
    }

    const hand = part(0.24, 0.24, 0.22, c.body, { pivot: 'top', outline: 0.024 });
    hand.position.y = -0.36;
    elbow.add(hand);
    n['hand' + key] = hand;

    // The inflamed glow, sitting just outside the hand rather than inside
    // it — flares during a grab's windup, the same vocabulary Kawach's eyes
    // and Shakuni's own eyes already use for "about to commit".
    const glow = decal(0.26, 0.26, c.hand, { opacity: 0.55 });
    glow.position.set(0.12, -0.36, 0);
    glow.rotation.y = Math.PI / 2;
    elbow.add(glow);
    n['handGlow' + key] = glow;
  }

  // Legs — short and heavy under all that weight.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.26);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.34, 0.4, 0.34, c.body, { pivot: 'top', outline: 0.03 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.28, 0.36, 0.28, c.dark, { pivot: 'top', outline: 0.026 });
    knee.add(shin);

    const foot = part(0.34, 0.12, 0.28, c.dark, { pivot: 'top', outline: 0.02 });
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

    const thigh = roundedPart(0.26, 0.5, 0.26, P.kuruPlateDark, { pivot: 'top' });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.5;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = roundedPart(0.22, 0.46, 0.22, P.kuruPlateDark, { pivot: 'top' });
    knee.add(shin);

    const greave = roundedPart(0.25, 0.2, 0.25, P.kuruPlate, { pivot: 'top', outline: 0.028 });
    greave.position.y = -0.06;
    knee.add(greave);

    const foot = roundedPart(0.3, 0.12, 0.24, P.kuruPlateDark, { pivot: 'top' });
    foot.position.set(0.06, -0.46, 0);
    knee.add(foot);
  }

  const hips = new THREE.Group();
  hips.position.y = 0.92;
  root.add(hips);
  n.hips = hips;

  const torso = roundedPart(0.5, 0.62, 0.34, P.kuruPlate, { pivot: 'bottom', outline: 0.034 });
  hips.add(torso);
  n.torso = torso;

  // The chest-plate: a shallower, brighter box sitting proud of the torso's
  // own front face (+X), plus a spine-ridge decal down its centre — the
  // piece of "armour" a flat torso block never has.
  const chestPlate = roundedPart(0.14, 0.5, 0.3, P.kuruPlateLight, { pivot: 'bottom', outline: 0.03 });
  chestPlate.position.set(0.2, 0.06, 0);
  torso.add(chestPlate);
  const ridge = decal(0.08, 0.4, P.kuruPlateDark);
  ridge.position.set(0.28, 0.28, 0);
  ridge.rotation.y = Math.PI / 2;
  chestPlate.add(ridge);

  // The belt: the reference-corroborated green waist-wrap, worked in low
  // rather than at the face, with the crimson danger accent as its own gem.
  const belt = roundedPart(0.56, 0.12, 0.38, P.kuruWrap, { pivot: 'bottom', outline: 0.03 });
  belt.position.y = 0.02;
  torso.add(belt);
  const beltGem = decal(0.1, 0.1, P.kuruCore);
  beltGem.position.set(0.3, 0.06, 0);
  beltGem.rotation.y = Math.PI / 2;
  belt.add(beltGem);

  // The neck — its own part, so the head has somewhere to sit above the
  // shoulder line instead of sinking into it.
  const neck = roundedPart(0.16, 0.14, 0.16, P.kuruSkin, { pivot: 'bottom', outline: 0.02 });
  neck.position.y = 0.62;
  torso.add(neck);
  n.neck = neck;

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.02, 0.6, side * 0.24);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = roundedPart(0.22, 0.16, 0.22, P.kuruPlateLight, { pivot: 'center', outline: 0.03 });
    pauldron.position.set(0, 0.02, side * 0.02);
    shoulder.add(pauldron);

    const upper = roundedPart(0.16, 0.32, 0.16, P.kuruPlate, { pivot: 'top' });
    upper.position.y = -0.04;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = roundedPart(0.14, 0.3, 0.14, P.kuruSkin, { pivot: 'top' });
    elbow.add(fore);

    const vambrace = roundedPart(0.17, 0.16, 0.17, P.kuruPlateLight, { pivot: 'top', outline: 0.026 });
    vambrace.position.y = -0.02;
    elbow.add(vambrace);

    const hand = roundedPart(0.13, 0.13, 0.12, P.kuruSkin, { pivot: 'top', radius: 0.045 });
    hand.position.y = -0.3;
    elbow.add(hand);
    n['hand' + key] = hand;
  }

  const head = new THREE.Group();
  head.position.y = 0.15;
  neck.add(head);
  n.head = head;

  const skull = roundedPart(0.28, 0.26, 0.26, P.kuruSkin, { pivot: 'bottom', outline: 0.026, radius: 0.05 });
  head.add(skull);

  for (const side of [-1, 1]) {
    const brow = decal(0.1, 0.03, 0x0a0813);
    brow.position.set(0.148, 0.205 + side * 0.006, side * 0.075);
    brow.rotation.set(0, Math.PI / 2, side * 0.4);
    skull.add(brow);
  }

  // Eyes lit in a hot glowing red so the face itself reads as a threat, not
  // just the mace.
  for (const side of [-1, 1]) {
    const eyeWhite = decal(0.065, 0.04, 0x0a0813);
    eyeWhite.position.set(0.147, 0.16, side * 0.075);
    eyeWhite.rotation.y = Math.PI / 2;
    skull.add(eyeWhite);
    const eyeGlow = decal(0.04, 0.022, P.kuruEye, { opacity: 0.6 });
    eyeGlow.position.set(0.149, 0.16, side * 0.075);
    eyeGlow.rotation.y = Math.PI / 2;
    skull.add(eyeGlow);
    n['eyeGlow' + (side < 0 ? 'L' : 'R')] = eyeGlow;
  }

  const mouth = decal(0.17, 0.028, 0x0a0813);
  mouth.position.set(0.148, 0.065, 0);
  mouth.rotation.y = Math.PI / 2;
  skull.add(mouth);
  for (const side of [-1, 1]) {
    const corner = decal(0.06, 0.032, 0x0a0813);
    corner.position.set(0.148, 0.095, side * 0.09);
    corner.rotation.set(0, Math.PI / 2, side * -0.75);
    skull.add(corner);
    const fang = part(0.022, 0.05, 0.022, P.bone, { pivot: 'top', outline: 0.006 });
    fang.position.set(0.148, 0.058, side * 0.065);
    skull.add(fang);
    const innerFang = part(0.016, 0.032, 0.016, P.bone, { pivot: 'top', outline: 0.005 });
    innerFang.position.set(0.148, 0.052, side * 0.022);
    skull.add(innerFang);
  }

  // The crown: worn, not balanced — every tier's front-back extent stays
  // inside the skull's own front bound so it tucks behind the face instead
  // of burying the eyes, starting low at the brow line and rising well past
  // the skull's own top to top out the silhouette.
  const crown = new THREE.Group();
  crown.position.y = 0.18;
  skull.add(crown);

  const browBand = roundedPart(0.24, 0.06, 0.34, P.kuruCrown, { pivot: 'bottom', outline: 0.024, radius: 0.018 });
  browBand.position.y = -0.01;
  crown.add(browBand);

  const baseBand = roundedPart(0.26, 0.18, 0.4, P.kuruCrown, { pivot: 'bottom', outline: 0.026, radius: 0.032 });
  baseBand.position.y = 0.05;
  crown.add(baseBand);

  const upperTier = roundedPart(0.2, 0.09, 0.28, P.kuruCrownDark, { pivot: 'bottom', outline: 0.022, radius: 0.02 });
  upperTier.position.y = 0.23;
  crown.add(upperTier);

  for (let i = -3; i <= 3; i++) {
    const h = 0.24 - Math.abs(i) * 0.04;
    const spike = roundedPart(0.05, h, 0.05, P.kuruCrown, { pivot: 'bottom', outline: 0.015, radius: 0.016 });
    spike.position.set(0, 0.32, i * 0.038);
    crown.add(spike);
  }

  const gem = decal(0.08, 0.08, 0x3aa0d6);
  gem.position.set(0.135, 0.09, 0);
  gem.rotation.y = Math.PI / 2;
  baseBand.add(gem);
  const gemGlow = decal(0.05, 0.05, P.kuruCore);
  gemGlow.position.set(0.14, 0.09, 0);
  gemGlow.rotation.y = Math.PI / 2;
  baseBand.add(gemGlow);

  // The gada — the source's own signature weapon, held two-handed at idle,
  // a shaft topped with a knobbed head that flares as the fight's one
  // telegraph.
  const gadaGrip = new THREE.Group();
  gadaGrip.position.set(0.02, -0.28, 0);
  n.handR.add(gadaGrip);
  n.gadaGrip = gadaGrip;

  const shaft = roundedPart(0.05, 0.5, 0.05, P.bone, { pivot: 'top', outline: 0.012, radius: 0.02 });
  gadaGrip.add(shaft);
  const gadaHead = roundedPart(0.24, 0.24, 0.24, P.kuruPlateDark, { pivot: 'top', outline: 0.03, radius: 0.09 });
  gadaHead.position.y = -0.5;
  gadaGrip.add(gadaHead);
  n.gadaHead = gadaHead;
  const gadaGlow = decal(0.26, 0.26, P.kuruCore, { opacity: 0 });
  gadaGlow.position.set(0.13, -0.62, 0);
  gadaGlow.rotation.y = Math.PI / 2;
  gadaGrip.add(gadaGlow);
  n.gadaGlow = gadaGlow;

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

  const torso = part(0.5 * s, 0.62 * s, 0.4 * s, skin, { pivot: 'bottom', outline: 0.03 });
  body.add(torso);
  n.torso = torso;

  // The raw-hide pelt, slung low across the hip — identity in both forms,
  // per the handoff's explicit call against skull/bone jewelry (Bakasura's
  // own motif, dropped here so the two giants don't repeat each other).
  const pelt = part(0.44 * s, 0.2 * s, 0.46 * s, c.pelt, { pivot: 'top', outline: 0.02 });
  pelt.position.y = 0.03;
  torso.add(pelt);

  const head = new THREE.Group();
  head.position.y = 0.6 * s;
  torso.add(head);
  n.head = head;

  const skull = part(0.32 * s, 0.3 * s, 0.3 * s, skin, { pivot: 'bottom', outline: 0.026 });
  head.add(skull);

  if (monstrous) {
    // A distorted, jutting jaw and a row of teeth — "prominent teeth and an
    // enraged expression" per the reference description, built rather than
    // referenced since no image survived for this form.
    const jaw = part(0.2, 0.14, 0.22, dark, { pivot: 'top', outline: 0.02 });
    jaw.position.set(0.14, -0.02, 0);
    skull.add(jaw);
    for (let i = -1; i <= 1; i++) {
      const fang = part(0.02, 0.05, 0.02, P.bone, { pivot: 'top', outline: 0.006 });
      fang.position.set(0.22, -0.02, i * 0.05);
      skull.add(fang);
    }
  } else {
    // Loose, human hair — the one detail the monstrous form sheds entirely.
    const hair = part(0.26, 0.22, 0.26, dark, { pivot: 'top', outline: 0.022 });
    hair.position.set(-0.06, 0.2, 0);
    skull.add(hair);
  }

  for (const side of [-1, 1]) {
    const eye = decal(monstrous ? 0.09 : 0.05, monstrous ? 0.06 : 0.04, c.eye, { opacity: monstrous ? 1 : 0.75 });
    eye.position.set(0.16 * s, 0.14 * s, side * 0.1 * s);
    eye.rotation.y = Math.PI / 2;
    skull.add(eye);
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

    const upper = part(0.16 * s, 0.32 * s, 0.16 * s, skin, { pivot: 'top', outline: 0.024 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.32 * s;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.15 * s, 0.3 * s, 0.15 * s, skin, { pivot: 'top', outline: 0.022 });
    elbow.add(fore);

    const hand = part(0.14 * s, 0.16 * s, 0.14 * s, skin, { pivot: 'top', outline: 0.02 });
    hand.position.y = -0.3 * s;
    elbow.add(hand);
    n['hand' + key] = hand;

    if (monstrous) {
      for (let i = -1; i <= 1; i++) {
        const claw = part(0.03, 0.16, 0.03, P.bone, { pivot: 'top', outline: 0.008 });
        claw.position.set(0.09, -0.38 * s, i * 0.06);
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

    const thigh = part(0.2 * s, 0.36 * s, 0.2 * s, dark, { pivot: 'top', outline: 0.026 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.36 * s;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.17 * s, 0.32 * s, 0.17 * s, dark, { pivot: 'top', outline: 0.022 });
    knee.add(shin);

    const foot = part(0.2 * s, 0.1 * s, 0.24 * s, dark, { pivot: 'top', outline: 0.018 });
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

  const torso = part(0.34 * s, 0.66 * s, 0.3 * s, skin, { pivot: 'bottom', outline: 0.03 });
  body.add(torso);
  n.torso = torso;

  // The red drape, worn across the torso — the disguise's own reference
  // detail, and shed at the reveal, where the true form wears nothing over
  // ash-grey skin.
  if (!true_) {
    const drape = part(0.37, 0.36, 0.33, c.drape, { pivot: 'top', outline: 0.024 });
    drape.position.y = 0.56;
    torso.add(drape);

    // Gold at the waist and throat — jewelry, not armour, and simpler than
    // Kaikeyi's three-strand coin cascade one gate back, which is the
    // concrete difference her entry asks these two women's palettes to carry.
    const sash = part(0.39, 0.06, 0.35, c.gold, { outline: 0.016 });
    sash.position.y = 0.14;
    torso.add(sash);
  } else {
    // Dried-blood vein-cracks across the chest, dull rather than danger-red
    // so they never compete with a live telegraph.
    for (let i = 0; i < 3; i++) {
      const vein = part(0.02, 0.3 - i * 0.06, 0.02, c.vein, { pivot: 'top', outline: 0 });
      vein.position.set(0.16, 0.6 - i * 0.08, (i - 1) * 0.08);
      torso.add(vein);
    }
  }

  const head = new THREE.Group();
  head.position.y = 0.64 * s;
  torso.add(head);
  n.head = head;

  const skull = part(0.2 * s, 0.21 * s, 0.21 * s, skin, { pivot: 'bottom', outline: 0.022 });
  head.add(skull);

  if (true_) {
    // The vein-cracks again, on the face this time — the one place the
    // hunter is actually looking when the reveal lands.
    for (const side of [-1, 1]) {
      const crack = part(0.02, 0.14, 0.02, c.vein, { pivot: 'top', outline: 0 });
      crack.position.set(0.1, 0.2, side * 0.07);
      skull.add(crack);
    }
    // The wound itself, at the centre of the face: the nose Lakshmana took.
    // Recessed rather than added — a notch of dried blood where the rig's
    // other faces carry nothing — because her phase-transition line points
    // straight at it ("look at it properly, this time"), and a reveal that
    // narrates a mutilation the model does not actually show is the reveal
    // failing at the one job it has. It is never staged as something the
    // hunter delivers or witnesses: it is already old when she arrives, and
    // she is the only one who ever describes it.
    const wound = part(0.05, 0.07, 0.06, c.vein, { pivot: 'top', outline: 0.01 });
    wound.position.set(0.1, 0.14, 0);
    skull.add(wound);

    // Loose, wild hair — the disguise's headdress gone, the same black
    // underneath it always was.
    const mane = part(0.3, 0.3, 0.3, c.hair, { pivot: 'top', outline: 0.024 });
    mane.position.set(-0.08, 0.24, 0);
    skull.add(mane);
  } else {
    // Bound hair under a cowrie-shell-banded headdress: the shell band is the
    // silhouette tell that vanishes at the reveal.
    const bound = part(0.22, 0.2, 0.22, c.hair, { pivot: 'top', outline: 0.02 });
    bound.position.set(-0.04, 0.2, 0);
    skull.add(bound);

    const band = part(0.24, 0.05, 0.24, c.shell, { outline: 0.014 });
    band.position.y = 0.17;
    skull.add(band);

    const crest = part(0.16, 0.1, 0.16, c.gold, { pivot: 'bottom', outline: 0.014 });
    crest.position.y = 0.2;
    skull.add(crest);
  }

  // Heavy kohl in the disguise, amber flare in the true form — one accent
  // slot, two readings, so the eye the hunter tracks for a windup never
  // moves on the rig.
  for (const side of [-1, 1]) {
    const eye = decal(true_ ? 0.08 : 0.06, true_ ? 0.05 : 0.03, c.eye, { opacity: true_ ? 1 : 0.7 });
    eye.position.set(0.11 * s, 0.11 * s, side * 0.07 * s);
    eye.rotation.y = Math.PI / 2;
    skull.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.04 * s, 0.5 * s, side * 0.2 * s);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = part(0.12 * s, 0.3 * s, 0.12 * s, skin, { pivot: 'top', outline: 0.02 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.3 * s;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.11 * s, 0.28 * s, 0.11 * s, skin, { pivot: 'top', outline: 0.018 });
    elbow.add(fore);

    const hand = part(0.11 * s, 0.13 * s, 0.11 * s, skin, { pivot: 'top', outline: 0.016 });
    hand.position.y = -0.28 * s;
    elbow.add(hand);
    n['hand' + key] = hand;

    if (true_) {
      // Claws — natural, not wielded, matching both demon-form references and
      // the source's own language. The disguise's hands are bare: the swipe
      // that lands after the reveal is the feint that landed before it.
      for (let i = -1; i <= 1; i++) {
        const claw = part(0.028, 0.2, 0.028, P.bone, { pivot: 'top', outline: 0.007 });
        claw.position.set(0.09, -0.36, i * 0.05);
        elbow.add(claw);
      }
    } else {
      // Gold bangles where the claws will be — the disguise wearing ornament
      // exactly where the true form carries the weapon.
      const bangle = part(0.13, 0.04, 0.13, c.gold, { outline: 0.01 });
      bangle.position.y = -0.26 * s;
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

    const thigh = part(0.15 * s, 0.36 * s, 0.15 * s, dark, { pivot: 'top', outline: 0.022 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.36 * s;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.13 * s, 0.32 * s, 0.13 * s, dark, { pivot: 'top', outline: 0.02 });
    knee.add(shin);

    const foot = part(0.15 * s, 0.08 * s, 0.18 * s, dark, { pivot: 'top', outline: 0.016 });
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
  const torso = part(0.34, 0.62, 0.38, c.body, { pivot: 'bottom', outline: 0.028 });
  body.add(torso);

  // Scale skirting rather than a bolted chest slab: the plate is layered and
  // war-worn, not one thick piece.
  for (let i = 0; i < 3; i++) {
    const lame = part(0.38, 0.1, 0.42, c.dark, { outline: 0.018 });
    lame.position.set(0.01, 0.1 + i * 0.13, 0);
    torso.add(lame);
  }

  const head = new THREE.Group();
  head.position.y = 0.66;
  torso.add(head);
  n.head = head;

  const skull = part(0.26, 0.26, 0.26, c.skin, { pivot: 'bottom', outline: 0.022 });
  head.add(skull);

  // A conical helm with a back-swept crest — height added at the top of the
  // silhouette, which is where a lineup of them reads as a line.
  const helm = part(0.28, 0.14, 0.28, c.dark, { pivot: 'bottom', outline: 0.02 });
  helm.position.y = 0.24;
  skull.add(helm);
  const crest = part(0.05, 0.22, 0.14, c.body, { pivot: 'bottom', outline: 0.014 });
  crest.position.set(-0.08, 0.12, 0);
  crest.rotation.z = 0.5;
  helm.add(crest);

  // Eyes, in the shared vocabulary: they flare when a commit is near — the
  // same signal on the same schedule as the Kawach this extends.
  for (const side of [-1, 1]) {
    const eye = decal(0.06, 0.04, c.eye);
    eye.position.set(0.14, 0.12, side * 0.065);
    eye.rotation.y = Math.PI / 2;
    head.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.5, side * 0.24);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const pauldron = part(0.18, 0.14, 0.18, c.dark, { outline: 0.018 });
    shoulder.add(pauldron);

    const upper = part(0.13, 0.28, 0.13, c.skin, { pivot: 'top', outline: 0.018 });
    upper.position.y = -0.04;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.12, 0.26, 0.12, c.skin, { pivot: 'top', outline: 0.018 });
    elbow.add(fore);

    const bracer = part(0.15, 0.09, 0.15, c.dark, { outline: 0.012 });
    bracer.position.y = -0.2;
    elbow.add(bracer);
  }

  // The spear, carried in the far arm and pivoting from the grip so the
  // animator swings the whole length from one node. Built along +X, which is
  // the direction it thrusts — see this file's orientation note.
  const spear = new THREE.Group();
  spear.position.set(0.06, -0.24, 0);
  n.elbowR.add(spear);
  n.spear = spear;

  const haft = new THREE.Group();
  haft.rotation.z = -Math.PI / 2; // lay the box down along +X (a +90° z-turn would point it backwards)
  spear.add(haft);
  const shaft = part(0.05, 2.0, 0.05, c.haft, { pivot: 'bottom', outline: 0.012 });
  shaft.position.y = -0.55; // grip sits a third of the way up, not at the butt
  haft.add(shaft);
  const tip = part(0.07, 0.32, 0.07, c.head, { pivot: 'bottom', outline: 0.012 });
  tip.position.y = 1.45;
  haft.add(tip);
  // The leaf blade: two flared cheeks either side of the point, so the head
  // reads as a spear rather than as the haft continuing in a paler colour.
  for (const side of [-1, 1]) {
    const cheek = part(0.03, 0.16, 0.05, c.head, { pivot: 'bottom', outline: 0.008 });
    cheek.position.set(0, 1.45, side * 0.05);
    haft.add(cheek);
  }

  // Legs — long, planted. It walks in and stops at spear length, which is a
  // very different distance from the one the shield taught.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.13);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = part(0.16, 0.36, 0.16, c.dark, { pivot: 'top', outline: 0.02 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.36;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.14, 0.34, 0.14, c.skin, { pivot: 'top', outline: 0.018 });
    knee.add(shin);

    const foot = part(0.22, 0.08, 0.16, c.dark, { pivot: 'top', outline: 0.016 });
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
  const torso = flesh(part(1.5, 1.5, 1.3, c.skin, { pivot: 'bottom', outline: 0.05 }));
  body.add(torso);
  n.torso = torso;

  // The wrap — minimal warrior garb, the only garment on him, and no jewelry
  // anywhere: the inverse of Bakasura's bone-heavy read, on purpose.
  const wrap = part(1.56, 0.46, 1.36, c.wrap, { pivot: 'top', outline: 0.034 });
  wrap.position.y = 0.24;
  torso.add(wrap);

  const head = new THREE.Group();
  head.position.y = 1.46;
  torso.add(head);
  n.head = head;

  const skull = flesh(part(0.86, 0.8, 0.82, c.skin, { pivot: 'bottom', outline: 0.04 }));
  head.add(skull);

  // A heavy jaw, hung open a crack — a face caught mid-yawn is the whole
  // default character read his entry asks for. It has to sit far enough
  // forward to break the skull's own outline: the skull is 0.86 across, so
  // anything inside x ±0.43 is a box drawn inside a box and reads as nothing
  // at all.
  const jaw = flesh(part(0.42, 0.3, 0.6, c.skin, { pivot: 'top', outline: 0.028 }));
  jaw.position.set(0.46, 0.16, 0);
  skull.add(jaw);
  n.jaw = jaw;

  // Disheveled hair and beard — this is a man who has been asleep for a very
  // long time, and it is the only untidy thing on a rig that wears no
  // ornament at all. Three masses, each placed to clear the skull's own
  // silhouette rather than to sit inside it: on top, down the back, and
  // hanging off the chin below the jaw.
  const crown = part(0.8, 0.44, 0.86, c.hair, { pivot: 'bottom', outline: 0.034 });
  crown.position.set(-0.16, 0.72, 0);
  skull.add(crown);
  const mane = part(0.3, 0.62, 0.8, c.hair, { pivot: 'top', outline: 0.03 });
  mane.position.set(-0.5, 0.74, 0);
  skull.add(mane);
  // The beard frames the jaw rather than hanging below it. Below is not
  // available: the skull's underside sits level with the top of a chest 1.5
  // units across, so anything that hangs is inside him. So it flares wider
  // than the skull is deep instead, which is what makes it read from the
  // three-quarter angle the camera actually holds.
  const beard = part(0.36, 0.40, 0.90, c.hair, { pivot: 'top', outline: 0.03 });
  beard.position.set(0.30, 0.16, 0);
  skull.add(beard);

  // Eyes and lids. The eye is the telegraph — the shared damage-signal amber,
  // per his entry — and the lid sitting over most of it is the groggy read.
  // `_wake` raises the lids; nothing else about the face moves.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const eye = decal(0.2, 0.13, c.eye, { opacity: 0.5 });
    eye.position.set(0.44, 0.5, side * 0.2);
    eye.rotation.y = Math.PI / 2;
    skull.add(eye);
    n['eye' + key] = eye;

    const lid = flesh(part(0.04, 0.1, 0.24, c.skin, { pivot: 'top', outline: 0.01 }));
    lid.position.set(0.45, 0.57, side * 0.2);
    skull.add(lid);
    n['lid' + key] = lid;
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

    const upper = flesh(part(0.52, 0.86, 0.52, c.skin, { pivot: 'top', outline: 0.036 }));
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.86;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = flesh(part(0.46, 0.8, 0.46, c.skin, { pivot: 'top', outline: 0.034 }));
    elbow.add(fore);

    const hand = flesh(part(0.44, 0.4, 0.42, c.skin, { pivot: 'top', outline: 0.03 }));
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

  const trunk = new THREE.Group();
  trunk.rotation.z = -Math.PI / 2; // along +X, same as the soldier's haft
  club.add(trunk);
  const shaft = part(0.34, 3.0, 0.34, c.club, { pivot: 'bottom', outline: 0.03 });
  shaft.position.y = -0.5;
  trunk.add(shaft);
  // The head end: thicker, knotted, still carrying its root ball. An
  // *uprooted* tree, not a turned handle.
  const knot = part(0.62, 0.7, 0.62, c.clubDark, { outline: 0.032 });
  knot.position.y = 2.15;
  trunk.add(knot);
  for (const side of [-1, 1]) {
    const root_ = part(0.24, 0.4, 0.22, c.clubDark, { pivot: 'bottom', outline: 0.016 });
    root_.position.set(side * 0.24, 2.4, side * 0.22);
    root_.rotation.z = side * 0.5;
    trunk.add(root_);
  }

  // Legs — heavy columns. Nothing here is built for speed, and the fight is
  // written around that.
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hip = new THREE.Group();
    hip.position.set(0, 0, side * 0.5);
    body.add(hip);
    n['hip' + key] = hip;

    const thigh = flesh(part(0.62, 1.0, 0.62, c.skin, { pivot: 'top', outline: 0.04 }));
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -1.0;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = flesh(part(0.54, 0.86, 0.54, c.skin, { pivot: 'top', outline: 0.036 }));
    knee.add(shin);

    const foot = part(0.66, 0.2, 0.5, c.dark, { pivot: 'top', outline: 0.026 });
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

  const robe = part(0.3, 0.62, 0.28, P.kaikeyiRobe, { pivot: 'bottom', outline: 0.03 });
  body.add(robe);
  n.robe = robe;

  // A bridal/coronation hem, heavier and more layered than Shakuni's plain
  // skirt — dressed for the day the boons were granted, not for court
  // business.
  const hem = part(0.4, 0.26, 0.36, P.kaikeyiRobeDark, { pivot: 'top', outline: 0.026 });
  hem.position.y = 0.02;
  robe.add(hem);

  for (const side of [-1, 1]) {
    const foot = part(0.12, 0.06, 0.13, P.kaikeyiRobeDark, { pivot: 'top', outline: 0.014 });
    foot.position.set(0.05, -0.26, side * 0.08);
    hem.add(foot);
  }

  // The cascading multi-strand gold coin-necklace reaching the waist — the
  // handoff's own differentiator from Shurpanakha's simpler gold jewelry.
  for (let i = 0; i < 3; i++) {
    const strand = part(0.03, 0.5 - i * 0.06, 0.03, P.kaikeyiGold, { pivot: 'top', outline: 0.008 });
    strand.position.set(0.15, 0.34, (i - 1) * 0.05);
    robe.add(strand);
  }

  const sash = part(0.32, 0.06, 0.29, P.kaikeyiGold, { outline: 0.02 });
  sash.position.y = 0.2;
  robe.add(sash);

  const head = new THREE.Group();
  head.position.y = 0.52;
  robe.add(head);
  n.head = head;

  const skull = part(0.19, 0.22, 0.2, P.kaikeyiSkin, { pivot: 'bottom', outline: 0.02 });
  head.add(skull);

  // Loose, wavy hair under the veil — Shurpanakha's own hair is bound and
  // ornate under her headdress, a concrete, checkable difference rather
  // than a mood contrast.
  const hair = part(0.24, 0.24, 0.24, P.kaikeyiHair, { pivot: 'top', outline: 0.022 });
  hair.position.set(-0.03, 0.24, 0);
  skull.add(hair);

  // The veil, over the hair rather than the face — ceremonial, not
  // concealing.
  const veil = part(0.22, 0.28, 0.22, P.kaikeyiRobeDark, { pivot: 'top', outline: 0.02 });
  veil.position.set(-0.05, 0.3, 0);
  skull.add(veil);

  // The paisley crown and its single teardrop ruby, distinct from
  // Duryodhana's tiered jeweled crown and Ravana's ten-head arc.
  const crown = part(0.15, 0.1, 0.16, P.kaikeyiGold, { pivot: 'bottom', outline: 0.016 });
  crown.position.y = 0.11;
  skull.add(crown);
  const ruby = decal(0.045, 0.06, P.crimson);
  ruby.position.set(0.1, 0.13, 0);
  ruby.rotation.y = Math.PI / 2;
  skull.add(ruby);

  // A large gold nose ring (nath) — unclaimed elsewhere on the roster.
  const nath = decal(0.05, 0.05, P.kaikeyiGold);
  nath.position.set(0.095, 0.0, 0.05);
  nath.rotation.x = Math.PI / 2;
  skull.add(nath);

  // Heavy kohl — "an expression that reads as weighted rather than
  // triumphant or cruel," the reference's own read.
  for (const side of [-1, 1]) {
    const eye = decal(0.045, 0.024, P.outline);
    eye.position.set(0.095, 0.03, side * 0.05);
    eye.rotation.y = Math.PI / 2;
    skull.add(eye);
  }

  // Arms, clasped and empty.
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.42, side * 0.14);
    robe.add(shoulder);

    const upper = part(0.08, 0.22, 0.08, P.kaikeyiRobe, { pivot: 'top', outline: 0.015 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.22;
    shoulder.add(elbow);

    const fore = part(0.07, 0.2, 0.07, P.kaikeyiSkin, { pivot: 'top', outline: 0.013 });
    elbow.add(fore);

    const hand = part(0.07, 0.08, 0.08, P.kaikeyiSkin, { pivot: 'top', outline: 0.012 });
    hand.position.y = -0.2;
    elbow.add(hand);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Dwar-Rakshak — the level's boss
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

  const torso = part(0.98, 1.3, 1.1, P.lankaPlate, { pivot: 'bottom', outline: 0.05 });
  hips.add(torso);
  n.torso = torso;

  // The vermillion drape, worn over the plate — the one large non-gold mass on
  // him, and what stops the chest reading as a slab. Kept just inside the
  // torso's own width so it never becomes a separate floating box.
  const robe = part(0.94, 0.86, 1.06, P.lankaRobe, { pivot: 'top', outline: 0.03 });
  robe.position.y = 0.46;
  torso.add(robe);

  // Heavy court gold at the collar and the belt: "richly adorned" is explicit
  // in his entry where it was not in Duryodhana's, and it is the ornament
  // rather than the scale that separates the two kings' silhouettes.
  const collar = part(1.06, 0.22, 1.2, P.lankaPlateDark, { outline: 0.034 });
  collar.position.y = 1.18;
  torso.add(collar);
  const belt = part(1.02, 0.2, 1.14, P.lankaPlateDark, { outline: 0.034 });
  belt.position.y = 0.1;
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
   * One head: skull, crown, a pair of eyes and the flare decal that is this
   * head's own telegraph. `lateral` is the Z offset (paired limbs offset in Z,
   * not X — models face +X), `back` pulls the outer heads behind the main one
   * and `lift` raises them, so the arc reads as a fan from the three-quarter
   * angle the camera actually holds rather than as a row of boxes.
   */
  const buildHead = (scale, lateral, back, lift, tilt) => {
    const g = new THREE.Group();
    g.position.set(back, lift, lateral);
    g.rotation.z = tilt;
    g.scale.setScalar(scale);
    neck.add(g);

    const skull = part(0.5, 0.5, 0.52, P.lankaSkin, { pivot: 'bottom', outline: 0.04 });
    g.add(skull);

    // A worn crown per head — ten crowned heads is what both anchor references
    // independently agree on, and an uncrowned head in the arc would read as a
    // severed one.
    const crown = part(0.4, 0.34, 0.42, P.lankaPlate, { pivot: 'bottom', outline: 0.03 });
    crown.position.y = 0.5;
    g.add(crown);
    const finial = part(0.14, 0.2, 0.14, P.lankaPlateDark, { pivot: 'bottom', outline: 0.02 });
    finial.position.y = 0.84;
    g.add(finial);

    // The jaw, hung a crack open — the head that bares its teeth before its
    // arm commits is the whole per-head telegraph, and a closed box cannot.
    // Far enough forward to clear the skull's own 0.5-unit outline.
    const jaw = part(0.24, 0.16, 0.36, P.lankaSkinDark, { pivot: 'top', outline: 0.02 });
    jaw.position.set(0.26, 0.16, 0);
    g.add(jaw);

    for (const side of [-1, 1]) {
      const eye = decal(0.12, 0.09, P.lankaCore);
      eye.position.set(0.27, 0.34, side * 0.12);
      eye.rotation.y = Math.PI / 2;
      g.add(eye);
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

    const pauldron = part(0.5, 0.34, 0.44, P.lankaPlate, { outline: 0.04 });
    pauldron.position.y = 0.06;
    shoulder.add(pauldron);

    const upper = part(0.3, 0.6, 0.3, P.lankaSkin, { pivot: 'top', outline: 0.03 });
    upper.position.y = -0.12;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.7;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.28, 0.58, 0.28, P.lankaSkin, { pivot: 'top', outline: 0.03 });
    elbow.add(fore);

    const band = part(0.32, 0.1, 0.32, P.lankaPlateDark, { outline: 0.022 });
    band.position.y = -0.5;
    elbow.add(band);

    const fist = part(0.32, 0.3, 0.32, P.lankaSkinDark, { pivot: 'top', outline: 0.03 });
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

    const upper = part(0.24, 0.52, 0.24, P.lankaSkin, { pivot: 'top', outline: 0.026 });
    shoulder.add(upper);

    const cuff = part(0.28, 0.1, 0.28, P.lankaPlateDark, { outline: 0.02 });
    cuff.position.y = -0.48;
    shoulder.add(cuff);

    const fore = part(0.22, 0.5, 0.22, P.lankaSkin, { pivot: 'top', outline: 0.026 });
    fore.position.y = -0.54;
    shoulder.add(fore);

    const grip = new THREE.Group();
    grip.position.y = -1.04;
    shoulder.add(grip);
    return grip;
  };

  // Chandrahas — the curved sword, and the one signature both anchor
  // references carry. Cold moon-steel, on the near-camera side, because it is
  // the weapon the player has to recognise fastest.
  const swordGrip = buildArm('armSweep', -0.96, -0.35);
  {
    const hilt = part(0.12, 0.26, 0.12, P.lankaPlateDark, { pivot: 'top', outline: 0.02 });
    swordGrip.add(hilt);
    const guard = part(0.3, 0.09, 0.16, P.lankaPlate, { outline: 0.022 });
    swordGrip.add(guard);
    // Three tapering segments, each stepped in Z, so the "curved" read comes
    // from the silhouette rather than from geometry this engine cannot bend.
    for (let i = 0; i < 3; i++) {
      const seg = part(0.2 - i * 0.03, 0.48, 0.07, P.lankaSword, { pivot: 'top', outline: 0.018 });
      seg.position.set(0, -0.24 - i * 0.42, i * 0.03);
      seg.rotation.x = i * 0.08;
      swordGrip.add(seg);
    }
  }

  // The trishul — the reach thrust. The longest prop on him, because this is
  // the weapon that closes distance, and the rest angle is what keeps its
  // prongs off the floor between attacks.
  const trishulGrip = buildArm('armCharge', 0.46, 0.8);
  {
    const haft = part(0.1, 1.7, 0.1, P.lankaPlateDark, { pivot: 'top', outline: 0.02 });
    trishulGrip.add(haft);
    for (const off of [-0.15, 0, 0.15]) {
      const prong = part(0.07, off === 0 ? 0.5 : 0.36, 0.07, P.lankaPlate, { pivot: 'top', outline: 0.016 });
      prong.position.set(0, -1.7 - (off === 0 ? 0 : 0.07), off);
      trishulGrip.add(prong);
    }
  }

  // The chakra — thrown, so it is the one prop that has to read as a disc from
  // the side. A ring of eight spokes around a gold hub, held flat against the
  // camera so the throw is legible before it leaves his hand.
  const chakraGrip = buildArm('armVolley', -0.46, -0.5);
  {
    const hub = part(0.18, 0.18, 0.08, P.lankaPlateDark, { outline: 0.022 });
    hub.position.y = -0.24;
    chakraGrip.add(hub);
    n.chakra = hub;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const spoke = part(0.3, 0.09, 0.06, P.lankaPlate, { outline: 0.016 });
      spoke.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0);
      spoke.rotation.z = a;
      hub.add(spoke);
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
    const haft = part(0.12, 1.0, 0.12, P.lankaPlateDark, { pivot: 'top', outline: 0.022 });
    torchGrip.add(haft);
    const bowl = part(0.28, 0.24, 0.28, P.lankaPlate, { outline: 0.024 });
    bowl.position.y = -1.06;
    torchGrip.add(bowl);
    const fire = part(0.22, 0.36, 0.22, P.lankaFlame, { pivot: 'top', outline: 0 });
    fire.position.y = -1.16;
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
      const upper = part(0.17, 0.46, 0.17, P.lankaSkinDark, { pivot: 'top', outline: 0.022 });
      stub.add(upper);
      const fore = part(0.15, 0.4, 0.15, P.lankaSkinDark, { pivot: 'top', outline: 0.022 });
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

    const thigh = part(0.38, 0.88, 0.42, P.lankaPlateDark, { pivot: 'top', outline: 0.034 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.88;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.34, 0.8, 0.36, P.lankaPlate, { pivot: 'top', outline: 0.032 });
    knee.add(shin);

    const foot = part(0.62, 0.2, 0.46, P.lankaPlateDark, { pivot: 'top', outline: 0.03 });
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

  const torso = part(0.62, 0.72, 0.5, c.plate, { pivot: 'bottom', outline: 0.04 });
  body.add(torso);
  n.torso = torso;

  const belt = part(0.66, 0.14, 0.54, c.plateDark, { pivot: 'top', outline: 0.026 });
  belt.position.y = 0.02;
  torso.add(belt);

  // The pauldrons, wide enough to anchor the chain drape strung between them.
  for (const side of [-1, 1]) {
    const pauldron = part(0.2, 0.16, 0.24, c.plateDark, { outline: 0.024 });
    pauldron.position.set(0.02, 0.6, side * 0.32);
    torso.add(pauldron);
  }

  // The barred gorget: a collar ring with bar-shapes standing proud of it,
  // read across the neck rather than smoothed into a ruff.
  const gorget = part(0.34, 0.14, 0.4, c.iron, { outline: 0.022 });
  gorget.position.y = 0.68;
  torso.add(gorget);
  for (let i = -2; i <= 2; i++) {
    const bar = part(0.06, 0.2, 0.06, c.iron, { outline: 0.012 });
    bar.position.set(0.19, 0.68, i * 0.09);
    torso.add(bar);
  }

  // The chain drape: three links strung from each pauldron down to the
  // chest's centre line — armour motif and, per his kit, the chain lash's
  // own weapon, doing double duty rather than sitting on the rig as
  // decoration.
  n.chainLinks = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const link = part(0.07, 0.09, 0.07, c.iron, { outline: 0.012 });
      const u = i / 2;
      link.position.set(0.28, 0.58 - u * 0.24, side * (0.32 - u * 0.32));
      torso.add(link);
      n.chainLinks.push(link);
    }
  }

  const head = new THREE.Group();
  head.position.y = 0.86;
  torso.add(head);
  n.head = head;

  const skull = part(0.32, 0.32, 0.32, c.skin, { pivot: 'bottom', outline: 0.03 });
  head.add(skull);

  // The iron circlet-crown, bar-spiked rather than gold and jewelled —
  // deliberately not competing with Duryodhana's or Ravana's opulence.
  const circlet = part(0.3, 0.08, 0.3, c.iron, { pivot: 'bottom', outline: 0.02 });
  circlet.position.y = 0.3;
  skull.add(circlet);
  for (let i = -2; i <= 2; i++) {
    const spike = part(0.03, 0.14, 0.03, c.iron, { pivot: 'bottom', outline: 0.008 });
    spike.position.set(0.06, 0.36, i * 0.055);
    skull.add(spike);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const eye = decal(0.06, 0.04, c.eye, { opacity: 0.7 });
    eye.position.set(0.15, 0.06, side * 0.08);
    eye.rotation.y = Math.PI / 2;
    skull.add(eye);
    n['eye' + key] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.02, 0.58, side * 0.34);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = part(0.2, 0.34, 0.2, c.skin, { pivot: 'top', outline: 0.026 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.18, 0.32, 0.18, c.skin, { pivot: 'top', outline: 0.024 });
    elbow.add(fore);

    const hand = part(0.17, 0.16, 0.17, c.skin, { pivot: 'top', outline: 0.022 });
    hand.position.y = -0.32;
    elbow.add(hand);
    n['hand' + key] = hand;

    // The shackle-cuff, worn unused — the jailer wearing his own prisoners'
    // irons as regalia.
    const cuff = part(0.2, 0.06, 0.2, c.iron, { outline: 0.014 });
    cuff.position.y = -0.24;
    elbow.add(cuff);
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
  const shaft = part(0.1, 1.5, 0.1, c.plateDark, { pivot: 'bottom', outline: 0.018 });
  shaft.position.y = -0.1;
  grip.add(shaft);

  const head_ = part(0.36, 0.4, 0.36, c.iron, { outline: 0.026 });
  head_.position.y = 1.5;
  grip.add(head_);
  // Cuffs and links, hammered into the head — the same shackle motif as the
  // wrists, spent again here rather than a new ornament.
  for (const side of [-1, 1]) {
    const stud = part(0.1, 0.1, 0.1, c.plateDark, { outline: 0.012 });
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

    const thigh = part(0.24, 0.4, 0.24, c.plateDark, { pivot: 'top', outline: 0.03 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.2, 0.36, 0.2, c.plateDark, { pivot: 'top', outline: 0.026 });
    knee.add(shin);

    const foot = part(0.24, 0.1, 0.28, c.plateDark, { pivot: 'top', outline: 0.02 });
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

  const torso = part(0.38, 0.5, 0.32, c.skin, { pivot: 'bottom', outline: 0.028 });
  body.add(torso);
  n.torso = torso;

  const langot = part(0.42, 0.16, 0.34, c.cloth, { pivot: 'top', outline: 0.022 });
  langot.position.y = 0.02;
  torso.add(langot);

  const head = new THREE.Group();
  head.position.y = 0.48;
  torso.add(head);
  n.head = head;

  const skull = part(0.24, 0.24, 0.24, c.skin, { pivot: 'bottom', outline: 0.024 });
  head.add(skull);

  // Cropped topknot — akhada custom, and a silhouette tell distinct from
  // every other biped's own hair/headdress.
  const knot = part(0.1, 0.12, 0.1, c.dark, { pivot: 'bottom', outline: 0.014 });
  knot.position.y = 0.24;
  skull.add(knot);

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const eye = decal(0.05, 0.03, c.eye, { opacity: 0.6 });
    eye.position.set(0.12, 0.02, side * 0.07);
    eye.rotation.y = Math.PI / 2;
    skull.add(eye);
    n['eye' + key] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.04, 0.42, side * 0.22);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = part(0.13, 0.28, 0.13, c.skin, { pivot: 'top', outline: 0.02 });
    shoulder.add(upper);

    // A wrestler's arm-band, akhada-plain — the roster's own note that
    // nothing here should compete with Kamsa's regalia.
    const band = part(0.15, 0.04, 0.15, c.cloth, { outline: 0.01 });
    band.position.y = -0.08;
    upper.add(band);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.12, 0.26, 0.12, c.skin, { pivot: 'top', outline: 0.018 });
    elbow.add(fore);

    const hand = part(0.12, 0.13, 0.12, c.skin, { pivot: 'top', outline: 0.016 });
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

    const thigh = part(0.16, 0.34, 0.16, c.skin, { pivot: 'top', outline: 0.022 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.34;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.14, 0.3, 0.14, c.skin, { pivot: 'top', outline: 0.02 });
    knee.add(shin);

    const foot = part(0.16, 0.08, 0.2, c.dark, { pivot: 'top', outline: 0.016 });
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
    ? part(0.5, 0.62, 0.46, skin, { pivot: 'bottom', outline: 0.036 })
    : part(0.32, 0.62, 0.28, skin, { pivot: 'bottom', outline: 0.03 });
  body.add(torso);
  n.torso = torso;

  if (!true_) {
    // The bold crimson-and-mustard striped drape, the folk-painting anchor.
    const drape = part(0.35, 0.34, 0.31, c.robe, { pivot: 'top', outline: 0.024 });
    drape.position.y = 0.54;
    torso.add(drape);
    const stripe = part(0.36, 0.09, 0.32, c.robeGold, { outline: 0.018 });
    stripe.position.y = 0.4;
    torso.add(stripe);
    // Silver jewelry at the throat — `bladeSteel` reused rather than a
    // redundant new accent.
    const necklace = part(0.3, 0.05, 0.3, P.bladeSteel, { outline: 0.014 });
    necklace.position.y = 0.58;
    torso.add(necklace);
  } else {
    // Dull vein-cracks, the poison showing through rather than a wound —
    // the true form's own damage-signal telegraph accent, `putanaToxin`.
    for (let i = 0; i < 3; i++) {
      const vein = part(0.025, 0.26 - i * 0.05, 0.025, c.toxin, { pivot: 'top', outline: 0 });
      vein.position.set(0.22, 0.5 - i * 0.09, (i - 1) * 0.1);
      torso.add(vein);
    }
  }

  const head = new THREE.Group();
  head.position.y = true_ ? 0.58 : 0.6;
  torso.add(head);
  n.head = head;

  const skull = true_
    ? part(0.26, 0.26, 0.26, skin, { pivot: 'bottom', outline: 0.026 })
    : part(0.2, 0.21, 0.2, skin, { pivot: 'bottom', outline: 0.022 });
  head.add(skull);

  if (!true_) {
    // Loose dark hair under a simple gold circlet — the disguise reads as
    // an ordinary, welcoming woman.
    const hair = part(0.24, 0.22, 0.24, c.robeGold, { pivot: 'top', outline: 0.02 });
    hair.position.set(-0.04, 0.2, 0);
    skull.add(hair);
  } else {
    // A ragged, matted mane where the disguise's hair was — the same "kept
    // the disguise's own material, made feral" move Taraka's pelts and
    // Shurpanakha's hair both already use across their own reveals.
    const mane = part(0.32, 0.3, 0.32, c.trueSkinDark, { pivot: 'top', outline: 0.024 });
    mane.position.set(-0.08, 0.24, 0);
    skull.add(mane);
  }

  // The mouth glow — `putanaToxin` on the true form, dim in the disguise:
  // one accent slot doing double duty, present but unlit before the reveal.
  const mouth = decal(true_ ? 0.12 : 0.06, true_ ? 0.06 : 0.03, c.toxin, { opacity: true_ ? 0.9 : 0.15 });
  mouth.position.set(0.12, 0.03, 0);
  mouth.rotation.y = Math.PI / 2;
  skull.add(mouth);
  n.mouth = mouth;

  for (const side of [-1, 1]) {
    const eye = decal(true_ ? 0.07 : 0.05, true_ ? 0.05 : 0.03, true_ ? c.toxin : c.eye, { opacity: true_ ? 1 : 0.7 });
    eye.position.set(0.11, true_ ? 0.13 : 0.11, side * 0.07);
    eye.rotation.y = Math.PI / 2;
    skull.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.04, true_ ? 0.48 : 0.5, side * (true_ ? 0.28 : 0.2));
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = part(true_ ? 0.15 : 0.12, true_ ? 0.32 : 0.3, true_ ? 0.15 : 0.12, skin, { pivot: 'top', outline: 0.02 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = true_ ? -0.32 : -0.3;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(true_ ? 0.14 : 0.11, true_ ? 0.3 : 0.28, true_ ? 0.14 : 0.11, skin, { pivot: 'top', outline: 0.018 });
    elbow.add(fore);

    const hand = part(true_ ? 0.15 : 0.11, true_ ? 0.16 : 0.13, true_ ? 0.15 : 0.11, skin, { pivot: 'top', outline: 0.016 });
    hand.position.y = true_ ? -0.3 : -0.28;
    elbow.add(hand);
    n['hand' + key] = hand;

    if (true_) {
      // Full rakshasi claws — sized up from the disguise's hint.
      for (let i = -1; i <= 1; i++) {
        const claw = part(0.03, 0.22, 0.03, P.bone, { pivot: 'top', outline: 0.007 });
        claw.position.set(0.1, -0.38, i * 0.055);
        elbow.add(claw);
      }
    } else {
      // A subtly clawed nail on each hand — the tell hidden in plain
      // sight, per her entry's own reference reading.
      for (let i = -1; i <= 1; i++) {
        const nail = part(0.018, 0.09, 0.018, P.bone, { pivot: 'top', outline: 0.005 });
        nail.position.set(0.07, -0.28, i * 0.035);
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

    const thigh = part(true_ ? 0.19 : 0.15, true_ ? 0.38 : 0.36, true_ ? 0.19 : 0.15, dark, { pivot: 'top', outline: 0.022 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = true_ ? -0.38 : -0.36;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(true_ ? 0.16 : 0.13, true_ ? 0.34 : 0.32, true_ ? 0.16 : 0.13, dark, { pivot: 'top', outline: 0.02 });
    knee.add(shin);

    const foot = part(true_ ? 0.18 : 0.15, 0.08, true_ ? 0.22 : 0.18, dark, { pivot: 'top', outline: 0.016 });
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
  const torso = roundedPart(0.6, 0.7, 0.5, c.stone, { pivot: 'bottom', outline: 0.04, radius: 0.06 });
  body.add(torso);
  n.torso = torso;

  const belt = part(0.64, 0.13, 0.54, c.stoneDark, { pivot: 'top', outline: 0.026 });
  belt.position.y = 0.02;
  torso.add(belt);

  // Strata across the chest — the earth motif carried as geology rather than
  // as ornament. Passive decoration; see the note above about the tell.
  for (let i = 0; i < 3; i++) {
    const seam = part(0.02, 0.05, 0.46, c.stoneDark, { outline: 0 });
    seam.position.set(0.3, 0.2 + i * 0.17, 0);
    torso.add(seam);
  }

  // The ember cracks: rust-magma fissures in the plate, lit but never flaring.
  n.embers = [];
  for (const [ex, ey, ez, ew] of [
    [0.31, 0.16, 0.1, 0.16],
    [0.31, 0.42, -0.14, 0.12],
    [0.31, 0.56, 0.06, 0.1],
  ]) {
    const crack = decal(0.03, ew, c.ember, { opacity: 0.55 });
    crack.position.set(ex, ey, ez);
    crack.rotation.y = Math.PI / 2;
    crack.rotation.x = 0.4;
    torso.add(crack);
    n.embers.push(crack);
  }

  for (const side of [-1, 1]) {
    const pauldron = roundedPart(0.22, 0.18, 0.26, c.stoneDark, { outline: 0.024, radius: 0.05 });
    pauldron.position.set(0.02, 0.58, side * 0.32);
    torso.add(pauldron);
  }

  const head = new THREE.Group();
  head.position.y = 0.84;
  torso.add(head);
  n.head = head;

  const skull = roundedPart(0.31, 0.31, 0.31, c.skin, { pivot: 'bottom', outline: 0.03, radius: 0.05 });
  head.add(skull);

  // A low stone diadem, not a jewelled crown — he is a king, but the horns are
  // the silhouette and a tall crown would fight them for the same space.
  const diadem = part(0.29, 0.07, 0.3, c.stoneDark, { pivot: 'bottom', outline: 0.018 });
  diadem.position.y = 0.29;
  skull.add(diadem);

  // The horns. Swept up and back in three tapering segments a side, growing
  // from the temples of a humanoid face. This is the read the whole rig is
  // built around, so it is the one thing given real size.
  n.horns = [];
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const hornRoot = new THREE.Group();
    hornRoot.position.set(-0.02, 0.24, side * 0.15);
    // Splayed out along Z as well as swept back, so the pair reads as a spread
    // from the three-quarter angle `actor.js`'s TILT yaws every rig to. The
    // first build kept them near the centre line and they disappeared into the
    // skull at gameplay distance — which fails the one thing his roster entry
    // asks this rig to do, since the horns *are* his distinguishing silhouette.
    hornRoot.rotation.x = side * -0.5;
    skull.add(hornRoot);
    n['horn' + key] = hornRoot;

    let parent = hornRoot;
    let w = 0.14;
    for (let i = 0; i < 4; i++) {
      const seg = part(w, 0.26, w, i >= 2 ? c.stoneDark : c.stone, { pivot: 'bottom', outline: 0.016 });
      parent.add(seg);
      const next = new THREE.Group();
      next.position.y = 0.26;
      // Curving back over the crown rather than straight up: a straight horn
      // reads as a spike, and a spike is Kamsa's circlet two gates back. Gentle
      // per-segment, so four segments arc rather than fold flat.
      next.rotation.z = -0.2;
      parent.add(next);
      parent = next;
      w *= 0.78;
    }
    n.horns.push(hornRoot);
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const eye = decal(0.06, 0.045, c.eye, { opacity: 0.75 });
    eye.position.set(0.15, 0.07, side * 0.075);
    eye.rotation.y = Math.PI / 2;
    skull.add(eye);
    n['eye' + key] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0.02, 0.56, side * 0.33);
    torso.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = part(0.19, 0.33, 0.19, c.skin, { pivot: 'top', outline: 0.026 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.33;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.17, 0.31, 0.17, c.skin, { pivot: 'top', outline: 0.024 });
    elbow.add(fore);

    // Stone vambrace — the plate motif reaching down the arm, so the spear is
    // held by something that matches the body it grows out of.
    const vambrace = part(0.19, 0.12, 0.19, c.stoneDark, { outline: 0.016 });
    vambrace.position.y = -0.22;
    elbow.add(vambrace);

    const hand = part(0.16, 0.15, 0.16, c.skin, { pivot: 'top', outline: 0.022 });
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

  const haft = part(0.075, 2.1, 0.075, c.stoneDark, { pivot: 'bottom', outline: 0.016 });
  haft.position.y = -0.5;
  grip.add(haft);

  // The head: a leaf blade of the same stone as his plate.
  const blade = part(0.14, 0.46, 0.05, c.stone, { pivot: 'bottom', outline: 0.02 });
  blade.position.y = 1.6;
  grip.add(blade);
  const tip = part(0.05, 0.16, 0.04, c.stone, { pivot: 'bottom', outline: 0.014 });
  tip.position.y = 2.06;
  grip.add(tip);

  // Aditi's earrings, fused to the haft below the blade. Looted gold on a
  // stone weapon: the one thing on him that does not belong to him.
  n.earrings = [];
  for (const side of [-1, 1]) {
    const hoop = part(0.1, 0.11, 0.035, c.gold, { outline: 0.012 });
    hoop.position.set(0, 1.46, side * 0.07);
    grip.add(hoop);
    const drop = part(0.05, 0.09, 0.03, c.gold, { outline: 0.01 });
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

    const thigh = part(0.23, 0.39, 0.23, c.stoneDark, { pivot: 'top', outline: 0.03 });
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.39;
    hip.add(knee);
    n['knee' + key] = knee;

    const shin = part(0.19, 0.35, 0.19, c.stoneDark, { pivot: 'top', outline: 0.026 });
    knee.add(shin);

    const foot = part(0.23, 0.1, 0.27, c.stoneDark, { pivot: 'top', outline: 0.02 });
    foot.position.set(0.05, -0.35, 0);
    knee.add(foot);
  }

  root.userData.nodes = n;
  return root;
}
