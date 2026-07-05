type ProfileData = {
  name: string;
  title?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  letterboxdUrl?: string | null;
  tiktokUrl?: string | null;
  mediumUrl?: string | null;
};

const LINKS: { key: keyof ProfileData; label: string }[] = [
  { key: "linkedinUrl", label: "LinkedIn" },
  { key: "githubUrl", label: "GitHub" },
  { key: "letterboxdUrl", label: "Letterboxd" },
  { key: "tiktokUrl", label: "TikTok" },
  { key: "mediumUrl", label: "Medium" },
];

export function ProfileHeader({ profile }: { profile: ProfileData | null }) {
  if (!profile) return null;

  const links = LINKS.filter((l) => profile[l.key]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="font-heading text-3xl text-ink">{profile.name}</h1>
        {profile.title && (
          <p className="mt-1 font-mono text-sm text-ink-soft">
            {profile.title}
          </p>
        )}
      </div>
      {profile.bio && (
        <p className="max-w-2xl text-ink-soft">{profile.bio}</p>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <a
              key={l.key}
              href={profile[l.key] as string}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-3 py-1 text-sm text-ink-soft no-underline hover:border-accent hover:text-accent"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
