import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";

export default async function HomePage() {
  const profile = await fetchQuery(api.profile.get, {});

  return (
    <div>
      <ProfileHeader profile={profile} />
      <div className="mt-10">
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
