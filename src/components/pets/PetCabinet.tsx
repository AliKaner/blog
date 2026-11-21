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
import { petLevel } from "@/lib/petLevel";

/* The pet collection, shown like a cabinet of curiosities: one pet per
   cell, each standing still inside its own glass orb on a small plinth.
   Clicking an orb gives the pet a little attention; its level comes from
   how long it has been here plus how often it has been clicked. */

type PetId = Id<"pets"> | Id<"customPets">;

type CabinetPet = {
  _id: PetId;
  name: string;
  addedAt: number;
  origin: "builtin" | "custom";
  kind?: PetKind;
  frame1?: (string | null)[];
  published?: boolean;
};

const ORB_SPRITE = 64; // px the pet is drawn at inside the orb

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

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
      addedAt: p.addedAt,
      origin: "custom",
      frame1: p.frame1,
      published: p.published,
    });
  }
  return [
    ...builtin.map((p) => ({
      _id: p._id,
      name: p.name,
      addedAt: p.addedAt,
      origin: "builtin" as const,
      kind: p.kind as PetKind,
    })),
    ...custom.values(),
  ];
}

export function PetCabinet() {
  const pets = useCabinetPets();
  const taps = useQuery(
    api.petTaps.counts,
    pets ? { petIds: pets.map((p) => p._id) } : "skip",
  );

  // "Now" for the level maths, ticking once a minute so ages stay current.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!pets) return <p className="text-ink-soft">Loading pets…</p>;
  if (pets.length === 0)
    return <p className="text-ink-soft">The cabinet is empty — paint the first pet above.</p>;

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
      {pets.map((pet) => (
        <PetCell key={pet._id} pet={pet} taps={taps?.[pet._id] ?? 0} now={now} />
      ))}
    </div>
  );
}

function PetCell({ pet, taps, now }: { pet: CabinetPet; taps: number; now: number }) {
  const tap = useMutation(api.petTaps.tap);
  // Bumped on every click: keys the "+1" so each click replays it.
  const [pops, setPops] = useState(0);
  const { level } = petLevel(pet.addedAt, taps, now);

  const onTap = () => {
    setPops((n) => n + 1);
    tap({ petId: pet._id }).catch(() => {});
  };

  return (
    <figure className="flex flex-col items-center">
      <button
        type="button"
        onClick={onTap}
        title={`${pet.name} · ${taps} ${taps === 1 ? "pat" : "pats"}`}
        aria-label={`${pet.name}, level ${level}. Give it some attention`}
        className="group relative cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <Orb>
          {pet.origin === "builtin" && pet.kind ? (
            <span className="block [&_canvas]:!h-16 [&_canvas]:!w-16">
              <PetSprite kind={pet.kind} frame="idle" facingRight />
            </span>
          ) : pet.frame1 ? (
            <CustomPetSprite frame={pet.frame1} pixelSize={ORB_SPRITE / GRID_SIZE} />
          ) : null}
        </Orb>
        {pops > 0 && (
          <span
            key={pops}
            aria-hidden
            className="pet-pop pointer-events-none absolute left-1/2 top-2 font-heading text-sm text-accent"
          >
            +1
          </span>
        )}
        {/* Level badge pinned to the orb's top-right, like an enamel tag. */}
        <span
          aria-hidden
          className="pet-badge absolute -right-1 top-1 z-20 px-2 py-0.5 font-heading text-[10px] tracking-[0.12em] text-paper"
        >
          LV {level}
        </span>
      </button>

      <figcaption
        className="mt-2 font-heading text-sm text-ink"
        title={`In the cabinet since ${dateFormat.format(pet.addedAt)}`}
      >
        {pet.name}
        {pet.origin === "custom" && !pet.published && (
          <span className="ml-1.5 font-mono text-[10px] text-accent-2">pending</span>
        )}
      </figcaption>
    </figure>
  );
}

/** Glass orb on a small plinth. The glare sits above the pet, so it reads
    as being behind glass. Presses in slightly when clicked. */
function Orb({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="pet-orb relative flex h-28 w-28 items-center justify-center rounded-full transition-transform duration-150 group-hover:scale-[1.03] group-active:scale-[0.97]">
        <span className="relative z-0">{children}</span>
        <span aria-hidden className="pet-orb-glare pointer-events-none absolute inset-0 z-10 rounded-full" />
      </div>
      {/* collar + plinth */}
      <div aria-hidden className="pet-plinth-collar -mt-1 h-2 w-14 rounded-[3px]" />
      <div aria-hidden className="pet-plinth h-3 w-20 rounded-b-[4px] rounded-t-[2px]" />
    </div>
  );
}
