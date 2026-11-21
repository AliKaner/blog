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
          <p className="mt-1 font-accent text-xl italic text-ink-soft">
            {profile.title}
          </p>
        )}
      </div>
      {profile.bio && (
        <p className="max-w-2xl text-ink-soft">{profile.bio}</p>
      )}
      {/* A row of rosettes; each opens into its label on hover. */}
      {links.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {links.map((l) => (
            <a
              key={l.key}
              href={profile[l.key] as string}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orb"
              aria-label={`${l.label} (opens in a new tab)`}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
