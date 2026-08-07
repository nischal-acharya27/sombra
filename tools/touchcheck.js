// Tier-1 static checks over the touch layout.
//
// Same shape and same reasoning as `gatecheck.js`: read a descriptor, do
// arithmetic, touch no `Game`, run no frames, allocate nothing three.js would
// hand a UUID to, and therefore spend not one draw from the seeded stream. A
// layout is data for exactly this reason.
//
// What these can and cannot say is worth being precise about, because the
// ticket that asked for touch controls said the budget was not machine-
// checkable and it was two-thirds right.
//
//   - **Constraint 1, no required chord** — checkable, and checked. A control
//     that fired two actions at once would be a chord with a single target
//     painted over it.
//   - **Constraint 2, jump reserve** — not this file's. `gatecheck.js` asserts
//     it against every gate descriptor.
//   - **Constraint 3, never a direction plus two buttons** — not checkable
//     here or anywhere. It is a claim about what a *fight* demands, not about
//     what the screen offers, and the only instrument for it is a thumb. The
//     phone playtest is that instrument.
//
// What is checkable and matters just as much is the boring half: that all seven
// verbs are on the screen, that no two targets sit on top of each other, and
// that none of them is too small or off the edge at any size the layout claims
// to support. A button covered by another button is a verb the hunter does not
// have, and nothing in play would say so — the input simply never arrives.

import { TOUCH_LAYOUT, MOVESET, JUMP_HOLD, UNIT, controlsOf } from '../src/ui/touch.js';

const row = (check, ok, detail) => ({ check, ok, detail });

/** The smallest a target may be, in CSS pixels. Apple's figure; Android's is 48dp. */
const MIN_TARGET = 44;

/** The narrowest viewport the layout is authored to fit, in CSS pixels. */
const NARROWEST = 360;

/**
 * The screens the layout is claimed to work on.
 *
 * A narrow modern phone both ways, a typical one in the orientation the game is
 * actually played in, and a tablet — the two ends of `UNIT`'s clamp plus the
 * case in the middle where neither end binds.
 */
const VIEWPORTS = [
  { name: 'phone, portrait', w: NARROWEST, h: 800 },
  { name: 'phone, landscape', w: 640, h: NARROWEST },
  { name: 'phone, landscape', w: 844, h: 390 },
  { name: 'tablet', w: 1180, h: 820 },
];

/** One unit in CSS pixels on a viewport of this size — `unitCss`, evaluated. */
const unitAt = (vw, vh, u) =>
  Math.min(Math.max(Math.min((vw * u.vw) / 100, (vh * u.vh) / 100), u.min), u.max);

/**
 * A control's box in CSS pixels, x from the left edge and y up from the bottom.
 *
 * Both anchors resolve into one frame here so that two controls pinned to
 * opposite edges can be compared at all — which is the only way to ask whether
 * they collide on a narrow screen.
 */
function boxAt(c, b, vw) {
  const [x0, x1] = c.side === 'left' ? [c.x * b, (c.x + c.w) * b] : [vw - (c.x + c.w) * b, vw - c.x * b];
  return { verb: c.verb, side: c.side, x0, x1, y0: c.y * b, y1: (c.y + c.h) * b, w: c.w * b, h: c.h * b };
}

const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/**
 * Whether every verb has exactly one control and no control is a chord.
 *
 * Returned as data rather than thrown, because this is a report row: a layout
 * that has lost a verb should print the verb it lost next to every other row,
 * not take the suite down before it gets there.
 */
function coverage(layout) {
  const seen = new Map();
  const stray = [];
  for (const c of controlsOf(layout)) {
    if (!MOVESET.includes(c.verb)) stray.push(c.verb);
    seen.set(c.verb, (seen.get(c.verb) ?? 0) + 1);
  }
  // SORGI has no target of its own — `DECISIONS.md` § The steer control
  // becomes a stick reads it off the steer's `down` state instead. Credit it
  // the same way a real control would be credited, so a layout that forgets
  // `down` still shows up here as a verb with nothing behind it.
  if (typeof layout.steer.down === 'string') seen.set('sorgi', (seen.get('sorgi') ?? 0) + 1);
  return {
    missing: MOVESET.filter((v) => !seen.has(v)),
    stray,
    twice: [...seen].filter(([, n]) => n > 1).map(([v]) => v),
    get ok() {
      return !this.missing.length && !this.stray.length && !this.twice.length;
    },
  };
}

/**
 * Whether any control asks for more than one action at a time.
 *
 * A button carries one action, spelled as one string. The axis carries three —
 * `neg`/`pos` and now `down` — and asserts each as one well-formed action, one
 * point of contact: `_setDir` releases the old horizontal action before it
 * presses the new one, and `down` is read independently of it, the same way a
 * keyboard holds a movement key and `S` together without either being a
 * second target. What this check forbids is a *button* needing two fingers,
 * or any single field on the steer resolving to more than one action.
 */
function chords(layout) {
  const bad = [];
  for (const b of layout.buttons) {
    if (typeof b.action !== 'string') bad.push(`${b.verb} fires ${JSON.stringify(b.action)}`);
  }
  const s = layout.steer;
  if (typeof s.neg !== 'string' || typeof s.pos !== 'string') bad.push(`${s.verb} is not one axis`);
  if (s.down !== undefined && typeof s.down !== 'string') bad.push(`${s.verb}'s down fires ${JSON.stringify(s.down)}`);
  return { bad, ok: bad.length === 0 };
}

/**
 * Whether the layout still holds together at a given screen size: nothing
 * overlapping, nothing off the edge, nothing under the size a thumb can hit.
 *
 * The floor in `UNIT` is 46 and every target is at least one unit across, so
 * the size clause passes by construction and exists to catch the layout that
 * stops being built that way.
 *
 * `clear` is the untouched span between the two clusters. It is reported rather
 * than asserted on, because there is no threshold anyone has earned the right
 * to pick: in landscape it is most of the width, at the narrowest portrait it
 * is a strip, and what makes the narrow case survivable is that the controls
 * are below the hunter and translucent rather than that the gap is any
 * particular size. A thumb decides this one.
 */
function fit(vw, vh, layout) {
  const b = unitAt(vw, vh, layout.unit ?? UNIT);
  const boxes = controlsOf(layout).map((c) => boxAt(c, b, vw));
  const bad = [];
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    if (a.x0 < 0 || a.x1 > vw || a.y1 > vh) bad.push(`${a.verb} runs off the screen`);
    if (Math.min(a.w, a.h) < MIN_TARGET) bad.push(`${a.verb} is ${Math.round(Math.min(a.w, a.h))}px across`);
    for (let j = i + 1; j < boxes.length; j++) {
      if (overlaps(a, boxes[j])) bad.push(`${a.verb} sits on ${boxes[j].verb}`);
    }
  }
  const rightmostLeft = boxes.filter((x) => x.side === 'left').map((x) => x.x1);
  const leftmostRight = boxes.filter((x) => x.side === 'right').map((x) => x.x0);
  const clear =
    rightmostLeft.length && leftmostRight.length
      ? Math.min(...leftmostRight) - Math.max(...rightmostLeft)
      : vw;
  return { bad, clear, ok: bad.length === 0 };
}

/** Every check against one layout. */
export function checkLayout(layout = TOUCH_LAYOUT) {
  const out = [];

  const cov = coverage(layout);
  out.push(
    row(
      'seven verbs',
      cov.ok,
      [
        cov.missing.length && `no control for ${cov.missing.join(', ')}`,
        cov.stray.length && `${cov.stray.join(', ')} is not one of the seven`,
        cov.twice.length && `${cov.twice.join(', ')} has more than one control`,
      ]
        .filter(Boolean)
        .join('; ') || `${MOVESET.join(', ')}`
    )
  );

  const ch = chords(layout);
  out.push(row('no chord', ch.ok, ch.bad.join('; ') || 'every control is one target, one action'));

  // Constraint 2, from the other end.
  //
  // `gatecheck.js` asserts that every crossing keeps a quarter of the arc in
  // reserve. It measures that against the arc `measureArcs` records, and that
  // arc is a jump whose button is *never released* — the suite's bots only ever
  // write to the input buffer. A thumb lifts, jump height is variable, and a
  // tap that lands inside the rise spends the whole reserve: measured on this
  // build a 0.10 s tap crosses 4.40 units against a 4.5-unit requirement, so
  // gate 1's widest gap simply stops being crossable.
  //
  // The span is the rise *plus the buffer*, not the rise alone. A jump tapped
  // just before the feet land waits in the buffer before it becomes a jump —
  // which is the pre-landing press `player.js` keeps alive on purpose, and the
  // one a crossing actually needs. Anchored to the finger instead, a tap made
  // 0.16 s early measured 5.76 units: 22%, under budget.
  //
  // Hence `sustain`, and hence this row. Arithmetic over three config numbers,
  // so it costs nothing and cannot drift when `jumpVel` or `BUFFER` moves —
  // which is the failure it exists for.
  const jump = layout.buttons.find((b) => b.verb === 'jump');
  const sustain = jump?.sustain ?? 0;
  const need = JUMP_HOLD.need;
  out.push(
    row(
      'a tap is a whole jump',
      sustain >= need,
      `${sustain.toFixed(3)}s held against a ${JUMP_HOLD.rise.toFixed(3)}s rise ` +
        `after up to ${JUMP_HOLD.buffer.toFixed(2)}s buffered` +
        (sustain >= need ? '' : ' — a tapped jump would be a cut one')
    )
  );

  for (const v of VIEWPORTS) {
    const f = fit(v.w, v.h, layout);
    out.push(
      row(
        `${v.w}×${v.h}`,
        f.ok,
        f.bad.join('; ') || `${v.name}, ${Math.round(f.clear)}px clear down the middle`
      )
    );
  }
  return out;
}

// -- controls ----------------------------------------------------------------

/** A copy of the real layout with one thing wrong. */
function broken(mutate) {
  const layout = {
    ...TOUCH_LAYOUT,
    steer: { ...TOUCH_LAYOUT.steer },
    buttons: TOUCH_LAYOUT.buttons.map((b) => ({ ...b })),
  };
  mutate(layout, layout.buttons);
  return layout;
}

const byVerb = (buttons, verb) => buttons.find((b) => b.verb === verb);

/**
 * One deliberately broken layout per failure each check exists to catch.
 *
 * The reasoning is `gatecheck.js`'s and is not repeated: a static check nobody
 * has watched fail is not known to work, and watching it once by hand proves it
 * for whoever was looking rather than on every run.
 *
 * The first two are the budget's own failure modes and the reason this file
 * exists. `a verb with no control` is the eighth-button problem arriving from
 * the other direction — a moveset frozen at seven is only worth anything if all
 * seven are actually on the screen; for SORGI specifically that means the
 * steer's `down`, since it has no button of its own. `a button that needs two
 * fingers` and `the stick fires two actions from one field` are both
 * constraint 1 — a single point of contact must resolve to one well-formed
 * action.
 */
const CONTROLS = [
  {
    check: 'seven verbs',
    why: 'a verb with no control',
    layout: broken((l) => delete l.steer.down),
  },
  {
    check: 'seven verbs',
    why: 'an eighth control',
    // Parked above SORGI's old slot, in clear space, so this control breaks
    // the count and nothing else — the eighth button the moveset was frozen
    // to prevent.
    layout: broken((l, b) => b.push({ ...b[0], verb: 'block', action: 'block', x: 3.05, y: 3.4, w: 1, h: 1 })),
  },
  {
    check: 'no chord',
    why: 'a button that needs two fingers',
    layout: broken((l, b) => (byVerb(b, 'dash').action = ['dash', 'heavy'])),
  },
  {
    check: 'no chord',
    why: "the stick's down fires two actions",
    layout: broken((l) => (l.steer.down = ['down', 'extra'])),
  },
  {
    check: 'a tap is a whole jump',
    why: 'a jump a thumb can only cut short',
    layout: broken((l, b) => delete byVerb(b, 'jump').sustain),
  },
  {
    check: 'a tap is a whole jump',
    // The bug this file's own review found: a guarantee long enough for the
    // rise but not for the wait in front of it.
    why: 'a hold that forgets the buffered press',
    layout: broken((l, b) => (byVerb(b, 'jump').sustain = JUMP_HOLD.rise * 1.15)),
  },
  {
    check: `${VIEWPORTS[0].w}×${VIEWPORTS[0].h}`,
    why: 'two targets in the same place',
    layout: broken((l, b) => {
      const light = byVerb(b, 'light');
      Object.assign(byVerb(b, 'jump'), { x: light.x, y: light.y });
    }),
  },
  {
    check: `${VIEWPORTS[0].w}×${VIEWPORTS[0].h}`,
    why: 'a target a thumb cannot hit',
    layout: broken((l, b) => Object.assign(byVerb(b, 'magic'), { w: 0.6, h: 0.6 })),
  },
  {
    check: `${VIEWPORTS[0].w}×${VIEWPORTS[0].h}`,
    // The narrowest screen is where this can happen at all, and it is the one
    // failure that only appears on one of the four — which is the point of
    // checking four rather than the one on the desk.
    why: 'the two clusters meeting in the middle',
    layout: broken((l) => (l.steer.w = 3.8)),
  },
];

/** Run them: each must come out red, and only on the check that owns it. */
export function controls() {
  return CONTROLS.map((c) => {
    const rows = checkLayout(c.layout);
    const target = rows.find((r) => r.check === c.check);
    if (!target) return { check: c.check, why: c.why, ok: false, detail: 'no check by that name' };
    return { check: c.check, why: c.why, ok: !target.ok, detail: target.ok ? 'NOT CAUGHT' : target.detail };
  });
}

/** The layout, and the demonstration that the checks bite. */
export function checkTouch() {
  return { rows: checkLayout(), controls: controls() };
}
