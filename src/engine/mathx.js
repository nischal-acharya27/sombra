// Small numeric helpers. Kept dependency-free so anything may import it.

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const smoothstep = (t) => t * t * (3 - 2 * t);

/**
 * Frame-rate independent exponential approach. `smoothing` is the fraction of
 * the remaining distance still left after one second, so 0.001 is snappy and
 * 0.5 is sluggish, and both behave the same at 30fps as at 144fps.
 */
export const damp = (a, b, smoothing, dt) => lerp(a, b, 1 - Math.pow(smoothing, dt));

/** Move `a` toward `b` by at most `maxDelta`. */
export function approach(a, b, maxDelta) {
  const d = b - a;
  if (Math.abs(d) <= maxDelta) return b;
  return a + Math.sign(d) * maxDelta;
}

export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Axis-aligned box overlap in the XY plane. Boxes are {x, y, hw, hh} (half extents). */
export function overlaps(a, b) {
  return Math.abs(a.x - b.x) <= a.hw + b.hw && Math.abs(a.y - b.y) <= a.hh + b.hh;
}

/** Deterministic 1D value noise — used for wind and camera drift, not gameplay. */
export function noise1(x) {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  return lerp(h(i), h(i + 1), smoothstep(f)) * 2 - 1;
}
