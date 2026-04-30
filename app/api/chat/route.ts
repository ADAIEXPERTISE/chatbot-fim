import { OpenAI } from "openai";
import { FALLBACK_MESSAGES, FIM_SECTORS } from "@/app/chat/config/fim-sectors";

// Initialisation conditionnelle d'OpenAI (uniquement si la clé API est disponible)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Cache simple en mémoire (pour développement)
const responseCache = new Map<string, { reply: string; keywords: string[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string;

    if (!message || message.trim().length === 0) {
      return Response.json(
        { reply: "Veuillez entrer un message." },
        { status: 400 }
      );
    }

    // Analyze user input and map to keywords
    const { queryTerms, categories } = analyzeUserInput(message);

    if (queryTerms.length > 0) {
      console.log("✅ Query terms detected:", queryTerms, "categories: ", categories);

      // Fetch exhibitors based on detected keywords
      const exhibitors = await fetchExhibitorsByKeywords(queryTerms);

      if (exhibitors.length > 0) {
        const standsDetails = exhibitors.flatMap((exhibitor: any) =>
          exhibitor.stands?.map((stand: any) => ({
            exhibitorName: decodeHtml(stand.exhibitorName || exhibitor.exhibitorName),
            standCode: stand.standCode,
            zone: stand.zone,
            position: stand.position
          })) || []
        );

        const maxPreview = 5;
        const previewStands = standsDetails.slice(0, maxPreview);
        const remainingCount = Math.max(0, standsDetails.length - maxPreview);

        const standsText = previewStands
          .map(stand => `- ${stand.exhibitorName} : Stand ${stand.standCode} (Zone ${stand.zone})`)
          .join("\n");

        const moreText = remainingCount > 0 ? `\n- et ${remainingCount} autres stands...` : "";

        return Response.json({
          reply: `Basé sur votre intérêt pour "${categories.join(", ")}", voici quelques stands qui pourraient vous intéresser :\n\n${standsText}${moreText}\n\nVoir la liste complète dans la bulle de recommandations ci-dessous. Voulez-vous voir leur localisation sur la carte ?`,
          keywords: queryTerms,
          detectedCategories: categories,
          exhibitors,
          stands: standsDetails,
          source: "local"
        });
      }

      return Response.json({
        reply: `Je trouve des intérêts comme "${categories.join(", ")}" mais aucun stand confirmé n'a été trouvé. Voulez-vous préciser votre recherche ?`,
        keywords: queryTerms,
        detectedCategories: categories,
        source: "local_no_result"
      });
    }

    // Fallback response if no keywords are found
    return Response.json({
      reply: "Je vais vous aider à trouver les meilleurs stands à la FIM. Qu'aimeriez-vous explorer ?",
      keywords: [],
      source: "fallback"
    });

  } catch (error) {
    console.error("Erreur dans /api/chat:", error);
    return Response.json(
      { reply: "Une erreur s'est produite. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

// 🤖 Prompt OPTIMISÉ - Ultra-cadré pour OpenAI
function getOptimizedSystemPrompt(): string {
  return ` CONTEXTE FIM 2026

RÔLE: Chatbot d'assistance pour visiteurs du salon FIM 2026 à Antananarivo.

SECTEURS DISPONIBLES:
- Agro-alimentaire (agriculture, nourriture, restauration)
- IT & Télécom (informatique, digital, innovation, logiciels, IA)
- Industrie et commerce (manufacture, équipements, production)
- Services (consulting, formation, business)
- Énergie (électricité, renouvelable, solaire)
- Bien-être (santé, fitness, spa)
- Immobilier et construction
- Sponsors et partenaires
- Et plus...

RÈGLES STRICTES:
1. Tu es un assistant UNIQUEMENT pour le salon FIM
2. Ton but: Aider le visiteur à trouver des STANDS et des EXPOSANTS
3. Tu extrais les MOTS-CLÉS de la demande pour rechercher des stands
4. TU NE FAIS PAS de suggestions générales (musée, parc, café externe, loisirs non-FIM)
5. Si la demande est complètement hors contexte, tu dis: "Je suis disponible pour vous aider à explorer les stands du salon FIM. Qu'aimeriez-vous trouver?"

TÂCHE:
- Analyse la demande du visiteur
- Extrait 1-3 mots-clés pertinents pour rechercher des stands
- Donne une réponse ACCUEILLANTE et CONTEXTUALISÉE au FIM

FORMAT RÉPONSE (JSON strictement):
{
  "reply": "Message amical et court qui reformule la demande dans le contexte FIM",
  "keywords": ["mot-clé1", "mot-clé2"]
}

EXEMPLES:
- "Je veux manger" → {"reply": "Vous cherchez la zone Food Court? Laissez-moi vous montrer les restaurants du salon!", "keywords": ["restauration", "food"]}
- "Y a pas de musée?" → {"reply": "Je suis disponible pour explorer les stands innovants du salon FIM. Intéressé par la technologie ou l'art local?", "keywords": []}
- "Je suis intéressé par l'informatique" → {"reply": "Excellent! Le secteur IT & Télécom du salon propose de nombreuses solutions. Laissez-moi vous montrer...", "keywords": ["informatique", "IT", "technology"]}`;
}

// 🤖 Fonction pour analyser avec l'IA et extraire mots-clés (OPTIMISÉE)
async function analyzeWithAI(userMessage: string): Promise<{
  reply: string;
  keywords: string[];
}> {
  // Si OpenAI n'est pas disponible, retourner une réponse par défaut
  if (!openai) {
    console.warn("OpenAI non disponible - utilisation de la réponse par défaut");
    return {
      reply: "Je vais vous aider à trouver les meilleurs stands à la FIM. Qu'aimeriez-vous explorer ?",
      keywords: [],
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: getOptimizedSystemPrompt() },
        { role: "user", content: userMessage },
      ],
      max_tokens: 120,
      temperature: 0.2, // Très faible pour être déterministe
      response_format: { type: "json_object" }, // Force JSON si disponible
    });

    const content = completion.choices[0].message.content || "{}";
    console.log("📤 Réponse OpenAI brute:", content);

    // Parser la réponse JSON
    let analysis: any = {};
    try {
      analysis = JSON.parse(content);
    } catch {
      // Essayer de trouver du JSON dans la réponse
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        console.warn("Réponse IA non parsable:", content);
        return {
          reply: "Je suis disponible pour vous aider à explorer le salon FIM. Qu'aimeriez-vous trouver ?",
          keywords: [],
        };
      }
    }

    // Valider et nettoyer la réponse
    const reply = (analysis.reply || "Je suis disponible pour vous aider à explorer le salon FIM.").substring(0, 300);
    const keywords = (Array.isArray(analysis.keywords) ? analysis.keywords : [])
      .filter((k: any) => typeof k === 'string' && k.length > 0)
      .map((k: any) => k.toLowerCase())
      .slice(0, 3); // Max 3 mots-clés

    return { reply, keywords };
  } catch (error) {
    console.error("Erreur analyse IA:", error);
    return {
      reply: "Je suis disponible pour vous aider à explorer le salon FIM. Qu'aimeriez-vous trouver ?",
      keywords: [],
    };
  }
}

function decodeHtml(html: string): string {
  return html.replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Fonction pour détecter les centres d'intérêt dans un message (OPTIMISÉE)
function detectInterests(message: string): string[] {
  const lowerMessage = message.toLowerCase();

  // Dictionnaire ÉTENDU avec TOUS les mots-clés du schéma FIM
  const keywordMap: Record<string, string[]> = {
    // IT & Technologie
    informatique: ["informatique", "it", "tech", "technologie", "innovation", "digital", "ia", "intelligence artificielle", "logiciel", "app", "application", "programme", "cyber", "data", "cloud"],
    
    // Restauration & Food
    restauration: ["restaurant", "food court", "manger", "cuisine", "boisson", "café", "repas", "plat", "déjeuner", "diner", "snack", "foodcourt", "nourriture", "menu", "resto"],
    
    // Artisanat & Associations
    artisan: ["artisan et association", "artisans"],
    
    // Formation & Université
    formation: ["formation & université", "formation et universite", "formation", "universite", "université", "education", "éducation", "enseignement", "école", "écoles", "études", "etudes", "orientation", "apprentissage", "cours", "campus", "métier", "metier", "métiers", "formation professionnelle", "centre de formation", "scolarité", "scolarite"],
    
    // Agriculture
    agriculture: ["agriculture", "agro", "ferme", "cultures", "elevage", "plantation", "semence", "tracteur", "moisson", "produit local", "bio"],
    
    // Industrie
    industrie: ["industrie", "fabrication", "production", "manufacture", "usine", "machine", "équipement", "outil", "commerce", "export", "industrie & commerce", "industrie et commerce"],
    
    // Services & Business
    services: ["services", "consulting", "conseil", "formation", "business", "entreprise", "gestion", "management", "banque", "finance", "institution", "institutions", "sponsor officiel et sponsor", "sponsors officiels & sponsors"],
    
    // Énergie
    energie: ["énergie", "électricité", "renouvelable", "solaire", "panneau", "éolienne", "biomasse", "hydro"],
    
    // Bien-être
    bien_etre: ["bien-être", "santé", "fitness", "sport", "médecine", "cosmétique", "beauté", "spa", "wellness"],
    
    // Environnement
    environnement: ["environnement", "écologie", "durable", "vert", "nature", "recyclage", "déchet", "pollution"],
    
    // Immobilier
    immobilier: ["immobilier", "construction", "logement", "appartement", "maison", "bâtiment"],
    
    // Startup & Innovation
    startup: ["startup", "innovation", "entrepreneur", "jeune entreprise", "venture"],
  };

  const detectedInterests: string[] = [];

  // Vérifier chaque catégorie
  for (const [category, words] of Object.entries(keywordMap)) {
    if (words.some(word => lowerMessage.includes(word))) {
      detectedInterests.push(category);
    }
  }

  // Détection avancée: phrases spécifiques courantes
  const commonPhrases = {
    restauration: ["j'ai faim", "je veux manger", "chercher restaurant", "où manger", "bon resto", "food court"],
    informatique: ["nouvelles tech", "innovation tech", "dernieres techno", "avancées tech"],
    formation: ["education", "éducation", "enseignement", "écoles", "école", "orientation", "apprentissage", "études", "formation professionnelle", "centre de formation"],
    agriculture: ["produits locaux", "agriculture bio", "fermes locales", "cultures malgaches"],
    bien_etre: ["prendre soin", "relaxation", "coaching"],
  };

  for (const [category, phrases] of Object.entries(commonPhrases)) {
    if (phrases.some(phrase => lowerMessage.includes(phrase))) {
      if (!detectedInterests.includes(category)) {
        detectedInterests.push(category);
      }
    }
  }

  // Limiter à 3 intérêts max pour éviter trop de résultats
  return detectedInterests.slice(0, 3);
}

// Mapping de recherche optimisé pour l’analyse utilisateur
const SEARCH_KEYWORD_MAP: Record<string, string[]> = {
  informatique: ["informatique", "it", "tech", "technologie", "innovation", "digital", "ia", "intelligence artificielle", "logiciel", "app", "application", "programme", "cyber", "data", "cloud"],
  restauration: ["restaurant", "food court", "foodcourt", "manger", "cuisine", "boisson", "café", "repas", "plat", "déjeuner", "diner", "snack", "nourriture", "menu", "resto"],
  artisan: ["artisan et association", "artisans"],
  formation: ["formation & université", "formation et universite", "formation", "universite", "université", "education", "éducation", "enseignement", "écoles", "école", "études", "etudes", "orientation", "apprentissage", "cours", "campus", "métier", "metier", "métiers", "formation professionnelle", "centre de formation", "scolarité", "scolarite"],
  agriculture: ["agriculture", "agro", "ferme", "cultures", "élevage", "plantation", "semence", "tracteur", "moisson", "produit local", "bio"],
  industrie: ["industrie", "fabrication", "production", "manufacture", "usine", "machine", "équipement", "outil", "commerce", "export", "industrie & commerce", "industrie et commerce"],
  services: ["services", "consulting", "conseil", "formation", "business", "entreprise", "gestion", "management", "banque", "finance", "institution", "institutions", "sponsor officiel et sponsor", "sponsors officiels & sponsors"],
  energie: ["énergie", "électricité", "renouvelable", "solaire", "panneau", "éolienne", "biomasse", "hydro"],
  bien_etre: ["bien-être", "bien etre", "bienetre", "santé", "sante", "fitness", "sport", "médecine", "medecine", "cosmétique", "cosmetique", "beauté", "beaute", "spa", "wellness"],
  environnement: ["environnement", "écologie", "ecologie", "durable", "vert", "nature", "recyclage", "déchet", "dechet", "pollution"],
  immobilier: ["immobilier", "construction", "logement", "appartement", "maison", "bâtiment", "batiment"],
  startup: ["startup", "start-up", "innovation", "entrepreneur", "jeune entreprise", "venture"],
};

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function analyzeUserInput(message: string): { queryTerms: string[]; categories: string[] } {
  const normalizedMessage = normalizeText(message);
  const queryTerms = new Set<string>();
  const categories = new Set<string>();

  for (const [category, keywords] of Object.entries(SEARCH_KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (normalizedMessage.includes(normalizeText(keyword))) {
        queryTerms.add(keyword);
        categories.add(category);
      }
    }
  }

  return {
    queryTerms: Array.from(queryTerms).slice(0, 8),
    categories: Array.from(categories).slice(0, 3),
  };
}

// Function to query the database for exhibitors based on keywords
async function fetchExhibitorsByKeywords(keywords: string[]): Promise<any[]> {
  const query = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/recommendations`;

  try {
    const response = await fetch(query, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: keywords.join(" ") }),
    });

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error("Error fetching exhibitors:", error);
    return [];
  }
}
