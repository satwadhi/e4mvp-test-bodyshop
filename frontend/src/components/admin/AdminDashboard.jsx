import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, LogOut, Search, RefreshCw, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, errorMessage } from "@/lib/api";
import { STATUSES } from "@/components/admin/badges";
import AppointmentRow from "@/components/admin/AppointmentRow";
import AppointmentDetails from "@/components/admin/AppointmentDetails";
import AddAppointmentDialog from "@/components/admin/AddAppointmentDialog";

export default function AdminDashboard({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/appointments", { params: { sort } });
      setItems(data);
    } catch (err) {
      if (err?.response?.status === 401) return onLogout();
      toast.error(errorMessage(err, "Failed to load appointments"));
    } finally {
      setLoading(false);
    }
  }, [sort, onLogout]);

  useEffect(() => { load(); }, [load]);

  const upsert = (a) => setItems((prev) => prev.map((x) => (x.id === a.id ? a : x)));
  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, items.filter((i) => i.status === s).length])), [items]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) =>
      (filter === "All" || a.status === filter) &&
      (!q || [a.name, a.phone, a.email, a.vehicle_make, a.vehicle_model, a.service].join(" ").toLowerCase().includes(q))
    );
  }, [items, filter, query]);
  const selected = items.find((i) => i.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-[#0B0C0E]" data-testid="admin-dashboard">
      <header className="sticky top-0 z-40 border-b border-[#272A34] bg-[#0B0C0E]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 bg-[#FF3B30] -skew-x-12" />
            <span className="font-display text-xl sm:text-2xl font-black uppercase italic">Owner dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden sm:inline-flex items-center gap-2 px-3 h-10 text-sm text-[#9E9EA9] hover:text-white transition-colors" data-testid="admin-view-site-link">
              <ExternalLink className="h-4 w-4" /> View site
            </Link>
            <button onClick={onLogout} className="inline-flex items-center gap-2 h-10 px-3 border border-[#272A34] text-sm hover:border-[#FF3B30] transition-colors" data-testid="admin-logout-button">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Appointments</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold uppercase">Bookings</h1>
          </div>
          <button onClick={() => setAdding(true)} className="btn-accent h-12" data-testid="admin-add-appointment-button">
            <Plus className="h-5 w-5" /> Add appointment
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#272A34] border border-[#272A34]">
          {STATUSES.map((s) => (
            <div key={s} className="bg-[#121418] p-5" data-testid={`admin-stat-${s.toLowerCase()}`}>
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-[#9E9EA9]">{s}</p>
              <p className="mt-2 font-display text-4xl font-bold">{counts[s]}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {["All", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`h-10 px-4 border font-mono-ui text-xs uppercase tracking-widest transition-colors ${
                  filter === s ? "bg-[#FF3B30] border-[#FF3B30] text-white" : "border-[#272A34] text-[#9E9EA9] hover:text-white hover:border-[#3A3E4D]"
                }`}
                data-testid={`admin-status-filter-${s.toLowerCase()}`}
              >
                {s} {s !== "All" && <span className="opacity-70">({counts[s]})</span>}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#60626D]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, vehicle" className="field-input h-10 pl-9 text-sm" data-testid="admin-search-input" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="field-input h-10 w-auto text-sm" data-testid="admin-sort-select">
              <option value="newest">Newest first</option>
              <option value="upcoming">Upcoming first</option>
            </select>
            <button onClick={load} className="h-10 w-10 flex items-center justify-center border border-[#272A34] hover:border-[#3A3E4D]" data-testid="admin-refresh-button" aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="mt-6 border border-[#272A34] divide-y divide-[#272A34]" data-testid="admin-appointments-list">
          {!loading && visible.length === 0 && (
            <p className="p-10 text-center text-[#9E9EA9]" data-testid="admin-empty-state">No appointments found.</p>
          )}
          {visible.map((a) => (
            <AppointmentRow key={a.id} appt={a} onOpen={() => setSelectedId(a.id)} onUpdated={upsert} />
          ))}
        </div>
      </main>

      <AppointmentDetails appt={selected} onClose={() => setSelectedId(null)} onUpdated={upsert} onDeleted={remove} />
      <AddAppointmentDialog open={adding} onOpenChange={setAdding} onCreated={(a) => setItems((p) => [a, ...p])} />
    </div>
  );
}
