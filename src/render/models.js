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
// ---------------------------------------------------------------------------

/**
 * Slight through proportion, not stature — an aged courtier at roughly
 * player scale, per `docs/research/villain-roster.md`'s handoff. A skirt-hem
 * rather than jointed legs, the same call `buildTantrik` makes for a figure
 * that paces a ring instead of running, and unarmored throughout: nothing on
 * the body reaches for the roster's violet/iron/crimson supernatural
 * registers.
 *
 * The die itself never travels: it rides his own right hand (`n.dieProp`)
 * for the "cast" flourish, and the zone it resolves into is read off the
 * ground marker `Shakuni.update` drives through `vfx.shockRing`, not off a
 * second copy of the die repositioned to the target. A prop parented under a
 * rig that yaws toward the camera (`TILT` in `actor.js`) drifts off the
 * world point it is meant to mark as the offset grows — the ring is drawn
 * directly in world space by `Game`/`VFX` and has no such problem, so it is
 * where "read it before it commits" actually happens; the held die is
 * flavour, not the telegraph.
 */
/** Read at player scale in-engine despite `hw`/`hh` already matching `PLAYER`'s
 * — a narrower torso and a lower body-group origin than `buildHunter`'s own
 * left him reading small next to the hunter he is supposed to loom over. A
 * wrapper scale rather than resizing every part: it grows the whole rig from
 * the feet (root's own origin) without touching `root.scale`, which `Enemy
 * .finishSetup`/`_spawnAnim` drive for the rise-from-shadow entrance
 * (0.01 -> 1) — scaling `root` here would just be overwritten back to 1 the
 * moment he spawns. */
const SHAKUNI_SCALE = 1.35;

export function buildShakuni() {
  const root = new THREE.Group();
  const n = {};

  const rig = new THREE.Group();
  rig.scale.setScalar(SHAKUNI_SCALE);
  root.add(rig);

  const body = new THREE.Group();
  body.position.y = 0.60;
  rig.add(body);
  n.body = body;

  // Narrower than a grunt's torso and permanently stooped a few degrees —
  // "slight through proportion, not stature" per the handoff. The stoop
  // lives on its own wrapper rather than on `n.robe` directly: `Shakuni
  // .update`'s `_animate` lerps `n.robe.rotation.z` toward a windup/hurt
  // target that defaults to 0 whenever he's merely idle or chasing, so a
  // rotation set here on that same node would be animated back to upright
  // within a few frames of play — an old man's posture doesn't reset
  // between casts the way a fighting stance does.
  const stoop = new THREE.Group();
  stoop.rotation.z = -0.07;
  body.add(stoop);

  const robe = part(0.26, 0.46, 0.26, P.shakuniRobe, { pivot: 'bottom', outline: 0.026 });
  stoop.add(robe);
  n.robe = robe;

  // A skirt-hem, not jointed legs — he paces a ring, he does not run. Feet
  // peek out past the hem's own hem so the silhouette reads as cloth *over*
  // a standing body, not a torso that simply stops at the waist.
  const hem = part(0.36, 0.24, 0.34, P.shakuniRobeDark, { pivot: 'top', outline: 0.024 });
  hem.position.y = 0;
  robe.add(hem);
  n.hem = hem;

  for (const side of [-1, 1]) {
    const foot = part(0.12, 0.06, 0.13, P.shakuniRobeDark, { pivot: 'top', outline: 0.014 });
    foot.position.set(0.05, -0.24, side * 0.08);
    hem.add(foot);
  }

  const sash = part(0.29, 0.07, 0.27, P.shakuniGold, { outline: 0.02 });
  sash.position.y = 0.20;
  robe.add(sash);

  const head = new THREE.Group();
  head.position.y = 0.50;
  robe.add(head);
  n.head = head;

  // Narrower than a grunt's skull, to match the torso's own taper.
  const skull = part(0.18, 0.22, 0.19, P.bone, { pivot: 'bottom', outline: 0.02 });
  head.add(skull);
  n.skull = skull;

  // The beard: the single detail that reads "aged courtier" at a glance
  // rather than "a smaller Kawach" — every other change here is proportion,
  // this one is silhouette. Hangs from the jaw line, ahead of the +X face
  // the model is built to and the camera's own three-quarter yaw favours.
  const beard = part(0.14, 0.15, 0.15, P.shakuniBeard, { pivot: 'top', outline: 0.016 });
  beard.position.set(0.035, 0.03, 0);
  head.add(beard);

  const wrap = part(0.21, 0.09, 0.21, P.shakuniGold, { pivot: 'bottom', outline: 0.018 });
  wrap.position.y = 0.16;
  head.add(wrap);

  // Plain, dark eyes — deliberately not a glowing tell. His menace never
  // reads off his own body; it reads off the die.
  for (const side of [-1, 1]) {
    const eye = decal(0.04, 0.026, P.outline);
    eye.position.set(0.10, 0.09, side * 0.05);
    eye.rotation.y = Math.PI / 2;
    head.add(eye);
    n[side < 0 ? 'eyeL' : 'eyeR'] = eye;
  }

  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.40, side * 0.15);
    robe.add(shoulder);
    n['shoulder' + key] = shoulder;

    const upper = part(0.08, 0.22, 0.08, P.shakuniRobeDark, { pivot: 'top', outline: 0.015 });
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.22;
    shoulder.add(elbow);
    n['elbow' + key] = elbow;

    const fore = part(0.07, 0.20, 0.07, P.bone, { pivot: 'top', outline: 0.013 });
    elbow.add(fore);

    // A hand, closing the arm the way `buildHunter`'s own does — without it
    // the forearm just ends in mid-air and reads as a stump rather than a
    // limb, the single biggest reason the old rig read as boxes wearing a
    // robe instead of a body.
    const hand = part(0.08, 0.08, 0.09, P.bone, { pivot: 'top', outline: 0.012 });
    hand.position.y = -0.20;
    elbow.add(hand);
    n['hand' + key] = hand;

    // The die, carried in the right hand — parented to the hand itself now,
    // not the elbow, so it visibly sits *in* his grip rather than floating
    // off the forearm. `P.bone`: "the one tradition says was carved from his
    // father's bones." A single crimson pip marks its up-face — the kit's
    // one saturated danger accent, shared with the ground zone it reads
    // rather than inventing a second hue.
    if (key === 'R') {
      const dieProp = part(0.17, 0.17, 0.17, P.bone, { outline: 0.018 });
      dieProp.position.set(0.05, -0.05, 0);
      hand.add(dieProp);
      n.dieProp = dieProp;

      const pip = decal(0.05, 0.05, P.crimson);
      pip.position.set(0.05, 0.035, 0);
      pip.rotation.x = -Math.PI / 2;
      hand.add(pip);
    }
  }

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
