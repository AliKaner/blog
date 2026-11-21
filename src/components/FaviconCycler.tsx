"use client";

import { useEffect } from "react";

const LETTERS = "ALIKANER".split("");
const CYCLE_MS = 700;
const SIZE = 32;
const PAPER = "#d3e1f1";
const ACCENT = "#6f3034";

/** One favicon frame, matching src/app/icon.svg: a tiny print plate —
    blue paper, double burgundy rule, an inscribed serif letter. */
function drawFrame(letter: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.roundRect(0, 0, SIZE, SIZE, 3);
  ctx.fill();

  ctx.strokeStyle = ACCENT;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(1.25, 1.25, SIZE - 2.5, SIZE - 2.5, 2);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 0.75;
  ctx.strokeRect(4, 4, SIZE - 8, SIZE - 8);
  ctx.globalAlpha = 1;

  ctx.fillStyle = ACCENT;
  ctx.font = "19px 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";
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
