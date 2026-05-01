import { pool } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const eventType = url.searchParams.get('type');
    // const eventDate = url.searchParams.get('date');
    // const eventDate = "2026-05-10"; // Date fixe pour les événements du 1er octobre 2024;
    const eventDate = url.searchParams.get('date'); // Date fixe pour les événements du 1er octobre 2024;

    if (!eventType) {
      return Response.json(
        { error: "Paramètre 'type' requis (Conférence, Table ronde, Atelier, Speed recruiting)" },
        { status: 400 },
      );
    }

    let query = `SELECT e.event_id, e.event_date, e.day_label, e.event_type, e.title,
                        e.start_time, e.end_time, e.organizer_or_brand, e.target_audience,
                        v.venue_name
                 FROM event e
                 LEFT JOIN venue v ON e.venue_id = v.venue_id
                 WHERE e.event_type = ?
                   AND e.status <> 'annulé'`;

    const params: any[] = [eventType];

    if (eventDate) {
      query += ` AND DATE(e.event_date) = DATE(?)`;
      params.push(eventDate);
    }

    query += ` ORDER BY e.event_date, e.start_time`;

    let [rows] = await pool.execute(query, params);
    let events = (rows as any[]).map((event) => ({
      eventId: event.event_id,
      eventDate: event.event_date,
      dayLabel: event.day_label,
      eventType: event.event_type,
      title: event.title,
      venueName: event.venue_name,
      startTime: event.start_time,
      endTime: event.end_time,
      organizerOrBrand: event.organizer_or_brand,
      targetAudience: event.target_audience,
    }));

    if (events.length === 0 && eventDate) {
      const fallbackQuery = `SELECT e.event_id, e.event_date, e.day_label, e.event_type, e.title,
                                  e.start_time, e.end_time, e.organizer_or_brand, e.target_audience,
                                  v.venue_name
                           FROM event e
                           LEFT JOIN venue v ON e.venue_id = v.venue_id
                           WHERE e.event_type = ?
                             AND e.status <> 'annulé'
                             AND DATE(e.event_date) >= CURDATE()
                           ORDER BY e.event_date, e.start_time`;
      const [fallbackRows] = await pool.execute(fallbackQuery, [eventType]);
      events = (fallbackRows as any[]).map((event) => ({
        eventId: event.event_id,
        eventDate: event.event_date,
        dayLabel: event.day_label,
        eventType: event.event_type,
        title: event.title,
        venueName: event.venue_name,
        startTime: event.start_time,
        endTime: event.end_time,
        organizerOrBrand: event.organizer_or_brand,
        targetAudience: event.target_audience,
      }));
    }

    return Response.json({ success: true, events });
  } catch (error) {
    console.error('Erreur dans /api/events:', error);
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
