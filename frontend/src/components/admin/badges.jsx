export const STATUSES = ["Requested", "Confirmed", "Declined", "Completed"];

const STATUS_STYLE = {
  Requested: "text-[#FF9500] border-[#FF9500]/40 bg-[#FF9500]/10",
  Confirmed: "text-[#30D158] border-[#30D158]/40 bg-[#30D158]/10",
  Declined: "text-[#FF453A] border-[#FF453A]/40 bg-[#FF453A]/10",
  Completed: "text-[#64D2FF] border-[#64D2FF]/40 bg-[#64D2FF]/10",
};

export const StatusBadge = ({ status, testId }) => (
  <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono-ui text-[10px] uppercase tracking-widest ${STATUS_STYLE[status]}`} data-testid={testId}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status}
  </span>
);

export const SourceBadge = ({ source, testId }) => (
  <span
    className={`inline-flex items-center border px-2 py-0.5 font-mono-ui text-[10px] uppercase tracking-widest ${
      source === "owner" ? "border-[#3A3E4D] text-[#C9C9D1] bg-[#1A1D24]" : "border-[#FF3B30]/40 text-[#FF3B30] bg-[#FF3B30]/10"
    }`}
    data-testid={testId}
  >
    {source === "owner" ? "Owner entry" : "Website"}
  </span>
);
