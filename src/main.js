// Boot. Temporary smoke test of the render pipeline.
import * as THREE from 'three';
import { World } from './render/world.js';
import { Loop } from './engine/loop.js';
import { toonMaterial, outlinedMesh } from './render/toon.js';
import { P } from './render/palette.js';

const world = new World(document.getElementById('view'));

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(80, 2, 30),
  toonMaterial({ color: P.grassLight, rim: 0 })
);
ground.position.y = -1;
ground.receiveShadow = true;
world.scene.add(ground);

for (let i = 0; i < 6; i++) {
  const box = outlinedMesh(new THREE.BoxGeometry(1.4, 2.6, 1.4), toonMaterial({ color: P.hunterCoat }));
  box.position.set(-10 + i * 4, 1.3, 0);
  world.scene.add(box);
}

world.camera.position.set(0, 5, 18);
world.camera.lookAt(0, 1.6, 0);

const loop = new Loop(
  () => {},
  (dt) => {
    world.update(dt);
    world.render();
  }
);
loop.start();
document.getElementById('boot').classList.add('hidden');
window.__smoke = { world, loop };
