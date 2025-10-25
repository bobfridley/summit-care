// types/gear-shims.d.ts

import * as React from 'react';

/** Shared item shape (loose, adjust later if you like) */
export type GearImportance = 'critical' | 'high' | 'recommended' | 'optional';
export type GearCategory =
  | 'safety'
  | 'clothing'
  | 'technical'
  | 'camping'
  | 'navigation'
  | 'health'
  | 'food_water'
  | 'other';

export interface GearItem {
  item_name: string;
  quantity?: number;
  estimated_weight_kg?: number;
  importance?: GearImportance;
  category?: GearCategory;
  notes?: string;
  required?: boolean;
}

/** GearEditor props */
export interface GearEditorProps<T extends GearItem = GearItem> {
  gear: T[];
  onChange: (next: T[]) => void;
}

/** PackWeightSummary props */
export interface PackWeightSummaryProps<T extends GearItem = GearItem> {
  gear: T[];
  basePackWeightKg: number;
}

/** Module shims matching your import paths in ClimbForm.tsx */
declare module '../climbs/GearEditor' {
  import type { GearEditorProps } from 'types/gear-shims';
  const GearEditor: React.FC<GearEditorProps>;
  export default GearEditor;
}

declare module '../climbs/PackWeightSummary' {
  import type { PackWeightSummaryProps } from 'types/gear-shims';
  const PackWeightSummary: React.FC<PackWeightSummaryProps>;
  export default PackWeightSummary;
}
