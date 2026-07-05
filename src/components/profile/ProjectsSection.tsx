type Project = {
  _id: string;
  title: string;
  slug: string;
  description?: string | null;
  imageUrls?: (string | null)[];
  url?: string | null;
};

export function ProjectsSection({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="border-b border-border py-8">
      <h2 className="font-heading text-lg text-ink">Projects</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const coverUrl = project.imageUrls?.[0];
          const card = (
            <div className="panel flex h-full flex-col">
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
                  <p className="text-sm text-ink-soft">
                    {project.description}
                  </p>
                )}
                {project.url && (
                  <span className="mt-1 font-mono text-xs text-accent">
                    Visit ↗
                  </span>
                )}
              </div>
            </div>
          );
          return project.url ? (
            <a
              key={project._id}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              {card}
            </a>
          ) : (
            <div key={project._id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
