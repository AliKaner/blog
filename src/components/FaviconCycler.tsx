"use client";

import { useEffect } from "react";

const LETTERS = "ALIKANER".split("");
const CYCLE_MS = 700;
const SIZE = 32;

function drawFrame(letter: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const radius = 6;
  ctx.fillStyle = "#0a0a12";
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(SIZE, 0, SIZE, SIZE, radius);
  ctx.arcTo(SIZE, SIZE, 0, SIZE, radius);
  ctx.arcTo(0, SIZE, 0, 0, radius);
  ctx.arcTo(0, 0, SIZE, 0, radius);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff2bd6";
  ctx.font = "700 20px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, SIZE / 2, SIZE / 2 + 1);

  return canvas.toDataURL("image/png");
}

export function FaviconCycler() {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    let index = 0;
    link.href = drawFrame(LETTERS[index]);

    const id = setInterval(() => {
      index = (index + 1) % LETTERS.length;
      if (link) link.href = drawFrame(LETTERS[index]);
    }, CYCLE_MS);

    return () => clearInterval(id);
  }, []);

  return null;
}
