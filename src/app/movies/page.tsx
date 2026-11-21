import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { CollectionStats } from "@/components/feed/CollectionStats";
import { ListFilters } from "@/components/feed/ListFilters";
import { MoviesTimeline } from "@/components/feed/LoadMoreTimeline";
import { knownTotal, parseListParams, toQueryArgs } from "@/lib/listParams";
import { PAGE_SIZE } from "@/lib/pagination";
import { sectionMetadata } from "@/lib/seo";

export const metadata = sectionMetadata("/movies");

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams);
  const args = toQueryArgs(params);

  // Only the first page of the current view and the precomputed summary —
  // never every film.
  const [firstPage, stats] = await Promise.all([
    fetchQuery(api.movies.page, { ...args, paginationOpts: { numItems: PAGE_SIZE, cursor: null } }),
    fetchQuery(api.stats.get, { kind: "movies" }),
  ]);
  const empty = firstPage.page.length === 0 && Object.keys(args).length === 0;

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Movies</h1>
      <div className="mt-8">
        {empty ? (
          <p className="text-ink-soft">No movies logged yet.</p>
        ) : (
          <>
            <CollectionStats stats={stats} noun="films" />
            <div className="mt-10">
              <ListFilters params={params} noun="films" />
            </div>
            <div className="mt-10">
              <MoviesTimeline initial={firstPage.page} total={knownTotal(params, stats)} args={args} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
