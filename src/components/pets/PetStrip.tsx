"use client";

import { useEffect, useRef, useState } from "react";
import { PetSprite } from "./PetSprite";
import type { Frame, PetKind } from "./spriteData";

const STRIP_HEIGHT = 72;
const PET_SIZE = 50;
const TICK_MS = 50;
const WALK_FRAME_INTERVAL_MS = 220;

const COMPANIONS: { kind: PetKind; speed: number }[] = [
  { kind: "cat", speed: 34 },
  { kind: "dog", speed: 26 },
  { kind: "bird", speed: 42 },
];

type StripState = {
  x: number;
  dir: 1 | -1;
  frame: Frame;
  frameToggle: 0 | 1;
  frameTimer: number;
};

function initialState(index: number, width: number): StripState {
  return {
    x: (width / (COMPANIONS.length + 1)) * (index + 1) - PET_SIZE / 2,
    dir: Math.random() > 0.5 ? 1 : -1,
    frame: "walk1",
    frameToggle: 0,
    frameTimer: 0,
  };
}

export function PetStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(1200);
  const stateRef = useRef<StripState[]>([]);
  const [snapshot, setSnapshot] = useState<StripState[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      widthRef.current = el.clientWidth;
    };
    measure();
    if (stateRef.current.length === 0) {
      stateRef.current = COMPANIONS.map((_, i) =>
        initialState(i, widthRef.current),
      );
      setSnapshot([...stateRef.current]);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const width = widthRef.current;
      for (let i = 0; i < stateRef.current.length; i++) {
        const s = stateRef.current[i];
        const speed = COMPANIONS[i].speed;
        s.x += s.dir * speed * (TICK_MS / 1000);
        if (s.x <= 0) {
          s.x = 0;
          s.dir = 1;
        } else if (s.x >= width - PET_SIZE) {
          s.x = width - PET_SIZE;
          s.dir = -1;
        }
        s.frameTimer += TICK_MS;
        if (s.frameTimer >= WALK_FRAME_INTERVAL_MS) {
          s.frameTimer = 0;
          s.frameToggle = s.frameToggle === 0 ? 1 : 0;
          s.frame = s.frameToggle === 0 ? "walk1" : "walk2";
        }
      }
      setSnapshot([...stateRef.current]);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-border"
      style={{
        height: STRIP_HEIGHT,
        background: "color-mix(in srgb, var(--card) 85%, transparent)",
        boxShadow: "0 0 12px 0 var(--border)",
      }}
    >
      {snapshot.map((s, i) => (
        <div
          key={COMPANIONS[i].kind}
          className="absolute bottom-1"
          style={{ transform: `translateX(${s.x}px)` }}
        >
          <PetSprite kind={COMPANIONS[i].kind} frame={s.frame} facingRight={s.dir === 1} />
        </div>
      ))}
    </div>
  );
}

export const PET_STRIP_HEIGHT = STRIP_HEIGHT;
