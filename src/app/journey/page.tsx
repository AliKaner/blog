import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { JourneyHeatmap } from "@/components/feed/JourneyHeatmap";
import { JourneyFeed } from "@/components/feed/JourneyFeed";
import { JOURNEY_PAGE } from "@/lib/pagination";
import { sectionMetadata } from "@/lib/seo";

export const metadata = sectionMetadata("/journey");

const WEEK = 7 * 86_400_000;

function currentTimestamp() {
  return Date.now();
}

/** ?week=<start of week, ms UTC> — a week picked in the heatmap. */
function parseWeek(raw: string | string[] | undefined): number | null {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default async function JourneyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const week = parseWeek((await searchParams).week);
  // The list starts at the end of the chosen week, or at the newest entry.
  const cursor = week === null ? null : { date: week + WEEK - 1, seen: [] };
  const [weeks, first] = await Promise.all([
    fetchQuery(api.journey.weeks, {}),
    fetchQuery(api.journey.page, { cursor, limit: JOURNEY_PAGE }),
  ]);
  const now = currentTimestamp();

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">The Journey</h1>
      <p className="mt-2 text-ink-soft">
        Movies watched, places visited, books read, and everything else
        along the way.
      </p>

      {first.items.length === 0 && week === null ? (
        <p className="mt-8 text-ink-soft">
          Nothing published yet — check back soon.
        </p>
      ) : (
        <>
          {weeks.length > 0 && (
            <div className="mt-8 border-b border-border pb-8">
              <JourneyHeatmap weeks={weeks} now={now} selectedWeek={week} />
            </div>
          )}
          <div className="mt-8">
            {/* Remount on a new week so the list starts over from it. */}
            <JourneyFeed key={week ?? "latest"} first={first} week={week} />
          </div>
        </>
      )}
    </div>
  );
}
