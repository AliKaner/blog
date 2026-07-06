import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES = [
  "",
  "/journey",
  "/cv",
  "/movies",
  "/places",
  "/books",
  "/dev-log",
  "/posts",
  "/pets",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [movies, places, books, softwareLogs, posts] = await Promise.all([
    fetchQuery(api.movies.list, {}),
    fetchQuery(api.places.list, {}),
    fetchQuery(api.books.list, {}),
    fetchQuery(api.softwareLogs.list, {}),
    fetchQuery(api.posts.list, {}),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...movies.map((m) => ({
      url: `${SITE_URL}/movies/${m.slug}`,
      lastModified: new Date(m.updatedAt),
    })),
    ...places.map((p) => ({
      url: `${SITE_URL}/places/${p.slug}`,
      lastModified: new Date(p.updatedAt),
    })),
    ...books.map((b) => ({
      url: `${SITE_URL}/books/${b.slug}`,
      lastModified: new Date(b.updatedAt),
    })),
    ...softwareLogs.map((l) => ({
      url: `${SITE_URL}/dev-log/${l.slug}`,
      lastModified: new Date(l.updatedAt),
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/posts/${p.slug}`,
      lastModified: new Date(p.updatedAt),
    })),
  ];

  return [...staticEntries, ...dynamicEntries];
}
