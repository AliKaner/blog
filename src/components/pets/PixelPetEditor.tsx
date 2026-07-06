"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { emptyFrame, GRID_SIZE, NEON_PALETTE } from "@/lib/customPetGrid";
import { CustomPetSprite } from "./CustomPetSprite";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import type { Id } from "../../../convex/_generated/dataModel";

const EDITOR_PIXEL_SIZE = 9;
const STORAGE_KEY = "my_custom_pet_ids";

export function myCustomPetIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function rememberCustomPetId(id: string) {
  const ids = myCustomPetIds();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
}

type PixelPetEditorProps = {
  mode?: "create" | "edit";
  petId?: Id<"customPets">;
  initialName?: string;
  initialFrame1?: (string | null)[];
  initialFrame2?: (string | null)[];
  onSaved?: () => void;
};

export function PixelPetEditor({
  mode = "create",
  petId,
  initialName = "",
  initialFrame1,
  initialFrame2,
  onSaved,
}: PixelPetEditorProps = {}) {
  const submit = useMutation(api.customPets.submit);
  const update = useMutation(api.customPets.update);
  const { token } = useAdminSession();
  const [frame1, setFrame1] = useState<(string | null)[]>(
    () => initialFrame1 ?? emptyFrame(),
  );
  const [frame2, setFrame2] = useState<(string | null)[]>(
    () => initialFrame2 ?? emptyFrame(),
  );
  const [activeFrame, setActiveFrame] = useState<1 | 2>(1);
  const [color, setColor] = useState<string | null>(NEON_PALETTE[0]);
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paintingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const frame = activeFrame === 1 ? frame1 : frame2;
  const setFrame = activeFrame === 1 ? setFrame1 : setFrame2;
  const size = GRID_SIZE * EDITOR_PIXEL_SIZE;

  const MAX_HISTORY = 50;
  const historyRef = useRef<{
    1: (string | null)[][];
    2: (string | null)[][];
  }>({ 1: [], 2: [] });

  // Kept in sync after every render (not during) so the keydown handler
  // below always reads the current frame without needing to resubscribe.
  const activeFrameRef = useRef(activeFrame);
  const setFrameRef = useRef(setFrame);
  useEffect(() => {
    activeFrameRef.current = activeFrame;
    setFrameRef.current = setFrame;
  });

  function pushHistory(frameNum: 1 | 2, snapshot: (string | null)[]) {
    const hist = historyRef.current[frameNum];
    hist.push(snapshot);
    if (hist.length > MAX_HISTORY) hist.shift();
  }

  function undo() {
    const current = activeFrameRef.current;
    const hist = historyRef.current[current];
    const prev = hist.pop();
    if (prev) setFrameRef.current(prev);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (isEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = frame[row * GRID_SIZE + col];
        ctx.fillStyle = cell ?? "#1a1826";
        ctx.fillRect(
          col * EDITOR_PIXEL_SIZE,
          row * EDITOR_PIXEL_SIZE,
          EDITOR_PIXEL_SIZE,
          EDITOR_PIXEL_SIZE,
        );
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * EDITOR_PIXEL_SIZE, 0);
      ctx.lineTo(i * EDITOR_PIXEL_SIZE, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * EDITOR_PIXEL_SIZE);
      ctx.lineTo(size, i * EDITOR_PIXEL_SIZE);
      ctx.stroke();
    }
  }, [frame, size]);

  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor((x / rect.width) * GRID_SIZE);
    const row = Math.floor((y / rect.height) * GRID_SIZE);
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return;
    const index = row * GRID_SIZE + col;
    setFrame((prev) => {
      if (prev[index] === color) return prev;
      const next = [...prev];
      next[index] = color;
      return next;
    });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    paintingRef.current = true;
    pushHistory(activeFrame, frame);
    paintAt(e.clientX, e.clientY);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!paintingRef.current) return;
    paintAt(e.clientX, e.clientY);
  }
  function stopPainting() {
    paintingRef.current = false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "edit") {
        if (!petId || !token) throw new Error("Not authenticated");
        await update({ token, id: petId, name, frame1, frame2 });
        onSaved?.();
      } else {
        const id = await submit({ name, frame1, frame2 });
        rememberCustomPetId(id);
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-ink">
          Thanks — <span className="text-accent">{name}</span> is waiting for
          approval. It will join the yard once approved, and you can already
          see it below.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel flex flex-col gap-4 p-6"
    >
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="cursor-crosshair rounded-sm border border-border touch-none"
            style={{ width: size, height: size, imageRendering: "pixelated" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopPainting}
            onPointerLeave={stopPainting}
          />
          <div className="mt-2 flex items-center gap-2">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setActiveFrame(n)}
                className={`flex flex-col items-center gap-1 rounded-sm border p-1 ${
                  activeFrame === n ? "border-accent" : "border-border"
                }`}
              >
                <CustomPetSprite
                  frame={n === 1 ? frame1 : frame2}
                  pixelSize={1.5}
                />
                <span className="font-mono text-[10px] text-ink-soft">
                  Frame {n}
                </span>
              </button>
            ))}
            {activeFrame === 2 && (
              <button
                type="button"
                onClick={() => {
                  pushHistory(2, frame2);
                  setFrame2([...frame1]);
                }}
                className="btn px-2 py-1 text-xs"
                title="Copy Frame 1 into Frame 2 as a starting point"
              >
                Copy Frame 1 →
              </button>
            )}
            <button
              type="button"
              onClick={undo}
              className="btn px-2 py-1 text-xs"
              title="Undo (Ctrl+Z)"
            >
              ↺ Undo
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              Color
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {NEON_PALETTE.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  aria-label={swatch}
                  className="h-7 w-7 rounded-sm border-2"
                  style={{
                    backgroundColor: swatch,
                    borderColor: color === swatch ? "var(--accent)" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setColor(null)}
            className={`flex w-fit items-center gap-1.5 rounded-sm border-2 px-2 py-1 text-xs ${
              color === null ? "text-accent" : "text-ink-soft"
            }`}
            style={{
              borderColor: color === null ? "var(--accent)" : "var(--border)",
              background:
                "repeating-conic-gradient(#2a2740 0% 25%, #1a1826 0% 50%) 0 / 8px 8px",
            }}
            title="Eraser — paint with no color"
          >
            Eraser
          </button>

          <label className="block">
            <span className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
              Pet name
            </span>
            <input
              required
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input mt-1"
              placeholder="Blorp"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn w-fit px-4 py-2 text-sm disabled:opacity-50"
            >
              {submitting
                ? "Saving…"
                : mode === "edit"
                  ? "Save changes"
                  : "Submit for approval"}
            </button>
            {mode === "edit" && (
              <button
                type="button"
                onClick={onSaved}
                className="text-sm text-ink-soft"
              >
                Cancel
              </button>
            )}
          </div>
          {error && <p className="text-xs text-accent">{error}</p>}
        </div>
      </div>
    </form>
  );
}
