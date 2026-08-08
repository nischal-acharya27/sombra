// Every player-visible string, in one place. `docs/SPEC-CAMPAIGN.md`: "a flat
// keyed object... so that translating the game later is a mechanical job
// rather than an archaeology project." English only — no locale switching UI,
// no fallback chain, no pluralisation machinery; none of that is needed to
// keep the option open, only the one-module seam is.
//
// What does NOT live here: `config.js`'s `ATTACKS.*.name` fields (e.g.
// "Shadow Slash") are never rendered anywhere in `src/` today — dead data,
// not player-visible, so moving them would be inventing display code for a
// string nobody sees. State-machine values ('idle', 'chase', 'dead', ...),
// audio/sfx keys, and CSS class names are not copy either; they stay where
// they are.
//
// Two functions live in this otherwise-flat object rather than two more flat
// strings: the PUKAR remnant-claim line and the title screen's gate tag both
// interpolate something only known at the call site (a touch button's label,
// the resumed gate's name).

export const STRINGS = {
  // -- objective banner -------------------------------------------------------
  OBJ_CLEAR_GATE: 'CLEAR THE GATE',
  OBJ_CROSS_CHASM: 'CROSS THE CHASM',
  OBJ_DEFEAT_ALL: 'DEFEAT ALL ENEMIES',
  OBJ_STEP_THROUGH: 'STEP THROUGH THE GATE',
  OBJ_LEAVE_GATE: 'LEAVE THE GATE',

  // -- toasts -------------------------------------------------------------
  TOAST_CHAYA_LOST: 'CHAYA LOST',
  TOAST_AREA_CLEARED: 'AREA CLEARED',
  TOAST_PUKAR: 'PUKAR',
  TOAST_FORGOTTEN: 'FORGOTTEN',
  TOAST_NOT_ENOUGH_MANA: 'NOT ENOUGH MANA',
  TOAST_CHARGE: 'CHARGE',
  TOAST_SLAM: 'SLAM',
  TOAST_SWEEP: 'SWEEP',
  TOAST_VOLLEY: 'VOLLEY',

  // -- the System's windows -------------------------------------------------
  SYS_TITLE: 'THE SYSTEM',
  WARN_TITLE: 'WARNING',
  ENRAGE_BIG: 'THE CORE IGNITES',
  ENRAGE_BODY: 'The Dwar-Rakshak has entered its second phase.',
  REMNANT_BIG: 'A REMNANT REMAINS',
  /** The touch phrasing names the control that is actually on screen. */
  REMNANT_CLAIM_TOUCH: (heavyLabel) =>
    `Stand over the remnant, hold down on the stick and press ${heavyLabel}.`,
  REMNANT_CLAIM_KEY: 'Stand over the remnant, hold S and press K. The command is PUKAR.',
  LEVEL_UP_TITLE: 'LEVEL UP',
  STAT_MAX_HP: 'MAX HP',
  STAT_MAX_MP: 'MAX MP',
  STAT_STATUS: 'STATUS',
  STAT_RESTORED: 'RESTORED',
  SYS_BOSS_DEFAULT_NAME: 'DWAR-RAKSHAK',

  // -- run end ----------------------------------------------------------------
  RUNEND_TIME: 'TIME',
  RUNEND_KILLS: 'KILLS',
  RUNEND_LEVEL: 'LEVEL REACHED',
  RUNEND_DAMAGE: 'DAMAGE TAKEN',
  RUNEND_RANK: 'RANK',
  EXP_GAIN: (exp) => `+${exp} EXP`,

  // -- style ranks, index-matched to config.js STYLE.ranks -------------------
  RANK_0_LETTER: 'D',
  RANK_0_WORD: 'DORMANT',
  RANK_1_LETTER: 'C',
  RANK_1_WORD: 'CLEAN',
  RANK_2_LETTER: 'B',
  RANK_2_WORD: 'BRUTAL',
  RANK_3_LETTER: 'A',
  RANK_3_WORD: 'ASCENDANT',
  RANK_4_LETTER: 'S',
  RANK_4_WORD: 'SOVEREIGN',
  RANK_5_LETTER: 'SS',
  RANK_5_WORD: 'SOMBRA',

  // -- touch button labels ----------------------------------------------------
  TOUCH_SLASH: 'SLASH',
  TOUCH_JUMP: 'JUMP',
  TOUCH_RISE: 'RISE',
  TOUCH_STEP: 'STEP',
  TOUCH_MAGIC: 'AAGO',

  // -- gate 1: Hollow of the Kneeling Stone ------------------------------------
  GATE1_NAME: 'Hollow of the Kneeling Stone',
  GATE1_WARDEN_TITLE: 'DWAR-RAKSHAK',
  GATE1_FIRSTBLOOD_TITLE: 'THREAT DETECTED',
  GATE1_FIRSTBLOOD_BODY: 'Raakchyas × 3',
  GATE1_FIRSTBLOOD_NOTE: 'Their bodies cannot harm you — only the <b>pounce</b>, and it announces itself.',
  GATE1_BRIDGE_TITLE: 'AMBUSH',
  GATE1_BRIDGE_BODY: 'Raakchyas × 4  ·  Bhoot-Batti × 2',
  GATE1_GUARDIAN_TITLE: 'GATE BOSS',

  // -- gate 2: The Crossing -----------------------------------------------
  GATE2_NAME: 'The Crossing',
  GATE2_WARDEN_TITLE: 'KEVAT',
  GATE2_CHARGER_TITLE: 'THREAT DETECTED',
  GATE2_CHARGER_BODY: 'Charger × 1',
  GATE2_CHARGER_NOTE: 'Its body cannot harm you — only the <b>charge</b>, and it plants its feet first.',
  GATE2_KEVAT_TITLE: 'GATE WARDEN',
  GATE2_KEVAT_NOTE: 'The same tell — it just does not stop at the far bank. It charges twice.',
  GATE2_BEAT_ENTER_TITLE: 'THE SYSTEM',
  GATE2_BEAT_ENTER_BIG: 'NO RECORD FOUND',
  GATE2_BEAT_ENTER_BODY: 'It has never catalogued this realm.',
  GATE2_BEAT_CLEARED_TITLE: 'THE SYSTEM',
  GATE2_BEAT_CLEARED_BIG: 'RECORD: INCOMPLETE',
  GATE2_BEAT_CLEARED_BODY: 'It logged the crossing. It could not say why.',

  // -- gate 3: Naraka ------------------------------------------------------
  GATE3_NAME: 'Naraka',
  GATE3_WARDEN_TITLE: 'GORU-MUKH',
  GATE3_KAWACH_TITLE: 'THREAT DETECTED',
  GATE3_KAWACH_BODY: 'Kawach × 1',
  GATE3_KAWACH_NOTE: 'Its plate turns aside anything that does not send it airborne — that is the one hit that breaks it.',
  GATE3_PROCESSING_TITLE: 'THREAT DETECTED',
  GATE3_PROCESSING_BODY: 'Kawach × 1  ·  Raakchyas × 2',
  GATE3_GORUMUKH_TITLE: 'GATE BOSS',
  GATE3_BEAT_ENTER_TITLE: 'THE SYSTEM',
  GATE3_BEAT_ENTER_BIG: 'PROCESSING HALTED',
  GATE3_BEAT_ENTER_BODY: 'Every soul here is still waiting on a judgment that stopped coming.',
  GATE3_BEAT_CLEARED_TITLE: 'THE SYSTEM',
  GATE3_BEAT_CLEARED_BIG: 'ONE FEWER IN LINE',
  GATE3_BEAT_CLEARED_BODY: 'It cannot say if that is mercy or malfunction.',

  // -- gate 4: Preta-lok -----------------------------------------------------
  GATE4_NAME: 'Preta-lok',
  GATE4_WARDEN_TITLE: 'ATRIPTA',
  GATE4_TANTRIK_TITLE: 'THREAT DETECTED',
  GATE4_TANTRIK_BODY: 'Tantrik × 1',
  GATE4_TANTRIK_NOTE: 'It cannot harm you — only what it <b>raises</b>. Reach it before the queue does.',
  GATE4_WAITING_TITLE: 'THREAT DETECTED',
  GATE4_WAITING_BODY: 'Tantrik × 1  ·  Raakchyas × 2',
  GATE4_ATRIPTA_TITLE: 'GATE WARDEN',
  GATE4_BEAT_ENTER_TITLE: 'THE SYSTEM',
  GATE4_BEAT_ENTER_BIG: 'NOTHING HERE IS FED',
  GATE4_BEAT_ENTER_BODY: 'They are waiting for something that stopped coming.',
  GATE4_BEAT_CLEARED_TITLE: 'THE SYSTEM',
  GATE4_BEAT_CLEARED_BIG: 'STILL UNFILLED',
  GATE4_BEAT_CLEARED_BODY: 'One fewer mouth, and the hunger was never the point.',

  GATE5_NAME: 'Tiryak-lok',
  GATE5_WARDEN_TITLE: 'VYAGHRI',
  GATE5_DEN_TITLE: 'THREAT DETECTED',
  GATE5_DEN_BODY: 'Raakchyas × 3',
  GATE5_HERD_TITLE: 'THREAT DETECTED',
  GATE5_HERD_BODY: 'Raakchyas × 2  ·  Charger × 1',
  GATE5_STAMPEDE_TITLE: 'THREAT DETECTED',
  GATE5_STAMPEDE_BODY: 'Raakchyas × 3  ·  Charger × 2',
  GATE5_VYAGHRI_TITLE: 'GATE WARDEN',
  GATE5_BEAT_ENTER_TITLE: 'THE SYSTEM',
  GATE5_BEAT_ENTER_BIG: 'UNABLE TO CLASSIFY',
  GATE5_BEAT_ENTER_BODY: 'No judgment reaches this far down. Nothing here asks to be spared it.',
  GATE5_BEAT_CLEARED_TITLE: 'THE SYSTEM',
  GATE5_BEAT_CLEARED_BIG: 'STILL UNCLASSIFIED',
  GATE5_BEAT_CLEARED_BODY: 'It does not know what it just watched die, only that it did.',

  // -- gate 6: Manav-lok -----------------------------------------------------
  GATE6_NAME: 'Manav-lok',
  GATE6_WARDEN_TITLE: 'HAKIM',
  GATE6_MARKET_TITLE: 'THREAT DETECTED',
  GATE6_MARKET_BODY: 'Raakchyas × 2  ·  Bhoot-Batti × 1',
  GATE6_ANTECHAMBER_TITLE: 'THREAT DETECTED',
  GATE6_ANTECHAMBER_BODY: 'Kawach × 1  ·  Tantrik × 1  ·  Raakchyas × 1',
  GATE6_HAKIM_TITLE: 'GATE BOSS',
  GATE6_BEAT_ENTER_TITLE: 'THE SYSTEM',
  GATE6_BEAT_ENTER_BIG: 'HOME, ALMOST',
  GATE6_BEAT_ENTER_BODY: 'Every door here opens. Nothing behind them is right.',
  // Not "THE SYSTEM" — the first real conversation in the game, and the
  // reveal `docs/SPEC-CAMPAIGN.md` names as gate 6's whole job.
  GATE6_BEAT_CLEARED_TITLE: 'HAKIM',
  GATE6_BEAT_CLEARED_BIG: 'YAMA STOPPED JUDGING',
  GATE6_BEAT_CLEARED_BODY: 'He could not bear it. Someone still has to.',

  // -- gate 7: Asura-lok -----------------------------------------------------
  GATE7_NAME: 'Asura-lok',
  GATE7_WARDEN_TITLE: 'AMAR-YODDHA',
  GATE7_VANGUARD_TITLE: 'THREAT DETECTED',
  GATE7_VANGUARD_BODY: 'Raakchyas × 2  ·  Charger × 1',
  GATE7_LINE_TITLE: 'THREAT DETECTED',
  GATE7_LINE_BODY: 'Kawach × 2  ·  Raakchyas × 1',
  GATE7_MELEE_TITLE: 'THREAT DETECTED',
  GATE7_MELEE_BODY: 'Raakchyas × 2  ·  Charger × 1  ·  Kawach × 1  ·  Tantrik × 1  ·  Bhoot-Batti × 1',
  GATE7_YODDHA_TITLE: 'GATE WARDEN',
  GATE7_BEAT_ENTER_TITLE: 'THE SYSTEM',
  GATE7_BEAT_ENTER_BIG: 'NO CEASEFIRE ON RECORD',
  GATE7_BEAT_ENTER_BODY: 'They fought this long before the Wheel stopped, and never noticed.',
  GATE7_BEAT_CLEARED_TITLE: 'THE SYSTEM',
  GATE7_BEAT_CLEARED_BIG: 'ONE FEWER COMBATANT',
  GATE7_BEAT_CLEARED_BODY: 'The war does not end because one side changed by one.',

  // -- gate 8: Deva-lok -----------------------------------------------------
  GATE8_NAME: 'Deva-lok',
  GATE8_WARDEN_TITLE: 'CHIRANJIVI',
  GATE8_TERRACE_TITLE: 'THREAT DETECTED',
  GATE8_TERRACE_BODY: 'Raakchyas × 2  ·  Bhoot-Batti × 1',
  GATE8_GARDEN_TITLE: 'THREAT DETECTED',
  GATE8_GARDEN_BODY: 'Kawach × 1  ·  Tantrik × 1  ·  Raakchyas × 1',
  GATE8_CHIRANJIVI_TITLE: 'GATE BOSS',
  GATE8_BEAT_ENTER_TITLE: 'THE SYSTEM',
  GATE8_BEAT_ENTER_BIG: 'NOTHING HERE HAS AGED',
  GATE8_BEAT_ENTER_BODY: 'They do not notice the light is thinner than it was.',
  GATE8_BEAT_CLEARED_TITLE: 'THE SYSTEM',
  GATE8_BEAT_CLEARED_BIG: 'A LIGHT GOES OUT',
  GATE8_BEAT_CLEARED_BODY: 'Even heaven ends. This one simply stopped pretending otherwise.',

  // -- gate 9: Yama-sabha ---------------------------------------------------
  GATE9_NAME: 'Yama-sabha',
  GATE9_WARDEN_TITLE: 'BAKAYA',
  GATE9_ANTECHAMBER_TITLE: 'THREAT DETECTED',
  GATE9_ANTECHAMBER_BODY: 'Raakchyas × 2  ·  Bhoot-Batti × 1',
  GATE9_THRONES_TITLE: 'THREAT DETECTED',
  GATE9_THRONES_BODY: 'Charger × 1  ·  Kawach × 1  ·  Tantrik × 1  ·  Raakchyas × 1',
  GATE9_BAKAYA_TITLE: 'GATE WARDEN',
  // Breaks from every prior gate's "THE SYSTEM" enter framing on purpose —
  // see the comment in `gate9.js` — the same way gate 6's cleared beat did.
  GATE9_BEAT_ENTER_TITLE: 'YAMA',
  GATE9_BEAT_ENTER_BIG: 'NINE THRONES EMPTY',
  GATE9_BEAT_ENTER_BODY: 'He watches the hunter cross the hall. He does not rise.',
  GATE9_BEAT_CLEARED_TITLE: 'THE SYSTEM',
  GATE9_BEAT_CLEARED_BIG: 'JUDGMENT: NONE RENDERED',
  GATE9_BEAT_CLEARED_BODY: 'He did not move. Only what he left undone did.',

  // -- title screen -------------------------------------------------------
  /** `n` is 1-based; `name` is the resumed gate's own name. */
  TITLE_TAG: (n, name) => `GATE ${n} — ${name}`,
};
