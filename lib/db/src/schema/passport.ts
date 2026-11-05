import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull().default("demo"),
  phone: text("phone"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  country: text("country").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const patientProfilesTable = pgTable("patient_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id),
  dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
  bloodType: text("blood_type"),
  allergies: text("allergies").notNull().default("No known allergies"),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
});

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => usersTable.id),
  brandName: text("brand_name").notNull(),
  innName: text("inn_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  prescribingCountry: text("prescribing_country").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  isActive: boolean("is_active").notNull().default(true),
});

export const prescriptionsTable = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => usersTable.id),
  medicationId: integer("medication_id").references(() => medicationsTable.id),
  issuedBy: text("issued_by").notNull(),
  issuedCountry: text("issued_country").notNull(),
  issuedDate: date("issued_date", { mode: "string" }).notNull(),
  notes: text("notes").notNull().default(""),
});

export const vaccinationsTable = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => usersTable.id),
  vaccineName: text("vaccine_name").notNull(),
  dateAdministered: date("date_administered", { mode: "string" }).notNull(),
  country: text("country").notNull(),
  notes: text("notes").notNull().default(""),
});

export const accessGrantsTable = pgTable("access_grants", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => usersTable.id),
  accessCode: text("access_code").notNull().unique(),
  qrToken: text("qr_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scope: text("scope").notNull(),
  revoked: boolean("revoked").notNull().default(false),
});

export const pharmaciesTable = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  licenseNumber: text("license_number").notNull(),
});

export const pharmacyStaffTable = pgTable("pharmacy_staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmaciesTable.id),
  position: text("position").notNull().default("Licensed pharmacist"),
});

export const inventoryItemsTable = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmaciesTable.id),
  drugBrandName: text("drug_brand_name").notNull(),
  innName: text("inn_name").notNull(),
  batchNumber: text("batch_number").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expiryDate: date("expiry_date", { mode: "string" }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const innMappingsTable = pgTable("inn_mappings", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  country: text("country").notNull(),
  innName: text("inn_name").notNull(),
});

export const accessLogsTable = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  accessGrantId: integer("access_grant_id").notNull().references(() => accessGrantsTable.id),
  pharmacyUserId: integer("pharmacy_user_id").notNull().references(() => usersTable.id),
  accessedAt: timestamp("accessed_at", { withTimezone: true }).notNull().defaultNow(),
  dataScopeViewed: text("data_scope_viewed").notNull(),
});

export const substitutionConfirmationsTable = pgTable("substitution_confirmations", {
  id: serial("id").primaryKey(),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItemsTable.id),
  pharmacistUserId: integer("pharmacist_user_id").notNull().references(() => usersTable.id),
  confirmed: boolean("confirmed").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertPatientProfileSchema = createInsertSchema(patientProfilesTable).omit({ id: true });
export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({ id: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptionsTable).omit({ id: true });
export const insertVaccinationSchema = createInsertSchema(vaccinationsTable).omit({ id: true });
export const insertAccessGrantSchema = createInsertSchema(accessGrantsTable).omit({ id: true, createdAt: true });
export const insertPharmacySchema = createInsertSchema(pharmaciesTable).omit({ id: true });
export const insertPharmacyStaffSchema = createInsertSchema(pharmacyStaffTable).omit({ id: true });
export const insertInventoryItemSchema = createInsertSchema(inventoryItemsTable).omit({ id: true, createdAt: true });
export const insertInnMappingSchema = createInsertSchema(innMappingsTable).omit({ id: true });
export const insertAccessLogSchema = createInsertSchema(accessLogsTable).omit({ id: true, accessedAt: true });
export const insertSubstitutionConfirmationSchema = createInsertSchema(substitutionConfirmationsTable).omit({ id: true, confirmedAt: true });

export type User = z.infer<typeof insertUserSchema>;