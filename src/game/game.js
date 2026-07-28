// The gate run: combat resolution, encounters, progression, win and loss.
//
// Everything that needs to know about everything else lives here, so the other
// modules can stay unaware of each other — the player does not import enemies,
// enemies do not import the HUD.

import * as THREE from 'three';
import { Level, ENCOUNTERS, SPAWN_X, VOID_Y, ARENA_TOP, EXIT_X } from './level.js';
import { Player } from './player.js';
import { Beast, Wisp, Bolt } from './enemies.js';
import { Guardian } from './boss.js';
import { GameCamera } from './camera.js';
import { VFX } from '../render/vfx.js';
import { P } from '../render/palette.js';
import { MAGIC, STYLE, PROGRESSION, PLAYER, WISP } from './config.js';
import { boxHit } from './actor.js';
import { clamp, rand, lerp } from '../engine/mathx.js';

export class Game {
  constructor(world, hud, audio, input) {
    this.world = world;
    this.hud = hud;
    this.audio = audio;
    this.input = input;

    this.scene = world.scene;
    this.vfx = new VFX(this.scene);
    this.cam = new GameCamera(world.camera);

    this.level = new Level(this.scene);
    this.scene.add((this.entityRoot = new THREE.Group()));

    this.ctx = {
      vfx: this.vfx,
      audio: this.audio,
      shake: (a) => this.cam.shake(a),
      toast: (t, k) => this.hud.toast(t, k),
      spawnBolt: (x, y, dir) => this.spawnPlayerBolt(x, y, dir),
      spawnEnemyBolt: (x, y, dx, dy, opts) => this.spawnEnemyBolt(x, y, dx, dy, opts),
      shockwave: (x, y, d) => this.playerShockwave(x, y, d),
      shockwaveFromBoss: (x, y, d) => this.bossShockwave(x, y, d),
      onEnrage: () => this.onEnrage(),
      onTelegraph: (name) => this.onTelegraph(name),
    };

    this.player = new Player(this.level, this.ctx);
    this.entityRoot.add(this.player.root);

    this.enemies = [];
    this.bolts = [];
    this.pendingSpawns = [];
    this.boss = null;

    this.state = 'idle'; // idle | playing | dead | cleared
    this.freeze = 0;
    this.t = 0;
    this.runTime = 0;

    // Progression
    this.level_ = 1;
    this.exp = 0;
    this.kills = 0;
    this.damageTaken = 0;

    // Style
    this.style = 0;
    this.combo = 0;
    this.comboT = 0;
    this.lastMove = null;
    this.moveHistory = [];
    this.styleIdleT = 0;

    this.encounters = ENCOUNTERS.map((e) => ({ ...e, started: false, cleared: false, alive: 0 }));
    this.activeEncounter = null;
    this.moteT = 0;
  }

  // -- lifecycle ------------------------------------------------------------

  start() {
    this.reset();
    this.state = 'playing';
    this.hud.show(true);
    this.audio.startMusic();
    this.hud.objective('CLEAR THE GATE');
  }

  reset() {
    for (const e of this.enemies) this.entityRoot.remove(e.root);
    for (const b of this.bolts) this.entityRoot.remove(b.root);
    this.enemies.length = 0;
    this.bolts.length = 0;
    this.pendingSpawns.length = 0;
    this.boss = null;

    this.player.maxHp = PLAYER.maxHp;
    this.player.maxMp = PLAYER.maxMp;
    this.player.reset(SPAWN_X, 0.2);
    this.cam.snapTo(this.player);
    this.cam.setBounds(null);
    this.cam.zoom(11.5);

    this.level_ = 1;
    this.exp = 0;
    this.kills = 0;
    this.damageTaken = 0;
    this.style = 0;
    this.combo = 0;
    this.runTime = 0;
    this.moveHistory.length = 0;

    for (const e of this.encounters) {
      e.started = false;
      e.cleared = false;
      e.alive = 0;
      this.level.setBarriers(e.id, false);
    }
    this.activeEncounter = null;
    this.hud.boss(false);
    this.hud.setCombo(0);
    this.hud.setStyle(0);
    this._syncVitals();
  }

  /** Loop asks this: 0 freezes the simulation for hitstop. */
  timeScale() {
    return this.freeze > 0 ? 0 : 1;
  }

  // -- fixed-step simulation ------------------------------------------------

  update(dt) {
    if (this.state !== 'playing') return;
    this.t += dt;
    this.runTime += dt;

    this.player.update(dt, this.input);

    for (const e of this.enemies) e.update(dt, this.player);
    for (const b of this.bolts) b.update(dt, this.level);

    this._resolveCombat(dt);
    this._updateSpawns(dt);
    this._updateEncounters();
    this._updateStyle(dt);

    // Cull
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.removeMe || e.y < VOID_Y) {
        this.entityRoot.remove(e.root);
        this.enemies.splice(i, 1);
      }
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      if (this.bolts[i].removeMe) {
        this.entityRoot.remove(this.bolts[i].root);
        this.bolts.splice(i, 1);
      }
    }

    // Falling out of the world.
    if (this.player.y < VOID_Y && this.state === 'playing') {
      this.player.hp = 0;
      this.player.state = 'dead';
      this._onDeath();
    }
    if (this.player.state === 'dead' && this.state === 'playing') this._onDeath();

    this.level.update(dt, this.t);
  }

  // -- per-frame (real time, runs during hitstop) ---------------------------

  render(dt) {
    this.freeze = Math.max(0, this.freeze - dt);

    const focus = this.boss && !this.boss.dead ? this.boss : null;
    this.cam.update(dt, this.player, focus);
    this.vfx.update(dt);
    this.world.update(dt);
    this.world.followShadows(this.cam.x, this.cam.y);

    // Ambient motes drifting through the level, seeded near the camera.
    this.moteT -= dt;
    if (this.moteT <= 0) {
      this.moteT = 0.10;
      this.vfx.ambientMote(this.cam.x + rand(-16, 16), this.cam.y + rand(-4, 10));
    }

    this._syncVitals();
    this.audio.updateMusic(dt);

    if (this.level.portal.material.opacity > 0) {
      const m = this.level.portal.material;
      m.opacity = Math.min(0.72, m.opacity + dt * 0.5);
      this.level.portal.scale.y = 1 + Math.sin(this.t * 3) * 0.02;
    }
  }

  _syncVitals() {
    this.hud.setVitals(this.player.hp, this.player.maxHp, this.player.mp, this.player.maxMp);
    const need = PROGRESSION.curve(this.level_);
    this.hud.setProgress(this.level_, this.exp / need);
    if (this.boss && !this.boss.removeMe) {
      this.hud.boss(true, this.boss.hp / this.boss.maxHp);
    }
  }

  // -- combat ---------------------------------------------------------------

  _resolveCombat(dt) {
    const p = this.player;

    // Player melee vs enemies.
    const hb = p.hitbox();
    if (hb && p.attack) {
      const def = p.attack.def;
      for (const e of this.enemies) {
        if (e.dead || p.attack.hitSet.has(e)) continue;
        if (!boxHit(hb, e.hurtBox())) continue;
        p.attack.hitSet.add(e);
        this._damageEnemy(e, {
          damage: def.damage,
          knock: def.knock,
          launch: def.launch,
          hitstop: def.hitstop,
          shake: def.shake,
          move: p.attack.key,
          style: def.style,
        });
      }
    }

    // Enemy attacks vs player.
    for (const e of this.enemies) {
      const ab = e.attackBox?.();
      if (!ab) continue;
      if (!boxHit(ab, p.box)) continue;
      if (e.chargeHitSet) {
        if (e.chargeHitSet.has(p)) continue;
        e.chargeHitSet.add(p);
      }
      const info = e.currentAttackDamage ? e.currentAttackDamage() : { damage: e.cfg.pounce.damage };
      if (!info) continue;
      this._damagePlayer(info.damage, e.x);
    }

    // Projectiles.
    for (const b of this.bolts) {
      if (b.removeMe) continue;
      if (b.team === 'player') {
        for (const e of this.enemies) {
          if (e.dead || b.hitSet.has(e)) continue;
          if (!boxHit(b.box, e.hurtBox())) continue;
          b.hitSet.add(e);
          this._damageEnemy(e, {
            damage: b.damage,
            knock: MAGIC.knock,
            launch: 0,
            hitstop: MAGIC.hitstop,
            shake: 0.08,
            move: 'magic',
            style: MAGIC.style,
            color: P.violetGlow,
          });
          if (b.consumeHit()) break;
        }
      } else {
        if (boxHit(b.box, p.box) && p.invuln <= 0 && !p.dead) {
          this._damagePlayer(b.damage, b.x);
          b._expire();
        }
      }
    }
  }

  _damageEnemy(e, { damage, knock, launch, hitstop, shake, move, style, color = P.violetGlow }) {
    const isBoss = e === this.boss;
    const landed = e.takeHit({ damage, knock, launch, fromX: this.player.x });
    if (!landed) return;

    this.player.notifyHit();
    const dir = Math.sign(e.x - this.player.x) || this.player.facing;
    const hy = e.y + (isBoss ? 2.0 : e.hh);
    this.vfx.hitSpark(e.x - dir * 0.3, hy, dir, clamp(damage / 26, 0.35, 1.6), color);
    this.vfx.damageNumber(e.x, hy + 0.5, Math.round(damage), {
      color: damage >= 28 ? '#ffd24d' : '#ffffff',
      scale: damage >= 28 ? 1.35 : 1,
    });

    this.freeze = Math.max(this.freeze, hitstop);
    this.cam.shake(shake);
    this._addStyle(style, move);

    if (e.dead) this._onKill(e);
  }

  _damagePlayer(amount, fromX) {
    const p = this.player;
    if (p.invuln > 0 || p.dead) return;
    const before = p.hp;
    if (!p.hurt(amount, fromX)) return;
    this.damageTaken += before - p.hp;

    this.vfx.hitSpark(p.x, p.y + 1, Math.sign(p.x - fromX) || 1, 0.8, P.crimson);
    this.vfx.damageNumber(p.x, p.y + 2.0, Math.round(amount), { color: '#ff6b7a', scale: 1.15 });
    this.freeze = Math.max(this.freeze, 0.07);

    // Being hit is the one thing that empties the style meter.
    this.style *= STYLE.hitTakenLoss;
    this.combo = 0;
    this.hud.setCombo(0);

    if (p.hp <= 0) this._onDeath();
  }

  playerShockwave(x, y, d) {
    this.vfx.shockRing(x, y, d.radius, P.violetGlow);
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.abs(e.x - x) > d.radius || Math.abs(e.y - y) > 3.2) continue;
      this._damageEnemy(e, {
        damage: d.damage,
        knock: d.knock,
        launch: d.launch,
        hitstop: 0.06,
        shake: 0.1,
        move: 'slamwave',
        style: 10,
      });
    }
  }

  bossShockwave(x, y, d) {
    const p = this.player;
    // Grounded only: the slam is escapable by being in the air when it lands,
    // which is the lesson the attack is there to teach.
    if (Math.abs(p.x - x) <= d.radius && p.grounded && p.y < y + 2.5) {
      this._damagePlayer(d.damage, x);
    }
  }

  spawnPlayerBolt(x, y, dir) {
    const b = new Bolt(this.ctx, x, y, dir, 0, {
      team: 'player',
      speed: MAGIC.speed,
      damage: MAGIC.damage,
      life: MAGIC.life,
      pierce: MAGIC.pierce,
      color: P.violetGlow,
      radius: 0.5,
    });
    this.bolts.push(b);
    this.entityRoot.add(b.root);
  }

  spawnEnemyBolt(x, y, dx, dy, opts = {}) {
    const b = new Bolt(this.ctx, x, y, dx, dy, {
      team: 'enemy',
      speed: opts.speed ?? WISP.shoot.speed,
      damage: opts.damage ?? WISP.shoot.damage,
      life: opts.life ?? WISP.shoot.life,
      color: opts.color ?? P.crimson,
      radius: 0.42,
    });
    this.bolts.push(b);
    this.entityRoot.add(b.root);
  }

  // -- style ----------------------------------------------------------------

  _addStyle(points, move) {
    // Repeating a move scores a fraction. Variety is the mechanic.
    const recent = this.moveHistory.slice(-3);
    const repeats = recent.filter((m) => m === move).length;
    const mul = repeats === 0 ? 1 : Math.pow(STYLE.repeatPenalty, repeats);
    this.style = clamp(this.style + points * mul, 0, STYLE.max);
    this.moveHistory.push(move);
    if (this.moveHistory.length > 8) this.moveHistory.shift();
    this.styleIdleT = 0;

    this.combo++;
    this.comboT = STYLE.comboWindow;
    this.hud.setCombo(this.combo);
    if (this.hud.setStyle(this.style)) this.audio.play('rankUp');
  }

  _updateStyle(dt) {
    this.styleIdleT += dt;
    if (this.styleIdleT > STYLE.decayDelay && this.style > 0) {
      this.style = Math.max(0, this.style - STYLE.decay * dt);
      this.hud.setStyle(this.style);
    }
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) {
        this.combo = 0;
        this.hud.setCombo(0);
      }
    }
  }

  // -- encounters -----------------------------------------------------------

  _updateEncounters() {
    for (const e of this.encounters) {
      if (e.started || e.cleared) continue;
      if (this.player.x < e.trigger) continue;
      this._startEncounter(e);
    }

    const active = this.activeEncounter;
    if (!active) return;
    const pending = this.pendingSpawns.some((s) => s.encounter === active.id);
    const alive = this.enemies.some((en) => en.encounter === active.id && !en.dead);
    if (!pending && !alive) this._clearEncounter(active);
  }

  _startEncounter(e) {
    e.started = true;
    this.activeEncounter = e;
    if (e.lock) {
      this.level.setBarriers(e.id, true);
      this.cam.setBounds({ x0: e.lock[0], x1: e.lock[1] });
    }
    for (const s of e.spawns) {
      this.pendingSpawns.push({ ...s, encounter: e.id, t: s.delay });
    }
    if (e.intro) {
      this.audio.play('systemOpen');
      this.hud.window({ title: e.intro.title, big: e.intro.body, duration: e.boss ? 2400 : 1700 });
    }
    if (e.boss) {
      this.hud.objective('');
      this.cam.zoom(17);
      this.audio.setIntensity(1);
    } else {
      this.hud.objective(e.lock ? 'DEFEAT ALL ENEMIES' : 'CROSS THE CHASM');
      this.audio.setIntensity(0.75);
    }
  }

  _clearEncounter(e) {
    e.cleared = true;
    this.activeEncounter = null;
    this.level.setBarriers(e.id, false);
    this.cam.setBounds(null);
    this.audio.setIntensity(0.12);

    if (e.boss) {
      this._onGateCleared();
    } else if (e.lock) {
      this.hud.objective('CLEAR THE GATE');
      this.hud.toast('AREA CLEARED', 'gold');
      this.audio.play('gateOpen');
    }
  }

  _updateSpawns(dt) {
    for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
      const s = this.pendingSpawns[i];
      s.t -= dt;
      if (s.t > 0) continue;
      this.pendingSpawns.splice(i, 1);
      this._spawn(s);
    }
  }

  _spawn(s) {
    const y = s.y ?? this.level.groundAt(s.x) + 0.1;
    let e;
    if (s.type === 'beast') e = new Beast(this.level, this.ctx, s.x, y);
    else if (s.type === 'wisp') e = new Wisp(this.level, this.ctx, s.x, y);
    else if (s.type === 'guardian') {
      e = new Guardian(this.level, this.ctx, s.x, ARENA_TOP);
      this.boss = e;
      this.hud.boss(true, 1);
    }
    if (!e) return;
    e.encounter = s.encounter;
    this.enemies.push(e);
    this.entityRoot.add(e.root);
    this.vfx.shadowBurst(s.x, y + 0.6, 22, P.violetDeep);
    this.audio.play('systemOpen');
  }

  onTelegraph(name) {
    // A word for the tell, so the first fight teaches the vocabulary.
    const label = { charge: 'CHARGE', slam: 'SLAM', sweep: 'SWEEP', volley: 'VOLLEY' }[name];
    if (label) this.hud.toast(label, 'warn');
  }

  onEnrage() {
    this.hud.window({ title: 'WARNING', big: 'THE CORE IGNITES', body: 'The Gate Guardian has entered its second phase.', duration: 1800 });
  }

  // -- progression ----------------------------------------------------------

  _onKill(e) {
    this.kills++;
    this.exp += e.exp;
    this.vfx.damageNumber(e.x, e.y + e.hh * 2 + 0.9, `+${e.exp} EXP`, { color: '#ffb347', scale: 0.85 });
    this.audio.play('exp');

    let need = PROGRESSION.curve(this.level_);
    while (this.exp >= need) {
      this.exp -= need;
      this._levelUp();
      need = PROGRESSION.curve(this.level_);
    }
  }

  _levelUp() {
    this.level_++;
    this.player.maxHp += PROGRESSION.hpPerLevel;
    this.player.maxMp += PROGRESSION.mpPerLevel;
    // Levelling restores you. It is the game's only heal, which is why the
    // fights are paced to hand one out roughly per encounter.
    this.player.hp = this.player.maxHp;
    this.player.mp = this.player.maxMp;
    this.audio.play('levelup');
    this.vfx.shadowBurst(this.player.x, this.player.y + 1, 34, P.cyan);
    this.vfx.groundBurst(this.player.x, this.player.y, 1.1);
    this.hud.window({
      title: 'LEVEL UP',
      big: `LV ${this.level_}`,
      lines: [
        ['MAX HP', `${this.player.maxHp}`, true],
        ['MAX MP', `${this.player.maxMp}`, true],
        ['STATUS', 'RESTORED', true],
      ],
      duration: 2100,
    });
  }

  // -- endings --------------------------------------------------------------

  _onDeath() {
    if (this.state !== 'playing') return;
    this.state = 'dead';
    this.audio.setIntensity(0);
    this.hud.boss(false);
    this.hud.objective('');
    setTimeout(() => {
      if (this.state === 'dead') this.hud.screen('death', true);
    }, 1400);
  }

  _onGateCleared() {
    this.state = 'cleared';
    this.hud.boss(false);
    this.hud.objective('');
    this.audio.setIntensity(0);
    this.level.openExit();
    this.audio.play('gateOpen');
    this.cam.zoom(15);

    const mins = Math.floor(this.runTime / 60);
    const secs = (this.runTime % 60).toFixed(1).padStart(4, '0');
    const rank = this._finalRank();

    setTimeout(() => {
      this.hud.clearStats([
        ['TIME', `${mins}:${secs}`],
        ['KILLS', String(this.kills)],
        ['LEVEL REACHED', String(this.level_)],
        ['DAMAGE TAKEN', String(Math.round(this.damageTaken))],
        ['RANK', rank],
      ]);
      this.hud.screen('clear', true);
    }, 2600);
  }

  _finalRank() {
    // Time and damage taken, not style — the meter is a moment-to-moment toy,
    // the clear rank should reward the whole run.
    let score = 100;
    score -= clamp(this.damageTaken * 0.28, 0, 55);
    score -= clamp((this.runTime - 130) * 0.22, 0, 30);
    if (score > 88) return 'S';
    if (score > 74) return 'A';
    if (score > 58) return 'B';
    if (score > 40) return 'C';
    return 'D';
  }
}
