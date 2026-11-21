import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";

// Deliberately sparse: just the intro, centred vertically so the page reads
// as a calm landing rather than a header with nothing under it. Everything
// else is one click away in the nav rail.
export default async function HomePage() {
  const profile = await fetchQuery(api.profile.get, {});

  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col justify-center">
      <ProfileHeader profile={profile} />
      <div className="mt-8">
        <Link
          href="/projects"
          className="btn inline-block px-4 py-2 text-sm no-underline"
        >
          Personal Projects →
        </Link>
      </div>
    </div>
  );
}
