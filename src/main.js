// Boot and the screen flow around a run.

import { World } from './render/world.js';
import { Loop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { HUD } from './ui/hud.js';
import { TouchControls } from './ui/touch.js';
import { Game } from './game/game.js';
import { GATES } from './game/gates/index.js';

// `Game` is handed the whole campaign, and opens on the first of it. It builds
// every gate up front and switches between them by visibility, because a gate
// built mid-run would spend the suite's seeded randomness — see the note on
// `Game.levels`. `World` opens on the first realm and `Game._enterGate` moves
// it on from there.
//
// Runs always start at gate 1, until there is a save file to say otherwise.
const world = new World(document.getElementById('view'), GATES[0].realm);
const hud = new HUD();
const audio = new Audio();
const input = new Input();

// On-screen controls, on a device with a thumb — or on any device with
// `?touch`, which is how the layout gets looked at without hunting for a phone.
// Not in `?sim`: the suite drives `Input` directly and never starts the loop,
// so the controls would be DOM nobody can press sitting under the report.
//
// Built before `Game` so `Game` can read `!!touch` once, at construction, as
// the source of truth for which device's instructions to teach — rather than
// guessing from screen width, which is what the touch layout itself refuses
// to do.
const touch =
  !location.search.includes('sim') && TouchControls.wanted() ? new TouchControls(input) : null;
if (touch) document.body.classList.add('touch');

const game = new Game(world, hud, audio, input, GATES, touch);

let paused = false;
let titleT = 0;

const loop = new Loop(
  (dt) => {
    if (paused) return;
    game.update(dt);
  },
  (dt) => {
    // Only while there is a hunter to drive. `cleared` counts — the Warden is
    // down and the walk to the arch is still walking. Hiding them releases
    // whatever was held, so a direction cannot survive into the next run.
    touch?.setVisible(!paused && (game.state === 'playing' || game.state === 'cleared'));
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

/** A slow drift across the gate's landmark while the title is up. */
function titleCamera(dt) {
  titleT += dt;
  const c = world.camera;
  // Not every gate has a landmark — the crossing has water instead — so the
  // drift falls back to the middle of the gate rather than throwing on one.
  const lx = game.gate.landmark ? game.gate.landmark.x : (game.gate.spawnX + game.gate.end) / 2;
  const x = lx - 16 + Math.sin(titleT * 0.07) * 9;
  c.position.set(x, 13 + Math.sin(titleT * 0.11) * 1.4, 30);
  c.lookAt(lx + 2, 11, -12);
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
  // `cleared` is still a live gate — the Warden is down and the hunter is
  // walking to the arch — so it pauses like any other part of the run.
  if (game.state !== 'playing' && game.state !== 'cleared') return;
  paused = on;
  hud.screen('pause', on);
  // Drop anything buffered while paused, so resuming doesn't fire off a swing
  // the player queued a minute ago.
  if (!on) input.clearBuffer();
}

addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (game.state === 'playing' || game.state === 'cleared') setPaused(!paused);
  }
  if (e.code === 'KeyR' && (paused || game.state === 'dead')) startRun();
  if (e.code === 'Enter' && game.state === 'idle') startRun();
});

// `?sim` runs the scripted verification suite instead of the game. It steps
// the simulation directly rather than waiting on animation frames, because a
// browser throttles rAF whenever the tab is not focused — which makes any
// wall-clock automated playtest measure nothing at all.
//
// `?sim&seed=N` runs it against a different top-level seed. The project's own
// rule is that one seed is not evidence, and until this existed the only way to
// obey it was to edit `runSuite`'s default — which is both a diff you have to
// remember to revert and a fresh page load per seed anyway. A page load per
// seed is not incidental: the suite mutates the game object, so seeds have to
// be run in separate loads or later ones inherit earlier ones' state.
if (location.search.includes('sim')) {
  document.getElementById('boot').classList.add('hidden');
  document.getElementById('title').classList.add('hidden');
  // Presence, not truthiness — `?seed=0` is a perfectly good seed, and testing
  // the value would silently ignore it and run the default instead.
  const raw = new URLSearchParams(location.search).get('seed');
  const seed = raw === null ? null : Number(raw);
  import('../tools/sim.js').then((m) =>
    m.runSuite(game, input, ...(seed !== null && Number.isFinite(seed) ? [seed] : []))
  );
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

// The System window warm-up that used to live here is gone. It paid the
// backdrop-filter's first allocation during the title screen, on the theory
// that the cost was in *opening* the window. `?perf` showed the cost was in
// keeping it open — the blur re-runs every frame over a moving 3D canvas — so
// the filter itself was removed instead. See the note in src/ui/style.css.

// Handy for poking at a running game from the console.
window.__game = { game, world, loop, audio, input, hud, touch };
