// Tier-1 static checks over the save shape.
//
// Same shape and same reasoning as `touchcheck.js`: everything under test in
// `src/game/save.js` is pure — plain objects in, plain objects out, no
// `localStorage`, no `Game`, no frames stepped — so this operates on fixture
// save/gate objects built here rather than on whatever a real browser profile
// happens to have saved. That is also why `main.js` keeps real `loadSave`/
// `writeSave` out of `?sim` entirely: this file proves the logic those two
// wrap, without either of them needing to run.
//
// One difference from `touchcheck.js`: there is no second `controls` array of
// deliberately-broken *data* to re-check, because there is no equivalent of a
// layout descriptor here for a fault to live in — the logic under test is the
// thing being asserted, not a data file it reads. The out-of-range-gate-id row
// below plays the same role a negative control does elsewhere: it is a real
// external-input fault (a stale save naming a gate this build no longer has)
// with a real failure mode (`resumePoint` returning an index nothing owns),
// not a tautology.

import { blankSave, resumePoint, recordGateClear, hasTaught, markTaught } from '../src/game/save.js';

const row = (check, ok, detail) => ({ check, ok, detail });

/** Fixtures only — kept separate from the real `GATES` so this file cannot
 * drift silently when gate content changes; only `id` and array order matter
 * to anything under test. */
const GATE_A = { id: 'gate-a' };
const GATE_B = { id: 'gate-b' };
const GATE_C = { id: 'gate-c' };
const GATES = [GATE_A, GATE_B, GATE_C];

function checkResume() {
  const rows = [];

  const blank = resumePoint(blankSave(), GATES);
  rows.push(
    row(
      'blank save resumes at gate 0',
      blank.gateIndex === 0 && blank.level === 1 && blank.exp === 0,
      `{gateIndex:${blank.gateIndex}, level:${blank.level}, exp:${blank.exp}}`
    )
  );

  const mid = { ...blankSave(), gateId: 'gate-b', level: 5, exp: 20 };
  const resumed = resumePoint(mid, GATES);
  rows.push(
    row(
      'mid-campaign save resumes at its gate',
      resumed.gateIndex === 1 && resumed.level === 5 && resumed.exp === 20,
      `{gateIndex:${resumed.gateIndex}, level:${resumed.level}, exp:${resumed.exp}}`
    )
  );

  // The real fault: a save on disk names a gate this build does not have —
  // gates were reordered or removed since the save was written. `resumePoint`
  // has to fall back rather than hand `_enterGate` an index nothing owns.
  const stale = { ...blankSave(), gateId: 'gate-that-no-longer-exists', level: 9, exp: 40 };
  const fallback = resumePoint(stale, GATES);
  rows.push(
    row(
      'a save naming a gone gate falls back to gate 0',
      fallback.gateIndex === 0 && fallback.level === 1 && fallback.exp === 0,
      `{gateIndex:${fallback.gateIndex}, level:${fallback.level}, exp:${fallback.exp}}`
    )
  );

  return rows;
}

function checkGateClear() {
  const rows = [];

  const first = recordGateClear(blankSave(), GATE_A, GATES, 2, 3, 10);
  rows.push(
    row(
      'clearing a gate joins clearedGates and advances the resume point',
      first.clearedGates.includes('gate-a') &&
        first.gateId === 'gate-b' &&
        first.level === 3 &&
        first.exp === 10,
      `clearedGates:[${first.clearedGates}] gateId:${first.gateId}`
    )
  );

  const repeat = recordGateClear(first, GATE_A, GATES, 1, 3, 10);
  rows.push(
    row(
      'clearing the same gate twice does not duplicate it',
      repeat.clearedGates.filter((id) => id === 'gate-a').length === 1,
      `clearedGates:[${repeat.clearedGates}]`
    )
  );

  rows.push(
    row(
      'a lower peak on a later run does not lower bestStyle',
      repeat.bestStyle['gate-a'] === 2,
      `bestStyle['gate-a']:${repeat.bestStyle['gate-a']}`
    )
  );

  const higher = recordGateClear(repeat, GATE_A, GATES, 5, 3, 10);
  rows.push(
    row(
      'a higher peak on a later run raises bestStyle',
      higher.bestStyle['gate-a'] === 5,
      `bestStyle['gate-a']:${higher.bestStyle['gate-a']}`
    )
  );

  const second = recordGateClear(higher, GATE_B, GATES, 4, 6, 0);
  const last = recordGateClear(second, GATE_C, GATES, 3, 9, 15);
  rows.push(
    row(
      'clearing the last gate wraps the resume point to a fresh run',
      last.gateId === null && last.level === 1 && last.exp === 0,
      `{gateId:${last.gateId}, level:${last.level}, exp:${last.exp}}`
    )
  );
  rows.push(
    row(
      'wrapping a fresh run keeps every gate\'s history',
      last.clearedGates.length === 3 && Object.keys(last.bestStyle).length === 3,
      `clearedGates:[${last.clearedGates}] bestStyle:{${Object.keys(last.bestStyle)}}`
    )
  );

  return rows;
}

function checkTaught() {
  const rows = [];

  const untaught = blankSave();
  rows.push(row('a blank save has taught nothing', !hasTaught(untaught, 'corpse'), ''));

  const taught = markTaught(untaught, 'corpse');
  rows.push(row('marking a line taught makes it read back taught', hasTaught(taught, 'corpse'), ''));

  const again = markTaught(taught, 'corpse');
  rows.push(
    row(
      'marking the same line twice does not duplicate it',
      again.taught.filter((k) => k === 'corpse').length === 1,
      `taught:[${again.taught}]`
    )
  );

  return rows;
}

export function checkPersist() {
  return { rows: [...checkResume(), ...checkGateClear(), ...checkTaught()] };
}
