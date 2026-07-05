"use client";

import { useEffect, useState } from "react";
import { computeEffective } from "@/lib/petDecay";

const EMOJI: Record<string, string> = {
  cat: "🐱",
  dog: "🐶",
  bird: "🐦",
};

type Pet = {
  _id: string;
  kind: string;
  name: string;
  hunger: number;
  happiness: number;
  totalFeeds: number;
  canFeedAt: number;
};

export function PetCard({
  pet,
  onFeed,
}: {
  pet: Pet;
  onFeed: (petId: string) => Promise<void>;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [feeding, setFeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Continue decaying client-side from the snapshot the query returned,
  // since Convex reactivity only re-runs the query on writes, not on time.
  // Reset the snapshot clock whenever the underlying values actually change
  // (a feed from any visitor), otherwise it'd keep decaying from this
  // component's mount time instead of from the fresh data's arrival time.
  // Adjusted during render (not an effect) per React's "adjusting state
  // when a prop changes" pattern.
  const [prevValues, setPrevValues] = useState({
    hunger: pet.hunger,
    happiness: pet.happiness,
  });
  const [snapshotAt, setSnapshotAt] = useState(now);
  if (prevValues.hunger !== pet.hunger || prevValues.happiness !== pet.happiness) {
    setPrevValues({ hunger: pet.hunger, happiness: pet.happiness });
    setSnapshotAt(now);
  }
  const displayed = computeEffective(
    { hunger: pet.hunger, happiness: pet.happiness, lastFedAt: snapshotAt },
    now,
  );

  const canFeed = now >= pet.canFeedAt;
  const cooldownRemaining = Math.max(0, Math.ceil((pet.canFeedAt - now) / 1000));

  async function handleFeed() {
    setError(null);
    setFeeding(true);
    try {
      await onFeed(pet._id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't feed right now.");
    } finally {
      setFeeding(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-border bg-card p-6 text-center">
      <div className="text-5xl">{EMOJI[pet.kind] ?? "🐾"}</div>
      <h3 className="font-heading text-xl text-ink">{pet.name}</h3>
      <div className="w-full space-y-2 text-left">
        <Bar label="Hunger" value={displayed.hunger} />
        <Bar label="Happiness" value={displayed.happiness} />
      </div>
      <p className="font-mono text-xs text-ink-soft">
        Fed {pet.totalFeeds} time{pet.totalFeeds === 1 ? "" : "s"}
      </p>
      <button
        onClick={handleFeed}
        disabled={!canFeed || feeding}
        className="w-full rounded-sm bg-accent px-3 py-1.5 text-sm text-paper disabled:opacity-40"
      >
        {feeding
          ? "Feeding…"
          : canFeed
            ? "Feed"
            : `Wait ${cooldownRemaining}s`}
      </button>
      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-xs text-ink-soft">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full border border-border bg-paper">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
