import { useState } from "react";
import { getToken, clearToken } from "@/lib/api";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());
  const logout = () => {
    clearToken();
    setAuthed(false);
  };
  return authed ? <AdminDashboard onLogout={logout} /> : <AdminLogin onLogin={() => setAuthed(true)} />;
}
