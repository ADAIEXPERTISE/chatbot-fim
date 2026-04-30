import { pool } from '../../../lib/db';

export async function POST(req: Request) {
  try {
    const { fromStand, toStand } = await req.json();

    if (!fromStand || !toStand) {
      return Response.json(
        { error: "fromStand et toStand sont requis" },
        { status: 400 }
      );
    }

    // Récupérer les informations des deux stands
    const [stands] = await pool.execute(
      `SELECT s.stand_code, s.pos_x, s.pos_y, z.zone_name, e.exhibitor_name
       FROM stands s
       LEFT JOIN zone z ON s.zone_id = z.id
       LEFT JOIN stand_allocation sa ON s.stand_code = sa.stand_code AND sa.event_id = 6
       LEFT JOIN exhibitor e ON sa.exhibitor_id = e.exhibitor_id
       WHERE s.stand_code IN (?, ?)`,
      [fromStand, toStand]
    );

    const standData = stands as {
      stand_code: string;
      pos_x: number;
      pos_y: number;
      zone_name: string;
      exhibitor_name: string;
    }[];

    if (standData.length !== 2) {
      return Response.json(
        { error: "Un ou plusieurs stands non trouvés" },
        { status: 404 }
      );
    }

    const from = standData.find(s => s.stand_code === fromStand)!;
    const to = standData.find(s => s.stand_code === toStand)!;

    // Calculer la distance euclidienne
    const distance = Math.sqrt(
      Math.pow(to.pos_x - from.pos_x, 2) + Math.pow(to.pos_y - from.pos_y, 2)
    );

    // Estimation du temps de marche (en supposant 1 unité = 1 mètre, vitesse moyenne 1.2 m/s)
    const walkingTimeMinutes = Math.round((distance / 1.2) / 60);

    // Directions simples basées sur les coordonnées
    let directions = "";
    if (to.pos_x > from.pos_x) {
      directions += "Allez vers l'est";
    } else if (to.pos_x < from.pos_x) {
      directions += "Allez vers l'ouest";
    }

    if (to.pos_y > from.pos_y) {
      directions += directions ? " et vers le nord" : "Allez vers le nord";
    } else if (to.pos_y < from.pos_y) {
      directions += directions ? " et vers le sud" : "Allez vers le sud";
    }

    return Response.json({
      success: true,
      from: {
        standCode: from.stand_code,
        position: { x: from.pos_x, y: from.pos_y },
        zone: from.zone_name,
        exhibitor: from.exhibitor_name
      },
      to: {
        standCode: to.stand_code,
        position: { x: to.pos_x, y: to.pos_y },
        zone: to.zone_name,
        exhibitor: to.exhibitor_name
      },
      distance: Math.round(distance * 100) / 100, // Arrondi à 2 décimales
      walkingTimeMinutes: walkingTimeMinutes,
      directions: directions || "Vous êtes déjà à destination",
      instructions: walkingTimeMinutes > 0
        ? `Marchez pendant environ ${walkingTimeMinutes} minute(s) pour atteindre le stand ${to.stand_code}.`
        : "Les stands sont très proches l'un de l'autre."
    });

  } catch (error) {
    console.error("Erreur dans l'API directions:", error);
    return Response.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}