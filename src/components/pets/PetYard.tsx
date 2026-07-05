"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PetSprite } from "./PetSprite";
import { CustomPetSprite } from "./CustomPetSprite";
import { myCustomPetIds } from "./PixelPetEditor";
import type { Frame, PetKind } from "./spriteData";
import type { Id } from "../../../convex/_generated/dataModel";

const PET_SIZE = 50;
const SPEED = 55; // px/sec
const ARRIVE_DIST = 6;
const EAT_DURATION_MS = 900;
const WALK_FRAME_INTERVAL_MS = 180;
const TICK_MS = 50;
const TICK_S = TICK_MS / 1000;

type Activity = "idle" | "walking" | "eating";

type SimState = {
  x: number;
  y: number;
  activity: Activity;
  targetX: number | null;
  targetY: number | null;
  targetFoodId: string | null;
  eatUntil: number;
  wanderUntil: number;
  facingRight: boolean;
  frame: Frame;
  frameToggle: 0 | 1;
  frameTimer: number;
};

type FoodItem = { id: string; x: number; y: number };

type UnifiedPet = {
  _id: string;
  name: string;
  hunger: number;
  happiness: number;
  totalFeeds: number;
  canFeedAt: number;
  origin: "builtin" | "custom";
  kind?: PetKind;
  frame1?: (string | null)[];
  frame2?: (string | null)[];
  published?: boolean;
};

function initialSim(width: number, height: number): SimState {
  return {
    x: Math.random() * Math.max(1, width - PET_SIZE),
    y: Math.random() * Math.max(1, height - PET_SIZE),
    activity: "idle",
    targetX: null,
    targetY: null,
    targetFoodId: null,
    eatUntil: 0,
    wanderUntil: 0,
    facingRight: true,
    frame: "idle",
    frameToggle: 0,
    frameTimer: 0,
  };
}

function stepPet(
  s: SimState,
  pet: UnifiedPet,
  now: number,
  foods: FoodItem[],
  claimed: Set<string>,
  yardSize: { width: number; height: number },
): { sim: SimState; ateFoodId?: string } {
  const next = { ...s };

  if (next.activity === "eating") {
    if (now >= next.eatUntil) {
      next.activity = "idle";
      next.frame = "idle";
      next.wanderUntil = now + 1200 + Math.random() * 2000;
    }
    return { sim: next };
  }

  if (next.targetX === null) {
    const offCooldown = now >= pet.canFeedAt;
    if (offCooldown) {
      let nearest: FoodItem | null = null;
      let nearestDist = Infinity;
      for (const food of foods) {
        if (claimed.has(food.id)) continue;
        const d = Math.hypot(food.x - next.x, food.y - next.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = food;
        }
      }
      if (nearest) {
        claimed.add(nearest.id);
        next.targetX = nearest.x - PET_SIZE / 2;
        next.targetY = nearest.y - PET_SIZE / 2;
        next.targetFoodId = nearest.id;
        next.activity = "walking";
      }
    }
    if (next.targetX === null && now >= next.wanderUntil) {
      next.targetX = Math.random() * Math.max(1, yardSize.width - PET_SIZE);
      next.targetY = Math.random() * Math.max(1, yardSize.height - PET_SIZE);
      next.targetFoodId = null;
      next.activity = "walking";
    }
  }

  if (next.targetX === null || next.targetY === null) {
    return { sim: next };
  }

  const dx = next.targetX - next.x;
  const dy = next.targetY - next.y;
  const dist = Math.hypot(dx, dy);

  if (dist < ARRIVE_DIST) {
    next.x = next.targetX;
    next.y = next.targetY;
    const ateFoodId = next.targetFoodId ?? undefined;
    if (ateFoodId) {
      next.activity = "eating";
      next.frame = "eat";
      next.eatUntil = now + EAT_DURATION_MS;
    } else {
      next.activity = "idle";
      next.frame = "idle";
      next.wanderUntil = now + 1000 + Math.random() * 2000;
    }
    next.targetX = null;
    next.targetY = null;
    next.targetFoodId = null;
    return { sim: next, ateFoodId };
  }

  const step = SPEED * TICK_S;
  next.x += (dx / dist) * step;
  next.y += (dy / dist) * step;
  next.facingRight = dx >= 0;
  next.frameTimer += TICK_MS;
  if (next.frameTimer >= WALK_FRAME_INTERVAL_MS) {
    next.frameTimer = 0;
    next.frameToggle = next.frameToggle === 0 ? 1 : 0;
    next.frame = next.frameToggle === 0 ? "walk1" : "walk2";
  }
  return { sim: next };
}

export function PetYard() {
  const builtinQuery = useQuery(api.pets.listPets);
  const approvedCustomQuery = useQuery(api.customPets.listApproved);
  const feedPet = useMutation(api.pets.feedPet);
  const feedCustomPet = useMutation(api.customPets.feedCustomPet);

  const [ownCustomIds, setOwnCustomIds] = useState<string[]>([]);
  useEffect(() => {
    // localStorage is a browser-only API, so reading it has to happen in
    // an effect rather than during render (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwnCustomIds(myCustomPetIds());
  }, []);
  const ownCustomQuery = useQuery(
    api.customPets.getByIds,
    ownCustomIds.length > 0
      ? { ids: ownCustomIds as Id<"customPets">[] }
      : "skip",
  );

  const allPets: UnifiedPet[] | undefined =
    builtinQuery && approvedCustomQuery
      ? (() => {
          const customMap = new Map<string, UnifiedPet>();
          for (const p of approvedCustomQuery) {
            customMap.set(p._id, {
              _id: p._id,
              name: p.name,
              hunger: p.hunger,
              happiness: p.happiness,
              totalFeeds: p.totalFeeds,
              canFeedAt: p.canFeedAt,
              origin: "custom",
              frame1: p.frame1,
              frame2: p.frame2,
              published: p.published,
            });
          }
          for (const p of ownCustomQuery ?? []) {
            customMap.set(p._id, {
              _id: p._id,
              name: p.name,
              hunger: p.hunger,
              happiness: p.happiness,
              totalFeeds: p.totalFeeds,
              canFeedAt: p.canFeedAt,
              origin: "custom",
              frame1: p.frame1,
              frame2: p.frame2,
              published: p.published,
            });
          }
          const builtin: UnifiedPet[] = builtinQuery.map((p) => ({
            _id: p._id,
            name: p.name,
            hunger: p.hunger,
            happiness: p.happiness,
            totalFeeds: p.totalFeeds,
            canFeedAt: p.canFeedAt,
            origin: "builtin" as const,
            kind: p.kind as PetKind,
          }));
          return [...builtin, ...customMap.values()];
        })()
      : undefined;

  const yardRef = useRef<HTMLDivElement>(null);
  const yardSizeRef = useRef({ width: 640, height: 300 });
  const petsRef = useRef<UnifiedPet[]>([]);
  const claimedFoodIds = useRef<Set<string>>(new Set());
  const feedInFlight = useRef<Set<string>>(new Set());
  const foodsRef = useRef<FoodItem[]>([]);

  // The authoritative simulation lives in a plain ref, mutated only from
  // inside the interval tick below — never from a setState updater. React
  // Strict Mode double-invokes functional setState updaters in dev to catch
  // impurities, which previously caused claim/eat side effects to fire
  // twice per real tick (double `feedPet` calls). `simSnapshot` exists only
  // to trigger a re-render; it's always a plain value set, never a
  // functional updater, so it can't be double-invoked.
  const simRef = useRef<Record<string, SimState>>({});
  const [simSnapshot, setSimSnapshot] = useState<Record<string, SimState>>({});
  const [foods, setFoods] = useState<FoodItem[]>([]);

  // Keep "latest value" mirrors for the interval tick to read without
  // restarting it on every render — updated after render, not during it.
  useEffect(() => {
    petsRef.current = allPets ?? [];
  });
  useEffect(() => {
    foodsRef.current = foods;
  });

  useEffect(() => {
    const el = yardRef.current;
    if (!el) return;
    const measure = () => {
      yardSizeRef.current = { width: el.clientWidth, height: el.clientHeight };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Seed simulation state the first time each shared pet shows up in the
  // Convex query — position/animation state is purely local per visitor.
  useEffect(() => {
    if (!allPets) return;
    let changed = false;
    for (const pet of allPets) {
      if (!simRef.current[pet._id]) {
        changed = true;
        const { width, height } = yardSizeRef.current;
        simRef.current[pet._id] = initialSim(width, height);
      }
    }
    if (changed) setSimSnapshot({ ...simRef.current });
  }, [allPets]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const eaten: { pet: UnifiedPet; foodId: string }[] = [];

      for (const pet of petsRef.current) {
        const s = simRef.current[pet._id];
        if (!s) continue;
        const result = stepPet(
          s,
          pet,
          now,
          foodsRef.current,
          claimedFoodIds.current,
          yardSizeRef.current,
        );
        simRef.current[pet._id] = result.sim;
        if (result.ateFoodId) {
          eaten.push({ pet, foodId: result.ateFoodId });
        }
      }
      setSimSnapshot({ ...simRef.current });

      if (eaten.length > 0) {
        setFoods((prev) =>
          prev.filter((f) => !eaten.some((e) => e.foodId === f.id)),
        );
        for (const { pet, foodId } of eaten) {
          claimedFoodIds.current.delete(foodId);
          if (!feedInFlight.current.has(pet._id)) {
            feedInFlight.current.add(pet._id);
            const call =
              pet.origin === "builtin"
                ? feedPet({ petId: pet._id as Id<"pets"> })
                : feedCustomPet({ petId: pet._id as Id<"customPets"> });
            call
              .catch(() => {})
              .finally(() => feedInFlight.current.delete(pet._id));
          }
        }
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [feedPet, feedCustomPet]);

  const handleYardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = yardRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFoods((prev) => [...prev, { id: generateFoodId(), x, y }]);
  }, []);

  if (!allPets) {
    return <p className="text-ink-soft">Loading pets…</p>;
  }

  return (
    <div>
      <div
        ref={yardRef}
        onClick={handleYardClick}
        className="relative h-[320px] w-full cursor-crosshair overflow-hidden border border-border"
        style={{
          backgroundColor: "#0e0d1a",
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 4px)",
          boxShadow: "6px 6px 0 0 var(--accent)",
        }}
      >
        {foods.map((food) => (
          <div
            key={food.id}
            className="absolute h-3 w-3 rounded-full"
            style={{
              left: food.x - 6,
              top: food.y - 6,
              backgroundColor: "var(--accent-2)",
              boxShadow: "0 0 8px 2px var(--accent-2)",
            }}
          />
        ))}
        {allPets.map((pet) => {
          const s = simSnapshot[pet._id];
          return (
            <div
              key={pet._id}
              className="absolute left-0 top-0 flex flex-col items-center"
              style={{ transform: `translate(${s?.x ?? 0}px, ${s?.y ?? 0}px)` }}
            >
              {pet.origin === "builtin" ? (
                <PetSprite
                  kind={pet.kind!}
                  frame={s?.frame ?? "idle"}
                  facingRight={s?.facingRight ?? true}
                />
              ) : (
                <CustomPetSprite
                  frame={
                    (s?.frame === "walk2" ? pet.frame2 : pet.frame1) ??
                    pet.frame1 ??
                    []
                  }
                  pixelSize={PET_SIZE / 32}
                  facingRight={s?.facingRight ?? true}
                />
              )}
              <p className="font-mono text-[10px] text-ink-soft">
                {pet.name}
                {pet.origin === "custom" && !pet.published && " (pending)"}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-ink-soft">
        Click anywhere in the yard to drop food.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {allPets.map((pet) => (
          <div
            key={pet._id}
            className="panel-sm p-3"
          >
            <p className="font-heading text-ink">
              {pet.name}
              {pet.origin === "custom" && !pet.published && (
                <span className="ml-2 font-mono text-xs text-accent-2">
                  pending
                </span>
              )}
            </p>
            <StatBar label="Hunger" value={pet.hunger} />
            <StatBar label="Happiness" value={pet.happiness} />
            <p className="mt-1 font-mono text-xs text-ink-soft">
              Fed {pet.totalFeeds} time{pet.totalFeeds === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

let idCounter = 0;
function generateFoodId(): string {
  idCounter += 1;
  return `${Date.now()}-${idCounter}`;
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-1">
      <div className="flex justify-between font-mono text-[10px] text-ink-soft">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full border border-border bg-paper">
        <div className="h-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
