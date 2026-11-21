import { ZoomableImage } from "@/components/ui/Lightbox";
import { toRoman } from "@/lib/roman";

type Drawing = {
  _id: string;
  title?: string | null;
  imageUrl?: string | null;
};

/** A print-room wall: each sketch framed, with a numbered plate caption
    beneath it ("Pl. III — Title"), always visible rather than on hover. */
export function DrawingsMasonry({ drawings }: { drawings: Drawing[] }) {
  const hung = drawings.filter(
    (d): d is Drawing & { imageUrl: string } => Boolean(d.imageUrl),
  );

  return (
    <div className="columns-2 gap-8 sm:columns-3 [column-fill:_balance]">
      {hung.map((drawing, index) => (
        <figure key={drawing._id} className="mb-10 break-inside-avoid">
          <ZoomableImage
            src={drawing.imageUrl}
            alt={drawing.title || `Drawing ${index + 1}`}
            className="frame block w-full"
          />
          <figcaption className="mt-3 text-center">
            <span className="block font-heading text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Pl. {toRoman(index + 1)}
            </span>
            {drawing.title && (
              <span className="block font-accent text-base italic text-ink">
                {drawing.title}
              </span>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
