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
  // Restarting from the pause menu left this overlay up: the gate really did
  // reset, you just could not see it happen.
  hud.screen('pause', false);
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

// `?sim` runs the scripted verification suite instead of the game. It steps
// the simulation directly rather than waiting on animation frames, because a
// browser throttles rAF whenever the tab is not focused — which makes any
// wall-clock automated playtest measure nothing at all.
if (location.search.includes('sim')) {
  document.getElementById('boot').classList.add('hidden');
  document.getElementById('title').classList.add('hidden');
  import('../tools/sim.js').then((m) => m.runSuite(game, input));
} else {
  loop.start();
  document.getElementById('boot').classList.add('hidden');
  // `?perf` records frame times and names what the game was doing at each
  // spike. It has to be run in a real browser window: the in-app preview
  // throttles rAF, which is what made the last attempt at the reported spawn
  // stutter measure nothing at all.
  if (location.search.includes('perf')) {
    import('../tools/perf.js').then((m) => m.attach(game, hud));
  }
}

/**
 * Pay the System window's one-off costs during the title screen.
 *
 * Round 2 reported a new stutter "before the enemies appear". The first thing
 * that happens at an encounter is a `.sys-window` opening, and it is the only
 * element in the game carrying `backdrop-filter` — the compositor has to
 * allocate a backdrop texture the first time one appears, and that allocation
 * is a known hitch on some GPUs. Rendering one off-screen at boot moves that
 * cost to a moment when nothing is moving.
 *
 * Measured in-session, the JS half of the spawn is not the problem: zero new
 * shader programs, 1.7 ms to build a beast's 34 meshes, 0.5 ms for the DOM.
 * None of that is a visible pause, which is what points at the compositor.
 * This is a mitigation for the leading theory, not a confirmed fix — the
 * throttled preview cannot measure frame time, so `?perf` exists to check it
 * in a real browser window.
 */
function warmSystemWindow() {
  const el = document.createElement('div');
  el.className = 'sys-window';
  el.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0.01;pointer-events:none';
  el.innerHTML = '<h3>&nbsp;</h3><div class="divider"></div><div class="big">&nbsp;</div>';
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.remove()));
}
warmSystemWindow();

// Handy for poking at a running game from the console.
window.__game = { game, world, loop, audio, input, hud };
