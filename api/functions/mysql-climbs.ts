// api/functions/mysql-climbs.ts
import { z } from 'zod';
import { makeCrudHandler } from '../utils/crud'; // <-- fixed path
export const runtime = 'edge';

const baseClimbSchema = z.object({
  mountain_name: z.string().min(1),
  elevation: z.coerce.number().int().nonnegative(),
  location: z.string().nullable().optional(),
  planned_start_date: z.string().min(1),
  duration_days: z.coerce.number().int().positive().nullable().optional(),
  difficulty_level: z
    .enum(['beginner', 'intermediate', 'advanced', 'expert', 'extreme'])
    .default('intermediate'),
  climbing_style: z
    .enum(['day_hike', 'overnight', 'multi_day', 'expedition', 'technical_climb'])
    .default('day_hike'),
  group_size: z.coerce.number().int().positive().nullable().optional(),
  emergency_contact: z.string().nullable().optional(),
  weather_concerns: z.string().nullable().optional(),
  special_equipment: z.string().nullable().optional(),
  backpack_name: z.string().nullable().optional(),
  base_pack_weight_kg: z.coerce.number().nonnegative().nullable().optional(),
  status: z
    .enum(['planning', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .default('planning'),
  notes: z.string().nullable().optional(),
});

const RowSchema = baseClimbSchema.extend({
  id: z.number().int().positive(),
  created_by_email: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const CreateSchema = baseClimbSchema.strict();
const UpdateSchema = baseClimbSchema
  .partial()
  .extend({ id: z.coerce.number().int().positive() })
  .strict();

function isAdmin(roles?: readonly string[] | null) {
  return Array.isArray(roles) && roles.includes('admin');
}

type UserCtx = { email?: string | null; roles?: string[] };

export default makeCrudHandler({
  table: 'climbs',
  ownershipField: 'created_by_email',
  searchableColumns: ['mountain_name', 'location', 'notes'],
  orderBy: 'created_at DESC',
  defaultLimit: 100,
  rowSchema: RowSchema,
  createSchema: CreateSchema,
  updateSchema: UpdateSchema,
  rbac: {
    requireAuth: true,
    isAdmin,
    allowCreate: () => true,
    allowUpdate: (u: UserCtx) => isAdmin(u.roles) || !!u.email, // typed
    allowDelete: (u: UserCtx) => isAdmin(u.roles) || !!u.email, // typed
    filterListByOwnerIfNotAdmin: true,
  },
});
