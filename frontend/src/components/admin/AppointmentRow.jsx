import { toast } from "sonner";
import { ChevronRight, Camera } from "lucide-react";
import { adminApi, errorMessage, formatDate, formatTime, telHref } from "@/lib/api";
import { StatusBadge, SourceBadge, STATUSES } from "@/components/admin/badges";

export const changeStatus = async (appt, status, onUpdated) => {
  try {
    const { data } = await adminApi.patch(`/appointments/${appt.id}`, { status });
    onUpdated(data);
    toast.success(`Marked as ${status}`);
  } catch (err) {
    toast.error(errorMessage(err, "Could not update status"));
  }
};

export default function AppointmentRow({ appt, onOpen, onUpdated }) {
  const vehicle = [appt.vehicle_year, appt.vehicle_make, appt.vehicle_model].filter(Boolean).join(" ") || "—";
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 sm:p-5 bg-[#0B0C0E] hover:bg-[#121418] transition-colors" data-testid={`appointment-row-${appt.id}`}>
      <div className="md:col-span-3 min-w-0">
        <p className="font-semibold truncate" data-testid="appointment-row-name">{appt.name}</p>
        <a href={telHref(appt.phone)} className="text-sm text-[#9E9EA9] hover:text-[#FF9500]">{appt.phone}</a>
      </div>
      <div className="md:col-span-3 min-w-0 text-sm">
        <p className="truncate">{vehicle}</p>
        <p className="text-[#9E9EA9] truncate flex items-center gap-1.5">
          {appt.service || "No service selected"}
          {appt.photos?.length > 0 && <Camera className="h-3.5 w-3.5 text-[#FF9500]" />}
        </p>
      </div>
      <div className="md:col-span-2 text-sm">
        <p data-testid="appointment-row-date">{formatDate(appt.preferred_date)}</p>
        <p className="text-[#9E9EA9]">{formatTime(appt.preferred_time)}</p>
      </div>
      <div className="md:col-span-2 flex md:flex-col items-start gap-1.5">
        <StatusBadge status={appt.status} testId="appointment-row-status-badge" />
        <SourceBadge source={appt.source} testId="appointment-row-source-badge" />
      </div>
      <div className="md:col-span-2 flex items-center gap-2 md:justify-end">
        <select
          value={appt.status}
          onChange={(e) => changeStatus(appt, e.target.value, onUpdated)}
          className="field-input h-9 text-xs w-full md:w-auto px-2"
          data-testid="appointment-row-status-select"
          aria-label="Change status"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={onOpen} className="h-9 w-9 shrink-0 flex items-center justify-center border border-[#272A34] hover:border-[#FF3B30] hover:text-[#FF3B30] transition-colors" data-testid="appointment-details-button" aria-label="View details">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
