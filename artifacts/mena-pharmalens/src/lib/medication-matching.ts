export type BrandMapping = {
  brandName: string;
  country: string;
  innName: string;
  verificationStatus: 'unverified_demo' | 'verified';
};

export type MedicationLookupResult = {
  handled: boolean;
  text?: string;
};

type Language = 'en' | 'ar';
type ChatHistoryItem = { role: 'patient' | 'assistant'; text: string };

const countryAliases: Array<{ country: string; aliases: string[] }> = [
  { country: 'Jordan', aliases: ['jordan', 'الأردن', 'الاردن', 'اردن'] },
  { country: 'Egypt', aliases: ['egypt', 'مصر'] },
  { country: 'United Arab Emirates', aliases: ['united arab emirates', 'uae', 'emirates', 'الإمارات العربية المتحدة', 'الامارات العربية المتحدة', 'الإمارات', 'الامارات'] },
  { country: 'Saudi Arabia', aliases: ['saudi arabia', 'ksa', 'saudi', 'المملكة العربية السعودية', 'السعودية', 'السعوديه'] },
  { country: 'Kuwait', aliases: ['kuwait', 'الكويت'] },
  { country: 'Qatar', aliases: ['qatar', 'قطر'] },
  { country: 'Bahrain', aliases: ['bahrain', 'البحرين'] },
  { country: 'Oman', aliases: ['oman', 'عمان', 'سلطنة عمان', 'سلطنة عُمان'] },
  { country: 'Iraq', aliases: ['iraq', 'العراق'] },
  { country: 'Lebanon', aliases: ['lebanon', 'لبنان'] },
  { country: 'Syria', aliases: ['syria', 'سوريا', 'سورية'] },
  { country: 'Palestine', aliases: ['palestine', 'فلسطين'] },
  { country: 'Yemen', aliases: ['yemen', 'اليمن'] },
  { country: 'Morocco', aliases: ['morocco', 'المغرب'] },
  { country: 'Tunisia', aliases: ['tunisia', 'تونس'] },
  { country: 'Algeria', aliases: ['algeria', 'الجزائر'] },
  { country: 'Libya', aliases: ['libya', 'ليبيا'] },
  { country: 'Sudan', aliases: ['sudan', 'السودان'] },
];

const crossCountryIntent =
  /\b(equivalent|alternative|substitute|same (?:medicine|drug)|brand(?: name)?|generic|inn|available in|find in|travel(?:ling|ing)? to|from .+ to)\b|بديل|مقابل|الاسم التجاري|اسم تجاري|المادة الفعالة|يتوفر في|متوفر في|من .+ إلى|من .+ الى|أسافر|اسافر|بلد(?:ين)?/i;

const generalMedicationIntent =
  /\b(medicine|medication|drug|tablet|capsule|interaction|side effect|active ingredient|brand|generic|inn)\b|دواء|دواءي|أدوية|ادوية|حبوب|كبسولة|تداخل دوائي|أعراض جانبية|المادة الفعالة|اسم تجاري/i;
const ingredientQuestion =
  /\b(active ingredient|generic name|inn)\b|المادة الفعالة|الاسم العلمي/i;

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function includesPhrase(text: string, phrase: string): boolean {
  const normalizedText = ` ${normalize(text)} `;
  const normalizedPhrase = ` ${normalize(phrase)} `;
  return normalizedPhrase.trim().length > 0 && normalizedText.includes(normalizedPhrase);
}

function getCountryMentions(text: string): string[] {
  const normalizedText = normalize(text);
  const matches = countryAliases.flatMap(({ country, aliases }) =>
    aliases.flatMap((alias) => {
      const normalizedAlias = normalize(alias);
      const index = ` ${normalizedText} `.indexOf(` ${normalizedAlias} `);
      return index < 0 ? [] : [{ country, index }];
    }),
  );

  matches.sort((a, b) => a.index - b.index);
  return [...new Set(matches.map((match) => match.country))];
}

function getPatientText(message: string, history: ChatHistoryItem[]): string {
  return [
    ...history.filter((item) => item.role === 'patient').slice(-6).map((item) => item.text),
    message,
  ].join(' ');
}

function findMention(text: string, mappings: BrandMapping[]) {
  const names = [
    ...mappings.map((row) => ({ name: row.brandName, row, kind: 'brand' as const })),
    ...mappings.map((row) => ({ name: row.innName, row, kind: 'inn' as const })),
  ].sort((a, b) => normalize(b.name).length - normalize(a.name).length);

  return names.find(({ name }) => includesPhrase(text, name));
}

export function isMedicationTopic(message: string, mappings: BrandMapping[] = []): boolean {
  return generalMedicationIntent.test(message) || Boolean(findMention(message, mappings));
}

export function resolveMedicationContinuity(
  message: string,
  language: Language,
  mappings: BrandMapping[] | undefined,
  history: ChatHistoryItem[] = [],
): MedicationLookupResult {
  const userText = getPatientText(message, history);
  const countries = getCountryMentions(userText);
  const queryMappings = mappings ?? [];
  const mention = findMention(userText, queryMappings);
  const mentionsMedication = Boolean(mention) || generalMedicationIntent.test(userText);
  const hasLookupIntent = crossCountryIntent.test(message)
    || (Boolean(mention) && ingredientQuestion.test(message))
    || (countries.length > 0 && mentionsMedication)
    || Boolean(mention && crossCountryIntent.test(userText));

  if (!hasLookupIntent) return { handled: false };

  if (!mappings) {
    return {
      handled: true,
      text: language === 'ar'
        ? 'كتالوج الأسماء التجارية غير متاح الآن، لذلك لا أستطيع التحقق من تطابق دوائي. اكتب اسم المادة الفعالة من العبوة واسأل صيدليًا مرخصًا.'
        : 'The brand-name catalog is unavailable, so I can’t check a medication match. Read the active ingredient from the package and ask a licensed pharmacist.',
    };
  }

  if (mention && ingredientQuestion.test(message)) {
    const matchingRows = queryMappings.filter((row) =>
      mention.kind === 'brand'
        ? normalize(row.brandName) === normalize(mention.row.brandName)
        : normalize(row.innName) === normalize(mention.row.innName),
    );
    if (matchingRows.length === 0) {
      return {
        handled: true,
        text: language === 'ar'
          ? 'لا يوجد سجل للاسم في الكتالوج الحالي. لا أستطيع تأكيد المادة الفعالة؛ تحقق من العبوة أو اسأل صيدليًا.'
          : 'There is no entry for that name in the current catalog. I can’t confirm its active ingredient; check the package or ask a pharmacist.',
      };
    }
    const entries = [...new Set(matchingRows.map((row) => `${row.brandName} — ${row.innName} (${row.country})`))];
    return {
      handled: true,
      text: language === 'ar'
        ? `الكتالوج التجريبي غير الموثّق يسجل: ${entries.join('، ')}. هذه ليست بيانات دوائية معتمدة؛ تحقق من المادة الفعالة على العبوة أو مع صيدلي.`
        : `The unverified demo catalog lists: ${entries.join('; ')}. This is not an authoritative drug reference; confirm the active ingredient on the package or with a pharmacist.`,
    };
  }

  if (countries.length < 2) {
    const countryHint = countries.length === 1
      ? (language === 'ar'
          ? `ذكرت ${countries[0]}. هل هذه دولة شراء الدواء أم الدولة التي تريد البحث فيها؟ `
          : `You mentioned ${countries[0]}. Is that where you bought it or where you want to search? `)
      : '';
    return {
      handled: true,
      text: language === 'ar'
        ? `${countryHint}اذكر اسم الدواء التجاري أو المادة الفعالة، ودولة شراء الدواء والدولة المطلوبة. أرسل أيضًا التركيز والشكل الصيدلاني وطريقة الاستخدام كما تظهر على العبوة إن أمكن.`
        : `${countryHint}Please provide the brand or active ingredient, the country where it was bought, and the destination country. Include the strength, dosage form, and route shown on the package if available.`,
    };
  }

  if (!mention) {
    return {
      handled: true,
      text: language === 'ar'
        ? 'لم أتعرف على اسم الدواء في كتالوج التطبيق الحالي. لا أريد تخمين المادة الفعالة أو اسم بديل. اكتب الاسم التجاري أو المادة الفعالة كما تظهر على العبوة.'
        : 'I couldn’t match that medicine in the app’s current catalog. I won’t guess its active ingredient or an alternative. Please enter the brand or active ingredient exactly as shown on the package.',
    };
  }

  const [sourceCountry, destinationCountry] = countries;
  const sourceEntries = queryMappings.filter((row) =>
    row.country === sourceCountry
    && (mention.kind === 'brand'
      ? normalize(row.brandName) === normalize(mention.row.brandName)
      : normalize(row.innName) === normalize(mention.row.innName)),
  );
  const sourceEntry = sourceEntries[0];

  if (!sourceEntry) {
    return {
      handled: true,
      text: language === 'ar'
        ? `لا يوجد في كتالوج التطبيق سجل للاسم "${mention.name}" في ${sourceCountry}. لذلك لا أستطيع تأكيد المادة الفعالة أو البحث عن بديل موثوق في ${destinationCountry}.`
        : `The app catalog has no record for "${mention.name}" in ${sourceCountry}. I can’t confirm its active ingredient or identify a reliable alternative in ${destinationCountry}.`,
    };
  }

  const destinationEntries = queryMappings.filter((row) =>
    row.country === destinationCountry && normalize(row.innName) === normalize(sourceEntry.innName),
  );
  const destinationNames = [...new Set(destinationEntries.map((row) => row.brandName))];
  const sourceLabel = `${sourceEntry.brandName} (${sourceEntry.innName})`;

  if (destinationNames.length === 0) {
    return {
      handled: true,
      text: language === 'ar'
        ? `يوجد سجل تجريبي غير موثّق لـ ${sourceLabel} في ${sourceCountry}، لكن لا يوجد اسم تجاري مسجل للمادة نفسها في ${destinationCountry} ضمن كتالوج التطبيق. لا أستطيع اقتراح بديل موثوق.`
        : `The app has an unverified demo record for ${sourceLabel} in ${sourceCountry}, but no product with the same recorded active ingredient is listed for ${destinationCountry}. I can’t recommend a reliable alternative.`,
    };
  }

  const destinationLabels = destinationNames.map((name) => `${name} (${destinationCountry})`).join(', ');
  return {
    handled: true,
    text: language === 'ar'
      ? `توجد سجلات تجريبية غير موثّقة فقط: ${sourceLabel} في ${sourceCountry}، وأسماء مسجلة للمادة نفسها في ${destinationCountry}: ${destinationLabels}. هذا ليس تأكيدًا للتكافؤ أو للاستبدال. الكتالوج لا يحتوي على التركيز أو الشكل الصيدلاني أو طريقة الاستخدام أو آلية التحرر ولا على مصدر تحقق؛ يجب أن يؤكد صيدلي مرخص تطابق المنتج قبل أي تغيير.`
      : `Only unverified demo records are available: ${sourceLabel} in ${sourceCountry}, and these entries for the same recorded active ingredient in ${destinationCountry}: ${destinationLabels}. This does not confirm equivalence or support substitution. The catalog lacks strength, dosage form, route, release mechanism, and verification sources; a licensed pharmacist must confirm the exact product before any change.`,
  };
}

