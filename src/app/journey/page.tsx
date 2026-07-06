import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { JourneyHeatmap } from "@/components/feed/JourneyHeatmap";
import { JourneyTimeline } from "@/components/feed/JourneyTimeline";

function currentTimestamp() {
  return Date.now();
}

export default async function JourneyPage() {
  const feed = await fetchQuery(api.feed.getFeed, {});
  const now = currentTimestamp();

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">The Journey</h1>
      <p className="mt-2 text-ink-soft">
        Movies watched, places visited, books read, and everything else
        along the way.
      </p>

      {feed.length === 0 ? (
        <p className="mt-8 text-ink-soft">
          Nothing published yet — check back soon.
        </p>
      ) : (
        <>
          <div className="mt-8 border-b border-border pb-8">
            <JourneyHeatmap items={feed} now={now} />
          </div>
          <div className="mt-8">
            <JourneyTimeline items={feed} variant="plain" />
          </div>
        </>
      )}
    </div>
  );
}
