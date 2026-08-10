// The campaign's save file: `localStorage`, holding as little as possible.
//
// `docs/SPEC-CAMPAIGN.md` § Further Notes: cleared gates, hunter rank, best
// style per gate, seen-teaching-lines, settings — no mid-gate save, since a
// gate is 130 seconds and restarting one is not a hardship. "Hunter rank" is
// resuming an in-progress run: the furthest gate reached, and the level/exp
// the hunter had on arriving there, so closing the browser mid-campaign and
// reopening it does not restart at gate 1. See `docs/DECISIONS.md` § Save
// scope.
//
// Everything below the IO pair at the bottom is pure — no `localStorage`, no
// `Date.now()`, no `Math.random()` — so `tools/persistcheck.js` can test it
// directly against plain objects, the same way `tools/touchcheck.js` tests
// `touch.js`'s layout arithmetic without touching the DOM. `Game` never reads
// `localStorage` itself; it is handed a save object and a writer function by
// `main.js`, which is also where `?sim` is kept off real storage entirely —
// see the note there.
//
// A gate is identified by its own `id` (`gate.id`, e.g. `'gate-2'`), not by
// array position — the same key `game.js` already uses for `storyBeats`.
// Position would break the moment a gate is inserted ahead of another one,
// which a ten-gate campaign is going to do.

export const SAVE_KEY = 'sombra.save';
export const SAVE_VERSION = 1;

/** No save yet, or `?sim`'s in-memory stand-in for one. */
export function blankSave() {
  return {
    version: SAVE_VERSION,
    gateId: null,
    level: 1,
    exp: 0,
    clearedGates: [],
    bestStyle: {},
    taught: [],
    settings: {},
    seenIntro: false,
    seenTutorial: false,
  };
}

/**
 * NEW GAME's reset: a blank save except `seenIntro` and `seenTutorial`, both
 * of which survive it. Neither the opening nor the training hall is a
 * per-campaign thing — issue #34, issue #35 — so restarting the campaign does
 * not re-show either to a hunter who already knows them.
 */
export function newGameSave(save) {
  return { ...blankSave(), seenIntro: save.seenIntro, seenTutorial: save.seenTutorial };
}

/** Marks the pre-game opening seen. Idempotent, same shape as `markTaught`. */
export function markIntroSeen(save) {
  if (save.seenIntro) return save;
  return { ...save, seenIntro: true };
}

/**
 * Marks the training hall seen. Its own flag, separate from `seenIntro` — the
 * two open on different conditions (the opening always plays before the hall
 * does, on a fresh save's first run) and a TUTORIAL button can replay this one
 * on its own without touching the other. See issue #35.
 */
export function markTutorialSeen(save) {
  if (save.seenTutorial) return save;
  return { ...save, seenTutorial: true };
}

/**
 * Where a run starts: the furthest gate reached, at the level/exp the hunter
 * had on arriving there. Falls back to gate 0, level 1 for a blank save and
 * for a save whose `gateId` names a gate that no longer exists in this build
 * — a stale save left over from before a gate was renamed or removed is a
 * real boundary, not a hypothetical one, since it lives on a player's device
 * rather than in this repo.
 */
export function resumePoint(save, gates) {
  const idx = save.gateId ? gates.findIndex((g) => g.id === save.gateId) : -1;
  if (idx < 0) return { gateIndex: 0, level: 1, exp: 0 };
  return { gateIndex: idx, level: save.level, exp: save.exp };
}

/**
 * The save as of clearing `gate`: its id joins `clearedGates` (once), its
 * best style rank keeps the higher of what it already held and this
 * attempt's peak, and the resume point moves on to the next gate — or, on
 * the last one, wraps back to a fresh run's gate 0 / level 1 / exp 0 without
 * touching `clearedGates`/`bestStyle`/`taught`, which are history rather
 * than a resume point.
 */
export function recordGateClear(save, gate, gates, stylePeakIdx, level, exp) {
  const clearedGates = save.clearedGates.includes(gate.id)
    ? save.clearedGates
    : [...save.clearedGates, gate.id];
  const bestStyle = {
    ...save.bestStyle,
    [gate.id]: Math.max(save.bestStyle[gate.id] ?? 0, stylePeakIdx),
  };
  const next = gates[gates.indexOf(gate) + 1];
  return {
    ...save,
    clearedGates,
    bestStyle,
    gateId: next ? next.id : null,
    level: next ? level : 1,
    exp: next ? exp : 0,
  };
}

/** Has this one-time teaching line already fired, ever (any past session)? */
export function hasTaught(save, key) {
  return save.taught.includes(key);
}

/** Mark a teaching line fired. Idempotent — a repeat call changes nothing. */
export function markTaught(save, key) {
  if (save.taught.includes(key)) return save;
  return { ...save, taught: [...save.taught, key] };
}

// -- IO — the only two functions here that touch localStorage ---------------

/**
 * A hand-edited or pre-`SAVE_VERSION` blob is a real possibility on a
 * player's device, not a hypothetical one — anything short of a clean parse
 * of the current shape is treated as no save at all rather than partially
 * trusted.
 */
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return blankSave();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== SAVE_VERSION) return blankSave();
    return { ...blankSave(), ...parsed };
  } catch {
    return blankSave();
  }
}

export function writeSave(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
