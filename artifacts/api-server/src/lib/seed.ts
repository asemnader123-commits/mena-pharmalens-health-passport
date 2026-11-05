import { and, eq } from "drizzle-orm";
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

const addDays = (days: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export async function ensureSeedData() {
  const existingPatient = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "patient@menapassport.demo"))
    .limit(1);

  let patientId: number;
  if (existingPatient[0]) {
    patientId = existingPatient[0].id;
  } else {
    const [patient] = await db
      .insert(usersTable)
      .values({
        role: "patient",
        fullName: "Samira Haddad",
        email: "patient@menapassport.demo",
        passwordHash: "demo",
        phone: "+962 7 9000 1000",
        preferredLanguage: "en",
        country: "Jordan",
      })
      .returning();
    patientId = patient.id;
    await db.insert(patientProfilesTable).values({
      userId: patientId,
      dateOfBirth: "1987-06-14",
      bloodType: "O+",
      allergies: "Penicillin",
      emergencyContactName: "Nour Haddad",
      emergencyContactPhone: "+962 7 9000 2000",
    });
    const [metformin] = await db
      .insert(medicationsTable)
      .values({
        patientId,
        brandName: "Glucophage",
        innName: "Metformin",
        dosage: "500 mg",
        frequency: "Twice daily with meals",
        prescribingCountry: "Jordan",
        startDate: "2024-01-18",
        isActive: true,
      })
      .returning();
    await db.insert(medicationsTable).values([
      {
        patientId,
        brandName: "Panadol Extra",
        innName: "Paracetamol",
        dosage: "500 mg",
        frequency: "As needed, max 3 times daily",
        prescribingCountry: "United Arab Emirates",
        startDate: "2025-02-01",
        endDate: "2025-02-15",
        isActive: false,
      },
      {
        patientId,
        brandName: "Ventolin",
        innName: "Salbutamol",
        dosage: "100 mcg inhaler",
        frequency: "As needed",
        prescribingCountry: "Jordan",
        startDate: "2024-06-03",
        isActive: true,
      },
    ]);
    await db.insert(prescriptionsTable).values({
      patientId,
      medicationId: metformin.id,
      issuedBy: "Dr. Lina Qasem",
      issuedCountry: "Jordan",
      issuedDate: "2024-01-18",
      notes: "Continue with meals. Review at next annual visit.",
    });
    await db.insert(vaccinationsTable).values({
      patientId,
      vaccineName: "Seasonal influenza",
      dateAdministered: "2025-10-05",
      country: "Jordan",
      notes: "Annual vaccination",
    });
  }

  const existingPharmacist = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "pharmacist@pharmalens.demo"))
    .limit(1);

  let pharmacistId: number;
  if (existingPharmacist[0]) {
    pharmacistId = existingPharmacist[0].id;
  } else {
    const [pharmacist] = await db
      .insert(usersTable)
      .values({
        role: "pharmacist",
        fullName: "Omar Nasser",
        email: "pharmacist@pharmalens.demo",
        passwordHash: "demo",
        phone: "+962 7 9000 3000",
        preferredLanguage: "en",
        country: "Jordan",
      })
      .returning();
    pharmacistId = pharmacist.id;
  }

  const pharmacyRows = await db
    .select()
    .from(pharmaciesTable)
    .where(eq(pharmaciesTable.name, "Al-Shifa Community Pharmacy"))
    .limit(1);

  let pharmacyId: number;
  if (pharmacyRows[0]) {
    pharmacyId = pharmacyRows[0].id;
  } else {
    const [pharmacy] = await db
      .insert(pharmaciesTable)
      .values({
        name: "Al-Shifa Community Pharmacy",
        country: "Jordan",
        city: "Amman",
        licenseNumber: "JFDA-DEMO-2048",
      })
      .returning();
    pharmacyId = pharmacy.id;
    await db.insert(pharmacyStaffTable).values({
      userId: pharmacistId,
      pharmacyId,
      position: "Lead pharmacist",
    });
    await db.insert(inventoryItemsTable).values([
      { pharmacyId, drugBrandName: "Glucophage 500", innName: "Metformin", batchNumber: "MET-2408-A", quantity: 18, expiryDate: addDays(18), unitCost: "2.75" },
      { pharmacyId, drugBrandName: "Ventolin HFA", innName: "Salbutamol", batchNumber: "SAL-2410-C", quantity: 7, expiryDate: addDays(24), unitCost: "4.9" },
      { pharmacyId, drugBrandName: "Panadol Advance", innName: "Paracetamol", batchNumber: "PAR-2501-B", quantity: 42, expiryDate: addDays(46), unitCost: "1.25" },
      { pharmacyId, drugBrandName: "Tylenol 500", innName: "Paracetamol", batchNumber: "PAR-2502-D", quantity: 61, expiryDate: addDays(72), unitCost: "1.4" },
      { pharmacyId, drugBrandName: "Amoxil", innName: "Amoxicillin", batchNumber: "AMX-2501-A", quantity: 24, expiryDate: addDays(88), unitCost: "3.1" },
      { pharmacyId, drugBrandName: "Lipitor", innName: "Atorvastatin", batchNumber: "ATO-2411-B", quantity: 30, expiryDate: addDays(112), unitCost: "6.2" },
      { pharmacyId, drugBrandName: "Norvasc", innName: "Amlodipine", batchNumber: "AML-2501-C", quantity: 55, expiryDate: addDays(176), unitCost: "2.15" },
      { pharmacyId, drugBrandName: "Cozaar", innName: "Losartan", batchNumber: "LOS-2412-A", quantity: 33, expiryDate: addDays(205), unitCost: "3.8" },
      { pharmacyId, drugBrandName: "Nexium", innName: "Esomeprazole", batchNumber: "ESO-2502-B", quantity: 19, expiryDate: addDays(260), unitCost: "5.5" },
      { pharmacyId, drugBrandName: "Plavix", innName: "Clopidogrel", batchNumber: "CLO-2501-A", quantity: 12, expiryDate: addDays(340), unitCost: "8.2" },
    ]);
  }

  const mappingRows = await db.select().from(innMappingsTable).limit(1);
  if (!mappingRows[0]) {
    await db.insert(innMappingsTable).values([
      { brandName: "Glucophage", country: "Jordan", innName: "Metformin" },
      { brandName: "Glucophage", country: "UAE", innName: "Metformin" },
      { brandName: "Panadol", country: "Jordan", innName: "Paracetamol" },
      { brandName: "Panadol", country: "UAE", innName: "Paracetamol" },
      { brandName: "Tylenol", country: "Saudi Arabia", innName: "Paracetamol" },
      { brandName: "Ventolin", country: "Jordan", innName: "Salbutamol" },
      { brandName: "Proventil", country: "UAE", innName: "Salbutamol" },
      { brandName: "Amoxil", country: "Jordan", innName: "Amoxicillin" },
      { brandName: "Lipitor", country: "Jordan", innName: "Atorvastatin" },
      { brandName: "Norvasc", country: "UAE", innName: "Amlodipine" },
      { brandName: "Cozaar", country: "Saudi Arabia", innName: "Losartan" },
      { brandName: "Nexium", country: "Jordan", innName: "Esomeprazole" },
    ]);
  }
}