"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

type FormData = {
  email: string;
  password: string;
};

// ─── Helper : stocke les infos user dans localStorage ────────────────────────
function saveUserToLocalStorage(user: {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  role: string | undefined;
}) {
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role ?? "visiteur",
    }),
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Login() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({ email: "", password: "" });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ── Connexion email + mot de passe ─────────────────────────────────────────
  // async function handleSubmit(e: React.FormEvent) {
  //   e.preventDefault();
  //   setStatus("loading");
  //   setErrorMessage("");

  //   const result = await signIn("credentials", {
  //     email   : form.email,
  //     password: form.password,
  //     redirect: false,
  //   });

  //   if (result?.error) {
  //     setStatus("error");
  //     const errorMap: Record<string, string> = {
  //       "Aucun compte trouvé avec cet email."                                        : "Aucun compte trouvé avec cet email.",
  //       "Mot de passe incorrect."                                                    : "Mot de passe incorrect.",
  //       "Ce compte utilise la connexion Google. Clique sur 'Continuer avec Google'.": "Ce compte utilise la connexion Google.",
  //       "Email et mot de passe requis."                                              : "Email et mot de passe requis.",
  //       "CredentialsSignin"                                                          : "Email ou mot de passe incorrect.",
  //     };
  //     setErrorMessage(errorMap[result.error] ?? "Une erreur est survenue.");
  //     return;
  //   }

  // }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false, // On garde false pour gérer la redirection nous-mêmes
    });

    if (result?.error) {
      setStatus("error");
      const errorMap: Record<string, string> = {
        "Aucun compte trouvé avec cet email.":
          "Aucun compte trouvé avec cet email.",
        "Mot de passe incorrect.": "Mot de passe incorrect.",
        "Ce compte utilise la connexion Google. Clique sur 'Continuer avec Google'.":
          "Ce compte utilise la connexion Google.",
        "Email et mot de passe requis.": "Email et mot de passe requis.",
        CredentialsSignin: "Email ou mot de passe incorrect.",
      };
      setErrorMessage(errorMap[result.error] ?? "Une erreur est survenue.");
    } else {
      // ✅ AJOUTE CETTE LOGIQUE ICI
      setStatus("success");
      router.push("/"); // Redirige vers la page d'accueil
      router.refresh(); // Rafraîchit les données pour que le middleware voie la session
    }
  }

  // ── Connexion Google ────────────────────────────────────────────────────────
  // Pour Google, la session est disponible via useSession() côté client
  // après la redirection — on stocke depuis la page d'arrivée (/ai-message)
  async function handleGoogle() {
    setStatus("loading");
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* En-tête */}
        <div className="px-10 pt-10 pb-6 border-b border-zinc-100">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Bienvenue, connecte-toi pour continuer.
          </p>
        </div>

        {/* Corps */}
        <div className="px-10 py-8">
          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={status === "loading"}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Continuer avec Google
          </button>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs text-zinc-400 uppercase tracking-widest">
              ou
            </span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-zinc-500 uppercase tracking-wider"
                >
                  Mot de passe
                </label>
                {/* <a href="/forgot-password" className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors">Mot de passe oublié ?</a> */}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
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
                <p className="text-xs text-red-600 leading-relaxed">
                  {errorMessage}
                </p>
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
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Pied de page */}
        <div className="px-10 py-5 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          {/* <p className="text-xs text-zinc-400">
            Pas de compte ?{" "}
            <a
              href="/signup"
              className="font-medium text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors"
            >
              Créer un compte
            </a>
          </p> */}
          <p className="text-xs text-zinc-300">
            <a href="/terms" className="hover:text-zinc-500 transition-colors">
              CGU
            </a>
            {" · "}
            <a
              href="/privacy"
              className="hover:text-zinc-500 transition-colors"
            >
              Confidentialité
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
