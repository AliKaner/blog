/** URL slug from free text: lowercase ASCII words joined by hyphens.
    Handles Turkish and other accented letters ("Şahsiyet Ağacı" →
    "sahsiyet-agaci"). */
export function slugify(text: string): string {
  return text
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Max rows one import call may carry, so each call stays well inside a
    single Convex transaction. */
export const IMPORT_BATCH_LIMIT = 200;
