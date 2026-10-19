import { Phone, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { telHref } from "@/lib/api";

const NAV = [
  { href: "#services", label: "Services" },
  { href: "#gallery", label: "Our Work" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
];

export default function Header({ settings }) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-[#272A34] bg-[#0B0C0E]/90 backdrop-blur-xl"
      data-testid="site-header"
    >
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo settings={settings} />
        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="font-mono-ui text-xs uppercase tracking-[0.2em] text-[#9E9EA9] transition-colors hover:text-[#F4F4F6]"
              data-testid={`nav-link-${n.href.slice(1)}`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href={telHref(settings.phone)}
            className="flex h-11 min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-sm border border-[#272A34] px-2.5 sm:px-3 text-[#F4F4F6] transition-colors hover:border-[#FF9500]"
            data-testid="header-call-link"
            aria-label={`Call ${settings.phone}`}
          >
            <Phone className="h-4 w-4 text-[#FF9500]" />
            <span className="md:hidden font-display text-base font-bold uppercase tracking-wider">Call</span>
            <span className="hidden md:inline font-semibold text-sm whitespace-nowrap">{settings.phone}</span>
          </a>
          <a href="#book" className="btn-accent h-11 shrink-0 px-3 sm:px-6 text-base whitespace-nowrap" data-testid="nav-book-now-button">
            <CalendarCheck className="h-4 w-4" />
            Book Now
          </a>
        </div>
      </div>
    </header>
  );
}
