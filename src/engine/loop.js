// Fixed-timestep game loop.
//
// Physics runs at a fixed 120 Hz regardless of display refresh, because combat
// here is built on frame-counted windows (active frames, cancel windows, i-frames)
// and those stop being tunable the moment the step length varies. Rendering runs
// once per animation frame at whatever rate the display offers.

const STEP = 1 / 120;
const MAX_FRAME = 0.25; // clamp: never simulate more than a quarter second at once

export class Loop {
  /**
   * @param {(dt:number)=>void} update   fixed-step simulation
   * @param {(dt:number)=>void} render   called once per animation frame, real dt
   * @param {()=>number} timeScale       0 during hitstop, 1 normally
   */
  constructor(update, render, timeScale = () => 1) {
    this.update = update;
    this.render = render;
    this.timeScale = timeScale;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.fps = 0;
    this._fpsAcc = 0;
    this._fpsFrames = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now() / 1000;
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
  }

  _tick(nowMs) {
    if (!this.running) return;
    requestAnimationFrame(this._tick);

    const now = nowMs / 1000;
    let raw = now - this.last;
    this.last = now;
    if (raw > MAX_FRAME) raw = MAX_FRAME; // tab was backgrounded; don't fast-forward

    this._fpsAcc += raw;
    this._fpsFrames++;
    if (this._fpsAcc >= 0.5) {
      this.fps = this._fpsFrames / this._fpsAcc;
      this._fpsAcc = 0;
      this._fpsFrames = 0;
    }

    this.acc += raw * this.timeScale();
    let steps = 0;
    while (this.acc >= STEP && steps < 8) {
      this.update(STEP);
      this.acc -= STEP;
      steps++;
    }
    // Fell too far behind to catch up — drop the backlog rather than spiral.
    if (steps === 8) this.acc = 0;

    this.render(raw);
  }
}

export { STEP };
