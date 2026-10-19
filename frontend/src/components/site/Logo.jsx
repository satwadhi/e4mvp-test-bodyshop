export const Logo = ({ settings, testId = "nav-logo" }) => (
  <a href="#top" className="flex items-center gap-3 group" data-testid={testId}>
    {settings.logo_url ? (
      <img src={settings.logo_url} alt={settings.name} className="h-10 w-auto" />
    ) : (
      <>
        <span className="relative flex h-10 w-10 items-center justify-center bg-[#FF3B30] font-display text-2xl font-black italic text-white -skew-x-12 transition-transform duration-300 group-hover:skew-x-0">
          {settings.logo_text?.[0] || "A"}
        </span>
        <span className="leading-none">
          <span className="block font-display text-2xl font-black italic uppercase tracking-tight text-[#F4F4F6]">
            {settings.logo_text}
          </span>
          <span className="hidden sm:block font-mono-ui text-[10px] uppercase tracking-[0.3em] text-[#9E9EA9]">
            {settings.logo_subtext}
          </span>
        </span>
      </>
    )}
  </a>
);
