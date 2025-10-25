// api/functions/mysql-medications.ts
import { z } from 'zod';
import { makeCrudHandler } from '../utils/crud';
import type mysql from 'mysql2/promise';

export const runtime = 'edge';

// Shape for user-owned medications
const BaseMedSchema = z.object({
  name: z.string().min(1),
  generic_name: z.string().min(1).optional().nullable(),
  drug_class: z.string().optional().nullable(),
  dosage_form: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  sig: z.string().optional().nullable(),
  started_on: z.string().optional().nullable(), // YYYY-MM-DD
  ended_on: z.string().optional().nullable(), // YYYY-MM-DD
  notes: z.string().optional().nullable(),
});

const RowSchema = BaseMedSchema.extend({
  id: z.number().int().positive(),
  created_by_email: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const CreateSchema = BaseMedSchema.strict();
const UpdateSchema = BaseMedSchema.partial()
  .extend({
    id: z.coerce.number().int().positive(),
  })
  .strict();

function isAdmin(roles?: readonly string[] | null) {
  return Array.isArray(roles) && roles.includes('admin');
}

// TS type for DB rows — extends RowDataPacket to satisfy the factory constraint
export type MedRow = mysql.RowDataPacket & {
  id: number;
  created_by_email: string;
  name: string;
  generic_name: string | null;
  drug_class: string | null;
  dosage_form: string | null;
  strength: string | null;
  sig: string | null;
  started_on: string | null;
  ended_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type UserCtx = { email?: string | null; roles?: string[] };

export default makeCrudHandler<MedRow>({
  table: 'user_medications',
  ownershipField: 'created_by_email',
  searchableColumns: ['name', 'generic_name', 'drug_class'],
  orderBy: 'created_at DESC',
  defaultLimit: 50,
  rowSchema: RowSchema,
  createSchema: CreateSchema,
  updateSchema: UpdateSchema,
  rbac: {
    requireAuth: true,
    isAdmin,
    allowCreate: () => true,
    allowUpdate: (u: UserCtx) => isAdmin(u.roles) || !!u.email, // creator or admin (ownership enforced)
    allowDelete: (u: UserCtx) => isAdmin(u.roles) || !!u.email, // creator or admin
    filterListByOwnerIfNotAdmin: true,
  },
});
