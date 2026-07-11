type Project = {
  _id: string;
  title: string;
  slug: string;
  description?: string | null;
  imageUrls?: (string | null)[];
  url?: string | null;
  githubUrl?: string | null;
  npmUrl?: string | null;
};

export function ProjectsSection({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="border-b border-border py-8">
      <h2 className="font-heading text-lg text-ink">Projects</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const coverUrl = project.imageUrls?.[0];
          const links = [
            project.url ? { label: "Website ↗", href: project.url } : null,
            project.githubUrl
              ? { label: "GitHub ↗", href: project.githubUrl }
              : null,
            project.npmUrl ? { label: "npm ↗", href: project.npmUrl } : null,
          ].filter((l): l is { label: string; href: string } => l !== null);

          return (
            <div key={project._id} className="panel flex h-full flex-col">
              {coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={project.title}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-1 p-4">
                <p className="text-ink">{project.title}</p>
                {project.description && (
                  <p className="text-sm text-ink-soft">{project.description}</p>
                )}
                {links.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    {links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-border px-2 py-0.5 font-mono text-xs text-accent no-underline hover:border-accent"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
