import { pool } from "../../../lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const eventType = url.searchParams.get("type");
    const eventDate = url.searchParams.get("date");

    if (!eventType) {
      return Response.json(
        {
          error:
            "Paramètre 'type' requis (Conférence, Table ronde, Atelier, Speed recruiting)",
        },
        { status: 400 },
      );
    }

    let query: string;
    let params: any[] = [eventType];

    if (eventType === "Speed recruiting") {
      query = `SELECT e.event_id, e.event_date, e.day_label,e.description, e.event_type, e.title,
                        e.start_time, e.end_time, e.organizer_or_brand, e.target_audience,
                        e.recrutement_id,
                        r.organisateur, r.org_email, r.org_tel, r.offres,
                        v.venue_name
                 FROM event e
                 LEFT JOIN venue v ON e.venue_id = v.venue_id
                 LEFT JOIN recrutement r ON e.recrutement_id = r.id
                 WHERE e.event_type = ?
                   AND e.status <> 'annulé'`;
    } else {
      query = `SELECT e.event_id, e.event_date, e.day_label, e.description, e.event_type, e.title,
                        e.start_time, e.end_time, e.organizer_or_brand, e.target_audience,
                        v.venue_name
                 FROM event e
                 LEFT JOIN venue v ON e.venue_id = v.venue_id
                 WHERE e.event_type = ?
                   AND e.status <> 'annulé'`;
    }

    if (eventDate) {
      query += ` AND DATE(e.event_date) = DATE(?)`;
      params.push(eventDate);
    }

    if (eventType === "Atelier" || eventType === "Speed recruiting") {
      query += ` ORDER BY e.organizer_or_brand, e.event_date,  e.start_time`;
    } else {
      query += ` ORDER BY e.event_date, e.start_time`;
    }

    let [rows] = await pool.execute(query, params);
    let events = (rows as any[]).map((event) => {
      const baseEvent = {
        eventId: event.event_id,
        eventDate: event.event_date,
        dayLabel: event.day_label,
        eventType: event.event_type,
        description: event.description,
        title: event.title,
        venueName: event.venue_name,
        startTime: event.start_time,
        endTime: event.end_time,
        organizerOrBrand: event.organizer_or_brand,
        targetAudience: event.target_audience,
      };

      if (eventType === "Speed recruiting") {
        return {
          ...baseEvent,
          recrutementId: event.recrutement_id,
          organisateur: event.organisateur,
          orgEmail: event.org_email,
          orgTel: event.org_tel,
          offres: event.offres,
        };
      }
      return baseEvent;
    });

    if (events.length === 0 && eventDate) {
      let fallbackQuery: string;
      if (eventType === "Speed recruiting") {
        fallbackQuery = `SELECT e.event_id, e.event_date, e.day_label, e.event_type, e.title, e.description,
                                  e.start_time, e.end_time, e.organizer_or_brand, e.target_audience,
                                  e.recrutement_id,
                                  r.organisateur, r.org_email, r.org_tel, r.offres,
                                  v.venue_name
                           FROM event e
                           LEFT JOIN venue v ON e.venue_id = v.venue_id
                           LEFT JOIN recrutement r ON e.recrutement_id = r.id
                           WHERE e.event_type = ?
                             AND e.status <> 'annulé'
                             AND DATE(e.event_date) >= CURDATE()
                           ORDER BY e.organizer_or_brand, e.event_date, e.start_time`;
      } else {
        fallbackQuery =
          `SELECT e.event_id, e.event_date, e.day_label, e.event_type, e.title, e.description,
                                  e.start_time, e.end_time, e.organizer_or_brand, e.target_audience,
                                  v.venue_name
                           FROM event e
                           LEFT JOIN venue v ON e.venue_id = v.venue_id
                           WHERE e.event_type = ?
                             AND e.status <> 'annulé'
                             AND DATE(e.event_date) >= CURDATE()` +
          (eventType === "Atelier"
            ? ` ORDER BY e.organizer_or_brand, e.event_date, e.start_time`
            : ` ORDER BY e.event_date, e.start_time`);
      }

      const [fallbackRows] = await pool.execute(fallbackQuery, [eventType]);
      events = (fallbackRows as any[]).map((event) => {
        const baseEvent = {
          eventId: event.event_id,
          eventDate: event.event_date,
          description: event.description,
          event_type: event.type,
          dayLabel: event.day_label,
          eventType: event.event_type,
          title: event.title,
          venueName: event.venue_name,
          startTime: event.start_time,
          endTime: event.end_time,
          organizerOrBrand: event.organizer_or_brand,
          targetAudience: event.target_audience,
        };

        if (eventType === "Speed recruiting") {
          return {
            ...baseEvent,
            recrutementId: event.recrutement_id,
            organisateur: event.organisateur,
            orgEmail: event.org_email,
            orgTel: event.org_tel,
            offres: event.offres,
          };
        }
        return baseEvent;
      });
    }

    return Response.json({ success: true, events });
  } catch (error) {
    console.error("Erreur dans /api/events:", error);
    return Response.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
