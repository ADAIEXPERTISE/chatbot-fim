import { pool } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const [rows] = await pool.execute(
      `SELECT keyword_id, keyword_name
       FROM keyword
       ORDER BY keyword_name ASC`,
    );

    return Response.json({ success: true, keywords: rows });
  } catch (error) {
    console.error('Erreur dans /api/keywords:', error);
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
