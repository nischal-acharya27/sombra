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
import { toonMaterial, glowMaterial, outlineFor } from './toon.js';
import { P } from './palette.js';

const matCache = new Map();

/** Shared cel material per colour, so a crowd of beasts costs one material. */
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

  const blade = part(0.045, 0.86, 0.11, P.bladeSteel, { pivot: 'bottom', outline: 0.016 });
  blade.position.y = 0.20;
  g.add(blade);

  const tip = part(0.045, 0.14, 0.11, P.bladeSteel, { pivot: 'bottom', outline: 0.014 });
  tip.position.y = 1.06;
  tip.rotation.z = 0.0;
  tip.scale.set(1, 1, 0.5);
  g.add(tip);

  // Fuller: a violet glow line down each face of the blade, offset outward so
  // it never intersects the blade box.
  for (const side of [-1, 1]) {
    const line = decal(0.035, 0.84, P.violetGlow);
    line.position.set(side * 0.024, 0.62, 0);
    line.rotation.y = Math.PI / 2;
    g.add(line);
  }

  g.userData.length = 1.2;
  return g;
}

// ---------------------------------------------------------------------------
// Shadow beast — the quadruped grunt
// ---------------------------------------------------------------------------

/**
 * The quadruped grunt, and — with `skin` — the shadow raised from one.
 *
 * The ally is the same rig in different colours rather than a second model,
 * which is not laziness: measured, a second beast costs zero extra shader
 * programs and at most two geometries, because `mat()` and `box()` both cache.
 * Recolouring changes uniform values, not the material type, so the ally
 * allocates essentially nothing and adds no compile.
 */
export function buildBeast(skin = null) {
  const c = skin || { body: P.beastBody, dark: P.beastBodyDark, spine: P.violetDeep, eye: P.beastEye };
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
 * The node names are the beast's on purpose — `body`, `neck`, `eyeL`, `eyeR`,
 * `leg0..3`. The eye flare is the game's shared vocabulary for "this is about
 * to commit", and an enemy whose tell is animated through differently named
 * nodes is an enemy whose tell drifts out of agreement with the others.
 *
 * `skin` follows `buildBeast`'s lead, for the same reason: a shadow raised
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
// per corpse spent 32 draws at the instant of every beast's death, which was
// enough to send eight fixed seeds down entirely different playthroughs. See
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
// Wisp — the floating ranged enemy
// ---------------------------------------------------------------------------

export function buildWisp() {
  const root = new THREE.Group();
  const n = {};

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.20, 0), glowMaterial({ color: P.wispCore }));
  root.add(core);
  n.core = core;

  const halo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, 0),
    new THREE.MeshBasicMaterial({
      color: P.cyanDeep,
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
    const shard = part(0.09, 0.20, 0.05, P.beastBody, { outline: 0.014 });
    shard.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.12, Math.sin(a) * 0.42);
    shard.rotation.set(a, a * 1.7, a * 0.5);
    ring.add(shard);
  }

  root.userData.nodes = n;
  return root;
}

// ---------------------------------------------------------------------------
// Gate Guardian — the level's boss
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
