"use client";
// app/(auth)/signup/page.tsx
// Étape 1 : formulaire de création de compte

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormData = {
  display_name: string;
  email: string;
  phone: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    display_name: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Erreur serveur.");

      // ✓ Email envoyé — on passe à la vérification OTP
      // On passe l'email dans l'URL pour que la page suivante sache à qui envoyer
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 grid place-items-center p-4 font-sans">
      <div className="bg-white w-full h-[3/4] max-w-lg rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* En-tête */}
        <div className="px-10 pt-10 pb-6 border-b border-zinc-100">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Créer un compte
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Un code de vérification sera envoyé à ton email.
          </p>
        </div>

        {/* Corps */}
        <div className="px-10 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="display_name"
                  className="text-xs font-medium text-zinc-500 uppercase tracking-wider"
                >
                  Nom
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  required
                  placeholder="Dupont"
                  value={form.display_name}
                  onChange={handleChange}
                  className="h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-zinc-500 uppercase tracking-wider"
              >
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="marie@exemple.com"
                value={form.email}
                onChange={handleChange}
                className="h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="phone"
                className="text-xs font-medium text-zinc-500 uppercase tracking-wider"
              >
                Téléphone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+33 6 00 00 00 00"
                value={form.phone}
                onChange={handleChange}
                className="h-10 px-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
              />
            </div>

            {status === "error" && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3.5 py-3">
                <svg
                  className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <p className="text-xs text-red-600">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-10 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
            >
              {status === "loading" ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Envoi du code…
                </>
              ) : (
                "Continuer →"
              )}
            </button>
          </form>
        </div>

        <div className="px-10 py-5 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Déjà un compte ?{" "}
            <Link href={"/login"} className="font-medium text-zinc-600 hover:text-zinc-900 underline underline-offset-2"> Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
