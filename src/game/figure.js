// The roster's tier-0 figures — a rig built the same procedural way as
// every other tier, but with no `Enemy`/`Boss` ancestry and no chase,
// telegraph or attack state machine (`docs/agents/villain-handoff.md`).
//
// Kaikeyi is the first and, so far, only one: she never fights, so all this
// drives is a handful of instant, authored pose swaps, one per beat of her
// scene. There is deliberately no `update(dt)` here — "nothing about her
// rig moves under its own logic" per her handoff entry in
// `docs/research/villain-roster.md` — so a beat firing is the only thing
// that ever changes her pose, and it changes it once, instantly, rather
// than animating toward it.

import { buildKaikeyi } from '../render/models.js';

/** Kaikeyi, gate 5's fixed figure. `posture()` is the entire surface. */
export class Kaikeyi {
  constructor(x, y, facing = -1) {
    this.root = buildKaikeyi();
    this.n = this.root.userData.nodes;
    this.x = x;
    this.y = y;
    this.root.position.set(x, y, 0);
    // Built facing +X; she stands facing the hunter, who arrives from the
    // lower-x side of the arena, so the default is yawed to face -X.
    this.root.rotation.y = facing < 0 ? Math.PI : 0;
  }

  /** One of her four beat ids: 'boon' | 'manthara' | 'invocation' | 'regret'. */
  posture(beat) {
    const { head, body } = this.n;
    if (!head || !body) return;
    head.rotation.y = 0;
    body.rotation.z = 0;
    if (beat === 'manthara') head.rotation.y = -0.28;
    else if (beat === 'invocation') {
      head.rotation.y = 0.1;
      body.rotation.z = -0.04;
    } else if (beat === 'regret') {
      head.rotation.y = 0.22;
      body.rotation.z = 0.03;
    }
  }
}

/** A gate's static figure, from its descriptor's `kind` — the same dispatch shape `buildLandmark` uses. */
export function buildFigure(kind, x, y, facing) {
  if (kind === 'kaikeyi') return new Kaikeyi(x, y, facing);
  return null;
}
