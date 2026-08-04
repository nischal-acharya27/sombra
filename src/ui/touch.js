// On-screen controls, authored against the touch budget.
//
// The game was keyboard-only, and the checkpoint that makes the whole campaign
// build order honest — `SPEC-CAMPAIGN.md` § Further Notes — is playing the
// crossing on a phone. That cannot happen without a thumb being able to reach
// all seven verbs.
//
// The budget, from `DECISIONS.md` § The touch budget:
//
//   1. No chord may be required.
//   2. Jump margins stay at or above 25% reserve.
//   3. No beat may require a direction plus two buttons at once.
//
// Constraint 2 is `tools/gatecheck.js`'s and has nothing to do with this file.
// Constraint 1 is this file's, and it is the reason SORGI gets a target of its
// own: on the keyboard it is `hold S + K`, and a thumb steering with the other
// hand has nothing to hold `S` with. Constraint 3 is a property of what a gate
// *asks for* rather than of what the screen offers, so nothing here can check
// it — the layout below simply never needs two of these pressed together, and
// the phone playtest is the instrument that says whether that survives contact.
//
// **No new verb and no eighth control.** The seven are the seven the hunter
// learned in gate 1. There is deliberately no pause control: pause is not a
// verb, the moveset is frozen at seven, and every screen the run can land on
// (title, death, clear) already has a real button on it.
//
// The layout is a descriptor rather than markup for the same reason a gate is:
// `tools/touchcheck.js` reads it and answers, on every suite run and before
// anything renders, whether all seven verbs are reachable and whether any two
// targets sit on top of each other. Markup can only be checked by looking at it.

import { PHYS } from '../game/config.js';
import { BUFFER } from '../engine/input.js';

/**
 * How long the hunter is still rising after a jump, in seconds.
 *
 * Derived rather than typed, for the reason `gatecheck.js` derives its reserve
 * threshold: `jumpVel` moving would otherwise leave a number here quietly
 * wrong. The rise runs at full gravity down to the apex window and at the
 * lighter apex gravity through it.
 */
const RISE =
  (PHYS.jumpVel - PHYS.apexWindow) / PHYS.gravity +
  PHYS.apexWindow / (PHYS.gravity * PHYS.apexGravityMul);

/**
 * How long a tap has to be worth, and why it is not just the rise.
 *
 * A press does not necessarily *become* a jump when the finger lands on the
 * button. A jump tapped just before the feet touch down waits in the buffer —
 * `player.js` keeps it alive on purpose, and that pre-landing tap is exactly
 * the running jump a crossing needs. The guarantee therefore has to cover the
 * whole time the press might spend queued as well as the rise it then has to
 * outlast, or the front of it is spent before the jump exists.
 *
 * Measured with the guarantee anchored to the finger instead: a tap made 0.16 s
 * early crossed 5.76 units and one made 0.22 s early crossed 5.68, which are
 * 22% and 21% against a budget that asks for 25%.
 *
 * Overshooting costs nothing. The cut only applies while `vy > 0`, so a
 * guarantee that outlives the rise is released into a fall and changes nothing;
 * 10% is margin against a frame boundary rather than a tuned number.
 */
const TAP_WORTH = (RISE + BUFFER) * 1.1;

/**
 * The seven verbs, and permanently seven. `DECISIONS.md` § Progression: there
 * is nowhere to put an eighth control on a phone screen that a thumb also has
 * to steer with, which is what freezes the moveset rather than taste.
 *
 * Each id is the input action it drives, so there is no second vocabulary here
 * to fall out of step with `engine/input.js`. `move` is the axis; the rest are
 * buttons.
 */
export const MOVESET = ['move', 'jump', 'dash', 'light', 'heavy', 'magic', 'sorgi'];

/**
 * The size everything is measured in, in CSS pixels.
 *
 * One unit is one ordinary button. Every coordinate below is a multiple of it,
 * so the whole scheme scales as one thing and a phone, a small phone in
 * landscape and a tablet get the same layout at three sizes rather than three
 * layouts.
 *
 * `min` is the floor because 44 px is the smallest target a thumb hits
 * reliably and every button here is at least one unit across; `vw` and `vh`
 * both appear because the binding dimension changes with orientation — width
 * in portrait, height in landscape — and either one alone lets the controls
 * eat the screen in the other. `touch.js` writes this into `--b`; the CSS does
 * not restate it.
 */
export const UNIT = { min: 46, vw: 12, vh: 13.5, max: 70 };

/** What a tap must be worth, and the two spans it has to cover. */
export const JUMP_HOLD = { rise: RISE, buffer: BUFFER, need: RISE + BUFFER };

/**
 * Where each control sits.
 *
 * `x` is measured from the control's own edge of the screen and `y` from the
 * bottom, both in units, so the two clusters stay pinned under the two thumbs
 * at any width. The six buttons sweep up and to the left from where a right
 * thumb rests, and **the order along that sweep is how often a hand reaches for
 * the move**: SLASH biggest and nearest, then JUMP and RISE, then STEP, then
 * DÉCRET, and SORGI furthest.
 *
 * STEP outranks DÉCRET there for the reason `player.js` tests dash before
 * everything else — it is the defensive option, and a player mashing it under
 * pressure means it. DÉCRET costs 16 MP and has a cooldown, so it is never the
 * move a panicking thumb wants. SORGI is last because it is claimed standing
 * over a remnant with the fight already over.
 *
 * Both clusters hug the bottom corners, and that is not decoration: the camera
 * frames the hunter around the centre of the screen with the horizon high, so
 * the fight happens above the controls rather than behind them.
 *
 * How much room is left *between* the clusters depends on the screen, and the
 * honest figure is reported by the suite rather than claimed here. In landscape
 * — the orientation the game is for — it is most of the width. At the narrowest
 * portrait the layout supports it is 38 px, so the two clusters very nearly
 * meet along the bottom strip; what saves it there is that they are still below
 * the hunter, and that they are translucent.
 */
export const TOUCH_LAYOUT = {
  unit: UNIT,
  /**
   * One axis, not two buttons. A thumb slides across it and the direction
   * follows, which a pair of separate targets cannot do without a gap in the
   * middle that eats the input mid-slide.
   *
   * `deadzone` is a fraction of the half-width: inside it the hunter stands
   * still, so stopping does not require lifting off.
   */
  steer: { verb: 'move', side: 'left', x: 0.25, y: 0.35, w: 2.7, h: 1.4, neg: 'left', pos: 'right', deadzone: 0.18 },
  buttons: [
    { verb: 'light', action: 'light', label: 'SLASH', side: 'right', x: 0.30, y: 0.30, w: 1.18, h: 1.18, tone: 'cyan' },
    /**
     * `sustain` is the one place the touch scheme is not a transcription of
     * the keyboard, and it is here because measuring said it had to be.
     *
     * Jump height is variable: releasing while still rising keeps `jumpCutMul`
     * of the velocity. On a keyboard that is an opt-in — the default is to hold
     * Space and you let go early on purpose. A thumb inverts it. A tap is 60 to
     * 120 ms against a rise of ~0.37 s, so *every* touch jump would be a cut
     * one, and the running jump the whole campaign is authored against would
     * not be a jump a phone can make.
     *
     * Measured on this build, against gate 1's tightest crossing:
     *
     *     never released  6.08 units   26% reserve   ← what gatecheck asserts
     *     held 0.30 s     5.76         22%
     *     held 0.22 s     5.36         16%
     *     held 0.10 s     4.40         -2%  — the gap stops being crossable
     *
     * So a tap asserts the jump for `TAP_WORTH` — see there for why that is the
     * rise *plus the buffer* rather than the rise alone — and the arc a thumb
     * gets is the arc the touch budget's 25% is measured against. The cost is
     * deliberate and worth stating: a phone cannot ask for a *short* hop. No
     * gate requires one — `gatecheck.js` proves every crossing against the full
     * arc — and a gate that did would be authoring against an input half the
     * players do not have.
     */
    { verb: 'jump', action: 'jump', label: 'JUMP', side: 'right', x: 1.70, y: 0.42, w: 1.05, h: 1.05, tone: 'plain', sustain: TAP_WORTH },
    { verb: 'heavy', action: 'heavy', label: 'RISE', side: 'right', x: 0.45, y: 1.70, w: 1.05, h: 1.05, tone: 'cyan' },
    { verb: 'dash', action: 'dash', label: 'STEP', side: 'right', x: 1.80, y: 1.95, w: 1.00, h: 1.00, tone: 'plain' },
    { verb: 'magic', action: 'magic', label: 'DÉCRET', side: 'right', x: 3.00, y: 0.80, w: 1.00, h: 1.00, tone: 'blue' },
    { verb: 'sorgi', action: 'sorgi', label: 'SORGI', side: 'right', x: 3.05, y: 2.20, w: 1.00, h: 1.00, tone: 'violet' },
  ],
};

/** Every control in the layout, axis first. */
export const controlsOf = (layout = TOUCH_LAYOUT) => [layout.steer, ...layout.buttons];

/** The `--b` expression. One unit, clamped by both axes — see `UNIT`. */
export const unitCss = (u = UNIT) => `clamp(${u.min}px, min(${u.vw}vw, ${u.vh}vh), ${u.max}px)`;

// The arithmetic that turns this descriptor into boxes and asks whether they
// hold together lives in `tools/touchcheck.js`, next to the checks that use it
// — the same split `gatecheck.js` keeps, and for the same reason: the game
// ships the data, the suite ships the questions about it.

// -- the controls themselves -------------------------------------------------

/**
 * The DOM, and the pointers that drive it.
 *
 * Nothing here knows what any verb does. Every target ends at
 * `Input.actionDown` / `Input.actionUp`, which are the same two calls the
 * keyboard handlers make — so a touch press goes through the identical buffer,
 * the identical cancel windows and the identical `pressed()` semantics a key
 * does, and there is no second input path for a bug to hide in.
 */
export class TouchControls {
  /**
   * Whether to build them at all.
   *
   * A coarse primary pointer is a finger; a laptop with a touchscreen it never
   * uses has a fine one and gets nothing. `?touch` forces them on, which is how
   * the layout is looked at on a desktop without hunting for a phone.
   */
  static wanted() {
    if (location.search.includes('touch')) return true;
    return matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
  }

  constructor(input, root = document.getElementById('touch'), layout = TOUCH_LAYOUT) {
    this.input = input;
    this.root = root;
    this.layout = layout;
    this.visible = false;
    this.dir = 0;
    this.steerPointer = null;
    this.heldBy = new Map(); // pointerId -> {action, el}

    // On the document rather than on `#touch`, because the HUD needs it too:
    // the objective line and the boss bar sit along the bottom of the frame and
    // have to be lifted clear of a cluster that only exists on a phone.
    document.documentElement.style.setProperty('--b', unitCss(layout.unit));
    this._buildSteer(layout.steer);
    for (const b of layout.buttons) this._buildButton(b);

    // A thumb still down when the window goes away never sends its pointerup,
    // and the hunter walks off the next ledge on their own. `Input` clears its
    // own held set on blur; this clears the half that is ours.
    this._onBlur = () => this.releaseAll();
    addEventListener('blur', this._onBlur);
    addEventListener('visibilitychange', this._onBlur);
  }

  /** Position and size, in units, straight from the descriptor. */
  _place(el, c) {
    const u = (n) => `calc(var(--b) * ${n})`;
    el.style[c.side] = u(c.x);
    el.style.bottom = u(c.y);
    el.style.width = u(c.w);
    el.style.height = u(c.h);
  }

  _buildSteer(c) {
    const el = document.createElement('div');
    el.className = 'touch-target touch-steer';
    el.innerHTML = '<span class="l">◀</span><span class="r">▶</span>';
    this._place(el, c);
    this.root.appendChild(el);
    this.steer = el;

    const read = (e) => {
      const r = el.getBoundingClientRect();
      const u = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      this._setDir(u > c.deadzone ? 1 : u < -c.deadzone ? -1 : 0);
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.steerPointer = e.pointerId;
      el.setPointerCapture(e.pointerId);
      read(e);
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.steerPointer) read(e);
    });
    const up = (e) => {
      if (e.pointerId !== this.steerPointer) return;
      this.steerPointer = null;
      this._setDir(0);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  _buildButton(c) {
    const el = document.createElement('div');
    el.className = `touch-target touch-btn tone-${c.tone}`;
    // One size for every label that fits at it, and only the ones that do not
    // shrink — six buttons in three different type sizes reads as an accident.
    // `DÉCRET` is the only name the layout carries that has to give.
    const fs = Math.min(0.19, 0.95 / c.label.length).toFixed(3);
    el.innerHTML = `<b style="font-size:calc(var(--b) * ${fs})">${c.label}</b>`;
    this._place(el, c);
    this.root.appendChild(el);

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      // A second finger arriving on a button already down would otherwise leave
      // the action held when the first one lifts.
      if (this.heldBy.has(e.pointerId) || el.classList.contains('on')) return;
      el.setPointerCapture(e.pointerId);
      el.classList.add('on');
      // A tap arriving while the last one is still sustained re-asserts the
      // action — a double jump — and `actionDown` restarts the guarantee.
      this.heldBy.set(e.pointerId, { action: c.action, el });
      this.input.actionDown(c.action, c.sustain ?? 0);
    });
    const up = (e) => {
      const held = this.heldBy.get(e.pointerId);
      if (!held) return;
      this.heldBy.delete(e.pointerId);
      // The light follows the finger even when the action outlives it: the
      // button is not still pressed, and showing it pressed would be a lie
      // about what the player is doing.
      held.el.classList.remove('on');
      this.input.actionUp(held.action);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  /**
   * The axis, as one of three states.
   *
   * Only the change is sent on, because `actionDown` refills the buffer: a
   * direction re-asserted every pointermove would keep `left` permanently
   * fresh in it, and the buffer's whole job is to expire.
   */
  _setDir(dir) {
    if (dir === this.dir) return;
    const c = this.layout.steer;
    const was = this.dir === -1 ? c.neg : this.dir === 1 ? c.pos : null;
    const now = dir === -1 ? c.neg : dir === 1 ? c.pos : null;
    this.dir = dir;
    if (was) this.input.actionUp(was);
    if (now) this.input.actionDown(now);
    this.steer.classList.toggle('l', dir === -1);
    this.steer.classList.toggle('r', dir === 1);
  }

  /** Let go of everything — pausing, dying, or losing the window. */
  releaseAll() {
    this._setDir(0);
    for (const [, held] of this.heldBy) {
      held.el.classList.remove('on');
      // `now`: a sustained jump must not outlive the pause that interrupted it.
      this.input.actionUp(held.action, true);
    }
    this.heldBy.clear();
    for (const b of this.layout.buttons) if (b.sustain) this.input.actionUp(b.action, true);
    this.steerPointer = null;
  }

  setVisible(on) {
    if (on === this.visible) return;
    this.visible = on;
    if (!on) this.releaseAll();
    this.root.classList.toggle('hidden', !on);
  }
}
