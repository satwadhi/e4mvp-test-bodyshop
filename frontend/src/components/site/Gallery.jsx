import { useState } from "react";
import { Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SectionHead } from "@/components/site/Services";

export default function Gallery({ items = [] }) {
  const [active, setActive] = useState(null);
  return (
    <section id="gallery" className="scroll-mt-24 py-24 sm:py-32 bg-[#121418]" data-testid="gallery-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="02 / Our work" title="Gallery" sub="A look at recent repairs and refinishes. Tap any photo to enlarge." />
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[260px] sm:auto-rows-[300px]">
          {items.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActive(g)}
              className={`group relative overflow-hidden bg-[#0B0C0E] text-left ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
              data-testid={`gallery-image-item-${i}`}
            >
              <img
                src={g.url}
                alt={g.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E]/90 via-transparent to-transparent" />
              {g.is_sample && (
                <span className="absolute left-3 top-3 bg-[#0B0C0E]/80 px-2 py-1 font-mono-ui text-[10px] uppercase tracking-widest text-[#FF9500]">
                  Sample
                </span>
              )}
              <Expand className="absolute right-4 top-4 h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 p-5">
                <p className="font-mono-ui text-[10px] uppercase tracking-widest text-[#FF3B30]">{g.category}</p>
                <p className="mt-1 font-display text-2xl font-bold uppercase">{g.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-[#0B0C0E] border-[#272A34] overflow-hidden" data-testid="lightbox-dialog">
          {active && (
            <>
              <img src={active.url} alt={active.title} className="w-full max-h-[80vh] object-contain bg-black" data-testid="lightbox-image" />
              <div className="px-5 pb-5">
                <DialogTitle className="font-display text-2xl uppercase">{active.title}</DialogTitle>
                <DialogDescription className="font-mono-ui text-xs uppercase tracking-widest text-[#9E9EA9]">
                  {active.category}
                  {active.is_sample ? " · Sample photo" : ""}
                </DialogDescription>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
