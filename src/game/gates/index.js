// Every gate the campaign contains, in the order they are played.
//
// One list, so that anything which must hold for *all* gates — the tier-1
// static checks, and later the campaign playthrough and whatever the save file
// records — has somewhere to iterate rather than a hardcoded name. A gate that
// is authored but not listed here is a gate nothing checks.

import { GATE_1 } from './gate1.js';
import { GATE_2 } from './gate2.js';
import { GATE_3 } from './gate3.js';
import { GATE_4 } from './gate4.js';
import { GATE_5 } from './gate5.js';
import { GATE_6 } from './gate6.js';
import { GATE_7 } from './gate7.js';
import { GATE_8 } from './gate8.js';
import { GATE_9 } from './gate9.js';

export const GATES = [GATE_1, GATE_2, GATE_3, GATE_4, GATE_5, GATE_6, GATE_7, GATE_8, GATE_9];
