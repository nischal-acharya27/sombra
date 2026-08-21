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

// ---------------------------------------------------------------------------
// Gokul, Asleep — gate 10's household
//
// The kinds below are the first landmarks authored as a *set* rather than as
// one monument. Gate 10's rebuild needed a vocabulary that could say "the well
// stands beside the gatepost" and "a lamp burns at the foot of the stair",
// because a household only reads as a household when its parts stand in a
// deliberate relation to each other (`docs/DECISIONS.md` § "Gate 10's rebuild
// opens one authoring seam"). Five kinds carry the whole gate: a house, a
// well, a lamp stand, a shrine and a cradle. Where a sixth was tempting, a
// placement's `rotY`/`scale` was the cheaper answer — the byre behind the
// courtyard is `gokul-house` turned and shrunk, not its own geometry.
//
// All of it is scenery with no collision. `Level.solids` comes from `segments`
// alone, so nothing here can be stood on or walked into: these make the gate's
// segments read as a place, and the segments remain the place itself.
//
// Every kind is a pure builder — geometry once, at gate construction, and no
// per-frame behaviour whatsoever, so none of them can spend the run's random
// stream.

/**
 * Box helper for the household kinds. The two kinds above each grew their own
 * local `add`; five kinds sharing one silhouette language share one instead.
 */
function addBox(parent, w, h, d, x, y, z, m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * The household's materials. Built per call, the same as the kinds above do,
 * rather than cached at module scope: a landmark is constructed once per gate
 * build and never again, so there is nothing here for a cache to save.
 *
 * Every surface rims `amber` rather than the default `skyFill`. Gate 10 is a
 * village at night lit from the ground up by oil lamps, and a cold sky rim on
 * a mud wall is the single detail that would undo that read.
 */
function householdMaterials() {
  return {
    thatch: toonMaterial({ color: P.gokulThatch, steps: 3, rim: 0.4, rimColor: P.amber }),
    thatchDark: toonMaterial({ color: P.gokulThatchDark, steps: 3, rim: 0.28, rimColor: P.amber }),
    mud: toonMaterial({ color: P.gokulMud, steps: 3, rim: 0.34, rimColor: P.amber }),
    mudDark: toonMaterial({ color: P.gokulMudDark, steps: 3, rim: 0.24, rimColor: P.amber }),
    timber: toonMaterial({ color: P.gokulTimber, steps: 3, rim: 0.3, rimColor: P.amber }),
    cloth: toonMaterial({ color: P.gokulCloth, steps: 3, rim: 0.36, rimColor: P.amber }),
    tulsi: toonMaterial({ color: P.gokulTulsi, steps: 3, rim: 0.3, rimColor: P.amber }),
    flame: glowMaterial({ color: P.amber }),
    // Faint on purpose. The composited bloom pass is what turns this into a
    // lamp; at a readable opacity it renders as a solid amber gem sitting on
    // top of the flame instead of light coming off it.
    lampGlow: glowMaterial({ color: P.amber, opacity: 0.22, transparent: true, depthWrite: false }),
  };
}

/** A lamp's flame plus the bloom around it — no shadow, it is the light. */
function addFlame(parent, M, x, y, z, s = 1) {
  const flame = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.5 * s, 0.26 * s), M.flame);
  flame.position.set(x, y, z);
  parent.add(flame);
  const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 * s, 0), M.lampGlow);
  halo.position.set(x, y, z);
  parent.add(halo);
}

/**
 * A Gokul house: mud-brick walls under a thatched gable, with a veranda along
 * the front. The gate's repeated mass — one of these is the household the
 * hunter climbs the side of, a second turned and scaled down is the cattle
 * byre behind the courtyard.
 *
 * Built around its own base at y 0 so a placement sets `y` to the segment top
 * it stands on. The veranda runs toward +z in local space; the gate places the
 * whole group at negative z, behind the play plane, per the scenery rule.
 */
function gokulHouse() {
  const g = new THREE.Group();
  const M = householdMaterials();

  addBox(g, 12.8, 0.7, 8.6, 0, 0.35, 0, M.mudDark);   // plinth, packed earth
  addBox(g, 12, 5, 8, 0, 3.2, 0, M.mud);              // walls

  // A dark doorway and two shuttered windows, each with a lamp burning behind
  // it. The house is asleep, not empty — that is the whole tone of the gate.
  // Kept low on the wall on purpose: the veranda's shade roof cuts the front
  // face off above roughly y 4.6 from the camera's side, so an opening any
  // higher is an opening nobody ever sees.
  addBox(g, 2.2, 3.4, 0.4, -1.6, 2.4, 3.95, M.mudDark);
  for (const wx of [2.8, 5.2]) addBox(g, 1.3, 1.3, 0.4, wx, 3.6, 3.95, M.mudDark);

  // The thatched gable: two slabs meeting over a ridge that runs along the
  // house's length, so the roofline reads from the camera's own side rather
  // than end-on. The eaves overhang the walls, which is what keeps a box of
  // mud from reading as a box.
  const front = addBox(g, 13.6, 0.7, 5.6, 0, 5.9, 2.2, M.thatch);
  front.rotation.x = 0.46;
  const back = addBox(g, 13.6, 0.7, 5.6, 0, 5.9, -2.2, M.thatch);
  back.rotation.x = -0.46;
  addBox(g, 13.8, 0.8, 1.4, 0, 7.15, 0, M.thatchDark);   // ridge cap

  // The veranda: four timber posts and a lower shade roof over them, with a
  // lamp hung on the two inner posts. The lamps go here rather than inside the
  // windows because a window is a 1.3-unit hole on a 12-unit wall seen from
  // across a courtyard — the light has to be on the outside of the house to
  // be light the hunter can actually see the house by.
  for (const px of [-5.4, -1.8, 1.8, 5.4]) addBox(g, 0.45, 3.6, 0.45, px, 1.8, 5.6, M.timber);
  for (const px of [-1.8, 1.8]) addFlame(g, M, px, 3.1, 5.85, 0.85);
  const shade = addBox(g, 12.6, 0.5, 3.6, 0, 4.1, 5.4, M.thatchDark);
  shade.rotation.x = 0.3;

  return g;
}

/**
 * The courtyard well: a mud kerb ring under a timber hoist, the bucket still
 * hanging where it was left. The gate's one piece of scenery that says a
 * household lived here at all hours and then stopped.
 */
function gokulWell() {
  const g = new THREE.Group();
  const M = householdMaterials();

  // Eight kerb blocks laid tangentially around the mouth — a ring out of box
  // primitives, the same trick the rest of the game builds curves with.
  const R = 1.7;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const block = addBox(g, 1.5, 1.2, 0.7, Math.cos(a) * R, 0.6, Math.sin(a) * R, M.mud);
    block.rotation.y = -a - Math.PI / 2;
  }
  addBox(g, 2.4, 0.2, 2.4, 0, 0.95, 0, M.mudDark);   // still, dark water

  addBox(g, 0.35, 3.2, 0.35, -1.5, 1.6, 0, M.timber);
  addBox(g, 0.35, 3.2, 0.35, 1.5, 1.6, 0, M.timber);
  addBox(g, 3.6, 0.3, 0.3, 0, 3.3, 0, M.timber);     // crossbeam
  addBox(g, 0.1, 1.3, 0.1, 0, 2.5, 0, M.timber);     // rope
  addBox(g, 0.7, 0.7, 0.7, 0, 1.5, 0, M.timber);     // bucket, mid-draw

  return g;
}

/**
 * An oil-lamp stand. The smallest kind and the most repeated: gate 10 lights
 * its own path with these, which is what lets the household be legible at all
 * under a realm whose sky contributes almost nothing.
 *
 * Deliberately no light source attached — this is a lit shape, not a lamp the
 * renderer pays for, and a gate's worth of real point lights is a cost a
 * static scene has no reason to carry.
 */
function gokulLamp() {
  const g = new THREE.Group();
  const M = householdMaterials();

  addBox(g, 0.9, 0.3, 0.9, 0, 0.15, 0, M.mudDark);   // footing
  addBox(g, 0.34, 2.2, 0.34, 0, 1.35, 0, M.timber);  // shaft
  addBox(g, 0.85, 0.3, 0.85, 0, 2.6, 0, M.mud);      // oil bowl
  addFlame(g, M, 0, 3.0, 0);

  return g;
}

/**
 * The tulsi shrine: a stepped mud plinth with basil growing out of it and a
 * lamp burning at its foot. A threshold marker — the household's own way of
 * saying you have arrived somewhere, and the one green, living thing in a
 * gate the stopped Wheel has left asleep.
 */
function gokulShrine() {
  const g = new THREE.Group();
  const M = householdMaterials();

  addBox(g, 2.6, 0.7, 2.6, 0, 0.35, 0, M.mudDark);
  addBox(g, 2.1, 0.8, 2.1, 0, 1.1, 0, M.mud);
  addBox(g, 1.5, 0.9, 1.5, 0, 1.95, 0, M.mud);       // the pot itself

  addBox(g, 0.22, 1.0, 0.22, 0, 2.9, 0, M.timber);   // stem
  addBox(g, 1.5, 0.6, 1.2, 0, 3.4, 0, M.tulsi);      // leaf mass
  addBox(g, 0.9, 0.5, 0.9, 0.4, 3.85, -0.2, M.tulsi);
  addBox(g, 0.8, 0.45, 0.8, -0.5, 3.7, 0.25, M.tulsi);

  addFlame(g, M, 1.5, 0.9, 1.0, 0.8);

  return g;
}

/**
 * The nursery cradle: a cloth sling hung from a timber frame, hanging still.
 *
 * It is empty, and it stays empty. Putana's respectful-treatment note
 * (`docs/research/villain-roster.md`) rules out staging a feeding tableau
 * anywhere in this gate, and that constraint is a geometry decision here
 * rather than a caution applied afterwards: there is no infant in this rig, no
 * figure beside it, and no pose for either to be in. What the hunter finds in
 * the nursery is a cradle nobody is rocking — which is the gate's whole
 * argument about a Wheel that has stopped, and says more than an occupant
 * would.
 */
function gokulCradle() {
  const g = new THREE.Group();
  const M = householdMaterials();

  addBox(g, 0.3, 2.6, 0.3, -1.6, 1.3, 0, M.timber);
  addBox(g, 0.3, 2.6, 0.3, 1.6, 1.3, 0, M.timber);
  addBox(g, 3.8, 0.3, 0.3, 0, 2.6, 0, M.timber);     // hanger beam
  addBox(g, 0.09, 1.1, 0.09, -1.1, 1.9, 0, M.timber);
  addBox(g, 0.09, 1.1, 0.09, 1.1, 1.9, 0, M.timber);

  // The sling, hung level. Nothing in this file animates, so a tilt would read
  // as a cradle frozen mid-swing rather than one at rest; level is the pose
  // that stays honest about a gate where nothing is moving.
  //
  // Built hollow — a floor and four low walls rather than one solid block —
  // because the emptiness is the point and a solid box hides it. The hunter
  // has to be able to see that there is nothing inside.
  addBox(g, 2.4, 0.18, 1.1, 0, 1.16, 0, M.cloth);
  addBox(g, 2.4, 0.4, 0.14, 0, 1.42, 0.48, M.cloth);
  addBox(g, 2.4, 0.4, 0.14, 0, 1.42, -0.48, M.cloth);
  addBox(g, 0.14, 0.4, 1.1, 1.13, 1.42, 0, M.cloth);
  addBox(g, 0.14, 0.4, 1.1, -1.13, 1.42, 0, M.cloth);

  return g;
}

/**
 * Pragjyotishapura's materials — basalt, prison iron, and one burning brazier.
 *
 * This is the first landmark set built after the no-asset-files rule was lifted
 * (`docs/DECISIONS.md`), and the two textures it asks for are the reason the
 * fortress can be basalt at all: `stone.basalt` puts columnar fracture into a
 * wall that would otherwise be a flat brown box at this scale, and `iron.plate`
 * puts rivets and panel seams into the cages. Both are multiply maps over the
 * material's own colour, which is why one grain file serves the warm wall and
 * the cold cage without a second asset.
 *
 * If neither file is present, `toonMaterial` resolves `map` to null and every
 * surface below falls back to the flat cel colour the rest of the game uses.
 * That is a supported configuration, not a degraded one — nothing here carries
 * meaning that lives only in a texture.
 */
function fortressMaterials() {
  return {
    basalt: toonMaterial({ color: P.bhaumaStone, steps: 3, rim: 0.32, rimColor: P.bhaumaEmber, map: 'stone.basalt' }),
    basaltDark: toonMaterial({ color: P.bhaumaStoneDark, steps: 3, rim: 0.22, rimColor: P.bhaumaEmber, map: 'stone.basalt' }),
    // Finer tiling on the small stuff: a merlon is a fifth the size of a wall,
    // and the same repeat on both makes the small piece look like a decal of
    // the big one. Two manifest entries rather than a runtime clone — a clone
    // costs eight `Math.random()` draws.
    basaltFine: toonMaterial({ color: P.bhaumaStone, steps: 3, rim: 0.3, rimColor: P.bhaumaEmber, map: 'stone.basalt.fine' }),
    iron: toonMaterial({ color: P.pragIron, steps: 3, rim: 0.35, rimColor: P.skyFill, map: 'iron.plate' }),
    ironDark: toonMaterial({ color: P.pragIronDark, steps: 3, rim: 0.2, rimColor: P.skyFill }),
    // Bare — bars are thin, and a rivet pattern on a 0.18-unit rod is noise.
    bar: toonMaterial({ color: P.pragIron, steps: 2, rim: 0.5, rimColor: P.skyFill }),
    gold: toonMaterial({ color: P.devaGold, steps: 3, rim: 0.6, rimColor: P.amber }),
  };
}

/**
 * A captive cell: a basalt cell-block with an iron-barred front.
 *
 * The gate's repeated unit and the thing its story is about — Narakasura's
 * roster entry ends on the captives being freed, so the cells have to be
 * somewhere the hunter actually walks past rather than a line of dialogue.
 * Placed through `landmarks` (plural) at authored positions, several times
 * over, which is the seam gate 10 opened.
 *
 * Empty, and deliberately so. Nothing in this game renders a person in a cage:
 * the cells read as held space, and the liberation lands in the cleared beats.
 */
function pragCell() {
  const g = new THREE.Group();
  const M = fortressMaterials();

  addBox(g, 7, 0.6, 5, 0, 0.3, 0, M.basaltDark);   // plinth
  addBox(g, 7, 5.4, 5, 0, 3.3, -0.9, M.basalt);    // the block itself
  addBox(g, 7.4, 0.5, 5.4, 0, 6.2, -0.9, M.basaltDark); // cap course

  // The barred face, set into a recessed iron frame. Bars run floor to lintel
  // with a mid-rail across, which is what stops them reading as a fence.
  addBox(g, 5.6, 4.6, 0.5, 0, 2.9, 1.5, M.ironDark);
  for (let i = -3; i <= 3; i++) addBox(g, 0.18, 4.2, 0.18, i * 0.8, 2.9, 1.75, M.bar);
  addBox(g, 5.4, 0.2, 0.22, 0, 2.9, 1.78, M.bar);
  addBox(g, 5.8, 0.42, 0.6, 0, 5.3, 1.5, M.iron);  // lintel

  return g;
}

/**
 * The gate tower: Pragjyotishapura's hero silhouette, and the shape the
 * title-card camera drifts across.
 *
 * Basalt raised in stepped courses rather than one shaft, so it reads as
 * something the earth pushed up in layers — his entry's "nothing here was
 * built, it was told to stand". The ember seam up the spine is the same
 * passive `bhaumaEmber` accent his rig carries, and like the rig's it is
 * ambient: it never flares, because the only flare in this gate that means
 * anything is the amber at his spearhead.
 */
function pragGateTower() {
  const g = new THREE.Group();
  const M = fortressMaterials();

  const courses = [
    [16, 5, 11, 0, 2.5],
    [14, 6, 10, 0, 7.8],
    [12, 7, 9, 0, 14.2],
    [9.5, 6.5, 8, 0, 21],
  ];
  for (const [w, h, d, x, y] of courses) addBox(g, w, h, d, x, y, 0, M.basalt);
  for (const [w, , d, x, y] of courses) addBox(g, w + 0.7, 0.6, d + 0.7, x, y + 3.4, 0, M.basaltDark);

  // Merlons along the top course — the rampart read, at the scale the
  // silhouette needs it.
  for (let i = -3; i <= 3; i++) addBox(g, 0.9, 1.6, 1.4, i * 1.35, 25.4, 0, M.basaltFine);

  // The arch: a dark opening under the lowest course, framed in iron. The one
  // place the tower reads as a door rather than a cliff.
  addBox(g, 4.2, 5, 0.6, 0, 2.4, 5.4, M.ironDark);
  addBox(g, 5, 0.5, 0.9, 0, 5.1, 5.4, M.iron);
  for (const side of [-1, 1]) addBox(g, 0.6, 5, 0.9, side * 2.3, 2.4, 5.4, M.iron);

  // The ember seam, up the spine of the tower. Passive.
  for (let i = 0; i < 5; i++) {
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 2.2), glowMaterial({ color: P.bhaumaEmber, transparent: true, opacity: 0.4 }));
    crack.position.set(-4.4 + i * 0.3, 3 + i * 4.6, 4.6);
    crack.rotation.z = 0.22 * (i % 2 ? 1 : -1);
    g.add(crack);
  }

  return g;
}

/**
 * A rampart brazier. Stone bowl on a plinth, burning amber.
 *
 * Does the same job gate 10's lamps do at the roof gaps: a light standing just
 * past a landing lip, so a jump at night aims at something instead of guessing
 * at a dark edge. Scenery, never a fight, and never a telegraph — it borrows
 * the shared `amber` the same way gate 10's lamps do, and for the same reason
 * that costs the hunter nothing.
 */
function pragBrazier() {
  const g = new THREE.Group();
  const M = fortressMaterials();

  addBox(g, 1.5, 0.4, 1.5, 0, 0.2, 0, M.basaltDark);
  addBox(g, 0.7, 2.2, 0.7, 0, 1.4, 0, M.basaltFine);
  addBox(g, 1.9, 0.7, 1.9, 0, 2.8, 0, M.iron);
  addFlame(
    g,
    {
      flame: glowMaterial({ color: P.amber, transparent: true, opacity: 0.9 }),
      lampGlow: glowMaterial({ color: P.amber, transparent: true, opacity: 0.11, depthWrite: false }),
    },
    0,
    3.3,
    0,
    1.15
  );

  return g;
}

const KINDS = {
  'kneeling-stone': kneelingStone,
  'fallen-die': fallenDie,
  'gokul-house': gokulHouse,
  'gokul-well': gokulWell,
  'gokul-lamp': gokulLamp,
  'gokul-shrine': gokulShrine,
  'gokul-cradle': gokulCradle,
  'prag-cell': pragCell,
  'prag-gate-tower': pragGateTower,
  'prag-brazier': pragBrazier,
};

/** Build a gate's landmark by kind. Unknown kinds are a descriptor error. */
export function buildLandmark(kind) {
  const build = KINDS[kind];
  if (!build) throw new Error(`unknown landmark: ${kind}`);
  return build();
}
