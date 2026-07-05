export const GRID_SIZE = 32;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

export const NEON_PALETTE: string[] = [
  "#ff2bd6",
  "#ff2e2e",
  "#ff8a2e",
  "#fff02e",
  "#39ff8f",
  "#21e6ff",
  "#2e6bff",
  "#b22eff",
  "#ffffff",
  "#0a0a12",
];

export function emptyFrame(): (string | null)[] {
  return new Array(TOTAL_CELLS).fill(null);
}

export function isValidFrame(frame: unknown): frame is (string | null)[] {
  return (
    Array.isArray(frame) &&
    frame.length === TOTAL_CELLS &&
    frame.every((cell) => cell === null || typeof cell === "string")
  );
}
