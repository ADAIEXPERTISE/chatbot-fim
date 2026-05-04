// // app/api/auth/[...nextauth]/route.ts

// import NextAuth, { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
// import mysql from "mysql2/promise";
// import bcrypt from "bcryptjs";
// import { dbConfig } from "@/lib/db";

// type VisitorRow = {
//   visitor_id: string;
//   display_name: string | null;
//   email: string;
//   password: string | null;
//   phone: string | null;
//   role: "visiteur" | "exposant" | "staff" | "admin";
// };

// export const authOptions: NextAuthOptions = {
//   providers: [
//     // ── 1. Google OAuth ──────────────────────────────────────────────────────
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),

//     // ── 2. Email + Mot de passe ──────────────────────────────────────────────
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Mot de passe", type: "password" },
//       },

//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error("Email et mot de passe requis.");
//         }

//         const connection = await mysql.createConnection(dbConfig);
//         try {
//           const [rows] = await connection.execute<mysql.RowDataPacket[]>(
//             "SELECT * FROM visitor WHERE email = ? LIMIT 1",
//             [credentials.email],
//           );

//           const user = rows[0] as VisitorRow | undefined;

//           if (!user) throw new Error("Aucun compte trouvé avec cet email.");
//           if (!user.password)
//             throw new Error(
//               "Ce compte utilise la connexion Google. Clique sur 'Continuer avec Google'.",
//             );

//           const passwordOk = await bcrypt.compare(
//             credentials.password,
//             user.password,
//           );
//           if (!passwordOk) throw new Error("Mot de passe incorrect.");

//           // ✓ On retourne le visitor_id de TA base — pas l'id Google
//           return {
//             id: user.visitor_id,
//             name: user.display_name ?? user.email,
//             email: user.email,
//             role: user.role,
//           };
//         } finally {
//           await connection.end();
//         }
//       },
//     }),
//   ],

//   callbacks: {
//     // ── signIn : crée le visiteur Google en BDD s'il n'existe pas ─────────────
//     async signIn({ user, account }) {
//       if (account?.provider !== "google") return true;

//       const connection = await mysql.createConnection(dbConfig);
//       try {
//         const [rows] = await connection.execute<mysql.RowDataPacket[]>(
//           "SELECT visitor_id FROM visitor WHERE email = ? LIMIT 1",
//           [user.email],
//         );

//         if (rows.length === 0) {
//           // Nouveau compte Google → INSERT dans visitor
//           await connection.execute(
//             `INSERT INTO visitor (visitor_id, display_name, email, role)
//              VALUES (?, ?, ?, 'visiteur')`,
//             [crypto.randomUUID(), user.name ?? null, user.email],
//           );
//         }
//         return true;
//       } catch (error) {
//         console.error("Erreur signIn Google :", error);
//         return false;
//       } finally {
//         await connection.end();
//       }
//     },

//     // ── jwt : stocke le visitor_id ET le role dans le token ───────────────────
//     async jwt({ token, user, account }) {
//       // Cas 1 — Connexion credentials : `user` contient déjà le visitor_id
//       if (user && account?.provider === "credentials") {
//         token.id = user.id;
//         token.role = (user as { role?: string }).role ?? "visiteur";
//         token.name = user.name;
//       }

//       // Cas 2 — Connexion Google : `user.id` est l'ID Google, pas le visitor_id
//       // On va chercher le vrai visitor_id en base à partir de l'email
//       if (user && account?.provider === "google") {
//         const connection = await mysql.createConnection(dbConfig);
//         try {
//           const [rows] = await connection.execute<mysql.RowDataPacket[]>(
//             "SELECT visitor_id, role, display_name FROM visitor WHERE email = ? LIMIT 1",
//             [user.email],
//           );

//           const visitor = rows[0] as
//             | Pick<VisitorRow, "visitor_id" | "role" | "display_name">
//             | undefined;

//           if (visitor) {
//             token.id = visitor.visitor_id; // ← le vrai ID de ta BDD
//             token.role = visitor.role;
//             token.name = visitor.display_name ?? user.name;
//           }
//         } finally {
//           await connection.end();
//         }
//       }

//       return token;
//     },

//     // ── session : expose id, role, name au client ─────────────────────────────
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         session.user.role = token.role as string;
//         session.user.name = token.name as string;
//       }
//       return session;
//     },
//   },

//   pages: {
//     signIn: "/",
//     error: "/",
//   },

//   session: {
//     strategy: "jwt",
//     maxAge: 60 * 60 * 24 * 7,
//   },

//   secret: process.env.NEXTAUTH_SECRET,
//   debug: process.env.NODE_ENV === "development",
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };
// app/api/auth/[...nextauth]/route.ts

// import NextAuth, { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
// import mysql from "mysql2/promise";
// import bcrypt from "bcryptjs";
// import { dbConfig } from "@/lib/db";

// type VisitorRow = {
//   visitor_id: string;
//   display_name: string | null;
//   email: string;
//   password: string | null;
//   phone: string | null;
//   role: "visiteur" | "exposant" | "staff" | "admin";
// };

// export const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Mot de passe", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error("Email et mot de passe requis.");
//         }

//         const connection = await mysql.createConnection(dbConfig);
//         try {
//           const [rows] = await connection.execute<mysql.RowDataPacket[]>(
//             "SELECT * FROM visitor WHERE email = ? LIMIT 1",
//             [credentials.email]
//           );

//           const user = rows[0] as VisitorRow | undefined;

//           if (!user) throw new Error("Aucun compte trouvé avec cet email.");
//           if (!user.password)
//             throw new Error("Ce compte utilise la connexion Google. Clique sur 'Continuer avec Google'.");

//           const passwordOk = await bcrypt.compare(credentials.password, user.password);
//           if (!passwordOk) throw new Error("Mot de passe incorrect.");

//           return {
//             id: user.visitor_id,
//             name: user.display_name ?? user.email,
//             email: user.email,
//             role: user.role,
//           };
//         } finally {
//           await connection.end();
//         }
//       },
//     }),
//   ],

//   callbacks: {
//     async signIn({ user, account }) {
//       if (account?.provider !== "google") return true;

//       const connection = await mysql.createConnection(dbConfig);
//       try {
//         const [rows] = await connection.execute<mysql.RowDataPacket[]>(
//           "SELECT visitor_id FROM visitor WHERE email = ? LIMIT 1",
//           [user.email]
//         );

//         if (rows.length === 0) {
//           await connection.execute(
//             `INSERT INTO visitor (visitor_id, display_name, email, role)
//              VALUES (?, ?, ?, 'visiteur')`,
//             [crypto.randomUUID(), user.name ?? null, user.email]
//           );
//         }
//         return true;
//       } catch (error) {
//         console.error("Erreur signIn Google :", error);
//         return false;
//       } finally {
//         await connection.end();
//       }
//     },

//     async jwt({ token, user, account }) {
//       if (user) {
//         token.id = user.id;
//         token.role = (user as any).role ?? "visiteur";
//         token.name = user.name;
//       }

//       if (!token.id && token.email) {
//         const connection = await mysql.createConnection(dbConfig);
//         try {
//           const [rows] = await connection.execute<mysql.RowDataPacket[]>(
//             "SELECT visitor_id, role, display_name FROM visitor WHERE email = ? LIMIT 1",
//             [token.email]
//           );
//           const visitor = rows[0] as VisitorRow | undefined;
//           if (visitor) {
//             token.id = visitor.visitor_id;
//             token.role = visitor.role;
//             token.name = visitor.display_name ?? token.name;
//           }
//         } finally {
//           await connection.end();
//         }
//       }
//       return token;
//     },

//     async session({ session, token }) {
//       if (session.user) {
//         (session.user as any).id = token.id;
//         (session.user as any).role = token.role;
//       }
//       return session;
//     },
//   },

//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },

//   session: {
//     strategy: "jwt",
//     maxAge: 60 * 60 * 24 * 7,
//   },

//   secret: process.env.NEXTAUTH_SECRET,
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };


import NextAuth from "next-auth";
import {authOptions} from "@/lib/authOptions";


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST}
