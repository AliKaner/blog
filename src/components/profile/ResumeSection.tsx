import { formatMonthYear } from "@/lib/format";
import { Markdown } from "../Markdown";

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
            {item.stack && item.stack.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-mono text-ink-soft uppercase tracking-wider mr-1">Stack:</span>
                {item.stack.map((tech) => (
                  <span key={tech} className="rounded-sm bg-card border border-border px-2 py-0.5 text-ink-soft font-mono">
                    {tech}
                  </span>
                ))}
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
