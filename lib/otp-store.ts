// lib/otp-store.ts
//
// Stockage temporaire des OTP en mémoire (Map serveur).
// ⚠️  En production avec plusieurs instances, utilise Redis à la place.
//     Exemple : upstash/redis ou ioredis.
//
// Structure stockée par email :
//   { code, expiresAt, verified, pendingUser }

type PendingUser = {
  display_name: string;
  email: string;
  phone?: string;
};

type OtpEntry = {
  code: string;           // ex: "482931"
  expiresAt: number;      // timestamp ms
  verified: boolean;      // true après validation OTP
  pendingUser: PendingUser;
};

// Map globale — survit entre les requêtes dans le même process Node.js
const store = new Map<string, OtpEntry>();

// ── Générer un code OTP à 6 chiffres ─────────────────────────────────────────
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Sauvegarder un OTP pour un email ─────────────────────────────────────────
export function saveOtp(email: string, code: string, user: PendingUser): void {
  store.set(email, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // expire dans 10 minutes
    verified: false,
    pendingUser: user,
  });
}

// ── Vérifier un OTP ───────────────────────────────────────────────────────────
export function verifyOtp(
  email: string,
  code: string
): { ok: true; user: PendingUser } | { ok: false; error: string } {
  const entry = store.get(email);

  if (!entry) return { ok: false, error: "Aucun code trouvé pour cet email." };
  if (Date.now() > entry.expiresAt) return { ok: false, error: "Le code a expiré." };
  if (entry.code !== code) return { ok: false, error: "Code incorrect." };

  // Marquer comme vérifié (permet d'accéder à set-password)
  store.set(email, { ...entry, verified: true });

  return { ok: true, user: entry.pendingUser };
}

// ── Récupérer une entrée (pour la route set-password) ────────────────────────
export function getEntry(email: string): OtpEntry | undefined {
  return store.get(email);
} 

// ── Supprimer après finalisation ──────────────────────────────────────────────
export function deleteEntry(email: string): void {
  store.delete(email);
}