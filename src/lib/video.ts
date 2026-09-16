/** Turns a YouTube/Vimeo URL into an embeddable iframe src, or null if the
 * link isn't a recognized video host (caller should fall back to a plain
 * link in that case). */
export function toEmbedUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com") {
    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
    const match = u.pathname.match(/^\/(shorts|embed|live)\/([^/?]+)/);
    if (match) return `https://www.youtube.com/embed/${match[2]}`;
    return null;
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}
