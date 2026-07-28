// Headless verification. Open `index.html?sim` to run it.
//
// Nothing here renders. The suite steps `Game.update` at the fixed timestep and
// drives the real `Input` object, so the bots play through exactly the code
// path a human does — same buffering, same cancel windows, same collision.
//
// This exists because feel cannot be verified automatically but *reachability
// and winnability* can, and both are easy to break while tuning. Every bot
// below has caught a real bug at least once.

const DT = 1 / 120;

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
      bot.hold('right', true);
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

  report.arcs = measureArcs(game, input);
  report.gaps = checkGaps(game, report.arcs);
  report.moves = moveList(game, input);
  report.naive = playthrough(game, input, { readTells: false });
  report.playthrough = playthrough(game, input, { readTells: true });
  // Melee has to be a winning answer; kiting deliberately is not. Mana regen
  // caps the bolt at roughly a tenth of melee DPS, so `ranged` is a balance
  // probe — if it ever starts winning comfortably, the bolt is overtuned and
  // the fight has stopped being a fight.
  report.boss = [
    { ...bossFight(game, input, 'mash'), mustWin: true },
    { ...bossFight(game, input, 'dodge'), mustWin: true },
    { ...bossFight(game, input, 'ranged'), mustWin: false },
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
  lines.push('SHADOW MONARCH — scripted verification', '='.repeat(58), '');

  lines.push('JUMP ENVELOPE');
  for (const [k, v] of Object.entries(r.arcs)) {
    lines.push(`  ${k.padEnd(16)} height ${String(v.height).padStart(5)}   distance ${String(v.distance).padStart(5)}`);
  }
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

  lines.push('FULL PLAYTHROUGH');
  const row = (label, p, must) =>
    `  ${label.padEnd(16)} ${(p.state || p.reason).padEnd(9)} x ${String(p.x).padStart(6)}  ${String(p.time).padStart(5)}s  ` +
    `kills ${String(p.kills).padStart(2)}  lv ${p.level}  damage ${String(p.damageTaken).padStart(3)}  ${must ? ok(p.ok) : '  info'}`;
  lines.push(row('reads tells', r.playthrough, true));
  lines.push(row('ignores tells', r.naive, false));
  lines.push('  only the telegraph-reading bot must clear. The naive bot exists to');
  lines.push('  prove the telegraphs are load-bearing rather than decorative.');
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
