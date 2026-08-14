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
  // Shared by every boss and Warden's enrage threshold — generic on purpose,
  // since the HUD boss bar already names whoever just crossed it.
  ENRAGE_BIG: 'ESCALATING',
  ENRAGE_BODY: 'It has entered its second phase.',
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
  TOUCH_DASH: 'DASH',
  TOUCH_MAGIC: 'AAGO',

  // -- gate 1: The Loaded Sabha (Mahabharata, Shakuni) -------------------------
  GATE1_NAME: 'The Loaded Sabha',
  GATE1_WARDEN_TITLE: 'SHAKUNI',
  GATE1_GUARDS_TITLE: 'THREAT DETECTED',
  GATE1_GUARDS_BODY: 'Kawach × 2',
  GATE1_GUARDS_NOTE: 'Their bodies cannot harm you — only the <b>bash</b>, and it plants its feet first.',
  GATE1_SHAKUNI_TITLE: 'GATE WARDEN',
  // `docs/DECISIONS.md` § "A Warden's intro and defeat are a scene, not a
  // line" — thirteen paged 'intro' beats, eight paged 'cleared' beats.
  // `_BIG`/`_BODY` is authoring shorthand for "two sentences of one line,"
  // not two visual tiers any more — `HUD._buildWindowEl` renders both in the
  // same dialogue font, per that entry's visual-convention amendment.
  GATE1_SHAKUNI_INTRO_1_BIG: 'Another one, come to spoil the game.',
  GATE1_SHAKUNI_INTRO_1_BODY: "Sit. You're already better company than my nephews.",
  GATE1_SHAKUNI_INTRO_2_BIG: 'Shakuni, they called me. Once, of Gandhara.',
  GATE1_SHAKUNI_INTRO_2_BODY: 'Now? Just the man who still deals the dice.',
  GATE1_SHAKUNI_INTRO_3_BIG: 'A licensed killer, sent to clear a debt.',
  GATE1_SHAKUNI_INTRO_3_BODY: 'How tidy. Gandhara was never tidy.',
  GATE1_SHAKUNI_INTRO_4_BIG: "My father was a king, before Bhishma's cell.",
  GATE1_SHAKUNI_INTRO_4_BODY: 'A hundred of us went into the dark.',
  GATE1_SHAKUNI_INTRO_5_BIG: 'One bowl of rice, for a hundred sons.',
  GATE1_SHAKUNI_INTRO_5_BODY: 'My brothers gave theirs to me. All of them.',
  GATE1_SHAKUNI_INTRO_6_BIG: 'I carved these from the last of my father.',
  GATE1_SHAKUNI_INTRO_6_BODY: 'He said: make them count for something.',
  GATE1_SHAKUNI_INTRO_7_BIG: 'I have had decades to practice this game.',
  GATE1_SHAKUNI_INTRO_7_BODY: "You? A license, and however long you've got.",
  GATE1_SHAKUNI_INTRO_8_BIG: 'I did not lift a blade. I lifted dice.',
  GATE1_SHAKUNI_INTRO_8_BODY: 'A throne changed hands on a loaded roll.',
  GATE1_SHAKUNI_INTRO_9_BIG: 'A queen was shamed at that same table.',
  GATE1_SHAKUNI_INTRO_9_BODY: 'I have not forgiven myself that part.',
  GATE1_SHAKUNI_INTRO_10_BIG: 'It ended in a war that swallowed a generation.',
  GATE1_SHAKUNI_INTRO_10_BODY: "I'm told to regret it. I do.",
  GATE1_SHAKUNI_INTRO_11_BIG: 'And yet, here I still am.',
  GATE1_SHAKUNI_INTRO_11_BODY: 'No one has ever called the game finished.',
  GATE1_SHAKUNI_INTRO_12_BIG: 'You have the look of someone who finishes things.',
  GATE1_SHAKUNI_INTRO_12_BODY: "Prove it, then. Sit down. Let's play.",
  GATE1_SHAKUNI_INTRO_13_BIG: 'Watch where it lands before you flinch.',
  GATE1_SHAKUNI_INTRO_13_BODY: 'Clear the ground it claims before it resolves.',
  GATE1_SHAKUNI_DEFEAT_1_BIG: '...Ah. There it is.',
  GATE1_SHAKUNI_DEFEAT_1_BODY: 'I always wondered what that felt like.',
  GATE1_SHAKUNI_DEFEAT_2_BIG: 'No trick left to play. Imagine that.',
  GATE1_SHAKUNI_DEFEAT_2_BODY: 'Decades, and I never once considered losing.',
  GATE1_SHAKUNI_DEFEAT_3_BIG: 'I do not miss the dice, loaded or fair.',
  GATE1_SHAKUNI_DEFEAT_3_BODY: 'I miss the brothers I built them for.',
  GATE1_SHAKUNI_DEFEAT_4_BIG: 'A hundred of us starved in that cell.',
  GATE1_SHAKUNI_DEFEAT_4_BODY: "A generation died after, because I couldn't stop.",
  GATE1_SHAKUNI_DEFEAT_5_BIG: 'I have dealt this hand more times than I can count.',
  GATE1_SHAKUNI_DEFEAT_5_BODY: "You're the first to take it.",
  GATE1_SHAKUNI_DEFEAT_6_BIG: 'Perhaps that means something moved, somewhere far off.',
  GATE1_SHAKUNI_DEFEAT_6_BODY: 'Or perhaps I am owed nothing. Fair enough.',
  GATE1_SHAKUNI_DEFEAT_7_BIG: 'Let an old man rest, then. Finally.',
  GATE1_SHAKUNI_DEFEAT_7_BODY: "Take your time leaving. I've had nothing but time.",
  GATE1_SHAKUNI_DEFEAT_8_BIG: 'One thing, before you go.',
  GATE1_SHAKUNI_DEFEAT_8_BODY: 'This table will be set again, somewhere ahead.',

  // -- gate 2: The Road to Ekachakra (Mahabharata, Bakasura) ---------------
  GATE2_NAME: 'The Road to Ekachakra',
  GATE2_WARDEN_TITLE: 'BAKASURA',
  GATE2_RAKSHASA_TITLE: 'THREAT DETECTED',
  GATE2_RAKSHASA_BODY: 'Raakchyas × 1',
  GATE2_RAKSHASA_NOTE: 'Its body cannot harm you — only the <b>pounce</b>, and it crouches first.',
  GATE2_BAKASURA_TITLE: 'GATE WARDEN',

  GATE2_BAKASURA_INTRO_1_BIG: 'Another cart, another mouth. You are neither.',
  GATE2_BAKASURA_INTRO_1_BODY: "Ekachakra learned to feed me. You didn't get the word.",
  GATE2_BAKASURA_INTRO_2_BIG: 'One cart of food. One person, to eat alongside it.',
  GATE2_BAKASURA_INTRO_2_BODY: 'The town\'s own bargain. I have never once broken it.',
  GATE2_BAKASURA_INTRO_3_BIG: "A boy walked in wearing another son's name.",
  GATE2_BAKASURA_INTRO_3_BODY: 'He ate the whole cart before I arrived. I respected that.',
  GATE2_BAKASURA_INTRO_4_BIG: 'No one has ever come to me already full.',
  GATE2_BAKASURA_INTRO_4_BODY: "You've done half my work for me, hunter.",
  GATE2_BAKASURA_INTRO_5_BIG: "I don't reason with what's put in front of me.",
  GATE2_BAKASURA_INTRO_5_BODY: 'I eat it. Sit, or don\'t. One cart was never enough.',
  GATE2_BAKASURA_INTRO_6_BIG: 'Watch the hands before you watch anything else.',
  GATE2_BAKASURA_INTRO_6_BODY: 'They close well before the rest of me does.',

  GATE2_BAKASURA_DEFEAT_1_BIG: '...A boy did this to me once, in a story.',
  GATE2_BAKASURA_DEFEAT_1_BODY: "I didn't believe it applied to me either.",
  GATE2_BAKASURA_DEFEAT_2_BIG: 'No sword. No trick. Just weight against weight.',
  GATE2_BAKASURA_DEFEAT_2_BODY: 'I taught Ekachakra that strength always arrives eventually.',
  GATE2_BAKASURA_DEFEAT_3_BIG: 'Tell them the tribute cart can stop now.',
  GATE2_BAKASURA_DEFEAT_3_BODY: 'Tell them I said so. Not that it will matter.',
  GATE2_BAKASURA_DEFEAT_4_BIG: 'I was hungry a very long time.',
  GATE2_BAKASURA_DEFEAT_4_BODY: "Funny. Being done with it doesn't feel like enough.",

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

  // -- gate 10: Bhavachakra --------------------------------------------------
  GATE10_NAME: 'Bhavachakra',
  GATE10_WARDEN_TITLE: 'MAUN-ANKUR',
  GATE10_RIM_TITLE: 'THREAT DETECTED',
  GATE10_RIM_BODY: 'Raakchyas × 2  ·  Bhoot-Batti × 1',
  GATE10_SPOKES_TITLE: 'THREAT DETECTED',
  GATE10_SPOKES_BODY: 'Charger × 1  ·  Kawach × 1  ·  Tantrik × 1  ·  Raakchyas × 1',
  GATE10_MAUNANKUR_TITLE: 'GATE BOSS',
  GATE10_BEAT_ENTER_TITLE: 'THE SYSTEM',
  GATE10_BEAT_ENTER_BIG: 'THE WHEEL HAS STOPPED',
  GATE10_BEAT_ENTER_BODY: 'Nine gates walked. One wheel left, and it will not move.',
  // Breaks from "THE SYSTEM" the same way gates 6 and 9 did at their own
  // hinge moment — the campaign's last cleared beat is the chaya's, not a
  // report about it.
  GATE10_BEAT_CLEARED_TITLE: 'MAUN-ANKUR',
  GATE10_BEAT_CLEARED_BIG: 'THE CHAYA LETS GO',
  GATE10_BEAT_CLEARED_BODY: 'Nine gates were enough. It does not need a tenth.',

  // -- the opening: 4 screens, once per save, before gate 1 (issue #34) -----
  INTRO_WHEEL_TITLE: 'THE SYSTEM',
  INTRO_WHEEL_BIG: 'THE WHEEL HAS STOPPED',
  INTRO_WHEEL_BODY: 'Souls back up with nowhere to go. The overflow tears gates into the living world.',
  INTRO_HUNTER_TITLE: 'THE SYSTEM',
  INTRO_HUNTER_BIG: 'HUNTER, D-RANK',
  INTRO_HUNTER_BODY: 'Licensed. Routine work: walk into what a gate lets through, and clear it.',
  INTRO_THREAT_TITLE: 'THE SYSTEM',
  INTRO_THREAT_BIG: 'WHAT COMES THROUGH',
  INTRO_THREAT_BODY: 'Souls that did not move on. Some of them have turned hostile.',
  INTRO_GOAL_TITLE: 'THE SYSTEM',
  INTRO_GOAL_BIG: 'THE WAY DOWN',
  INTRO_GOAL_BODY: 'Six realms stand between this gate and the Wheel. At the end of them: Yama, who stopped judging.',

  // -- the training hall: gated practice, one verb at a time (issue #35) ----
  TUTORIAL_NAME: 'the Proving Ground',
  TUTORIAL_INTRO_BIG: 'PROVING GROUND',
  TUTORIAL_INTRO_BODY: 'Every hunter is tested here before a gate opens for them. Do as the System asks.',
  TUTORIAL_DONE_BIG: 'LICENSED',
  TUTORIAL_DONE_BODY: 'The gate will not test you again.',
  /** `dir` is which way the exit sits from the hunter right now — the arrow is the whole signal across a hall with no other landmark pointing at it. */
  TUTORIAL_OBJ_LEAVE: (dir) => (dir < 0 ? '← STEP OUT' : 'STEP OUT →'),

  TUTORIAL_MOVE_BIG: 'MOVE',
  TUTORIAL_MOVE_KEY: 'A and D.',
  TUTORIAL_MOVE_TOUCH: 'The stick.',
  TUTORIAL_JUMP_BIG: 'JUMP',
  /** `ctrl` is the resolved key name or touch button label. */
  TUTORIAL_JUMP_BODY: (ctrl) => `${ctrl}. Again in the air to double jump.`,
  TUTORIAL_DASH_BIG: 'SHADOW STEP',
  TUTORIAL_DASH_BODY: (ctrl) => `${ctrl}.`,
  TUTORIAL_SLASH_BIG: 'SLASH',
  TUTORIAL_SLASH_BODY: (ctrl) => `${ctrl}.`,
  TUTORIAL_RISE_BIG: 'ASCENSÃO',
  TUTORIAL_RISE_BODY: (ctrl) => `${ctrl}, on the ground.`,
  TUTORIAL_AAGO_BIG: 'AAGO',
  TUTORIAL_AAGO_BODY: (ctrl) => `${ctrl}. Costs MP.`,
  TUTORIAL_PUKAR_BIG: 'PUKAR',

  // -- title screen -------------------------------------------------------
  /** `n` is 1-based; `name` is the resumed gate's own name. */
  TITLE_TAG: (n, name) => `GATE ${n} — ${name}`,
};
