import { relations } from "drizzle-orm/relations";
import { userClimbs, climbGearItems, climbMedications, userMedications, gearCatalog, gearPresetItems, gearPresets, medicationDatabase, medicationAltitudeEffects, medicationWarnings, userClimbStatusHistory, userTripReports } from "./schema";

export const climbGearItemsRelations = relations(climbGearItems, ({one}) => ({
	userClimb: one(userClimbs, {
		fields: [climbGearItems.climbId],
		references: [userClimbs.id]
	}),
}));

export const userClimbsRelations = relations(userClimbs, ({many}) => ({
	climbGearItems: many(climbGearItems),
	climbMedications: many(climbMedications),
	userClimbStatusHistories: many(userClimbStatusHistory),
	userTripReports: many(userTripReports),
}));

export const climbMedicationsRelations = relations(climbMedications, ({one}) => ({
	userClimb: one(userClimbs, {
		fields: [climbMedications.climbId],
		references: [userClimbs.id]
	}),
	userMedication: one(userMedications, {
		fields: [climbMedications.medicationId],
		references: [userMedications.id]
	}),
}));

export const userMedicationsRelations = relations(userMedications, ({one, many}) => ({
	climbMedications: many(climbMedications),
	medicationDatabase: one(medicationDatabase, {
		fields: [userMedications.medicationDatabaseId],
		references: [medicationDatabase.id]
	}),
}));

export const gearPresetItemsRelations = relations(gearPresetItems, ({one}) => ({
	gearCatalog: one(gearCatalog, {
		fields: [gearPresetItems.gearCatalogId],
		references: [gearCatalog.id]
	}),
	gearPreset: one(gearPresets, {
		fields: [gearPresetItems.gearPresetId],
		references: [gearPresets.id]
	}),
}));

export const gearCatalogRelations = relations(gearCatalog, ({many}) => ({
	gearPresetItems: many(gearPresetItems),
}));

export const gearPresetsRelations = relations(gearPresets, ({many}) => ({
	gearPresetItems: many(gearPresetItems),
}));

export const medicationAltitudeEffectsRelations = relations(medicationAltitudeEffects, ({one}) => ({
	medicationDatabase: one(medicationDatabase, {
		fields: [medicationAltitudeEffects.medicationDatabaseId],
		references: [medicationDatabase.id]
	}),
}));

export const medicationDatabaseRelations = relations(medicationDatabase, ({many}) => ({
	medicationAltitudeEffects: many(medicationAltitudeEffects),
	medicationWarnings: many(medicationWarnings),
	userMedications: many(userMedications),
}));

export const medicationWarningsRelations = relations(medicationWarnings, ({one}) => ({
	medicationDatabase: one(medicationDatabase, {
		fields: [medicationWarnings.medicationDatabaseId],
		references: [medicationDatabase.id]
	}),
}));

export const userClimbStatusHistoryRelations = relations(userClimbStatusHistory, ({one}) => ({
	userClimb: one(userClimbs, {
		fields: [userClimbStatusHistory.climbId],
		references: [userClimbs.id]
	}),
}));

export const userTripReportsRelations = relations(userTripReports, ({one}) => ({
	userClimb: one(userClimbs, {
		fields: [userTripReports.climbId],
		references: [userClimbs.id]
	}),
}));