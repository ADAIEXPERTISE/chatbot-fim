import { pool } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const standCode = url.searchParams.get('code');

    if (!standCode) {
      return Response.json(
        { error: "Paramètre 'code' requis (code du stand)" },
        { status: 400 }
      );
    }

    // Récupérer les informations du stand
    const [stands] = await pool.execute(
      `SELECT s.stand_code, s.pos_x, s.pos_y, s.status, z.zone_name
       FROM stands s
       LEFT JOIN zone z ON s.zone_id = z.id
       WHERE s.stand_code = ?`,
      [standCode]
    );

    if ((stands as any[]).length === 0) {
      return Response.json(
        { error: "Stand non trouvé" },
        { status: 404 }
      );
    }

    const stand = (stands as any[])[0];

    // Récupérer l'exposant actuel (pour l'exposition générale - event_id = 6)
    const [allocations] = await pool.execute(
      `SELECT e.exhibitor_name, e.exhibitor_type, sub.subcategory_name, sec.sector_name
       FROM stand_allocation sa
       JOIN exhibitor e ON sa.exhibitor_id = e.exhibitor_id
       LEFT JOIN subcategory sub ON e.subcategory_id = sub.subcategory_id
       LEFT JOIN sectors sec ON sub.sector_id = sec.sector_id
       WHERE sa.stand_code = ? AND sa.event_id = 6`,
      [standCode]
    );

    const allocation = (allocations as any[])[0] || null;

    // Récupérer l'historique des événements pour ce stand
    const [events] = await pool.execute(
      `SELECT e.event_date, e.day_label, e.event_type, e.title, e.start_time, e.end_time,
              v.venue_name
       FROM stand_allocation sa
       JOIN event e ON sa.event_id = e.event_id
       JOIN venue v ON e.venue_id = v.venue_id
       WHERE sa.stand_code = ?
       ORDER BY e.event_date, e.start_time`,
      [standCode]
    );

    return Response.json({
      success: true,
      stand: {
        standCode: stand.stand_code,
        position: { x: stand.pos_x, y: stand.pos_y },
        status: stand.status,
        zone: stand.zone_name
      },
      currentExhibitor: allocation ? {
        name: allocation.exhibitor_name,
        type: allocation.exhibitor_type,
        subcategory: allocation.subcategory_name,
        sector: allocation.sector_name
      } : null,
      events: events,
      eventCount: (events as any[]).length
    });

  } catch (error) {
    console.error("Erreur dans l'API stand:", error);
    return Response.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}