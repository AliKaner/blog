"use client";

import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import {
  emptyFrame,
  GRID_SIZE,
  NEON_PALETTE,
  TOTAL_CELLS,
} from "@/lib/customPetGrid";
import { CustomPetSprite } from "./CustomPetSprite";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import type { Id } from "../../../convex/_generated/dataModel";

const EDITOR_PIXEL_SIZE = 6;
const FULLSCREEN_MIN_PIXEL_SIZE = 8;
const FULLSCREEN_MAX_PIXEL_SIZE = 26;
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

type Tool = "brush" | "fill" | "eyedropper";
type BrushSize = 1 | 2 | 3;

const BRUSH_OFFSETS: Record<BrushSize, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 0],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ],
};

// Every point a stroke at (row, col) should also touch given the active
// mirror axes — dedupes so a cell on the axis itself isn't double-painted.
function mirrorPoints(
  row: number,
  col: number,
  mirrorX: boolean,
  mirrorY: boolean,
): [number, number][] {
  const candidates: [number, number][] = [[row, col]];
  if (mirrorX) candidates.push([row, GRID_SIZE - 1 - col]);
  if (mirrorY) candidates.push([GRID_SIZE - 1 - row, col]);
  if (mirrorX && mirrorY) {
    candidates.push([GRID_SIZE - 1 - row, GRID_SIZE - 1 - col]);
  }
  const seen = new Set<string>();
  const points: [number, number][] = [];
  for (const [r, c] of candidates) {
    const key = `${r},${c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    points.push([r, c]);
  }
  return points;
}

function floodFill(
  frame: (string | null)[],
  startRow: number,
  startCol: number,
  newColor: string | null,
): (string | null)[] {
  const startIndex = startRow * GRID_SIZE + startCol;
  const target = frame[startIndex];
  if (target === newColor) return frame;
  const next = [...frame];
  const stack: [number, number][] = [[startRow, startCol]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
    const index = r * GRID_SIZE + c;
    if (next[index] !== target) continue;
    next[index] = newColor;
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  return next;
}

function flipHorizontal(frame: (string | null)[]): (string | null)[] {
  const next = new Array<string | null>(TOTAL_CELLS);
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      next[row * GRID_SIZE + col] = frame[row * GRID_SIZE + (GRID_SIZE - 1 - col)];
    }
  }
  return next;
}

function flipVertical(frame: (string | null)[]): (string | null)[] {
  const next = new Array<string | null>(TOTAL_CELLS);
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      next[row * GRID_SIZE + col] = frame[(GRID_SIZE - 1 - row) * GRID_SIZE + col];
    }
  }
  return next;
}

function floodFillMirrored(
  frame: (string | null)[],
  row: number,
  col: number,
  newColor: string | null,
  mirrorX: boolean,
  mirrorY: boolean,
): (string | null)[] {
  let result = frame;
  for (const [r, c] of mirrorPoints(row, col, mirrorX, mirrorY)) {
    result = floodFill(result, r, c, newColor);
  }
  return result;
}

type PixelPetEditorProps = {
  mode?: "create" | "edit";
  petId?: Id<"customPets">;
  initialName?: string;
  initialFrame1?: (string | null)[];
  initialFrame2?: (string | null)[];
  initialLink?: string;
  initialSay?: string;
  onSaved?: () => void;
};

export function PixelPetEditor({
  mode = "create",
  petId,
  initialName = "",
  initialFrame1,
  initialFrame2,
  initialLink = "",
  initialSay = "",
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
  const [customColor, setCustomColor] = useState("#ffffff");
  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState<BrushSize>(1);
  const [mirrorX, setMirrorX] = useState(false);
  const [mirrorY, setMirrorY] = useState(false);
  const [name, setName] = useState(initialName);
  const [link, setLink] = useState(initialLink);
  const [say, setSay] = useState(initialSay);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paintingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fsPixelSize, setFsPixelSize] = useState(FULLSCREEN_MIN_PIXEL_SIZE);

  const frame = activeFrame === 1 ? frame1 : frame2;
  const setFrame = activeFrame === 1 ? setFrame1 : setFrame2;
  const pixelSize = fullscreen ? fsPixelSize : EDITOR_PIXEL_SIZE;
  const size = GRID_SIZE * pixelSize;

  // While fullscreen, size the canvas to the available viewport instead of
  // the fixed editor size, and keep it in sync as the window resizes.
  useEffect(() => {
    if (!fullscreen) return;
    function measure() {
      const availableHeight = window.innerHeight - 220;
      const availableWidth = window.innerWidth * 0.6;
      const next = Math.floor(Math.min(availableHeight, availableWidth) / GRID_SIZE);
      setFsPixelSize(
        Math.max(FULLSCREEN_MIN_PIXEL_SIZE, Math.min(FULLSCREEN_MAX_PIXEL_SIZE, next)),
      );
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [fullscreen]);

  const MAX_HISTORY = 50;
  const historyRef = useRef<{
    1: (string | null)[][];
    2: (string | null)[][];
  }>({ 1: [], 2: [] });

  // Kept in sync after every render (not during) so the keydown handler and
  // the async PNG-import callback always read the current frame without
  // needing to resubscribe or risking a stale closure.
  const activeFrameRef = useRef(activeFrame);
  const setFrameRef = useRef(setFrame);
  const frameRef = useRef(frame);
  useEffect(() => {
    activeFrameRef.current = activeFrame;
    setFrameRef.current = setFrame;
    frameRef.current = frame;
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

  function clearFrame() {
    if (!confirm("Clear this frame? You can still undo right after.")) return;
    pushHistory(activeFrame, frame);
    setFrame(emptyFrame());
  }

  function flip(direction: "horizontal" | "vertical") {
    pushHistory(activeFrame, frame);
    setFrame(direction === "horizontal" ? flipHorizontal(frame) : flipVertical(frame));
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
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * pixelSize, 0);
      ctx.lineTo(i * pixelSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * pixelSize);
      ctx.lineTo(size, i * pixelSize);
      ctx.stroke();
    }

    if (mirrorX || mirrorY) {
      ctx.strokeStyle = "rgba(147,51,234,0.55)";
      ctx.lineWidth = 1.5;
      if (mirrorX) {
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.stroke();
      }
      if (mirrorY) {
        ctx.beginPath();
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }
  }, [frame, size, pixelSize, mirrorX, mirrorY]);

  function cellFromPointer(
    clientX: number,
    clientY: number,
  ): { row: number; col: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor((x / rect.width) * GRID_SIZE);
    const row = Math.floor((y / rect.height) * GRID_SIZE);
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;
    return { row, col };
  }

  function paintAt(clientX: number, clientY: number) {
    const cell = cellFromPointer(clientX, clientY);
    if (!cell) return;
    const { row, col } = cell;

    if (tool === "eyedropper") {
      const picked = frame[row * GRID_SIZE + col];
      setColor(picked);
      if (picked) setCustomColor(picked);
      return;
    }

    if (tool === "fill") {
      setFrame((prev) =>
        floodFillMirrored(prev, row, col, color, mirrorX, mirrorY),
      );
      return;
    }

    setFrame((prev) => {
      const next = [...prev];
      let changed = false;
      for (const [pr, pc] of mirrorPoints(row, col, mirrorX, mirrorY)) {
        for (const [dr, dc] of BRUSH_OFFSETS[brushSize]) {
          const r = pr + dr;
          const c = pc + dc;
          if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
          const index = r * GRID_SIZE + c;
          if (next[index] !== color) {
            next[index] = color;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (tool !== "eyedropper") pushHistory(activeFrame, frame);
    if (tool === "brush") paintingRef.current = true;
    paintAt(e.clientX, e.clientY);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!paintingRef.current) return;
    paintAt(e.clientX, e.clientY);
  }
  function stopPainting() {
    paintingRef.current = false;
  }

  function importPng(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const off = document.createElement("canvas");
        off.width = GRID_SIZE;
        off.height = GRID_SIZE;
        const octx = off.getContext("2d", { willReadFrequently: true });
        if (!octx) return;
        octx.imageSmoothingEnabled = false;
        octx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
        // Fit the source image inside the 32x32 grid, centered, preserving
        // its aspect ratio rather than stretching it.
        const scale = Math.min(GRID_SIZE / img.width, GRID_SIZE / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        octx.drawImage(img, (GRID_SIZE - w) / 2, (GRID_SIZE - h) / 2, w, h);
        const data = octx.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data;
        const next: (string | null)[] = new Array(TOTAL_CELLS).fill(null);
        for (let i = 0; i < TOTAL_CELLS; i++) {
          const a = data[i * 4 + 3];
          if (a < 32) continue;
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          next[i] =
            "#" +
            [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
        }
        pushHistory(activeFrameRef.current, frameRef.current);
        setFrameRef.current(next);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "edit") {
        if (!petId || !token) throw new Error("Not authenticated");
        await update({ token, id: petId, name, frame1, frame2, link, say });
        onSaved?.();
      } else {
        const id = await submit({ name, frame1, frame2, link, say });
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

  const cursorClass =
    tool === "eyedropper"
      ? "cursor-copy"
      : tool === "fill"
        ? "cursor-cell"
        : "cursor-crosshair";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        fullscreen
          ? "fixed inset-0 z-[100] flex flex-col gap-4 overflow-auto bg-paper p-6"
          : "panel flex flex-col gap-4 p-6"
      }
    >
      {fullscreen && (
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="btn fixed right-4 top-4 z-[110] px-3 py-1.5 text-sm"
          title="Exit fullscreen (Esc)"
        >
          ✕ Exit fullscreen
        </button>
      )}
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className={`rounded-sm border border-border touch-none ${cursorClass}`}
            style={{ width: size, height: size, imageRendering: "pixelated" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopPainting}
            onPointerLeave={stopPainting}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
            <button
              type="button"
              onClick={clearFrame}
              className="btn px-2 py-1 text-xs"
              title="Wipe this frame"
            >
              Clear Frame
            </button>
            <button
              type="button"
              onClick={() => flip("horizontal")}
              className="btn px-2 py-1 text-xs"
              title="Flip this frame left-right"
            >
              Flip ↔
            </button>
            <button
              type="button"
              onClick={() => flip("vertical")}
              className="btn px-2 py-1 text-xs"
              title="Flip this frame top-bottom"
            >
              Flip ↕
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn px-2 py-1 text-xs"
              title="Import a PNG as a rough starting point for this frame — totally optional"
            >
              Import PNG
            </button>
            {!fullscreen && (
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                className="btn px-2 py-1 text-xs"
                title="Open a bigger canvas to paint on"
              >
                ⛶ Fullscreen
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importPng(file);
                e.target.value = "";
              }}
            />
          </div>
          <p className="mt-1 font-mono text-[10px] text-ink-soft">
            Import is optional — it just squashes the image into 32×32 as a
            rough base to paint over, it won&apos;t come out perfect.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              Tool
            </p>
            <div className="mt-1 flex gap-1.5">
              {(
                [
                  { id: "brush", label: "Brush" },
                  { id: "fill", label: "Fill" },
                  { id: "eyedropper", label: "Eyedropper" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTool(t.id)}
                  className={`btn px-2 py-1 text-xs ${tool === t.id ? "text-accent" : ""}`}
                  style={{
                    borderColor: tool === t.id ? "var(--accent)" : undefined,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tool === "brush" && (
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
                Brush size
              </p>
              <div className="mt-1 flex gap-1.5">
                {([1, 2, 3] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBrushSize(s)}
                    className={`flex h-7 w-7 items-center justify-center rounded-sm border-2 font-mono text-xs ${
                      brushSize === s ? "text-accent" : "text-ink-soft"
                    }`}
                    style={{
                      borderColor:
                        brushSize === s ? "var(--accent)" : "var(--border)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              Symmetry
            </p>
            <div className="mt-1 flex gap-1.5">
              <button
                type="button"
                onClick={() => setMirrorX((v) => !v)}
                className={`btn px-2 py-1 text-xs ${mirrorX ? "text-accent" : ""}`}
                style={{ borderColor: mirrorX ? "var(--accent)" : undefined }}
                title="Mirror left-right"
              >
                Mirror ↔
              </button>
              <button
                type="button"
                onClick={() => setMirrorY((v) => !v)}
                className={`btn px-2 py-1 text-xs ${mirrorY ? "text-accent" : ""}`}
                style={{ borderColor: mirrorY ? "var(--accent)" : undefined }}
                title="Mirror top-bottom"
              >
                Mirror ↕
              </button>
            </div>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              Color
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
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
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setColor(e.target.value);
                }}
                className="h-7 w-9 cursor-pointer rounded-sm border-2 bg-transparent p-0"
                style={{
                  borderColor:
                    color === customColor ? "var(--accent)" : "var(--border)",
                }}
                title="Pick any color"
              />
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

          <label className="block">
            <span className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
              Link <span className="normal-case opacity-60">(optional)</span>
            </span>
            <input
              type="text"
              inputMode="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="input mt-1"
              placeholder="your-site.com"
            />
            <span className="mt-1 block font-mono text-[10px] text-ink-soft">
              Where clicking the pet takes visitors.
            </span>
          </label>

          <label className="block">
            <span className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
              Says <span className="normal-case opacity-60">(optional)</span>
            </span>
            <input
              type="text"
              maxLength={40}
              value={say}
              onChange={(e) => setSay(e.target.value)}
              className="input mt-1"
              placeholder="hi there!"
            />
            <span className="mt-1 block font-mono text-[10px] text-ink-soft">
              What it shows in its chat bubble.
            </span>
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
