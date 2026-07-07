"use client";

import { useState } from "react";
import { PixelPetEditor } from "./PixelPetEditor";

export function PetCreatorSection() {
  const [open, setOpen] = useState(false);
  // Once the editor has been mounted, keep it mounted and just hide it with
  // CSS — unmounting on close would wipe whatever the visitor had painted.
  const [everOpened, setEverOpened] = useState(false);

  return (
    <div className="mt-10">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setEverOpened(true);
        }}
        className="btn px-4 py-2 text-sm"
      >
        {open ? "Hide pet painter" : "Paint your own pet"}
      </button>
      {everOpened && (
        <div className={`mt-4 ${open ? "" : "hidden"}`}>
          <PixelPetEditor />
        </div>
      )}
    </div>
  );
}
