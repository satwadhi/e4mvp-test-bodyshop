import { Phone, ArrowRight, MapPin, Clock } from "lucide-react";
import { telHref } from "@/lib/api";

const HERO_IMG =
  "https://static.stage-images.emergentagent.com/jobs/aad34263-6c31-4c90-a3f5-3fd91b8955ee/images/000d16de49cc530616bb6470c0c690f7ae8f12e370a0f4852728c910f41b453f.jpeg";

export default function Hero({ settings }) {
  const weekday = settings.hours?.[0];
  return (
    <section id="top" className="relative overflow-hidden grain" data-testid="hero-section">
      <img src={HERO_IMG} alt="Car being painted in a paint booth" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0E] via-[#0B0C0E]/85 to-[#0B0C0E]/30" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0B0C0E] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-32 sm:pb-36">
        <p className="eyebrow rise" data-testid="hero-eyebrow">Auto Paint · Body · Collision</p>
        <h1
          className="rise mt-5 max-w-4xl font-display text-6xl sm:text-7xl lg:text-8xl font-black uppercase italic leading-[0.88] tracking-tight"
          style={{ animationDelay: "0.1s" }}
          data-testid="hero-shop-name"
        >
          {settings.name}
        </h1>
        <div className="rise mt-6 h-1.5 w-28 stripe-accent" style={{ animationDelay: "0.2s" }} />
        <p
          className="rise mt-6 max-w-xl text-base md:text-lg text-[#C9C9D1] leading-relaxed"
          style={{ animationDelay: "0.25s" }}
          data-testid="hero-tagline"
        >
          {settings.tagline}
        </p>
        <div className="rise mt-10 flex flex-col sm:flex-row gap-3" style={{ animationDelay: "0.35s" }}>
          <a href="#book" className="btn-accent h-14 text-xl" data-testid="hero-book-now-button">
            Book Now <ArrowRight className="h-5 w-5" />
          </a>
          <a href={telHref(settings.phone)} className="btn-ghost h-14 text-xl" data-testid="hero-call-button">
            <Phone className="h-5 w-5 text-[#FF9500]" /> {settings.phone}
          </a>
        </div>
        <div
          className="rise mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#9E9EA9]"
          style={{ animationDelay: "0.45s" }}
        >
          <span className="flex items-center gap-2" data-testid="hero-address">
            <MapPin className="h-4 w-4 text-[#FF3B30]" /> {settings.address_line1}, {settings.address_line2}
          </span>
          {weekday && (
            <span className="flex items-center gap-2" data-testid="hero-hours">
              <Clock className="h-4 w-4 text-[#FF3B30]" /> {weekday.days}: {weekday.time}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
