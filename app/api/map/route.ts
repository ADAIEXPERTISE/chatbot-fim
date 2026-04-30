import { pool } from '../../../lib/db';

export async function GET() {
  try {
    // Récupérer tous les stands avec leur allocation pour l'exposition générale (event_id = 6)
    const [stands] = await pool.execute(
      `SELECT s.stand_code, s.pos_x, s.pos_y, s.status, z.zone_name,
              e.exhibitor_name, e.exhibitor_type,
              sub.subcategory_name, sec.sector_name
       FROM stands s
       LEFT JOIN zone z ON s.zone_id = z.id
       LEFT JOIN stand_allocation sa ON s.stand_code = sa.stand_code AND sa.event_id = 6
       LEFT JOIN exhibitor e ON sa.exhibitor_id = e.exhibitor_id
       LEFT JOIN subcategory sub ON e.subcategory_id = sub.subcategory_id
       LEFT JOIN sectors sec ON sub.sector_id = sec.sector_id
       ORDER BY s.stand_code`
    );

    // Récupérer les zones
    const [zones] = await pool.execute(
      'SELECT id, zone_name FROM zone ORDER BY zone_name'
    );

    return Response.json({
      success: true,
      stands: stands,
      zones: zones,
      totalStands: (stands as any[]).length,
      allocatedStands: (stands as any[]).filter((s: any) => s.exhibitor_name).length
    });

  } catch (error) {
    console.error("Erreur dans l'API map:", error);
    return Response.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}