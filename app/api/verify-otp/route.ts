// app/api/auth/verify-otp/route.ts
//
// Étape 2 : reçoit l'email + le code saisi par l'utilisateur,
//           vérifie qu'il est correct et non expiré.

import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json(
      { success: false, message: "Email et code sont requis." },
      { status: 400 }
    );
  }

  // Vérifie le code dans le store
  const result = verifyOtp(email, code.trim());

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.error },
      { status: 400 }
    );
  }

  // ✓ Code valide — on autorise le passage à l'étape "set-password"
  // L'email est maintenant marqué comme "verified: true" dans le store
  return NextResponse.json({ success: true }, { status: 200 });
}