import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { API, errorMessage, todayLocal, formatDate, formatTime, telHref } from "@/lib/api";
import { SectionHead } from "@/components/site/Services";
import { Field } from "@/components/site/Field";
import { PhotoPicker } from "@/components/site/PhotoPicker";

const EMPTY = {
  name: "", phone: "", email: "", vehicle_year: "", vehicle_make: "", vehicle_model: "",
  service: "", preferred_date: "", preferred_time: "", notes: "",
};

const validate = (f) => {
  const e = {};
  if (!f.name.trim()) e.name = "Please enter your name";
  if (f.phone.replace(/\D/g, "").length < 7) e.phone = "Please enter a valid phone number";
  if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = "Please enter a valid email";
  if (!f.preferred_date) e.preferred_date = "Please choose a date";
  else if (f.preferred_date < todayLocal()) e.preferred_date = "Date cannot be in the past";
  if (!f.preferred_time) e.preferred_time = "Please choose a time";
  return e;
};

const Success = ({ data, settings, onReset }) => (
  <div className="border border-[#30D158]/40 bg-[#30D158]/5 p-8 sm:p-12" data-testid="booking-success-message">
    <CheckCircle2 className="h-12 w-12 text-[#30D158]" />
    <h3 className="mt-6 font-display text-4xl font-extrabold uppercase">Request received!</h3>
    <p className="mt-4 max-w-xl text-[#C9C9D1]">
      Thanks {data.name.split(" ")[0]} — we got your request for <strong>{formatDate(data.preferred_date)}</strong> at{" "}
      <strong>{formatTime(data.preferred_time)}</strong>. We'll call you at <strong>{data.phone}</strong> to confirm.
    </p>
    <p className="mt-2 text-sm text-[#9E9EA9]">
      Need it sooner? Call us at <a href={telHref(settings.phone)} className="text-[#FF3B30]">{settings.phone}</a>.
    </p>
    <button type="button" onClick={onReset} className="btn-ghost mt-8 h-12" data-testid="booking-new-request-button">
      Submit another request
    </button>
  </div>
);

export default function BookingForm({ settings }) {
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach((f) => fd.append("photos", f.file));
    try {
      await axios.post(`${API}/appointments`, fd);
      toast.success("Appointment request sent!");
      setDone(form);
      setForm(EMPTY);
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
    } catch (err) {
      toast.error(errorMessage(err, "Could not send your request. Please try again or call us."));
    } finally {
      setSubmitting(false);
    }
  };

  const inv = (k) => (errors[k] ? "true" : "false");

  return (
    <section id="book" className="scroll-mt-24 py-24 sm:py-32 bg-[#121418] relative" data-testid="booking-section">
      <div className="absolute left-0 top-0 h-1.5 w-full stripe-accent opacity-60" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <SectionHead eyebrow="04 / Book" title="Request an appointment" sub="Tell us about your vehicle and when works for you. We'll call to confirm your time." />
          <div className="mt-10 border-l-2 border-[#FF3B30] pl-5">
            <p className="font-mono-ui text-[10px] uppercase tracking-widest text-[#60626D]">Prefer to talk?</p>
            <a href={telHref(settings.phone)} className="mt-1 block font-display text-3xl font-bold hover:text-[#FF3B30] transition-colors" data-testid="booking-call-link">
              {settings.phone}
            </a>
          </div>
        </div>
        <div className="lg:col-span-8">
          {done ? (
            <Success data={done} settings={settings} onReset={() => setDone(null)} />
          ) : (
            <form onSubmit={submit} noValidate className="border border-[#272A34] bg-[#0B0C0E] p-6 sm:p-10" data-testid="appointment-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full name" required error={errors.name} htmlFor="name">
                  <input id="name" className="field-input" value={form.name} onChange={set("name")} aria-invalid={inv("name")} autoComplete="name" data-testid="booking-name-input" />
                </Field>
                <Field label="Phone" required error={errors.phone} htmlFor="phone">
                  <input id="phone" type="tel" className="field-input" value={form.phone} onChange={set("phone")} aria-invalid={inv("phone")} autoComplete="tel" data-testid="booking-phone-input" />
                </Field>
                <Field label="Email (optional)" error={errors.email} htmlFor="email" className="sm:col-span-2">
                  <input id="email" type="email" className="field-input" value={form.email} onChange={set("email")} aria-invalid={inv("email")} autoComplete="email" data-testid="booking-email-input" />
                </Field>
                <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                  <Field label="Year" htmlFor="vehicle_year">
                    <input id="vehicle_year" inputMode="numeric" maxLength={4} className="field-input" value={form.vehicle_year} onChange={set("vehicle_year")} placeholder="2021" data-testid="booking-vehicle-year-input" />
                  </Field>
                  <Field label="Make" htmlFor="vehicle_make">
                    <input id="vehicle_make" className="field-input" value={form.vehicle_make} onChange={set("vehicle_make")} placeholder="Toyota" data-testid="booking-vehicle-make-input" />
                  </Field>
                  <Field label="Model" htmlFor="vehicle_model">
                    <input id="vehicle_model" className="field-input" value={form.vehicle_model} onChange={set("vehicle_model")} placeholder="Camry" data-testid="booking-vehicle-model-input" />
                  </Field>
                </div>
                <Field label="Service" htmlFor="service" className="sm:col-span-2">
                  <select id="service" className="field-input" value={form.service} onChange={set("service")} data-testid="booking-service-select">
                    <option value="">Select a service</option>
                    {settings.services.map((s) => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Preferred date" required error={errors.preferred_date} htmlFor="preferred_date">
                  <input id="preferred_date" type="date" min={todayLocal()} className="field-input" value={form.preferred_date} onChange={set("preferred_date")} aria-invalid={inv("preferred_date")} data-testid="booking-date-input" />
                </Field>
                <Field label="Preferred time" required error={errors.preferred_time} htmlFor="preferred_time">
                  <select id="preferred_time" className="field-input" value={form.preferred_time} onChange={set("preferred_time")} aria-invalid={inv("preferred_time")} data-testid="booking-time-select">
                    <option value="">Select a time</option>
                    {settings.time_slots.map((t) => (
                      <option key={t} value={t}>{formatTime(t)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Notes / damage description" htmlFor="notes" className="sm:col-span-2">
                  <textarea id="notes" rows={4} className="field-input h-auto py-3" value={form.notes} onChange={set("notes")} placeholder="Where is the damage? Insurance claim?" data-testid="booking-notes-input" />
                </Field>
                <Field label="Damage photos" htmlFor="photos" className="sm:col-span-2">
                  <PhotoPicker files={files} setFiles={setFiles} disabled={submitting} />
                </Field>
              </div>
              <button type="submit" disabled={submitting} className="btn-accent mt-8 h-14 w-full text-xl" data-testid="appointment-submit-button">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {submitting ? "Sending…" : "Send request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
