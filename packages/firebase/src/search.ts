// Free-text search over a session's car rows — the "which car am I standing
// next to" lookup a worker does on the ground, and the same lookup the admin
// board needs. Shared here so the worker dashboard and the Live Cleaning
// board can never drift into answering the same query differently.

/** The subset of a car row this search reads. Both CleaningSessionCar-derived
 *  shapes (WorkerTodoCar, the admin board's CarListItem) satisfy it. */
export interface SearchableCar {
  customerName?: string;
  customerPhone?: string;
  unitNumber?: string;
  parkingNumber?: string;
  parkingLevel?: string;
  carPlate?: string;
  carMake?: string;
  carModel?: string;
  tower?: string;
  societyName?: string;
}

/** Lowercase, punctuation collapsed to single spaces — "B-1204" → "b 1204". */
function normalise(value: unknown): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Lowercase, punctuation dropped entirely — "DL 01 AB 1234" → "dl01ab1234",
 *  so a plate typed without spaces still matches one stored with them. */
function squash(value: unknown): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Parking levels are free-form strings (see ParkingLevel in types.ts), so a
// worker's shorthand — "b2" for "Basement 2", "g" for "Ground" — has to be
// resolved rather than compared literally.

/** Canonical form of a *stored* level label. Always returns something; falls
 *  back to the squashed label for towers using labels we don't recognise. */
function canonicalLevelLabel(label: string): string {
  const s = normalise(label);
  if (!s) return '';
  let m = s.match(/^(?:b|bs|bsmt|base|basement)\s*(\d*)$/);
  if (m) return `basement${m[1] || '1'}`;
  if (/^(?:g|gf|grd|ground(?:\s*floor)?|surface)$/.test(s)) return 'ground';
  m = s.match(/^(?:p|pod|podium)\s*(\d*)$/);
  if (m) return `podium${m[1] || '1'}`;
  m = s.match(/^(?:l|lvl|level)\s*(\d+)$/);
  if (m) return `level${m[1]}`;
  return squash(s);
}

/** Canonical form of a *query* token, or null when the token isn't a level
 *  reference at all. Stricter than canonicalLevelLabel on purpose: a bare "b"
 *  stays a plain text token (it's a tower name far more often than it is a
 *  basement), while the spelled-out "basement" canonicalises to a prefix that
 *  matches every basement level. */
function canonicalLevelToken(token: string): string | null {
  const s = normalise(token);
  if (!s) return null;
  let m = s.match(/^(?:b|bs|bsmt|base|basement)\s*(\d+)$/);
  if (m) return `basement${m[1]}`;
  if (/^(?:bsmt|base|basement)$/.test(s)) return 'basement';
  if (/^(?:g|gf|grd|ground(?:\s*floor)?)$/.test(s)) return 'ground';
  m = s.match(/^(?:pod|podium)\s*(\d+)$/);
  if (m) return `podium${m[1]}`;
  m = s.match(/^(?:lvl|level)\s*(\d+)$/);
  if (m) return `level${m[1]}`;
  return null;
}

interface Haystack {
  text: string;
  words: Set<string>;
  level: string;
}

function buildHaystack(car: SearchableCar): Haystack {
  const spaced = [
    car.customerName, car.customerPhone, car.unitNumber, car.parkingNumber,
    car.parkingLevel, car.carPlate, car.carMake, car.carModel, car.tower, car.societyName,
  ].map(normalise).filter(Boolean).join(' ');

  // Squashed copies so "dl01ab1234", "towerb2" and "p42" match values stored
  // with spaces or hyphens.
  const squashed = [car.carPlate, car.customerPhone, car.unitNumber, car.parkingNumber, car.tower]
    .map(squash).filter(Boolean).join(' ');

  // Both forms count as whole "words" so that a flat stored as "B-304" is hit
  // by "b304" and by "b 304" alike — matchToken restricts short and
  // level-shaped tokens to whole-word hits, and either spelling is one.
  const words = new Set([...spaced.split(' '), ...squashed.split(' ')].filter(Boolean));

  return {
    text:  `${spaced} ${squashed}`,
    words,
    level: canonicalLevelLabel(car.parkingLevel ?? ''),
  };
}

interface SearchToken {
  text: string;
  level: string | null;
}

function matchToken(token: SearchToken, hay: Haystack): boolean {
  if (token.level) {
    if (hay.level && (hay.level === token.level || hay.level.startsWith(token.level))) return true;
    // A level-shaped token falls back to whole-field text only — never a
    // substring. "b1" must not match the plate DL 01 A[B1]234, but must still
    // match a tower actually named B1.
    return hay.words.has(token.text);
  }
  // Likewise a one-character token has to hit a whole field — as a substring
  // it would match almost every row and make the search useless.
  if (token.text.length === 1) return hay.words.has(token.text);
  return hay.text.includes(token.text);
}

// Level words people type with a space — "basement 2", "b 2", "level 3" — are
// one term, not two, so they're merged before matching. Without this the
// trailing number would be searched on its own across every field.
const LEVEL_WORD = /^(?:b|bs|bsmt|base|basement|pod|podium|lvl|level)$/;

function mergeLevelPhrases(tokens: string[]): string[] {
  const merged: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (LEVEL_WORD.test(tokens[i]) && /^\d+$/.test(tokens[i + 1] ?? '')) {
      merged.push(tokens[i] + tokens[i + 1]);
      i++;
    } else {
      merged.push(tokens[i]);
    }
  }
  return merged;
}

export type CarSearchMatcher = (car: SearchableCar) => boolean;

/**
 * Compiles a worker's free-text query into a per-car predicate, or null when
 * the query is empty (callers skip filtering entirely rather than matching
 * everything).
 *
 * Grammar, in the shape people actually type it:
 *   - space-separated terms are ANDed — "b2 1204" is flat 1204 in basement 2
 *   - comma-separated groups are ORed — "b1, b2" is either basement
 *   - "b2" / "basement 2" / "g" / "ground" resolve against the car's parking
 *     level; everything else is a substring match across flat, tower, society,
 *     plate, make/model, parking slot, customer name and phone
 */
export function buildCarSearchMatcher(rawQuery: string): CarSearchMatcher | null {
  const groups = String(rawQuery ?? '')
    .split(',')
    .map(group => mergeLevelPhrases(normalise(group).split(' ').filter(Boolean)))
    .filter(tokens => tokens.length > 0)
    .map(tokens => tokens.map<SearchToken>(text => ({ text, level: canonicalLevelToken(text) })));

  if (groups.length === 0) return null;

  return (car: SearchableCar) => {
    const hay = buildHaystack(car);
    return groups.some(tokens => tokens.every(token => matchToken(token, hay)));
  };
}
