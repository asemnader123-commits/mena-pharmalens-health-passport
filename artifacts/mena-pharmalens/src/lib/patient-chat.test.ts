import assert from 'node:assert/strict';
import test from 'node:test';
import { createPatientChatResponse, type PharmaChatKnowledge } from './patient-chat';
import type { BrandMapping } from './medication-matching';

const demoMappings: BrandMapping[] = [
  { brandName: 'Panadol', country: 'Jordan', innName: 'Paracetamol', verificationStatus: 'unverified_demo' },
  { brandName: 'Panadol', country: 'UAE', innName: 'Paracetamol', verificationStatus: 'unverified_demo' },
  { brandName: 'Tylenol', country: 'Saudi Arabia', innName: 'Paracetamol', verificationStatus: 'unverified_demo' },
  { brandName: 'Ventolin', country: 'Jordan', innName: 'Salbutamol', verificationStatus: 'unverified_demo' },
  { brandName: 'Proventil', country: 'UAE', innName: 'Salbutamol', verificationStatus: 'unverified_demo' },
];

const patientKnowledge: PharmaChatKnowledge = {
  role: 'patient',
  brandMappings: demoMappings,
  medications: [
    { brandName: 'Panadol', innName: 'Paracetamol', prescribingCountry: 'Jordan', isActive: true },
    { brandName: 'Old medicine', innName: 'Unknown', prescribingCountry: 'Jordan', isActive: false },
  ],
  prescriptions: [{ issuedBy: 'Demo Clinic', issuedCountry: 'Jordan', issuedDate: '2026-01-10' }],
  vaccinations: [{ vaccineName: 'Demo vaccine', country: 'Jordan', dateAdministered: '2025-09-20' }],
  allergies: 'No known allergies',
};

test('urgent symptoms produce emergency guidance in English', () => {
  const response = createPatientChatResponse('I have chest pain and trouble breathing', 'en');
  assert.equal(response.emergency, true);
  assert.match(response.text, /emergency medical care immediately/i);
});

test('urgent symptoms produce emergency guidance in Arabic', () => {
  const response = createPatientChatResponse('أشعر بألم في الصدر وصعوبة في التنفس', 'ar');
  assert.equal(response.emergency, true);
  assert.match(response.text, /الرعاية الطبية الطارئة فورًا/);
});

test('medication questions never produce a dose or prescription', () => {
  const response = createPatientChatResponse('What dose should I take?', 'en');
  assert.match(response.text, /can’t prescribe medication/i);
  assert.match(response.text, /licensed clinician or pharmacist/i);
});

test('cross-country matching uses only the app catalog and labels demo entries unverified', () => {
  const response = createPatientChatResponse(
    'I use Panadol in Jordan. What is listed in Saudi Arabia?',
    'en',
    patientKnowledge,
  );
  assert.match(response.text, /Tylenol/);
  assert.match(response.text, /unverified demo records/i);
  assert.match(response.text, /not confirm equivalence or support substitution/i);
  assert.match(response.text, /lacks strength, dosage form, route/i);
});

test('cross-country matching asks for country details when they are missing', () => {
  const response = createPatientChatResponse('Can you find an equivalent for Panadol?', 'en', patientKnowledge);
  assert.match(response.text, /country where it was bought/i);
  assert.match(response.text, /destination country/i);
});

test('cross-country questions retain the medicine name across a clarification turn', () => {
  const response = createPatientChatResponse(
    'Jordan to Saudi Arabia',
    'en',
    patientKnowledge,
    [
      { role: 'patient', text: 'Can you find an equivalent for Panadol?' },
      { role: 'assistant', text: 'Please provide the source and destination countries.' },
    ],
  );
  assert.match(response.text, /Tylenol/);
  assert.match(response.text, /unverified demo records/i);
});

test('unknown medicines do not receive invented active ingredients or alternatives', () => {
  const response = createPatientChatResponse(
    'Find an equivalent for UnknownDrug from Jordan to Egypt',
    'en',
    patientKnowledge,
  );
  assert.match(response.text, /couldn’t match that medicine/i);
  assert.match(response.text, /won’t guess/i);
});

test('active ingredient answers explicitly mark demo mappings unverified', () => {
  const response = createPatientChatResponse(
    'What is the active ingredient of Panadol?',
    'en',
    patientKnowledge,
  );
  assert.match(response.text, /unverified demo catalog/i);
  assert.match(response.text, /Paracetamol/);
});

test('patient medication summaries use saved records and omit inactive entries', () => {
  const response = createPatientChatResponse('What medicines are saved in my passport?', 'en', patientKnowledge);
  assert.match(response.text, /Panadol/);
  assert.doesNotMatch(response.text, /Old medicine/);
  assert.match(response.text, /not advice to continue or change treatment/i);
});

test('the assistant does not claim lab results or diagnoses are connected', () => {
  const response = createPatientChatResponse('What do my lab results mean?', 'en', patientKnowledge);
  assert.match(response.text, /does not store lab results or diagnoses/i);
  assert.match(response.text, /not connected to MediScan/i);
});

test('interaction questions disclose that no verified interaction checker is connected', () => {
  const response = createPatientChatResponse('Do these medicines interact?', 'en', patientKnowledge);
  assert.match(response.text, /not connected to a verified drug-interaction database/i);
});

test('pharmacy inventory answers use current data and do not invent stock thresholds', () => {
  const response = createPatientChatResponse(
    'Summarize stockout risk',
    'en',
    {
      role: 'pharmacist',
      inventory: [
        {
          drugBrandName: 'Example tablets',
          innName: 'Example ingredient',
          quantity: 0,
          expiryDate: '2026-12-01',
          status: 'fine',
          daysToExpiry: 100,
        },
      ],
    },
  );
  assert.match(response.text, /no reorder thresholds or demand forecasting/i);
  assert.match(response.text, /Example tablets/);
});

test('passport privacy answers explain consent and revocation', () => {
  const response = createPatientChatResponse('How does consent work when I share my passport?', 'en', patientKnowledge);
  assert.match(response.text, /temporary sharing scope/i);
  assert.match(response.text, /revoke access/i);
  assert.match(response.text, /access events are logged/i);
});

test('empty questions request a clear question without personal identifiers', () => {
  const response = createPatientChatResponse('  ', 'ar');
  assert.match(response.text, /من دون مشاركة اسمك/);
});
