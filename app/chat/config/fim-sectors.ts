/**
 * Configuration des secteurs et domaines du salon FIM 2026
 * Utilisé pour la détection locale et la validation des réponses OpenAI
 */

export const FIM_SECTORS = {
  IT_TELECOM: {
    id: "IT_TELECOM",
    name: "IT & Télécom",
    keywords: ["informatique", "it", "tech", "technologie", "digital", "ia", "logiciel", "cyber"],
    subcategories: ["Informatique", "Digital", "Innovation"],
    description: "Solutions numériques, IA, et innovations technologiques"
  },
  RESTAURATION: {
    id: "RESTAURATION",
    name: "Restauration",
    keywords: ["restaurant", "food court", "foodcourt", "manger", "cuisine", "restauration", "café"],
    subcategories: ["Food Court"],
    description: "Restauration, alimentation, et services de restauration rapide"
  },
  ARTISANAT: {
    id: "ARTISANAT",
    name: "Artisanat",
    keywords: ["artisan et association", "artisans"],
    subcategories: ["Artisanat"],
    description: "Artisanat, associations et créateurs"
  },
  FORMATION: {
    id: "FORMATION",
    name: "Formation & Université",
    keywords: ["formation & université", "formation et universite", "formation", "universite", "université", "education", "éducation", "enseignement", "école", "écoles", "études", "etudes", "orientation", "apprentissage", "cours", "campus", "métier", "metier", "métiers", "formation professionnelle", "centre de formation", "scolarité", "scolarite"],
    subcategories: ["Formation"],
    description: "Formation, université et éducation"
  },
  INSTITUTION: {
    id: "INSTITUTION",
    name: "Institution",
    keywords: ["institution", "institutions"],
    subcategories: ["Institution"],
    description: "Institutions, organisations et partenaires officiels"
  },
  SPONSOR: {
    id: "SPONSOR",
    name: "Sponsor",
    keywords: ["sponsor officiel et sponsor", "sponsors officiels & sponsors"],
    subcategories: ["Sponsor"],
    description: "Sponsors officiels et partenaires"
  },
  INDUSTRIE: {
    id: "INDUSTRIE",
    name: "Industrie",
    keywords: ["industrie", "fabrication", "production", "manufacture", "usine", "machine", "équipement", "outil", "commerce", "export", "industrie & commerce", "industrie et commerce"],
    subcategories: ["Industrie et Commerce"],
    description: "Fabrication, équipements, et solutions industrielles"
  },
  AGROALIM: {
    id: "AGROALIM",
    name: "Agro-alimentaire",
    keywords: ["agriculture", "agro", "ferme", "cultures", "produit local"],
    subcategories: ["Agriculture"],
    description: "Produits agricoles et agroalimentaires"
  },
  SERVICES: {
    id: "SERVICES",
    name: "Services",
    keywords: ["services", "consulting", "formation", "business", "banque", "finance"],
    subcategories: ["Services B2B", "Formation"],
    description: "Services aux entreprises, consulting, et formation"
  },
  ENERGIE: {
    id: "ENERGIE",
    name: "Énergie",
    keywords: ["énergie", "électricité", "renouvelable", "solaire", "panneau"],
    subcategories: ["Énergie"],
    description: "Solutions énergétiques et renouvelables"
  },
  BIEN_ETRE: {
    id: "BIEN_ETRE",
    name: "Bien-être",
    keywords: ["bien-être", "santé", "fitness", "sport", "cosmétique", "beauté"],
    subcategories: ["Santé", "Wellness"],
    description: "Santé, bien-être, et services de relaxation"
  },
  INNOVATION: {
    id: "INNOVATION",
    name: "Innovation",
    keywords: ["startup", "innovation", "entrepreneur", "venture"],
    subcategories: ["Startup"],
    description: "Startups et solutions innovantes"
  },
  IMMOBILIER: {
    id: "IMMOBILIER",
    name: "Immobilier",
    keywords: ["immobilier", "construction", "logement", "bâtiment"],
    subcategories: ["Immobilier"],
    description: "Immobilier, construction, et aménagement"
  },
} as const;

/**
 * Messages de fallback cohérents avec le contexte FIM
 */

export const FALLBACK_MESSAGES = {
  NO_LOCAL_DETECTION: "Je vais vous aider à trouver les meilleurs stands à la FIM. Qu'aimeriez-vous explorer ?",
  
  NO_AI_AVAILABLE: "Je suis disponible pour vous aider à explorer le salon FIM. Pouvez-vous me dire ce qui vous intéresse ?",
  
  OUT_OF_CONTEXT: "Je suis disponible pour vous aider à explorer les stands du salon FIM. Qu'aimeriez-vous trouver ? (Vous pouvez m'intéresser à la technologie, la restauration, l'agriculture, l'industrie...)",
  
  NO_STANDS_FOUND: "Je n'ai pas trouvé de stands correspondant à votre recherche. Essayez d'autres domaines ou contactez l'accueil pour plus d'aide.",
  
  WELCOME: "Bienvenue au salon FIM 2026 ! Je suis ici pour vous aider à trouver les stands qui vous intéressent. Qu'est-ce que vous recherchez ?",
};

/**
 * Exemples de demandes pour aider l'utilisateur
 */
export const EXAMPLE_QUERIES = [
  "Je veux voir les innovations technologiques",
  "Où puis-je manger au salon ?",
  "Montrez-moi les stands d'agriculture",
  "Quels services de consulting sont disponibles ?",
  "Je cherche des solutions d'énergie renouvelable",
];

/**
 * Obtenir tous les mots-clés pour la détection locale
 */
export function getAllKeywords(): string[] {
  return Object.values(FIM_SECTORS).flatMap(sector => sector.keywords);
}

/**
 * Valider si un mot-clé est pertinent au FIM
 */
export function isRelevantToFIM(keyword: string): boolean {
  return getAllKeywords().some(k => k.includes(keyword.toLowerCase()));
}
