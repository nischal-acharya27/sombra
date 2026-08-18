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
  /** `Game.firePhaseBeat`'s held prompt — the same CTA shape `beginPrompt` already renders, worded for a fight already underway rather than one about to start. */
  CTA_CONTINUE: 'CONTINUE',
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

  GATE2_BAKASURA_INTRO_1_BIG: 'No cart. No trembling. You walk in like a guest.',
  GATE2_BAKASURA_INTRO_1_BODY: 'Ekachakra sends its tribute at a crawl. You did not crawl.',
  GATE2_BAKASURA_INTRO_2_BIG: 'The bargain is simple, and I have never once broken it.',
  GATE2_BAKASURA_INTRO_2_BODY: 'One cart of food. One person, to eat alongside it. Or I raze the town instead.',
  GATE2_BAKASURA_INTRO_3_BIG: 'They offered me that bargain. I did not invent it.',
  GATE2_BAKASURA_INTRO_3_BODY: 'A council of frightened elders, years ago, buying their houses one meal at a time.',
  GATE2_BAKASURA_INTRO_4_BIG: 'Every house takes its turn. The lots are drawn fairly.',
  GATE2_BAKASURA_INTRO_4_BODY: 'I have eaten from all of them by now. Fair does not mean gentle.',
  GATE2_BAKASURA_INTRO_5_BIG: 'This turn belonged to a Brahmin household. A son, mostly grown.',
  GATE2_BAKASURA_INTRO_5_BODY: 'I heard the mother through the walls before I heard the cart.',
  GATE2_BAKASURA_INTRO_6_BIG: 'A stranger came instead, wearing that son\'s place at the table.',
  GATE2_BAKASURA_INTRO_6_BODY: 'Broad through the shoulders. Ate like the cart owed him something.',
  GATE2_BAKASURA_INTRO_7_BIG: 'By the time I arrived, the whole cart was gone. Every last measure.',
  GATE2_BAKASURA_INTRO_7_BODY: 'No one has ever come to my table already full. I respected it, briefly.',
  GATE2_BAKASURA_INTRO_8_BIG: 'Respect did not stop what came after. Nothing ever does.',
  GATE2_BAKASURA_INTRO_8_BODY: "I don't reason with what's put in front of me. I eat it, or I break it.",
  GATE2_BAKASURA_INTRO_9_BIG: "That stranger broke instead. Wrestled me bare-handed, and won.",
  GATE2_BAKASURA_INTRO_9_BODY: 'No blade. Just his own two arms against a rakshasa\'s. I still do not have the shape of it.',
  GATE2_BAKASURA_INTRO_10_BIG: 'And now here you stand, not from Ekachakra, not sent by any house.',
  GATE2_BAKASURA_INTRO_10_BODY: "You didn't come to feed me. You came to close the account.",
  GATE2_BAKASURA_INTRO_11_BIG: 'This bargain has held longer than either of us has been counting.',
  GATE2_BAKASURA_INTRO_11_BODY: 'It does not end because a second stranger wants it to.',
  GATE2_BAKASURA_INTRO_12_BIG: 'I do not carry a blade, and I have never needed one.',
  GATE2_BAKASURA_INTRO_12_BODY: 'These hands have closed around better than you. Ekachakra could tell you, if any were left to.',
  GATE2_BAKASURA_INTRO_13_BIG: 'Watch the hands before you watch anything else.',
  GATE2_BAKASURA_INTRO_13_BODY: 'They close well before the rest of me does.',

  GATE2_BAKASURA_DEFEAT_1_BIG: '...A stranger did this to me once, in the same story.',
  GATE2_BAKASURA_DEFEAT_1_BODY: "I told myself it would not happen twice. I was wrong twice, then.",
  GATE2_BAKASURA_DEFEAT_2_BIG: 'No sword. No trick. Just weight against weight, same as before.',
  GATE2_BAKASURA_DEFEAT_2_BODY: 'I taught Ekachakra that strength always arrives eventually. I forgot to fear my own lesson.',
  GATE2_BAKASURA_DEFEAT_3_BIG: 'I did not choose this hunger. I only chose how to feed it.',
  GATE2_BAKASURA_DEFEAT_3_BODY: 'A rakshasa does not get to un-become one. I stopped looking for the door out, long ago.',
  GATE2_BAKASURA_DEFEAT_4_BIG: 'I remember every house whose turn it was. All of them.',
  GATE2_BAKASURA_DEFEAT_4_BODY: 'I told myself the bargain was mercy, next to burning the town. Maybe it was. It was still this.',
  GATE2_BAKASURA_DEFEAT_5_BIG: 'Tell them the tribute cart can stop now. Tell them I said so.',
  GATE2_BAKASURA_DEFEAT_5_BODY: "Not that it will matter to the houses already spent on me.",
  GATE2_BAKASURA_DEFEAT_6_BIG: 'I was hungry a very long time. Longer than the town knew to be afraid.',
  GATE2_BAKASURA_DEFEAT_6_BODY: "Funny. Being done with it doesn't feel like enough.",
  GATE2_BAKASURA_DEFEAT_7_BIG: 'Without the bargain, I do not know what I was for.',
  GATE2_BAKASURA_DEFEAT_7_BODY: 'Perhaps nothing. Perhaps that was always the honest answer.',
  GATE2_BAKASURA_DEFEAT_8_BIG: 'Go on, then. Ekachakra will hear the road is quiet again.',
  GATE2_BAKASURA_DEFEAT_8_BODY: "Some other gate will have its own hunger waiting. This one is closed.",

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

  // -- gate 4: Tataka-vana (Ramayana, Bala Kanda) -----------------------------
  GATE4_NAME: 'Tataka-vana',
  GATE4_WARDEN_TITLE: 'TARAKA',
  GATE4_WISP_TITLE: 'THREAT DETECTED',
  GATE4_WISP_BODY: 'Bhoot-Batti × 2',
  GATE4_WISP_NOTE: 'It cannot harm you at range — only the <b>bolt</b>, and it flares before it fires.',
  GATE4_TARAKA_TITLE: 'GATE WARDEN',

  GATE4_TARAKA_INTRO_1_BIG: 'I had a name once, before the forest learned to fear it.',
  GATE4_TARAKA_INTRO_1_BODY: "Suketu's daughter. Brahma gave me the strength of a thousand elephants.",
  GATE4_TARAKA_INTRO_2_BIG: 'I married Sunda, and for a while that strength was just mine to have.',
  GATE4_TARAKA_INTRO_2_BODY: "A yaksha's life, ordinary by the boon's own strange measure.",
  GATE4_TARAKA_INTRO_3_BIG: 'A sage killed him. Agastya, for a slight I never learned the shape of.',
  GATE4_TARAKA_INTRO_3_BODY: 'My son and I went to him with everything that strength was for.',
  GATE4_TARAKA_INTRO_4_BIG: 'Grief does not ask permission before it becomes a weapon.',
  GATE4_TARAKA_INTRO_4_BODY: 'We meant to make him answer for Sunda. We did not reach him gently.',
  GATE4_TARAKA_INTRO_5_BIG: 'He cursed me instead of killing me. I have never decided which was crueler.',
  GATE4_TARAKA_INTRO_5_BODY: 'Beautiful, he said, was not a shape grief like mine deserved to keep.',
  GATE4_TARAKA_INTRO_6_BIG: 'So the forest got a terror instead of a widow.',
  GATE4_TARAKA_INTRO_6_BODY: 'Tataka-vana. They named the trees after what I became in them.',
  GATE4_TARAKA_INTRO_7_BIG: 'I have worn this shape long enough to stop flinching at it.',
  GATE4_TARAKA_INTRO_7_BODY: 'Long enough that flinching would be its own kind of lie now.',
  GATE4_TARAKA_INTRO_8_BIG: 'Every soul wandering this canopy answers to the same stalled Wheel you do.',
  GATE4_TARAKA_INTRO_8_BODY: 'I am not guarding a gate. I am one more thing it forgot to move.',
  GATE4_TARAKA_INTRO_9_BIG: 'Others have come through this forest before you, for reasons of their own.',
  GATE4_TARAKA_INTRO_9_BODY: "A sage's student once, ordered to prove himself against a former woman.",
  GATE4_TARAKA_INTRO_10_BIG: 'You are not him, and I am owed no hesitation from you either way.',
  GATE4_TARAKA_INTRO_10_BODY: 'Come at me however you actually intend to.',
  GATE4_TARAKA_INTRO_11_BIG: 'I move faster than anything else that has ever guarded a gate.',
  GATE4_TARAKA_INTRO_11_BODY: 'The boon never left. Only the face wearing it changed.',
  GATE4_TARAKA_INTRO_12_BIG: 'You will not see the curse in me until it is ready to be seen.',
  GATE4_TARAKA_INTRO_12_BODY: 'Watch for the moment it stops hiding. It will not warn you twice.',
  GATE4_TARAKA_INTRO_13_BIG: 'You wear a face I used to have.',
  GATE4_TARAKA_INTRO_13_BODY: "Let's see what's underneath both of ours.",

  GATE4_TARAKA_DEFEAT_1_BIG: "...So that's what I looked like, at the end of it.",
  GATE4_TARAKA_DEFEAT_1_BODY: 'I had almost forgotten there was an end to look like anything at.',
  GATE4_TARAKA_DEFEAT_2_BIG: "Agastya's curse outlasted the sage who gave it. It should not have outlasted me too.",
  GATE4_TARAKA_DEFEAT_2_BODY: 'No Wheel ever came to take the shape back, either.',
  GATE4_TARAKA_DEFEAT_3_BIG: 'I do not forgive him. I have simply run out of forest to be angry in.',
  GATE4_TARAKA_DEFEAT_3_BODY: 'Anger needs somewhere to stand. You just took mine.',
  GATE4_TARAKA_DEFEAT_4_BIG: 'Sunda is wherever the Wheel still actually turns. I hope it turns there, at least.',
  GATE4_TARAKA_DEFEAT_4_BODY: 'I stopped being able to hope much past that, a long time ago.',
  GATE4_TARAKA_DEFEAT_5_BIG: 'Tell whoever asks that Tataka-vana is quiet now. Not safe. Quiet.',
  GATE4_TARAKA_DEFEAT_5_BODY: 'Nothing that grows back here forgets what stood in it.',
  GATE4_TARAKA_DEFEAT_6_BIG: 'You did not flinch, and I did not ask you to.',
  GATE4_TARAKA_DEFEAT_6_BODY: 'That was owed to a different boy, in a different forest, long before you.',
  GATE4_TARAKA_DEFEAT_7_BIG: 'I was beautiful once. I was this, longer. Both were true of the same person.',
  GATE4_TARAKA_DEFEAT_7_BODY: 'Remember that part, if you remember any of it.',
  GATE4_TARAKA_DEFEAT_8_BIG: 'Take the shape with you, hunter. I am done carrying it.',
  GATE4_TARAKA_DEFEAT_8_BODY: "Whatever the Wheel does with what's left, it can only be kinder than the forest was.",

  // Gate 5 — Kaikeyi (Ramayana, Ayodhya Kanda). The roster's first tier-0,
  // no-combat gate: four beats, each authored twice — 'low'/'jump' are the
  // two fork paths `Game._updateForks` resolves per beat, per
  // docs/agents/villain-handoff.md and docs/research/villain-roster.md.
  // Which fork the hunter takes shapes tone (low leans matter-of-fact/angry,
  // jump leans wistful/grieving) but never which beat comes next.
  GATE5_NAME: 'Ayodhya',
  GATE5_KAIKEYI_TITLE: 'KAIKEYI',

  GATE5_BOON_LOW_BIG: 'He owed me two boons. I never asked for anything before that day.',
  GATE5_BOON_LOW_BODY: 'A battlefield vow, kept the way a vow is supposed to be kept.',
  GATE5_BOON_JUMP_BIG: 'I saved his life once, and never spent what he owed me for it.',
  GATE5_BOON_JUMP_BODY: 'Not until I had a reason large enough to make it real.',

  GATE5_MANTHARA_LOW_BIG: 'Manthara filled my ears until the crown looked like the only safe place left.',
  GATE5_MANTHARA_LOW_BODY: 'I let her. That much is mine to own.',
  GATE5_MANTHARA_JUMP_BIG: 'She was afraid for me before I was afraid for myself.',
  GATE5_MANTHARA_JUMP_BODY: 'Fear is patient. It waited until I was tired enough to listen.',

  GATE5_INVOCATION_LOW_BIG: 'Bharata crowned. Rama exiled fourteen years. I said the words and meant every one.',
  GATE5_INVOCATION_LOW_BODY: 'Dasharatha died before the fourteenth year began.',
  GATE5_INVOCATION_JUMP_BIG: 'I asked for exactly what I was owed, and the King kept his word.',
  GATE5_INVOCATION_JUMP_BODY: 'It killed him to keep it. I did not think that far ahead.',

  GATE5_REGRET_LOW_BIG: 'I have had a long time to sit with what I bought.',
  GATE5_REGRET_LOW_BODY: 'It was never as much as I thought it would be.',
  GATE5_REGRET_JUMP_BIG: 'Bharata never forgave me either. He wears the crown like a wound.',
  GATE5_REGRET_JUMP_BODY: 'So do I, if you look closely enough.',

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

  // -- gate 03 (new campaign): Kurukshetra + the lake, Duryodhana (Mahabharata,
  // Shalya Parva) — content prep only. Per docs/SPEC-CAMPAIGN.md, Duryodhana is
  // a bespoke `Boss` subclass, not a Warden, and has not been wired into a gate
  // file yet; the old GATE3 keys above (Naraka/Goru-Mukh) are the currently
  // live gate 3 and are untouched by this block. Expanded past the spec's
  // originally-locked two-line minimum into a full intro/defeat scene, matching
  // Shakuni's and Bakasura's treatment, per an explicit call to do so —
  // SPEC-CAMPAIGN.md's dialogue table and reasoning should be updated to match
  // before this ships.
  GATE3_DURYODHANA_WARDEN_TITLE: 'DURYODHANA',
  GATE3_DURYODHANA_TITLE: 'GATE BOSS',

  GATE3_DURYODHANA_INTRO_1_BIG: "You found the lake. Most don't think to look at water.",
  GATE3_DURYODHANA_INTRO_1_BODY: 'I have been still down here long enough to forget the sound of my own name.',
  GATE3_DURYODHANA_INTRO_2_BIG: 'Eighteen days, and everyone I called brother is already gone.',
  GATE3_DURYODHANA_INTRO_2_BODY: 'I counted them leaving one by one. I did not count myself as next.',
  GATE3_DURYODHANA_INTRO_3_BIG: 'I was the eldest son of a king. That should have been the whole story.',
  GATE3_DURYODHANA_INTRO_3_BODY: 'Instead a cousin born the same season got called heir, and I got called envious.',
  GATE3_DURYODHANA_INTRO_4_BIG: 'Yudhishthira never asked to be preferred. It happened to him anyway.',
  GATE3_DURYODHANA_INTRO_4_BODY: 'It happened to me too, in the other direction. No one wrote songs about that.',
  GATE3_DURYODHANA_INTRO_5_BIG: "I put a woman's honor on a dice table once. I have never once pretended otherwise.",
  GATE3_DURYODHANA_INTRO_5_BODY: 'Shakuni rolled. I gave the order. Both of those are mine to carry.',
  GATE3_DURYODHANA_INTRO_6_BIG: 'Five villages. That was the whole of what they asked for, in the end.',
  GATE3_DURYODHANA_INTRO_6_BODY: "I told Krishna himself I would not give land enough for a needle's point.",
  GATE3_DURYODHANA_INTRO_7_BIG: 'A war swallowed everyone I built this kingdom for.',
  GATE3_DURYODHANA_INTRO_7_BODY: 'My hundred brothers. My son. Karna, who never once asked what my cause was worth.',
  GATE3_DURYODHANA_INTRO_8_BIG: 'I have been down here since the eighteenth day, and the water kept me whole.',
  GATE3_DURYODHANA_INTRO_8_BODY: 'Whole, and hiding. I know exactly what that looks like from outside.',
  GATE3_DURYODHANA_INTRO_9_BIG: "Yudhishthira called me out himself. Said hiding wasn't a kingly death.",
  GATE3_DURYODHANA_INTRO_9_BODY: 'He was right. I came up anyway, because he was right.',
  GATE3_DURYODHANA_INTRO_10_BIG: 'One weapon, one opponent, my own choosing. That was the offer.',
  GATE3_DURYODHANA_INTRO_10_BODY: 'I chose the mace. I chose Bhima. I have wanted this exact match for years.',
  GATE3_DURYODHANA_INTRO_11_BIG: 'He swore an oath over that dice table, to break these legs of mine.',
  GATE3_DURYODHANA_INTRO_11_BODY: 'An oath is a debt like any other. I intend to make him work for collection.',
  GATE3_DURYODHANA_INTRO_12_BIG: 'Balarama taught us both this weapon. He will not enjoy watching either of us use it.',
  GATE3_DURYODHANA_INTRO_12_BODY: 'Watch him leave, if it comes to that. It will tell you which of us he expected to win.',
  GATE3_DURYODHANA_INTRO_13_BIG: 'I hid because the war was already lost. I do not hide from you.',
  GATE3_DURYODHANA_INTRO_13_BODY: 'Whatever happens here happens standing up. Come and make it happen.',

  /** Fires at the enrage HP threshold — no rig-swap for Duryodhana, so this line carries the whole escalation. */
  GATE3_DURYODHANA_ENRAGE_BIG: 'I was the eldest son.',
  GATE3_DURYODHANA_ENRAGE_BODY: 'No dice were needed to take what should have been given.',

  GATE3_DURYODHANA_DEFEAT_1_BIG: '...Below the waist. Even now, that was beneath you.',
  GATE3_DURYODHANA_DEFEAT_1_BODY: 'Gada Yuddha has a rule. Bhima broke it. Krishna signaled him to.',
  GATE3_DURYODHANA_DEFEAT_2_BIG: 'I trained for this exact weapon since I was a boy.',
  GATE3_DURYODHANA_DEFEAT_2_BODY: 'I did not train against a blow no rule permits.',
  GATE3_DURYODHANA_DEFEAT_3_BIG: 'I gave an order at a dice table once, and never took it back.',
  GATE3_DURYODHANA_DEFEAT_3_BODY: "Draupadi's shame is not confused for anyone else's guilt in my head. It is mine.",
  GATE3_DURYODHANA_DEFEAT_4_BIG: 'A hundred brothers. A son. Karna, who died for a cause he never once questioned.',
  GATE3_DURYODHANA_DEFEAT_4_BODY: 'I am the reason that list exists. I have made my peace with owning it.',
  GATE3_DURYODHANA_DEFEAT_5_BIG: 'Yudhishthira gets his kingdom, finally, over a field this empty.',
  GATE3_DURYODHANA_DEFEAT_5_BODY: 'I hope it is worth what it cost him too. I mean that, more than I expected to.',
  GATE3_DURYODHANA_DEFEAT_6_BIG: 'I lived as a king and I die on a battlefield, standing, weapon in hand.',
  GATE3_DURYODHANA_DEFEAT_6_BODY: "Ask any Kshatriya which of those deaths he'd choose. It was never the wrong one.",
  GATE3_DURYODHANA_DEFEAT_7_BIG: 'Tell Krishna I saw exactly what he signaled. I want that written down somewhere.',
  GATE3_DURYODHANA_DEFEAT_7_BODY: "Not for pity. For the record. Some things should just be true, even if they don't matter.",
  GATE3_DURYODHANA_DEFEAT_8_BIG: 'Go on, then. The lake will be still again by morning.',
  GATE3_DURYODHANA_DEFEAT_8_BODY: 'It kept me whole for eighteen days. It will keep my name a while longer than that.',
};
