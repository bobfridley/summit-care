
import { ListChecks } from "lucide-react";

const categoryStyles = {
  safety: "bg-red-50 text-red-700 border-red-200",
  clothing: "bg-blue-50 text-blue-700 border-blue-200",
  technical: "bg-yellow-50 text-yellow-700 border-yellow-200",
  camping: "bg-green-50 text-green-700 border-green-200",
  navigation: "bg-purple-50 text-purple-700 border-purple-200",
  health: "bg-pink-50 text-pink-700 border-pink-200",
  food_water: "bg-orange-50 text-orange-700 border-orange-200",
  other: "bg-stone-50 text-stone-700 border-stone-200",
};

const importanceStyles = {
  critical: "bg-red-600 text-white border-red-700",
  high: "bg-orange-500 text-white border-orange-600",
  recommended: "bg-blue-500 text-white border-blue-600",
  optional: "bg-stone-200 text-stone-800 border-stone-300",
};

export default function GearList({ gear = [] }) {
  const KG_TO_LB = 2.20462;

  const requiredItems = (gear || []).filter((g) => g?.required && g?.item_name);

  if (requiredItems.length === 0) return null;

  const totalEstimatedWeightKg = requiredItems.reduce((sum, item) => {
    const itemWeightKg = (typeof item.estimated_weight_kg === "number" && item.estimated_weight_kg > 0) ? item.estimated_weight_kg : 0;
    const quantity = (typeof item.quantity === "number" && item.quantity > 0) ? item.quantity : 1;
    return sum + (itemWeightKg * quantity);
  }, 0);
  const totalEstimatedWeightLb = totalEstimatedWeightKg * KG_TO_LB;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-text-primary font-medium">
        <ListChecks className="w-4 h-4 text-primary-blue" />
        Required Gear ({requiredItems.length})
      </div>
      <div className="space-y-2">
        {requiredItems.map((g, idx) => {
          const perItemKg = (typeof g.estimated_weight_kg === "number" && g.estimated_weight_kg > 0) ? g.estimated_weight_kg : 0;
          const qty = (typeof g.quantity === "number" && g.quantity > 0) ? g.quantity : 1;
          const perItemLb = perItemKg * KG_TO_LB;
          const totalLb = perItemLb * qty;

          return (
            <div key={idx} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-stone-50 border border-stone-100">
              <div className="text-sm text-text-primary font-medium">
                {g.item_name}
                {qty > 1 ? <span className="text-text-secondary font-normal"> ×{qty}</span> : null}
                {perItemKg > 0 && (
                  <span className="text-xs text-text-secondary font-normal ml-2">
                    ≈ {perItemLb.toFixed(2)} lb each{qty > 1 ? ` • ${totalLb.toFixed(2)} lb total` : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {g.importance && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${importanceStyles[g.importance] || importanceStyles.recommended}`}>
                    {g.importance === "optional" ? "Nice to have" : g.importance.charAt(0).toUpperCase() + g.importance.slice(1)}
                  </span>
                )}
                {g.category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryStyles[g.category] || categoryStyles.other}`}>
                    {String(g.category).replace("_", " ")}
                  </span>
                )}
                {g.notes && (
                  <span className="text-xs text-text-secondary line-clamp-1 max-w-[220px]">{g.notes}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {totalEstimatedWeightLb > 0 && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-100 mt-4">
          <div className="text-sm font-medium text-blue-700">Required Gear Subtotal:</div>
          <div className="text-sm font-bold text-blue-700">{totalEstimatedWeightLb.toFixed(2)} lb</div>
        </div>
      )}
    </div>
  );
}
