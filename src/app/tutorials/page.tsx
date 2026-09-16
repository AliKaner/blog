import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { TopicsGrid } from "@/components/tutorials/TopicsGrid";

export default async function TutorialsPage() {
  const topics = await fetchQuery(api.tutorials.topics.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Tutorials</h1>
      <p className="mt-2 text-ink-soft">
        Videos and write-ups, grouped by topic.
      </p>
      <div className="mt-8">
        {topics.length === 0 ? (
          <p className="text-ink-soft">Nothing here yet.</p>
        ) : (
          <TopicsGrid topics={topics} />
        )}
      </div>
    </div>
  );
}
