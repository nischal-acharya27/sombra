// Every gate the campaign contains, in the order they are played.
//
// One list, so that anything which must hold for *all* gates — the tier-1
// static checks, and later the campaign playthrough and whatever the save file
// records — has somewhere to iterate rather than a hardcoded name. A gate that
// is authored but not listed here is a gate nothing checks.

import { GATE_1 } from './gate1.js';

export const GATES = [GATE_1];
