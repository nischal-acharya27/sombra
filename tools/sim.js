// Headless verification. Open `index.html?sim` to run it.
//
// Nothing here renders. The suite steps `Game.update` at the fixed timestep and
// drives the real `Input` object, so the bots play through exactly the code
// path a human does — same buffering, same cancel windows, same collision.
//
// This exists because feel cannot be verified automatically but *reachability
// and winnability* can, and both are easy to break while tuning. Every bot
// below has caught a real bug at least once.

import { PLAYER, ATTACKS } from '../src/game/config.js';

const DT = 1 / 120;
/** Seeds per playthrough sweep. Eight runs cost about a second. */
const RUNS_PER_SWEEP = 8;

class Bot {
  constructor(game, input) {
    this.g = game;
    this.input = input;
    this.p = game.player;
  }
  press(a) {
    this.input.buffer.set(a, 0.16);
  }
  hold(a, on = true) {
    if (on) this.input.held.add(a);
    else this.input.held.delete(a);
  }
  releaseAll() {
    this.input.held.clear();
  }
  step() {
    this.g.update(DT);
    this.input.endFrame(DT);
  }
}

/** Measure the jump envelope by actually jumping. */
function measureArcs(game, input) {
  const bot = new Bot(game, input);
  const p = game.player;
  // Game.update is a no-op unless a run is live, so every measurement here
  // would silently read zero without this.
  game.start();

  const run = (holdRun, useDouble) => {
    p.reset(4, 0);
    p.grounded = true;
    p.state = 'idle';
    bot.releaseAll();
    for (let i = 0; i < 60; i++) {
      bot.hold('right', holdRun);
      bot.step();
    }
    const x0 = p.x;
    const y0 = p.y;
    bot.press('jump');
    let maxY = y0;
    let doubled = false;
    for (let i = 0; i < 900; i++) {
      bot.hold('right', holdRun);
      if (useDouble && !doubled && !p.grounded && p.vy < 1) {
        bot.press('jump');
        doubled = true;
      }
      bot.step();
      maxY = Math.max(maxY, p.y);
      if (i > 30 && p.grounded) break;
    }
    bot.releaseAll();
    return { height: +(maxY - y0).toFixed(2), distance: +(p.x - x0).toFixed(2) };
  };

  return {
    standing: run(false, false),
    running: run(true, false),
    runningDouble: run(true, true),
  };
}

/**
 * Attacking in mid-air must not cost you the jump — and must not cost you the
 * controls either.
 *
 * Round 1 of the playtest said "if you jump and go forward and attack, the
 * motion stops". `cb10a5d` answered that by making the lunge a floor on `vx`
 * rather than an assignment, measured 9.6 → 8.5 over 200 ms, and round 2 still
 * said no. So the velocity at the instant of the swing was never the whole
 * story.
 *
 * This probe flies the same running jump under four conditions. The pair that
 * matters is `hold fwd` against `released` — the *same* swing with the
 * direction key down and with it let go. If those two produce the same travel,
 * the hunter is coasting on stored velocity and the stick is doing nothing,
 * which is what "the motion stops" describes even while `vx` reads healthy.
 */
function measureAirAttack(game, input) {
  const bot = new Bot(game, input);
  const p = game.player;
  game.start();

  // Own seed scope. Enemy jitter and spawn scatter draw on Math.random, and the
  // suite runs one sequential stream — a probe added here would otherwise shift
  // every draw after it and silently re-roll the playthrough and boss fights.
  // That is a test that breaks its neighbours by existing.
  const fly = ({ swingAt, swings = 1, after = 'hold' }) => {
    p.reset(4, 0);
    p.grounded = true;
    p.state = 'idle';
    bot.releaseAll();
    // Long enough to be at genuine top speed, so the probe measures the attack
    // and not the acceleration curve.
    for (let i = 0; i < 90; i++) {
      bot.hold('right', true);
      bot.step();
    }
    bot.press('jump');
    bot.step();

    const x0 = p.x;
    let t = 0;
    let fired = 0;
    let nextSwing = swingAt;
    let swingX = null;
    let swingY = null;
    let dxDuring = null;
    let dyDuring = null;
    const window = 0.30; // air1's duration: the frames the swing owns

    for (let i = 0; i < 400; i++) {
      // Once the first swing is out, `after` decides what the player is asking
      // for. That is the whole experiment.
      if (fired === 0) {
        bot.hold('right', true);
        bot.hold('left', false);
      } else {
        bot.hold('right', after === 'hold');
        bot.hold('left', after === 'reverse');
      }
      if (swingAt !== null && fired < swings && t >= nextSwing) {
        bot.press('light');
        if (fired === 0) {
          swingX = p.x;
          swingY = p.y;
        }
        fired++;
        nextSwing = t + 0.20; // inside air1's cancel window, as a player would
      }
      bot.step();
      t += DT;
      if (swingX !== null && dxDuring === null && t >= swingAt + window) {
        dxDuring = p.x - swingX;
        dyDuring = p.y - swingY;
      }
      if (t > 0.1 && p.grounded) break;
    }
    bot.releaseAll();
    return {
      airtime: +t.toFixed(2),
      dx: +(p.x - x0).toFixed(2),
      dxDuring: dxDuring === null ? 0 : +dxDuring.toFixed(2),
      dyDuring: dyDuring === null ? 0 : +dyDuring.toFixed(2),
    };
  };

  return withSeed(0xa17a77, () => {
    const clean = fly({ swingAt: null });
    const held = fly({ swingAt: 0.35, after: 'hold' });
    const released = fly({ swingAt: 0.35, after: 'release' });
    const reversed = fly({ swingAt: 0.35, after: 'reverse' });
    const chained = fly({ swingAt: 0.35, swings: 2, after: 'hold' });
    // Top speed × the swing's own duration: what an unimpeded 0.30 s is worth.
    const ideal = PLAYER.runSpeed * 0.30;
    const rows = [
      { when: 'no attack', ...clean },
      { when: 'swing, hold fwd', ...held },
      { when: 'swing, released', ...released },
      { when: 'swing, reversed', ...reversed },
      { when: 'chain x2, hold', ...chained },
    ];
    for (const r of rows) r.ofTop = r.dxDuring ? +(r.dxDuring / ideal).toFixed(2) : 0;
    // The full range the player commands during a swing: forward against back.
    // Measured against `hold` rather than `release` because the hunter enters
    // the swing already at top speed, where holding forward can only maintain
    // and there is almost no headroom for the input to show up in.
    const authority = +(held.dxDuring - reversed.dxDuring).toFixed(2);
    return { rows, authority };
  });
}

/**
 * The launcher juggle: K, then Space, then J.
 *
 * The playtest could not make it work twice running — "launches the enemy, but
 * then Space jumps too high, and doesn't land" — so this measures the geometry
 * instead of arguing about it. It sweeps the delay between the jump and the
 * swing and reports which delays connect, which is the *window* the player is
 * being asked to hit. A window of a few hundredths of a second is not a hard
 * combo, it is an accident.
 */
function measureJuggle(game, input) {
  const bot = new Bot(game, input);
  const p = game.player;

  return withSeed(0x105510, () => {
    const attempt = (swingDelay) => {
      game.start();
      p.reset(20, game.level.groundAt(20) + 0.1);
      p.grounded = true;
      p.state = 'idle';
      p.facing = 1;
      bot.releaseAll();
      for (let i = 0; i < 20; i++) bot.step();

      game._spawn({ type: 'beast', x: p.x + 1.5, encounter: 'test' });
      const e = game.enemies[game.enemies.length - 1];
      e.spawnT = 0;
      e.root.scale.setScalar(1);
      // Park the beast's AI, on this instance only. A live beast pounces during
      // the launcher's own active frames and leaves the hitbox, so the first
      // version of this probe spent its time measuring the pounce and reported
      // that the launcher does not connect. `moveList` already proves it does;
      // what is under test here is the *juggle*, so the target has to hold
      // still for it.
      e.cfg = { ...e.cfg, chaseRange: 0, pounce: { ...e.cfg.pounce, range: 0 } };

      const groundY = e.y;
      const L = ATTACKS.launcher;
      e.takeHit({ damage: L.damage, knock: L.knock, launch: L.launch, fromX: p.x });
      const hpAfterLaunch = e.hp;

      // Jump first and confirm the feet have left the ground before the clock
      // starts. Buffering both presses in the same frame does not work and is
      // not what a player does: `light` is read before `jump` in `_actions`, so
      // the grounded swing wins, the buffered jump expires inside its own
      // recovery, and the probe measures a standing light attack against a
      // launched enemy — which "connects" at every delay and proves nothing.
      bot.press('jump');
      let enemyPeak = e.y;
      let playerPeak = p.y;
      for (let i = 0; i < 40 && p.grounded; i++) {
        bot.step();
        enemyPeak = Math.max(enemyPeak, e.y);
      }

      let swung = false;
      let t = 0;
      for (let i = 0; i < 400; i++) {
        if (!swung && t >= swingDelay) {
          bot.press('light');
          swung = true;
        }
        bot.step();
        t += DT;
        enemyPeak = Math.max(enemyPeak, e.y);
        playerPeak = Math.max(playerPeak, p.y);
        if (swung && t > swingDelay + 0.6) break;
      }
      bot.releaseAll();
      return {
        connected: e.hp < hpAfterLaunch,
        enemyPeak: +(enemyPeak - groundY).toFixed(2),
        playerPeak: +(playerPeak - groundY).toFixed(2),
      };
    };

    const delays = [];
    for (let d = 0; d <= 0.85; d += 0.05) delays.push(+d.toFixed(2));
    const results = delays.map((d) => ({ d, ...attempt(d) }));
    const hits = results.filter((r) => r.connected).map((r) => r.d);
    const ref = results[0];
    return {
      results,
      hits,
      window: hits.length ? +(Math.max(...hits) - Math.min(...hits) + 0.05).toFixed(2) : 0,
      first: hits.length ? Math.min(...hits) : null,
      enemyPeak: ref.enemyPeak,
      playerPeak: ref.playerPeak,
    };
  });
}

/**
 * Static reachability: does every gap in the level fit inside the measured
 * jump envelope, with the body's width accounted for?
 */
function checkGaps(game, arcs) {
  const solids = [...game.level.solids].sort((a, b) => a.x0 - b.x0);
  const hw = game.player.hw;
  const out = [];
  for (let i = 0; i < solids.length - 1; i++) {
    const a = solids[i];
    const b = solids[i + 1];
    const gap = b.x0 - a.x1;
    if (gap <= 0.01) continue;
    const rise = b.y1 - a.y1;
    // Crossing costs the gap plus half a body at each lip.
    const need = gap + hw * 2;
    const canSingle = need <= arcs.running.distance && rise <= arcs.running.height - 0.4;
    const canDouble = need <= arcs.runningDouble.distance && rise <= arcs.runningDouble.height - 0.4;
    out.push({
      at: `${a.x1.toFixed(0)}→${b.x0.toFixed(0)}`,
      gap: +gap.toFixed(1),
      rise: +rise.toFixed(1),
      need: +need.toFixed(1),
      single: canSingle,
      double: canDouble,
      ok: canDouble,
    });
  }
  return out;
}

/**
 * Play the level start to finish. Deliberately a dumb bot: hold right, jump at
 * gaps, swing at anything close. If a dumb bot can finish, the level contains
 * no unpassable geometry — which is the only claim this test makes.
 */
function playthrough(game, input, { maxSeconds = 400, readTells = false } = {}) {
  game.start();
  const bot = new Bot(game, input);
  const p = game.player;
  let attackCd = 0;
  let magicCd = 0;
  let dashCd = 0;
  let stuckAt = p.x;
  let stuckFor = 0;
  let chasing = false;
  const steps = Math.floor(maxSeconds / DT);

  for (let i = 0; i < steps; i++) {
    if (game.state !== 'playing') break;

    const target = nearestEnemy(game);
    const dist = target ? Math.abs(target.x - p.x) : Infinity;
    attackCd -= DT;
    magicCd -= DT;
    dashCd -= DT;

    // Every threat in the game announces itself before it commits. A bot that
    // watches for that and dashes should clear the gate; one that ignores it
    // should not. That difference is the entire combat design, so the suite
    // runs both and only holds the reading bot to a pass.
    if (readTells && dashCd <= 0) {
      const committing = game.enemies.find(
        (e) =>
          !e.dead &&
          Math.abs(e.x - p.x) < 6.5 &&
          (e.state === 'windup' || e.state === 'pounce' || e.state === 'telegraph' || e.state === 'charging')
      );
      if (committing) {
        bot.hold('right', false);
        bot.hold('left', false);
        bot.hold(committing.x > p.x ? 'left' : 'right', true);
        bot.press('dash');
        dashCd = 0.5;
        bot.step();
        continue;
      }
    }

    // Melee only reaches about 1.8 above the hunter's feet on a light swing.
    // Without this check the bot happily swings at a wisp hovering overhead,
    // which whiffs forever and — over a pit — swings it to death.
    const inMeleeArc = target && Math.abs(target.y - p.y) < 1.8;

    // Fight what is in front of you, otherwise keep walking right.
    if (target && dist < 2.6 && inMeleeArc) {
      bot.hold('right', false);
      bot.hold('left', false);
      p.facing = target.x > p.x ? 1 : -1;
      if (attackCd <= 0) {
        bot.press('light');
        attackCd = 0.2;
      }
    } else if (
      target &&
      dist < 3.2 &&
      !inMeleeArc &&
      target.y > p.y &&
      // Only leap at something hovering over solid ground. Chasing one out
      // across a gap is how a bot drowns itself.
      game.level.groundAt(target.x, p.y + 0.6) !== -Infinity
    ) {
      // Something hovering just overhead: jump into it. Without this the bot
      // walks underneath wisps forever, which measures the bot's vocabulary
      // rather than the level.
      bot.hold('right', false);
      bot.hold('left', false);
      p.facing = target.x > p.x ? 1 : -1;
      if (p.grounded) bot.press('jump');
      else if (attackCd <= 0) {
        bot.press('light');
        attackCd = 0.2;
      }
    } else {
      // Keep running. Casting used to be an `else if` that released the
      // movement key, and since a cast also braked the hunter, the bot would
      // take off across a gap from a standstill and die to a jump the level
      // had already been proven to allow.
      //
      // Turning around is a last resort, deliberately.
      //
      // Holding right unconditionally meant a beast that ended up *behind* the
      // bot left it shoving at a sealed barrier for 45 s with a live target
      // five units away — a deadlock in the bot's vocabulary that reads exactly
      // like unpassable level geometry, which is the one thing this suite is
      // supposed to be able to tell you about.
      //
      // But letting it chase freely is worse. Given a standing order to close
      // on the nearest enemy the naive bot kills beasts during their wind-up,
      // clears the gate taking 33 damage, and quietly destroys the claim the
      // whole suite rests on — that a bot ignoring telegraphs must lose. So it
      // only turns around once it has genuinely stopped making progress, which
      // resolves the deadlock and leaves ordinary play exactly as it was.
      //
      // The decision has to latch. Triggering it on `stuckFor` alone thrashed:
      // one step off the barrier reset the counter, the chase switched off, and
      // the bot walked straight back into the wall — it ground out its whole
      // health bar that way in six of eight seeds with two wisps sitting
      // unreachable at the far end of the bridge.
      const sealed = !!game.activeEncounter?.lock;
      if (!sealed || !target) chasing = false;
      else if (!chasing && stuckFor > 2) chasing = true;
      else if (chasing && dist < 2.4) chasing = false; // close enough to fight
      const goLeft = chasing && target && target.x < p.x;
      bot.hold('left', goLeft);
      bot.hold('right', !goLeft);
      // Don't start a cast on the approach to a ledge — a human would not, and
      // it makes the test measure the level rather than the bot's timing.
      const runwayLeft = game.level.groundAt(p.x + 2.5, p.y + 0.6) !== -Infinity;
      if (target && dist < 14 && !inMeleeArc && magicCd <= 0 && p.mp >= 16 && runwayLeft) {
        p.facing = target.x > p.x ? 1 : -1;
        bot.press('magic');
        magicCd = 0.5;
      }
    }

    // Jump when the ground runs out ahead, and again once falling if it still
    // has. The look-ahead is deliberately short: probing far in front makes the
    // bot leap well before the lip and throw away most of its horizontal reach,
    // which then reads as a level-design failure rather than a bot failure.
    const ahead = p.x + 1.0;
    const groundAhead = game.level.groundAt(ahead, p.y + 0.6);
    const needJump = groundAhead === -Infinity || p.y - groundAhead > 2.2;
    if (p.grounded && needJump) bot.press('jump');
    if (!p.grounded && p.vy < 0 && p.jumps < p.maxJumps) {
      const under = game.level.groundAt(p.x, p.y + 0.6);
      const overVoid = under === -Infinity || p.y - under > 2.2;
      // Only spend the second jump when actually falling short — that is, when
      // already *below* the ledge being aimed at. Firing it at every apex added
      // three units of height and sailed the bot clean over the landing island
      // into the next gap, which looked exactly like an unreachable jump and
      // sent me tuning level geometry that was never wrong.
      const landing = nextSolidAhead(game, p.x);
      if (overVoid && landing && p.y < landing.y1 + 0.4) bot.press('jump');
    }

    // A step up that is not a gap: hop it.
    if (p.grounded && groundAhead > p.y + 0.6) bot.press('jump');

    bot.step();

    if (Math.abs(p.x - stuckAt) < 0.4) {
      stuckFor += DT;
    } else {
      stuckAt = p.x;
      stuckFor = 0;
    }
    // Stuck against a live encounter barrier is expected; stuck in open world
    // is a level bug.
    if (stuckFor > 45) {
      bot.releaseAll();
      return { ok: false, reason: `stuck at x=${p.x.toFixed(1)} for 45s`, x: p.x, time: game.runTime };
    }
  }
  bot.releaseAll();

  return {
    ok: game.state === 'cleared',
    state: game.state,
    x: +p.x.toFixed(1),
    time: +game.runTime.toFixed(1),
    kills: game.kills,
    level: game.level_,
    damageTaken: Math.round(game.damageTaken),
    hp: Math.round(p.hp),
  };
}

/** The next platform whose left edge is ahead of x — i.e. the landing target. */
function nextSolidAhead(game, x) {
  let best = null;
  for (const s of game.level.solids) {
    if (s.x1 <= x) continue;
    if (!best || s.x0 < best.x0) best = s;
  }
  return best;
}

function nearestEnemy(game) {
  let best = null;
  let bd = Infinity;
  for (const e of game.enemies) {
    if (e.dead) continue;
    const d = Math.abs(e.x - game.player.x);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}

/**
 * The Guardian, three ways. A boss that only one strategy beats is a boss
 * tuned to a single solution; all three should win, at different costs.
 */
function bossFight(game, input, strategy, { maxSeconds = 240 } = {}) {
  game.start();
  const bot = new Bot(game, input);
  const p = game.player;

  // Skip to the arena rather than replaying the level for each strategy.
  p.x = 178;
  p.y = 3.2;
  for (const e of game.encounters) {
    if (e.id !== 'guardian') {
      e.started = true;
      e.cleared = true;
    }
  }
  game.activeEncounter = null;

  let attackCd = 0;
  let magicCd = 0;
  const steps = Math.floor(maxSeconds / DT);

  for (let i = 0; i < steps; i++) {
    if (game.state !== 'playing') break;
    const boss = game.boss;
    attackCd -= DT;
    magicCd -= DT;

    if (!boss || boss.dead) {
      bot.hold('right', true);
      bot.step();
      continue;
    }

    const dx = boss.x - p.x;
    const dist = Math.abs(dx);
    p.facing = dx > 0 ? 1 : -1;
    bot.hold('right', false);
    bot.hold('left', false);

    const committing = boss.state === 'telegraph' || boss.state === 'charging' || boss.state === 'leaping';

    if (strategy === 'mash') {
      // Walk in, never stop swinging, never dodge.
      if (dist > 2.2) bot.hold(dx > 0 ? 'right' : 'left', true);
      else if (attackCd <= 0) {
        bot.press('light');
        attackCd = 0.19;
      }
    } else if (strategy === 'dodge') {
      // Read the tell, dash out, punish the recovery.
      if (committing) {
        bot.hold(dx > 0 ? 'left' : 'right', true);
        bot.press('dash');
      } else if (boss.state === 'recover') {
        if (dist > 2.2) bot.hold(dx > 0 ? 'right' : 'left', true);
        else if (attackCd <= 0) {
          bot.press('light');
          attackCd = 0.19;
        }
      } else if (dist > 4) {
        bot.hold(dx > 0 ? 'right' : 'left', true);
      } else if (attackCd <= 0) {
        bot.press('light');
        attackCd = 0.19;
      }
    } else if (strategy === 'ranged') {
      // Kite: hold distance, spend mana, never commit to melee.
      if (dist < 9) bot.hold(dx > 0 ? 'left' : 'right', true);
      if (magicCd <= 0 && p.mp >= 22) {
        bot.press('magic');
        magicCd = 0.4;
      }
      if (committing) bot.press('dash');
    }

    bot.step();
  }
  bot.releaseAll();

  const boss = game.boss;
  return {
    strategy,
    won: game.state === 'cleared' || (boss && boss.dead),
    playerHp: Math.round(Math.max(0, p.hp)),
    playerDied: game.state === 'dead',
    bossHpLeft: boss ? Math.round(Math.max(0, boss.hp)) : 0,
    seconds: +game.runTime.toFixed(1),
    damageTaken: Math.round(game.damageTaken),
  };
}

/** Every move connects and does its advertised damage. */
function moveList(game, input) {
  const bot = new Bot(game, input);
  const p = game.player;
  const results = [];

  for (const key of ['light1', 'light2', 'light3', 'launcher', 'air1', 'air2']) {
    game.start();
    // Spawn a target by hand at a known distance, inside every move's reach.
    game._spawn({ type: 'beast', x: p.x + 1.6, encounter: 'test' });
    const e = game.enemies[game.enemies.length - 1];
    e.spawnT = 0;
    e.root.scale.setScalar(1);
    const hpBefore = e.hp;
    p.facing = 1;
    // Air moves only need the airborne *state*; lifting the hunter off the
    // ground would put a grounded target below the hitbox and prove nothing.
    if (key.startsWith('air')) p.grounded = false;
    p._startAttack(key);
    for (let i = 0; i < 90; i++) bot.step();
    results.push({ move: key, damage: hpBefore - e.hp, connected: e.hp < hpBefore });
  }
  return results;
}

/**
 * Deterministic RNG for the duration of the suite.
 *
 * Enemy AI jitter, wisp drift phases and spawn scatter all draw on
 * Math.random, which made two consecutive runs of the same build disagree
 * about whether the level was completable. A suite that flickers is a suite
 * nobody trusts, so it plays against a fixed seed and the seed is part of the
 * result.
 */
function withSeed(seed, fn) {
  const original = Math.random;
  let s = seed >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

export async function runSuite(game, input, seed = 20260728) {
  return withSeed(seed, () => runAll(game, input, seed));
}

function runAll(game, input, seed) {
  const report = { seed };
  const t0 = performance.now();

  // Each test gets its own seed scope.
  //
  // The suite used to run one sequential stream, so a tuning change that made
  // the playthrough two seconds longer consumed a different number of draws and
  // silently re-rolled every boss fight after it. Numbers then moved for two
  // reasons at once — the change, and the reshuffle — and there was no way to
  // tell which. Fixing air steering shifted `mash` from 48 HP to 100 and turned
  // the `ranged` probe from a loss into a win, and neither of those was the
  // change speaking. Scoped seeds make a row comparable against the same row on
  // an older build, which is the only way tuning against this suite means
  // anything.
  const scope = (n, fn) => withSeed((seed ^ (n * 0x9e3779b9)) >>> 0, fn);

  report.arcs = scope(1, () => measureArcs(game, input));
  report.airAttack = measureAirAttack(game, input);
  report.juggle = measureJuggle(game, input);
  report.gaps = checkGaps(game, report.arcs);
  report.moves = scope(2, () => moveList(game, input));

  // The playthrough runs several seeds, not one.
  //
  // It used to run exactly one, and that one passed — which read as "the level
  // is clearable" when what it actually said was "the level is clearable on
  // seed 20260728". Sweeping eight seeds put the reading bot at four. Enemy
  // jitter, spawn scatter and wisp drift phases are all live in a run, so a
  // single sample was never evidence about the level; it was evidence about a
  // seed, and every tuning decision measured against it inherited that.
  const sweep = (n, readTells) => {
    const runs = [];
    for (let i = 0; i < RUNS_PER_SWEEP; i++) {
      runs.push(scope(n * 100 + i, () => playthrough(game, input, { readTells })));
    }
    const cleared = runs.filter((r) => r.ok).length;
    return { runs, cleared, of: runs.length, best: runs.find((r) => r.ok) ?? runs[0] };
  };
  report.naive = sweep(3, false);
  report.playthrough = sweep(4, true);
  // Melee has to be a winning answer; kiting deliberately is not. Mana regen
  // caps the bolt at roughly a tenth of melee DPS, so `ranged` is a balance
  // probe — if it ever starts winning comfortably, the bolt is overtuned and
  // the fight has stopped being a fight.
  report.boss = [
    { ...scope(5, () => bossFight(game, input, 'mash')), mustWin: true },
    { ...scope(6, () => bossFight(game, input, 'dodge')), mustWin: true },
    { ...scope(7, () => bossFight(game, input, 'ranged')), mustWin: false },
  ];
  report.ms = Math.round(performance.now() - t0);

  print(report);
  return report;
}

function print(r) {
  const el = document.createElement('pre');
  el.style.cssText =
    'position:fixed;inset:0;z-index:999;overflow:auto;background:#06040e;color:#dff1ff;' +
    'font:12px/1.55 ui-monospace,Menlo,monospace;padding:26px;margin:0;white-space:pre-wrap';

  const lines = [];
  const ok = (b) => (b ? '  PASS' : '**FAIL**');
  lines.push('SOMBRA — scripted verification', '='.repeat(58), '');

  lines.push('JUMP ENVELOPE');
  for (const [k, v] of Object.entries(r.arcs)) {
    lines.push(`  ${k.padEnd(16)} height ${String(v.height).padStart(5)}   distance ${String(v.distance).padStart(5)}`);
  }
  lines.push('');

  lines.push('AIR ATTACK vs THE JUMP   (one running jump, four ways)');
  for (const a of r.airAttack.rows) {
    lines.push(
      `  ${a.when.padEnd(16)} travel ${String(a.dx).padStart(5)}  airtime ${String(a.airtime).padStart(5)}s  ` +
        `over the swing: dx ${String(a.dxDuring).padStart(5)} (${String(a.ofTop).padStart(4)} of top speed)  dy ${String(a.dyDuring).padStart(6)}`
    );
  }
  lines.push(
    `  steering authority during a swing: ${r.airAttack.authority.toFixed(2)} units   ${ok(r.airAttack.authority > 0.5)}`
  );
  lines.push('  `hold fwd` minus `reversed` — the same swing, asking to go forward');
  lines.push('  against asking to go back. Zero means the input is being ignored, which');
  lines.push('  is what "the motion stops" describes even while vx reads healthy.');
  lines.push('');

  const j = r.juggle;
  lines.push('LAUNCHER JUGGLE   (K, then Space, then a single J after N seconds)');
  lines.push(`  the launched enemy rises ${j.enemyPeak}   the chasing jump rises ${j.playerPeak}`);
  lines.push(`  connects at: ${j.hits.length ? j.hits.map((d) => d.toFixed(2)).join(' ') : 'never'}`);
  lines.push(
    `  usable window ${j.window.toFixed(2)}s, opening ${j.first === null ? '—' : j.first.toFixed(2) + 's'} after the jump   ${ok(j.window >= 0.2)}`
  );
  lines.push('  the playtest could not repeat this. A window is a combo; an instant is');
  lines.push('  an accident, and the player correctly reads an accident as broken.');
  lines.push('');

  lines.push('GAP REACHABILITY   (need = gap + body width)');
  let gapsOk = true;
  for (const g of r.gaps) {
    if (!g.ok) gapsOk = false;
    lines.push(
      `  ${g.at.padEnd(10)} gap ${String(g.gap).padStart(4)}  rise ${String(g.rise).padStart(5)}  ` +
        `need ${String(g.need).padStart(4)}  single ${g.single ? 'y' : 'n'}  double ${g.double ? 'y' : 'n'}  ${ok(g.ok)}`
    );
  }
  lines.push(`  ${gapsOk ? 'every gap is clearable' : 'UNREACHABLE GEOMETRY'}`, '');

  lines.push('MOVE LIST');
  for (const m of r.moves) {
    lines.push(`  ${m.move.padEnd(10)} damage ${String(m.damage).padStart(4)}   ${ok(m.connected)}`);
  }
  lines.push('');

  lines.push(`FULL PLAYTHROUGH   (${r.playthrough.of} seeds each)`);
  const row = (label, s, verdict) => {
    const outcomes = s.runs.map((p) => (p.ok ? '.' : p.state === 'dead' ? 'x' : '?')).join('');
    const t = s.runs.filter((p) => p.ok).map((p) => p.time);
    const avg = t.length ? (t.reduce((a, b) => a + b, 0) / t.length).toFixed(1) : '  — ';
    return (
      `  ${label.padEnd(16)} clears ${String(s.cleared)}/${s.of}  [${outcomes}]  ` +
      `avg ${String(avg).padStart(5)}s  ${verdict}`
    );
  };
  // A majority, not a single run. One sample of a stochastic level says nothing
  // about the level; it says something about the seed.
  const readsOk = r.playthrough.cleared * 2 > r.playthrough.of;
  const naiveOk = r.naive.cleared * 2 <= r.naive.of;
  lines.push(row('reads tells', r.playthrough, ok(readsOk)));
  lines.push(row('ignores tells', r.naive, naiveOk ? '  info' : '**LOOK**'));
  lines.push('  legend: . cleared   x died   ? stuck');
  lines.push('  the telegraph-reading bot must clear a majority. The naive bot was');
  lines.push('  supposed not to — that pair was the combat design stated as a test.');
  if (!naiveOk) {
    lines.push('');
    lines.push('  IT NO LONGER HOLDS, and the reason is worth reading before you tune');
    lines.push('  anything against it. The naive bot used to die at the bridge, which');
    lines.push('  read as "ignoring the tells kills you". It was not: both bots were');
    lines.push('  hitting a navigation deadlock at the arena barrier, and the dodging');
    lines.push('  bot simply jittered out of it more often. With the deadlock fixed');
    lines.push('  both clear every seed, taking the same damage to within a few points,');
    lines.push('  so dashing on a telegraph currently buys the bot nothing.');
    lines.push('');
    lines.push('  That is a statement about the *evidence*, not about the game: a human');
    lines.push('  playtest confirmed separately that the beast\'s tell reads and is');
    lines.push('  learnable. What died here is the automated proof, not the design.');
    lines.push('  Do not "fix" it by making the naive bot worse.');
  }
  lines.push('');

  lines.push('GATE GUARDIAN   (a boss only one strategy beats is tuned to one solution)');
  for (const b of r.boss) {
    const verdict = b.mustWin ? ok(b.won) : b.won ? ' probe' : ' probe';
    lines.push(
      `  ${b.strategy.padEnd(8)} ${b.won ? 'WIN ' : 'LOSS'}  hp left ${String(b.playerHp).padStart(4)}  ` +
        `boss hp ${String(b.bossHpLeft).padStart(4)}  ${String(b.seconds).padStart(5)}s  ${verdict}`
    );
  }
  lines.push('  mash and dodge must both win. `ranged` is a probe, not a target:');
  lines.push('  mana regen caps the bolt near a tenth of melee DPS on purpose.');
  lines.push('', `seed ${r.seed}   ·   suite ran in ${r.ms} ms`);

  el.textContent = lines.join('\n');
  document.body.appendChild(el);
  console.log(el.textContent);
}
