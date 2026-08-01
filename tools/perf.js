// Frame-time recorder. Open `index.html?perf` and play normally.
//
// Round 2 of the playtest reported a new stutter "before the enemies appear",
// and the previous session could not reproduce it: the in-app preview throttles
// `requestAnimationFrame`, so wall-clock frame timing measured there is
// meaningless. Every number that matters here has to come from a real browser
// window, which means the person who can see the stutter needs an instrument
// rather than a request to drive the Performance panel.
//
// This does one thing: it watches every frame, and when one takes too long it
// records what the game was doing at that moment. A spike with `sys-window` or
// `spawn` next to it names the culprit; a spike with nothing next to it means
// the cause is not where we have been looking.
//
// It patches the game from the outside, so nothing in `src/` carries test
// scaffolding for it.

const SPIKE_MS = 28; // ~1.7 frames at 60 Hz: long enough to see, short enough to catch
const KEEP = 14;

export function attach(game, hud) {
  const marks = []; // { t, label } — recent game events, for blaming spikes
  const spikes = [];
  let worst = 0;
  let worstRecent = 0;
  let frames = 0;
  let sum = 0;
  let since = 0;

  const mark = (label) => marks.push({ t: performance.now(), label });

  // Instrument the three things that happen when an encounter fires.
  const startEncounter = game._startEncounter.bind(game);
  game._startEncounter = (e) => {
    mark(`encounter:${e.id}`);
    return startEncounter(e);
  };
  const spawn = game._spawn.bind(game);
  game._spawn = (s) => {
    const t0 = performance.now();
    const r = spawn(s);
    mark(`spawn:${s.type} (${(performance.now() - t0).toFixed(1)}ms js)`);
    return r;
  };
  const windowFn = hud.window.bind(hud);
  hud.window = (opts) => {
    mark(`sys-window:${opts.title}`);
    return windowFn(opts);
  };

  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:12px;bottom:12px;z-index:998;max-width:560px;' +
    'font:11px/1.5 ui-monospace,Menlo,monospace;color:#dff1ff;background:rgba(6,4,14,0.82);' +
    'border:1px solid #2b3f66;padding:10px 12px;white-space:pre;pointer-events:none';
  document.body.appendChild(el);

  let prev = performance.now();
  const tick = (now) => {
    const dt = now - prev;
    prev = now;
    requestAnimationFrame(tick);

    // The first frame after a tab regains focus is always huge and never
    // interesting; so is the very first frame of the session.
    if (dt > 500 || frames === 0) {
      frames++;
      return;
    }
    frames++;
    sum += dt;
    since++;
    worst = Math.max(worst, dt);
    worstRecent = Math.max(worstRecent, dt);

    if (dt >= SPIKE_MS) {
      // Anything the game announced in the 250 ms before this frame is a
      // candidate. Wider than one frame on purpose: a compositor stall shows up
      // a beat *after* the DOM change that caused it.
      const recent = marks.filter((m) => now - m.t < 250).map((m) => m.label);
      spikes.unshift({
        at: (game.runTime ?? 0).toFixed(1),
        ms: dt.toFixed(1),
        why: recent.length ? recent.join(' + ') : '—',
      });
      spikes.length = Math.min(spikes.length, KEEP);
    }
    while (marks.length && now - marks[0].t > 2000) marks.shift();

    if (since >= 30) {
      const avg = sum / since;
      sum = 0;
      since = 0;
      el.textContent =
        `SOMBRA · frame times   avg ${avg.toFixed(1)}ms (${(1000 / avg).toFixed(0)} fps)   ` +
        `worst ${worst.toFixed(1)}ms   recent ${worstRecent.toFixed(1)}ms\n` +
        `spikes over ${SPIKE_MS}ms, newest first — "why" is what the game did in the 250ms before\n` +
        (spikes.length
          ? spikes.map((s) => `  t+${s.at.padStart(6)}s  ${s.ms.padStart(6)}ms   ${s.why}`).join('\n')
          : '  none yet — play to an encounter');
      worstRecent = 0;
    }
  };
  requestAnimationFrame(tick);

  console.log('[perf] recording. Spikes over %dms will be listed bottom-left.', SPIKE_MS);
  return { spikes };
}
