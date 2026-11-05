import {
  isMedicationTopic,
  resolveMedicationContinuity,
  type BrandMapping,
} from './medication-matching';

export type PatientChatLanguage = 'en' | 'ar';
export type PatientChatHistoryItem = { role: 'patient' | 'assistant'; text: string };

export type PharmaChatKnowledge = {
  role: 'patient' | 'pharmacist';
  medications?: Array<{
    brandName: string;
    innName: string;
    prescribingCountry: string;
    isActive: boolean;
  }>;
  prescriptions?: Array<{ issuedBy: string; issuedCountry: string; issuedDate: string }>;
  vaccinations?: Array<{ vaccineName: string; country: string; dateAdministered: string }>;
  allergies?: string;
  inventory?: Array<{
    drugBrandName: string;
    innName: string;
    quantity: number;
    expiryDate: string;
    status: 'fine' | 'return_window' | 'rotate_now';
    daysToExpiry: number;
  }>;
  brandMappings?: BrandMapping[];
};

export type PatientChatResponse = {
  text: string;
  emergency?: boolean;
};

const urgentSymptoms =
  /\b(chest pain|chest pressure|heart attack|difficulty breathing|trouble breathing|shortness of breath|can't breathe|cannot breathe|fainted|fainting|unconscious|stroke|face drooping|one[- ]sided weakness|severe bleeding|vomiting blood|overdose|poisoning|suicidal|suicide|want to die|self[- ]harm|anaphylaxis|severe allergic reaction|throat swelling|tongue swelling|seizure)\b|ألم(?: شديد)? في الصدر|ضغط في الصدر|أزمة قلبية|صعوبة في التنفس|ضيق(?: شديد)? في التنفس|لا أستطيع التنفس|فقدت الوعي|إغماء|جلطة|تدلي الوجه|ضعف مفاجئ في جهة|نزيف(?: حاد)? شديد|تقيؤ دم|جرعة زائدة|تسمم|أفكر بالانتحار|أفكر في الانتحار|لا أريد أن أعيش|إيذاء النفس|حساسية مفرطة|تحسس شديد|تورم الحلق|تورم اللسان|تشنج/i;

const doseOrPrescriptionQuestion =
  /\b(dose|dosage|how many|how much should i take|prescribe|prescription for me|should i take|stop taking|start taking)\b|جرعة|كم حبة|كم قرص|كم أتناول|هل أتناول|هل أوقف|أوقف الدواء|وصفة لي/i;

const resultQuestions =
  /\b(lab results?|test results?|scan results?|medical results?|diagnosis|diagnoses|blood test|medi ?scan)\b|نتائج التحليل|نتائج الفحوصات|نتيجة الفحص|نتيجتي|نتائجي|التشخيص|تشخيصي|تحاليل الدم/i;

const myMedicationQuestions =
  /\b(my medications?|my medicines?|what (?:medications|medicines) do i take|medicines in my passport)\b|أدويتي|الأدوية المسجلة في جوازي|الأدوية في جواز سفري|ما الأدوية التي أتناولها/i;

const prescriptionQuestions =
  /\b(my prescriptions?|prescription history|prescriptions in my passport)\b|وصفاتي الطبية|وصفاتي|الوصفات الطبية المسجلة/i;

const vaccinationQuestions =
  /\b(my vaccinations?|vaccination history|vaccines in my passport)\b|تطعيماتي|لقاحاتي|سجل التطعيمات|التطعيمات المسجلة/i;

const allergyQuestions =
  /\b(my allergies|allergies in my passport)\b|حساسياتي|حساسيتي|الحساسية المسجلة/i;

const interactionQuestions =
  /\b(drug interactions?|medicine interactions?|interact with|safe together|mix these medicines)\b|تداخل(?:ات)? دوائي|هل يتعارض|هل تتعارض|هل يمكن خلط الأدوية/i;

const privacyQuestions =
  /\b(consent|privacy|share my passport|access grant|who can see|data protection|revoke access)\b|الخصوصية|الخصوصية|الموافقة|أشارك جوازي|مشاركة الجواز|من يستطيع رؤية|صلاحية الوصول|إلغاء الوصول|حماية البيانات/i;

const inventoryQuestions =
  /\b(inventory|stock|stockout|out of stock|low stock|reorder|forecast|expiry|expiring|fefo|first.expiry)\b|المخزون|نفاد المخزون|ناقص المخزون|المخزون المنخفض|إعادة الطلب|توقع المخزون|انتهاء الصلاحية|قريب الانتهاء|الأدوية التي ستنتهي|الصلاحية|الأقدم انتهاء/i;

const travelQuestions =
  /\b(travel|travelling|traveling|carry medicine|medicines across borders|bring medicine)\b|السفر|أسافر|اسافر|أحمل الدواء|احمل الدواء|عبور الحدود|السفر بالأدوية/i;

const symptomQuestions =
  /\b(symptom|symptoms|pain|ache|fever|cough|rash|nausea|dizzy|dizziness|swelling|headache|sick|feel)\b|أعراض|عرض|أشعر|ألم|وجع|حمى|حرارة|سعال|طفح|غثيان|دوخة|تورم|صداع|مريض/i;

const helpQuestions =
  /\b(what can you do|who are you|help|about the app|pharmalens|health passport|how does this work)\b|ماذا يمكنك|من أنت|مساعد|ما هو فارمالينس|ما هو الجواز الصحي|كيف يعمل التطبيق|عن التطبيق/i;

const stockoutQuestions =
  /\b(stockout|out of stock|low stock|reorder|forecast|predict|shortage)\b|نفاد المخزون|المخزون المنخفض|إعادة الطلب|توقع المخزون|تنبؤ|نقص المخزون/i;

function listPatientMedications(knowledge: PharmaChatKnowledge, language: PatientChatLanguage): string {
  const medications = (knowledge.medications ?? []).filter((medication) => medication.isActive);
  if (!medications.length) {
    return language === 'ar'
      ? 'لا توجد أدوية نشطة مسجلة حاليًا في جوازك الصحي.'
      : 'There are no active medicines saved in your health passport right now.';
  }

  const items = medications.map((medication) =>
    `${medication.brandName} — ${medication.innName} (${medication.prescribingCountry})`,
  );
  return language === 'ar'
    ? `حسب السجلات المحفوظة في جوازك، الأدوية النشطة هي: ${items.join('؛ ')}. هذه قراءة للسجل فقط وليست توصية بالاستمرار أو التغيير.`
    : `Your saved passport lists these active medicines: ${items.join('; ')}. This is a record summary, not advice to continue or change treatment.`;
}

function listPrescriptions(knowledge: PharmaChatKnowledge, language: PatientChatLanguage): string {
  const records = knowledge.prescriptions ?? [];
  if (!records.length) {
    return language === 'ar'
      ? 'لا توجد وصفات طبية محفوظة في جوازك الصحي حاليًا.'
      : 'There are no prescriptions saved in your health passport right now.';
  }

  const items = records.map((record) => `${record.issuedBy} (${record.issuedCountry}, ${record.issuedDate})`);
  return language === 'ar'
    ? `الوصفات المحفوظة: ${items.join('؛ ')}. لا أستطيع تفسيرها كتعليمات علاجية.`
    : `Saved prescriptions: ${items.join('; ')}. I can’t interpret them as treatment instructions.`;
}

function listVaccinations(knowledge: PharmaChatKnowledge, language: PatientChatLanguage): string {
  const records = knowledge.vaccinations ?? [];
  if (!records.length) {
    return language === 'ar'
      ? 'لا توجد تطعيمات محفوظة في جوازك الصحي حاليًا.'
      : 'There are no vaccinations saved in your health passport right now.';
  }

  const items = records.map((record) => `${record.vaccineName} (${record.country}, ${record.dateAdministered})`);
  return language === 'ar'
    ? `التطعيمات المحفوظة: ${items.join('؛ ')}.`
    : `Saved vaccinations: ${items.join('; ')}.`;
}

function inventoryResponse(
  message: string,
  knowledge: PharmaChatKnowledge,
  language: PatientChatLanguage,
): string {
  if (knowledge.role !== 'pharmacist') {
    return language === 'ar'
      ? 'بيانات المخزون متاحة ضمن مساحة الصيدلي فقط. لا أستطيع عرض مخزون صيدلية من حساب المريض.'
      : 'Inventory data is available in the pharmacist workspace only. I can’t show pharmacy stock from a patient account.';
  }

  if (!knowledge.inventory) {
    return language === 'ar'
      ? 'تعذر تحميل بيانات المخزون، لذلك لا أستطيع تلخيصها الآن.'
      : 'Inventory data could not be loaded, so I can’t summarize it right now.';
  }

  const inventory = knowledge.inventory;
  if (stockoutQuestions.test(message)) {
    const zeroStock = inventory.filter((item) => item.quantity === 0);
    const zeroText = zeroStock.length
      ? (language === 'ar'
          ? ` الأصناف ذات الكمية صفر: ${zeroStock.map((item) => item.drugBrandName).join('، ')}.`
          : ` Items with zero quantity: ${zeroStock.map((item) => item.drugBrandName).join(', ')}.`)
      : (language === 'ar' ? ' لا توجد أصناف بكمية صفر في القائمة الحالية.' : ' No items currently have zero quantity.');
    return language === 'ar'
      ? `يعرض التطبيق الكميات الحالية، لكنه لا يحتوي على حد إعادة طلب أو توقع طلب، لذلك لا أستطيع تحديد الأصناف منخفضة المخزون أو التنبؤ بالنفاد.${zeroText}`
      : `The app shows current quantities but has no reorder thresholds or demand forecasting, so I can’t label low stock or predict stockouts.${zeroText}`;
  }

  if (!inventory.length) {
    return language === 'ar'
      ? 'لا توجد أصناف مخزون محفوظة في مساحة الصيدلية حاليًا.'
      : 'There are no inventory items saved for this pharmacy right now.';
  }

  const expiring = inventory
    .filter((item) => item.status !== 'fine')
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
    .slice(0, 6);
  const zeroStock = inventory.filter((item) => item.quantity === 0).length;
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);

  if (/\b(expiry|expiring|fefo|first.expiry)\b|انتهاء الصلاحية|قريب الانتهاء|الأدوية التي ستنتهي|الصلاحية|الأقدم انتهاء/i.test(message)) {
    if (!expiring.length) {
      return language === 'ar'
        ? `تحتوي القائمة الحالية على ${inventory.length} صنفًا و${totalUnits} وحدة. لا توجد أصناف مصنفة «تدوير الآن» أو «ضمن فترة الإرجاع» حاليًا.`
        : `The current list has ${inventory.length} items and ${totalUnits} units. No items are currently marked “rotate now” or “return window.”`;
    }
    const items = expiring.map((item) => `${item.drugBrandName}: ${item.quantity} (${item.daysToExpiry} days, ${item.expiryDate})`);
    return language === 'ar'
      ? `الأصناف الأقرب لانتهاء الصلاحية حسب بيانات التطبيق: ${items.join('؛ ')}. يصنف التطبيق ما تبقى على انتهائه أقل من 30 يومًا «تدوير الآن»، وحتى 90 يومًا «ضمن فترة الإرجاع».`
      : `Items nearest expiry in the app data: ${items.join('; ')}. The app marks under 30 days as “rotate now” and up to 90 days as “return window.”`;
  }

  return language === 'ar'
    ? `تحتوي قائمة المخزون الحالية على ${inventory.length} صنفًا و${totalUnits} وحدة، بينها ${zeroStock} صنف بكمية صفر. لا يحدد التطبيق حدًا لإعادة الطلب ولا يتنبأ بالطلب. اسألني عن الأصناف القريبة من انتهاء الصلاحية لعرضها.`
    : `The current inventory has ${inventory.length} items and ${totalUnits} units, including ${zeroStock} with zero quantity. The app does not set reorder thresholds or forecast demand. Ask for items nearing expiry to list them.`;
}

export function createPatientChatResponse(
  message: string,
  language: PatientChatLanguage,
  knowledge: PharmaChatKnowledge = { role: 'patient' },
  history: PatientChatHistoryItem[] = [],
): PatientChatResponse {
  const question = message.trim();
  if (!question) {
    return language === 'ar'
      ? { text: 'اكتب سؤالك أو صف ما تريد معرفته، من دون مشاركة اسمك أو بيانات تعريفية.' }
      : { text: 'Write your question or what you want to know. Please leave out your name and personal identifiers.' };
  }

  if (urgentSymptoms.test(question)) {
    return language === 'ar'
      ? {
          text: 'قد تشير الأعراض التي وصفتها إلى حالة عاجلة. إذا كانت تحدث الآن، اطلب الرعاية الطبية الطارئة فورًا أو اتصل برقم الطوارئ المحلي. لا يمكن لهذه المحادثة تقييم حالات الطوارئ أو علاجها.',
          emergency: true,
        }
      : {
          text: 'The symptoms you described may need urgent attention. If they are happening now, seek emergency medical care immediately or call your local emergency number. This chat cannot assess or treat emergencies.',
          emergency: true,
        };
  }

  if (doseOrPrescriptionQuestion.test(question)) {
    return language === 'ar'
      ? {
          text: 'لا أستطيع وصف الأدوية أو تحديد الجرعات أو إخبارك ببدء دواء أو إيقافه. اسأل طبيبًا أو صيدليًا مرخصًا، خاصةً إذا كنت تتناول أدوية أخرى أو لديك حساسيات.',
        }
      : {
          text: 'I can’t prescribe medication, choose a dose, or tell you to start or stop a medicine. Please ask a licensed clinician or pharmacist, especially if you take other medicines or have allergies.',
        };
  }

  const medicationLookup = resolveMedicationContinuity(
    question,
    language,
    knowledge.brandMappings,
    history,
  );
  if (medicationLookup.handled) return { text: medicationLookup.text ?? '' };

  if (interactionQuestions.test(question)) {
    return language === 'ar'
      ? {
          text: 'لا يتصل التطبيق حاليًا بقاعدة موثوقة لفحص تداخلات الأدوية، لذلك لا أستطيع تأكيد أن الجمع بينها آمن. اعرض قائمة الأدوية كاملة على صيدلي أو طبيب مرخص.',
        }
      : {
          text: 'The app is not connected to a verified drug-interaction database, so I can’t confirm that combining medicines is safe. Show your full medication list to a licensed pharmacist or clinician.',
        };
  }

  if (myMedicationQuestions.test(question) && knowledge.role === 'patient') {
    return { text: listPatientMedications(knowledge, language) };
  }

  if (prescriptionQuestions.test(question) && knowledge.role === 'patient') {
    return { text: listPrescriptions(knowledge, language) };
  }

  if (vaccinationQuestions.test(question) && knowledge.role === 'patient') {
    return { text: listVaccinations(knowledge, language) };
  }

  if (allergyQuestions.test(question) && knowledge.role === 'patient') {
    return language === 'ar'
      ? `الحساسية المحفوظة في ملفك: ${knowledge.allergies || 'لا توجد معلومات محفوظة'}. هذه خلاصة للسجل، فتحقق من دقتها مع مقدم الرعاية.`
      : `Allergies saved in your profile: ${knowledge.allergies || 'no information saved'}. This is a record summary; confirm it with your healthcare professional.`;
  }

  if (resultQuestions.test(question)) {
    return language === 'ar'
      ? 'هذه النسخة لا تخزن نتائج مختبر أو تشخيصات، ولا تتصل بـMediScan. أضف التطبيق نتيجة الفحص أو اعرضها على مختص؛ لا تشارك اسمك أو بيانات تعريفية هنا.'
      : 'This app version does not store lab results or diagnoses and is not connected to MediScan. Ask a clinician to review your result; don’t share your name or identifiers here.';
  }

  if (privacyQuestions.test(question)) {
    return language === 'ar'
      ? 'يختار المريض نطاق مشاركة مؤقتًا: الأدوية النشطة فقط أو الجواز كاملًا. يمكنه إلغاء الوصول، وتنتهي الصلاحية تلقائيًا، ويسجل التطبيق أحداث الوصول. استخدم بيانات تجريبية فقط، ولا تشارك معلومات تعريفية في هذه المحادثة.'
      : 'Patients choose a temporary sharing scope: active medicines only or the full passport. They can revoke access, grants expire, and access events are logged. Use demo data only, and don’t share identifiers in this chat.';
  }

  if (inventoryQuestions.test(question)) {
    return { text: inventoryResponse(question, knowledge, language) };
  }

  if (travelQuestions.test(question)) {
    return language === 'ar'
      ? 'لا يحتوي التطبيق على قاعدة موثقة لقوانين إدخال الأدوية حسب الدولة. احتفظ بوصفة الدواء وعبوته الأصلية، وتحقق من المتطلبات الحالية لدى الجهة الرسمية في بلد الوصول أو صيدلي مرخص قبل السفر.'
      : 'The app has no verified country-by-country medicine import rules. Keep the prescription and original packaging, and check current requirements with the destination country’s official authority or a licensed pharmacist before travel.';
  }

  if (symptomQuestions.test(question)) {
    return language === 'ar'
      ? 'للتثقيف العام فقط، ما العرض الذي يقلقك ومتى بدأ؟ لا أستطيع تشخيص السبب أو وصف علاج. إذا كانت الأعراض شديدة أو مفاجئة، اطلب الرعاية الطبية العاجلة.'
      : 'For general education only, what symptom concerns you and when did it begin? I can’t diagnose the cause or prescribe treatment. Seek urgent care for severe or sudden symptoms.';
  }

  if (isMedicationTopic(question, knowledge.brandMappings)) {
    return language === 'ar'
      ? 'لا يحتوي التطبيق على مرجع موثوق لخصائص الأدوية أو آثارها الجانبية، ولا على فاحص تداخلات. أستطيع تلخيص سجلك المحفوظ أو البحث في أسماء الكتالوج التجريبي مع توضيح أنها غير موثقة. اسأل صيدليًا مرخصًا عن المعلومات العلاجية.'
      : 'The app has no verified medicine monograph, side-effect reference, or interaction checker. I can summarize your saved records or search the demo brand catalog while clearly marking it unverified. Ask a licensed pharmacist for treatment information.';
  }

  if (helpQuestions.test(question)) {
    return language === 'ar'
      ? 'أنا مساعد PharmaLens وجواز MENA الصحي. أستطيع شرح صلاحيات مشاركة الجواز، تلخيص الأدوية والوصفات والتطعيمات المحفوظة للمريض، عرض مخزون الصيدلية وحالة الصلاحية للصيدلي، والبحث عن أسماء تجارية في كتالوج تجريبي غير موثّق. لا أشخّص أو أصف أو أتحقق من التداخلات.'
      : 'I’m the PharmaLens and MENA Health Passport assistant. I can explain passport sharing, summarize a patient’s saved medicines/prescriptions/vaccinations, show pharmacist inventory and expiry status, and search an unverified demo brand catalog. I don’t diagnose, prescribe, or verify interactions.';
  }

  return language === 'ar'
    ? 'أستطيع المساعدة في الجواز الصحي، الخصوصية والمشاركة، الأدوية المسجلة، المخزون والصلاحية للصيدلي، أو البحث عن اسم دواء بين دولتين. ما الموضوع الذي تقصده؟'
    : 'I can help with the health passport, privacy and sharing, saved medicines, pharmacist inventory and expiry, or a medicine-name search across two countries. Which topic do you mean?';
}
