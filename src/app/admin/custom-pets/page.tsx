"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { CustomPetSprite } from "@/components/pets/CustomPetSprite";
import { PixelPetEditor } from "@/components/pets/PixelPetEditor";
import { formatDate } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminCustomPetsPage() {
  const { token } = useAdminSession();
  const pets = useQuery(
    api.customPets.listAllAdmin,
    token ? { token } : "skip",
  );
  const togglePublish = useMutation(api.customPets.togglePublish);
  const remove = useMutation(api.customPets.remove);
  const [editingId, setEditingId] = useState<Id<"customPets"> | null>(null);

  if (!token || pets === undefined) return <p>Loading…</p>;

  const editing = pets.find((p) => p._id === editingId);

  if (editing) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          Edit Pet — {editing.name}
        </h1>
        <div className="mt-6">
          <PixelPetEditor
            mode="edit"
            petId={editing._id}
            initialName={editing.name}
            initialFrame1={editing.frame1}
            initialFrame2={editing.frame2}
            initialLink={editing.link ?? ""}
            initialSay={editing.say ?? ""}
            onSaved={() => setEditingId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl text-ink">Custom Pets</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Visitor-submitted pixel pets. Approve to make them appear for
        everyone in the Pet Corner.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {pets.map((pet) => (
          <div
            key={pet._id}
            className="panel-sm flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <CustomPetSprite frame={pet.frame1} pixelSize={2.5} />
                <CustomPetSprite frame={pet.frame2} pixelSize={2.5} />
              </div>
              <div>
                <p className="text-ink">{pet.name}</p>
                <p className="font-mono text-xs text-ink-soft">
                  {formatDate(pet.createdAt)} ·{" "}
                  {pet.published ? "approved" : "pending"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: pet._id,
                    published: !pet.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {pet.published ? "Unapprove" : "Approve"}
              </button>
              <button
                onClick={() => setEditingId(pet._id)}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${pet.name}"?`)) {
                    remove({ token, id: pet._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {pets.length === 0 && (
          <p className="text-ink-soft">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}
