export const HUNGER_DECAY_PER_HOUR = 100 / 24;
export const HAPPINESS_DECAY_PER_HOUR = 100 / 48;
export const FEED_HUNGER_BOOST = 30;
export const FEED_HAPPINESS_BOOST = 15;
export const FEED_COOLDOWN_MS = 5_000;

export type PetSnapshot = {
  hunger: number;
  happiness: number;
  lastFedAt: number;
};

export function computeEffective(pet: PetSnapshot, now: number) {
  const hours = Math.max(0, now - pet.lastFedAt) / 3_600_000;
  return {
    hunger: Math.max(0, Math.round(pet.hunger - hours * HUNGER_DECAY_PER_HOUR)),
    happiness: Math.max(
      0,
      Math.round(pet.happiness - hours * HAPPINESS_DECAY_PER_HOUR),
    ),
  };
}
