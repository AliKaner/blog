"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CustomPetSprite } from "./CustomPetSprite";
import { myCustomPetIds } from "./PixelPetEditor";
import type { Frame } from "./spriteData";
import type { Id } from "../../../convex/_generated/dataModel";

const PET_SIZE = 46;
const TICK_MS = 50;
const TICK_S = TICK_MS / 1000;
const WALK_FRAME_INTERVAL_MS = 220;
const ARRIVE_DIST = 4;
const GUTTER_MIN = 64; // a side needs at least this much room to roam it
const TOP_INSET = 72; // keep clear of the fixed site nav
const EDGE = 8;
const MAX_CUSTOM = 12; // cap so the margins never get too crowded
const CHATTER_KEY = "petChatter"; // localStorage flag: speech bubbles on/off
const BUBBLE_MS = 2000; // how long a bubble stays up
const BUBBLE_CHANCE = 0.4; // odds a pet speaks when it stops to rest

const CUSTOM_SOUNDS = ["hi!", "hello", "hey", "♪"];

function pickSound(): string {
  return CUSTOM_SOUNDS[Math.floor(Math.random() * CUSTOM_SOUNDS.length)];
}

type Zone = { x0: number; y0: number; x1: number; y1: number };

type Roamer = {
  key: string;
  name: string;
  frame1: (string | null)[];
  frame2: (string | null)[];
  speed: number;
  link?: string; // clicking the pet goes here (falls back to /pets)
  say?: string; // custom bubble text (falls back to a random sound)
};

type SimState = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  zone: number;
  facingRight: boolean;
  frame: Frame;
  frameToggle: 0 | 1;
  frameTimer: number;
  pauseUntil: number;
  bubble: string | null;
  bubbleUntil: number;
};

function randIn(min: number, max: number): number {
  return min + Math.random() * Math.max(0, max - min);
}

// Deterministic per-pet speed (avoids Math.random() during render, which
// React's purity rules disallow) — same pet always gets the same pace.
function speedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 22 + (hash % 1600) / 100;
}

function pickTarget(zone: Zone): { x: number; y: number } {
  return { x: randIn(zone.x0, zone.x1), y: randIn(zone.y0, zone.y1) };
}

// Everything outside the centered content column is fair game. The column's
// horizontal position doesn't change as the page scrolls, so the left/right
// gutters are stable roaming lanes; pets never wander over the content.
function computeZones(): Zone[] {
  if (typeof window === "undefined") return [];
  const main = document.querySelector("main");
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = main?.getBoundingClientRect();
  const left = rect ? rect.left : vw;
  const right = rect ? rect.right : 0;

  const zones: Zone[] = [];
  if (left >= GUTTER_MIN + EDGE) {
    zones.push({
      x0: EDGE,
      y0: TOP_INSET,
      x1: left - PET_SIZE - EDGE,
      y1: vh - PET_SIZE - EDGE,
    });
  }
  if (vw - right >= GUTTER_MIN + EDGE) {
    zones.push({
      x0: right + EDGE,
      y0: TOP_INSET,
      x1: vw - PET_SIZE - EDGE,
      y1: vh - PET_SIZE - EDGE,
    });
  }
  // Narrow screens: no side room, so tuck them into a bottom band instead
  // of covering the content.
  if (zones.length === 0) {
    zones.push({
      x0: EDGE,
      y0: vh - PET_SIZE - EDGE,
      x1: vw - PET_SIZE - EDGE,
      y1: vh - PET_SIZE - EDGE,
    });
  }
  return zones;
}

export function PetStrip() {
  const pathname = usePathname();
  const router = useRouter();
  const approvedCustomQuery = useQuery(api.customPets.listApproved);
  const [ownCustomIds, setOwnCustomIds] = useState<string[]>([]);
  useEffect(() => {
    // localStorage is browser-only, so read it in an effect (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwnCustomIds(myCustomPetIds());
  }, []);
  const ownCustomQuery = useQuery(
    api.customPets.getByIds,
    ownCustomIds.length > 0
      ? { ids: ownCustomIds as Id<"customPets">[] }
      : "skip",
  );

  // Only hand-painted pets roam the margins — no built-in companions.
  const roamers: Roamer[] = (() => {
    const list: Roamer[] = [];
    const seen = new Set<string>();
    const customs = [...(approvedCustomQuery ?? []), ...(ownCustomQuery ?? [])];
    for (const p of customs) {
      if (seen.has(p._id)) continue;
      seen.add(p._id);
      if (list.length >= MAX_CUSTOM) break;
      list.push({
        key: `custom-${p._id}`,
        name: p.name,
        frame1: p.frame1,
        frame2: p.frame2,
        speed: speedFromId(p._id),
        link: p.link ?? undefined,
        say: p.say ?? undefined,
      });
    }
    return list;
  })();

  const containerRef = useRef<HTMLDivElement>(null);
  const zonesRef = useRef<Zone[]>([]);
  const simRef = useRef<Record<string, SimState>>({});
  const roamersRef = useRef<Roamer[]>([]);
  const [snapshot, setSnapshot] = useState<Record<string, SimState>>({});

  // Speech bubbles are opt-in. Persist the choice so it sticks across visits.
  const [chatter, setChatter] = useState(false);
  const chatterRef = useRef(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChatter(localStorage.getItem(CHATTER_KEY) === "on");
  }, []);
  useEffect(() => {
    chatterRef.current = chatter;
  }, [chatter]);
  const toggleChatter = () => {
    setChatter((on) => {
      const next = !on;
      localStorage.setItem(CHATTER_KEY, next ? "on" : "off");
      return next;
    });
  };

  useEffect(() => {
    roamersRef.current = roamers;
  });

  useEffect(() => {
    const measure = () => {
      zonesRef.current = computeZones();
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Seed a sim state for each roamer the first time it appears.
  useEffect(() => {
    if (zonesRef.current.length === 0) zonesRef.current = computeZones();
    const zones = zonesRef.current;
    let changed = false;
    roamers.forEach((r, i) => {
      if (simRef.current[r.key]) return;
      changed = true;
      const zoneIdx = i % zones.length;
      const zone = zones[zoneIdx];
      const start = pickTarget(zone);
      const target = pickTarget(zone);
      simRef.current[r.key] = {
        x: start.x,
        y: start.y,
        tx: target.x,
        ty: target.y,
        zone: zoneIdx,
        facingRight: target.x >= start.x,
        frame: "walk1",
        frameToggle: 0,
        frameTimer: 0,
        pauseUntil: 0,
        bubble: null,
        bubbleUntil: 0,
      };
    });
    // Drop sim state for roamers that went away.
    const live = new Set(roamers.map((r) => r.key));
    for (const key of Object.keys(simRef.current)) {
      if (!live.has(key)) {
        delete simRef.current[key];
        changed = true;
      }
    }
    if (changed) setSnapshot({ ...simRef.current });
  }, [roamers]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const zones = zonesRef.current;
      if (zones.length === 0) return;
      for (const r of roamersRef.current) {
        const s = simRef.current[r.key];
        if (!s) continue;
        const zone = zones[Math.min(s.zone, zones.length - 1)];

        if (s.bubble && now >= s.bubbleUntil) s.bubble = null;

        if (now < s.pauseUntil) {
          s.frame = "idle";
          continue;
        }

        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist < ARRIVE_DIST) {
          const next = pickTarget(zone);
          s.tx = next.x;
          s.ty = next.y;
          s.pauseUntil = now + 600 + Math.random() * 2200;
          s.frame = "idle";
          // Stopping for a rest is a good moment to pipe up.
          if (chatterRef.current && !s.bubble && Math.random() < BUBBLE_CHANCE) {
            s.bubble = r.say ?? pickSound();
            s.bubbleUntil = now + BUBBLE_MS;
          }
          continue;
        }

        const step = r.speed * TICK_S;
        s.x += (dx / dist) * step;
        s.y += (dy / dist) * step;
        s.facingRight = dx >= 0;
        s.frameTimer += TICK_MS;
        if (s.frameTimer >= WALK_FRAME_INTERVAL_MS) {
          s.frameTimer = 0;
          s.frameToggle = s.frameToggle === 0 ? 1 : 0;
          s.frame = s.frameToggle === 0 ? "walk1" : "walk2";
        }
      }
      setSnapshot({ ...simRef.current });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Pet Corner has its own interactive yard, so keep the roaming margin
  // companions off that page — only the yard pets should show there.
  if (pathname === "/pets") return null;
  if (roamers.length === 0) return null;

  return (
    <>
      <div
        ref={containerRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      >
        {roamers.map((r) => {
          const s = snapshot[r.key];
          if (!s) return null;
          return (
            <div
              key={r.key}
              data-pet
              onClick={(e) => {
                e.stopPropagation();
                if (r.link) {
                  window.open(r.link, "_blank", "noopener,noreferrer");
                } else {
                  router.push("/pets");
                }
              }}
              title={r.link ? `${r.name} → ${r.link}` : `${r.name} — visit Pet Corner`}
              className="pointer-events-auto absolute left-0 top-0 flex cursor-pointer flex-col items-center"
              style={{ transform: `translate(${s.x}px, ${s.y}px)` }}
            >
              {s.bubble && (
                <span className="mb-0.5 rounded-full border border-border bg-card px-1.5 py-0.5 font-mono text-[9px] leading-none text-ink shadow-sm">
                  {s.bubble}
                </span>
              )}
              <CustomPetSprite
                frame={(s.frame === "walk2" ? r.frame2 : r.frame1) ?? r.frame1}
                pixelSize={PET_SIZE / 32}
                facingRight={s.facingRight}
              />
              <span className="mt-0.5 font-mono text-[9px] text-ink-soft">
                {r.name}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={toggleChatter}
        aria-pressed={chatter}
        title={chatter ? "Pet chatter on — click to mute" : "Pet chatter off — click to enable"}
        className="fixed bottom-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-sm shadow-sm hover:text-accent"
      >
        {chatter ? "💬" : "🔇"}
      </button>
    </>
  );
}
