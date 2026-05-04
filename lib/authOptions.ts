// // lib/authOptions.ts
// import { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";
// import pool from "@/lib/db";  // ← import pool directly

// export const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID as string,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//     },

//   ),
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Mot de passe", type: "password" },
//       },
//       async authorize(credentials) {
//         console.log("🔐 authorize called with:", credentials?.email);

//         if (!credentials?.email || !credentials?.password) {
//           throw new Error("MISSING_FIELDS");
//         }

//         try {
//           // ✅ Use pool directly — no createConnection needed
//           const [rows] = await pool.execute<any[]>(
//             "SELECT * FROM visitor WHERE email = ? LIMIT 1",
//             [credentials.email]
//           );
//           const user = (rows as any[])[0];

//           if (!user) throw new Error("EMAIL_NOT_FOUND");
//           if (!user.password) throw new Error("USE_GOOGLE");

//           const isValid = await bcrypt.compare(
//             credentials.password,
//             user.password
//           );
//           if (!isValid) throw new Error("WRONG_PASSWORD");

//           return {
//             id: user.visitor_id,
//             name: user.display_name,
//             email: user.email,
//             role: user.role,
//           };
//         } catch (err) {
//           console.error("[authorize] error:", err);
//           throw err;
//         }
//       },
//     }),
//   ],
//   session: {
//     strategy: "jwt",
//     maxAge: 60 * 60 * 8,
//     updateAge: 0,
//   },
//   jwt: {
//     maxAge: 60 * 60 * 24 * 5,
//   },
// };

// lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 authorize called with:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          throw new Error("MISSING_FIELDS");
        }

        try {
          const [rows] = await pool.execute<any[]>(
            "SELECT * FROM visitor WHERE email = ? LIMIT 1",
            [credentials.email], // ✅ fixed
          );
          const user = (rows as any[])[0];

          if (!user) throw new Error("EMAIL_NOT_FOUND");
          if (!user.password) throw new Error("USE_GOOGLE");

          const isValid = await bcrypt.compare(
            // ✅ fixed
            credentials.password,
            user.password,
          );
          if (!isValid) throw new Error("WRONG_PASSWORD");

          return {
            id: user.visitor_id,
            name: user.display_name,
            email: user.email, // ✅ fixed
            role: user.role,
          };
        } catch (err) {
          console.error("[authorize] error:", err);
          throw err;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "user";
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 0,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 5,
  },
};
