import { NextRequest, NextResponse } from "next/server";
import { getEntry, deleteEntry } from "@/lib/otp-store";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2/promise";

// Basic password validation
function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

// Database configuration (Should be in a separate lib/db.ts file usually)
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Email et mot de passe requis." }, { status: 400 });
  }

  const entry = getEntry(email);
  console.log(entry)
  if (!entry || !entry.verified) {
    return NextResponse.json({ success: false, message: "Session invalide ou email non vérifié." }, { status: 403 });
  }

  if (!isStrongPassword(password)) {
    return NextResponse.json({ success: false, message: "Le mot de passe est trop faible." }, { status: 400 });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // 1. Prepare Data
    const visitor_id = uuidv4();
    const display_name = `${entry.pendingUser.display_name}`;
    const hashedPassword = await bcrypt.hash(password, 12);
    const phone = entry.pendingUser.phone || null;

    // 2. Insert into "visitor" table
    const [result] = await connection.execute(
      `INSERT INTO visitor (visitor_id, display_name, email, password, phone, role) 
       VALUES (?, ?, ?, ?, ?, 'visiteur')`,
      [visitor_id, display_name, email, hashedPassword, phone]
    );

    await connection.end();

    // Clean up OTP store
    deleteEntry(email);

    // 3. Create Session Payload (Matching your existing logic)
    const sessionPayload = Buffer.from(
      JSON.stringify({ id: visitor_id, firstName: entry.pendingUser.display_name, email })
    ).toString("base64");

    const response = NextResponse.json(
      {
        success: true,
        message: "Compte créé avec succès !",
        user: { id: visitor_id, firstName: entry.pendingUser.display_name, email },
      },
      { status: 201 }
    );

    response.cookies.set("session", sessionPayload, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error: any) {
    console.error("Database Error:", error);
    // Handle Duplicate Email
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ success: false, message: "Cet email est déjà utilisé." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error }, { status: 500 });
  }
}