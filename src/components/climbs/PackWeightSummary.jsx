import { Scale, Package } from "lucide-react";

export default function PackWeightSummary({ gear = [], basePackWeightKg = 0 }) {
  const KG_TO_LB = 2.20462;

  // Only count items marked as "Packed"
  const sumPackedGearKg = (gear || []).reduce((sum, g) => {
    if (!g.packed) return sum; // Skip unpacked items
    const perItemKg = typeof g.estimated_weight_kg === "number" ? g.estimated_weight_kg : 0;
    const qty = typeof g.quantity === "number" && g.quantity > 0 ? g.quantity : 1;
    return sum + perItemKg * qty;
  }, 0);

  const totalKg = (Number(basePackWeightKg) || 0) + sumPackedGearKg;
  const totalLb = totalKg * KG_TO_LB;
  const baseLb = (Number(basePackWeightKg) || 0) * KG_TO_LB;
  
  // Count packed items
  const packedCount = (gear || []).filter(g => g.packed).length;
  const totalCount = (gear || []).length;

  return (
    <div className="flex items-start gap-3 text-sm">
      <Scale className="w-4 h-4 text-primary-blue mt-0.5" />
      <div className="text-text-secondary">
        <div>
          Est. pack weight: <span className="font-semibold text-text-primary">{totalLb.toFixed(2)} lb</span>
          {basePackWeightKg > 0 && <span className="ml-2">(base {baseLb.toFixed(2)} lb)</span>}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs">
          <Package className="w-3 h-3" />
          <span>{packedCount} of {totalCount} items packed</span>
        </div>
      </div>
    </div>
  );
}