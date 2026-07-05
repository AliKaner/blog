import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { FeedCard } from "@/components/feed/FeedCard";

export default async function DevLogPage() {
  const logs = await fetchQuery(api.softwareLogs.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Dev Log</h1>
      <div className="mt-8 flex flex-col gap-4">
        {logs.length === 0 && (
          <p className="text-ink-soft">No entries yet.</p>
        )}
        {logs.map((l) => (
          <FeedCard
            key={l._id}
            type="softwareLog"
            slug={l.slug}
            title={l.title}
            date={l.loggedAt}
            excerpt={l.body.slice(0, 160)}
          />
        ))}
      </div>
    </div>
  );
}
