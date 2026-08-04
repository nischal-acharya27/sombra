// The System — every piece of DOM the game talks to.
//
// The HUD is HTML rather than 3D on purpose: it is the one part of a Solo
// Leveling pastiche that should look like a UI and not like the world, and
// text stays crisp at any resolution without a single texture.

import { STYLE, SYS_WINDOW } from '../game/config.js';
import { clamp } from '../engine/mathx.js';

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

  boss(show, frac = 1, name = 'GATE GUARDIAN') {
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
   * A System window. `lines` renders as a stat table; `body` as a paragraph.
   * Returns a promise that resolves when it closes, so callers can sequence.
   */
  window({ title, big, body, lines, duration = SYS_WINDOW.encounter }) {
    const el = document.createElement('div');
    el.className = 'sys-window';

    let html = `<h3>${title}</h3><div class="divider"></div>`;
    if (big) html += `<div class="big">${big}</div>`;
    if (body) html += `<p>${body}</p>`;
    if (lines?.length) {
      html += '<ul>';
      for (const [k, v, up] of lines) html += `<li><span>${k}</span><b class="${up ? 'up' : ''}">${v}</b></li>`;
      html += '</ul>';
    }
    el.innerHTML = html;
    this.el.windows.appendChild(el);

    return new Promise((resolve) => {
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => {
          el.remove();
          resolve();
        }, 260);
      }, duration);
    });
  }

  screen(id, on) {
    const el = $(id);
    if (el) el.classList.toggle('hidden', !on);
  }

  clearStats(rows) {
    const el = $('clear-stats');
    el.innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  }
}
