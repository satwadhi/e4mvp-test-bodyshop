import { Star, Quote } from "lucide-react";
import { SectionHead } from "@/components/site/Services";

const Stars = ({ rating }) => (
  <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`h-4 w-4 ${n <= rating ? "fill-[#FF9500] text-[#FF9500]" : "text-[#3A3E4D]"}`} />
    ))}
  </div>
);

export default function Reviews({ items = [] }) {
  return (
    <section id="reviews" className="scroll-mt-24 py-24 sm:py-32" data-testid="reviews-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="03 / Customers" title="Reviews" />
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((r, i) => (
            <figure
              key={r.id}
              className="relative flex flex-col border border-[#272A34] bg-[#121418] p-7 transition-colors duration-300 hover:border-[#3A3E4D]"
              data-testid={`review-card-${i}`}
            >
              <Quote className="h-8 w-8 text-[#FF3B30]" />
              <blockquote className="mt-5 flex-1 text-sm sm:text-base text-[#C9C9D1] leading-relaxed">“{r.text}”</blockquote>
              <figcaption className="mt-6 flex items-center justify-between border-t border-[#272A34] pt-5">
                <div>
                  <p className="font-display text-xl font-bold uppercase">{r.name}</p>
                  {r.is_sample && (
                    <p className="font-mono-ui text-[10px] uppercase tracking-widest text-[#FF9500]">Sample review</p>
                  )}
                </div>
                <Stars rating={r.rating} />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
