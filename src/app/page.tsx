import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { JourneyTimeline } from "@/components/feed/JourneyTimeline";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ResumeSection } from "@/components/profile/ResumeSection";
import { ProjectsSection } from "@/components/profile/ProjectsSection";

export default async function HomePage() {
  const [feed, profile, resumeItems, projects] = await Promise.all([
    fetchQuery(api.feed.getFeed, {}),
    fetchQuery(api.profile.get, {}),
    fetchQuery(api.resumeItems.list, {}),
    fetchQuery(api.projects.list, {}),
  ]);

  return (
    <div>
      <ProfileHeader profile={profile} />
      <ResumeSection items={resumeItems} />
      <ProjectsSection projects={projects} />

      <div className="pt-8">
        <h2 className="font-heading text-2xl text-ink">The Journey</h2>
        <p className="mt-2 text-ink-soft">
          Movies watched, places visited, books read, and everything else
          along the way.
        </p>

        <div className="mt-8">
          {feed.length === 0 ? (
            <p className="text-ink-soft">
              Nothing published yet — check back soon.
            </p>
          ) : (
            <JourneyTimeline items={feed} />
          )}
        </div>
      </div>
    </div>
  );
}
