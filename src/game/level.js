// Level 1 — "Hollow of the Kneeling Stone".
//
// The whole gate is authored as data at the bottom of this file: a list of
// solid boxes and a list of encounters. Everything else here turns that data
// into geometry and answers collision queries.
//
// Collision is AABB-only in the XY plane. The game is 2.5D — Z carries depth
// for the camera and the art, and nothing else. Keeping the simulation planar
// is what makes attack ranges and jump arcs tunable by hand.

import * as THREE from 'three';
import { P } from '../render/palette.js';
import { toonMaterial, glowMaterial, outlineFor } from '../render/toon.js';
import { GrassField, scatterGrass, makeRock, makeCrystal, makeTree, makeMist, buildBackdrop } from '../render/env.js';
import { rand, randInt } from '../engine/mathx.js';

export const VOID_Y = -26; // below this you have fallen out of the world

export class Level {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    /** @type {{x0:number,x1:number,y0:number,y1:number}[]} */
    this.solids = [];
    /** Barriers raised during an encounter and dropped when it is cleared. */
    this.barriers = [];
    this.props = [];
    this.time = 0;

    this._build();
  }

  // -- queries -------------------------------------------------------------

  /** Every solid currently blocking movement, including raised barriers. */
  activeSolids() {
    if (!this.barriers.some((b) => b.active)) return this.solids;
    return this.solids.concat(this.barriers.filter((b) => b.active));
  }

  /** Highest solid top under x, at or below `fromY`. Used for spawning and AI. */
  groundAt(x, fromY = 200) {
    let best = -Infinity;
    for (const s of this.solids) {
      if (x < s.x0 || x > s.x1) continue;
      if (s.y1 <= fromY + 0.001 && s.y1 > best) best = s.y1;
    }
    return best;
  }

  /** Is there floor within `probe` below (x, y)? Keeps walkers off ledges. */
  hasFloorAhead(x, y, probe = 2.4) {
    const g = this.groundAt(x, y + 0.2);
    return g > -Infinity && y - g < probe;
  }

  // -- construction --------------------------------------------------------

  _build() {
    const grassPoints = [];
    const rockMat = toonMaterial({ color: P.rock, steps: 4, rim: 0.22 });
    const rockDarkMat = toonMaterial({ color: P.rockDark, steps: 3, rim: 0.16 });
    const grassMat = toonMaterial({ color: P.grassLight, steps: 4, rim: 0.2 });

    for (const seg of SEGMENTS) {
      const { x0, x1, top } = seg;
      const w = x1 - x0;
      const cx = (x0 + x1) / 2;
      const depth = seg.depth ?? 6;
      const bodyH = seg.thickness ?? 5;

      this.solids.push({ x0, x1, y0: top - bodyH, y1: top });

      // Grass cap sits proud of the rock body so the two never z-fight.
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, depth), seg.barren ? rockMat : grassMat);
      cap.position.set(cx, top - 0.25, 0);
      cap.receiveShadow = true;
      cap.castShadow = true;
      this.group.add(cap);

      const body = new THREE.Mesh(new THREE.BoxGeometry(w * 0.985, bodyH, depth * 0.96), rockMat);
      body.position.set(cx, top - 0.5 - bodyH / 2, 0);
      body.receiveShadow = true;
      body.castShadow = true;
      this.group.add(body);

      // A darker, narrower plinth reading as the cliff continuing into shadow.
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 9, depth * 0.7), rockDarkMat);
      plinth.position.set(cx, top - 0.5 - bodyH - 4.5, 0);
      this.group.add(plinth);

      if (!seg.barren) scatterGrass(grassPoints, { x: cx, y: top - 0.02, w, d: depth * 0.82 });

      // Edge rocks break up the box silhouette at the ends of every platform.
      // Everything decorative lives at negative Z. The camera sits at +Z, so a
      // prop in front of the play plane is a prop that hides the fight.
      for (const ex of [x0 + 0.6, x1 - 0.6]) {
        const r = makeRock(rand(0.3, 0.6), { color: P.rock });
        r.position.set(ex, top - 0.25, rand(-depth * 0.4, -depth * 0.1));
        r.rotation.y = rand(0, 3);
        this.group.add(r);
      }

      this._dress(seg, grassPoints);
    }

    this._buildStatue();
    this._buildGateArch();

    this.grass = new GrassField(grassPoints);
    this.group.add(this.grass.mesh);

    buildBackdrop(this.scene, { from: -20, to: LEVEL_END + 40 });

    // Mist sheets in front of and behind the play plane, for depth.
    for (let x = -10; x < LEVEL_END + 20; x += 46) {
      const back = makeMist(60, 26, { opacity: 0.05 });
      back.position.set(x, 6, -22);
      this.group.add(back);
      const front = makeMist(60, 14, { opacity: 0.045, color: P.skyHorizon });
      front.position.set(x + 20, -2, 12);
      this.group.add(front);
    }

    this._buildBarriers();
  }

  /** Per-segment scatter: trees, crystals, boulders, ruins. */
  _dress(seg, grassPoints) {
    const { x0, x1, top } = seg;
    const depth = seg.depth ?? 6;

    for (let i = 0; i < (seg.trees ?? 0); i++) {
      const t = makeTree(rand(4, 7));
      t.position.set(rand(x0 + 2, x1 - 2), top - 0.4, rand(-depth * 0.42, -depth * 0.2));
      t.rotation.y = rand(0, 6);
      this.group.add(t);
    }

    for (let i = 0; i < (seg.crystals ?? 0); i++) {
      const c = makeCrystal(rand(0.7, 1.9));
      c.position.set(rand(x0 + 1.5, x1 - 1.5), top - 0.4, rand(-depth * 0.45, -depth * 0.12));
      c.rotation.y = rand(0, 6);
      this.group.add(c);
    }

    for (let i = 0; i < (seg.boulders ?? 0); i++) {
      const r = makeRock(rand(0.45, 1.0), { color: rand() > 0.5 ? P.rock : P.rockMoss });
      r.position.set(rand(x0 + 1.5, x1 - 1.5), top - 0.2, rand(-depth * 0.45, -depth * 0.14));
      r.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      this.group.add(r);
    }

    // Broken pillars: the gate was somebody's temple once.
    for (let i = 0; i < (seg.pillars ?? 0); i++) {
      const h = rand(2, 5.5);
      const px = rand(x0 + 2, x1 - 2);
      const pz = rand(-depth * 0.4, -depth * 0.15);
      const geo = new THREE.CylinderGeometry(0.42, 0.5, h, 6);
      const pillar = new THREE.Mesh(geo, toonMaterial({ color: P.stoneCarved, steps: 3, rim: 0.25 }));
      pillar.position.set(px, top + h / 2 - 0.3, pz);
      pillar.rotation.y = rand(0, 6);
      pillar.rotation.z = rand(-0.09, 0.09);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);
      const o = outlineFor(geo, 0.03);
      o.position.copy(pillar.position);
      o.rotation.copy(pillar.rotation);
      this.group.add(o);
      scatterGrass(grassPoints, { x: px, y: top - 0.02, w: 2.4, d: 2, density: 12 });
    }
  }

  /**
   * The Kneeling Stone: a colossus knelt behind the boss arena, head bowed.
   * It is scenery, not a fight — the level is named after it because it is the
   * one silhouette you can see from the entrance.
   */
  _buildStatue() {
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

    g.position.set(STATUE_X, -0.5, -19);
    g.rotation.y = -0.42;
    this.scene.add(g);
    this.statue = g;
  }

  /** The way out. Lights up only once the Guardian is down. */
  _buildGateArch() {
    const g = new THREE.Group();
    const stone = toonMaterial({ color: P.stoneCarved, steps: 3, rim: 0.3 });

    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.6), stone);
      leg.position.set(side * 3.2, 4.5, 0);
      leg.castShadow = true;
      g.add(leg);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.4, 1.5, 2), stone);
    lintel.position.y = 9.7;
    lintel.castShadow = true;
    g.add(lintel);

    const portal = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 8.6),
      new THREE.MeshBasicMaterial({
        color: P.cyan,
        transparent: true,
        opacity: 0,
        fog: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    portal.position.set(0, 4.6, 0);
    g.add(portal);
    this.portal = portal;

    g.position.set(EXIT_X, ARENA_TOP, -1.5);
    this.group.add(g);
    this.gateArch = g;
  }

  /** Invisible walls that seal an arena while its encounter is live. */
  _buildBarriers() {
    for (const enc of ENCOUNTERS) {
      if (!enc.lock) continue;
      const [x0, x1] = enc.lock;
      for (const x of [x0, x1]) {
        const barrier = {
          x0: x - 0.6,
          x1: x + 0.6,
          y0: -10,
          y1: 40,
          active: false,
          mesh: null,
          encounter: enc.id,
        };
        // A visible shimmer, so a wall you cannot pass is a wall you can see.
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 14),
          new THREE.MeshBasicMaterial({
            color: P.violet,
            transparent: true,
            opacity: 0,
            fog: false,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
          })
        );
        mesh.position.set(x, this.groundAt(x) + 6, 0);
        mesh.rotation.y = Math.PI / 2;
        this.group.add(mesh);
        barrier.mesh = mesh;
        this.barriers.push(barrier);
      }
    }
  }

  setBarriers(encounterId, active) {
    for (const b of this.barriers) {
      if (b.encounter === encounterId) b.active = active;
    }
  }

  update(dt, t) {
    this.time = t;
    this.grass.update(t);
    for (const b of this.barriers) {
      const target = b.active ? 0.22 + Math.sin(t * 6) * 0.06 : 0;
      b.mesh.material.opacity += (target - b.mesh.material.opacity) * Math.min(1, dt * 8);
    }
  }

  openExit() {
    this.portal.material.opacity = 0.001; // animated up by the game
  }
}

// ---------------------------------------------------------------------------
// Level data
// ---------------------------------------------------------------------------

export const ARENA_TOP = 3;
export const STATUE_X = 172;
export const EXIT_X = 196;
export const LEVEL_END = 204;
export const SPAWN_X = 4;

/**
 * Solid ground, left to right. Gaps between segments are real gaps — the
 * traversal beats of the level are the spaces this list leaves out.
 */
const SEGMENTS = [
  // Approach: wide, safe, nothing to fight. Room to learn the controls.
  { x0: -6, x1: 30, top: 0, trees: 3, crystals: 2, boulders: 3, pillars: 2 },

  // First blood — a shallow bowl you cannot leave until it is clear.
  { x0: 34, x1: 68, top: 0, trees: 2, boulders: 4, crystals: 1, pillars: 1 },

  // The climb. Three steps, each a committed jump.
  { x0: 72, x1: 80, top: 1.6, boulders: 1, crystals: 1 },
  { x0: 84, x1: 91, top: 3.4, boulders: 1 },
  { x0: 95, x1: 103, top: 5.2, crystals: 2, boulders: 1 },

  // The chasm: small islands over the void, patrolled by wisps.
  //
  // Gaps are 3.8. A crossing therefore needs 4.5 of the measured 6.08-unit
  // running jump — about a third in reserve. That reserve is the whole point:
  // at 4.5-unit gaps the margin was 4%, which meant the jump had to start
  // within a few centimetres of the lip, and both scripted bots died there
  // repeatedly. The drop below is what makes the chasm read as dangerous;
  // the gap width only decides whether it is *fair*.
  { x0: 106.8, x1: 111.8, top: 5.2, barren: true, depth: 5 },
  { x0: 115.6, x1: 120.6, top: 6.4, barren: true, depth: 5 },
  { x0: 124.4, x1: 129.4, top: 5.0, barren: true, depth: 5 },

  // The bridge, and the ambush on it.
  { x0: 133.2, x1: 162, top: 4.2, boulders: 3, pillars: 3, crystals: 2, trees: 1 },

  // Boss arena — long, flat, no cover, nowhere to run.
  { x0: 166, x1: 204, top: ARENA_TOP, depth: 9, boulders: 2, pillars: 2, thickness: 6 },
];

/**
 * Encounters. `lock` seals the arena between two x positions until every
 * spawned enemy is dead.
 */
export const ENCOUNTERS = [
  {
    id: 'first-blood',
    trigger: 40,
    lock: [35, 67],
    // The one rule the whole combat design rests on, stated once, the first
    // time the player meets something that can hurt them — and stated *in the
    // intro window*, not after it.
    //
    // It used to be a second window: 37 words, opening at 1.7 s, for 4.2 s.
    // Beasts spawn at 0 s, 0.5 s and 1.4 s, so it arrived with all three
    // already on the player and left before any of them was dead. Round 3:
    // "too much text, for a short period of time... reading the texts while
    // fighting them is not very feasible." A rule nobody can read is a rule
    // nobody was taught, and if you believe touching a beast hurts, crowding
    // reads as chip damage, backing off reads as correct, and the fight you are
    // actually being offered never starts.
    //
    // One line, on screen from 0 s, short enough to take in at a glance.
    intro: {
      title: 'THREAT DETECTED',
      body: 'Shadow Beast × 3',
      note: 'Their bodies cannot harm you — only the <b>pounce</b>, and it announces itself.',
    },
    spawns: [
      { type: 'beast', x: 52, delay: 0 },
      { type: 'beast', x: 60, delay: 0.5 },
      { type: 'beast', x: 46, delay: 1.4 },
    ],
  },
  {
    id: 'the-chasm',
    trigger: 105,
    // No lock: the chasm's threat is the fall, not the fight.
    spawns: [
      // Spawn altitude is the wisp's home altitude, and it only ranges a few
      // units either side of it — so these have to sit near where the hunter
      // will actually be, not far overhead.
      // Positioned over the *islands*, not the gaps. A wisp hovering above a
      // gap baits the player into jumping at it instead of across, and the
      // punishment for taking that bait is the void. Fights belong on floor.
      { type: 'wisp', x: 109.3, y: 7.0, delay: 0 },
      { type: 'wisp', x: 118.1, y: 8.2, delay: 0.3 },
      { type: 'wisp', x: 126.9, y: 6.8, delay: 0.9 },
    ],
  },
  {
    id: 'the-bridge',
    trigger: 136,
    lock: [134, 161],
    intro: { title: 'AMBUSH', body: 'Shadow Beast × 4  ·  Wisp × 2' },
    // Six enemies, but spread over seven seconds rather than dropped at once.
    // Arriving together, four beasts pounce often enough to out-damage the
    // hunter's entire health bar before the first one dies; arriving in waves,
    // the same six are a fight you can actually work through. The count is the
    // spectacle, the spacing is the difficulty.
    // Spawns stay clear of the arena barriers at 134 and 161. A body that
    // materialises overlapping one has to be ejected by the collision solver,
    // and "wherever the solver puts it" is not a spawn point.
    spawns: [
      { type: 'beast', x: 147, delay: 0 },
      { type: 'beast', x: 155, delay: 1.4 },
      { type: 'wisp', x: 151, y: 6.2, delay: 2.8 },
      { type: 'beast', x: 141, delay: 4.2 },
      { type: 'wisp', x: 145, y: 6.6, delay: 5.6 },
      { type: 'beast', x: 157, delay: 7.0 },
    ],
  },
  {
    id: 'guardian',
    trigger: 172,
    lock: [167, 203],
    boss: true,
    intro: { title: 'GATE BOSS', body: 'GATE GUARDIAN' },
    spawns: [{ type: 'guardian', x: 190, delay: 0.9 }],
  },
];
