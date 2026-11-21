"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "copied" | "failed";

const LABEL: Record<Status, string> = {
  idle: "Copy",
  copied: "Copied",
  failed: "Copy failed",
};

/** Rosette orb that opens to "Copy" on hover and copies `code` to the
    clipboard; it stays open for a moment to confirm. */
export function CopyOrb({ code, name }: { code: string; name: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 1800);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="btn-orb"
      data-open={status !== "idle"}
      aria-label={`Copy the ${name} component source`}
    >
      <span aria-live="polite">{LABEL[status]}</span>
    </button>
  );
}
