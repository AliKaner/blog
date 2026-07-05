import { useEffect, useRef } from "react";

export function useKonamiCode(
  sequence: string,
  onMatch: () => void,
  enabled: boolean = true,
) {
  const bufferRef = useRef("");
  const onMatchRef = useRef(onMatch);

  useEffect(() => {
    onMatchRef.current = onMatch;
  });

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;
      if (isEditable || e.key.length !== 1) return;

      bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(
        -sequence.length,
      );
      if (bufferRef.current === sequence) {
        bufferRef.current = "";
        onMatchRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sequence, enabled]);
}
