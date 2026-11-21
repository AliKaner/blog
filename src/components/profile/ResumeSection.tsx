import { formatMonthYear } from "@/lib/format";
import { Markdown } from "../Markdown";

type SubProject = {
  name: string;
  url?: string | null;
  imageUrl?: string | null;
};

type ResumeItem = {
  _id: string;
  kind: "experience" | "education";
  title: string;
  organization: string;
  startDate: number;
  endDate?: number | null;
  description?: string | null;
  url?: string | null;
  logoUrl?: string | null;
  stack?: string[] | null;
  projects?: SubProject[] | null;
};

export function ResumeSection({ items }: { items: ResumeItem[] }) {
  const experience = items.filter((i) => i.kind === "experience");
  const education = items.filter((i) => i.kind === "education");

  if (experience.length === 0 && education.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 border-b border-border py-8">
      <ResumeColumn title="Experience" items={experience} />
      <ResumeColumn title="Education" items={education} />
    </div>
  );
}

function ResumeColumn({
  title,
  items,
}: {
  title: string;
  items: ResumeItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="font-heading text-lg text-ink">{title}</h2>
      <div className="mt-4 flex flex-col gap-6">
        {items.map((item) => (
          <div key={item._id} className="flex flex-col">
            <p className="font-mono text-xs uppercase tracking-wide text-accent">
              {formatMonthYear(item.startDate)} –{" "}
              {item.endDate ? formatMonthYear(item.endDate) : "Present"}
            </p>
            <p className="mt-0.5 text-ink">{item.title}</p>
            <OrganizationLine item={item} />
            {item.description && (
              <div className="mt-2 text-sm text-ink-soft">
                <Markdown>{item.description}</Markdown>
              </div>
            )}
            {/* Stack reads like the "medium" line on a museum label. */}
            {item.stack && item.stack.length > 0 && (
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <SmallLabel>Stack</SmallLabel>
                <span className="font-accent text-base italic text-ink">
                  {item.stack.map((tech, i) => (
                    <span key={tech}>
                      {i > 0 && (
                        <span aria-hidden className="mx-1.5 text-accent/60">
                          ·
                        </span>
                      )}
                      {tech}
                    </span>
                  ))}
                </span>
              </p>
            )}
            {item.projects && item.projects.length > 0 && (
              <div className="mt-5">
                <SmallLabel>Projects</SmallLabel>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-5">
                  {item.projects.map((project, i) => (
                    <SubProjectPlate key={i} project={project} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrganizationLine({ item }: { item: ResumeItem }) {
  const content = (
    <span className="flex items-center gap-2">
      {item.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.logoUrl}
          alt={`${item.organization} logo`}
          className="h-5 w-5 rounded-sm border border-border object-cover"
        />
      )}
      <span className="text-sm text-ink-soft">{item.organization}</span>
    </span>
  );

  if (!item.url) return content;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-block w-fit no-underline"
      title={`Visit ${item.organization} website`}
    >
      <span className="flex items-center gap-2">
        {item.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.logoUrl}
            alt={`${item.organization} logo`}
            className="h-5 w-5 rounded-sm border border-border object-cover transition-colors group-hover:border-accent"
          />
        )}
        <span className="text-sm text-ink-soft transition-colors group-hover:text-accent">
          {item.organization}
        </span>
      </span>
    </a>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-heading text-[11px] uppercase tracking-[0.18em] text-ink-soft">
      {children}
    </span>
  );
}

/** A project screenshot hung like a small print, its name as the plate
    caption underneath. */
function SubProjectPlate({ project }: { project: SubProject }) {
  const inner = (
    <figure className="group flex w-44 flex-col">
      {project.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.imageUrl}
          alt={project.name}
          className="frame frame-sm h-24 w-full object-cover object-top transition-[filter] duration-200 group-hover:brightness-105"
        />
      )}
      <figcaption className="mt-2 text-center font-accent text-sm italic text-ink transition-colors group-hover:text-accent">
        {project.name}
        {project.url && (
          <span aria-hidden className="ml-1 not-italic text-accent/70">
            ↗
          </span>
        )}
      </figcaption>
    </figure>
  );

  if (!project.url) return inner;

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline"
      aria-label={`${project.name} (opens in a new tab)`}
    >
      {inner}
    </a>
  );
}
