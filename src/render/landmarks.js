// The one silhouette a gate is remembered by.
//
// A landmark is scenery and never a fight. It is built here rather than in
// `Level` because it is the most gate-specific thing a gate has: the geometry
// below *is* the Hollow of the Kneeling Stone, and the next realm's is its own
// shape entirely. The descriptor names a kind and where to stand it; this file
// knows how to build each kind.

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

const KINDS = {
  'kneeling-stone': kneelingStone,
};

/** Build a gate's landmark by kind. Unknown kinds are a descriptor error. */
export function buildLandmark(kind) {
  const build = KINDS[kind];
  if (!build) throw new Error(`unknown landmark: ${kind}`);
  return build();
}
