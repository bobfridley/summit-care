import {
  mysqlTable, mysqlSchema, varchar, date, int, timestamp, index, foreignKey,
  primaryKey, tinyint, bigint, mysqlEnum, decimal, unique, text, longtext
} from "drizzle-orm/mysql-core";
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";

export const aeTrendsCache = mysqlTable("ae_trends_cache", {
	drug: varchar({ length: 128 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	bucketDate: date("bucket_date", { mode: 'string' }).notNull(),
	countValue: int("count_value", { unsigned: true }).default(0).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const climbGearItems = mysqlTable("climb_gear_items", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	climbId: bigint("climb_id", { mode: "number", unsigned: true }).notNull().references(() => userClimbs.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	itemName: varchar("item_name", { length: 255 }).notNull(),
	category: mysqlEnum(['safety','clothing','technical','camping','navigation','health','food_water','other']).default('safety').notNull(),
	quantity: int({ unsigned: true }).default(1).notNull(),
	required: tinyint().default(1).notNull(),
	packed: tinyint().default(0).notNull(),
	importance: mysqlEnum(['critical','high','recommended','optional']).default('recommended').notNull(),
	estimatedWeightKg: decimal("estimated_weight_kg", { precision: 6, scale: 2 }),
	notes: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_gear_climb").on(table.climbId),
	index("idx_gear_cat").on(table.category),
	index("idx_gear_imp").on(table.importance),
	primaryKey({ columns: [table.id], name: "climb_gear_items_id"}),
]);

export const climbMedications = mysqlTable("climb_medications", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	climbId: bigint("climb_id", { mode: "number", unsigned: true }).notNull().references(() => userClimbs.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	medicationId: bigint("medication_id", { mode: "number", unsigned: true }).notNull().references(() => userMedications.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	usageNotes: varchar("usage_notes", { length: 500 }),
	startOffsetDays: int("start_offset_days"),
	endOffsetDays: int("end_offset_days"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "climb_medications_id"}),
	unique("uq_climb_med").on(table.climbId, table.medicationId),
]);

export const contraindications = mysqlTable("contraindications", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	drug: varchar({ length: 128 }).notNull(),
	contraindication: varchar({ length: 255 }).notNull(),
	level: varchar({ length: 24 }).default('major').notNull(),
	note: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "contraindications_id"}),
]);

export const gearCatalog = mysqlTable("gear_catalog", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	itemName: varchar("item_name", { length: 255 }).notNull(),
	category: mysqlEnum(['safety','clothing','technical','camping','navigation','health','food_water','other']).notNull(),
	defaultImportance: mysqlEnum("default_importance", ['critical','high','recommended','optional']).default('recommended').notNull(),
	defaultWeightKg: decimal("default_weight_kg", { precision: 6, scale: 2 }),
	notes: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_gear_cat").on(table.category),
	index("ft_gear").on(table.itemName, table.notes),
	primaryKey({ columns: [table.id], name: "gear_catalog_id"}),
	unique("uq_gear_item").on(table.itemName),
]);

export const gearPresetItems = mysqlTable("gear_preset_items", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	gearPresetId: bigint("gear_preset_id", { mode: "number", unsigned: true }).notNull().references(() => gearPresets.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	gearCatalogId: bigint("gear_catalog_id", { mode: "number", unsigned: true }).references(() => gearCatalog.id, { onDelete: "set null", onUpdate: "cascade" } ),
	itemName: varchar("item_name", { length: 255 }).notNull(),
	category: mysqlEnum(['safety','clothing','technical','camping','navigation','health','food_water','other']).notNull(),
	quantity: int({ unsigned: true }).default(1).notNull(),
	importance: mysqlEnum(['critical','high','recommended','optional']).default('recommended').notNull(),
	estimatedWeightKg: decimal("estimated_weight_kg", { precision: 6, scale: 2 }),
	notes: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_gpi_preset").on(table.gearPresetId),
	index("idx_gpi_cat").on(table.category),
	primaryKey({ columns: [table.id], name: "gear_preset_items_id"}),
]);

export const gearPresets = mysqlTable("gear_presets", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 120 }).notNull(),
	description: varchar({ length: 500 }),
	scope: mysqlEnum(['general','style','elevation','season']).default('general').notNull(),
	style: mysqlEnum(['day_hike','overnight','multi_day','expedition','technical_climb']),
	minElevation: int("min_elevation", { unsigned: true }),
	maxElevation: int("max_elevation", { unsigned: true }),
	minDurationDays: int("min_duration_days", { unsigned: true }),
	season: mysqlEnum(['any','winter','summer','shoulder']).default('any').notNull(),
	active: tinyint().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "gear_presets_id"}),
	unique("uq_preset_name").on(table.name),
]);

export const medicationAltitudeEffects = mysqlTable("medication_altitude_effects", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	medicationDatabaseId: bigint("medication_database_id", { mode: "number", unsigned: true }).notNull().references(() => medicationDatabase.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	effectText: text("effect_text").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_mae_med").on(table.medicationDatabaseId),
	primaryKey({ columns: [table.id], name: "medication_altitude_effects_id"}),
]);

export const medicationDatabase = mysqlTable("medication_database", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	genericName: varchar("generic_name", { length: 255 }),
	category: mysqlEnum(['cardiovascular','respiratory','neurological','gastrointestinal','endocrine','psychiatric','analgesic','antibiotic','other']).notNull(),
	riskLevel: mysqlEnum("risk_level", ['low','moderate','high','severe']).notNull(),
	recommendations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_meddb_category").on(table.category),
	index("idx_meddb_risk").on(table.riskLevel),
	primaryKey({ columns: [table.id], name: "medication_database_id"}),
	unique("uq_meddb_name").on(table.name),
]);

export const medicationWarnings = mysqlTable("medication_warnings", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	medicationDatabaseId: bigint("medication_database_id", { mode: "number", unsigned: true }).notNull().references(() => medicationDatabase.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	warningText: text("warning_text").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_mw_med").on(table.medicationDatabaseId),
	primaryKey({ columns: [table.id], name: "medication_warnings_id"}),
]);

export const userClimbStatusHistory = mysqlTable("user_climb_status_history", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	climbId: bigint("climb_id", { mode: "number", unsigned: true }).notNull().references(() => userClimbs.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	oldStatus: mysqlEnum("old_status", ['planning','confirmed','in_progress','completed','cancelled']),
	newStatus: mysqlEnum("new_status", ['planning','confirmed','in_progress','completed','cancelled']).notNull(),
	changedAt: timestamp("changed_at", { mode: 'string' }).defaultNow().notNull(),
	changedByEmail: varchar("changed_by_email", { length: 255 }).notNull(),
},
(table) => [
	index("idx_csh_climb").on(table.climbId),
	index("idx_csh_time").on(table.changedAt),
	primaryKey({ columns: [table.id], name: "user_climb_status_history_id"}),
]);

export const userClimbs = mysqlTable("user_climbs", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdByEmail: varchar("created_by_email", { length: 255 }).notNull(),
	mountainName: varchar("mountain_name", { length: 255 }).notNull(),
	elevation: int({ unsigned: true }).notNull(),
	location: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	plannedStartDate: date("planned_start_date", { mode: 'string' }).notNull(),
	durationDays: int("duration_days", { unsigned: true }),
	difficultyLevel: mysqlEnum("difficulty_level", ['beginner','intermediate','advanced','expert','extreme']).default('intermediate').notNull(),
	climbingStyle: mysqlEnum("climbing_style", ['day_hike','overnight','multi_day','expedition','technical_climb']).default('day_hike').notNull(),
	groupSize: int("group_size", { unsigned: true }),
	emergencyContact: varchar("emergency_contact", { length: 255 }),
	weatherConcerns: text("weather_concerns"),
	specialEquipment: text("special_equipment"),
	backpackName: varchar("backpack_name", { length: 255 }),
	basePackWeightKg: decimal("base_pack_weight_kg", { precision: 6, scale: 2 }),
	status: mysqlEnum(['planning','confirmed','in_progress','completed','cancelled']).default('planning').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_climbs_user").on(table.createdByEmail),
	index("idx_climbs_start").on(table.plannedStartDate),
	index("idx_climbs_status").on(table.status),
	index("idx_climbs_elev").on(table.elevation),
	primaryKey({ columns: [table.id], name: "user_climbs_id"}),
]);

export const userMedications = mysqlTable("user_medications", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdByEmail: varchar("created_by_email", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	dosage: varchar({ length: 255 }).notNull(),
	indication: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	notes: text(),
	altitudeRiskLevel: mysqlEnum("altitude_risk_level", ['low','moderate','high','severe']).notNull(),
	medicationDatabaseId: bigint("medication_database_id", { mode: "number", unsigned: true }).references(() => medicationDatabase.id, { onDelete: "set null", onUpdate: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_med_created_by").on(table.createdByEmail),
	index("idx_med_start_date").on(table.startDate),
	index("idx_med_risk").on(table.altitudeRiskLevel),
	index("idx_med_dbid").on(table.medicationDatabaseId),
	primaryKey({ columns: [table.id], name: "user_medications_id"}),
]);

export const userTripReports = mysqlTable("user_trip_reports", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdByEmail: varchar("created_by_email", { length: 255 }).notNull(),
	climbId: bigint("climb_id", { mode: "number", unsigned: true }).references(() => userClimbs.id, { onDelete: "set null", onUpdate: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	reportJson: longtext("report_json").notNull(),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_tr_user").on(table.createdByEmail),
	index("idx_tr_climb").on(table.climbId),
	primaryKey({ columns: [table.id], name: "user_trip_reports_id"}),
]);
