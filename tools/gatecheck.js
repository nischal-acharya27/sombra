// Tier-1 static checks over gate descriptors.
//
// These read a descriptor and nothing else: no `Game`, no `Level`, no frames,
// no allocation of anything three.js would hand a UUID to, and therefore not a
// single draw from the seeded random stream. That is what lets them run against
// every gate on every suite run for a fraction of a millisecond.
//
// They exist because once gates are data, the dominant new bug class is
// authoring error rather than mechanic error — a gap typed 4.8 instead of 3.8,
// a spawn nudged onto a barrier, an enemy type that no longer exists. A bot
// finds those in seconds of simulation and only on the seeds where it happens
// to walk into them. Arithmetic finds them every time, before anything runs.
//
// Five of the checks are the ones `docs/SPEC-CAMPAIGN.md` § Testing Decisions
// names; `solo debut` is the sixth, and answers user story 14. Every one of
// them is watched failing on every run — see `CONTROLS` at the bottom, and the
// reasoning there.
//
// `telegraphs()` at the bottom is the same kind of arithmetic pointed at the
// config rather than at a descriptor: it holds every enemy's wind-up to the
// shortest one the hunter has ever been asked to read.
//
// Nothing here reads the *built* gate. The suite's GAP REACHABILITY table does,
// and the two are deliberately different questions: this file asks whether the
// descriptor is authored correctly, that one asks whether `Level` built what
// the descriptor said.

import { PLAYER, BARRIER, RAAKCHYAS, CHARGER, KAWACH, BHOOT_BATTI, TANTRIK, SHAKUNI, BAKASURA, TARAKA, GUARDIAN, GORU_MUKH, HAKIM, CHIRANJIVI, MAUN_ANKUR } from '../src/game/config.js';
import { ARCHETYPES } from '../src/game/game.js';
import { GATES } from '../src/game/gates/index.js';

/**
 * Touch-budget constraint 2, from `docs/SPEC-CAMPAIGN.md`: a crossing may spend
 * at most three quarters of the arc it is crossed with.
 *
 * The threshold is a ratio and both of its inputs are measured, so re-tuning
 * the jump moves it. Hardcoding "gaps must be under 4.5" would have frozen the
 * geometry against one build's physics and gone quietly wrong the first time
 * `jumpVel` moved.
 */
const JUMP_RESERVE_MIN = 0.25;

/**
 * Clearance a stacked ledge must leave beyond the hunter's own height — a
 * small epsilon, not `crossing()`'s own 0.4 apex allowance, which answers a
 * different question (room for a jump's peak, not room to stand under a
 * ledge). The `prototype/vertical-traversal` branch's `?vtest` gate
 * validated a 3-unit rise with `thickness: 1.2` by actually playing it: the
 * upper segment's underside sits at `top - thickness` = `6 - 1.2` = 4.8, the
 * lower segment's top is 3, so the proven-climbable clearance is `4.8 - 3` =
 * 1.8 against the hunter's 1.7-unit body — a 0.1 margin. This has to stay at
 * or below that or the check flags the one config already shown to work.
 */
const HEADROOM_MARGIN = 0.05;

const row = (gate, check, ok, detail) => ({ gate, check, ok, detail });

/** 3.8 rather than 3.8000000000000007, which is what subtracting x0s gives. */
const fmt = (n) => +n.toFixed(3);
const pct = (n) => `${(n * 100).toFixed(0)}%`;
const spans = (a0, a1, b0, b1) => a0 < b1 && b0 < a1;

/**
 * What a gap costs to cross, and whether a given arc covers it.
 *
 * Crossing costs the gap plus half a body at each lip, and an apex exactly
 * level with the far lip is not a landing, hence the 0.4 of headroom. Both
 * allowances are conservative on purpose — the hunter is not expected to leave
 * from the last centimetre of the ledge. The suite's GAP REACHABILITY table
 * calls this too, so there is one definition of "crossable" rather than two
 * that can drift.
 */
export function crossing(gap, rise, arc) {
  const need = gap + PLAYER.hw * 2;
  return { need: fmt(need), ok: need <= arc.distance && rise <= arc.height - 0.4 };
}

/** The segment the hunter stands on at x — the highest one over it. */
function segmentAt(gate, x) {
  let best = null;
  for (const s of gate.segments) {
    if (x >= s.x0 && x <= s.x1 && (!best || s.top > best.top)) best = s;
  }
  return best;
}

const hasFloorAt = (gate, x) => segmentAt(gate, x) !== null;

/**
 * Where a spawn's body would actually materialise, and how big it is.
 *
 * Mirrors `Game._spawn`: a Warden takes its archetype and stats from the gate's
 * Warden block and stands on the arena floor; everything else takes the
 * archetype's own numbers and, without an explicit `y`, the ground under it.
 * `ARCHETYPES` answers both "does this exist" and "how big is it", so there is
 * no second table of body sizes here to fall out of step with the classes.
 */
function bodyOf(gate, s) {
  const w = s.type === 'warden' ? gate.warden : null;
  const archetype = w ? w.archetype : s.type;
  const stats = w ? w.stats : ARCHETYPES[archetype]?.stats;
  const onGround = !w && s.y === undefined;
  const y = w ? gate.arenaTop : (s.y ?? (segmentAt(gate, s.x)?.top ?? -Infinity) + 0.1);
  return { archetype, stats, onGround, x: s.x, y, hw: stats?.hw ?? 0, hh: stats?.hh ?? 0 };
}

/** The x of each barrier an encounter raises. Empty unless it seals. */
const barriersOf = (enc) => (enc.lock ? [enc.lock[0], enc.lock[1]] : []);

/**
 * Whether the lower of two x-overlapping, differently-tiered segments leaves
 * room for the hunter to actually stand there.
 *
 * `edge()`'s x-overlap branch used to wave any rise through as a free step —
 * right when the segments merely touch at a point, wrong once they genuinely
 * overlap in x. The upper segment's solid body reaches down to `top -
 * thickness`, and a `thickness` left at its default (5) extends well below
 * the lower segment's own floor: the lower platform's headroom is gone
 * before the hunter ever stands on it, and a mezzanine authored without an
 * explicit thin `thickness` reads to the collision resolver as a wall, not a
 * ledge to climb onto.
 */
function headroomClear(low, high) {
  const shared0 = Math.max(low.x0, high.x0);
  const shared1 = Math.min(low.x1, high.x1);
  if (shared1 <= shared0 + 0.001) return true; // touching, not stacked
  const underside = high.top - (high.thickness ?? 5);
  return underside - low.top >= PLAYER.hh * 2 + HEADROOM_MARGIN;
}

/**
 * Whether the hunter can get from one platform to another in a single move, and
 * what that move costs them.
 *
 * Platforms overlapping in x are a step apart — up if the arc reaches and the
 * lower one leaves headroom to stand under the upper one, and dropping down
 * is always free. Platforms with a gap between them are a jump apart if an
 * arc covers it, and the cheapest arc that does is the one the crossing is
 * measured against, because the reserve of a crossing is the reserve of the
 * move it actually asks for.
 */
function edge(s, t, arcs) {
  const rise = t.top - s.top;
  const [left, right] = s.x0 <= t.x0 ? [s, t] : [t, s];
  const gap = right.x0 - left.x1;
  if (gap <= 0.01) {
    if (rise > arcs.runningDouble.height - 0.4) return null;
    if (Math.abs(rise) > 0.001) {
      const [low, high] = s.top <= t.top ? [s, t] : [t, s];
      if (!headroomClear(low, high)) return null;
    }
    return { crossing: null };
  }
  const single = crossing(gap, rise, arcs.running);
  const double = crossing(gap, rise, arcs.runningDouble);
  const arc = single.ok ? arcs.running : double.ok ? arcs.runningDouble : null;
  if (!arc) return null;
  const need = single.ok ? single.need : double.need;
  return {
    crossing: {
      at: `${fmt(left.x1)}→${fmt(right.x0)}`,
      gap: fmt(gap),
      need,
      arc,
      move: single.ok ? 'running jump' : 'double jump',
      reserve: 1 - need / arc.distance,
    },
  };
}

/**
 * Every platform the hunter can get to from the entrance, and for each one, the
 * kindest route there — the route whose worst crossing is the best available.
 *
 * A search rather than a walk down the list, for two reasons.
 *
 * Sorting segments by x and pairing consecutive ones only describes a gate
 * built as one left-to-right chain, which gate 1 happens to be. The moment a
 * gate stacks a ledge over its own ground, that reading skips the overlap as a
 * negative gap and measures the next gap from the wrong lip — inventing a
 * crossing nobody has to make and missing the one they do.
 *
 * And a gate offers more jumps than it requires. That same ledge can be left
 * from as well as stood on, and the jump off it is longer than the one along
 * the ground. Holding the touch budget against every jump a gate *offers*
 * would flag geometry nobody has to cross; holding it against one arbitrary
 * route would miss a tight crossing on the route the hunter takes. So: of all
 * routes to a platform, the one whose worst crossing is best. That is
 * widest-path — Dijkstra with min-of-max where the sum would be — and with
 * twenty-odd platforms in a gate the naive O(n²) selection is free.
 */
function routes(gate, arcs) {
  const start = segmentAt(gate, gate.spawnX);
  const best = new Map();
  if (!start) return best;
  // `Infinity`: standing at the entrance has cost nothing yet.
  best.set(start, { reserve: Infinity, worst: null });

  const settled = new Set();
  for (;;) {
    let s = null;
    for (const [seg, v] of best) {
      if (settled.has(seg)) continue;
      if (!s || v.reserve > best.get(s).reserve) s = seg;
    }
    if (!s) break;
    settled.add(s);
    const here = best.get(s);
    for (const t of gate.segments) {
      if (t === s || settled.has(t)) continue;
      const e = edge(s, t, arcs);
      if (!e) continue;
      const c = e.crossing;
      const reserve = c ? Math.min(here.reserve, c.reserve) : here.reserve;
      const known = best.get(t);
      if (known && known.reserve >= reserve) continue;
      // The crossing that decides the route: this one, if it is tighter than
      // anything before it, otherwise whatever was already the bottleneck.
      const worst = c && (!here.worst || c.reserve < here.worst.reserve) ? c : here.worst;
      best.set(t, { reserve, worst });
    }
  }
  return best;
}

// -- the five checks --------------------------------------------------------

/**
 * 1. There is a way to the exit whose every crossing keeps a quarter of its arc
 * in reserve.
 *
 * That reserve is the whole point: at 4.5-unit gaps the margin was small enough
 * that the jump had to leave within centimetres of the lip, and both scripted
 * bots died there repeatedly. Whether the exit can be reached *at all* is check
 * 3's question; this one is whether the way there is fair.
 *
 * The number is the bottleneck of the kindest route — the tightest crossing the
 * hunter cannot avoid. A gate may still offer a hairier optional jump, and that
 * is level design rather than an authoring error.
 */
function jumpReserve(gate, arcs, map) {
  const exit = segmentAt(gate, gate.exitX);
  const route = exit && map.get(exit);
  if (!route) return row(gate.id, 'jump reserve', true, 'no route to measure — see reachability');
  const w = route.worst;
  if (!w) return row(gate.id, 'jump reserve', true, 'nothing to cross');
  return row(
    gate.id,
    'jump reserve',
    w.reserve >= JUMP_RESERVE_MIN,
    `tightest ${pct(w.reserve)} at ${w.at} — ${w.need} of the ${w.arc.distance} ${w.move}`
  );
}

/**
 * 2. A spawn point is somewhere a body can actually be.
 *
 * Three ways it is not: overlapping a barrier its own encounter raises,
 * overlapping another body from the same encounter, or over a gap with no floor
 * under it. All three end the same way — the collision solver ejects the body,
 * or gravity takes it — and "wherever the solver puts it" is not a spawn point.
 *
 * Only the encounter's own barriers count. One encounter is live at a time, so
 * another encounter's barriers are down when these bodies arrive.
 */
function spawnPoints(gate) {
  const bad = [];
  let n = 0;
  for (const enc of gate.encounters ?? []) {
    const bodies = (enc.spawns ?? []).map((s) => bodyOf(gate, s)).filter((b) => b.stats);
    n += bodies.length;
    for (const b of bodies) {
      if (b.onGround && !hasFloorAt(gate, b.x)) {
        bad.push(`${enc.id}: ${b.archetype} at ${b.x} has no floor under it`);
      }
      for (const bx of barriersOf(enc)) {
        if (!spans(b.x - b.hw, b.x + b.hw, bx - BARRIER.hw, bx + BARRIER.hw)) continue;
        if (!spans(b.y, b.y + b.hh * 2, BARRIER.y0, BARRIER.y1)) continue;
        bad.push(`${enc.id}: ${b.archetype} at ${b.x} is inside the barrier at ${bx}`);
      }
    }
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        if (!spans(a.x - a.hw, a.x + a.hw, b.x - b.hw, b.x + b.hw)) continue;
        if (!spans(a.y, a.y + a.hh * 2, b.y, b.y + b.hh * 2)) continue;
        bad.push(`${enc.id}: ${a.archetype} at ${a.x} overlaps ${b.archetype} at ${b.x}`);
      }
    }
  }
  return row(gate.id, 'spawn points', bad.length === 0, bad.join('; ') || `${n} spawns, all clear`);
}

/**
 * 3. The exit can be reached from the entrance.
 *
 * Both ends need floor — a `spawnX` over a gap drops the hunter into the void
 * on frame one — and the platform the exit stands on has to come out of the
 * search above. Check 1 asks whether each crossing is comfortable; this asks
 * whether there is a route at all, which is a lower bar and a different
 * failure.
 */
function reachability(gate, arcs, map) {
  const bad = [];
  if (!hasFloorAt(gate, gate.spawnX)) bad.push(`no floor at spawnX ${gate.spawnX}`);
  if (!hasFloorAt(gate, gate.exitX)) bad.push(`no floor at exitX ${gate.exitX}`);
  if (gate.end < gate.exitX) bad.push(`end ${gate.end} is behind exitX ${gate.exitX}`);

  const exit = segmentAt(gate, gate.exitX);
  if (exit && !map.has(exit)) {
    bad.push(`no route from x ${gate.spawnX} to exitX ${gate.exitX}`);
  }
  return row(
    gate.id,
    'reachability',
    bad.length === 0,
    bad.join('; ') ||
      `x ${gate.spawnX} → ${gate.exitX}, ${map.size} of ${gate.segments.length} platforms reachable`
  );
}

/**
 * 4. No seal can outlive its fight.
 *
 * Barriers drop when every enemy the encounter spawned is dead, so anything it
 * spawns outside the seal is something the hunter cannot reach, cannot kill,
 * and is therefore locked in with forever. The trigger has to be inside too:
 * fire it from outside and the barriers rise between the hunter and the fight.
 */
function encounterLocks(gate) {
  const bad = [];
  let sealed = 0;
  for (const enc of gate.encounters ?? []) {
    if (!enc.lock) continue;
    sealed++;
    const [lx0, lx1] = enc.lock;
    // The standable interval is the seal minus the two slabs.
    const in0 = lx0 + BARRIER.hw;
    const in1 = lx1 - BARRIER.hw;
    if (in1 <= in0) {
      bad.push(`${enc.id}: seal [${lx0}, ${lx1}] has no room between its barriers`);
      continue;
    }
    if (enc.trigger - PLAYER.hw <= in0 || enc.trigger + PLAYER.hw >= in1) {
      bad.push(`${enc.id}: trigger ${enc.trigger} is not inside [${lx0}, ${lx1}]`);
    }
    for (const s of enc.spawns ?? []) {
      const b = bodyOf(gate, s);
      if (!b.stats) continue; // check 5 reports a type nothing can build
      if (b.x - b.hw < in0 || b.x + b.hw > in1) {
        bad.push(`${enc.id}: ${b.archetype} at ${b.x} is outside the seal [${lx0}, ${lx1}]`);
      }
    }
  }
  return row(
    gate.id,
    'encounter locks',
    bad.length === 0,
    bad.join('; ') || `${sealed} sealed, every spawn and trigger inside`
  );
}

/**
 * 5. Every archetype a gate names is one the game can build.
 *
 * `Game._spawn` returns silently when a name does not resolve, which is the
 * right thing for it to do and the reason this is invisible in play: the
 * encounter simply never finishes spawning, and if it seals, it never opens.
 */
function enemyTypes(gate) {
  // A set: an encounter naming the same missing archetype three times is one
  // authoring mistake, and printing it three times only buries the others.
  const bad = new Set();
  const seen = new Set();
  const w = gate.warden;
  for (const enc of gate.encounters ?? []) {
    for (const s of enc.spawns ?? []) {
      if (s.type === 'warden') {
        if (!w) {
          bad.add(`${enc.id}: names a Warden and the gate has none`);
          continue;
        }
        if (!w.title || !w.stats) bad.add(`${enc.id}: the Warden block has no title or stats`);
      }
      const b = bodyOf(gate, s);
      seen.add(s.type === 'warden' ? `warden → ${b.archetype}` : b.archetype);
      if (!ARCHETYPES[b.archetype]) bad.add(`${enc.id}: nothing builds a "${b.archetype}"`);
      else if (!b.stats) bad.add(`${enc.id}: "${b.archetype}" has no stats block`);
    }
  }
  return row(
    gate.id,
    'enemy types',
    bad.size === 0,
    [...bad].join('; ') || [...seen].join(', ') || 'no spawns'
  );
}

/**
 * 6. An archetype is met alone the first time it is met.
 *
 * `docs/SPEC-CAMPAIGN.md` user story 14: a tell learned in isolation is a tell
 * learned, and a tell first met in a crowd is one the hunter infers wrongly and
 * then has to unlearn. Three new archetypes arrive over gates 2, 3 and 4, so
 * this is the constraint most likely to be broken quietly — by adding one
 * enemy to an encounter that already existed, which looks like content and
 * reads as pacing.
 *
 * Campaign-ordered rather than per-gate, which is why it is the one check that
 * takes state: `seen` carries forward across gates, so gate 4's summoner is
 * measured against everything gates 1–3 already taught. A descriptor checked on
 * its own — a control fixture — gets whatever `seen` its caller hands it.
 *
 * **What it does not cover, stated so nobody assumes otherwise.** It compares
 * archetypes within one encounter's spawn list. It cannot see something left
 * alive by an *earlier* encounter — an unsealed fight the hunter ran away from,
 * or two locks whose ranges overlap — so "alone in its encounter" is the claim,
 * not "alone on the map". The crossing meets the stronger version by having
 * nothing else in the gate at all; gates 3 and 4 will have to be authored to
 * meet it too, and this check will not be what notices if they are not.
 */
/**
 * The only boundaries a gate's `beats` can fire on. `'phase'` is not one
 * `Game._fireBeats` itself recognises — it is read directly by
 * `Game.firePhaseBeat`, the Warden's own mid-fight hook (`docs/DECISIONS.md`
 * § "Boss/Warden dialogue returns") — but it is still the one other
 * boundary a gate descriptor is allowed to author against, so it belongs in
 * this set rather than being invisible to the check.
 */
const BEAT_BOUNDARIES = new Set(['enter', 'intro', 'cleared', 'phase']);

/**
 * A story beat only ever fires at a boundary `Game._fireBeats` recognises —
 * that part is still cheap to hold to on every run rather than trusted to
 * authoring care.
 *
 * The word budget itself was tighter once (16) and defended as a "read at a
 * glance" ceiling — `docs/PLAYTEST.md` round 3 is what a wall of text
 * competing with a live fight cost. `docs/DECISIONS.md` § "A Warden's intro
 * and defeat are a scene, not a line" is why that reasoning no longer binds
 * a single card: `storyWindow` holds until the player clicks NEXT, so
 * nothing here is ever racing a fixed timer or a fight underneath it the way
 * the cut window was. Elaborate content now lives in beat *count*, not in
 * cramming one card — Shakuni's scene is 21 beats, none of them long. This
 * stays a real ceiling, not a removed one, so a beat that grew into an
 * actual paragraph — the failure mode this always existed to catch — still
 * goes red.
 */
const BEAT_WORD_LIMIT = 30;

function storyBeats(gate) {
  const bad = [];
  for (const b of gate.beats ?? []) {
    if (!BEAT_BOUNDARIES.has(b.at)) bad.push(`${b.at ?? '(none)'}: not a boundary _fireBeats fires on`);
    const words = `${b.big ?? ''} ${b.body ?? ''}`.trim().split(/\s+/).filter(Boolean).length;
    if (words > BEAT_WORD_LIMIT) bad.push(`${b.at}: ${words} words, over the ${BEAT_WORD_LIMIT}-word glance budget`);
  }
  const n = gate.beats?.length ?? 0;
  return row(gate.id, 'story beats', bad.length === 0, bad.join('; ') || (n ? `${n} beat(s), all boundary-only and glance-length` : 'none'));
}

function soloDebut(gate, arcs, map, seen) {
  const bad = [];
  const debuts = [];
  for (const enc of gate.encounters ?? []) {
    const kinds = [...new Set((enc.spawns ?? []).map((s) => bodyOf(gate, s).archetype))];
    const fresh = kinds.filter((k) => !seen.has(k));
    for (const k of kinds) seen.add(k);
    if (!fresh.length) continue;
    debuts.push(`${fresh.join(', ')} in ${enc.id}`);
    if (kinds.length > 1) bad.push(`${enc.id}: ${fresh.join(', ')} debuts alongside ${kinds.join(' + ')}`);
  }
  return row(gate.id, 'solo debut', bad.length === 0, bad.join('; ') || debuts.join('; ') || 'nothing new here');
}

const CHECKS = [jumpReserve, spawnPoints, reachability, encounterLocks, enemyTypes, soloDebut, storyBeats];

/**
 * Every check against one descriptor.
 *
 * `seen` is the set of archetypes the hunter has already been introduced to,
 * and `soloDebut` adds to it. Callers wanting a descriptor judged on its own
 * hand it a set that already contains everything — see `nothingNew` below.
 */
export function checkGate(gate, arcs, seen = new Set()) {
  const map = routes(gate, arcs);
  return CHECKS.map((fn) => fn(gate, arcs, map, seen));
}

/** Every check against every gate the campaign contains, in campaign order. */
export function checkGates(arcs) {
  const seen = new Set();
  return GATES.flatMap((gate) => checkGate(gate, arcs, seen));
}

// -- telegraphs -------------------------------------------------------------

/**
 * Every tell in the game, and the shortest one the hunter has ever had to
 * answer.
 *
 * The floor is the raakchyas's pounce, and it is *derived* rather than chosen: it
 * is the first tell gate 1 teaches, it is the one four playtest rounds were
 * played against, and the suite's paired signed-rank test is the evidence that
 * it buys what it is supposed to. A new enemy whose wind-up undercuts it is
 * asking the hunter for a reaction the game has never shown to be available.
 *
 * The Guardian's rows are its *enraged* wind-ups, because those are the ones
 * that actually have to be answered — measuring the first-phase numbers would
 * report a comfort the second phase does not have. Its sweep at 0.429 s is the
 * tightest thing in the game and clears the floor by 9 ms, which is worth
 * knowing and is not a number to go shaving.
 */
const TELLS = [
  { archetype: 'raakchyas', tell: 'pounce', windup: RAAKCHYAS.pounce.windup },
  { archetype: 'charger', tell: 'charge', windup: CHARGER.charge.windup },
  { archetype: 'kawach', tell: 'bash', windup: KAWACH.bash.windup },
  { archetype: 'bhootBatti', tell: 'bolt', windup: BHOOT_BATTI.shoot.windup },
  { archetype: 'tantrik', tell: 'summon', windup: TANTRIK.summon.windup },
  // Shakuni's own windup shortens on enrage (`docs/research/villain-roster.md`:
  // "escalation comes from the die's telegraphs tightening"), so — same
  // reasoning as the four bosses below — the row that has to be answered is
  // the enraged one, not the base 1.0s.
  { archetype: 'shakuni', tell: 'die, enraged', windup: SHAKUNI.die.windup * SHAKUNI.enrageWindupMul },
  // Bakasura's two windups both shorten on enrage, same reasoning as Shakuni
  // above — the row that has to clear the floor is the enraged one.
  { archetype: 'bakasura', tell: 'grab, enraged', windup: BAKASURA.grab.windup * BAKASURA.enrageWindupMul },
  { archetype: 'bakasura', tell: 'tackle, enraged', windup: BAKASURA.tackle.windup * BAKASURA.enrageWindupMul },
  // Taraka's claw-pounce windup tightens after her curse-reveal
  // (`TARAKA.phaseWindupMul`), same reasoning as Shakuni's and Bakasura's own
  // rows — the number that has to clear the floor is the one she fights with
  // for the rest of the encounter, not her pre-reveal one.
  { archetype: 'taraka', tell: 'claw, revealed', windup: TARAKA.charge.windup * TARAKA.phaseWindupMul },
  ...Object.entries(GUARDIAN.attacks).map(([name, a]) => ({
    archetype: 'guardian',
    tell: `${name}, enraged`,
    windup: a.windup * GUARDIAN.enrageWindupMul,
  })),
  ...Object.entries(GORU_MUKH.attacks).map(([name, a]) => ({
    archetype: 'goruMukh',
    tell: `${name}, enraged`,
    windup: a.windup * GORU_MUKH.enrageWindupMul,
  })),
  ...Object.entries(HAKIM.attacks).map(([name, a]) => ({
    archetype: 'hakim',
    tell: `${name}, enraged`,
    windup: a.windup * HAKIM.enrageWindupMul,
  })),
  ...Object.entries(CHIRANJIVI.attacks).map(([name, a]) => ({
    archetype: 'chiranjivi',
    tell: `${name}, enraged`,
    windup: a.windup * CHIRANJIVI.enrageWindupMul,
  })),
  ...Object.entries(MAUN_ANKUR.attacks).map(([name, a]) => ({
    archetype: 'maunAnkur',
    tell: `${name}, enraged`,
    windup: a.windup * MAUN_ANKUR.enrageWindupMul,
  })),
];

const TELL_FLOOR = RAAKCHYAS.pounce.windup;

/**
 * The telegraph check.
 *
 * `reaction` is passed in rather than imported, for the same reason `arcs` is:
 * it belongs to the suite, which is where reaction latency is defined and
 * justified, and importing it here would put a second copy of the number in the
 * repo. It is also what makes this "measured the same way" — the margin
 * reported is against the same 250 ms both playthrough bots play at.
 */
export function telegraphs(reaction) {
  const out = [];
  const judge = (t) => ({
    check: `${t.archetype} · ${t.tell}`,
    ok: t.windup >= TELL_FLOOR - 1e-9,
    detail:
      `${t.windup.toFixed(3)}s wind-up, ` +
      `${(t.windup - reaction).toFixed(3)}s left after ${reaction.toFixed(2)}s of reaction`,
  });
  for (const t of TELLS) out.push(judge(t));

  out.push({
    check: 'the floor outlasts the reaction',
    ok: TELL_FLOOR > reaction,
    detail: `floor ${TELL_FLOOR.toFixed(3)}s against ${reaction.toFixed(2)}s — the raakchyas's pounce sets it`,
  });

  // A list nobody maintains is a list that silently stops covering things, so
  // the check that the table is complete is part of the check.
  const missing = Object.keys(ARCHETYPES).filter((a) => !TELLS.some((t) => t.archetype === a));
  out.push({
    check: 'every archetype has a tell',
    ok: missing.length === 0,
    detail: missing.length
      ? `nothing listed for ${missing.join(', ')}`
      : `${TELLS.length} tells across ${Object.keys(ARCHETYPES).length} archetypes`,
  });

  // And the control: a wind-up under the floor has to come out red, or this
  // whole block is a list of numbers nobody is actually gating on.
  const short = judge({ archetype: 'control', tell: 'short', windup: TELL_FLOOR - 0.05 });
  out.push({
    check: 'a tell under the floor',
    ok: !short.ok,
    detail: short.ok ? 'NOT CAUGHT' : `${short.detail} — caught`,
  });
  return out;
}

// -- controls ---------------------------------------------------------------

/**
 * A descriptor that passes all five, which every negative control below breaks
 * in exactly one way. Its gap is 3.5 — comfortably inside the reserve at the
 * arc this build measures, and the arc is passed in rather than assumed, so
 * this fixture cannot rot the way a hardcoded one would.
 */
const CONTROL = {
  id: 'control',
  name: 'Control',
  spawnX: 2,
  voidY: -26,
  arenaTop: 0,
  exitX: 26,
  end: 30,
  segments: [
    { x0: 0, x1: 10, top: 0 },
    { x0: 13.5, x1: 30, top: 0 },
  ],
  encounters: [
    {
      id: 'fight',
      trigger: 18,
      lock: [15, 28],
      spawns: [
        { type: 'raakchyas', x: 20, delay: 0 },
        { type: 'bhootBatti', x: 24, y: 3, delay: 0.4 },
      ],
    },
  ],
  warden: { archetype: 'guardian', title: 'CONTROL', stats: ARCHETYPES.guardian.stats },
};

/**
 * The same gate with a ledge stacked over its own ground — a shape no gate has
 * yet and several of the remaining nine will.
 *
 * A *positive* control: it must come out green, and it is the evidence that the
 * search is a search. Read as a left-to-right chain it comes out red. Sorted by
 * x0 the ledge lands between the two pieces of ground; its overlap with the
 * first reads as a negative gap and is skipped, and the 3.5 crossing along the
 * ground is then never measured at all — what gets measured instead is 6 → 13.5
 * from the ledge's far lip, a 7.5 jump at 16% reserve that the hunter has no
 * reason to make. The ground route is 3.5 at 31%, and that is what a search
 * finds.
 */
const LAYERED = {
  ...CONTROL,
  id: 'layered',
  segments: [
    { x0: 0, x1: 10, top: 0 },
    { x0: 13.5, x1: 30, top: 0 },
    { x0: 4, x1: 6, top: 3 },
  ],
};

/**
 * A hunter who has already met everything, which is what a control fixture
 * wants: it is one gate judged on its own, not a campaign, so nothing in it
 * should read as a debut. The one control that *is* about debuts asks for an
 * empty set instead.
 */
const nothingNew = () => new Set(Object.keys(ARCHETYPES));

/** A copy of CONTROL with one thing wrong. */
function broken(mutate) {
  const gate = { ...CONTROL, segments: CONTROL.segments.map((s) => ({ ...s })) };
  gate.encounters = CONTROL.encounters.map((e) => ({
    ...e,
    lock: e.lock ? [...e.lock] : undefined,
    spawns: e.spawns.map((s) => ({ ...s })),
  }));
  gate.warden = { ...CONTROL.warden };
  mutate(gate, gate.encounters[0], gate.encounters[0].spawns);
  return gate;
}

/**
 * One deliberately broken descriptor per failure each check exists to catch.
 *
 * A static check nobody has watched fail is not known to work. Breaking gate 1
 * by hand proves it once, on one build, for whoever was watching; this proves
 * it on every run, and it also proves the checks are *specific* — a control
 * only ever asserts that its own check went red, so a check that failed
 * everything indiscriminately would still be caught by the real gates staying
 * green in the same report.
 *
 * They cost microseconds and allocate nothing but plain objects.
 */
const CONTROLS = [
  {
    check: 'jump reserve',
    why: 'a gap that eats the whole arc',
    gate: broken((g) => (g.segments[1].x0 = 15.4)),
  },
  {
    check: 'spawn points',
    why: 'a body standing in a barrier',
    gate: broken((g, e, s) => (s[0].x = 15.3)),
  },
  {
    check: 'spawn points',
    why: 'two bodies in the same place',
    gate: broken((g, e, s) => {
      s[1].x = 20.4;
      s[1].y = 0.1;
    }),
  },
  {
    check: 'spawn points',
    why: 'a body over the gap',
    gate: broken((g, e, s) => {
      s[0].x = 11.5;
      e.lock = undefined;
    }),
  },
  {
    check: 'reachability',
    why: 'a gap wider than a double jump',
    gate: broken((g) => (g.segments[1].x0 = 22)),
  },
  {
    check: 'reachability',
    why: 'an entrance over the void',
    gate: broken((g) => (g.spawnX = 11.5)),
  },
  {
    check: 'encounter locks',
    why: 'a spawn outside the seal',
    gate: broken((g, e, s) => (s[0].x = 29)),
  },
  {
    check: 'encounter locks',
    why: 'a trigger outside the seal',
    gate: broken((g, e) => (e.trigger = 12)),
  },
  {
    check: 'enemy types',
    why: 'an archetype nothing builds',
    // A plural rather than a plausible future archetype. This control used to
    // name `charger`, which was a name nothing built right up until the
    // crossing's ticket built one — at which point a negative control would
    // have quietly gone green and taken the check's evidence with it.
    gate: broken((g, e, s) => (s[0].type = 'raakchyases')),
  },
  {
    check: 'solo debut',
    why: 'a new archetype met in a crowd',
    // Nothing is mutated: the control gate's one encounter already mixes a
    // raakchyas and a bhoot-batti, and judged against an empty `seen` — a hunter who has
    // met neither — that is precisely the fault. Which is also why every other
    // control here is judged against `nothingNew()`.
    gate: broken(() => {}),
    seen: () => new Set(),
  },
  {
    check: 'enemy types',
    why: 'a Warden with no stats',
    gate: broken((g, e, s) => {
      s[0].type = 'warden';
      delete g.warden.stats;
    }),
  },
];

/**
 * Run the controls: two descriptors that must come out green, and one per
 * fault, each of which must come out red on the check that owns it.
 */
export function controls(arcs) {
  const out = [];
  const green = (name, why, gate) => {
    const rows = checkGate(gate, arcs, nothingNew());
    out.push({
      check: name,
      why,
      ok: rows.every((r) => r.ok),
      detail: rows.filter((r) => !r.ok).map((r) => `${r.check}: ${r.detail}`).join('; ') || 'all five green',
    });
  };
  green('the control itself', 'nothing wrong with it', CONTROL);
  green('a stacked ledge', 'geometry that is not one chain', LAYERED);

  for (const c of CONTROLS) {
    const rows = checkGate(c.gate, arcs, c.seen ? c.seen() : nothingNew());
    const target = rows.find((r) => r.check === c.check);
    // A control naming a check that does not exist is a red row rather than an
    // exception: throwing here would take the whole report down with it.
    if (!target) out.push({ check: c.check, why: c.why, ok: false, detail: 'no check by that name' });
    else out.push({ check: c.check, why: c.why, ok: !target.ok, detail: target.ok ? 'NOT CAUGHT' : target.detail });
  }
  return out;
}
