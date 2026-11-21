"use client";

import { useState } from "react";
import { PixelPetEditor } from "./PixelPetEditor";

export function PetCreatorSection() {
  const [open, setOpen] = useState(false);
  // Once the editor has been mounted, keep it mounted and just hide it with
  // CSS — unmounting on close would wipe whatever the visitor had painted.
  const [everOpened, setEverOpened] = useState(false);

  return (
    <div className="mt-6">
      {/* Sits at the end of the heading's rosette band, as one more rosette
          (the page wrapper is the positioning context). The band is 220px
          wide and centred 3.85rem below the top of a text-3xl heading. */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setEverOpened(true);
        }}
        aria-expanded={open}
        className="btn-orb absolute left-[calc(min(100%,220px)+0.5rem)] top-[calc(3.85rem-1.15rem)]"
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
