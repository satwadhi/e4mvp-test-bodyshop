import { Car, PaintBucket, Hammer, ShieldCheck, Sparkles, FileCheck, Wrench } from "lucide-react";

const ICONS = { car: Car, paint: PaintBucket, hammer: Hammer, shield: ShieldCheck, sparkles: Sparkles, file: FileCheck };

export const SectionHead = ({ eyebrow, title, sub, testId }) => (
  <div className="max-w-3xl" data-testid={testId}>
    <p className="eyebrow">{eyebrow}</p>
    <h2 className="section-title mt-4">{title}</h2>
    {sub && <p className="mt-5 text-base md:text-lg text-[#9E9EA9]">{sub}</p>}
  </div>
);

export default function Services({ services = [] }) {
  return (
    <section id="services" className="scroll-mt-24 py-24 sm:py-32" data-testid="services-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="01 / What we do" title="Services" sub="From minor scratches to major collisions — done right the first time." />
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#272A34]">
          {services.map((s, i) => {
            const Icon = ICONS[s.icon] || Wrench;
            return (
              <div
                key={s.id}
                className="group relative border-b border-r border-[#272A34] bg-[#0B0C0E] p-8 sm:p-10 transition-colors duration-300 hover:bg-[#121418]"
                data-testid={`service-card-${s.id}`}
              >
                <span className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-[#FF3B30] transition-transform duration-300 group-hover:scale-y-100" />
                <div className="flex items-start justify-between">
                  <Icon className="h-9 w-9 text-[#FF3B30]" strokeWidth={1.5} />
                  <span className="font-mono-ui text-xs text-[#60626D]">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-8 font-display text-3xl font-bold uppercase tracking-tight">{s.title}</h3>
                <p className="mt-3 text-sm sm:text-base text-[#9E9EA9] leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
