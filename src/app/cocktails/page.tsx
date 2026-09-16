import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { CocktailTicketGrid } from "@/components/cocktails/CocktailTicketGrid";

export default async function CocktailsPage() {
  const cocktails = await fetchQuery(api.cocktails.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Cocktail Reviews</h1>
      <p className="mt-2 text-ink-soft">
        Tasting notes from the home bar, one tab at a time.
      </p>
      <div className="mt-8">
        {cocktails.length === 0 ? (
          <p className="text-ink-soft">No cocktails logged yet.</p>
        ) : (
          <CocktailTicketGrid cocktails={cocktails} />
        )}
      </div>
    </div>
  );
}
