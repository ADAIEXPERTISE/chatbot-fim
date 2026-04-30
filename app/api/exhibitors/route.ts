import { pool } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const keywordId = url.searchParams.get('keywordId');
    const keywordIds = url.searchParams.get('keywordIds');
    const keywordName = url.searchParams.get('keywordName');
    const exhibitorId = url.searchParams.get('exhibitorId');

    if (!keywordId && !keywordIds && !keywordName && !exhibitorId) {
      return Response.json(
        { error: "Paramètre 'keywordId', 'keywordIds', 'keywordName' ou 'exhibitorId' requis" },
        { status: 400 },
      );
    }

    let query = `SELECT e.exhibitor_id, e.exhibitor_name, e.exhibitor_type,
              st.stand_code, st.pos_x, st.pos_y, st.status, z.zone_name
       FROM exhibitor e
       LEFT JOIN stands st ON e.exhibitor_id = st.exhibitor_id
       LEFT JOIN zone z ON st.zone_id = z.id`;

    let params: any[] = [];

    if (exhibitorId) {
      // Récupérer tous les stands d'un exposant spécifique
      query += ` WHERE e.exhibitor_id = ? AND st.status = 'confirmed' ORDER BY st.stand_code`;
      params.push(exhibitorId);
    } else {
      // Récupérer les exposants groupés par keyword (liste unique)
      query += ` JOIN exhibitor_keyword ek ON e.exhibitor_id = ek.exhibitor_id`;

      if (keywordIds) {
        const ids = keywordIds.split(',').map((id) => id.trim()).filter(Boolean);
        const placeholders = ids.map(() => '?').join(',');
        query += ` WHERE ek.keyword_id IN (${placeholders})`;
        params.push(...ids);
      } else if (keywordId) {
        query += ` WHERE ek.keyword_id = ?`;
        params.push(keywordId);
      } else if (keywordName) {
        const names = keywordName.split(',').map((n) => n.trim().toLowerCase());
        const placeholders = names.map(() => '?').join(',');
        query += ` JOIN keyword k ON ek.keyword_id = k.id WHERE LOWER(k.keyword_name) IN (${placeholders})`;
        params.push(...names);
      }

      query += ` AND st.status = 'confirmed' GROUP BY e.exhibitor_id ORDER BY e.exhibitor_name`;
    }

    const [rows] = await pool.execute(query, params);

    return Response.json({ success: true, exhibitors: rows });
  } catch (error) {
    console.error('Erreur dans /api/exhibitors:', error);
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
