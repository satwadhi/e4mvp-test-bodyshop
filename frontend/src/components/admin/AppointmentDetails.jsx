import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Phone, Mail } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { adminApi, errorMessage, todayLocal, telHref } from "@/lib/api";
import { StatusBadge, SourceBadge, STATUSES } from "@/components/admin/badges";
import { changeStatus } from "@/components/admin/AppointmentRow";
import { DamagePhotos } from "@/components/admin/DamagePhotos";

const Row = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-3 py-2.5 border-b border-[#272A34] text-sm">
    <span className="font-mono-ui text-[10px] uppercase tracking-widest text-[#60626D] pt-0.5">{label}</span>
    <span className="col-span-2 break-words whitespace-pre-wrap">{children || "—"}</span>
  </div>
);

const Label = ({ children }) => <p className="mb-3 font-mono-ui text-[10px] uppercase tracking-widest text-[#9E9EA9]">{children}</p>;

export default function AppointmentDetails({ appt, onClose, onUpdated, onDeleted }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    if (appt) {
      setDate(appt.preferred_date);
      setTime(appt.preferred_time || "");
      setScheduleError("");
    }
  }, [appt]);

  const saveSchedule = async () => {
    setSaving(true);
    setScheduleError("");
    try {
      const { data } = await adminApi.patch(`/appointments/${appt.id}`, { preferred_date: date, preferred_time: time });
      onUpdated(data);
      toast.success("Date & time updated");
    } catch (err) {
      const msg = errorMessage(err, "Could not update");
      setScheduleError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    try {
      await adminApi.delete(`/appointments/${appt.id}`);
      onDeleted(appt.id);
      onClose();
      toast.success("Appointment deleted");
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete"));
    }
  };

  const vehicle = appt && [appt.vehicle_year, appt.vehicle_make, appt.vehicle_model].filter(Boolean).join(" ");
  const dirty = appt && (date !== appt.preferred_date || time !== (appt.preferred_time || ""));

  return (
    <Sheet open={!!appt} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-[#0B0C0E] border-[#272A34]" data-testid="appointment-details-sheet">
        {appt && (
          <>
            <SheetHeader className="text-left">
              <div className="flex gap-2">
                <StatusBadge status={appt.status} testId="details-status-badge" />
                <SourceBadge source={appt.source} testId="details-source-badge" />
              </div>
              <SheetTitle className="font-display text-4xl font-extrabold uppercase pt-2" data-testid="details-customer-name">{appt.name}</SheetTitle>
              <SheetDescription className="text-[#9E9EA9]">Submitted {new Date(appt.created_at).toLocaleString()}</SheetDescription>
            </SheetHeader>

            <div className="mt-5 flex gap-2">
              <a href={telHref(appt.phone)} className="btn-ghost h-10 text-sm flex-1" data-testid="details-call-link"><Phone className="h-4 w-4" /> Call</a>
              {appt.email && <a href={`mailto:${appt.email}`} className="btn-ghost h-10 text-sm flex-1" data-testid="details-email-link"><Mail className="h-4 w-4" /> Email</a>}
            </div>

            <div className="mt-6">
              <Label>Update status</Label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(appt, s, onUpdated)}
                    disabled={appt.status === s}
                    className={`h-10 border font-mono-ui text-xs uppercase tracking-widest transition-colors ${appt.status === s ? "border-[#FF3B30] bg-[#FF3B30]/10 text-[#FF3B30]" : "border-[#272A34] hover:border-[#3A3E4D]"}`}
                    data-testid={`details-status-${s.toLowerCase()}-button`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Label>Date & time</Label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" min={todayLocal()} value={date} onChange={(e) => setDate(e.target.value)} className="field-input h-10 text-sm" data-testid="details-date-input" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="field-input h-10 text-sm" data-testid="details-time-input" />
              </div>
              {dirty && (
                <button onClick={saveSchedule} disabled={saving} className="btn-accent mt-2 h-10 w-full text-base" data-testid="details-save-schedule-button">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save date & time
                </button>
              )}
              {scheduleError && (
                <p className="mt-2 text-sm text-[#FF453A]" data-testid="details-schedule-error">{scheduleError}</p>
              )}
            </div>

            <div className="mt-6">
              <Label>Details</Label>
              <Row label="Phone">{appt.phone}</Row>
              <Row label="Email">{appt.email}</Row>
              <Row label="Vehicle">{vehicle}</Row>
              <Row label="Service">{appt.service}</Row>
              <Row label="Notes">{appt.notes}</Row>
              {appt.source === "website" && <Row label="Owner email">{appt.email_notification}</Row>}
            </div>

            <div className="mt-6">
              <Label>Damage photos</Label>
              <DamagePhotos appt={appt} />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="mt-8 mb-4 inline-flex h-10 w-full items-center justify-center gap-2 border border-[#FF453A]/40 text-[#FF453A] text-sm hover:bg-[#FF453A]/10 transition-colors" data-testid="appointment-delete-button">
                  <Trash2 className="h-4 w-4" /> Delete appointment
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#121418] border-[#272A34]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
                  <AlertDialogDescription>This permanently removes {appt.name}'s appointment.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="delete-cancel-button">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={del} className="bg-[#FF3B30] hover:bg-[#E03126]" data-testid="delete-confirm-button">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
