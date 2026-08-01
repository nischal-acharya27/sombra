// Keyboard input with buffered presses.
//
// A hack & slash lives or dies on input buffering: the player mashes the next
// combo step slightly before the current swing is cancellable, and the game is
// expected to remember. `pressed()` consumes from a short-lived buffer rather
// than testing a single frame, so an input made up to BUFFER seconds early
// still lands.

// Seconds an unconsumed press stays live.
//
// 0.16 was too short to cover a three-hit chain: the moves themselves cannot
// advance faster than cancel-window + cancel-window (~0.33 s), so a third tap
// made during the first swing expired before the game was ever able to use it.
// The player experiences that as a dropped input, because it is one. 0.24 spans
// the gap while staying well short of "the game plays a move I no longer want".
const BUFFER = 0.24;

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
      for (const a of actions) {
        this.held.add(a);
        this.buffer.set(a, BUFFER);
      }
    };
    this._onUp = (e) => {
      const actions = this._codeToActions.get(e.code);
      if (!actions) return;
      e.preventDefault();
      for (const a of actions) {
        this.held.delete(a);
        this.justReleased.add(a);
      }
    };
    this._onBlur = () => {
      this.held.clear();
      this.buffer.clear();
    };

    target.addEventListener('keydown', this._onDown);
    target.addEventListener('keyup', this._onUp);
    target.addEventListener('blur', this._onBlur);
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
  }

  clearBuffer() {
    this.buffer.clear();
  }
}
