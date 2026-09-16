import { toEmbedUrl } from "@/lib/video";

export function VideoPlayer({
  videoUrl,
  videoFileUrl,
}: {
  videoUrl?: string | null;
  videoFileUrl?: string | null;
}) {
  if (videoFileUrl) {
    return (
      <video
        src={videoFileUrl}
        controls
        className="w-full border border-border bg-paper"
      />
    );
  }

  if (videoUrl) {
    const embed = toEmbedUrl(videoUrl);
    if (embed) {
      return (
        <div className="relative aspect-video w-full overflow-hidden border border-border bg-paper">
          <iframe
            src={embed}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      );
    }
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn inline-block px-4 py-2 text-sm no-underline"
      >
        Watch video ↗
      </a>
    );
  }

  return null;
}
