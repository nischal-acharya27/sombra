// Boot and the screen flow around a run.

import { World } from './render/world.js';
import { Loop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { HUD } from './ui/hud.js';
import { Game } from './game/game.js';
import { STATUE_X } from './game/level.js';
import { damp } from './engine/mathx.js';

const world = new World(document.getElementById('view'));
const hud = new HUD();
const audio = new Audio();
const input = new Input();
const game = new Game(world, hud, audio, input);

let paused = false;
let titleT = 0;

const loop = new Loop(
  (dt) => {
    if (paused) return;
    game.update(dt);
  },
  (dt) => {
    if (game.state === 'idle') {
      titleCamera(dt);
      game.vfx.update(dt);
      world.update(dt);
      world.followShadows(world.camera.position.x, 4);
    } else if (!paused) {
      game.render(dt);
    } else {
      world.update(0); // keep the sky uniforms coherent, but frozen
    }
    world.render();
    // Must come last: the buffer has to survive until the simulation has had a
    // chance to read this frame's presses.
    input.endFrame(dt);
  },
  () => (paused ? 0 : game.timeScale())
);

/** A slow drift across the Kneeling Stone while the title is up. */
function titleCamera(dt) {
  titleT += dt;
  const c = world.camera;
  const x = STATUE_X - 16 + Math.sin(titleT * 0.07) * 9;
  c.position.set(x, 13 + Math.sin(titleT * 0.11) * 1.4, 30);
  c.lookAt(STATUE_X + 2, 11, -12);
  if (Math.random() < 0.35) game.vfx.ambientMote(x + (Math.random() - 0.5) * 30, 4 + Math.random() * 14);
}

// -- screen flow -------------------------------------------------------------

function startRun() {
  audio.unlock();
  hud.screen('title', false);
  hud.screen('death', false);
  hud.screen('clear', false);
  paused = false;
  game.start();
}

document.getElementById('start').addEventListener('click', startRun);
document.getElementById('retry').addEventListener('click', startRun);
document.getElementById('again').addEventListener('click', startRun);
document.getElementById('resume').addEventListener('click', () => setPaused(false));

function setPaused(on) {
  if (game.state !== 'playing') return;
  paused = on;
  hud.screen('pause', on);
  // Drop anything buffered while paused, so resuming doesn't fire off a swing
  // the player queued a minute ago.
  if (!on) input.clearBuffer();
}

addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (game.state === 'playing') setPaused(!paused);
  }
  if (e.code === 'KeyR' && (paused || game.state === 'dead')) startRun();
  if (e.code === 'Enter' && game.state === 'idle') startRun();
});

loop.start();
document.getElementById('boot').classList.add('hidden');

// Handy for poking at a running game from the console.
window.__game = { game, world, loop, audio, input, hud };
