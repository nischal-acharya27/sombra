// Input with buffered presses, from a keyboard or a thumb.
//
// A hack & slash lives or dies on input buffering: the player mashes the next
// combo step slightly before the current swing is cancellable, and the game is
// expected to remember. `pressed()` consumes from a short-lived buffer rather
// than testing a single frame, so an input made up to BUFFER seconds early
// still lands.
//
// Every device ends at `actionDown`/`actionUp`. The keyboard handlers below
// call them and so does `ui/touch.js`, which is what makes a tap and a keypress
// the same event as far as the rest of the game is concerned — same buffer,
// same cancel windows, same `pressed()` semantics, and no second input path for
// a bug to hide in. `tools/sim.js` reaches past both into `held` and `buffer`
// directly, because a bot is not a device.

// Seconds an unconsumed press stays live.
//
// 0.16 was too short to cover a three-hit chain: the moves themselves cannot
// advance faster than cancel-window + cancel-window (~0.33 s), so a third tap
// made during the first swing expired before the game was ever able to use it.
// The player experiences that as a dropped input, because it is one. 0.24 spans
// the gap while staying well short of "the game plays a move I no longer want".
export const BUFFER = 0.24;

const BINDINGS = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  jump: ['Space'],
  dash: ['ShiftLeft', 'ShiftRight'],
  light: ['KeyJ', 'KeyZ'],
  heavy: ['KeyK', 'KeyX'],
  magic: ['KeyL', 'KeyC'],
  pause: ['Escape'],
  restart: ['KeyR'],
};

export class Input {
  constructor(target = window) {
    this.held = new Set();
    this.buffer = new Map(); // action -> seconds remaining
    this.justReleased = new Set();
    this.sustain = new Map(); // action -> seconds it stays held whatever the finger does
    this.pendingUp = new Set(); // let go of early, waiting on the sustain to run out
    this._codeToActions = new Map();
    for (const [action, codes] of Object.entries(BINDINGS)) {
      for (const code of codes) {
        if (!this._codeToActions.has(code)) this._codeToActions.set(code, []);
        this._codeToActions.get(code).push(action);
      }
    }

    this._onDown = (e) => {
      const actions = this._codeToActions.get(e.code);
      if (!actions) return;
      e.preventDefault();
      if (e.repeat) return;
      for (const a of actions) this.actionDown(a);
    };
    this._onUp = (e) => {
      const actions = this._codeToActions.get(e.code);
      if (!actions) return;
      e.preventDefault();
      for (const a of actions) this.actionUp(a);
    };
    this._onBlur = () => {
      this.held.clear();
      this.buffer.clear();
      this.sustain.clear();
      this.pendingUp.clear();
    };

    target.addEventListener('keydown', this._onDown);
    target.addEventListener('keyup', this._onUp);
    target.addEventListener('blur', this._onBlur);
  }

  /**
   * An action begins — a key struck, a thumb landing on a button.
   *
   * `sustain` is seconds the action stays held no matter when the finger comes
   * off, and it exists for exactly one reason: jump height is variable, so
   * releasing mid-rise keeps `jumpCutMul` of the velocity. On a keyboard that
   * is opt-in — you hold Space and let go early on purpose. A tap inverts it,
   * and every touch jump would be a cut one. See the jump button in
   * `ui/touch.js` for the measurements.
   *
   * Counted in game time rather than by a wall-clock timer. The hold has to be
   * a number of frames of *simulation* — a tab that throttles rAF or a paused
   * loop must not spend it — and a `setTimeout` would also make it untestable
   * in a stepped harness, which is how everything else here is verified.
   */
  actionDown(action, sustain = 0) {
    this.held.add(action);
    this.buffer.set(action, BUFFER);
    this.pendingUp.delete(action);
    if (sustain > 0) this.sustain.set(action, sustain);
  }

  /**
   * And ends. `released()` reads this for the frame it happens on.
   *
   * Under an unexpired sustain the release is queued rather than dropped:
   * `endFrame` lands it the moment the guarantee runs out, so a tapped jump
   * still cuts — just late enough to have been a jump first.
   */
  actionUp(action, now = false) {
    if (!now && this.sustain.has(action)) {
      this.pendingUp.add(action);
      return;
    }
    this.sustain.delete(action);
    this.pendingUp.delete(action);
    this.held.delete(action);
    this.justReleased.add(action);
  }

  /** True while the key is down. */
  down(action) {
    return this.held.has(action);
  }

  /** True once per press, within the buffer window. Consumes the press. */
  pressed(action) {
    if (!this.buffer.has(action)) return false;
    this.buffer.delete(action);
    return true;
  }

  /** Look without consuming — for deciding priority between two queued actions. */
  peek(action) {
    return this.buffer.has(action);
  }

  released(action) {
    return this.justReleased.has(action);
  }

  /** -1, 0 or +1 from the movement keys. */
  get moveX() {
    return (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0);
  }

  /** Called once at the end of every frame. */
  endFrame(dt) {
    this.justReleased.clear();
    for (const [action, t] of this.buffer) {
      const left = t - dt;
      if (left <= 0) this.buffer.delete(action);
      else this.buffer.set(action, left);
    }
    // Sustained holds run down here, after the clear, so a release that lands
    // now is visible to the frame that follows — the same one-frame contract a
    // key release has.
    for (const [action, t] of this.sustain) {
      const left = t - dt;
      if (left > 0) {
        this.sustain.set(action, left);
        continue;
      }
      this.sustain.delete(action);
      if (this.pendingUp.delete(action)) {
        this.held.delete(action);
        this.justReleased.add(action);
      }
    }
  }

  clearBuffer() {
    this.buffer.clear();
  }
}
