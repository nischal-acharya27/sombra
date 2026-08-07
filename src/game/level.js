// A gate, built.
//
// This class takes a gate descriptor — see `src/game/gates/` — and turns its
// segments into geometry, its encounters into barriers and its realm into
// materials. It holds nothing that belongs to one gate: every number below is
// read from `this.gate`, which is what makes a second gate content rather than
// code.
//
// **Everything it builds hangs off `this.group`**, including the backdrop and
// the landmark, which used to go straight into the scene. That is what makes a
// gate something the campaign can switch off in one assignment — and switching
// gates has to cost nothing, because every mesh three.js builds draws four
// `Math.random()` values for its UUID and the suite seeds that stream. A gate
// built mid-run would re-roll every enemy's jitter after it. So gates are built
// once, at construction, and a transition only changes which one is visible.
//
// Collision is AABB-only in the XY plane. The game is 2.5D — Z carries depth
// for the camera and the art, and nothing else. Keeping the simulation planar
// is what makes attack ranges and jump arcs tunable by hand.

import * as THREE from 'three';
import { P } from '../render/palette.js';
import { toonMaterial, outlineFor } from '../render/toon.js';
import { GrassField, scatterGrass, makeRock, makeCrystal, makeTree, makeMist, makeWater, buildBackdrop } from '../render/env.js';
import { buildLandmark } from '../render/landmarks.js';
import { rand } from '../engine/mathx.js';
import { BARRIER } from './config.js';

export class Level {
  constructor(scene, gate) {
    this.gate = gate;
    this.realm = gate.realm;
    this.group = new THREE.Group();
    scene.add(this.group);

    /** @type {{x0:number,x1:number,y0:number,y1:number}[]} */
    this.solids = [];
    /** Barriers raised during an encounter and dropped when it is cleared. */
    this.barriers = [];
    this.props = [];
    this.time = 0;

    // Where the ground starts, so the backdrop and the mist frame whatever the
    // gate was authored to be rather than gate 1's leftmost segment.
    this.leftEdge = Math.min(...gate.segments.map((s) => s.x0));

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
    const R = this.realm;
    const grassPoints = [];
    const rockMat = toonMaterial({ color: R.rock, steps: 4, rim: 0.22 });
    const rockDarkMat = toonMaterial({ color: R.rockDark, steps: 3, rim: 0.16 });
    const grassMat = toonMaterial({ color: R.grass, steps: 4, rim: 0.2 });

    for (const seg of this.gate.segments) {
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
        const r = makeRock(rand(0.3, 0.6), { color: R.rock });
        r.position.set(ex, top - 0.25, rand(-depth * 0.4, -depth * 0.1));
        r.rotation.y = rand(0, 3);
        this.group.add(r);
      }

      this._dress(seg, grassPoints);
    }

    this._buildLandmark();
    this._buildGateArch();
    this._buildWater();

    this.grass = new GrassField(grassPoints, { blade: R.grassBlade, tip: R.grassBladeTip });
    this.group.add(this.grass.mesh);

    buildBackdrop(this.group, { from: this.leftEdge - 14, to: this.gate.end + 40, ridges: R.ridges });

    // Mist sheets in front of and behind the play plane, for depth.
    for (let x = this.leftEdge - 4; x < this.gate.end + 20; x += 46) {
      const back = makeMist(60, 26, { color: R.mist.back, opacity: 0.05 });
      back.position.set(x, 6, -22);
      this.group.add(back);
      const front = makeMist(60, 14, { opacity: 0.045, color: R.mist.front });
      front.position.set(x + 20, -2, 12);
      this.group.add(front);
    }

    this._buildBarriers();
  }

  /** Per-segment scatter: trees, crystals, boulders, ruins. */
  _dress(seg, grassPoints) {
    const R = this.realm;
    const { x0, x1, top } = seg;
    const depth = seg.depth ?? 6;

    for (let i = 0; i < (seg.trees ?? 0); i++) {
      const t = makeTree(rand(4, 7));
      t.position.set(rand(x0 + 2, x1 - 2), top - 0.4, rand(-depth * 0.42, -depth * 0.2));
      t.rotation.y = rand(0, 6);
      this.group.add(t);
    }

    for (let i = 0; i < (seg.crystals ?? 0); i++) {
      const c = makeCrystal(rand(0.7, 1.9), R.crystal);
      c.position.set(rand(x0 + 1.5, x1 - 1.5), top - 0.4, rand(-depth * 0.45, -depth * 0.12));
      c.rotation.y = rand(0, 6);
      this.group.add(c);
    }

    for (let i = 0; i < (seg.boulders ?? 0); i++) {
      const r = makeRock(rand(0.45, 1.0), { color: rand() > 0.5 ? R.rock : R.rockMoss });
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
      const pillar = new THREE.Mesh(geo, toonMaterial({ color: R.stone, steps: 3, rim: 0.25 }));
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

  /** The gate's one landmark, if it has one. Scenery, and never a fight. */
  _buildLandmark() {
    const l = this.gate.landmark;
    if (!l) return;
    const g = buildLandmark(l.kind);
    g.position.set(l.x, l.y, l.z);
    g.rotation.y = l.rotY;
    this.group.add(g);
    this.landmark = g;
  }

  /**
   * The realm's water, if it has any. Scenery only: it is not a solid, nothing
   * floats on it, and falling in is still a fall.
   *
   * The crossing has black water where gate 1 has void, and that is most of
   * what makes the two read as different places from the same silhouette. The
   * broth that makes the hunter *forget* — and lose the chaya they carried in
   * — is the crossing's mechanic and is not built here; this is the surface it
   * will happen on.
   */
  _buildWater() {
    const w = this.realm.water;
    if (!w) return;
    const from = this.leftEdge - 40;
    const to = this.gate.end + 40;
    const g = makeWater(to - from, 140, { color: w.color, sheen: w.sheen });
    // Centred behind the play plane and reaching a little in front of it, so
    // the far bank dissolves into fog and the near bank frames the bottom of
    // the frame without ever covering the fight — the water sits well below it.
    g.position.set((from + to) / 2, w.y, -40);
    this.group.add(g);
    this.water = g;
  }

  /** The way out. Lights up only once the Warden is down. */
  _buildGateArch() {
    const g = new THREE.Group();
    const stone = toonMaterial({ color: this.realm.stone, steps: 3, rim: 0.3 });

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

    g.position.set(this.gate.exitX, this.gate.arenaTop, -1.5);
    this.group.add(g);
    this.gateArch = g;
  }

  /** Invisible walls that seal an encounter while it is live. */
  _buildBarriers() {
    for (const enc of this.gate.encounters) {
      if (!enc.lock) continue;
      const [x0, x1] = enc.lock;
      for (const x of [x0, x1]) {
        const barrier = {
          x0: x - BARRIER.hw,
          x1: x + BARRIER.hw,
          y0: BARRIER.y0,
          y1: BARRIER.y1,
          active: false,
          mesh: null,
          encounter: enc.id,
        };
        // A visible shimmer, so a wall you cannot pass is a wall you can see.
        // The sheet is only as tall as the eye needs; the slab above is what
        // actually stops a body.
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(BARRIER.hw * 2, 14),
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
    if (this.water) {
      // Sliding the sheen rather than deforming the surface: a plane that moves
      // costs two assignments a frame and allocates nothing, and at this
      // distance a drifting highlight is the whole of what the eye reads as
      // water anyway.
      const sheen = this.water.userData.sheen;
      sheen.position.x = Math.sin(t * 0.09) * 7;
      sheen.position.z = Math.cos(t * 0.06) * 5;
    }
    for (const b of this.barriers) {
      const target = b.active ? 0.22 + Math.sin(t * 6) * 0.06 : 0;
      b.mesh.material.opacity += (target - b.mesh.material.opacity) * Math.min(1, dt * 8);
    }
  }

  openExit() {
    this.portal.material.opacity = 0.001; // animated up by the game
  }

  /** Show this gate, or put it away. The campaign swaps gates with this. */
  setVisible(on) {
    this.group.visible = on;
  }

  /**
   * Put the gate back the way the hunter found it.
   *
   * Everything a run leaves behind in built geometry is here: barriers a
   * sealed encounter raised, and a portal lit by beating the Warden. A gate
   * that is left and re-entered has to be indistinguishable from one that was
   * never entered, and this is the half of that promise `Game` cannot make on
   * its own — `Game` can forget an encounter ever started, but the barrier it
   * raised lives in the level.
   */
  reset() {
    for (const b of this.barriers) {
      b.active = false;
      b.mesh.material.opacity = 0;
    }
    this.portal.material.opacity = 0;
    this.portal.scale.y = 1;
  }
}
