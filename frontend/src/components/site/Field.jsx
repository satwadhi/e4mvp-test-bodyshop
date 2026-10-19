export const Field = ({ label, required, error, children, className = "", htmlFor }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="mb-2 block font-mono-ui text-[11px] uppercase tracking-widest text-[#9E9EA9]">
      {label} {required && <span className="text-[#FF3B30]">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1.5 text-sm text-[#FF453A]" data-testid={`error-${htmlFor}`}>
        {error}
      </p>
    )}
  </div>
);
