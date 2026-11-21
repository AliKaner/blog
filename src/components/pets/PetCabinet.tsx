"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PetSprite } from "./PetSprite";
import { CustomPetSprite } from "./CustomPetSprite";
import { myCustomPetIds } from "./PixelPetEditor";
import type { PetKind } from "./spriteData";
import { GRID_SIZE } from "@/lib/customPetGrid";

/* The pet collection, shown like a cabinet of curiosities: one pet per
   cell, each standing still inside its own glass orb on a small plinth.
   No wandering — they only live here now, not across the site. */

type CabinetPet = {
  _id: string;
  name: string;
  hunger: number;
  happiness: number;
  totalFeeds: number;
  canFeedAt: number;
  origin: "builtin" | "custom";
  kind?: PetKind;
  frame1?: (string | null)[];
  published?: boolean;
};

const ORB_SPRITE = 64; // px the pet is drawn at inside the orb

function useCabinetPets(): CabinetPet[] | undefined {
  const builtin = useQuery(api.pets.listPets);
  const approved = useQuery(api.customPets.listApproved);

  const [ownIds, setOwnIds] = useState<string[]>([]);
  useEffect(() => {
    // localStorage is browser-only, so read it after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwnIds(myCustomPetIds());
  }, []);
  const own = useQuery(
    api.customPets.getByIds,
    ownIds.length > 0 ? { ids: ownIds as Id<"customPets">[] } : "skip",
  );

  if (!builtin || !approved) return undefined;

  const custom = new Map<string, CabinetPet>();
  for (const p of [...approved, ...(own ?? [])]) {
    custom.set(p._id, {
      _id: p._id,
      name: p.name,
      hunger: p.hunger,
      happiness: p.happiness,
      totalFeeds: p.totalFeeds,
      canFeedAt: p.canFeedAt,
      origin: "custom",
      frame1: p.frame1,
      published: p.published,
    });
  }
  return [
    ...builtin.map((p) => ({
      _id: p._id,
      name: p.name,
      hunger: p.hunger,
      happiness: p.happiness,
      totalFeeds: p.totalFeeds,
      canFeedAt: p.canFeedAt,
      origin: "builtin" as const,
      kind: p.kind as PetKind,
    })),
    ...custom.values(),
  ];
}

export function PetCabinet() {
  const pets = useCabinetPets();

  if (!pets) return <p className="text-ink-soft">Loading pets…</p>;
  if (pets.length === 0)
    return <p className="text-ink-soft">The cabinet is empty — paint the first pet above.</p>;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {pets.map((pet) => (
        <PetCell key={pet._id} pet={pet} />
      ))}
    </div>
  );
}

function PetCell({ pet }: { pet: CabinetPet }) {
  const feedPet = useMutation(api.pets.feedPet);
  const feedCustomPet = useMutation(api.customPets.feedCustomPet);
  const [feeding, setFeeding] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const feed = async () => {
    setFeeding(true);
    setNote(null);
    try {
      if (pet.origin === "builtin") await feedPet({ petId: pet._id as Id<"pets"> });
      else await feedCustomPet({ petId: pet._id as Id<"customPets"> });
      setNote("Yum!");
    } catch {
      setNote("Not hungry yet");
    } finally {
      setFeeding(false);
    }
  };

  return (
    <figure className="panel-sm flex flex-col items-center px-3 pb-4 pt-5">
      <Orb>
        {pet.origin === "builtin" && pet.kind ? (
          <span className="block [&_canvas]:!h-16 [&_canvas]:!w-16">
            <PetSprite kind={pet.kind} frame="idle" facingRight />
          </span>
        ) : pet.frame1 ? (
          <CustomPetSprite frame={pet.frame1} pixelSize={ORB_SPRITE / GRID_SIZE} />
        ) : null}
      </Orb>

      <figcaption className="mt-3 w-full text-center">
        <p className="font-heading text-base text-ink">
          {pet.name}
          {pet.origin === "custom" && !pet.published && (
            <span className="ml-1.5 font-mono text-[10px] text-accent-2">pending</span>
          )}
        </p>
        <div className="mt-2 flex flex-col gap-1 text-left">
          <StatBar label="Hunger" value={pet.hunger} />
          <StatBar label="Happiness" value={pet.happiness} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] text-ink-soft">
            {note ?? `Fed ${pet.totalFeeds}×`}
          </span>
          <button
            type="button"
            onClick={feed}
            disabled={feeding}
            className="btn px-3 py-1 text-xs disabled:opacity-60"
          >
            Feed
          </button>
        </div>
      </figcaption>
    </figure>
  );
}

/** Glass orb on a small plinth. The glare sits above the pet, so it reads
    as being behind glass. */
function Orb({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="pet-orb relative flex h-28 w-28 items-center justify-center rounded-full">
        <span className="relative z-0">{children}</span>
        <span aria-hidden className="pet-orb-glare pointer-events-none absolute inset-0 z-10 rounded-full" />
      </div>
      {/* collar + plinth */}
      <div aria-hidden className="pet-plinth-collar -mt-1 h-2 w-14 rounded-[3px]" />
      <div aria-hidden className="pet-plinth h-3 w-20 rounded-b-[4px] rounded-t-[2px]" />
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] text-ink-soft">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-accent/15">
        <div className="h-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
