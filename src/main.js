// Boot and the screen flow around a run.

import { World } from './render/world.js';
import { Loop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { HUD } from './ui/hud.js';
import { TouchControls } from './ui/touch.js';
import { Game } from './game/game.js';
import { Tutorial } from './game/tutorial.js';
import { GATES } from './game/gates/index.js';
import { GATE_VTEST } from './game/gates/gate-vtest.js'; // PROTOTYPE — issue #41, drop before merge
import {
  blankSave,
  loadSave,
  writeSave,
  resumePoint,
  newGameSave,
  markIntroSeen,
  markTutorialSeen,
} from './game/save.js';
import { STRINGS } from './ui/strings.js';

// `Game` is handed the whole campaign, and opens on the first of it. It builds
// every gate up front and switches between them by visibility, because a gate
// built mid-run would spend the suite's seeded randomness — see the note on
// `Game.levels`. `World` opens on the first realm and `Game._enterGate` moves
// it on from there.
//
// PROTOTYPE — issue #41: `?vtest` boots straight into a throwaway vertical
// test gate instead of the campaign, to playtest stacked-ledge traversal.
const VTEST = location.search.includes('vtest');
if (VTEST) GATES.splice(0, GATES.length, GATE_VTEST);

// Runs always start at gate 1, until there is a save file to say otherwise.
const world = new World(document.getElementById('view'), GATES[0].realm);
const hud = new HUD();
const audio = new Audio();
const input = new Input();

// `?sim` never touches real `localStorage`, in either direction, regardless
// of what a given machine's browser has saved from real play — the same
// reason it never gets real `TouchControls` below. A save loaded at
// construction time would otherwise leak into the suite's supposedly seeded,
// reproducible run.
const simMode = location.search.includes('sim');

// On-screen controls, on a device with a thumb — or on any device with
// `?touch`, which is how the layout gets looked at without hunting for a phone.
// Not in `?sim`: the suite drives `Input` directly and never starts the loop,
// so the controls would be DOM nobody can press sitting under the report.
//
// Built before `Game` so `Game` can read `!!touch` once, at construction, as
// the source of truth for which device's instructions to teach — rather than
// guessing from screen width, which is what the touch layout itself refuses
// to do.
const touch = !simMode && TouchControls.wanted() ? new TouchControls(input) : null;
if (touch) document.body.classList.add('touch');

const save = simMode || VTEST ? blankSave() : loadSave();
const persistSave = simMode || VTEST ? () => {} : writeSave;

const game = new Game(world, hud, audio, input, GATES, touch, save, persistSave);

// The training hall — issue #35. Not part of the campaign `Game` runs (see
// `game/tutorial.js`'s own note), so it is its own object, built lazily here
// rather than at the cost every gate in `GATES` already pays at boot. `?sim`
// never opens it, the same reason it never gets real `TouchControls` above.
const tutorial = simMode ? null : new Tutorial(world, hud, audio, input, touch);
let tutorialActive = false;

// The title screen names the gate a fresh "start" actually resumes into —
// gate 1 for a blank save, but a returning hunter's furthest gate otherwise.
// Static markup can only ever be right for a save that does not exist yet.
// `game.gateIndex` is not it: `Game` only moves off gate 0 inside `reset()`,
// which `start()` has not been clicked to call yet — this reads the same
// pure `resumePoint` `reset()` will, rather than a `Game` field that is still
// gate 0 at this point regardless of the save.
const resume = resumePoint(save, GATES);
document.querySelector('#title .tag').textContent = STRINGS.TITLE_TAG(resume.gateIndex + 1, GATES[resume.gateIndex].name);
// "New Game" only has anything to do once a save has moved past gate 1 —
// `start` alone already covers a blank save, and showing a reset option for
// nothing to reset would just be a second button that does the same thing.
if (resume.gateIndex > 0) document.getElementById('new-game').classList.remove('hidden');

// Every gate's group is in the scene by now, whether visible or not — `Game`
// just built them all. Three.js otherwise compiles a material's shader
// program lazily, on the object's first render, so an invisible gate's toon
// materials, grass wind variant and water sheen would all compile on the one
// frame the hunter steps through its arch. `compile()` walks the scene by
// `traverse`, not `traverseVisible`, so it reaches them now instead — at boot,
// before anything has drawn from the seeded stream. See issue #15.
//
// `compile()` alone isn't the whole cost: it only builds each material's own
// program. The shadow map keeps a second program per shadow-casting object —
// three.js builds that one lazily too, the first time the object actually
// casts a shadow, which for an invisible gate is also the transition frame.
// `compile()` has no equivalent for it, so the only way to pay it early is to
// render every gate for real, once, before the run starts and before the
// visibility flags are put back the way `Game` left them.
const shaderWarmupMs = (() => {
  const t0 = performance.now();
  world.renderer.compile(world.scene, world.camera);
  const wasVisible = game.levels.map((l) => l.group.visible);
  for (const l of game.levels) l.setVisible(true);
  world.render();
  game.levels.forEach((l, i) => l.setVisible(wasVisible[i]));
  return performance.now() - t0;
})();
console.log(`[boot] shader warm-up: ${shaderWarmupMs.toFixed(1)}ms`);

let paused = false;
let titleT = 0;

const loop = new Loop(
  (dt) => {
    if (paused) return;
    if (tutorialActive) tutorial.update(dt);
    else game.update(dt);
  },
  (dt) => {
    // Only while there is a hunter to drive. `cleared` counts — the Warden is
    // down and the walk to the arch is still walking. Hiding them releases
    // whatever was held, so a direction cannot survive into the next run.
    touch?.setVisible(
      !paused && (tutorialActive || (!game.resting && (game.state === 'playing' || game.state === 'cleared')))
    );
    if (tutorialActive) {
      tutorial.render(dt);
    } else if (game.state === 'idle') {
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
  () => (paused ? 0 : tutorialActive ? 1 : game.timeScale())
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
  hud.hideBossRestPrompt();
  // Restarting from the pause menu left this overlay up: the gate really did
  // reset, you just could not see it happen.
  hud.screen('pause', false);
  paused = false;
  game.start();
}

// The 4-screen opening — issue #34. Same `storyWindow` component the gate
// boundary beats use, paged behind its own NEXT button. Unlike
// `Game._showBeatQueue`, the last screen still waits for a click: there is no
// bossRestPrompt to hand off to here, and closing on a timer is the exact bug
// `storyWindow`'s own note in hud.js already names. `introPlaying` blocks the
// idle-state Enter shortcut below from firing `startRun` out from under a
// screen that is still up — `game.state` stays 'idle' for the whole sequence,
// since `game.start()` has not been called yet.
const INTRO_BEATS = [
  { title: STRINGS.INTRO_WHEEL_TITLE, big: STRINGS.INTRO_WHEEL_BIG, body: STRINGS.INTRO_WHEEL_BODY },
  { title: STRINGS.INTRO_HUNTER_TITLE, big: STRINGS.INTRO_HUNTER_BIG, body: STRINGS.INTRO_HUNTER_BODY },
  { title: STRINGS.INTRO_THREAT_TITLE, big: STRINGS.INTRO_THREAT_BIG, body: STRINGS.INTRO_THREAT_BODY },
  { title: STRINGS.INTRO_GOAL_TITLE, big: STRINGS.INTRO_GOAL_BIG, body: STRINGS.INTRO_GOAL_BODY },
];
let introPlaying = false;

function showIntro(onDone) {
  introPlaying = true;
  hud.screen('title', false);
  const queue = [...INTRO_BEATS];
  const showNext = () => {
    const b = queue.shift();
    if (!b) {
      hud.hideStoryWindow();
      introPlaying = false;
      onDone();
      return;
    }
    audio.play('systemOpen');
    hud.storyWindow({ title: b.title, big: b.big, body: b.body, onNext: showNext });
  };
  showNext();
}

// The training hall — issue #35. Swaps which of `game`/`tutorial` the loop
// above is driving: `game`'s own level and hunter are hidden rather than torn
// down, since a run may still be resumed once the hall lets go. `onDone` is
// what the caller wants to happen next — `startRun()` on a fresh save's first
// ever entry, or back to the title screen for the on-demand TUTORIAL button.
function enterTutorial(onDone) {
  tutorialActive = true;
  hud.screen('title', false);
  game.level.setVisible(false);
  game.entityRoot.visible = false;
  document.getElementById('tutorial-skip').classList.remove('hidden');
  tutorial.start(() => {
    document.getElementById('tutorial-skip').classList.add('hidden');
    tutorialActive = false;
    game.level.setVisible(true);
    game.entityRoot.visible = true;
    world.applyRealm(game.gate.realm);
    onDone();
  });
}

document.getElementById('start').addEventListener('click', () => {
  audio.unlock();
  if (game.save.seenIntro) {
    startRun();
  } else {
    showIntro(() => {
      game.save = markIntroSeen(game.save);
      persistSave(game.save);
      // The hall follows the opening, once, on a fresh save's first run —
      // `seenTutorial` is checked here rather than assumed, so a save that
      // somehow already carries it (the TUTORIAL button, played before ever
      // pressing START) does not open the hall a second time uninvited.
      if (game.save.seenTutorial) {
        startRun();
        return;
      }
      enterTutorial(() => {
        game.save = markTutorialSeen(game.save);
        persistSave(game.save);
        startRun();
      });
    });
  }
});
document.getElementById('tutorial-btn').addEventListener('click', () => {
  audio.unlock();
  enterTutorial(() => {
    game.save = markTutorialSeen(game.save);
    persistSave(game.save);
    hud.screen('title', true);
  });
});
document.getElementById('tutorial-skip').addEventListener('click', () => tutorial.skip());
document.getElementById('new-game').addEventListener('click', () => {
  // `seenIntro` survives this reset — see `newGameSave`'s note in save.js.
  game.save = newGameSave(game.save);
  persistSave(game.save);
  startRun();
});
document.getElementById('story').addEventListener('click', () => {
  audio.unlock();
  showIntro(() => hud.screen('title', true));
});
document.getElementById('retry').addEventListener('click', startRun);
document.getElementById('again').addEventListener('click', startRun);
document.getElementById('resume').addEventListener('click', () => setPaused(false));

function setPaused(on) {
  // `cleared` is still a live gate — the Warden is down and the hunter is
  // walking to the arch — so it pauses like any other part of the run.
  // The boss-rest prompt already holds everything still on its own terms;
  // stacking the pause menu over it would just be two things fighting for
  // the same message.
  if ((game.state !== 'playing' && game.state !== 'cleared') || game.resting) return;
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
  if (e.code === 'Enter' && !introPlaying && (game.state === 'idle' || game.state === 'dead')) startRun();
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
if (simMode) {
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
window.__game = { game, world, loop, audio, input, hud, touch, tutorial };
