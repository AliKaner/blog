"use client";

import { useState } from "react";
import { PixelPetEditor } from "./PixelPetEditor";

export function PetCreatorSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn px-4 py-2 text-sm"
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
