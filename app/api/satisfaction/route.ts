import { pool } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    if (!answers || !Array.isArray(answers)) {
      return Response.json(
        { error: "answers parameter is required and must be an array" },
        { status: 400 }
      );
    }

    // Générer un ID unique pour le visiteur
    const visitorId = uuidv4();

    // Insérer le visiteur
    await pool.execute(
      'INSERT INTO visitor (visitor_id, display_name, role) VALUES (?, ?, ?)',
      [visitorId, 'Visiteur Anonyme', 'visiteur']
    );

    // Insérer les réponses
    const insertPromises = answers.map(async (answer: any) => {
      // Pour les questions à choix, vérifier que le choice_id existe
      if (answer.choiceId) {
        // Vérifier que le choice_id existe pour cette question
        const [choiceCheck] = await pool.execute(
          'SELECT choice_id FROM response_choice WHERE choice_id = ? AND question_id = ?',
          [answer.choiceId, answer.questionId]
        );

        if ((choiceCheck as any[]).length === 0) {
          throw new Error(`Choix invalide pour la question ${answer.questionId}`);
        }

        // Insérer avec choice_id
        return pool.execute(
          'INSERT INTO response (visitor_id, question_id, choice_id, submitted_at) VALUES (?, ?, ?, NOW())',
          [visitorId, answer.questionId, answer.choiceId]
        );
      } else {
        // Question à texte libre
        return pool.execute(
          'INSERT INTO response (visitor_id, question_id, response, submitted_at) VALUES (?, ?, ?, NOW())',
          [visitorId, answer.questionId, answer.response || '']
        );
      }
    });

    await Promise.all(insertPromises);

    console.log(`Questionnaire de satisfaction enregistré pour le visiteur ${visitorId}:`, answers);

    return Response.json({
      success: true,
      message: "Questionnaire enregistré avec succès",
      answersCount: answers.length,
      visitorId: visitorId
    });
  } catch (error) {
    console.error("Erreur dans l'API satisfaction:", error);
    return Response.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
