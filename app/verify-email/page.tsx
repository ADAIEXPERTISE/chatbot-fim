"use client";
// app/(auth)/verify-email/page.tsx

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// RÈGLE Next.js App Router :
// useSearchParams() doit toujours être dans un composant enfant
// enveloppé par <Suspense>. On sépare donc la page en deux :
//   1. VerifyEmailPage      → exporte le <Suspense> (coque)
//   2. VerifyEmailContent   → contient la vraie logique + useSearchParams()
// ─────────────────────────────────────────────────────────────────────────────

// ── Composant interne (utilise useSearchParams) ───────────────────────────────
function VerifyEmailContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const email        = searchParams.get("email") ?? "";

  const [digits, setDigits]             = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs                        = useRef<(HTMLInputElement | null)[]>([]);
  const [status, setStatus]             = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg]         = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5) {
      const fullCode = next.join("");
      if (fullCode.length === 6) submitCode(fullCode);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setDigits(pasted.split("")); submitCode(pasted); }
  }

  async function submitCode(code: string) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res  = await fetch("/api/verify-otp", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Code invalide.");
      router.push(`/set-password?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    await fetch("/api/signup", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ email, firstName: "", lastName: "" }),
    });
  }

  const code = digits.join("");

  return (
    <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      {/* En-tête */}
      <div className="px-10 pt-10 pb-6 border-b border-zinc-100"> 

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Vérifie ton email</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Code envoyé à <span className="font-medium text-zinc-700">{email}</span>. Expire dans 10 min.
        </p>
      </div>

      {/* Corps */}
      <div className="px-10 py-10">
        {/* 6 cases OTP */}
        <div className="flex gap-1 justify-center mb-8" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={status === "loading"}
              className={`
                w-12 h-14 text-center text-xl font-semibold rounded-xl border transition-all
                focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-40
                ${digit ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-900"}
                ${status === "error" ? "border-red-300 bg-red-50 text-zinc-900" : ""}
              `}
            />
          ))}
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-zinc-500">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Vérification…
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3.5 py-3 mb-6">
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={() => submitCode(code)}
          disabled={code.length < 6 || status === "loading"}
          className="w-full h-10 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Valider le code
        </button>

        <p className="mt-5 text-center text-xs text-zinc-400">
          Tu n&apos;as pas reçu le code ?{" "}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="font-medium text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors underline underline-offset-2"
          >
            {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer"}
          </button>
        </p>
      </div>

      <div className="px-10 py-5 border-t border-zinc-100 bg-zinc-50/60">
        <button onClick={() => router.push("/signup")} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          ← Modifier mon email
        </button>
      </div>
    </div>
  );
}

// ── Skeleton affiché pendant le chargement du Suspense ────────────────────────
function VerifyEmailSkeleton() {
  return (
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      <div className="px-10 pt-10 pb-6 border-b border-zinc-100">
        <div className="h-5 w-24 bg-zinc-100 rounded animate-pulse mb-8" />
        <div className="h-6 w-48 bg-zinc-100 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-zinc-100 rounded animate-pulse" />
      </div>
      <div className="px-10 py-10">
        <div className="flex gap-3 justify-center mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-12 h-14 rounded-xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
        <div className="h-10 w-full rounded-lg bg-zinc-100 animate-pulse" />
      </div>
    </div>
  );
}

// ── Export default : coque avec <Suspense> ────────────────────────────────────
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
      <Suspense fallback={<VerifyEmailSkeleton />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}