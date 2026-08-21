// The training hall — issue #35.
//
// Deliberately not `Game`: this space has no encounters, no Warden, no
// campaign save to advance, and the standing rule inside it is stricter than
// anywhere else in the project — nothing here is allowed to threaten the
// hunter at all, not even the passive-contact-only harm every real gate
// already limits itself to. Cloning `Game`'s state machine to get there would
// mean carrying its boss bar, its style meter, its run-end screen and
// disabling all of it; instead this borrows the pieces of a gate that are
// actually about *playing*, and nothing about running a campaign:
// `Level` for geometry, `Player` for the moveset itself, `GameCamera`/`VFX`/
// `Bolt` for the frame around it. A slash performed here is `Player`'s own
// `light1`, the same code path a slash in gate 1 takes.
//
// Building this lazily, on first entry rather than at boot alongside the
// campaign's ten gates, is safe in a way building a *gate* mid-run is not:
// the rule against allocating during play exists because `tools/sim.js` runs
// the game against a seeded `Math.random` and a mid-run allocation would spend
// that stream — and the suite never opens this hall at all.

import * as THREE from 'three';
import { Level } from './level.js';
import { Player } from './player.js';
import { boxHit } from './actor.js';
import { Bolt, Raakchyas } from './enemies.js';
import { Corpse } from './shadow.js';
import { GameCamera } from './camera.js';
import { VFX } from '../render/vfx.js';
import { buildShard, buildRaakchyas } from '../render/models.js';
import { P } from '../render/palette.js';
import { MAGIC, GATE_ARCH, SYS_WINDOW, CHAYA, TUTORIAL } from './config.js';
import { GATE_TUTORIAL } from './gates/tutorial.js';
import { STRINGS } from '../ui/strings.js';

/**
 * A raakchyas that never commits to its pounce — the same gate `chayaOf` in
 * `shadow.js` uses to keep an ally from attacking the hunter it follows.
 * Its `attackBox()` only ever goes live from the `'pounce'` state, so this
 * one override is the whole guarantee: it chases and takes hits like the
 * real thing, but nothing here can ever threaten the hunter.
 */
class PracticeDummy extends Raakchyas {
  _canCommit() {
    return false;
  }
}

/**
 * Move, jump, dash, slash, rise, aago, PUKAR — the order issue #35 asks for,
 * the frozen seven-plus-PUKAR and nothing else. Each step names the verb
 * (`big`) and how to perform it (`body`) and carries a `done` predicate
 * `update()` polls every frame; the step does not advance until it answers
 * true, same as the remnant-claim prompt it borrows PUKAR's own copy from.
 */
function buildSteps(touch) {
  const ctrl = (verb, keyLabel) => touch?.layout.buttons.find((b) => b.verb === verb)?.label ?? keyLabel;
  return [
    {
      id: 'move',
      big: STRINGS.TUTORIAL_MOVE_BIG,
      body: touch ? STRINGS.TUTORIAL_MOVE_TOUCH : STRINGS.TUTORIAL_MOVE_KEY,
      done: (p) => p.grounded && Math.abs(p.vx) > TUTORIAL.moveSpeed,
    },
    {
      id: 'jump',
      big: STRINGS.TUTORIAL_JUMP_BIG,
      body: STRINGS.TUTORIAL_JUMP_BODY(ctrl('jump', 'Space')),
      done: (p) => p.state === 'jump',
    },
    {
      id: 'dash',
      big: STRINGS.TUTORIAL_DASH_BIG,
      body: STRINGS.TUTORIAL_DASH_BODY(ctrl('dash', 'Shift')),
      done: (p) => p.state === 'dash',
    },
    {
      id: 'slash',
      big: STRINGS.TUTORIAL_SLASH_BIG,
      body: STRINGS.TUTORIAL_SLASH_BODY(ctrl('light', 'J')),
      done: (p) => !!p.attack?.key.startsWith('light'),
    },
    {
      id: 'rise',
      big: STRINGS.TUTORIAL_RISE_BIG,
      body: STRINGS.TUTORIAL_RISE_BODY(ctrl('heavy', 'K')),
      done: (p) => p.attack?.key === 'launcher',
    },
    {
      id: 'aago',
      big: STRINGS.TUTORIAL_AAGO_BIG,
      body: STRINGS.TUTORIAL_AAGO_BODY(ctrl('magic', 'L')),
      done: (p) => p.state === 'cast',
    },
    {
      id: 'pukar',
      big: STRINGS.TUTORIAL_PUKAR_BIG,
      body: touch ? STRINGS.REMNANT_CLAIM_TOUCH(ctrl('heavy', 'K')) : STRINGS.REMNANT_CLAIM_KEY,
      done: (p, hall) => !!hall.chaya,
    },
  ];
}

export class Tutorial {
  constructor(world, hud, audio, input, touch = null) {
    this.world = world;
    this.hud = hud;
    this.audio = audio;
    this.input = input;
    this.touch = touch;
    this.gate = GATE_TUTORIAL;

    this.level = new Level(world.scene, this.gate);
    this.level.setVisible(false);

    this.vfx = new VFX(world.scene);
    this.cam = new GameCamera(world.camera);

    this.entityRoot = new THREE.Group();
    world.scene.add(this.entityRoot);
    this.entityRoot.visible = false;

    this.ctx = {
      vfx: this.vfx,
      audio: this.audio,
      shake: (a) => this.cam.shake(a),
      toast: (t, k) => this.hud.toast(t, k),
      spawnBolt: (x, y, dir) => this._spawnBolt(x, y, dir),
      styleMul: () => 1,
      nearestCorpse: (x, y) => this._nearestCorpse(x, y),
      extract: (corpse) => this._extract(corpse),
    };

    this.player = new Player(this.level, this.ctx);
    this.entityRoot.add(this.player.root);

    this.bolts = [];
    this.corpses = [];
    this.chaya = null;
    this.dummies = [];

    // The one remnant this space ever offers — a scripted stand-in rather
    // than a kill, since nothing in this hall is allowed to fight the
    // hunter. `Raakchyas` is only ever read for its rig and its
    // `chayaClass`, never instantiated as a living enemy — see `_armPukar`.
    this.dummyBody = buildRaakchyas();
    this.dummyBody.visible = false;
    this.entityRoot.add(this.dummyBody);
    this.shard = buildShard();
    this.shard.visible = false;
    this.entityRoot.add(this.shard);

    this.active = false;
    this.steps = [];
    this.stepIndex = 0;
    this.wayOpen = false;
    this.onDone = null;
    this.t = 0;
  }

  /** Enter the hall. `onDone` fires once, on completion or SKIP. */
  start(onDone) {
    this.onDone = onDone;
    this.active = true;
    this.steps = buildSteps(this.touch);
    this.stepIndex = 0;
    this.wayOpen = false;
    // A replay through the title screen's TUTORIAL button starts clean —
    // whatever ally the last visit raised does not carry over into this one.
    if (this.chaya) this.entityRoot.remove(this.chaya.root);
    this.chaya = null;
    this.corpses = [];
    for (const d of this.dummies) this.entityRoot.remove(d.root);
    this.dummies = [];
    this.dummyBody.visible = false;
    this.shard.visible = false;
    this.t = 0;

    this.level.reset();
    this.level.setVisible(true);
    this.entityRoot.visible = true;
    this.world.applyRealm(this.gate.realm);
    // Effects outlive the moment that made them — `Game._enterGate` clears
    // for the same reason on every real transition.
    this.vfx.clear();

    this.player.reset(this.gate.spawnX, this.level.groundAt(this.gate.spawnX) + 0.2);
    this.cam.snapTo(this.player);
    this.cam.setBounds(null);
    this.cam.zoom(11.5);

    this.hud.show(true);
    this.hud.boss(false);
    this.hud.setCombo(0);
    this.hud.setStyle(0);
    this.hud.setProgress(1, 0);
    this.hud.objective('');
    this.audio.play('systemOpen');
    this.hud.storyWindow({
      title: STRINGS.SYS_TITLE,
      big: STRINGS.TUTORIAL_INTRO_BIG,
      body: STRINGS.TUTORIAL_INTRO_BODY,
      onNext: () => this._showStep(),
    });
  }

  /** SKIP — available from the moment the hall opens, no questions asked. */
  skip() {
    this._exit();
  }

  _showStep() {
    const s = this.steps[this.stepIndex];
    if (!s) {
      this.audio.play('systemOpen');
      this.hud.window({
        title: STRINGS.SYS_TITLE,
        big: STRINGS.TUTORIAL_DONE_BIG,
        body: STRINGS.TUTORIAL_DONE_BODY,
        duration: SYS_WINDOW.tutorialDone,
      });
      this._spawnDummies();
      this._openExit();
      return;
    }
    this.audio.play('systemOpen');
    this.hud.storyWindow({ title: STRINGS.SYS_TITLE, big: s.big, body: s.body });
    if (s.id === 'pukar') this._armPukar();
  }

  _openExit() {
    this.wayOpen = true;
    this.level.openExit();
    this.audio.play('gateOpen');
    this.hud.objective(STRINGS.TUTORIAL_OBJ_LEAVE(Math.sign(this.gate.exitX - this.player.x)));
  }

  /** Something to practice on before the walk out — raised once, after PUKAR. */
  _spawnDummies() {
    for (let i = 0; i < TUTORIAL.dummyCount; i++) {
      const x = this.player.x + 4 + i * TUTORIAL.dummySpacing;
      const y = this.level.groundAt(x);
      const d = new PracticeDummy(this.level, this.ctx, x, y);
      this.entityRoot.add(d.root);
      this.dummies.push(d);
    }
  }

  /** Lay the stand-in remnant down a few paces ahead of wherever the hunter is. */
  _armPukar() {
    const x = this.player.x + 3 * this.player.facing;
    const y = this.level.groundAt(x) + 0.1;
    this.dummyBody.position.set(x, y, 0);
    this.dummyBody.rotation.set(0, 0, Math.PI / 2.1);
    this.dummyBody.scale.set(1, 0.55, 1);
    this.dummyBody.visible = true;
    this.shard.visible = true;
    this.corpses = [new Corpse(x, y, this.dummyBody, this.shard, Raakchyas)];
  }

  /** Same shape as `Game._resolveCombat`'s player-vs-enemy block, minus exp and style. */
  _resolveDummyHits() {
    const p = this.player;
    const hb = p.hitbox();
    if (!hb || !p.attack) return;
    const def = p.attack.def;
    for (const d of this.dummies) {
      if (d.dead || p.attack.hitSet.has(d)) continue;
      if (!boxHit(hb, d.hurtBox())) continue;
      p.attack.hitSet.add(d);
      const landed = d.takeHit({ damage: def.damage, knock: def.knock, launch: def.launch, fromX: p.x });
      if (!landed) continue;
      const dir = Math.sign(d.x - p.x) || p.facing;
      this.vfx.hitSpark(d.x - dir * 0.3, d.y + d.hh, dir, 1, P.violetGlow);
    }
  }

  _spawnBolt(x, y, dir) {
    const b = new Bolt(this.ctx, x, y, dir, 0, {
      team: 'player',
      speed: MAGIC.speed,
      damage: MAGIC.damage,
      life: MAGIC.life,
      pierce: MAGIC.pierce,
      color: P.aagoCore,
      radius: 0.5,
    });
    this.bolts.push(b);
    this.entityRoot.add(b.root);
  }

  _nearestCorpse(x, y) {
    let best = null;
    let bd = CHAYA.extractRange;
    for (const c of this.corpses) {
      if (c.expired) continue;
      if (Math.abs(c.y - y) > CHAYA.extractReachY) continue;
      const d = Math.abs(c.x - x);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    return best;
  }

  _extract(corpse) {
    this.corpses = this.corpses.filter((c) => c !== corpse);
    const ChayaClass = corpse.sourceClass.chayaClass;
    this.chaya = new ChayaClass(this.level, this.ctx, corpse.x, corpse.y);
    this.entityRoot.add(this.chaya.root);
    this.vfx.shadowBurst(corpse.x, corpse.y + 0.7, 34, P.violet);
    this.vfx.groundBurst(corpse.x, corpse.y, 1.2);
    this.cam.shake(0.2);
    this.audio.play('levelup');
    this.hud.toast(STRINGS.TOAST_PUKAR, 'gold');
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    this.player.update(dt, this.input);

    for (const b of this.bolts) b.update(dt, this.level);
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      if (this.bolts[i].removeMe) {
        this.entityRoot.remove(this.bolts[i].root);
        this.bolts.splice(i, 1);
      }
    }
    if (this.chaya) this.chaya.update(dt, this.player, []);
    for (const c of this.corpses) c.update(dt);

    for (const d of this.dummies) d.update(dt, this.player);
    this._resolveDummyHits();
    for (let i = this.dummies.length - 1; i >= 0; i--) {
      if (this.dummies[i].removeMe) {
        this.entityRoot.remove(this.dummies[i].root);
        this.dummies.splice(i, 1);
      }
    }
    // The corpse window is a real mechanic elsewhere; here it would just be a
    // timer the hunter can fail against, which the ticket rules out. Missing
    // it re-arms the same stand-in instead of letting it run out for good.
    if (this.corpses[0]?.expired) this._armPukar();

    // "No death, ever" — the floor is padded far past where this should be
    // reachable, but the rule holds regardless: put the hunter back rather
    // than let them fall.
    if (this.player.y < TUTORIAL.fallResetY) {
      this.player.reset(this.gate.spawnX, this.level.groundAt(this.gate.spawnX) + 0.2);
      this.cam.snapTo(this.player);
    }

    this.level.update(dt, this.t);

    const s = this.steps[this.stepIndex];
    if (s && s.done(this.player, this)) {
      this.hud.hideStoryWindow();
      this.stepIndex++;
      this._showStep();
    }

    if (this.wayOpen) {
      const inside = Math.abs(this.player.x - this.gate.exitX) <= GATE_ARCH.reach;
      if (inside && this.input.pressed('up')) this._exit();
      // Kept live rather than set once in `_openExit` — the arrow has to still
      // point the right way if the hunter wanders past the portal and doubles back.
      else this.hud.objective(STRINGS.TUTORIAL_OBJ_LEAVE(Math.sign(this.gate.exitX - this.player.x)));
    }
  }

  render(dt) {
    this.cam.update(dt, this.player);
    this.vfx.update(dt);
    this.world.update(dt);
    this.world.followShadows(this.cam.x, this.cam.y);
    this.hud.setVitals(this.player.hp, this.player.maxHp, this.player.mp, this.player.maxMp);

    if (this.level.portal.material.opacity > 0) {
      const m = this.level.portal.material;
      m.opacity = Math.min(0.72, m.opacity + dt * 0.5);
      this.level.portal.scale.y = 1 + Math.sin(this.t * 3) * 0.02;
    }
  }

  _exit() {
    if (!this.active) return;
    this.active = false;
    this.hud.hideStoryWindow();
    this.hud.objective('');
    this.hud.boss(false);
    // `Game.start()` shows it again the moment a real run begins; nothing
    // else in the project ever hides it once shown, because nothing else
    // ever goes back to the title screen after showing it. This does.
    this.hud.show(false);
    this.level.setVisible(false);
    this.entityRoot.visible = false;
    this.cam.setBounds(null);
    const done = this.onDone;
    this.onDone = null;
    done?.();
  }
}
