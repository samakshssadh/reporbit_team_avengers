import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { friendlyError } from "../../services/auth";

export type AuthMode = "signin" | "signup";

export const AuthModal: React.FC<{ mode: AuthMode | null; onClose: () => void; onSwitch: (m: AuthMode) => void }> = ({ mode, onClose, onSwitch }) => {
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setError(null); }, [mode]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      if (mode === "signup") await register(email.trim(), password, name.trim() || email.split("@")[0]);
      else await login(email.trim(), password);
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/35 focus:outline-none focus:border-tangerine-400/70 focus:ring-4 focus:ring-tangerine-500/15 transition";

  return (
    <AnimatePresence>
      {mode && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="auth-title"
            className="relative w-full max-w-md glass-strong rounded-3xl p-7 sm:p-8 overflow-hidden"
            initial={{ y: 30, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }} onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-tangerine-500/25 blur-3xl pointer-events-none" />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10" aria-label="Close"><X className="w-4 h-4" /></button>

            <div className="relative">
              <h2 id="auth-title" className="text-2xl font-semibold tracking-tight text-white">
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-1 text-sm text-white/60">
                {mode === "signup" ? "Start your open-source journey in under a minute." : "Sign in to continue your orbit."}
              </p>

              {/* segmented switch */}
              <div className="mt-5 grid grid-cols-2 p-1 rounded-xl bg-white/5 border border-white/10 text-sm">
                {(["signin", "signup"] as AuthMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => onSwitch(m)}
                    className={`py-2 rounded-lg font-medium transition ${mode === m ? "liquid-lens text-white" : "text-white/60 hover:text-white"}`}>
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-5 space-y-3">
                {mode === "signup" && (
                  <label className="relative block">
                    <span className="sr-only">Name</span>
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input className={field} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} required />
                  </label>
                )}
                <label className="relative block">
                  <span className="sr-only">Email</span>
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input className={field} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </label>
                <label className="relative block">
                  <span className="sr-only">Password</span>
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input className={field + " pr-11"} type={show ? "text" : "password"} placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
                    value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : 1} />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/45 hover:text-white" aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </label>

                {error && <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-400/20 rounded-xl px-3 py-2" role="alert">{error}</div>}

                <button type="submit" disabled={busy} className="btn-tangerine w-full py-3 rounded-xl flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-white/45">
                {mode === "signup" ? "Already have an account? " : "New to Reporbit? "}
                <button className="text-tangerine-300 hover:text-tangerine-200 font-medium" onClick={() => onSwitch(mode === "signup" ? "signin" : "signup")}>
                  {mode === "signup" ? "Sign in" : "Create one"}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
