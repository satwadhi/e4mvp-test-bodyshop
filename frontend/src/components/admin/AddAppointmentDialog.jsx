import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { API, adminApi, errorMessage, todayLocal } from "@/lib/api";
import { Field } from "@/components/site/Field";
import { STATUSES } from "@/components/admin/badges";

const EMPTY = {
  name: "", phone: "", email: "", vehicle_year: "", vehicle_make: "", vehicle_model: "",
  service: "", preferred_date: "", preferred_time: "", notes: "", status: "Confirmed",
};

export default function AddAppointmentDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [services, setServices] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/settings`).then((r) => setServices(r.data.services || []));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.phone.replace(/\D/g, "").length < 7) errs.phone = "Valid phone is required";
    if (!form.preferred_date) errs.preferred_date = "Date is required";
    else if (form.preferred_date < todayLocal()) errs.preferred_date = "Date cannot be in the past";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const { data } = await adminApi.post("/appointments", form);
      onCreated(data);
      toast.success("Appointment added");
      setForm(EMPTY);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Could not add appointment"));
    } finally {
      setSaving(false);
    }
  };

  const input = (k, props = {}) => (
    <input id={`add-${k}`} className="field-input h-11" value={form[k]} onChange={set(k)} data-testid={`add-appt-${k.replace(/_/g, "-")}-input`} {...props} />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#121418] border-[#272A34]" data-testid="add-appointment-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-extrabold uppercase">Add appointment</DialogTitle>
          <DialogDescription>Phone or walk-in booking. Saved with source “Owner entry”.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2" data-testid="add-appointment-form">
          <Field label="Name" required error={errors.name} htmlFor="add-name">{input("name")}</Field>
          <Field label="Phone" required error={errors.phone} htmlFor="add-phone">{input("phone", { type: "tel" })}</Field>
          <Field label="Email" htmlFor="add-email" className="sm:col-span-2">{input("email", { type: "email" })}</Field>
          <div className="sm:col-span-2 grid grid-cols-3 gap-3">
            <Field label="Year" htmlFor="add-vehicle_year">{input("vehicle_year", { maxLength: 4 })}</Field>
            <Field label="Make" htmlFor="add-vehicle_make">{input("vehicle_make")}</Field>
            <Field label="Model" htmlFor="add-vehicle_model">{input("vehicle_model")}</Field>
          </div>
          <Field label="Service" htmlFor="add-service">
            <select id="add-service" className="field-input h-11" value={form.service} onChange={set("service")} data-testid="add-appt-service-select">
              <option value="">Select</option>
              {services.map((s) => <option key={s.id} value={s.title}>{s.title}</option>)}
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Status" htmlFor="add-status">
            <select id="add-status" className="field-input h-11" value={form.status} onChange={set("status")} data-testid="add-appt-status-select">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Date" required error={errors.preferred_date} htmlFor="add-preferred_date">{input("preferred_date", { type: "date", min: todayLocal() })}</Field>
          <Field label="Time" htmlFor="add-preferred_time">{input("preferred_time", { type: "time" })}</Field>
          <Field label="Notes" htmlFor="add-notes" className="sm:col-span-2">
            <textarea id="add-notes" rows={3} className="field-input h-auto py-3" value={form.notes} onChange={set("notes")} data-testid="add-appt-notes-input" />
          </Field>
          <button type="submit" disabled={saving} className="btn-accent h-12 sm:col-span-2" data-testid="add-appointment-submit-button">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save appointment
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
