"use client";

type Stand = {
  standCode: string;
  exhibitorId: number;
  exhibitorName?: string;
  posX: number;
  posY: number;
  status: string;
};

type RecommendationBubbleProps = {
  stands: Stand[];
  onSelectStand?: (stand: Stand) => void;
};

export default function RecommendationBubble({
  stands,
  onSelectStand,
}: RecommendationBubbleProps) {
  if (stands.length === 0) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-bl-none">
          Aucun stand trouvé pour vos intérêts.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-bl-none">
          Voici les stands qui pourraient vous intéresser :
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[80%] w-full space-y-2">
          {stands.map((stand) => (
            <div
              key={stand.standCode}
              className="rounded-lg border border-gray-300 bg-white p-3 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {stand.exhibitorName}
                  </div>
                  <div className="text-xs text-gray-600">
                    Stand: <span className="font-mono font-bold">{stand.standCode || 'Non défini'}</span>
                  </div>
                </div>
                {onSelectStand && (
                  <button
                    onClick={() => onSelectStand(stand)}
                    className="whitespace-nowrap rounded-lg bg-[#2d4a53] px-3 py-1 text-xs font-medium text-white hover:opacity-90 transition"
                  >
                    Voir sur la carte
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
