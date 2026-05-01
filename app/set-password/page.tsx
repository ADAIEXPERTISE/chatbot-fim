"use client";
// app/(auth)/set-password/page.tsx

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Même pattern que verify-email :
//   1. SetPasswordPage    → export default, contient <Suspense>
//   2. SetPasswordContent → contient useSearchParams() + toute la logique
// ─────────────────────────────────────────────────────────────────────────────

function SetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const email        = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const rules = [
    { label: "8 caractères minimum", ok: password.length >= 8 },
    { label: "Une lettre majuscule",  ok: /[A-Z]/.test(password) },
    { label: "Un chiffre",            ok: /[0-9]/.test(password) },
  ];

  const allRulesOk     = rules.every((r) => r.ok);
  const passwordsMatch = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRulesOk) { setErrorMsg("Le mot de passe ne respecte pas les règles."); return; }
    if (!passwordsMatch) { setErrorMsg("Les mots de passe ne correspondent pas."); return; }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res  = await fetch("/api/set-password", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur serveur.");
      router.push("/ai-message");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }

  const steps = [
    { label: "Informations", done: true,  active: false },
    { label: "Vérification", done: true,  active: false },
    { label: "Mot de passe", done: false, active: true  },
  ];

  return (
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">

      {/* En-tête */}
      <div className="px-10 pt-10 pb-6 border-b border-zinc-100">

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Choisis un mot de passe</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Compte lié à <span className="font-medium text-zinc-700">{email}</span>
        </p>
      </div>

      {/* Corps */}
      <div className="px-10 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Champ mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full px-3 pr-10 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                {showPwd ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Règles en temps réel */}
            {password.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {rules.map((rule) => (
                  <li key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${rule.ok ? "text-emerald-600" : "text-zinc-400"}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${rule.ok ? "bg-emerald-100" : "bg-zinc-100"}`}>
                      {rule.ok
                        ? <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        : <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                      }
                    </div>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirmation */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              type={showPwd ? "text" : "password"}
              required
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`h-10 px-3 rounded-lg border bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all ${
                confirm.length > 0
                  ? passwordsMatch ? "border-emerald-300 focus:border-emerald-400" : "border-red-300 focus:border-red-400"
                  : "border-zinc-200 focus:border-zinc-400"
              }`}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-0.5">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          {/* Erreur serveur */}
          {status === "error" && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3.5 py-3">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-red-600">{errorMsg}</p>
            </div>
          )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={!allRulesOk || !passwordsMatch || status === "loading"}
            className="w-full h-10 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
          >
            {status === "loading" ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Création du compte…
              </>
            ) : "Enregistrer"}
          </button>
        </form>
      </div>

      <div className="px-10 py-5 border-t border-zinc-100 bg-zinc-50/60">
        <button onClick={() => router.back()} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          ← Retour
        </button>
      </div>
    </div>
  );
}

// ── Skeleton affiché pendant le chargement du Suspense ────────────────────────
function SetPasswordSkeleton() {
  return (
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      <div className="px-10 pt-10 pb-6 border-b border-zinc-100">
        <div className="h-5 w-24 bg-zinc-100 rounded animate-pulse mb-8" />
        <div className="h-6 w-48 bg-zinc-100 rounded animate-pulse mb-2" />
        <div className="h-4 w-56 bg-zinc-100 rounded animate-pulse" />
      </div>
      <div className="px-10 py-8 space-y-4">
        <div className="h-10 w-full rounded-lg bg-zinc-100 animate-pulse" />
        <div className="h-10 w-full rounded-lg bg-zinc-100 animate-pulse" />
        <div className="h-10 w-full rounded-lg bg-zinc-100 animate-pulse" />
      </div>
    </div>
  );
}

// ── Export default : coque avec <Suspense> ────────────────────────────────────
export default function SetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
      <Suspense fallback={<SetPasswordSkeleton />}>
        <SetPasswordContent />
      </Suspense>
    </div>
  );
}