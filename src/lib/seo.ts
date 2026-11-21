import type { Metadata } from "next";
import sectionMeta from "./sectionMeta.json";

export const AUTHOR = "Ali Kaner";

/**
 * Metadata for a top-level section page, from src/lib/sectionMeta.json.
 * Sets the canonical URL and og:url here, per page, rather than in the
 * root layout — otherwise pages without their own (post detail pages, …)
 * would inherit the home page as their canonical. The share image comes
 * from the segment's opengraph-image.png (scripts/make-og.mjs).
 */
export function sectionMetadata(href: string): Metadata {
  const section = sectionMeta.sections.find((s) => s.href === href);
  if (!section) throw new Error(`No section metadata for ${href}`);
  const title = section.title;
  const description = section.description;
  return {
    title,
    description,
    alternates: { canonical: href },
    openGraph: {
      type: "website",
      siteName: AUTHOR,
      locale: "en_US",
      url: href,
      title: `${title} · ${AUTHOR}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${AUTHOR}`,
      description,
    },
  };
}
