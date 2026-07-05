"use client";

import { useEffect, useRef } from "react";
import {
  getPalette,
  getSprite,
  SPRITE_COLS,
  SPRITE_ROWS,
  type Frame,
  type PetKind,
} from "./spriteData";

const PIXEL_SIZE = 5;

export function PetSprite({
  kind,
  frame,
  facingRight,
}: {
  kind: PetKind;
  frame: Frame;
  facingRight: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const grid = getSprite(kind, frame);
    const palette = getPalette(kind);

    ctx.save();
    if (!facingRight) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    for (let row = 0; row < grid.length; row++) {
      const line = grid[row];
      for (let col = 0; col < line.length; col++) {
        const key = line[col];
        if (key === ".") continue;
        ctx.fillStyle = palette[key] ?? "#000";
        ctx.fillRect(
          col * PIXEL_SIZE,
          row * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE,
        );
      }
    }
    ctx.restore();
  }, [kind, frame, facingRight]);

  return (
    <canvas
      ref={canvasRef}
      width={SPRITE_COLS * PIXEL_SIZE}
      height={SPRITE_ROWS * PIXEL_SIZE}
      style={{
        width: SPRITE_COLS * PIXEL_SIZE,
        height: SPRITE_ROWS * PIXEL_SIZE,
        imageRendering: "pixelated",
      }}
    />
  );
}
