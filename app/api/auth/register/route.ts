// Étape 1 : reçoit les infos du formulaire, génère un OTP,
//           l'envoie par email via Resend, et stocke les données en attente.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateOtp, saveOtp } from "@/lib/otp-store";

// Initialise Resend avec ta clé API (définie dans .env.local)
// RESEND_API_KEY=re_xxxxxxxxxxxx
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { display_name, email, phone } = await req.json();

  // ── Validation ────────────────────────────────────────────────────────────
  if (!display_name || !email) {
    return NextResponse.json(
      { success: false, message: "Nom d'affichage et email sont obligatoires." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { success: false, message: "Format d'email invalide." },
      { status: 400 }
    );
  }

  // ── Génération de l'OTP ───────────────────────────────────────────────────
  const code = generateOtp(); // ex: "482931"

  // Stocke les données en attente (avant confirmation email + mot de passe)
  saveOtp(email, code, { display_name, email, phone });

  // ── Envoi de l'email via Resend ───────────────────────────────────────────
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev", // 
    to: email,
    subject: "Code de vérificattion",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 18px; font-weight: 600; color: #18181b; letter-spacing: -0.3px;">Aurum</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 600; color: #18181b; margin: 0 0 8px;">
          Vérifie ton adresse email
        </h1>
        <p style="font-size: 14px; color: #71717a; margin: 0 0 32px; line-height: 1.6;">
          Bonjour ${display_name}, voici ton code de vérification. Il expire dans <strong>10 minutes</strong>.
        </p>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #18181b;">
            ${code}
          </span>
        </div>
        <p style="font-size: 12px; color: #a1a1aa; line-height: 1.6;">
          Si tu n'as pas créé de compte sur Aurum, ignore cet email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Erreur Resend :", error);
    return NextResponse.json(
      { success: false, message: error},
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}