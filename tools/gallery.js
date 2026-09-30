// The rig gallery: every character the campaign builds, one cell each.
//
// Lit by the game's own `World` (tone mapping, bloom, the three lights, the
// realm's fog), yawed by the game's own `TILT`, and seen from the game camera's
// own direction — so a cell is what a player would see, cropped tighter. It
// allocates freely and seeds nothing: it is a page for looking, not a check,
// and nothing in the game or the suite imports it.
//
// The roster is harvested from `GATES` rather than listed by hand, so a skin a
// gate adds tomorrow shows up here without anyone remembering to add it.

import * as THREE from 'three';
import { World } from '../src/render/world.js';
import * as M from '../src/render/models.js';
import { P } from '../src/render/palette.js';
import { TILT } from '../src/game/actor.js';
import { GATES } from '../src/game/gates/index.js';

const q = new URLSearchParams(location.search);
const only = q.get('rig')?.split(',').filter(Boolean) ?? null;
const views = (q.get('view') || 'game') === 'all' ? ['game', 'front', 'back', 'face'] : [q.get('view') || 'game'];
const pose = q.get('pose') || '';
const gateN = Math.max(1, Math.min(GATES.length, Number(q.get('gate')) || 1));
const size = Number(q.get('size')) || 300;

/** Builder per archetype, and which gates put it on the field in which skin. */
const BUILDERS = {
  raakchyas: M.buildRaakchyas,
  charger: M.buildCharger,
  kawach: M.buildKawach,
  bhootBatti: M.buildBhootBatti,
  tantrik: M.buildTantrik,
  lankaSoldier: M.buildLankaSoldier,
  mathuraWrestler: M.buildMathuraWrestler,
  shakuni: M.buildShakuni,
  bakasura: M.buildBakasura,
  duryodhana: M.buildDuryodhana,
  taraka: M.buildTaraka,
  shurpanakha: M.buildShurpanakha,
  kumbhakarna: M.buildKumbhakarna,
  ravana: M.buildRavana,
  kamsa: M.buildKamsa,
  putana: M.buildPutana,
  narakasura: M.buildNarakasura,
  hiranyakashipu: M.buildHiranyakashipu,
};

/** The chaya's colours — `SKIN` in game/shadow.js, which does not export it. */
const CHAYA_SKIN = { body: P.chayaBody, dark: P.chayaBodyDark, spine: P.chayaSpine, eye: P.chayaEye };

function roster() {
  const list = [{ label: 'hunter', build: M.buildHunter }];
  const seen = new Set();
  const add = (type, skin, where) => {
    const key = `${type}|${JSON.stringify(skin ?? null)}`;
    if (seen.has(key) || !BUILDERS[type]) return;
    seen.add(key);
    list.push({ label: `${type}${skin ? ' · ' + where : ''}`, build: () => BUILDERS[type](skin ?? null) });
  };
  GATES.forEach((g, i) => {
    for (const e of g.encounters ?? []) {
      for (const s of e.spawns ?? []) {
        if (s.type === 'warden') continue;
        add(s.type, s.skin, `g${i + 1}`);
      }
    }
  });
  for (const type of ['raakchyas', 'charger', 'kawach']) add(type, CHAYA_SKIN, 'chaya');
  GATES.forEach((g, i) => {
    const a = g.warden?.archetype;
    if (!a || !BUILDERS[a]) return;
    list.push({ label: `g${i + 1} ${a}`, build: () => BUILDERS[a]() });
    // Two-form Wardens: the second form as its own cell.
    const probe = BUILDERS[a]();
    const forms = probe.userData.forms;
    if (forms) {
      const names = Object.keys(forms);
      for (const name of names.slice(1)) {
        list.push({
          label: `g${i + 1} ${a} · ${name}`,
          build: () => {
            const r = BUILDERS[a]();
            for (const [k, f] of Object.entries(r.userData.forms)) f.root.visible = k === name;
            r.userData.nodes = r.userData.forms[name].nodes;
            return r;
          },
        });
      }
    }
  });
  list.push({ label: 'g5 kaikeyi (figure)', build: M.buildKaikeyi });
  list.push({
    label: 'g12 narasimha',
    build: () => {
      const r = M.buildHiranyakashipu();
      const n = r.userData.nodes;
      if (n.narasimha) {
        n.narasimha.visible = true;
        n.narasimha.scale.setScalar(1);
      }
      if (n.doorway) n.doorway.visible = true;
      return r;
    },
  });
  return only ? list.filter((r) => only.some((o) => r.label.includes(o))) : list;
}

function applyPose(root) {
  if (pose !== 'bend') return;
  const n = root.userData.nodes || {};
  for (const [k, node] of Object.entries(n)) {
    if (!node?.isObject3D) continue;
    if (/^elbow/.test(k)) node.rotation.z = 1.2;
    else if (/^knee/.test(k)) node.rotation.z = -1.1;
    else if (/^shoulder/.test(k)) node.rotation.z = k.endsWith('L') ? 0.9 : -1.3;
    else if (/^hip[LR]$/.test(k)) node.rotation.z = k.endsWith('L') ? 0.8 : -0.5;
  }
}

function stats(root) {
  let meshes = 0, tris = 0;
  const mats = new Set();
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    let v = o;
    while (v) {
      if (!v.visible) return;
      v = v.parent;
    }
    meshes++;
    mats.add(o.material);
    const g = o.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return { meshes, tris: Math.round(tris), mats: mats.size };
}

const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const world = new World(canvas, GATES[gateN - 1].realm);
// World sizes itself to the window; a gallery cell is square and fixed.
removeEventListener('resize', world._onResize);
world.renderer.setPixelRatio(1);
world.renderer.setSize(size, size, false);
world.composer.setSize(size, size);
world.camera.aspect = 1;
world.camera.fov = 30;
world.camera.updateProjectionMatrix();
world.update(0);

// A floor to stand on and catch the shadow, in the realm's own ground colour.
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: GATES[gateN - 1].realm.rock ?? 0x3a3048 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
world.scene.add(floor);
world.followShadows(0, 0);

const grid = document.getElementById('grid');
const status = document.getElementById('status');
const list = roster();
const box = new THREE.Box3();
const sphere = new THREE.Sphere();
const totals = { tris: 0, meshes: 0 };

for (const entry of list) {
  const root = entry.build();
  root.rotation.y = -TILT;
  applyPose(root);
  world.scene.add(root);
  root.updateMatrixWorld(true);

  // Frame what is visible, not hidden forms or unlit finale props.
  box.makeEmpty();
  root.traverseVisible((o) => {
    if (o.isMesh) box.expandByObject(o);
  });
  box.getBoundingSphere(sphere);
  const h = box.max.y - box.min.y;
  const s = stats(root);
  totals.tris += s.tris;
  totals.meshes += s.meshes;

  for (const view of views) {
    const cam = world.camera;
    const target = new THREE.Vector3(0, box.min.y + h * 0.5, 0);
    let radius = Math.max(sphere.radius, 0.6);
    if (view === 'face') {
      const head = root.userData.nodes?.head;
      if (head) head.getWorldPosition(target);
      target.y += 0.15 * (h > 2.4 ? 1.6 : 1);
      radius = 0.42 * (h > 2.4 ? 1.7 : 1);
    }
    const dist = (radius / Math.tan((cam.fov * Math.PI) / 360)) * 1.05;
    // The game camera sits at +Z, 3.2 up and 11.5 back from a target 1.9 up:
    // the same direction, closer.
    const dir =
      view === 'front' ? new THREE.Vector3(1, 0.12, 0.35) :
      view === 'back' ? new THREE.Vector3(-1, 0.2, -0.3) :
      view === 'face' ? new THREE.Vector3(0.75, 0.05, 1) :
      new THREE.Vector3(0, 1.3, 11.5);
    dir.normalize();
    cam.position.copy(target).addScaledVector(dir, dist);
    cam.lookAt(target);
    world.render();

    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.width = size;
    img.height = size;
    img.src = canvas.toDataURL('image/png');
    const cap = document.createElement('figcaption');
    cap.innerHTML = `<b>${entry.label}</b>${views.length > 1 ? ' · ' + view : ''}\n${s.meshes} meshes · ${s.tris} tris · ${s.mats} mats · ${h.toFixed(2)} tall`;
    fig.append(img, cap);
    grid.append(fig);
  }
  world.scene.remove(root);
}

status.textContent = `${list.length} rigs · view ${views.join('/')}${pose ? ' · pose ' + pose : ''} · gate ${gateN} light · ${totals.meshes} meshes / ${totals.tris} tris in all`;
document.body.dataset.done = '1';
