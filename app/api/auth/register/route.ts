// import { NextResponse } from "next/server";
// import { encode } from "next-auth/jwt";
// import { cookies } from "next/headers";
// import pool from "@/lib/db";
// import type { RowDataPacket, ResultSetHeader } from "mysql2";

// export async function POST(req: Request) {
//   const { display_name, email, phone, role } = await req.json();

//   if (!display_name || !email || !role) {
//     return NextResponse.json({ message: "Champs manquants." }, { status: 400 });
//   }

//   const validRoles = ["visiteur", "exposant", "professionnel"];
//   if (!validRoles.includes(role)) {
//     return NextResponse.json({ message: "Rôle invalide." }, { status: 400 });
//   }

//   // ✅ Sortir cookies() AVANT le try-catch pour éviter le gel
//   const cookieStore = await cookies();

//   const isProd = process.env.NODE_ENV === "production";
//   const cookieName = isProd
//     ? "__Secure-authjs.session-token"
//     : "authjs.session-token";

//   try {
//     const [rows] = await pool.execute<RowDataPacket[]>(
//       "SELECT visitor_id FROM visitor WHERE email = ? LIMIT 1",
//       [email],
//     );

//     if (rows.length > 0) {
//       return NextResponse.json(
//         { message: "Email déjà utilisé." },
//         { status: 409 },
//       );
//     }

//     const [result] = await pool.execute<ResultSetHeader>(
//       `INSERT INTO visitor (display_name, email, phone, role) VALUES (?, ?, ?, ?)`,
//       [display_name, email, phone || null, role],
//     );

//     const userId = result.insertId;

//     const token = await encode({
//       token: { sub: String(userId), name: display_name, email, role },
//       secret: process.env.NEXTAUTH_SECRET!,
//       salt: cookieName,
//       maxAge: 60 * 60 * 8,
//     });

//     cookieStore.set(cookieName, token, {
//       httpOnly: true,
//       secure: isProd,
//       sameSite: "lax",
//       path: "/",
//       maxAge: 60 * 60 * 8,
//     });

//     return NextResponse.json({ ok: true });
//   } catch (err) {
//     console.error("[register]", err);
//     return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
//   }
// }

// import { NextResponse } from "next/server";
// import { encode } from "next-auth/jwt";
// import { cookies } from "next/headers";
// import pool from "@/lib/db";
// import type { RowDataPacket, ResultSetHeader } from "mysql2";

// export async function POST(req: Request) {
//   try {
//     const { display_name, email, phone, role } = await req.json();

//     // 1. Validation de base
//     if (!display_name || !email || !role) {
//       return NextResponse.json({ message: "Champs manquants." }, { status: 400 });
//     }

//     const validRoles = ["visiteur", "exposant", "professionnel"];
//     if (!validRoles.includes(role)) {
//       return NextResponse.json({ message: "Rôle invalide." }, { status: 400 });
//     }

//     // 2. Vérification de l'existence de l'utilisateur
//     const [rows] = await pool.execute<RowDataPacket[]>(
//       "SELECT visitor_id FROM visitor WHERE email = ? LIMIT 1",
//       [email]
//     );

//     if (rows.length > 0) {
//       return NextResponse.json({ message: "Email déjà utilisé." }, { status: 409 });
//     }

//     // 3. Insertion en base de données
//     const [result] = await pool.execute<ResultSetHeader>(
//       `INSERT INTO visitor (display_name, email, phone, role) VALUES (?, ?, ?, ?)`,
//       [display_name, email, phone || null, role]
//     );

//     const userId = result.insertId;

//     // 4. Création manuelle de la session (JWT)
//     // On récupère le secret et on définit le nom du cookie selon l'environnement
//     const secret = process.env.NEXTAUTH_SECRET;
//     if (!secret) {
//       throw new Error("NEXTAUTH_SECRET is not defined");
//     }

//     const isProd = process.env.NODE_ENV === "production";
//     const cookieName = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";

//     // Encodage du jeton avec les données dont useSession() aura besoin
//     const token = await encode({
//       token: {
//         sub: String(userId),
//         name: display_name,
//         email,
//         role
//       },
//       secret: secret,
//       salt: cookieName,
//       maxAge: 60 * 60 * 8, // 8 heures
//     });

//     // 5. Configuration du Cookie
//     const cookieStore = await cookies();
//     cookieStore.set(cookieName, token, {
//       httpOnly: true,
//       secure: isProd,
//       sameSite: "lax",
//       path: "/",
//       maxAge: 60 * 60 * 8,
//     });

//     return NextResponse.json({
//         ok: true,
//         message: "Utilisateur créé et session initialisée"
//     }, { status: 201 });

//   } catch (err) {
//     console.error("[REGISTER_ERROR]", err);
//     return NextResponse.json({ message: "Erreur serveur interne." }, { status: 500 });
//   }
// }

// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import pool from "@/lib/db";

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
      [email],
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { message: "Email déjà utilisé." },
        { status: 409 },
      );
    }

    /* ── 3. Insertion ── */
    const [result] = await pool.execute<any>(
      `INSERT INTO visitor (display_name, email, phone, role)
       VALUES (?, ?, ?, ?)`,
      [display_name, email, phone || null, role],
    );

    const userId = result.insertId as number;

    /* ── 4. Création de la session NextAuth ── */
    const token = await encode({
      token: {
        sub: String(userId),
        name: display_name,
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 5,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
