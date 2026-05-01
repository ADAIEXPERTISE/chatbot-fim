import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Ce code s'exécute une fois que l'utilisateur est authentifié
    // Tu peux voir l'ID ici si besoin : console.log(req.nextauth.token.id)
  },
  {
    callbacks: {
      // Le middleware ne laisse passer que si cette fonction retourne true
      authorized: ({ token }) => !!token, 
    },
    pages: {
      signIn: "/login", // Redirige ici si l'utilisateur n'est pas connecté
    },
  }
);

export const config = {
  // Liste toutes les routes que tu veux protéger
  // Ici, on protège la racine "/"
  matcher: ["/"], 
};