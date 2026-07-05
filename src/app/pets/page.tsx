"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PetCard } from "@/components/pets/PetCard";
import type { Id } from "../../../convex/_generated/dataModel";

export default function PetsPage() {
  const pets = useQuery(api.pets.listPets);
  const feedPet = useMutation(api.pets.feedPet);

  async function handleFeed(petId: string) {
    await feedPet({ petId: petId as Id<"pets"> });
  }

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Pet Corner</h1>
      <p className="mt-2 text-ink-soft">
        Shared pets — anyone visiting can feed them. Updates live for
        everyone.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {pets === undefined && (
          <p className="text-ink-soft">Loading pets…</p>
        )}
        {pets?.map((pet) => (
          <PetCard key={pet._id} pet={pet} onFeed={handleFeed} />
        ))}
      </div>
    </div>
  );
}
