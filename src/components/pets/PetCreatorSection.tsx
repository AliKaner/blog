"use client";

import { useState } from "react";
import { PixelPetEditor } from "./PixelPetEditor";

export function PetCreatorSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-sm border border-border bg-card px-4 py-2 text-sm text-ink hover:border-accent"
      >
        {open ? "Hide pet painter" : "Paint your own pet"}
      </button>
      {open && (
        <div className="mt-4">
          <PixelPetEditor />
        </div>
      )}
    </div>
  );
}
