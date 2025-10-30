// src/components/climbs/types.ts

// --- Gear types ---
export type Importance = 'critical' | 'high' | 'recommended' | 'optional';

export type GearCategory =
  | 'safety'
  | 'clothing'
  | 'technical'
  | 'camping'
  | 'navigation'
  | 'health'
  | 'food_water'
  | 'other';

export type GearItem = {
  id?: number;
  item_name: string; // display name used by UI
  estimated_weight_kg?: number | null; // per-item weight (kg)
  quantity?: number | null; // count of items
  required?: boolean | 0 | 1 | null;
  importance?: Importance | null;
  category?: GearCategory | null;
  notes?: string | null;
};

// --- Climb types ---
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'extreme';

export type ClimbStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type ClimbingStyle =
  | 'day_hike'
  | 'overnight'
  | 'multi_day'
  | 'expedition'
  | 'technical_climb';

export interface ClimbLike {
  id: number;
  mountain_name: string;
  elevation: number;
  planned_start_date: string | Date;
  status: ClimbStatus;
  difficulty_level: DifficultyLevel;
  climbing_style: ClimbingStyle;

  location?: string | null;
  duration_days?: number | null;
  group_size?: number | null;
  notes?: string | null;
  weather_concerns?: string | null;

  // gear
  required_gear?: GearItem[] | null;
  base_pack_weight_kg?: number | null;
}
