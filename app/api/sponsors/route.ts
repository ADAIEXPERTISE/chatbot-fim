import { pool } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT e.exhibitor_id, e.exhibitor_name, e.exhibitor_type,
              st.stand_code, st.pos_x, st.pos_y, st.status,
              z.zone_name
       FROM exhibitor e
       JOIN subcategory sc ON e.subcategory_id = sc.subcategory_id
       JOIN sectors sec ON sc.sector_id = sec.sector_id
       LEFT JOIN stands st ON e.exhibitor_id = st.exhibitor_id
       LEFT JOIN zone z ON st.zone_id = z.id
       WHERE (sec.sector_id = 'SPONSOR' OR sec.sector_name LIKE '%Sponsor%')
         AND st.status = 'confirmed'
       ORDER BY e.exhibitor_name, st.stand_code`,
    );

    const exhibitors = (rows as any[]).reduce((acc: any[], row: any) => {
      const existing = acc.find((item) => item.exhibitorId === row.exhibitor_id);
      if (existing) {
        if (row.stand_code) {
          existing.stands.push({
            standCode: row.stand_code,
            position: { x: row.pos_x || 0, y: row.pos_y || 0 },
            status: row.status || 'confirmed',
            zoneName: row.zone_name || '',
          });
        }
      } else {
        acc.push({
          exhibitorId: row.exhibitor_id,
          exhibitorName: row.exhibitor_name,
          exhibitorType: row.exhibitor_type,
          stands: row.stand_code
            ? [
                {
                  standCode: row.stand_code,
                  position: { x: row.pos_x || 0, y: row.pos_y || 0 },
                  status: row.status || 'confirmed',
                  zoneName: row.zone_name || '',
                },
              ]
            : [],
        });
      }
      return acc;
    }, []);

    return Response.json({ success: true, exhibitors });
  } catch (error) {
    console.error('Erreur dans /api/sponsors:', error);
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
