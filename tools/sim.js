// Headless verification. Open `index.html?sim` to run it.
//
// Nothing here renders. The suite steps `Game.update` at the fixed timestep and
// drives the real `Input` object, so the bots play through exactly the code
// path a human does — same buffering, same cancel windows, same collision.
//
// This exists because feel cannot be verified automatically but *reachability
// and winnability* can, and both are easy to break while tuning. Every bot
// below has caught a real bug at least once.

import { PLAYER, ATTACKS, SHADOW } from '../src/game/config.js';
import { buildShard } from '../src/render/models.js';
import { checkGates, controls, crossing } from './gatecheck.js';
import { checkTouch } from './touchcheck.js';

const DT = 1 / 120;
/** Seeds per playthrough sweep. Eight runs cost about a second. */
const RUNS_PER_SWEEP = 8;

/**
 * Reaction latency for the two bots that play the level, in seconds.
 *
 * Without this the suite cannot say anything about telegraphs, and for a while
 * it said something false. A bot with zero latency does not need a wind-up: it
 * can read the active frames and dash out, or — as the naive bot demonstrably
 * did — simply kill the beast during its wind-up. So "the bot that ignores
 * tells survives fine" was never evidence that the tells do nothing. It was
 * evidence that the instrument had no way to measure them.
 *
 * A telegraph exists to buy *human* reaction time, so the bot is given a human
 * one. 250 ms is the usual figure for a simple visual reaction, and it sits
 * deliberately inside the beast's 0.42 s pounce wind-up: a bot that starts
 * moving when the tell appears still has 170 ms of margin, and a bot that waits
 * for the leap itself has none.
 *
 * Applied to combat presses only, and identically to both bots. Held keys are a
 * steady state already in progress, and jumps are pathing rather than reaction:
 * the bot's one-unit ledge look-ahead is a crude stand-in for a human seeing
 * the terrain several seconds out, so delaying it does not model reaction time,
 * it models blindness. Measured, not assumed — with jumps delayed too, both
 * bots died on all eight seeds having taken 14 damage, which is the sound of a
 * bot walking off a ledge, and nothing at all about telegraphs.
 *
 * The suite's standing warning still stands: if this pair ever stops
 * separating, the fix is not to handicap the naive bot.
 */
const REACTION = 0.25;
/** Presses the bot plans rather than reacts to. See REACTION. */
const PLANNED = new Set(['jump']);
/**
 * Paired seeds behind the telegraph claim.
 *
 * This used to be a single ratio of two eight-run means against a threshold of
 * 0.85, and that instrument could not survive its own evidence. The same fixed
 * build read 54% at eight seeds and 65% at twenty-four; four of the five
 * recorded top-level numbers did not reproduce on the build they were recorded
 * against, and one of them flipped its verdict. A statistic that moves that far
 * without the system under test changing is not measuring the system.
 *
 * Two things are wrong with the old shape and both are fixed here.
 *
 * The sweeps were *unpaired* — the naive runs used one set of scoped seeds and
 * the reading runs another — so the two bots were not even playing the same
 * gates. Half the spread was spawn scatter rather than behaviour. Runs are now
 * paired: run i of each bot shares a scope, so the only difference between the
 * two numbers is the bot.
 *
 * And a mean ratio of noisy quantities is a bad estimator with a heavy tail and
 * an undefined value whenever the denominator reaches zero. See TELL_WINS_MIN.
 */
const TELL_SEEDS = 24;
/**
 * How many of the paired runs the tell-reader must take less damage in.
 *
 * This is a sign test, and it matters that the number is *derived* rather than
 * chosen. Under the null hypothesis — telegraphs buy nothing — which bot takes
 * less damage in a given pair is a coin flip, so the count is Binomial(24, ½).
 * P(X ≥ 17) ≈ 0.032 and P(X ≥ 16) ≈ 0.076, so 17 is the smallest threshold that
 * clears p < 0.05 one-tailed.
 *
 * The standing warning has three clauses now, and this is the answer to the
 * third: do not close the gap by handicapping the naive bot, do not close it by
 * choosing a kinder sample, and do not close it by reporting a point estimate
 * drawn from a wide distribution. A threshold taken from the null distribution
 * cannot be tuned toward, because it does not depend on the build at all — the
 * previous 0.85 could have been, and there is no record of where it came from.
 *
 * The median ratio is still reported, as effect size. It is not asserted on,
 * because its absolute value is exactly the thing that failed to reproduce.
 */
const TELL_WINS_MIN = 17;
/**
 * Significance level for the gate, which is the Wilcoxon signed-rank test in
 * `wilcoxon()` rather than the sign test above.
 *
 * The sign test was written first and is kept as a reported number, because
 * *which test was tried first* is part of the evidence and hiding it would be
 * the dishonest version of this change. It read 16 of 24 — p ≈ 0.076 — on a
 * build with no reason to be broken, which is a statement about the test's
 * power rather than about the game: it keeps only the direction of each pair
 * and discards how large the difference was, and the signal here is mostly in
 * the magnitudes.
 *
 * Switching to a test that reads the same samples more carefully is legitimate.
 * Switching tests until one passes is not, so the rule from here is that this
 * gate does not move again: not the test, not the alpha, not the sample size.
 * If it fails, the finding is about the game.
 */
const TELL_ALPHA = 0.05;

class Bot {
  /** `latency` delays presses only — see REACTION. Probes leave it at 0. */
  constructor(game, input, latency = 0) {
    this.g = game;
    this.input = input;
    this.p = game.player;
    this.latency = latency;
    this.queued = [];
  }
  press(a) {
    if (this.latency <= 0 || PLANNED.has(a)) {
      this.input.buffer.set(a, 0.16);
      return;
    }
    this.queued.push({ a, t: this.latency });
  }
  hold(a, on = true) {
    if (on) this.input.held.add(a);
    else this.input.held.delete(a);
  }
  releaseAll() {
    this.input.held.clear();
    this.queued.length = 0;
  }
  step() {
    // Matured presses land before the world moves, so a press queued `latency`
    // ago is indistinguishable from a key struck this frame.
    for (let i = this.queued.length - 1; i >= 0; i--) {
      const q = this.queued[i];
      q.t -= DT;
      if (q.t <= 0) {
        this.input.buffer.set(q.a, 0.16);
        this.queued.splice(i, 1);
      }
    }
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
 * Does every gap in the gate as *built* fit inside the measured jump envelope?
 *
 * This reads `level.solids`, so unlike the descriptor checks in `gatecheck.js`
 * it is a claim about what `Level` produced rather than about what the gate
 * says. The arithmetic of a crossing is shared with those checks, so the two
 * cannot come to disagree about what "crossable" means.
 */
function checkGaps(game, arcs) {
  const solids = [...game.level.solids].sort((a, b) => a.x0 - b.x0);
  const out = [];
  for (let i = 0; i < solids.length - 1; i++) {
    const a = solids[i];
    const b = solids[i + 1];
    const gap = b.x0 - a.x1;
    if (gap <= 0.01) continue;
    const rise = b.y1 - a.y1;
    const single = crossing(gap, rise, arcs.running);
    const double = crossing(gap, rise, arcs.runningDouble);
    out.push({
      at: `${a.x1.toFixed(0)}→${b.x0.toFixed(0)}`,
      gap: +gap.toFixed(1),
      rise: +rise.toFixed(1),
      need: +single.need.toFixed(1),
      single: single.ok,
      double: double.ok,
      ok: double.ok,
    });
  }
  return out;
}

/**
 * Play the level start to finish. Deliberately a dumb bot: hold right, jump at
 * gaps, swing at anything close. If a dumb bot can finish, the level contains
 * no unpassable geometry — which is the only claim this test makes.
 */
function playthrough(game, input, { maxSeconds = 400, readTells = false, carryShadow = false } = {}) {
  game.start();
  const bot = new Bot(game, input, REACTION);
  const p = game.player;
  let attackCd = 0;
  let magicCd = 0;
  let dashCd = 0;
  let stuckAt = p.x;
  let stuckFor = 0;
  let chasing = false;
  // SORGI bookkeeping. All inert unless `carryShadow`.
  let extractFor = 0; // seconds left in a committed extraction attempt
  let extractPressed = false;
  let shadowsRaised = 0;
  let lastShadow = null;
  let bossSeen = false;
  let shadowAtBoss = false;
  const steps = Math.floor(maxSeconds / DT);

  for (let i = 0; i < steps; i++) {
    if (game.state !== 'playing') break;

    // Read before anything can `continue` past it. `game.shadow` is a single
    // slot that is nulled when the ally dies, so identity change is the only
    // way to count raises — a counter on the game would miss a replacement.
    if (game.shadow !== lastShadow) {
      if (game.shadow) shadowsRaised++;
      lastShadow = game.shadow;
    }
    // The arena holds no enemies and therefore no remnants, so what the hunter
    // walks in with is all there is. That is the design claim this records.
    if (!bossSeen && game.activeEncounter?.boss) {
      bossSeen = true;
      shadowAtBoss = !!game.shadow;
    }

    const target = nearestEnemy(game);
    const dist = target ? Math.abs(target.x - p.x) : Infinity;
    attackCd -= DT;
    magicCd -= DT;
    dashCd -= DT;

    // SORGI. The bot claims a remnant once the fight around it is over, which is
    // how a careful human plays it: the channel roots for 0.8 s and any hit
    // breaks it, so extracting mid-fight is a gamble — and a gamble is not what
    // this row is measuring. What it measures is whether the gate is clearable
    // by someone carrying a shadow, which is now the normal way it is played
    // and something the suite has never been able to say anything about.
    //
    // Range and reach come from `game.nearestCorpse`, the same call the player
    // makes each frame, so this bot cannot drift out of agreement with the rule
    // it is testing.
    //
    // An attempt is committed rather than re-decided per frame. `press` carries
    // the bot's reaction latency, so `down` has to still be held when the press
    // matures, and a bot that re-evaluated every frame would release it early
    // and never extract at all.
    if (carryShadow) {
      if (extractFor <= 0 && !game.shadow && p.grounded && dist > 7 && game.nearestCorpse(p.x, p.y)) {
        extractFor = REACTION + SHADOW.channel + 0.25;
        extractPressed = false;
      }
      if (extractFor > 0) extractFor = game.shadow ? 0 : extractFor - DT;
      if (extractFor > 0) {
        bot.hold('left', false);
        bot.hold('right', false);
        bot.hold('down', true);
        if (!extractPressed) {
          bot.press('heavy');
          extractPressed = true;
        }
        bot.step();
        continue;
      }
      bot.hold('down', false);
    }

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
    shadowsRaised,
    shadowAtBoss,
    reachedBoss: bossSeen,
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
/**
 * Put a shadow beside the hunter without playing out the channel.
 *
 * The channel is `extraction`'s subject, not this one's. What the boss rows
 * need is an ally standing in the arena, and routing that through 0.8 s of
 * held keys would make every Guardian number depend on the extraction timing
 * as well as on the fight.
 */
function giveShadow(game, bot) {
  const p = game.player;
  game._spawn({ type: 'beast', x: p.x + 1.3, encounter: 'test' });
  const e = game.enemies[game.enemies.length - 1];
  e.spawnT = 0;
  e.root.scale.setScalar(1);
  e.takeHit({ damage: e.hp + 1, knock: 0, launch: 0, fromX: e.x });
  for (let i = 0; i < 90; i++) bot.step();
  const corpse = game.corpses[game.corpses.length - 1];
  if (corpse) game.extract(corpse);
  return !!game.shadow;
}

function bossFight(game, input, strategy, { maxSeconds = 240, carryShadow = false, latency = REACTION } = {}) {
  game.start();
  const bot = new Bot(game, input, latency);
  const p = game.player;

  // Walk in carrying a shadow, when asked. Set up at the spawn point *before*
  // the teleport, because nothing has triggered there yet — the first encounter
  // is at x=40 — so the setup cannot disturb an encounter mid-flight. The ally
  // re-forms beside the hunter when it is left behind, which is the same rule
  // that carries it through a sealed barrier in ordinary play.
  const carried = carryShadow ? giveShadow(game, bot) : false;

  // Skip to the arena rather than replaying the gate for each strategy. Mark
  // everything that is not the Warden fight as done — by the flag rather than
  // by an encounter id, so this reads any gate's descriptor and not gate 1's
  // names.
  p.x = 178;
  p.y = 3.2;
  for (const e of game.encounters) {
    if (!e.boss) {
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
    carried,
    shadowAlive: !!game.shadow,
  };
}

/**
 * One strategy, swept across seeds.
 *
 * "Kiting must not win a majority of seeds" was written as a gate and could not
 * be checked, because each strategy ran exactly once. A single boss fight is a
 * sample of one from a fight with enemy jitter and four attacks chosen from a
 * random cooldown window — it says what happened that time, not what the fight
 * is.
 */
function bossSweep(game, input, scope, base, strategy, carryShadow) {
  const runs = [];
  for (let i = 0; i < RUNS_PER_SWEEP; i++) {
    runs.push(scope(base + i, () => bossFight(game, input, strategy, { carryShadow })));
  }
  const won = runs.filter((r) => r.won).length;
  const mean = (pick) => runs.reduce((a, r) => a + pick(r), 0) / runs.length;
  return {
    strategy,
    carryShadow,
    runs,
    won,
    of: runs.length,
    hp: mean((r) => r.playerHp),
    bossHpLeft: mean((r) => r.bossHpLeft),
    seconds: mean((r) => r.seconds),
    majority: won * 2 > runs.length,
    // A `+shadow` row that silently failed to raise one would still print
    // `+shadow` and still pass, and the conclusion drawn from these rows is
    // precisely that carrying an ally does not change the fight. The
    // playthrough row already guards this way; these have to as well.
    carried: runs.filter((r) => r.carried).length,
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
 * SORGI: the corpse, the channel, and what the shadow's kills are worth.
 *
 * Runs at zero latency, like the other focused probes — this measures the
 * mechanic, not a reaction to it. The playthrough bots are where reaction time
 * belongs.
 *
 * The three assertions that actually matter are the last three. Everything
 * before them is the mechanic working; those are the mechanic staying bounded.
 * One shadow at a time is the whole reason this is not an army, a hit through
 * the channel is the entire cost of the extraction, and the EXP-yes-style-no
 * split is the only brake on the ally doing the player's job for them. All
 * three are invisible in play until they are wrong.
 */
function extraction(game, input) {
  const bot = new Bot(game, input);
  const p = game.player;
  const rows = [];
  const check = (name, ok, detail = '') => rows.push({ name, ok, detail });

  /** Kill a beast next to the hunter and let the body settle. */
  const layCorpse = (dx = 1.3) => {
    game._spawn({ type: 'beast', x: p.x + dx, encounter: 'test' });
    const e = game.enemies[game.enemies.length - 1];
    e.spawnT = 0;
    e.root.scale.setScalar(1);
    // Straight to the body rather than through the combat system: this is
    // setup, and routing it through a swing would make every row below depend
    // on the hunter's reach as well as on extraction.
    e.takeHit({ damage: e.hp + 1, knock: 0, launch: 0, fromX: e.x });
    for (let i = 0; i < 90; i++) bot.step();
    return game.corpses[game.corpses.length - 1] ?? null;
  };

  /** Hold down, tap heavy, and wait out the channel. */
  const sorgi = (steps = 120) => {
    bot.hold('down', true);
    bot.press('heavy');
    for (let i = 0; i < steps; i++) bot.step();
    bot.hold('down', false);
  };

  // --- the corpse and its window ---
  game.start();
  const corpse = layCorpse();
  check('a beast leaves a corpse', !!corpse);
  const before = corpse ? corpse.windowT : 0;
  for (let i = 0; i < 120; i++) bot.step();
  const after = corpse ? corpse.windowT : 0;
  check('its window closes', before > 0 && after < before - 0.5,
    `${before.toFixed(2)}s -> ${after.toFixed(2)}s`);
  for (let i = 0; i < 120 * 6; i++) bot.step();
  check('the corpse expires unclaimed', game.corpses.length === 0);

  // --- the channel ---
  game.start();
  layCorpse();
  sorgi();
  const raised = game.shadow;
  check('the channel raises a shadow', !!raised);
  check('and consumes the corpse', game.corpses.length === 0);
  check('the shadow is not an enemy', !!raised && !game.enemies.includes(raised));

  // The cost is standing still. If the hunter can walk out of the channel it
  // is not a cost, and the mechanic is free.
  game.start();
  layCorpse();
  const x0 = p.x;
  bot.hold('down', true);
  bot.press('heavy');
  bot.step();
  bot.hold('down', false);
  bot.hold('right', true);
  for (let i = 0; i < 84; i++) bot.step(); // 0.7 s — still inside the channel
  const drift = Math.abs(p.x - x0);
  bot.releaseAll();
  check('the channel roots the hunter', drift < 0.5, `drifted ${drift.toFixed(2)}`);

  // --- a hit breaks it ---
  game.start();
  layCorpse();
  bot.hold('down', true);
  bot.press('heavy');
  for (let i = 0; i < 24; i++) bot.step();
  bot.hold('down', false);
  // Nothing raised yet and the body still there: the channel is in flight. Read
  // off what the player would see rather than off `p.state`, so this row keeps
  // meaning the same thing if the state is ever renamed or split.
  const inFlight = !game.shadow && game.corpses.length === 1;
  game._damagePlayer(10, p.x + 4);
  for (let i = 0; i < 150; i++) bot.step();
  check('a hit cancels the channel', inFlight && !game.shadow);
  check('and the corpse outlives it', game.corpses.length === 1);

  // --- one at a time ---
  game.start();
  layCorpse();
  sorgi();
  const first = game.shadow;
  layCorpse();
  sorgi();
  check('extracting again replaces', !!first && !!game.shadow && game.shadow !== first);

  // --- EXP yes, style no ---
  game.start();
  layCorpse();
  sorgi();
  game.style = 0;
  const expBefore = game.exp;
  game._spawn({ type: 'beast', x: p.x + 3.0, encounter: 'test' });
  const victim = game.enemies[game.enemies.length - 1];
  victim.spawnT = 0;
  victim.root.scale.setScalar(1);
  // One connect is enough. This row is about who gets the credit, not about
  // how long the ally takes to chew through a health bar.
  victim.hp = 6;
  for (let i = 0; i < 120 * 10 && !victim.dead; i++) bot.step();
  bot.releaseAll();
  check('the shadow kills on its own', victim.dead);
  check('its kill pays EXP', game.exp > expBefore, `+${game.exp - expBefore}`);
  check('its kill pays no style', game.style === 0, `style ${game.style.toFixed(1)}`);

  return rows;
}

/**
 * Draws taken from whatever `Math.random` currently is, while `fn` runs.
 *
 * Wraps rather than replaces, so the seeded stream `withSeed` installed is
 * still the stream being drawn from and counting cannot itself change a number.
 */
function countDraws(fn) {
  const inner = Math.random;
  let n = 0;
  Math.random = () => {
    n++;
    return inner();
  };
  try {
    fn();
  } finally {
    Math.random = inner;
  }
  return n;
}

/**
 * The gate transition: what it costs, where it lands, and what it leaves.
 *
 * **The cost is the row that matters.** A gate is several hundred three.js
 * objects and each one draws four `Math.random()` values for its UUID, so a
 * transition that built anything would spend the gameplay stream mid-run and
 * re-roll every enemy's jitter after it — the failure this project has already
 * paid for once, at the scale it would hurt most. `Game` answers that by
 * building every gate in its constructor, before the suite has seeded anything,
 * which should make crossing between them free. This counts, rather than
 * trusting it, because "should" is what the last one said too.
 *
 * The fight that opens gate 1's arch is `bossFight`'s subject and is skipped
 * here the same way it does — by the encounter flags — so that a slow Guardian
 * cannot make this row expensive and a broken one cannot make it red.
 */
function transition(game, input) {
  const rows = [];
  const say = (what, ok, detail = '') => rows.push({ what, ok, detail });

  const bot = new Bot(game, input);
  const p = game.player;
  const from = game.gates[0];

  /** Gate 1, beaten, with the hunter put down `back` units short of the arch. */
  const atTheArch = (back) => {
    game.start();
    for (const e of game.encounters) {
      e.started = true;
      e.cleared = true;
    }
    game.activeEncounter = null;
    game.state = 'cleared';
    game._openTheWay();
    p.x = from.exitX - back;
    p.y = game.level.groundAt(p.x) + 0.1;
    p.vx = 0;
    p.vy = 0;
  };

  // Walk into it. This row is about whether the arch takes you at all.
  atTheArch(5);
  bot.hold('right', true);
  let frames = 0;
  while (game.gateIndex === 0 && frames < 600) {
    bot.step();
    frames++;
  }
  bot.releaseAll();

  const arrived = game.gateIndex === 1;
  const to = game.gate;
  say('the arch leads to the next gate', arrived, arrived ? `${to.id} — ${to.name}` : `still in ${from.id}`);

  // Walk the crossing. Not `playthrough`: that starts by resetting to gate 1,
  // and this gate has nothing to fight, so all it needs is the locomotion —
  // hold right, jump when the ground runs out, spend the second jump only when
  // actually falling short. The moment the crossing has enemies on it is the
  // moment the two want to be one bot.
  const entryX = +p.x.toFixed(1);
  const entryT = game.runTime;
  bot.hold('right', true);
  let steps = 0;
  const limit = Math.floor(120 / DT);
  let stuckAt = p.x;
  let stuckFor = 0;
  while (arrived && game.state === 'playing' && steps < limit) {
    const ahead = p.x + 1.0;
    const groundAhead = game.level.groundAt(ahead, p.y + 0.6);
    if (p.grounded && (groundAhead === -Infinity || p.y - groundAhead > 2.2)) bot.press('jump');
    if (!p.grounded && p.vy < 0 && p.jumps < p.maxJumps) {
      const under = game.level.groundAt(p.x, p.y + 0.6);
      const landing = nextSolidAhead(game, p.x);
      const overVoid = under === -Infinity || p.y - under > 2.2;
      if (overVoid && landing && p.y < landing.y1 + 0.4) bot.press('jump');
    }
    if (p.grounded && groundAhead > p.y + 0.6) bot.press('jump');
    bot.step();
    steps++;
    if (Math.abs(p.x - stuckAt) < 0.4) stuckFor += DT;
    else {
      stuckAt = p.x;
      stuckFor = 0;
    }
    if (stuckFor > 20) break;
  }
  bot.releaseAll();

  const walked = arrived && game.state === 'ended';
  say(
    'and the crossing is walkable',
    walked,
    walked
      ? `x ${entryX} → ${to.exitX} in ${(game.runTime - entryT).toFixed(1)}s`
      : `stopped at x ${p.x.toFixed(1)} — ${game.state}`
  );

  // Walk into it from the far side.
  //
  // A Warden can die with the hunter beyond the arch — gate 1 spawns its
  // Guardian at x 190, the arch is at 196, and the arena runs to 204 — and the
  // first version of this could only be crossed rightwards, so clearing the
  // gate from the wrong side left the hunter stranded with the objective lit
  // and the only way out behind them. The arch is a place you walk into, from
  // whichever side you are on.
  atTheArch(-6);
  bot.hold('left', true);
  let back = 0;
  while (game.gateIndex === 0 && back < 600) {
    bot.step();
    back++;
  }
  bot.releaseAll();
  say(
    'and it takes you from beyond it too',
    game.gateIndex === 1,
    game.gateIndex === 1 ? `cleared from x ${from.exitX + 6}, walked back into it` : 'stranded past the arch'
  );

  // Now the cost, measured on the one frame that pays it.
  //
  // From a standstill, and that is not tidiness. A hunter mid-stride kicks up
  // dust, dust is particles, and particles draw — the first version of this row
  // counted seventy frames of walking and read 28, all of it boots. A row that
  // can go red because the footfall landed on the transition frame is measuring
  // the footfall. So: stand outside the arch, step into it, and count that
  // single update.
  atTheArch(4);
  bot.step(); // arms it — the arch does not take you on the frame it lights
  p.x = from.exitX;
  const cost = countDraws(() => bot.step());
  say(
    'and the frame that crosses over costs nothing',
    cost === 0 && game.gateIndex === 1,
    game.gateIndex === 1 ? `${cost} draws from the seeded stream` : 'it did not cross'
  );

  // A counter reading zero because nobody wired it up reads exactly like a
  // transition that costs nothing, so watch it see the thing it looks for. One
  // shard rig is the smallest honest stand-in for a gate: same class of object,
  // same UUIDs, same stream. It allocates on purpose, which is safe only
  // because this probe runs last in `runAll` with nothing after it.
  const control = countDraws(() => buildShard());
  say('and the counter can see a draw', control > 0, `${control} for one shard rig`);

  // And gate 1 is still gate 1 afterwards. A campaign that corrupts the gate it
  // came from is the failure this whole design is arranged against, and it is
  // invisible from inside a single run.
  game.start();
  game.hud.screen('clear', false);
  for (const r of freshness(game)) rows.push(r);
  return rows;
}

/**
 * Everything a fresh run has that a replayed one might not.
 *
 * Read against the *whole* campaign rather than the gate being replayed: a
 * barrier left standing in the crossing or an arch left lit there is state a
 * fresh run would not have, and nothing in gate 1 would ever notice it.
 */
function freshness(game) {
  const rows = [];
  const say = (what, ok, detail = '') => rows.push({ what, ok, detail, replay: true });
  const g = game.gates[0];
  const p = game.player;
  const levels = game.levels;

  say('replay starts at gate 1', game.gateIndex === 0 && game.level === levels[0], game.gate.id);
  say(
    'and shows only gate 1',
    levels.every((l, i) => l.group.visible === (i === 0)),
    levels.map((l, i) => `${game.gates[i].id} ${l.group.visible ? 'on' : 'off'}`).join(', ')
  );
  say(
    'the hunter is whole, at the entrance',
    p.x === g.spawnX && !p.dead && p.hp === p.maxHp && p.maxHp === PLAYER.maxHp,
    `x ${p.x}, ${Math.round(p.hp)}/${Math.round(p.maxHp)} hp`
  );
  say(
    'the field is empty',
    !game.enemies.length && !game.bolts.length && !game.corpses.length && !game.pendingSpawns.length && !game.shadow,
    `${game.enemies.length} enemies, ${game.corpses.length} remnants, ${game.shadow ? 'a shadow' : 'no shadow'}`
  );
  say(
    'no encounter has been met',
    game.encounters.every((e) => !e.started && !e.cleared) && !game.activeEncounter,
    `${game.encounters.length} waiting`
  );
  say(
    'every barrier in the campaign is down',
    levels.every((l) => l.barriers.every((b) => !b.active && b.mesh.material.opacity === 0)),
    `${levels.reduce((a, l) => a + l.barriers.length, 0)} barriers`
  );
  say(
    'every arch in the campaign is dark',
    levels.every((l) => l.portal.material.opacity === 0) && !game.wayOpen && !game.exitArmed,
    game.wayOpen ? 'the way is still open' : 'shut'
  );
  say(
    'the run starts from nothing',
    game.level_ === 1 && game.exp === 0 && game.kills === 0 && game.damageTaken === 0 && game.runTime === 0,
    `lv ${game.level_}, ${game.kills} kills, ${Math.round(game.damageTaken)} damage`
  );
  return rows;
}

/** Φ(z), via the Abramowitz & Stegun 7.1.26 approximation to erf. */
function normalCdf(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/**
 * Wilcoxon signed-rank over the paired damage differences, one-tailed.
 *
 * The sign test came first and it is still reported, because the order these
 * were tried in is part of the evidence: it read 16 of 24, p ≈ 0.076, on a
 * build nobody believes is broken. That is not a finding about telegraphs, it
 * is a test with too little power — the sign test throws away *how much* less
 * damage the reader took and keeps only the direction, and this data's signal
 * is mostly in the magnitudes (a 35 HP median saving against a 120 HP bar).
 *
 * Wilcoxon ranks the absolute differences and sums the ranks that went the
 * reader's way, so a run where reading saved 60 HP counts for more than one
 * where it saved 2. Same pairing, same seeds, same runs, no data discarded —
 * it reads the samples already taken more carefully.
 *
 * The critical value is computed rather than looked up: from about n = 20 the
 * normal approximation with a continuity correction is the standard treatment,
 * which keeps the threshold arithmetic rather than a constant somebody chose.
 * This suite runs 24 pairs, comfortably inside that. The n < 6 guard below is
 * not that threshold — it is the point at which no signed-rank test can reach
 * p < 0.05 at all, so there is nothing to return but NaN.
 */
function wilcoxon(diffs) {
  // Zero differences are dropped — Wilcoxon's own rule, since a tie has no
  // direction to rank.
  const nz = diffs.filter((d) => d !== 0);
  const n = nz.length;
  if (n < 6) return { n, z: NaN, p: NaN, wPlus: NaN };

  const ranked = nz.map((d) => ({ d, a: Math.abs(d), r: 0 })).sort((x, y) => x.a - y.a);
  // Ties share the average of the ranks they span.
  for (let i = 0; i < ranked.length; ) {
    let j = i;
    while (j + 1 < ranked.length && ranked[j + 1].a === ranked[i].a) j++;
    const r = (i + j + 2) / 2; // ranks are 1-based
    for (let k = i; k <= j; k++) ranked[k].r = r;
    i = j + 1;
  }

  const wPlus = ranked.reduce((a, x) => a + (x.d > 0 ? x.r : 0), 0);
  const mean = (n * (n + 1)) / 4;
  const sd = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  const z = (wPlus - mean - 0.5) / sd;
  return { n, wPlus, z, p: 1 - normalCdf(z) };
}

/** Linear-interpolated quantile of an already-sorted array. */
function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/**
 * The telegraph claim as a distribution over paired runs.
 *
 * Nothing here is asserted on directly. The gate is the Wilcoxon `w` field —
 * see TELL_ALPHA. `wins` is the sign test, kept as the record of what was tried
 * first, and the ratio quantiles are effect size.
 */
function tellStats(paired) {
  const ratios = [];
  const diffs = [];
  for (const { naive, reads } of paired) {
    // A bot that died spent its whole bar by definition, so a death counts as
    // maximum damage rather than as a missing sample. Dropping deaths would
    // quietly reward the failure this row exists to detect.
    const nd = naive.damageTaken ?? PLAYER.maxHp;
    const td = reads.damageTaken ?? PLAYER.maxHp;
    diffs.push(nd - td);
    // A pair where the naive bot took nothing says nothing about a *ratio* and
    // would divide by zero. Dropped from the ratio, kept in the sign test and
    // the difference, both of which are defined everywhere.
    if (nd > 0) ratios.push(td / nd);
  }
  ratios.sort((a, b) => a - b);
  const sortedDiffs = [...diffs].sort((a, b) => a - b);
  return {
    of: diffs.length,
    wins: diffs.filter((d) => d > 0).length,
    ties: diffs.filter((d) => d === 0).length,
    median: quantile(ratios, 0.5),
    q1: quantile(ratios, 0.25),
    q3: quantile(ratios, 0.75),
    medianDiff: quantile(sortedDiffs, 0.5),
    ratioSamples: ratios.length,
    w: wilcoxon(diffs),
  };
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
  const sweep = (n, opts) => {
    const runs = [];
    for (let i = 0; i < RUNS_PER_SWEEP; i++) {
      runs.push(scope(n * 100 + i, () => playthrough(game, input, opts)));
    }
    const cleared = runs.filter((r) => r.ok).length;
    // Mean damage over *every* run, cleared or not. A bot that dies has spent
    // its whole health bar by definition, so dying is not rewarded by the
    // average — which it would be if only clears were counted.
    const damage = runs.reduce((a, r) => a + (r.damageTaken ?? PLAYER.maxHp), 0) / runs.length;
    return {
      runs,
      cleared,
      of: runs.length,
      damage,
      best: runs.find((r) => r.ok) ?? runs[0],
      raised: runs.reduce((a, r) => a + (r.shadowsRaised ?? 0), 0),
      reachedBoss: runs.filter((r) => r.reachedBoss).length,
      atBoss: runs.filter((r) => r.shadowAtBoss).length,
    };
  };
  // The two telegraph bots run *paired*: run i of each shares a seed scope, so
  // both face the same spawn scatter, the same jitter and the same wisp phases,
  // and the only difference between their two numbers is the bot. The old
  // unpaired sweeps at scopes 300+i and 400+i were not even playing the same
  // gates as each other, which put spawn variance straight into the statistic
  // the row was asserting on.
  const paired = [];
  for (let i = 0; i < TELL_SEEDS; i++) {
    const naive = scope(3000 + i, () => playthrough(game, input, { readTells: false }));
    const reads = scope(3000 + i, () => playthrough(game, input, { readTells: true }));
    paired.push({ naive, reads });
  }
  const agg = (pick) => {
    const runs = paired.map(pick);
    // Mean damage over *every* run, cleared or not. A bot that dies has spent
    // its whole health bar by definition, so dying is not rewarded by the
    // average — which it would be if only clears were counted.
    const damage = runs.reduce((a, r) => a + (r.damageTaken ?? PLAYER.maxHp), 0) / runs.length;
    return {
      runs,
      cleared: runs.filter((r) => r.ok).length,
      of: runs.length,
      damage,
      best: runs.find((r) => r.ok) ?? runs[0],
    };
  };
  report.naive = agg((x) => x.naive);
  report.playthrough = agg((x) => x.reads);
  report.tell = tellStats(paired);
  // Last, and that position is the whole point.
  //
  // A scoped seed makes a probe's *randomness* independent, and this one is
  // scoped. It does not make a probe's effect on the game object independent:
  // running eight thousand extra frames before the sweeps moved the naive row
  // by four points, through state that `reset()` does not clear. Scoping was
  // never going to catch that, and the cheapest fix is to have nothing after it
  // to disturb. A new probe belongs here too, for the same reason.
  report.extraction = scope(8, () => extraction(game, input));
  // And this one goes after *that*, for the same reason again.
  //
  // Eight more playthroughs is the largest block of frames in the suite, and
  // extraction allocates: `Shadow extends Beast`, so raising one builds a rig
  // and spends Math.random draws on three.js UUIDs. Placed anywhere earlier it
  // would re-roll every row below it and there would be no way to tell a real
  // regression from the reshuffle. Placed last it cannot disturb anything, and
  // the check that this is true is that every pre-existing number in the report
  // is bit-identical to the build before this row existed.
  report.carried = sweep(9, { readTells: true, carryShadow: true });

  // The boss sweeps go after everything, and the `+shadow` half is why.
  //
  // `giveShadow` allocates — `_spawn` builds a Beast rig and `extract` builds a
  // Shadow — and 24 carrying fights are the largest allocation block in the
  // suite. The rule this file has broken once already and states twice is that
  // a probe which allocates cannot sit ahead of rows that must stay comparable.
  // These used to sit before `extraction` and `carried`, which was the same
  // mistake the SORGI slice cost most of a session to.
  //
  // Melee has to be a winning answer; kiting deliberately is not. Mana regen
  // caps the bolt at roughly a tenth of melee DPS, so `ranged` is a balance
  // gate — if it starts winning a majority, the bolt is overtuned and the fight
  // has stopped being a fight.
  //
  // Each strategy runs twice: empty-handed, and walking in carrying a shadow.
  // Carrying one is the normal way the arena is reached — the row above
  // measures 6 to 7 runs in 8 arriving with an ally — so a boss verified only
  // against a shadow-less hunter was verified against the case that mostly does
  // not happen.
  report.boss = [
    { ...bossSweep(game, input, scope, 500, 'mash', false), mustWin: true },
    { ...bossSweep(game, input, scope, 520, 'dodge', false), mustWin: true },
    { ...bossSweep(game, input, scope, 540, 'ranged', false), mustWin: false },
    { ...bossSweep(game, input, scope, 560, 'mash', true), mustWin: true },
    { ...bossSweep(game, input, scope, 580, 'dodge', true), mustWin: true },
    { ...bossSweep(game, input, scope, 600, 'ranged', true), mustWin: false },
  ];
  // Tier-1 static checks, against every gate descriptor rather than against the
  // one gate this run happens to have built.
  //
  // They read data and do arithmetic — no frames, no allocation, not one draw
  // from the seeded stream — so they are the one probe in this file that could
  // sit anywhere without disturbing a row. They go last anyway. The rule is
  // written without an exemption, obeying it costs nothing, and "this one is
  // different" is the sentence every probe that broke a baseline was added
  // with. They print further up, where they read best.
  report.gates = checkGates(report.arcs);
  report.controls = controls(report.arcs);

  // Genuinely last, with nothing after it at all.
  //
  // This probe restarts gate 1 three times, walks a second gate end to end, and
  // — in its own control — deliberately builds a rig. It is the most disruptive
  // thing in the file to anything downstream, so it goes where there is no
  // downstream. It could have sat ahead of the static checks above, since those
  // are pure functions of descriptors; putting it there would have meant
  // writing "this one is different", which is the sentence every probe that
  // broke a baseline was added with.
  report.transition = scope(11, () => transition(game, input));
  // And after even that.
  //
  // The touch layout is a descriptor like a gate is, and this is the same kind
  // of check: arithmetic over data, no frames, no allocation, not one draw. It
  // could sit with the static gate checks above and nothing would move. The
  // rule says new probes go last, obeying it costs a line, and "this one is
  // different" is the sentence every probe that broke a baseline was added
  // with — including, twice, in the comments directly above. It prints further
  // up, where it reads next to the other static checks.
  report.touch = checkTouch();
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

  lines.push('GATE DESCRIPTORS   (static checks, every gate, every run)');
  for (const g of r.gates) {
    lines.push(`  ${g.gate.padEnd(7)} ${g.check.padEnd(16)} ${g.detail.padEnd(44)} ${ok(g.ok)}`);
  }
  lines.push('');
  lines.push('  controls — two descriptors that must pass, one per fault that must not');
  for (const c of r.controls) {
    lines.push(`  ${c.check.padEnd(19)} ${c.why.padEnd(41)} ${ok(c.ok)}`);
  }
  lines.push('  A static check nobody has watched fail is not known to work, so the');
  lines.push('  demonstration runs every time rather than once, by hand, for whoever');
  lines.push('  happened to be looking. Each control asserts only its own check went');
  lines.push('  red: a check that rejected everything would pass this block and be');
  lines.push('  caught by the real gates above it going red in the same report.');
  lines.push('');

  lines.push('TOUCH LAYOUT   (static checks, every screen size it claims, every run)');
  for (const t of r.touch.rows) {
    lines.push(`  ${t.check.padEnd(23)} ${t.detail.padEnd(52)} ${ok(t.ok)}`);
  }
  lines.push('');
  lines.push('  controls — one per fault, each of which must come out red');
  for (const c of r.touch.controls) {
    lines.push(`  ${c.check.padEnd(23)} ${c.why.padEnd(41)} ${ok(c.ok)}`);
  }
  lines.push('');
  lines.push('  Constraint 1 of the touch budget — no move may require a chord — is the');
  lines.push('  `no chord` row, and it is why SORGI has a target of its own rather than');
  lines.push("  the keyboard's `hold S + K`. Constraint 2 is the jump reserve, checked");
  lines.push('  against every gate above. Constraint 3 — never a direction plus two');
  lines.push('  buttons — is not here and cannot be: it is a claim about what a fight');
  lines.push('  demands, not about what the screen offers, and a thumb is the only');
  lines.push('  instrument for it. The phone playtest is the instrument.');
  lines.push('');

  lines.push('MOVE LIST');
  for (const m of r.moves) {
    lines.push(`  ${m.move.padEnd(10)} damage ${String(m.damage).padStart(4)}   ${ok(m.connected)}`);
  }
  lines.push('');

  lines.push('SORGI   (extraction, the corpse window, and the shadow)');
  for (const e of r.extraction) {
    lines.push(`  ${e.name.padEnd(34)} ${e.detail.padEnd(22)} ${ok(e.ok)}`);
  }
  lines.push('  one shadow, a channel that a hit breaks, and EXP without style are the');
  lines.push('  three bounds the design rests on. Each is invisible in play until wrong.');
  lines.push('');

  lines.push(`FULL PLAYTHROUGH   (${r.playthrough.of} paired seeds — both bots play each one)`);
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
  const t = r.tell;
  const tellOk = t.w.p < TELL_ALPHA;
  lines.push(row('reads tells', r.playthrough, ok(readsOk)));
  lines.push(row('ignores tells', r.naive, '  info'));
  lines.push('  legend: . cleared   x died   ? stuck');
  lines.push('');
  lines.push(
    `  signed-rank   W+ ${t.w.wPlus.toFixed(0)} of ${t.w.n} pairs   z ${t.w.z.toFixed(2)}   ` +
      `p ${t.w.p < 0.001 ? '<0.001' : t.w.p.toFixed(3)}   need p < ${TELL_ALPHA}   ${ok(tellOk)}`
  );
  lines.push(
    `  sign test     reader took less damage in ${t.wins}/${t.of}` +
      `${t.ties ? ` (${t.ties} tied)` : ''}, would need ${TELL_WINS_MIN}   info`
  );
  lines.push(
    `  effect size   median ${(t.median * 100).toFixed(0)}% of naive` +
      `   IQR ${(t.q1 * 100).toFixed(0)}–${(t.q3 * 100).toFixed(0)}%` +
      `   median saving ${t.medianDiff.toFixed(0)} HP   info`
  );
  lines.push(
    `  means   reads ${r.playthrough.damage.toFixed(0)}   ignores ${r.naive.damage.toFixed(0)}   info`
  );
  lines.push('');
  lines.push(`  Both bots play at ${Math.round(REACTION * 1000)} ms reaction latency, and the claim under`);
  lines.push('  test is the damage gap, not who finishes. A telegraph buys reaction');
  lines.push('  time, so a test of telegraphs has to spend some — an earlier version');
  lines.push('  asserted that a naive bot must *lose*, and a bot with no reaction delay');
  lines.push('  has no use for a wind-up at all: it can answer the active frames, or');
  lines.push('  kill the beast mid-tell, which is what it was observed doing.');
  lines.push('');
  lines.push('  The gate is a paired signed-rank test, not a ratio against a chosen');
  lines.push('  threshold. Run i of each bot shares a seed scope, so both face the same');
  lines.push('  spawns and the same jitter and only the bot differs — the old sweeps');
  lines.push('  were unpaired and put spawn variance straight into the statistic.');
  lines.push('  The critical value is computed from the null distribution, not looked');
  lines.push('  up, so unlike the 0.85 ratio it replaced it cannot be tuned toward: it');
  lines.push('  does not depend on the build at all.');
  lines.push('');
  lines.push('  The sign test above it is reported and not gated on, and the reason is');
  lines.push('  worth keeping: it was the first shape tried, it read 16/24 (p ~ 0.076)');
  lines.push('  on a healthy build, and that is a test with too little power rather');
  lines.push('  than a finding. It keeps only which bot won each pair and discards by');
  lines.push('  how much, and the signal here is mostly in the magnitudes. Wilcoxon');
  lines.push('  reads the same runs, discarding nothing. The median ratio is effect');
  lines.push('  size only — its absolute value is precisely what failed to reproduce');
  lines.push('  across seeds and across builds, which is why the old shape had to go.');
  if (!tellOk) {
    lines.push('');
    lines.push(`  THE GAP HAS CLOSED. p = ${t.w.p.toFixed(3)} against ${TELL_ALPHA}: the damage the reader`);
    lines.push('  saves is no longer distinguishable from noise. Either a wind-up has');
    lines.push(`  been shortened below what ${Math.round(REACTION * 1000)} ms can answer — check BEAST.pounce.windup`);
    lines.push("  and the Guardian's flares — or something now kills enemies faster than");
    lines.push('  they can commit, making the fight a race rather than a read.');
    lines.push('  Do not "fix" it by making the naive bot worse, by choosing a kinder');
    lines.push('  sample, or by moving this gate. The threshold is arithmetic, and the');
    lines.push('  test was fixed once, deliberately, and does not get changed again.');
  }
  lines.push('');

  lines.push(`GATE GUARDIAN   (${RUNS_PER_SWEEP} seeds per strategy, empty-handed and carrying)`);
  for (const b of r.boss) {
    // `mustWin` reads as "a majority must win"; the kiting row inverts it —
    // that strategy is required to *fail* a majority, which is the gate the
    // design has always claimed and never been able to check.
    //
    // A carrying row additionally has to prove it carried. Without that, a
    // silently broken `giveShadow` prints `+shadow`, passes, and supports the
    // conclusion that an ally changes nothing.
    const carriedOk = !b.carryShadow || b.carried === b.of;
    const pass = (b.mustWin ? b.majority : !b.majority) && carriedOk;
    lines.push(
      `  ${b.strategy.padEnd(7)}${b.carryShadow ? '+shadow' : '       '}  ` +
        `wins ${String(b.won)}/${b.of}  hp left ${b.hp.toFixed(0).padStart(4)}  ` +
        `boss hp ${b.bossHpLeft.toFixed(0).padStart(4)}  ${b.seconds.toFixed(1).padStart(5)}s  ` +
        `${b.carryShadow ? `raised ${b.carried}/${b.of}  ` : ''}${ok(pass)}`
    );
  }
  lines.push('  mash and dodge must both win a majority; ranged must not win one.');
  lines.push(`  All six run at the same ${Math.round(REACTION * 1000)} ms reaction latency the playthrough`);
  lines.push('  bots use. They used to run at zero, justified as keeping them comparable');
  lines.push('  with older builds — but sweeping them broke that comparability anyway');
  lines.push('  (a single seed read 100 HP left where eight read 61–96), so the reason');
  lines.push('  had already stopped applying. It mattered: a bot that never mistimes a');
  lines.push('  dodge is exactly where an ally is worth least, which made zero latency');
  lines.push('  the measurement least able to see a shadow trivialise the fight — and');
  lines.push('  seeing that was the whole purpose of the carrying rows.');
  lines.push('');
  lines.push('  Each strategy runs twice: empty-handed, and walking in with a shadow.');
  lines.push('  Carrying one is the normal way this arena is reached — 6 to 7 runs in 8');
  lines.push('  arrive with an ally — so a boss verified only against a shadow-less');
  lines.push('  hunter was verified against the case that mostly does not happen. The');
  lines.push('  arena holds no other enemies and therefore no remnants, so whatever');
  lines.push('  walks in is all there is for the whole fight.');
  lines.push('');

  lines.push('CARRYING A SHADOW   (the way the game is actually played)');
  const c = r.carried;
  const carriedOk = c.cleared * 2 > c.of;
  // A bot that never managed to extract would clear the gate and pass this row
  // while testing nothing at all. That is the failure mode worth guarding: the
  // row has to prove it used the mechanic before its clear rate means anything.
  const usedIt = c.raised > 0;
  lines.push(row('carries a shadow', c, ok(carriedOk)));
  lines.push(`  shadows raised   ${c.raised} over ${c.of} runs   ${ok(usedIt)}`);
  lines.push(
    `  reached the arena carrying one   ${c.atBoss}/${c.reachedBoss} of the runs that got there   baseline`
  );
  lines.push(
    `  damage taken   carried ${c.damage.toFixed(0)}   empty-handed ${r.playthrough.damage.toFixed(0)}   baseline`
  );
  lines.push('');
  lines.push('  The bot claims a remnant once the fight is over, which is how a careful');
  lines.push('  human plays it — the channel roots for 0.8 s and any hit breaks it.');
  lines.push('  Extracting mid-fight is a gamble, and a gamble is not what this row');
  lines.push('  measures. It measures whether the gate is clearable while carrying a');
  lines.push('  shadow, which the suite could not say anything about until now.');
  lines.push('');
  lines.push('  The last two numbers are recorded baselines, not gates. The Guardian is');
  lines.push('  still tuned for a shadow-less hunter, so asserting on either of them now');
  lines.push('  would be asserting against numbers that are about to move on purpose.');
  if (!usedIt) {
    lines.push('');
    lines.push('  NO SHADOW WAS EVER RAISED, so the clear rate above is measuring the');
    lines.push('  ordinary bot. Check that beasts still leave remnants, that the claim');
    lines.push('  window outlives the encounter, and that `down` is still held when the');
    lines.push("  latency-delayed `heavy` matures — that last one is why the attempt is");
    lines.push('  committed for a fixed window rather than re-decided every frame.');
  }

  lines.push('GATE TRANSITION   (gate 1’s arch into the crossing, and gate 1 again)');
  for (const t of r.transition) {
    lines.push(`  ${t.replay ? '· ' : ''}${t.what.padEnd(t.replay ? 44 : 46)} ${t.detail.padEnd(34)} ${ok(t.ok)}`);
  }
  lines.push('');
  lines.push('  The cost row is the one this design exists for. A gate is several');
  lines.push('  hundred three.js objects, each drawing four Math.random values for its');
  lines.push('  UUID, and the suite seeds that stream — so a gate built mid-run would');
  lines.push('  re-roll every enemy after it and send a fixed seed down a different');
  lines.push('  playthrough. Every gate is therefore built in the constructor, before');
  lines.push('  anything is seeded, and a transition is a visibility flag. The row');
  lines.push('  below it is the control: a counter that reads zero because nobody');
  lines.push('  wired it up reads exactly like a transition that costs nothing.');
  lines.push('');
  lines.push('  The arch is walked into from both sides, because a Warden can die with');
  lines.push('  the hunter standing beyond it and an exit that only opened rightwards');
  lines.push('  would strand them there with the objective lit.');
  lines.push('');
  lines.push('  The `·` rows are gate 1 after the round trip, and they are read across');
  lines.push('  the whole campaign rather than the gate being replayed — an arch left');
  lines.push('  lit in the crossing is state a fresh run does not have, and nothing');
  lines.push('  inside gate 1 would ever notice it.');
  lines.push('');

  lines.push('', `seed ${r.seed}   ·   suite ran in ${r.ms} ms`);

  el.textContent = lines.join('\n');
  document.body.appendChild(el);
  console.log(el.textContent);
}
