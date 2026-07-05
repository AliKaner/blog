import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";

export default async function HomePage() {
  const profile = await fetchQuery(api.profile.get, {});

  return (
    <div>
      <ProfileHeader profile={profile} />
    </div>
  );
}
