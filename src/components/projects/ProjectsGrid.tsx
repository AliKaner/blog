import { Fragment } from "react";
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

/* At rest a screenshot is printed in the house burgundy, like the plates
   in the gutter: the picture goes grey and a burgundy wash laid over it
   in "color" blend takes its hue. Pointing at the entry lifts the wash and
   brings the screenshot's own colours back. */
/* Between entries, a small piece of sculpture cut from the engravings
   (scripts/cut-fragments.mjs), a different one at each gap. */
const DIVIDERS = ["medusa-right", "atlas", "griffins", "shield-boss", "masks", "plinth-rose", "ram-capital"];

const PRINTED = "grayscale group-hover:grayscale-0 group-focus-within:grayscale-0 transition-[filter] duration-500";

/** Projects as a catalogue: each entry a numbered plate beside its
    caption, sides alternating down the page, a sculpture fragment
    between entries. */
export function ProjectsGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="flex flex-col">
      {projects.map((project, index) => {
        const coverUrl = project.imageUrls?.[0];
        const flip = index % 2 === 1;
        const links = [
          project.url ? { label: "Website", href: project.url } : null,
          project.githubUrl ? { label: "GitHub", href: project.githubUrl } : null,
          project.npmUrl ? { label: "npm", href: project.npmUrl } : null,
        ].filter((l): l is { label: string; href: string } => l !== null);

        return (
          <Fragment key={project._id}>
            {index > 0 && (
              <div aria-hidden className="my-10 flex items-center gap-4">
                <span className="h-[3px] flex-1 border-y border-border" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/decor/fragments/${DIVIDERS[(index - 1) % DIVIDERS.length]}.webp`}
                  alt=""
                  className="h-12 w-auto max-w-none opacity-90 sm:h-14"
                />
                <span className="h-[3px] flex-1 border-y border-border" />
              </div>
            )}

            <article
              className={`group grid grid-cols-1 items-center gap-x-8 gap-y-5 ${
                flip ? "sm:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]" : "sm:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]"
              }`}
            >
              {coverUrl ? (
                <div className={`relative ${flip ? "sm:order-2" : ""}`}>
                  <ZoomableImage
                    src={coverUrl}
                    alt={project.title}
                    className={`frame aspect-[16/10] w-full object-cover object-top ${PRINTED}`}
                  />
                  {/* The wash sits inside the mat (the frame's 6px padding). */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-[7px] bg-accent opacity-60 mix-blend-color transition-opacity duration-500 group-hover:opacity-0 group-focus-within:opacity-0"
                  />
                </div>
              ) : (
                <div
                  className={`frame flex aspect-[16/10] w-full items-center justify-center p-4 text-center font-heading text-sm uppercase tracking-[0.2em] text-accent/60 ${
                    flip ? "sm:order-2" : ""
                  }`}
                >
                  {project.title}
                </div>
              )}

              <div className={`flex flex-col ${flip ? "sm:order-1 sm:items-end sm:text-right" : ""}`}>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  Tav. {toRoman(index + 1)}
                </span>
                <h2 className="mt-1 font-heading text-xl uppercase tracking-[0.08em] text-ink transition-colors group-hover:text-accent">
                  {project.title}
                </h2>
                {project.description && (
                  <p className="mt-2 max-w-[34ch] font-accent text-lg italic leading-snug text-ink-soft">
                    {project.description}
                  </p>
                )}
                {links.length > 0 && (
                  <p className="mt-4 flex flex-wrap items-baseline text-sm">
                    {links.map((link, i) => (
                      <span key={link.label} className="flex items-baseline">
                        {i > 0 && (
                          <span aria-hidden className="mx-2 text-accent/60">
                            ·
                          </span>
                        )}
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className="link-ornate">
                          {link.label} <span aria-hidden>↗</span>
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </article>
          </Fragment>
        );
      })}
    </div>
  );
}
