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

/**
 * The bar shelf: small upright plates, one framed square per drink, with
 * a short caption under it — title, rating glasses, then spirit, a line of
 * ingredients and the date. Same rhythm as the Movies/Books wall.
 */
export function CocktailTicketGrid({ cocktails }: { cocktails: Cocktail[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {cocktails.map((cocktail) => (
        <Link key={cocktail._id} href={`/cocktails/${cocktail.slug}`} className="group block no-underline">
          <div className="frame frame-sm relative aspect-square w-full overflow-hidden transition-[filter] duration-200 group-hover:brightness-105">
            {cocktail.imageUrl ? (
              // Whole photo, never cropped: a portrait glass shot would lose
              // its rim and garnish under object-cover.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cocktail.imageUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <CocktailGlassIcon className="h-8 w-8 text-accent/40" />
              </div>
            )}
          </div>

          <p className="mt-2 line-clamp-2 font-heading text-[15px] leading-tight text-ink transition-colors group-hover:text-accent">
            {cocktail.title}
          </p>
          {typeof cocktail.rating === "number" && (
            <div className="mt-1">
              <RatingGlasses rating={cocktail.rating} />
            </div>
          )}
          {cocktail.ingredients && cocktail.ingredients.length > 0 && (
            <p className="mt-1 line-clamp-1 font-accent text-[13px] italic text-ink-soft">
              {cocktail.ingredients.join(", ")}
            </p>
          )}
          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wide text-ink-soft">
            {[cocktail.baseSpirit, formatDate(cocktail.triedAt)].filter(Boolean).join(" · ")}
          </p>
        </Link>
      ))}
    </div>
  );
}
