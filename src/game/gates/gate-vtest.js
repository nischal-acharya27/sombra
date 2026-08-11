// PROTOTYPE — issue #41, vertical/layered traversal.
//
// Throwaway descriptor, not part of the campaign (`gates/index.js` does not
// import it). Loaded only via `?vtest`, wired in `main.js` behind that flag.
// Answers one question: can a genuinely multi-tier gate — stacked ledges, a
// long climb, then a long drop — be built from the existing `Level`/`Actor`
// AABB collision and the existing seven-verb moveset (jump, double jump)
// with denser geometry alone, no new collision primitive?
//
// Shape: a ground lane, three stacked ledges climbing straight up (each
// overlapping its neighbour in x — a step, not a jump, per gatecheck.js's
// `edge()`), a horizontal gap at the top tier crossed with a running jump,
// then a long fall back to a low landing to exercise "dropping down is
// free" across several tiers at once.

const REALM = {
  sky: { zenith: 0x120a1e, mid: 0x2a1840, horizon: 0x8a6aa8 },
  fog: { color: 0x3a2a52, near: 20, far: 110 },
  grass: 0x5b4f7a, grassBlade: 0x6d5f8f, grassBladeTip: 0xb8a9d8,
  rock: 0x4b4262, rockDark: 0x25203a, rockMoss: 0x445a57, stone: 0x76708f,
  crystal: 0xd259e0,
  mist: { back: 0xc2b4de, front: 0x8f7ab4 },
  ridges: [0x2a2438, 0x36304f, 0x475166],
};

// Ledges 2-4 overlap their neighbour's x-range on purpose — a stacked climb,
// the shape `tools/gatecheck.js`'s `LAYERED` control fixture exists for.
// Ledge 5 is a real horizontal gap at the top (3.8, same as every other
// gate's), so the climb ends in a jump rather than only steps. Segment 6 is
// a long drop back to the ground band, to exercise multi-tier fall-through.
//
// `thickness: 1.2` on 2-4 is load-bearing, not decoration. `Level._build`
// gives every segment a solid body `thickness` units deep below its top
// (default 5), and that body is a real AABB — a ledge whose body reaches
// below the lane it overlaps is a cliff wall sealing that lane, not a
// mezzanine you can walk under and hop into. A first cut of this file used
// the default and the climb was uncrossable: the player's box (hh 0.86, so
// ~1.72 tall) hit the underside of segment 2 while still short of clearing
// it in x, and running the jump earlier didn't help — the arc's apex and
// the wall's x both had to line up, which the default-depth body leaves
// almost no room for. `tools/gatecheck.js`'s `edge()` does not model this at
// all: an x-overlapping pair is scored as a free step up to double-jump
// height, with no notion of the lower body blocking the approach. See the
// writeup this prototype produced for the fix this implies for gatecheck.
const SEGMENTS = [
  { x0: -4, x1: 14, top: 0, boulders: 2, pillars: 1 },                          // 1: ground
  { x0: 10, x1: 18, top: 3, barren: true, depth: 5, thickness: 1.2 },           // 2: step up (rise 3, overlap)
  { x0: 14, x1: 22, top: 6, barren: true, depth: 5, thickness: 1.2 },           // 3: step up (rise 3, overlap)
  { x0: 18, x1: 26, top: 9, barren: true, depth: 5, thickness: 1.2 },           // 4: step up (rise 3, overlap)
  { x0: 29.8, x1: 46, top: 9, boulders: 2, crystals: 2 },                       // 5: gap 3.8 at the top tier
  { x0: 46, x1: 60, top: -3, boulders: 3, pillars: 2 },                         // 6: long drop, low landing
];

export const GATE_VTEST = {
  id: 'gate-vtest',
  name: 'VTEST — vertical prototype',
  realm: REALM,
  beats: [],
  spawnX: 2,
  voidY: -26,
  arenaTop: -3,
  exitX: 56,
  end: 60,
  segments: SEGMENTS,
  encounters: [],
  warden: null,
};
