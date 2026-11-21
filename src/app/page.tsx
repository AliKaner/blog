import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SITE_URL } from "@/lib/site";
import { AUTHOR } from "@/lib/seo";
import sectionMeta from "@/lib/sectionMeta.json";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: `${AUTHOR} — Senior Fullstack Developer`,
    description: sectionMeta.home.description,
  },
  twitter: {
    title: `${AUTHOR} — Senior Fullstack Developer`,
    description: sectionMeta.home.description,
  },
};

// Deliberately sparse: just the intro, centred vertically so the page reads
// as a calm landing rather than a header with nothing under it. Everything
// else is one click away in the nav rail.
export default async function HomePage() {
  const profile = await fetchQuery(api.profile.get, {});

  // Who this site is about, for search engines: name, role, and the
  // profiles it links to.
  const sameAs = profile
    ? [
        profile.linkedinUrl,
        profile.githubUrl,
        profile.letterboxdUrl,
        profile.tiktokUrl,
        profile.mediumUrl,
      ].filter((url): url is string => Boolean(url))
    : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile?.name ?? AUTHOR,
    jobTitle: profile?.title ?? "Senior Fullstack Developer",
    url: SITE_URL,
    ...(profile?.bio ? { description: profile.bio } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col justify-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProfileHeader profile={profile} />
    </div>
  );
}
