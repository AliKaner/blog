import Link from "next/link";
import { formatDate } from "@/lib/format";
import { CocktailGlassIcon } from "./CocktailGlassIcon";
import { RatingGlasses } from "./RatingGlasses";

type Cocktail = {
  _id: string;
  title: string;
  slug: string;
  baseSpirit?: string | null;
  ingredients?: string[] | null;
  rating?: number | null;
  imageUrl?: string | null;
  triedAt: number;
};

// Small deterministic tilt per card (no Math.random, so SSR/CSR markup
// matches) — alternates the "pinned bar tab" feel across the grid.
const TILTS = [-1.4, 0.9, -0.6, 1.2, -1, 0.6];

export function CocktailTicketGrid({ cocktails }: { cocktails: Cocktail[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {cocktails.map((cocktail, i) => {
        const shownIngredients = cocktail.ingredients?.slice(0, 4) ?? [];
        const extraCount = (cocktail.ingredients?.length ?? 0) - shownIngredients.length;

        return (
          <Link
            key={cocktail._id}
            href={`/cocktails/${cocktail.slug}`}
            className="no-underline"
          >
            <div
              className="ticket flex h-full flex-col overflow-hidden"
              style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` } as React.CSSProperties}
            >
              <div className="relative aspect-square w-full shrink-0 bg-paper">
                {cocktail.imageUrl ? (
                  // Full photo, never cropped — a portrait glass shot loses
                  // its rim/garnish under object-cover, so letterbox it
                  // instead of cutting it down to a thin cover-fit sliver.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cocktail.imageUrl}
                    alt={cocktail.title}
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <CocktailGlassIcon className="h-10 w-10 text-border" />
                  </div>
                )}
                {cocktail.baseSpirit && (
                  <span className="absolute left-2 top-2 border border-accent-2 bg-paper/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent-2">
                    {cocktail.baseSpirit}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="font-heading text-lg leading-snug text-ink">
                  {cocktail.title}
                </p>
                {typeof cocktail.rating === "number" && (
                  <RatingGlasses rating={cocktail.rating} />
                )}
                {shownIngredients.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {shownIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="rounded-sm border border-border bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-soft"
                      >
                        {ing}
                      </span>
                    ))}
                    {extraCount > 0 && (
                      <span className="px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                )}
                <p className="mt-auto pt-2 text-right font-mono text-[10px] uppercase tracking-wide text-accent">
                  {formatDate(cocktail.triedAt)}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
