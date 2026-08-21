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

  // -- gate 6: Panchavati ----------------------------------------------------
  //
  // Gate 6 under the fifteen-gate redesign: Shurpanakha, not the retired
  // Manav-lok/Hakim. Her roster entry (docs/research/villain-roster.md) flags
  // her as the second-highest respectful-treatment risk on the list and
  // leaves exactly one thing open for whoever writes these beats: her
  // *interiority* — the text's own flattening of her into Ravana's sister,
  // the catalyst, a plot device. So her thirteen intro beats are hers rather
  // than her brother's: the forest, the asking, the refusal, the nose. Khara
  // and Ravana arrive late and briefly, and the war she is blamed for
  // starting is named once, by her, as something done in her name rather
  // than at her word.
  //
  // The defeat beats use SORGI's escort framing throughout, never victory
  // framing — an unjudged soul the stopped Wheel is holding, not a monster
  // put down. The mutilation is never staged as something the hunter
  // delivers, witnesses, or approves of; it is already done when she arrives,
  // and the only person who describes it is her.
  GATE6_NAME: 'Panchavati',
  GATE6_WARDEN_TITLE: 'SHURPANAKHA',
  GATE6_PRIEST_TITLE: 'THREAT DETECTED',
  GATE6_PRIEST_BODY: 'Tantrik × 1',
  GATE6_PRIEST_NOTE: 'It cannot harm you at all. It <b>raises</b> what can, and it plants itself to do it.',
  GATE6_CLEARING_TITLE: 'THREAT DETECTED',
  GATE6_CLEARING_BODY: 'Raakchyas × 2  ·  Tantrik × 1',
  GATE6_CLEARING_NOTE: 'The <b>priest</b> deals no damage and raises what does. Choose what you kill first.',
  GATE6_SHURPANAKHA_TITLE: 'GATE WARDEN',

  GATE6_SHURPANAKHA_INTRO_1_BIG: 'This forest was mine before it was anyone\u2019s story.',
  GATE6_SHURPANAKHA_INTRO_1_BODY: 'Panchavati. I walked it alone for years and wanted nothing from it.',
  GATE6_SHURPANAKHA_INTRO_2_BIG: 'Then two brothers built a hut in it, and a woman swept its floor.',
  GATE6_SHURPANAKHA_INTRO_2_BODY: 'I watched them a long while before I said a single word.',
  GATE6_SHURPANAKHA_INTRO_3_BIG: 'I took a shape I thought would be easier to look at.',
  GATE6_SHURPANAKHA_INTRO_3_BODY: 'That was the first thing I did wrong, and I did it to be kind.',
  GATE6_SHURPANAKHA_INTRO_4_BIG: 'I asked the elder one to have me. He said he was already married.',
  GATE6_SHURPANAKHA_INTRO_4_BODY: 'A true answer, gently given. I have never held that part against him.',
  GATE6_SHURPANAKHA_INTRO_5_BIG: 'He sent me to his brother. His brother sent me back, laughing.',
  GATE6_SHURPANAKHA_INTRO_5_BODY: 'Between them I went twice, and was a joke by the second trip.',
  GATE6_SHURPANAKHA_INTRO_6_BIG: 'No is a whole answer. I would have taken no.',
  GATE6_SHURPANAKHA_INTRO_6_BODY: 'What I could not take was being handed back and forth like a bowl.',
  GATE6_SHURPANAKHA_INTRO_7_BIG: 'So I stopped being easy to look at. I went at the woman instead.',
  GATE6_SHURPANAKHA_INTRO_7_BODY: 'That was mine. I have never pretended otherwise, and I would not now.',
  GATE6_SHURPANAKHA_INTRO_8_BIG: 'The younger brother drew his sword and took my nose.',
  GATE6_SHURPANAKHA_INTRO_8_BODY: 'Not my life. My face. He wanted me walking around afterward.',
  GATE6_SHURPANAKHA_INTRO_9_BIG: 'There is a word for a punishment shaped to be seen.',
  GATE6_SHURPANAKHA_INTRO_9_BODY: 'I have had a long time here to think of it and never found one.',
  GATE6_SHURPANAKHA_INTRO_10_BIG: 'I ran to Khara. He died. I ran to Ravana. Everyone died.',
  GATE6_SHURPANAKHA_INTRO_10_BODY: 'They call that war mine. It was fought in my name, not at my word.',
  GATE6_SHURPANAKHA_INTRO_11_BIG: 'The Wheel never came for me. It came for all of them and not for me.',
  GATE6_SHURPANAKHA_INTRO_11_BODY: 'The spark does not get an ending. The spark just keeps burning here.',
  GATE6_SHURPANAKHA_INTRO_12_BIG: 'You will meet me wearing the face I chose. It will not last the fight.',
  GATE6_SHURPANAKHA_INTRO_12_BODY: 'When it goes, look. Everyone else has looked away at that part.',
  GATE6_SHURPANAKHA_INTRO_13_BIG: 'I only asked to be looked at.',
  GATE6_SHURPANAKHA_INTRO_13_BODY: 'Come and do it properly.',

  // The phase-transition line, per docs/SPEC-CAMPAIGN.md's dialogue table.
  // Taraka's own reveal one gate back carries no line at all; this one does,
  // because hers is a disguise she drops rather than a curse landing on her —
  // she is the one narrating what the hunter is now allowed to see.
  GATE6_SHURPANAKHA_PHASE_BIG: 'This is what your prince\u2019s brother left me.',
  GATE6_SHURPANAKHA_PHASE_BODY: 'Look at it properly, this time.',

  GATE6_SHURPANAKHA_DEFEAT_1_BIG: 'You looked. You did not make a face about it.',
  GATE6_SHURPANAKHA_DEFEAT_1_BODY: 'That is the smallest thing anyone has done for me in a very long time.',
  GATE6_SHURPANAKHA_DEFEAT_2_BIG: 'I am not asking you to say I was right. I was not.',
  GATE6_SHURPANAKHA_DEFEAT_2_BODY: 'I went at a woman who had done nothing to me. That stays true.',
  GATE6_SHURPANAKHA_DEFEAT_3_BIG: 'But the sword answered the asking, not the going-at-her.',
  GATE6_SHURPANAKHA_DEFEAT_3_BODY: 'It came out before she was ever in reach. I have gone over it.',
  GATE6_SHURPANAKHA_DEFEAT_4_BIG: 'Khara went to his death for a sister\u2019s ruined face.',
  GATE6_SHURPANAKHA_DEFEAT_4_BODY: 'Ravana went for a slight to the family name. Neither one went for me.',
  GATE6_SHURPANAKHA_DEFEAT_5_BIG: 'Fourteen thousand men, a burned city, a war of the whole world.',
  GATE6_SHURPANAKHA_DEFEAT_5_BODY: 'And not one line about what happened to the woman who started it.',
  GATE6_SHURPANAKHA_DEFEAT_6_BIG: 'You are not here to sentence me. Your Wheel is not even turning.',
  GATE6_SHURPANAKHA_DEFEAT_6_BODY: 'Whatever it decides when it starts, I would rather be moved than kept.',
  GATE6_SHURPANAKHA_DEFEAT_7_BIG: 'Take me out of this forest. I was in it longer than it was mine.',
  GATE6_SHURPANAKHA_DEFEAT_7_BODY: 'Panchavati will not miss me. It stopped being somewhere I lived.',
  GATE6_SHURPANAKHA_DEFEAT_8_BIG: 'Tell it I asked, hunter. That is all I ever did.',
  GATE6_SHURPANAKHA_DEFEAT_8_BODY: 'Let something finally answer.',

  // -- gate 7: Lanka's ramparts ----------------------------------------------
  //
  // Gate 7 under the fifteen-gate redesign: Kumbhakarna, not the retired
  // Asura-lok/Amar-Yoddha. His roster entry (docs/research/villain-roster.md)
  // calls him the best-positioned villain on the whole list for sympathetic
  // writing without any tension against the source — the epic itself frames
  // him as a loyal, decent figure trapped by family duty into a war he
  // argued against. So the risk these beats have to manage is the opposite
  // of Shurpanakha's: not recovering an interiority the text withholds, but
  // not squandering one the text already gives.
  //
  // Two specific ways that could go wrong, and what the beats do instead.
  // First, the sleep boon is a comic detail in most retellings — the slip of
  // the tongue, the drums and elephants used to wake him. It is named here
  // as the thing done *to* him by frightened gods, and the beats never
  // invite the hunter to laugh at it. Second, his loyalty is usually
  // narrated as simplicity. He says plainly that he was not deceived: he
  // knew what his brother was, said so out loud in open court, and went
  // anyway. That is the sentence the whole scene is built to protect.
  //
  // The pre-fight and phase-transition lines are the ones already locked in
  // docs/SPEC-CAMPAIGN.md's dialogue table; the rest is written to arrive at
  // them. The defeat beats use SORGI's escort framing throughout, never
  // victory framing.
  GATE7_NAME: 'Lanka\u2019s Ramparts',
  GATE7_WARDEN_TITLE: 'KUMBHAKARNA',
  GATE7_RAMPARTS_TITLE: 'THREAT DETECTED',
  GATE7_RAMPARTS_BODY: 'Lanka Soldier × 3',
  GATE7_KUMBHAKARNA_TITLE: 'GATE WARDEN',

  GATE7_KUMBHAKARNA_INTRO_1_BIG: 'Ten thousand years of penance, and I asked for the wrong thing.',
  GATE7_KUMBHAKARNA_INTRO_1_BODY: 'One syllable out of place. The gods were listening very carefully that day.',
  GATE7_KUMBHAKARNA_INTRO_2_BIG: 'I meant to ask for the end of the gods. I asked for sleep instead.',
  GATE7_KUMBHAKARNA_INTRO_2_BODY: 'Nobody laughs about it here. That is the only mercy this place has offered.',
  GATE7_KUMBHAKARNA_INTRO_3_BIG: 'Six months down, one day awake. Long enough to eat, never long enough to think.',
  GATE7_KUMBHAKARNA_INTRO_3_BODY: 'You learn to say what matters fast, or you sleep through saying it.',
  GATE7_KUMBHAKARNA_INTRO_4_BIG: 'They woke me with drums, and elephants, and men walking on my chest.',
  GATE7_KUMBHAKARNA_INTRO_4_BODY: 'Lanka was already burning. Nobody wakes a mountain for good news.',
  GATE7_KUMBHAKARNA_INTRO_5_BIG: 'The first thing I did was ask what he had done.',
  GATE7_KUMBHAKARNA_INTRO_5_BODY: 'Not what the enemy had done. What my brother had done. He knew the difference.',
  GATE7_KUMBHAKARNA_INTRO_6_BIG: 'I told him to give her back.',
  GATE7_KUMBHAKARNA_INTRO_6_BODY: 'Out loud, in his own hall, with his own court listening. I said it plainly.',
  GATE7_KUMBHAKARNA_INTRO_7_BIG: 'I said the war was wrong, and that winning it would not make it right.',
  GATE7_KUMBHAKARNA_INTRO_7_BODY: 'He heard every word. He was never stupid. That was never his trouble.',
  GATE7_KUMBHAKARNA_INTRO_8_BIG: 'He refused. I picked up my club and went out to die for him.',
  GATE7_KUMBHAKARNA_INTRO_8_BODY: 'You may call that stupid. I would rather be that than a brother who leaves.',
  GATE7_KUMBHAKARNA_INTRO_9_BIG: 'I was not deceived. That is the part people get wrong about me.',
  GATE7_KUMBHAKARNA_INTRO_9_BODY: 'I knew exactly what he was. I went anyway. Knowing is not the same as leaving.',
  GATE7_KUMBHAKARNA_INTRO_10_BIG: 'They cut the arms off first. Then the legs. Then the rest of it.',
  GATE7_KUMBHAKARNA_INTRO_10_BODY: 'It took a long time. I have had longer to sit with it since.',
  GATE7_KUMBHAKARNA_INTRO_11_BIG: 'The Wheel stopped and left me here, half-asleep, exactly where it found me.',
  GATE7_KUMBHAKARNA_INTRO_11_BODY: 'Whatever this is, it is not rest. I would know rest.',
  GATE7_KUMBHAKARNA_INTRO_12_BIG: 'You will find me slow at first. Do not be flattered by it.',
  GATE7_KUMBHAKARNA_INTRO_12_BODY: 'I am always slow at first. It has never been how the fight finishes.',
  GATE7_KUMBHAKARNA_INTRO_13_BIG: 'Let me sleep. I already told him how this ends.',
  GATE7_KUMBHAKARNA_INTRO_13_BODY: 'You will not listen either. Nobody ever does. Come on, then.',

  // The waking, fired by `Kumbhakarna.takeHit` at his HP threshold through
  // `Game.firePhaseBeat` — the third consumer of that machinery, after
  // Taraka's wordless curse-reveal and Shurpanakha's reveal. His carries the
  // line docs/SPEC-CAMPAIGN.md already locked, and it is the sentence his
  // respectful-treatment note asked for a mechanical home for: counsel,
  // refusal, and the choice made anyway, said at the moment the fight gets
  // harder rather than in a name card before it starts.
  GATE7_KUMBHAKARNA_PHASE_BIG: 'I said make peace. He is my brother. I fight anyway.',
  GATE7_KUMBHAKARNA_PHASE_BODY: 'Now I am awake. You will like me better asleep.',

  GATE7_KUMBHAKARNA_DEFEAT_1_BIG: 'There. That is the rest of it, finally.',
  GATE7_KUMBHAKARNA_DEFEAT_1_BODY: 'Not the sleep I asked for. Close enough that I will take it.',
  GATE7_KUMBHAKARNA_DEFEAT_2_BIG: 'You fought a man who told his king the truth and then died for the lie.',
  GATE7_KUMBHAKARNA_DEFEAT_2_BODY: 'Carry both halves out. Neither one alone is me.',
  GATE7_KUMBHAKARNA_DEFEAT_3_BIG: 'I do not want him punished. I want him to have listened.',
  GATE7_KUMBHAKARNA_DEFEAT_3_BODY: 'Those are different wishes. Only one of them was ever available.',
  GATE7_KUMBHAKARNA_DEFEAT_4_BIG: 'Tell them I argued. Not that I was right — that I argued.',
  GATE7_KUMBHAKARNA_DEFEAT_4_BODY: 'Everyone remembers the size of me. Nobody remembers the sentence.',
  GATE7_KUMBHAKARNA_DEFEAT_5_BIG: 'Loyalty is not a virtue by itself. I found that out very late.',
  GATE7_KUMBHAKARNA_DEFEAT_5_BODY: 'It is only as good as the man you spend it on.',
  GATE7_KUMBHAKARNA_DEFEAT_6_BIG: 'If the Wheel turns again, do not put me somewhere quiet.',
  GATE7_KUMBHAKARNA_DEFEAT_6_BODY: 'I have had enough quiet. Put me somewhere I would be awake for.',
  GATE7_KUMBHAKARNA_DEFEAT_7_BIG: 'You are smaller than everything else that has ever tried.',
  GATE7_KUMBHAKARNA_DEFEAT_7_BODY: 'You also stayed to hear the whole of it. Nobody else did that either.',
  GATE7_KUMBHAKARNA_DEFEAT_8_BIG: 'Go on, hunter. Wake the next one.',
  GATE7_KUMBHAKARNA_DEFEAT_8_BODY: 'And if it argues with you first — let it finish arguing.',

  // -- gate 8: Lanka’s Throne ----------------------------------------------
  // Gate 8 — Ravana, and the hardest respectful-treatment note on the roster
  // to find a home for.
  //
  // Two halves, and only one of them is answerable. The first is that Ravana
  // is not a simple villain anywhere in the tradition: a Brahmin, a Vedic
  // scholar, a devotee of Shiva credited with the Shiva Tandava Stotra, burned
  // in effigy in some places and garlanded in others (Ravana Purnima). The
  // beats below let him make his own case in his own voice — the palette
  // already does the other half of that job, per `lankaSkin` in
  // `palette.js` — and they never let the scene settle into "evil demon king".
  //
  // The second half is that this fight sits awkwardly against its source and
  // cannot be made to stop: the boon's loophole exists *because* Ravana
  // considered a mortal beneath asking protection from, and SOMBRA's hunter is
  // explicitly not Rama. His roster entry is equally explicit that no win
  // condition resolves this and nothing should try — no invented
  // "the hunter is secretly not human" escape hatch, since nothing in this
  // game's fiction earns one. So it is named instead, twice, and left open:
  // once at the threshold (`GATE8_RAVANA_PHASE_*`, fired by `Ravana._enrage`)
  // and once in the defeat beats, where he says out loud that whatever ended
  // him was not the ending he was written.
  //
  // The pre-fight and phase-transition lines are the ones already locked in
  // docs/SPEC-CAMPAIGN.md's dialogue table; the rest is written to arrive at
  // them. The defeat beats use SORGI's escort framing throughout, never
  // victory framing.
  GATE8_NAME: 'Lanka\u2019s Throne',
  GATE8_WARDEN_TITLE: 'RAVANA',
  GATE8_BATTLEMENTS_TITLE: 'THREAT DETECTED',
  GATE8_BATTLEMENTS_BODY: 'Lanka Soldier \u00d7 2  \u00b7  Royal Guard \u00d7 1',
  GATE8_INNER_GATE_TITLE: 'THREAT DETECTED',
  GATE8_INNER_GATE_BODY: 'Royal Guard \u00d7 2  \u00b7  Lanka Soldier \u00d7 2',
  GATE8_RAVANA_TITLE: 'GATE BOSS',

  GATE8_RAVANA_INTRO_1_BIG: 'I have read every Veda. I wrote hymns Shiva stopped to listen to.',
  GATE8_RAVANA_INTRO_1_BODY: 'Nobody paints that on the effigies.',
  GATE8_RAVANA_INTRO_2_BIG: 'Ten thousand years of penance. A head into the fire every thousand.',
  GATE8_RAVANA_INTRO_2_BODY: 'Brahma caught my hand at the tenth. He was impressed. So was I.',
  GATE8_RAVANA_INTRO_3_BIG: 'I asked to be safe from gods, gandharvas, yakshas, rakshasas.',
  GATE8_RAVANA_INTRO_3_BODY: 'Everything that could conceivably matter. I listed them all out.',
  GATE8_RAVANA_INTRO_4_BIG: 'I did not list men.',
  GATE8_RAVANA_INTRO_4_BODY: 'Why would I? I had seen men. I had ruled better than all of them.',
  GATE8_RAVANA_INTRO_5_BIG: 'Lanka was gold, and I built it. Every court in three worlds envied it.',
  GATE8_RAVANA_INTRO_5_BODY: 'Even the people who tell my story do not dispute that part.',
  GATE8_RAVANA_INTRO_6_BIG: 'Then my sister came home cut open, and asked what I intended to do.',
  GATE8_RAVANA_INTRO_6_BODY: 'You have met her. You know what she was asking me for.',
  GATE8_RAVANA_INTRO_7_BIG: 'I took his wife. I will not pretend that was for my sister.',
  GATE8_RAVANA_INTRO_7_BODY: 'It was for me. I have had a long time to be sure of it.',
  GATE8_RAVANA_INTRO_8_BIG: 'I never touched her. That is the one restraint I kept.',
  GATE8_RAVANA_INTRO_8_BODY: 'It did not make me innocent. I can hold both of those now.',
  GATE8_RAVANA_INTRO_9_BIG: 'My brother told me to give her back. In open court, in front of everyone.',
  GATE8_RAVANA_INTRO_9_BODY: 'You fought him at the ramparts. He went out for me anyway.',
  GATE8_RAVANA_INTRO_10_BIG: 'My other brother walked out and joined them. I let him go.',
  GATE8_RAVANA_INTRO_10_BODY: 'I still cannot say whether that was mercy or contempt.',
  GATE8_RAVANA_INTRO_11_BIG: 'They crossed the water on a bridge. A bridge, for me.',
  GATE8_RAVANA_INTRO_11_BODY: 'Nothing smaller than an ocean had ever been in my way before.',
  GATE8_RAVANA_INTRO_12_BIG: 'The Wheel stopped and left me holding a city that had already fallen.',
  GATE8_RAVANA_INTRO_12_BODY: 'Everything stops eventually, they tell me. Nothing has stopped me yet.',
  GATE8_RAVANA_INTRO_13_BIG: 'Ten heads bowed to no one. Explain to me what you are.',
  GATE8_RAVANA_INTRO_13_BODY: 'Slowly. I would like to understand this before it finishes.',

  // The threshold, fired by `Ravana._enrage` in `boss.js` through
  // `Game.firePhaseBeat` — the fourth consumer of that machinery and the first
  // that is not a Warden, which is the evidence it was never tier-locked.
  // The locked line is the moment he reads his own boon back and finds the
  // hole he left in it; the body is where the harder half of his note is
  // named and deliberately not closed.
  GATE8_RAVANA_PHASE_BIG: 'A man. He sent a man.',
  GATE8_RAVANA_PHASE_BODY: 'Not even the one I was owed. Something wearing the shape. The terms do not care.',

  GATE8_RAVANA_DEFEAT_1_BIG: 'There. Down to the last of the heads.',
  GATE8_RAVANA_DEFEAT_1_BODY: 'It took an ocean and an avatar, the first time.',
  GATE8_RAVANA_DEFEAT_2_BIG: 'You are not him. I would like that said out loud.',
  GATE8_RAVANA_DEFEAT_2_BODY: 'Whatever ended me here, it was not the ending I was written.',
  GATE8_RAVANA_DEFEAT_3_BIG: 'That is the part I cannot make sit right, and I have tried.',
  GATE8_RAVANA_DEFEAT_3_BODY: 'Leave it where it is. Not everything closes.',
  GATE8_RAVANA_DEFEAT_4_BIG: 'Do not simplify me on the way out.',
  GATE8_RAVANA_DEFEAT_4_BODY: 'Some places burn me every year. Some lay flowers. Both are reading one life.',
  GATE8_RAVANA_DEFEAT_5_BIG: 'Tell them I was a scholar before I was a thief.',
  GATE8_RAVANA_DEFEAT_5_BODY: 'And that being the first never once stopped me being the second.',
  GATE8_RAVANA_DEFEAT_6_BIG: 'The boon was not the mistake. The contempt was.',
  GATE8_RAVANA_DEFEAT_6_BODY: 'I left one door open because I could not imagine anyone worth shutting it against.',
  GATE8_RAVANA_DEFEAT_7_BIG: 'My sister is somewhere behind you. So is my brother.',
  GATE8_RAVANA_DEFEAT_7_BODY: 'Neither of them was here for their own reasons. Carry that out with the rest.',
  GATE8_RAVANA_DEFEAT_8_BIG: 'Go on. The throne is empty and the Wheel is still not turning.',
  GATE8_RAVANA_DEFEAT_8_BODY: 'Whatever comes next was never going to be me.',

  // -- gate 9: Mathura's Akhada ----------------------------------------------
  // Gate 9 — Kamsa, and the one Warden on the roster whose escalation carries
  // no dialogue-beat hook at all. His own respectful-treatment note declines
  // one outright: no version of a line about the infanticide backstory avoids
  // staging it as spectacle, so every beat below stays on the prophecy and
  // his fear of it — never on the children — per the handoff's explicit
  // instruction. The pre-fight line is the one already locked in
  // `docs/SPEC-CAMPAIGN.md`'s dialogue table; the rest is written to arrive
  // at it. No phase beat: his entry's kit carries no phase-transition, and
  // the ordinary enrage tightens the mace and the chain-lash alone.
  GATE9_NAME: 'Mathura’s Akhada',
  GATE9_WARDEN_TITLE: 'KAMSA',
  GATE9_PIT_TITLE: 'THREAT DETECTED',
  GATE9_PIT_BODY: 'Mathura Wrestler × 2',
  GATE9_KAMSA_TITLE: 'GATE WARDEN',

  GATE9_KAMSA_INTRO_1_BIG: 'A voice named my death before it ever named a face.',
  GATE9_KAMSA_INTRO_1_BODY: 'Eighth child, it said. I have counted every year against that number since.',
  GATE9_KAMSA_INTRO_2_BIG: 'I built walls around anyone the prophecy could still be hiding inside.',
  GATE9_KAMSA_INTRO_2_BODY: 'Call it a cage if that is easier for you. I called it staying alive.',
  GATE9_KAMSA_INTRO_3_BIG: 'Every year I did not die, I decided the voice had been wrong.',
  GATE9_KAMSA_INTRO_3_BODY: 'Every year after that, it was still whispering, waiting on one more birth.',
  GATE9_KAMSA_INTRO_4_BIG: 'A wrestling ring is an honest weapon. Nobody calls a champion a coward.',
  GATE9_KAMSA_INTRO_4_BODY: 'I staged the match myself. I wanted to watch it happen, not hear about it after.',
  GATE9_KAMSA_INTRO_5_BIG: 'My own champions went down first. That should have told me something.',
  GATE9_KAMSA_INTRO_5_BODY: 'It told me to come down off the throne instead.',
  GATE9_KAMSA_INTRO_6_BIG: 'Mathura is mine. Every stone of it answers to a fear I never asked to carry.',
  GATE9_KAMSA_INTRO_6_BODY: 'You would be afraid too, with a sky that keeps a ledger on you.',
  GATE9_KAMSA_INTRO_7_BIG: 'I have outlived eighteen years of a countdown nobody else could hear.',
  GATE9_KAMSA_INTRO_7_BODY: 'You want to know what that does to a man. Stand still and find out.',
  GATE9_KAMSA_INTRO_8_BIG: 'The voice never said how. Only that it would be him, and it would be soon.',
  GATE9_KAMSA_INTRO_8_BODY: 'I have spent a reign trying to out-plan a sentence with no timetable.',
  GATE9_KAMSA_INTRO_9_BIG: 'Every guard I hired was hired against one child I have never once met.',
  GATE9_KAMSA_INTRO_9_BODY: 'That is not a kingdom. I know that. I built it anyway.',
  GATE9_KAMSA_INTRO_10_BIG: 'You are not the voice’s promise. You are not even from here.',
  GATE9_KAMSA_INTRO_10_BODY: 'But you are standing where the promise said someone would, and that is close enough to answer.',
  GATE9_KAMSA_INTRO_11_BIG: 'A throne built on a countdown is still a throne.',
  GATE9_KAMSA_INTRO_11_BODY: 'I intend to sit it until the number actually arrives.',
  GATE9_KAMSA_INTRO_12_BIG: 'I do not need you to believe the prophecy. I need it wrong today.',
  GATE9_KAMSA_INTRO_12_BODY: 'Every day it stays wrong is a day I already won.',
  GATE9_KAMSA_INTRO_13_BIG: 'A voice told me my death has a name. I have never stopped listening for it.',
  GATE9_KAMSA_INTRO_13_BODY: 'Let’s see whether it finally learned to pick the right man.',

  GATE9_KAMSA_DEFEAT_1_BIG: 'There it is. Eighteen years, and it was never even you.',
  GATE9_KAMSA_DEFEAT_1_BODY: 'Some other door was supposed to open. I never got to see which one.',
  GATE9_KAMSA_DEFEAT_2_BIG: 'I do not know if that makes this worse, or almost a mercy.',
  GATE9_KAMSA_DEFEAT_2_BODY: 'A stranger closing an account that was never addressed to them.',
  GATE9_KAMSA_DEFEAT_3_BIG: 'I will not pretend the throne was clean under me.',
  GATE9_KAMSA_DEFEAT_3_BODY: 'I know exactly what it cost the people who had to live under the fear too.',
  GATE9_KAMSA_DEFEAT_4_BIG: 'I spent a reign guarding against one voice, and never once against my own hand in it.',
  GATE9_KAMSA_DEFEAT_4_BODY: 'That part was mine. Nobody prophesied that half.',
  GATE9_KAMSA_DEFEAT_5_BIG: 'Take the crown apart if you want it. It was always only iron.',
  GATE9_KAMSA_DEFEAT_5_BODY: 'I wore it like it meant something. It never once did.',
  GATE9_KAMSA_DEFEAT_6_BIG: 'Tell Mathura the countdown is finished, one way or another.',
  GATE9_KAMSA_DEFEAT_6_BODY: 'Whatever sits that throne next will not be afraid of a voice in the sky.',
  GATE9_KAMSA_DEFEAT_7_BIG: 'The Wheel was never going to send the one the prophecy actually named.',
  GATE9_KAMSA_DEFEAT_7_BODY: 'I understand that now, for whatever that understanding is still worth to me.',
  GATE9_KAMSA_DEFEAT_8_BIG: 'Go on, hunter. I have no years left to spend listening for a face.',
  GATE9_KAMSA_DEFEAT_8_BODY: 'Let something else finally arrive on time.',

  // -- gate 10: Gokul, Asleep --------------------------------------------------
  GATE10_NAME: 'Gokul, Asleep',
  GATE10_WARDEN_TITLE: 'PUTANA',
  GATE10_PUTANA_TITLE: 'GATE WARDEN',

  GATE10_PUTANA_INTRO_1_BIG: 'You look like you could use a mother’s welcome.',
  GATE10_PUTANA_INTRO_1_BODY: 'That line has never once needed to be a lie to work.',
  GATE10_PUTANA_INTRO_2_BIG: 'Kamsa asked for a child’s death. I said yes before he finished the sentence.',
  GATE10_PUTANA_INTRO_2_BODY: 'An assassin rarely gets to pick her own errand. I picked this one.',
  GATE10_PUTANA_INTRO_3_BIG: 'Every door in Gokul opened for a stranger who smiled first.',
  GATE10_PUTANA_INTRO_3_BODY: 'Nobody guards against kindness. That was the whole of my plan.',
  GATE10_PUTANA_INTRO_4_BIG: 'I had done this before, in other bodies, in other villages.',
  GATE10_PUTANA_INTRO_4_BODY: 'It had always gone exactly the way I meant it to.',
  GATE10_PUTANA_INTRO_5_BIG: 'He looked at me before he ever reached for anything.',
  GATE10_PUTANA_INTRO_5_BODY: 'Not a baby’s blank stare. Something behind it, already counting me.',
  GATE10_PUTANA_INTRO_6_BIG: 'The poison went where I sent it.',
  GATE10_PUTANA_INTRO_6_BODY: 'It came back the other way, and took the rest of me along.',
  GATE10_PUTANA_INTRO_7_BIG: 'I felt every year of what I was leave through the door I came in by.',
  GATE10_PUTANA_INTRO_7_BODY: 'It does not go quietly. It never has, in any shape I wore.',
  GATE10_PUTANA_INTRO_8_BIG: 'The old telling says a demoness died that night.',
  GATE10_PUTANA_INTRO_8_BODY: 'It also says something was let go, not just put down.',
  GATE10_PUTANA_INTRO_9_BIG: 'I came to end a child and left carrying a release I never once earned.',
  GATE10_PUTANA_INTRO_9_BODY: 'It arrived anyway. I still have not finished deciding what to do with that.',
  GATE10_PUTANA_INTRO_10_BIG: 'Kamsa never once asked what an errand cost the one he sent to run it.',
  GATE10_PUTANA_INTRO_10_BODY: 'I stopped expecting him to, somewhere near the end of running it.',
  GATE10_PUTANA_INTRO_11_BIG: 'You will meet the welcoming shape first. That was never quite a lie.',
  GATE10_PUTANA_INTRO_11_BODY: 'The shape underneath is older and hungrier, and it is mine regardless.',
  GATE10_PUTANA_INTRO_12_BIG: 'I am not asking you to forgive the errand.',
  GATE10_PUTANA_INTRO_12_BODY: 'I am asking you to notice the errand and I stopped being the same thing.',
  GATE10_PUTANA_INTRO_13_BIG: 'Come in, then. I have opened this door for strangers a very long time.',
  GATE10_PUTANA_INTRO_13_BODY: 'Let this be the once it finally means something other than harm.',

  GATE10_PUTANA_PHASE_BIG: 'It burns worse leaving than it ever did going in.',
  GATE10_PUTANA_PHASE_BODY: 'Look at what the poison actually made of me, under the welcome.',

  GATE10_PUTANA_DEFEAT_1_BIG: 'You did not flinch from the shape under the welcome.',
  GATE10_PUTANA_DEFEAT_1_BODY: 'Small mercy. Most of Gokul never had to look at it at all.',
  GATE10_PUTANA_DEFEAT_2_BIG: 'I am not asking to be called anything but what I was.',
  GATE10_PUTANA_DEFEAT_2_BODY: 'A poison sent by a frightened king, wearing a mother’s face to deliver it.',
  GATE10_PUTANA_DEFEAT_3_BIG: 'But something let go when the poison finally left, going the other way.',
  GATE10_PUTANA_DEFEAT_3_BODY: 'The old telling calls that a kind of release. I believe it, mostly.',
  GATE10_PUTANA_DEFEAT_4_BIG: 'I do not think I earned it. I have had a long time to sit with that.',
  GATE10_PUTANA_DEFEAT_4_BODY: 'It came anyway. Nobody ever explained why, and I stopped asking.',
  GATE10_PUTANA_DEFEAT_5_BIG: 'Kamsa is still counting years against a prophecy somewhere behind you.',
  GATE10_PUTANA_DEFEAT_5_BODY: 'Tell him the assassin he sent never made it back to report.',
  GATE10_PUTANA_DEFEAT_6_BIG: 'Your Wheel is not turning yet, hunter. I am not asking it to judge me kindly.',
  GATE10_PUTANA_DEFEAT_6_BODY: 'Only to finally turn, for me and for whoever else is waiting behind me.',
  GATE10_PUTANA_DEFEAT_7_BIG: 'Take me out of that house. I was only ever passing through it.',
  GATE10_PUTANA_DEFEAT_7_BODY: 'Gokul will remember a stranger who came once, and nothing further than that.',
  GATE10_PUTANA_DEFEAT_8_BIG: 'Let the door finally close behind me the way it should have that night.',
  GATE10_PUTANA_DEFEAT_8_BODY: 'That is all I am asking of you, hunter. Go on.',

  // -- gate 11: Pragjyotishapura, Narakasura ---------------------------------
  //
  // His research entry asks the telling to end on the liberation and to leave
  // out the epilogue in which the freed women are married off — a real part of
  // the source, but one pop adaptations routinely play as a punchline. The
  // captives here are people the fortress is holding, and the gate's story
  // closes on them being let go. Nothing below refers to them as a prize.
  GATE11_GUARD_TOAST: 'Fortress guard — the walls answer to him.',
  GATE11_GARRISON_TOAST: 'The garrison holds the hall mouth.',
  GATE11_NAME: 'Pragjyotishapura',
  GATE11_WARDEN_TITLE: 'NARAKASURA',
  GATE11_NARAKASURA_TITLE: 'GATE WARDEN',

  GATE11_NARAKASURA_INTRO_1_BIG: 'Sixteen thousand voices, and every one of them mine to keep.',
  GATE11_NARAKASURA_INTRO_1_BODY: 'That is not a boast. It is an inventory, and I have never once miscounted it.',
  GATE11_NARAKASURA_INTRO_2_BIG: 'My mother is the earth. Every wall here came up when I asked it to.',
  GATE11_NARAKASURA_INTRO_2_BODY: 'Nothing in Pragjyotishapura was built. It was told to stand, and it stood.',
  GATE11_NARAKASURA_INTRO_3_BIG: 'I took Indra\u2019s seat and I took Aditi\u2019s earrings off her head.',
  GATE11_NARAKASURA_INTRO_3_BODY: 'The gods keep a long list of what is theirs. I have only ever kept a longer one.',
  GATE11_NARAKASURA_INTRO_4_BIG: 'A king is measured by what he can hold. That is the whole arithmetic.',
  GATE11_NARAKASURA_INTRO_4_BODY: 'I learned it early, and no sum has ever disagreed with me.',
  GATE11_NARAKASURA_INTRO_5_BIG: 'They were not prisoners. They were held. There is a difference in the ledger.',
  GATE11_NARAKASURA_INTRO_5_BODY: 'I said that often enough that it started sounding true from the inside.',
  GATE11_NARAKASURA_INTRO_6_BIG: 'Every cell here has a door, and every door has my hand on it.',
  GATE11_NARAKASURA_INTRO_6_BODY: 'I never turned a key. Stone does what the earth\u2019s son asks.',
  GATE11_NARAKASURA_INTRO_7_BIG: 'You will hear them through the walls on your way up. Everyone does.',
  GATE11_NARAKASURA_INTRO_7_BODY: 'I stopped hearing them somewhere in the second century of holding the count.',
  GATE11_NARAKASURA_INTRO_8_BIG: 'The end came on wings, with my own mother\u2019s face riding beside it.',
  GATE11_NARAKASURA_INTRO_8_BODY: 'She had every right. I had spent her name on every wall I raised.',
  GATE11_NARAKASURA_INTRO_9_BIG: 'They did not burn Pragjyotishapura when it was over.',
  GATE11_NARAKASURA_INTRO_9_BODY: 'They opened it. Every door at once. That is what I remember, not the blow.',
  GATE11_NARAKASURA_INTRO_10_BIG: 'My son kept the throne. They handed it to him over my body.',
  GATE11_NARAKASURA_INTRO_10_BODY: 'A kingdom taken and given back in the same hour. I still do not understand it.',
  GATE11_NARAKASURA_INTRO_11_BIG: 'Your Wheel has stopped, and the doors here have stayed shut with it.',
  GATE11_NARAKASURA_INTRO_11_BODY: 'Sixteen thousand held in a fortress that no longer has a reason to hold them.',
  GATE11_NARAKASURA_INTRO_12_BIG: 'Come up through the cells, hunter. Look at the count on your way.',
  GATE11_NARAKASURA_INTRO_12_BODY: 'Then take the spear off me, and find out what this place sounds like open.',

  GATE11_NARAKASURA_PHASE_BIG: 'The walls are already cracking. You\u2019ve just come to watch them fall.',
  GATE11_NARAKASURA_PHASE_BODY: 'Every door in this fortress is stone, and the stone is finally letting go.',

  GATE11_NARAKASURA_DEFEAT_1_BIG: 'Listen. The walls have stopped holding their breath.',
  GATE11_NARAKASURA_DEFEAT_1_BODY: 'That sound is every cell door in Pragjyotishapura giving up at once.',
  GATE11_NARAKASURA_DEFEAT_2_BIG: 'I held sixteen thousand people because I could, and I called it keeping.',
  GATE11_NARAKASURA_DEFEAT_2_BODY: 'No god had to explain the word back to me. I always knew what it was.',
  GATE11_NARAKASURA_DEFEAT_3_BIG: 'Take the earrings. They were never mine and the gold always knew it.',
  GATE11_NARAKASURA_DEFEAT_3_BODY: 'Aditi will want them back on her own head. See that they get there.',
  GATE11_NARAKASURA_DEFEAT_4_BIG: 'Do not put a new lock on this place when I am gone.',
  GATE11_NARAKASURA_DEFEAT_4_BODY: 'It has been a fist for long enough. Let it be an open hand instead.',
  GATE11_NARAKASURA_DEFEAT_5_BIG: 'They will walk out of here on their own feet, going wherever they choose.',
  GATE11_NARAKASURA_DEFEAT_5_BODY: 'Not to anyone. Not owed to anyone. That part is theirs and no one else\u2019s.',
  GATE11_NARAKASURA_DEFEAT_6_BIG: 'Every year I counted them, and not once did I ask a single name.',
  GATE11_NARAKASURA_DEFEAT_6_BODY: 'Sixteen thousand. I knew the number perfectly and nothing else at all.',
  GATE11_NARAKASURA_DEFEAT_7_BIG: 'The doors are open, hunter. Go and let the rest of them out.',
  GATE11_NARAKASURA_DEFEAT_7_BODY: 'Then let your Wheel turn, and put me wherever a man like me is put.',

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
  GATE3_DURYODHANA_INTRO_12_BIG: 'Balarama taught us both this weapon. He will not enjoy watching us use it.',
  GATE3_DURYODHANA_INTRO_12_BODY: 'Watch him leave, if it comes to that. It tells you which of us he expected.',
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
  GATE3_DURYODHANA_DEFEAT_7_BODY: "Not for pity. For the record. Some things should be true, even if they don't matter.",
  GATE3_DURYODHANA_DEFEAT_8_BIG: 'Go on, then. The lake will be still again by morning.',
  GATE3_DURYODHANA_DEFEAT_8_BODY: 'It kept me whole for eighteen days. It will keep my name a while longer than that.',

  // Gate 3 itself, now wired: the descent to Kurukshetra's lake, then the two
  // encounters before Duryodhana — `Charger` reskinned as charging cavalry,
  // `Kawach` as an infantry line, per `docs/SPEC-CAMPAIGN.md`'s gate-03 row.
  // New keys rather than reused ones: the old `GATE3_*` block above this one
  // is Naraka/Goru-Mukh, the pre-redesign gate 3, and stays as-authored
  // rather than overwritten now that this gate has actually moved on.
  GATE3_DURYODHANA_NAME: 'Kurukshetra',
  GATE3_CAVALRY_TITLE: 'THREAT DETECTED',
  GATE3_CAVALRY_BODY: 'Charger × 1',
  GATE3_INFANTRY_TITLE: 'THREAT DETECTED',
  GATE3_INFANTRY_BODY: 'Kawach × 1',
};
