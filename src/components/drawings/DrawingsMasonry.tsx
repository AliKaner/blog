import { ZoomableImage } from "@/components/ui/Lightbox";

type Drawing = {
  _id: string;
  title?: string | null;
  imageUrl?: string | null;
};

export function DrawingsMasonry({ drawings }: { drawings: Drawing[] }) {
  return (
    <div className="columns-2 gap-4 sm:columns-3 [column-fill:_balance]">
      {drawings.map((drawing) => {
        if (!drawing.imageUrl) return null;
        return (
          <div key={drawing._id} className="mb-4 break-inside-avoid">
            <div className="group relative overflow-hidden border border-border bg-card">
              <ZoomableImage
                src={drawing.imageUrl}
                alt={drawing.title || "Drawing"}
                className="block w-full"
              />
              {drawing.title && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-paper/90 to-transparent p-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <p className="font-mono text-xs text-ink">
                    {drawing.title}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
