import { pool } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const [questionRows] = await pool.execute(
      'SELECT question_id, question, type, depends_on_question_id, depends_on_response FROM question ORDER BY question_id'
    );

    const questions = Array.isArray(questionRows) ? questionRows : [];
    const questionIds = questions.map((question: any) => question.question_id);

    let choiceRows: any[] = [];
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => '?').join(',');
      const [choicesResult] = await pool.execute(
        `SELECT choice_id, question_id, response FROM response_choice WHERE question_id IN (${placeholders}) ORDER BY question_id, choice_id`,
        questionIds,
      );
      choiceRows = Array.isArray(choicesResult) ? choicesResult : [];
    }

    const choicesByQuestion = choiceRows.reduce((acc: Record<number, Array<{ choice_id: number; response: string }>>, row: any) => {
      const questionId = row.question_id;
      if (!acc[questionId]) acc[questionId] = [];
      acc[questionId].push({ choice_id: row.choice_id, response: row.response });
      return acc;
    }, {});

    const payload = questions.map((question: any) => ({
      questionId: question.question_id,
      question: question.question,
      type: question.type,
      dependsOnQuestionId: question.depends_on_question_id,
      dependsOnResponse: question.depends_on_response,
      choices: choicesByQuestion[question.question_id]?.map((choice) => ({
        choiceId: choice.choice_id,
        label: choice.response,
      })) || undefined,
    }));

    return Response.json({ success: true, questions: payload });
  } catch (error) {
    console.error('Erreur dans l\'API satisfaction GET:', error);
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    if (!answers || !Array.isArray(answers)) {
      return Response.json(
        { error: "answers parameter is required and must be an array" },
        { status: 400 }
      );
    }

    const visitorId = uuidv4();
    await pool.execute(
      'INSERT INTO visitor (visitor_id, display_name, role) VALUES (?, ?, ?)',
      [visitorId, 'Visiteur Anonyme', 'visiteur']
    );

    const insertPromises = answers.map(async (answer: any) => {
      const responseText = answer.response || '';
      const questionType = answer.questionType || '';

      const isChoiceType = questionType === 'choice' || questionType === 'multi';
      const isScaleOrRating = questionType === 'scale' || questionType === 'rating';

      if (Array.isArray(answer.choiceIds) && answer.choiceIds.length > 0) {
        if (isChoiceType) {
          const choiceChecks = await Promise.all(
            answer.choiceIds.map((choiceId: number) =>
              pool.execute(
                'SELECT choice_id FROM response_choice WHERE choice_id = ? AND question_id = ?',
                [choiceId, answer.questionId]
              )
            )
          );

          const invalidChoice = choiceChecks.some((choiceCheck: any) => (choiceCheck[0] as any[]).length === 0);
          if (invalidChoice) {
            throw new Error(`Choix invalide pour la question ${answer.questionId}`);
          }
        }

        return pool.execute(
          'INSERT INTO response (visitor_id, question_id, response, submitted_at) VALUES (?, ?, ?, NOW())',
          [visitorId, answer.questionId, responseText]
        );
      }

      if (answer.choiceId) {
        if (isChoiceType) {
          const [choiceCheck] = await pool.execute(
            'SELECT choice_id FROM response_choice WHERE choice_id = ? AND question_id = ?',
            [answer.choiceId, answer.questionId]
          );

          if ((choiceCheck as any[]).length === 0) {
            throw new Error(`Choix invalide pour la question ${answer.questionId}`);
          }
        }

        return pool.execute(
          'INSERT INTO response (visitor_id, question_id, response, submitted_at) VALUES (?, ?, ?, NOW())',
          [visitorId, answer.questionId, responseText]
        );
      }

      return pool.execute(
        'INSERT INTO response (visitor_id, question_id, response, submitted_at) VALUES (?, ?, ?, NOW())',
        [visitorId, answer.questionId, responseText]
      );
    });

    await Promise.all(insertPromises);

    console.log(`Questionnaire de satisfaction enregistré pour le visiteur ${visitorId}:`, answers);

    return Response.json({
      success: true,
      message: "Questionnaire enregistré avec succès",
      answersCount: answers.length,
      visitorId,
    });
  } catch (error) {
    console.error("Erreur dans l'API satisfaction:", error);
    return Response.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
