/* A pet's level grows with time in the cabinet and with attention.
   XP = 10 per day since it was added + 1 per click. Each level needs more
   XP than the last (level L starts at 15·(L−1)² XP): a quiet month-old pet
   sits around level 5, a much-clicked one climbs faster. */

const XP_PER_DAY = 10;
const XP_PER_TAP = 1;
const LEVEL_STEP = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

const xpForLevel = (level: number) => LEVEL_STEP * (level - 1) ** 2;

export function petLevel(addedAt: number, taps: number, now: number) {
  const days = Math.max(0, (now - addedAt) / DAY_MS);
  const xp = days * XP_PER_DAY + taps * XP_PER_TAP;
  const level = Math.floor(Math.sqrt(xp / LEVEL_STEP)) + 1;
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  return { level, progress: (xp - from) / (to - from) };
}
