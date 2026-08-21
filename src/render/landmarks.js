// The silhouettes a gate is remembered by.
//
// A landmark is scenery and never a fight. It is built here rather than in
// `Level` because it is the most gate-specific thing a gate has: the geometry
// below *is* the Hollow of the Kneeling Stone, and the next realm's is its own
// shape entirely. The descriptor names a kind and where to stand it; this file
// knows how to build each kind.
//
// A gate's `landmark` is its hero silhouette — one per gate, and the thing the
// title-card camera drifts across. A gate may *also* author a `landmarks`
// array of ordinary placements through the same builder, which is how a gate
// composes a place out of several deliberately positioned structures rather
// than one monument. See `Level._buildLandmarks`.

import * as THREE from 'three';
import { P } from './palette.js';
import { toonMaterial, glowMaterial } from './toon.js';

/**
 * The Kneeling Stone: a colossus knelt behind the Warden's arena, head bowed.
 * The gate is named after it because it is the one silhouette you can see from
 * the entrance.
 */
function kneelingStone() {
  const g = new THREE.Group();
  // Light enough to stay legible as stone at distance. The colossus is
  // backlit from the play plane, and darker values collapsed it into one
  // black mass against the ridges instead of a readable silhouette.
  const stone = toonMaterial({ color: 0x7a7189, steps: 3, rim: 0.45, rimColor: P.violetGlow });
  const stoneDark = toonMaterial({ color: 0x574f66, steps: 3, rim: 0.3, rimColor: P.violetGlow });

  const add = (w, h, d, x, y, z, m = stone) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };

  // Knelt: one shin flat along the ground, the other knee up.
  add(11, 3.2, 9, 0, 1.6, 0, stoneDark);          // planted shin
  add(5.5, 9, 6.5, 5, 5.6, 0, stoneDark);          // raised thigh
  add(13, 11, 10, -2, 9.5, 0);                     // torso
  add(9.5, 4, 8, -1, 16.4, 0, stoneDark);          // shoulders
  const head = add(6, 6, 6, 1.5, 20.5, 0);
  head.rotation.z = -0.32;                          // bowed
  // An arm resting across the raised knee.
  const arm = add(3.6, 11, 3.6, 4.5, 12, 2.6);
  arm.rotation.z = 0.55;

  // The face is a blank plate with one dead violet slit.
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.5), glowMaterial({ color: P.violetDeep }));
  slit.position.set(4.6, 19.6, 0);
  slit.rotation.set(0, Math.PI / 2, -0.32);
  g.add(slit);

  return g;
}

/**
 * A colossal die, tipped onto one edge among broken pillar stumps — the
 * Sabha hall's own silhouette, at the scale Shakuni's signature weapon would
 * read as across an arena. Gate 1 no longer climbs past its landmark the way
 * the old Kneeling Stone build did, so this one is seen from a mostly-flat
 * approach rather than a shape the traversal passes.
 */
function fallenDie() {
  const g = new THREE.Group();
  const stone = toonMaterial({ color: 0x8f8a76, steps: 3, rim: 0.4, rimColor: P.shakuniGold });
  const stoneDark = toonMaterial({ color: 0x635e4d, steps: 3, rim: 0.3, rimColor: P.shakuniGold });
  const pipMat = toonMaterial({ color: 0x7a1f2c, steps: 2, rim: 0.2, rimColor: P.crimson });

  const add = (parent, w, h, d, x, y, z, m = stone) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // Broken pillar stumps it rests among — the hall's own ruin.
  add(g, 2.2, 4, 2.2, -8, 2, -3, stoneDark);
  add(g, 2.0, 2.6, 2.0, 7, 1.3, -4, stoneDark);

  // The die: a group rather than a raw mesh, so the pips below are children
  // in its own local space and tip with it — tipped onto one edge, so it
  // reads as fallen rather than displayed.
  const die = new THREE.Group();
  die.position.set(0, 5.4, 0);
  die.rotation.set(0.46, 0.6, 0.26);
  g.add(die);

  add(die, 9, 9, 9, 0, 0, 0, stone);

  // Five pips on one visible face — legible as "a die" at this distance,
  // not a literal readable roll.
  const half = 4.56;
  for (const [px, py] of [[-2, 2], [2, 2], [0, 0], [-2, -2], [2, -2]]) {
    add(die, 1.0, 1.0, 0.14, px, py, half, pipMat);
  }

  return g;
}

const KINDS = {
  'kneeling-stone': kneelingStone,
  'fallen-die': fallenDie,
};

/** Build a gate's landmark by kind. Unknown kinds are a descriptor error. */
export function buildLandmark(kind) {
  const build = KINDS[kind];
  if (!build) throw new Error(`unknown landmark: ${kind}`);
  return build();
}
