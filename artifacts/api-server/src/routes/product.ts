import { createHmac, randomBytes } from "node:crypto";
import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { and, asc, desc, eq, gt, ilike, or } from "drizzle-orm";
import {
  db,
  accessGrantsTable,
  accessLogsTable,
  innMappingsTable,
  inventoryItemsTable,
  medicationsTable,
  patientProfilesTable,
  pharmaciesTable,
  pharmacyStaffTable,
  prescriptionsTable,
  substitutionConfirmationsTable,
  usersTable,
  vaccinationsTable,
} from "@workspace/db";
import {
  CreateAccessGrantBody,
  CreateInventoryItemBody,
  CreateMedicationBody,
  CreatePassportRecordBody,
  DemoLoginBody,
  LookupPatientBody,
  ListMedicationBrandMappingsResponse,
  UpdateInventoryItemBody,
  UpdateMedicationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const sessionSecret = process.env.SESSION_SECRET ?? "development-session-secret";
type Role = "patient" | "pharmacist";
type SessionRequest = Request & { userId?: number; userRole?: Role };

const dateOnly = (value: Date) => value.toISOString().slice(0, 10);
const daysUntil = (expiryDate: string) =>
  Math.ceil((new Date(`${expiryDate}T00:00:00.000Z`).getTime() - Date.now()) / 86_400_000);

function sessionValue(userId: number, role: Role) {
  const payload = `${userId}.${role}`;
  const signature = createHmac("sha256", sessionSecret).update(payload).digest("hex").slice(0, 24);
  return `${payload}.${signature}`;
}

function parseSession(value: unknown): { userId: number; role: Role } | null {
  if (typeof value !== "string") return null;
  const [userIdText, role, signature] = value.split(".");
  if (!userIdText || !role || !signature || (role !== "patient" && role !== "pharmacist")) return null;
  const expected = createHmac("sha256", sessionSecret).update(`${userIdText}.${role}`).digest("hex").slice(0, 24);
  if (signature !== expected) return null;
  const userId = Number(userIdText);
  return Number.isInteger(userId) ? { userId, role } : null;
}

function requireSession(req: Request, res: Response, next: NextFunction) {
  const session = parseSession((req as Request & { cookies?: Record<string, unknown> }).cookies?.mena_session);
  if (!session) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  const sessionRequest = req as SessionRequest;
  sessionRequest.userId = session.userId;
  sessionRequest.userRole = session.role;
  next();
}

function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if ((req as SessionRequest).userRole !== role) {
      res.status(403).json({ error: "This area is not available for your role" });
      return;
    }
    next();
  };
}

async function getUser(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return user;
}

function publicUser(user: NonNullable<Awaited<ReturnType<typeof getUser>>>) {
  return {
    id: user.id,
    role: user.role as Role,
    fullName: user.fullName,
    email: user.email,
    preferredLanguage: user.preferredLanguage as "ar" | "en",
    country: user.country,
  };
}

function medicationResponse(medication: typeof medicationsTable.$inferSelect) {
  return {
    id: medication.id,
    brandName: medication.brandName,
    innName: medication.innName,
    dosage: medication.dosage,
    frequency: medication.frequency,
    prescribingCountry: medication.prescribingCountry,
    startDate: medication.startDate,
    endDate: medication.endDate,
    isActive: medication.isActive,
  };
}

function inventoryResponse(item: typeof inventoryItemsTable.$inferSelect) {
  const daysToExpiry = daysUntil(item.expiryDate);
  return {
    id: item.id,
    drugBrandName: item.drugBrandName,
    innName: item.innName,
    batchNumber: item.batchNumber,
    quantity: item.quantity,
    expiryDate: item.expiryDate,
    unitCost: item.unitCost === null ? null : Number(item.unitCost),
    status: daysToExpiry < 30 ? "rotate_now" : daysToExpiry <= 90 ? "return_window" : "fine",
    daysToExpiry,
  } as const;
}

async function latestActiveGrant(patientId: number) {
  const [grant] = await db
    .select()
    .from(accessGrantsTable)
    .where(and(eq(accessGrantsTable.patientId, patientId), eq(accessGrantsTable.revoked, false), gt(accessGrantsTable.expiresAt, new Date())))
    .orderBy(desc(accessGrantsTable.createdAt))
    .limit(1);
  return grant;
}

function grantResponse(grant: typeof accessGrantsTable.$inferSelect | undefined | null) {
  if (!grant) return null;
  return {
    id: grant.id,
    accessCode: grant.accessCode,
    qrToken: grant.qrToken,
    createdAt: grant.createdAt,
    expiresAt: grant.expiresAt,
    scope: grant.scope as "active_medications_only" | "full_passport",
    revoked: grant.revoked,
    remainingSeconds: Math.max(0, Math.floor((grant.expiresAt.getTime() - Date.now()) / 1000)),
  };
}

async function passportPayload(patientId: number) {
  const patient = await getUser(patientId);
  const [profile] = await db.select().from(patientProfilesTable).where(eq(patientProfilesTable.userId, patientId)).limit(1);
  const medications = await db.select().from(medicationsTable).where(eq(medicationsTable.patientId, patientId));
  const prescriptions = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.patientId, patientId));
  const vaccinations = await db.select().from(vaccinationsTable).where(eq(vaccinationsTable.patientId, patientId));
  const activeGrant = await latestActiveGrant(patientId);
  return {
    patient: publicUser(patient!),
    profile: {
      dateOfBirth: profile?.dateOfBirth ?? "",
      bloodType: profile?.bloodType ?? null,
      allergies: profile?.allergies ?? "No known allergies",
      emergencyContactName: profile?.emergencyContactName ?? "",
      emergencyContactPhone: profile?.emergencyContactPhone ?? "",
    },
    medications: medications.map(medicationResponse),
    records: {
      prescriptions,
      vaccinations,
    },
    activeGrant: grantResponse(activeGrant),
  };
}

async function pharmacyForUser(userId: number) {
  const [staff] = await db.select().from(pharmacyStaffTable).where(eq(pharmacyStaffTable.userId, userId)).limit(1);
  if (!staff) return null;
  const [pharmacy] = await db.select().from(pharmaciesTable).where(eq(pharmaciesTable.id, staff.pharmacyId)).limit(1);
  return pharmacy ?? null;
}

async function inventoryForPharmacy(pharmacyId: number) {
  const rows = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.pharmacyId, pharmacyId)).orderBy(asc(inventoryItemsTable.expiryDate));
  return rows.map(inventoryResponse);
}

router.post("/auth/demo-login", async (req, res) => {
  const input = DemoLoginBody.parse(req.body);
  const email = input.role === "patient" ? "patient@menapassport.demo" : "pharmacist@pharmalens.demo";
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(503).json({ error: "Demo account is not available yet" });
    return;
  }
  res.cookie("mena_session", sessionValue(user.id, input.role), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 86_400_000,
  });
  res.json({ user: publicUser(user) });
});

router.get("/auth/me", requireSession, async (req, res) => {
  const user = await getUser((req as SessionRequest).userId!);
  if (!user) {
    res.status(401).json({ error: "Session is no longer valid" });
    return;
  }
  res.json({ user: publicUser(user) });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("mena_session");
  res.status(204).send();
});

router.get("/medication/brand-mappings", requireSession, async (_req, res): Promise<void> => {
  const mappings = await db
    .select({
      brandName: innMappingsTable.brandName,
      country: innMappingsTable.country,
      innName: innMappingsTable.innName,
    })
    .from(innMappingsTable)
    .orderBy(asc(innMappingsTable.country), asc(innMappingsTable.brandName));

  res.json(ListMedicationBrandMappingsResponse.parse(
    mappings.map((mapping) => ({ ...mapping, verificationStatus: "unverified_demo" })),
  ));
});

router.get("/passport", requireSession, requireRole("patient"), async (req, res) => {
  res.json(await passportPayload((req as SessionRequest).userId!));
});

router.get("/passport/summary", requireSession, requireRole("patient"), async (req, res) => {
  const patientId = (req as SessionRequest).userId!;
  const passport = await passportPayload(patientId);
  const accessHistory = await db
    .select()
    .from(accessLogsTable)
    .innerJoin(accessGrantsTable, eq(accessLogsTable.accessGrantId, accessGrantsTable.id))
    .where(eq(accessGrantsTable.patientId, patientId));
  res.json({
    activeMedicationCount: passport.medications.filter((medication) => medication.isActive).length,
    prescriptionCount: passport.records.prescriptions.length,
    vaccinationCount: passport.records.vaccinations.length,
    accessEventCount: accessHistory.length,
    activeGrant: passport.activeGrant,
  });
});

router.get("/passport/medications", requireSession, requireRole("patient"), async (req, res) => {
  const rows = await db.select().from(medicationsTable).where(eq(medicationsTable.patientId, (req as SessionRequest).userId!));
  res.json(rows.map(medicationResponse));
});

router.post("/passport/medications", requireSession, requireRole("patient"), async (req, res) => {
  const body = CreateMedicationBody.parse(req.body);
  const mappings = await db.select().from(innMappingsTable);
  const mapping = mappings.find((row) => row.brandName.toLowerCase() === body.brandName.toLowerCase());
  const [medication] = await db
    .insert(medicationsTable)
    .values({ ...body, patientId: (req as SessionRequest).userId!, innName: mapping?.innName ?? body.brandName })
    .returning();
  res.status(201).json(medicationResponse(medication));
});

router.patch("/passport/medications/:id", requireSession, requireRole("patient"), async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateMedicationBody.parse(req.body);
  const mappings = await db.select().from(innMappingsTable);
  const mapping = mappings.find((row) => row.brandName.toLowerCase() === body.brandName.toLowerCase());
  const [medication] = await db
    .update(medicationsTable)
    .set({ ...body, innName: mapping?.innName ?? body.brandName })
    .where(and(eq(medicationsTable.id, id), eq(medicationsTable.patientId, (req as SessionRequest).userId!)))
    .returning();
  if (!medication) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }
  res.json(medicationResponse(medication));
});

router.delete("/passport/medications/:id", requireSession, requireRole("patient"), async (req, res) => {
  await db.delete(medicationsTable).where(and(eq(medicationsTable.id, Number(req.params.id)), eq(medicationsTable.patientId, (req as SessionRequest).userId!)));
  res.status(204).send();
});

router.get("/passport/records", requireSession, requireRole("patient"), async (req, res) => {
  const patientId = (req as SessionRequest).userId!;
  res.json({
    prescriptions: await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.patientId, patientId)),
    vaccinations: await db.select().from(vaccinationsTable).where(eq(vaccinationsTable.patientId, patientId)),
  });
});

router.post("/passport/records", requireSession, requireRole("patient"), async (req, res) => {
  const body = CreatePassportRecordBody.parse(req.body);
  const patientId = (req as SessionRequest).userId!;
  if (body.type === "prescription") {
    const [record] = await db.insert(prescriptionsTable).values({
      patientId,
      medicationId: body.medicationId ?? null,
      issuedBy: body.issuedBy ?? "Not specified",
      issuedCountry: body.issuedCountry ?? "Not specified",
      issuedDate: body.issuedDate ?? dateOnly(new Date()),
      notes: body.notes,
    }).returning();
    res.status(201).json(record);
    return;
  }
  const [record] = await db.insert(vaccinationsTable).values({
    patientId,
    vaccineName: body.vaccineName ?? "Vaccination",
    dateAdministered: body.dateAdministered ?? dateOnly(new Date()),
    country: body.country ?? "Not specified",
    notes: body.notes,
  }).returning();
  res.status(201).json(record);
});

router.get("/passport/access-grants", requireSession, requireRole("patient"), async (req, res) => {
  const rows = await db.select().from(accessGrantsTable).where(eq(accessGrantsTable.patientId, (req as SessionRequest).userId!)).orderBy(desc(accessGrantsTable.createdAt));
  res.json(rows.map(grantResponse));
});

router.post("/passport/access-grants", requireSession, requireRole("patient"), async (req, res) => {
  const body = CreateAccessGrantBody.parse(req.body);
  const patientId = (req as SessionRequest).userId!;
  await db.update(accessGrantsTable).set({ revoked: true }).where(and(eq(accessGrantsTable.patientId, patientId), eq(accessGrantsTable.revoked, false)));
  const accessCode = String(Math.floor(100000 + Math.random() * 900000));
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 45 * 60 * 1000);
  const qrToken = `${accessCode}.${randomBytes(12).toString("hex")}`;
  const [grant] = await db.insert(accessGrantsTable).values({
    patientId,
    accessCode,
    qrToken,
    createdAt,
    expiresAt,
    scope: body.scope,
    revoked: false,
  }).returning();
  res.status(201).json(grantResponse(grant));
});

router.post("/passport/access-grants/:id/revoke", requireSession, requireRole("patient"), async (req, res) => {
  const [grant] = await db
    .update(accessGrantsTable)
    .set({ revoked: true })
    .where(and(eq(accessGrantsTable.id, Number(req.params.id)), eq(accessGrantsTable.patientId, (req as SessionRequest).userId!)))
    .returning();
  if (!grant) {
    res.status(404).json({ error: "Access grant not found" });
    return;
  }
  res.json(grantResponse(grant));
});

router.get("/passport/access-history", requireSession, requireRole("patient"), async (req, res) => {
  const patientId = (req as SessionRequest).userId!;
  const rows = await db
    .select({ id: accessLogsTable.id, accessedAt: accessLogsTable.accessedAt, dataScopeViewed: accessLogsTable.dataScopeViewed, pharmacyName: pharmaciesTable.name })
    .from(accessLogsTable)
    .innerJoin(accessGrantsTable, eq(accessLogsTable.accessGrantId, accessGrantsTable.id))
    .innerJoin(pharmacyStaffTable, eq(accessLogsTable.pharmacyUserId, pharmacyStaffTable.userId))
    .innerJoin(pharmaciesTable, eq(pharmacyStaffTable.pharmacyId, pharmaciesTable.id))
    .where(eq(accessGrantsTable.patientId, patientId))
    .orderBy(desc(accessLogsTable.accessedAt));
  res.json(rows);
});

router.get("/pharmacy/summary", requireSession, requireRole("pharmacist"), async (req, res) => {
  const pharmacy = await pharmacyForUser((req as SessionRequest).userId!);
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found" });
    return;
  }
  const inventory = await inventoryForPharmacy(pharmacy.id);
  const recentLookups = await db.select({
    id: accessLogsTable.id,
    pharmacyName: pharmaciesTable.name,
    accessedAt: accessLogsTable.accessedAt,
    dataScopeViewed: accessLogsTable.dataScopeViewed,
  }).from(accessLogsTable)
    .innerJoin(pharmacyStaffTable, eq(accessLogsTable.pharmacyUserId, pharmacyStaffTable.userId))
    .innerJoin(pharmaciesTable, eq(pharmacyStaffTable.pharmacyId, pharmaciesTable.id))
    .where(eq(pharmaciesTable.id, pharmacy.id))
    .orderBy(desc(accessLogsTable.accessedAt))
    .limit(5);
  res.json({
    pharmacy,
    totalSkus: inventory.length,
    totalUnits: inventory.reduce((sum, item) => sum + item.quantity, 0),
    expiringSoonCount: inventory.filter((item) => item.status === "return_window").length,
    rotateNowCount: inventory.filter((item) => item.status === "rotate_now").length,
    recentLookups,
  });
});

router.post("/pharmacy/lookup", requireSession, requireRole("pharmacist"), async (req, res) => {
  const body = LookupPatientBody.parse(req.body);
  const [grant] = await db.select().from(accessGrantsTable).where(or(eq(accessGrantsTable.accessCode, body.accessCode), eq(accessGrantsTable.qrToken, body.accessCode))).limit(1);
  if (!grant || grant.revoked || grant.expiresAt.getTime() <= Date.now()) {
    res.status(410).json({ error: "This access code has expired or was revoked" });
    return;
  }
  const patient = await getUser(grant.patientId);
  const [profile] = await db.select().from(patientProfilesTable).where(eq(patientProfilesTable.userId, grant.patientId)).limit(1);
  const medications = await db.select().from(medicationsTable).where(and(eq(medicationsTable.patientId, grant.patientId), eq(medicationsTable.isActive, true)));
  const allPrescriptions = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.patientId, grant.patientId));
  const prescriptions = grant.scope === "full_passport"
    ? allPrescriptions
    : allPrescriptions.filter((record) => record.medicationId === null || medications.some((medication) => medication.id === record.medicationId));
  const pharmacy = await pharmacyForUser((req as SessionRequest).userId!);
  const pharmacyInventory = pharmacy ? await inventoryForPharmacy(pharmacy.id) : [];
  const suggestions = pharmacyInventory.filter((item) => item.quantity > 0 && medications.some((medication) => medication.innName.toLowerCase() === item.innName.toLowerCase()));
  await db.insert(accessLogsTable).values({
    accessGrantId: grant.id,
    pharmacyUserId: (req as SessionRequest).userId!,
    dataScopeViewed: grant.scope,
  });
  res.json({
    patientName: patient?.fullName ?? "Patient",
    allergies: profile?.allergies ?? "No known allergies",
    medications: medications.map(medicationResponse),
    prescriptions,
    expiresAt: grant.expiresAt,
    remainingSeconds: Math.max(0, Math.floor((grant.expiresAt.getTime() - Date.now()) / 1000)),
    suggestions,
  });
});

router.get("/pharmacy/inventory", requireSession, requireRole("pharmacist"), async (req, res) => {
  const pharmacy = await pharmacyForUser((req as SessionRequest).userId!);
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found" });
    return;
  }
  res.json(await inventoryForPharmacy(pharmacy.id));
});

router.post("/pharmacy/inventory", requireSession, requireRole("pharmacist"), async (req, res) => {
  const body = CreateInventoryItemBody.parse(req.body);
  const pharmacy = await pharmacyForUser((req as SessionRequest).userId!);
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found" });
    return;
  }
  const [item] = await db.insert(inventoryItemsTable).values({
    ...body,
    pharmacyId: pharmacy.id,
    unitCost: body.unitCost === null || body.unitCost === undefined ? null : String(body.unitCost),
  }).returning();
  res.status(201).json(inventoryResponse(item));
});

router.patch("/pharmacy/inventory/:id", requireSession, requireRole("pharmacist"), async (req, res) => {
  const body = UpdateInventoryItemBody.parse(req.body);
  const pharmacy = await pharmacyForUser((req as SessionRequest).userId!);
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found" });
    return;
  }
  const [item] = await db.update(inventoryItemsTable).set({
    ...body,
    unitCost: body.unitCost === null || body.unitCost === undefined ? null : String(body.unitCost),
  }).where(and(eq(inventoryItemsTable.id, Number(req.params.id)), eq(inventoryItemsTable.pharmacyId, pharmacy.id))).returning();
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  res.json(inventoryResponse(item));
});

router.delete("/pharmacy/inventory/:id", requireSession, requireRole("pharmacist"), async (req, res) => {
  const pharmacy = await pharmacyForUser((req as SessionRequest).userId!);
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found" });
    return;
  }
  await db.delete(inventoryItemsTable).where(and(eq(inventoryItemsTable.id, Number(req.params.id)), eq(inventoryItemsTable.pharmacyId, pharmacy.id)));
  res.status(204).send();
});

router.post("/pharmacy/substitutions/:id/confirm", requireSession, requireRole("pharmacist"), async (req, res) => {
  const body = req.body as { confirmed?: boolean };
  const [confirmation] = await db.insert(substitutionConfirmationsTable).values({
    inventoryItemId: Number(req.params.id),
    pharmacistUserId: (req as SessionRequest).userId!,
    confirmed: body.confirmed === true,
  }).returning();
  res.json(confirmation);
});

export default router;