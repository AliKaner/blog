import { CocktailGlassIcon } from "./CocktailGlassIcon";

/** Renders a 1-10 rating as up to 5 filled cocktail-glass icons. */
export function RatingGlasses({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating / 2)));
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <CocktailGlassIcon
            key={i}
            className={
              i < filled
                ? "h-3.5 w-3.5 text-accent"
                : "h-3.5 w-3.5 text-border"
            }
          />
        ))}
      </div>
      <span className="font-mono text-xs text-ink-soft">{rating}/10</span>
    </div>
  );
}
