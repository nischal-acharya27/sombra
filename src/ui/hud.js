// The System — every piece of DOM the game talks to.
//
// The HUD is HTML rather than 3D on purpose: it is the one part of a Solo
// Leveling pastiche that should look like a UI and not like the world, and
// text stays crisp at any resolution without a single texture.

import { STYLE } from '../game/config.js';
import { clamp } from '../engine/mathx.js';
import { STRINGS } from './strings.js';

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor() {
    this.el = {
      hud: $('hud'),
      hpBar: $('hud').querySelector('.bar.hp'),
      hpFill: $('hud').querySelector('.bar.hp i'),
      hpText: $('hp-text'),
      mpFill: $('hud').querySelector('.bar.mp i'),
      mpText: $('mp-text'),
      xpFill: $('hud').querySelector('.xp i'),
      lvlText: $('lvl-text'),
      rank: $('rank'),
      rankLetter: $('rank').querySelector('.letter'),
      rankWord: $('rank').querySelector('.word'),
      rankMeter: $('rank').querySelector('.meter i'),
      combo: $('combo'),
      comboNum: $('combo').querySelector('b'),
      callout: $('rank-callout'),
      calloutLetter: $('rank-callout').querySelector('b'),
      calloutWord: $('rank-callout').querySelector('span'),
      objective: $('objective'),
      bossBar: $('boss-bar'),
      bossName: $('boss-bar').querySelector('.boss-name'),
      bossFill: $('boss-bar').querySelector('.boss-track i'),
      windows: $('windows'),
      toasts: $('toasts'),
    };
    this._lastRank = -1;
    this._objectiveText = '';
  }

  show(on = true) {
    this.el.hud.classList.toggle('hidden', !on);
  }

  setVitals(hp, maxHp, mp, maxMp) {
    const hf = clamp(hp / maxHp, 0, 1);
    this.el.hpFill.style.transform = `scaleX(${hf})`;
    this.el.hpText.textContent = `${Math.ceil(hp)}/${maxHp}`;
    this.el.hpBar.classList.toggle('low', hf < 0.3);
    const mf = clamp(mp / maxMp, 0, 1);
    this.el.mpFill.style.transform = `scaleX(${mf})`;
    this.el.mpText.textContent = `${Math.floor(mp)}/${maxMp}`;
  }

  setProgress(level, xpFrac) {
    this.el.lvlText.textContent = String(level);
    this.el.xpFill.style.transform = `scaleX(${clamp(xpFrac, 0, 1)})`;
  }

  /** @param {number} meter raw style points */
  setStyle(meter) {
    let idx = 0;
    for (let i = 0; i < STYLE.ranks.length; i++) if (meter >= STYLE.ranks[i].at) idx = i;
    const rank = STYLE.ranks[idx];
    const next = STYLE.ranks[idx + 1];
    const lo = rank.at;
    const hi = next ? next.at : STYLE.max;
    const frac = clamp((meter - lo) / (hi - lo), 0, 1);

    this.el.rank.classList.toggle('on', meter > 4);
    this.el.rankLetter.textContent = rank.letter;
    this.el.rankWord.textContent = rank.word;
    this.el.rankMeter.style.transform = `scaleX(${frac})`;
    for (let i = 0; i < 6; i++) this.el.rank.classList.toggle('r' + i, i === idx);

    const rankedUp = idx > this._lastRank && meter > 4;
    this._lastRank = idx;
    if (rankedUp) {
      // Restart the animation: removing and re-adding in the same frame is a
      // no-op, so force a reflow between the two.
      this.el.rank.classList.remove('bump');
      void this.el.rank.offsetWidth;
      this.el.rank.classList.add('bump');
      this._callout(rank, idx);
    }
    return rankedUp;
  }

  /**
   * Announce a rank-up over the fight.
   *
   * The corner meter went unnoticed in both playtests — the second time after
   * the letter had already grown by a third and gained a flash. Scaling up the
   * thing in the corner was answering the wrong question: the player is looking
   * at the hunter. So the rank comes to them once, where they are looking, and
   * then leaves.
   */
  _callout(rank, idx) {
    const el = this.el.callout;
    this.el.calloutLetter.textContent = rank.letter;
    this.el.calloutWord.textContent = rank.word;
    for (let i = 0; i < 6; i++) el.classList.toggle('r' + i, i === idx);
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
  }

  setCombo(n) {
    this.el.combo.classList.toggle('on', n >= 2);
    this.el.comboNum.textContent = String(n);
  }

  objective(text) {
    if (text === this._objectiveText) return;
    this._objectiveText = text;
    this.el.objective.textContent = text;
    this.el.objective.classList.toggle('on', !!text);
  }

  boss(show, frac = 1, name = STRINGS.SYS_BOSS_DEFAULT_NAME) {
    this.el.bossBar.classList.toggle('hidden', !show);
    this.el.bossName.textContent = name;
    this.el.bossFill.style.transform = `scaleX(${clamp(frac, 0, 1)})`;
  }

  toast(text, kind = '') {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = text;
    this.el.toasts.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 400);
    }, 1900);
  }

  /**
   * Writes `{title, big, body, lines, glitch}` into `el` — a fresh element if
   * none is given, or an existing `.sys-window` reused in place otherwise.
   *
   * The reuse path is what keeps `window()`/`storyWindow()` from ever having
   * two elements live in `#windows` at once for what is, to the player, one
   * ongoing box. `#windows` is a flex column, so a second element appended
   * while the first is still mid-fade-out lands *below* it — not on top of
   * it — and only slides up into the first's place once that fade finishes
   * and removes it. That slide was the actual bug: not any one card's look,
   * but a new one arriving as a sibling instead of a replacement. Writing
   * into the same node sidesteps it entirely — there is never a second node.
   */
  _fillWindowEl(el, { title, big, body, lines, glitch = false }) {
    el.className = glitch ? 'sys-window glitch' : 'sys-window';
    let html = `<h3>${title}</h3><div class="divider"></div>`;
    if (big) html += `<div class="big">${big}</div>`;
    if (body) html += `<p>${body}</p>`;
    if (lines?.length) {
      html += '<ul>';
      for (const [k, v, up] of lines) html += `<li><span>${k}</span><b class="${up ? 'up' : ''}">${v}</b></li>`;
      html += '</ul>';
    }
    el.innerHTML = html;
    return el;
  }

  /**
   * A System window. `lines` renders as a stat table; `body` as a paragraph.
   * `glitch` marks the window as the System failing to report cleanly, rather
   * than the game failing to render — see `.sys-window.glitch` in the CSS.
   * Returns a promise that resolves when it closes, so callers can sequence.
   *
   * A call arriving while a previous `window()` is still on screen — timed
   * out and fading, or not — reuses that same element (see `_fillWindowEl`)
   * instead of stacking a second one, and restarts the duration clock on the
   * new content. Nothing in this codebase awaits the promise for sequencing
   * today, so a reused call resolving on its own timer rather than the
   * superseded call's is a real but harmless simplification, not a contract
   * anything depends on.
   */
  window({ title, big, body, lines, glitch = false, duration }) {
    clearTimeout(this._windowOutTimer);
    clearTimeout(this._windowRemoveTimer);
    const reused = this._windowEl;
    const el = this._fillWindowEl(reused ?? document.createElement('div'), { title, big, body, lines, glitch });
    if (reused) {
      el.classList.remove('out');
    } else {
      this.el.windows.appendChild(el);
      this._windowEl = el;
    }

    // No `duration`: the caller is holding it open on purpose (see the
    // boss-kill stat box in `Game._levelUp`) and is responsible for calling
    // `hideWindow()` once the player has actually dismissed it — a `0`-delay
    // `setTimeout` is what an omitted `duration` would otherwise schedule.
    if (duration == null) return Promise.resolve();

    return new Promise((resolve) => {
      this._windowOutTimer = setTimeout(() => {
        el.classList.add('out');
        this._windowRemoveTimer = setTimeout(() => {
          el.remove();
          if (this._windowEl === el) this._windowEl = null;
          resolve();
        }, 260);
      }, duration);
    });
  }

  /** Closes an untimed `window()` early — the boss-kill stat box's own `hideStoryWindow`. */
  hideWindow() {
    const el = this._windowEl;
    if (!el) return;
    this._windowEl = null;
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }

  /**
   * The story-beat window a gate boundary opens. Unlike `window()` this never
   * times itself out — a fixed-duration fade cut the text off mid-sentence for
   * anyone who reads slower than the timer, which is what a player report
   * caught. It stays up until `hideStoryWindow` closes it, which
   * `Game.restResume` does the moment the hunter accepts the RESUME prompt
   * `bossRestPrompt` lands right underneath it.
   *
   * `HUD` shows one beat at a time; `Game` owns the queue behind it. Paging
   * to the next beat reuses the same element (`_fillWindowEl`) rather than
   * closing and reopening one — the fix for the same stack-then-slide bug
   * `window()`'s own doc comment describes, and the more visible case of it:
   * this is the window a player pages through several times in a row.
   * `onNext`, if given, renders a NEXT button that hands control back to
   * `Game` to show the next queued beat.
   */
  storyWindow({ title, big, body, glitch = false, onNext }) {
    const reused = this._storyWindowEl;
    const el = this._fillWindowEl(reused ?? document.createElement('div'), { title, big, body, glitch });
    if (reused) {
      el.classList.remove('out');
    } else {
      this.el.windows.appendChild(el);
      this._storyWindowEl = el;
    }
    // Toggled, not just added: reusing `el` means a beat with no NEXT
    // (the last one in a queue) has to be able to shed a `paging` a prior
    // beat left set, not just gain it.
    el.classList.toggle('paging', !!onNext);
    if (onNext) {
      const btn = document.createElement('button');
      btn.className = 'cta';
      btn.textContent = 'NEXT';
      btn.addEventListener('click', onNext);
      el.appendChild(btn);
    }
  }

  hideStoryWindow() {
    const el = this._storyWindowEl;
    if (!el) return;
    this._storyWindowEl = null;
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }

  screen(id, on) {
    const el = $(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  /**
   * The RESUME prompt a fallen Warden holds the hunter on. Appended to
   * `#windows` — the same container `window()` uses — so it lands directly
   * below whatever `_fireBeats('cleared')` just opened there, rather than
   * fighting it for the screen. `onResume` is `Game.restResume`; `hud.js`
   * does not know `Game`, so the caller hands over what a click should do.
   */
  bossRestPrompt(name, onResume) {
    const el = document.createElement('div');
    el.className = 'sys-window boss-rest';
    el.innerHTML = `<h3>${name}</h3><div class="divider"></div>`;
    const btn = document.createElement('button');
    btn.className = 'cta';
    btn.textContent = 'RESUME';
    btn.addEventListener('click', onResume);
    el.appendChild(btn);
    this.el.windows.appendChild(el);
    this._bossRestEl = el;
  }

  hideBossRestPrompt() {
    this._bossRestEl?.remove();
    this._bossRestEl = null;
  }

  /**
   * The CTA a Warden's last `'intro'` beat holds on — `bossRestPrompt`'s same
   * bare card-plus-button shape, minus the name header: the story window
   * above it already carries the Warden's name, so repeating it here would
   * just be the same word twice. `onBegin` is `Game._beginWardenFight`;
   * clearing it is `hideRestPrompts`, unchanged — it already only cares that
   * `_bossRestEl` and the open story window both exist, not which prompt put
   * them there.
   */
  beginPrompt(onBegin, label = 'BEGIN') {
    const el = document.createElement('div');
    el.className = 'sys-window boss-rest';
    const btn = document.createElement('button');
    btn.className = 'cta';
    btn.textContent = label;
    btn.addEventListener('click', onBegin);
    el.appendChild(btn);
    this.el.windows.appendChild(el);
    this._bossRestEl = el;
  }

  /** Tears down the boss-rest beat: the RESUME prompt and the story window under it. */
  hideRestPrompts() {
    this.hideBossRestPrompt();
    this.hideStoryWindow();
  }

  clearStats(rows) {
    const el = $('clear-stats');
    el.innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  }
}
