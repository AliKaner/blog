import { ZoomableImage } from "@/components/ui/Lightbox";
import { toRoman } from "@/lib/roman";

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

/** Projects as catalogue entries: the cover hung as a framed print, then a
    numbered caption — title, a line of description, and quiet links. No
    card around it; the frame is the only edge. */
export function ProjectsGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2">
      {projects.map((project, index) => {
        const coverUrl = project.imageUrls?.[0];
        const links = [
          project.url ? { label: "Website", href: project.url } : null,
          project.githubUrl ? { label: "GitHub", href: project.githubUrl } : null,
          project.npmUrl ? { label: "npm", href: project.npmUrl } : null,
        ].filter((l): l is { label: string; href: string } => l !== null);

        return (
          <article key={project._id} className="flex flex-col">
            {coverUrl && (
              <ZoomableImage
                src={coverUrl}
                alt={project.title}
                className="frame aspect-[16/10] w-full object-cover object-top"
              />
            )}
            <div className="mt-4 flex flex-col">
              <span className="font-heading text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                No. {toRoman(index + 1)}
              </span>
              <h2 className="mt-1 font-heading text-lg text-ink">{project.title}</h2>
              {project.description && (
                <p className="mt-1 text-sm text-ink-soft">{project.description}</p>
              )}
              {links.length > 0 && (
                <p className="mt-3 flex flex-wrap items-baseline text-sm">
                  {links.map((link, i) => (
                    <span key={link.label} className="flex items-baseline">
                      {i > 0 && (
                        <span aria-hidden className="mx-2 text-accent/60">
                          ·
                        </span>
                      )}
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-ornate"
                      >
                        {link.label} <span aria-hidden>↗</span>
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
