"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "exposant" | "professionnel" | "visiteur" | "";

type FormData = {
  display_name: string;
  email: string;
  phone: string;
  role: Role;
  company_name: string;
  consent: boolean; //
};

const ROLES: { value: Role; label: string }[] = [
  { value: "exposant", label: "Exposant" },
  { value: "professionnel", label: "Professionnel" },
  { value: "visiteur", label: "Visiteur" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    display_name: "",
    email: "",
    phone: "",
    role: "",
    company_name: "",
    consent: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleRole(role: Role) {
    setForm({ ...form, role, company_name: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.role) {
      setStatus("error");
      setErrorMsg("Veuillez choisir votre profil.");
      return;
    }
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
      router.push("/");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }

  const inputCls =
    "h-11 w-full px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all";
  const labelCls =
    "text-[11px] font-medium text-zinc-400 uppercase tracking-wider";

  const [mounted, setMounted] = useState(false); 
  useEffect(() => setMounted(true), []); 

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-sm border border-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-8 pb-5 border-b border-zinc-100">
          <h1 className="text-xl font-semibold text-zinc-900">
            Accès FIM 2026{" "}
          </h1>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Prénom &amp; Nom</label>
              <input
                name="display_name"
                type="text"
                required
                placeholder="Marie Dupont"
                value={form.display_name}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            {/* Rôle */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Vous êtes…</label>
              <div className="flex flex-col gap-2">
                {ROLES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRole(value)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      form.role === value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {/* Radio dot */}
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                        form.role === value ? "border-white" : "border-zinc-300"
                      }`}
                    >
                      {form.role === value && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entreprise — visible uniquement si professionnel */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                form.role === "professionnel" || form.role === "exposant"
                  ? "max-h-24 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>
                  Nom de{" "}
                  {form.role === "professionnel"
                    ? "l'entreprise"
                    : "l'exposition"}
                </label>
                <input
                  name="company_name"
                  type="text"
                  required={form.role === "professionnel"}
                  placeholder="Acme Corp"
                  value={form.company_name}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Adresse email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="marie@exemple.com"
                value={form.email}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            {/* Téléphone */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Téléphone</label>
              <input
                name="phone"
                type="tel"
                placeholder="+33 6 00 00 00 00"
                value={form.phone}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            {/* Erreur */}
            {status === "error" && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}
            {/* Consentement RGPD */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={form.consent}
                onChange={(e) =>
                  setForm({ ...form, consent: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-zinc-900 flex-shrink-0"
              />
              <span className="text-xs text-zinc-500 leading-relaxed">
                J&apos;accepte que mes données personnelles soient collectées et
                utilisées conformément à notre{" "}
                <a
                  href="/politique-confidentialite"
                  className="underline text-zinc-700 hover:text-zinc-900"
                >
                  politique de confidentialité
                </a>
                .
              </span>
            </label>
            {/* Submit */}
            <button
              type="submit"
              disabled={status === "loading" || !form.consent}
              className={` w-full h-11 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
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
      </div>
    </div>
  );
}
