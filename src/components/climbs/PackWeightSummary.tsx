// @ts-nocheck
import { Scale } from "@/components/icons";
export default function PackWeightSummary({ gear = [], basePackWeightKg = 0 }) {
  const KG_TO_LB = 2.20462;

  const sumGearKg = (gear || []).reduce((sum, g) => {
    const perItemKg = typeof g.estimated_weight_kg === 'number' ? g.estimated_weight_kg : 0;
    const qty = typeof g.quantity === 'number' && g.quantity > 0 ? g.quantity : 1;
    return sum + perItemKg * qty;
  }, 0);

  const totalKg = (Number(basePackWeightKg) || 0) + sumGearKg;
  const totalLb = totalKg * KG_TO_LB;
  const baseLb = (Number(basePackWeightKg) || 0) * KG_TO_LB;

  return (
    <div className='flex items-center gap-3 text-sm'>
      <Scale className='w-4 h-4 text-primary-blue' />
      <div className='text-text-secondary'>
        Est. pack weight:{' '}
        <span className='font-semibold text-text-primary'>{totalLb.toFixed(2)} lb</span>
        {basePackWeightKg ? <span className='ml-2'>(base {baseLb.toFixed(2)} lb)</span> : null}
      </div>
    </div>
  );
}
