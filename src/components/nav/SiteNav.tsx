import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/places", label: "Places" },
  { href: "/books", label: "Books" },
  { href: "/dev-log", label: "Dev Log" },
  { href: "/posts", label: "Posts" },
  { href: "/pets", label: "Pet Corner" },
];

export function SiteNav() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-baseline gap-x-5 gap-y-2 px-6 py-5">
        <Link href="/" className="font-heading text-lg font-semibold text-ink no-underline">
          alikaner
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LINKS.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-soft no-underline hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
