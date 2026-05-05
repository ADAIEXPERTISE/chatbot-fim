// app/api/auth/register/route.ts
import { NextResponse }  from "next/server";
import { encode }        from "next-auth/jwt";
import { cookies }       from "next/headers";
import pool              from "@/lib/db";

export async function POST(req: Request) {
  const { display_name, email, phone, role } = await req.json();

  /* ── 1. Validation ── */
  if (!display_name || !email || !role) {
    return NextResponse.json({ message: "Champs manquants." }, { status: 400 });
  }

  const validRoles = ["visiteur", "exposant", "professionnel"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ message: "Rôle invalide." }, { status: 400 });
  }

  try {
    /* ── 2. Email déjà utilisé ? ── */
    const [existing] = await pool.execute<any[]>(
      "SELECT visitor_id FROM visitor WHERE email = ? LIMIT 1",
      [email]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ message: "Email déjà utilisé." }, { status: 409 });
    }

    /* ── 3. Insertion ── */
    const [result] = await pool.execute<any>(
      `INSERT INTO visitor (display_name, email, phone, role)
       VALUES (?, ?, ?, ?)`,
      [display_name, email, phone || null, role]
    );

    const userId = result.insertId as number;

    /* ── 4. Création de la session NextAuth ── */
    const token = await encode({
      token: {
        sub:   String(userId),
        name:  display_name,
        email,
        role,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 60 * 60 * 8, // 8h — identique à authOptions
    });

    // Nom du cookie selon l'environnement
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 8,
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}