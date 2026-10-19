import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { API, setToken, errorMessage } from "@/lib/api";
import { Field } from "@/components/site/Field";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      setToken(data.token);
      toast.success("Welcome back");
      onLogin();
    } catch (err) {
      setError(errorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0B0C0E]" data-testid="admin-login-page">
      <div className="hidden lg:flex relative flex-col justify-end p-16 border-r border-[#272A34] bg-[#121418] overflow-hidden grain">
        <div className="absolute inset-0 stripe-accent opacity-[0.04]" />
        <p className="eyebrow relative">Owner area</p>
        <h1 className="relative mt-4 font-display text-7xl font-black uppercase italic leading-[0.9]">Shop<br />command<br />center</h1>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm" data-testid="admin-login-form">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#9E9EA9] hover:text-white transition-colors" data-testid="admin-back-to-site-link">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
          <div className="mt-10 flex h-12 w-12 items-center justify-center bg-[#FF3B30]">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h2 className="mt-6 font-display text-4xl font-extrabold uppercase">Owner login</h2>
          <p className="mt-2 text-sm text-[#9E9EA9]">Sign in to manage appointments.</p>
          <div className="mt-8 space-y-5">
            <Field label="Email" htmlFor="admin-email">
              <input id="admin-email" type="email" required className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" data-testid="admin-login-email-input" />
            </Field>
            <Field label="Password" htmlFor="admin-password">
              <input id="admin-password" type="password" required className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="admin-login-password-input" />
            </Field>
          </div>
          {error && <p className="mt-4 text-sm text-[#FF453A]" data-testid="admin-login-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-accent mt-8 h-12 w-full" data-testid="admin-login-submit-button">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
