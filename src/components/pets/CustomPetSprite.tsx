"use client";

import { useEffect, useRef } from "react";
import { GRID_SIZE } from "@/lib/customPetGrid";

export function CustomPetSprite({
  frame,
  pixelSize = 1.5,
  facingRight = true,
}: {
  frame: (string | null)[];
  pixelSize?: number;
  facingRight?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = GRID_SIZE * pixelSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    if (!facingRight) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const color = frame[row * GRID_SIZE + col];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }
    ctx.restore();
  }, [frame, pixelSize, facingRight]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}
