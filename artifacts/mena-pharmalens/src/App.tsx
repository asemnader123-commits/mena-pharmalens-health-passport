import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, ChevronRight, Clipboard,
  Clock3, FileText, Globe2, History, LockKeyhole, LogOut, Menu, MessageCircle,
  PackageCheck, Phone, Pill, Plus, QrCode, RefreshCcw, RotateCcw,
  ScanLine, Search, ShieldCheck, Syringe, Trash2, UserRound, X,
} from 'lucide-react';
import {
  AccessGrantInputScope, DemoLoginInputRole, getGetCurrentSessionQueryKey,
  getGetPassportQueryKey, getGetPassportSummaryQueryKey, getGetPharmacySummaryQueryKey,
  getListAccessGrantsQueryKey, getListAccessHistoryQueryKey, getListInventoryQueryKey,
  getListMedicationsQueryKey, getListPassportRecordsQueryKey, useConfirmSubstitution,
  useCreateAccessGrant, useCreateInventoryItem, useCreateMedication,
  useCreatePassportRecord, useDeleteInventoryItem, useDeleteMedication,
  useDemoLogin, useGetCurrentSession, useGetPassport, useGetPassportSummary,
  useGetPharmacySummary, useListAccessGrants, useListAccessHistory, useListInventory,
  useListMedications, useListPassportRecords, useLookupPatient, useLogout,
  useRevokeAccessGrant, useUpdateInventoryItem, useUpdateMedication,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import PatientChatbot from '@/components/patient-chatbot';
import { Toaster } from '@/components/ui/toaster';
import { createPatientChatResponse } from '@/lib/patient-chat';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
type Lang = 'en' | 'ar';

const text = {
  en: {
    navPatient: 'My passport', navPharmacy: 'PharmaLens', signIn: 'Demo sign in',
    language: 'العربية', eyebrow: 'A clearer way across borders',
    hero: 'Your health, ready for the next border.',
    heroBody: 'A portable health passport for people on the move — with a pharmacist workspace built for the moments that matter.',
    patientCta: 'Open patient passport', pharmacistCta: 'Enter pharmacist workspace',
    trusted: 'Built for a region in motion', patient: 'For patients', pharmacy: 'For pharmacists',
    patientBody: 'Keep your essentials close. Share only what is needed, for only as long as needed.',
    pharmacyBody: 'Turn a temporary access code into a precise, useful conversation at the counter.',
    how: 'Designed around one clear question', howBody: 'What is shared, with whom, and until when?', step1: 'Keep', step1b: 'Your medical record stays yours.', step2: 'Choose', step2b: 'Pick a narrow access scope.', step3: 'Close', step3b: 'Revoke access when the visit ends.',
    security: 'Your health data should travel with context, not compromise.',
    publicLink: 'Public app link | الرابط العام', publicLinkBody: 'Share this page with a patient or pharmacist.', copyLink: 'Copy link', copied: 'Copied',
    journeyEyebrow: '01 — PATIENT JOURNEY / رحلة المريض', journeyTitle: 'A passport that travels with you.', journeyBody: 'Follow the same trusted handoff from Amman to Dubai to Riyadh — without carrying your whole medical file.',
    journeyStep1: 'Create a temporary grant', journeyStep1b: 'The patient chooses the scope and duration.',
    journeyStep2: 'Share at the pharmacy', journeyStep2b: 'A QR token or fallback code opens only what is needed.',
    journeyStep3: 'Close the loop', journeyStep3b: 'Access expires automatically and the view is logged.',
  },
  ar: {
    navPatient: 'جواز سفري الصحي', navPharmacy: 'PharmaLens', signIn: 'دخول تجريبي',
    language: 'English', eyebrow: 'طريقة أوضح لعبور الحدود',
    hero: 'صحتك جاهزة للحدود القادمة.', heroBody: 'جواز صحي محمول للناس كثيري التنقل، مع مساحة عمل للصيادلة للحظات التي تهم.',
    patientCta: 'فتح جواز المريض', pharmacistCta: 'دخول مساحة الصيدلية',
    trusted: 'مصمم لمنطقة تتحرك', patient: 'للمرضى', pharmacy: 'للصيادلة',
    patientBody: 'احتفظ بالأساسيات قريبة. شارك المطلوب فقط، وللمدة المطلوبة فقط.',
    pharmacyBody: 'حوّل رمز الوصول المؤقت إلى محادثة دقيقة ومفيدة عند المنضدة.',
    how: 'مصمم حول سؤال واضح', howBody: 'ما الذي تتم مشاركته، مع من، وإلى متى؟', step1: 'احتفظ', step1b: 'سجلك الطبي ملكك.', step2: 'اختر', step2b: 'حدد نطاق الوصول.', step3: 'أغلق', step3b: 'ألغِ الوصول بعد الزيارة.',
    security: 'يجب أن تسافر بياناتك الصحية مع السياق، لا مع التنازل.',
    publicLink: 'الرابط العام للتطبيق | Public app link', publicLinkBody: 'شارك هذه الصفحة مع المريض أو الصيدلي.', copyLink: 'نسخ الرابط', copied: 'تم النسخ',
    journeyEyebrow: '01 — رحلة المريض / PATIENT JOURNEY', journeyTitle: 'جواز يسافر معك.', journeyBody: 'اتبع نفس مسار الوصول الموثوق من عمّان إلى دبي إلى الرياض، من دون حمل ملفك الطبي كاملًا.',
    journeyStep1: 'أنشئ تصريح وصول مؤقتًا', journeyStep1b: 'يختار المريض نطاق الوصول ومدته.',
    journeyStep2: 'شارك الرمز في الصيدلية', journeyStep2b: 'يفتح رمز QR أو الرمز البديل المعلومات المطلوبة فقط.',
    journeyStep3: 'أغلق الحلقة', journeyStep3b: 'ينتهي الوصول تلقائيًا ويتم تسجيل المشاهدة.',
  },
} as const;
type Copy = typeof text.en | typeof text.ar;

function useLanguage() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('mena-lang') as Lang) || 'en');
  useEffect(() => {
    const onLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<Lang>).detail;
      setLang((current) => current === next ? current : next);
    };
    window.addEventListener('mena-language-change', onLanguageChange);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('mena-lang', lang);
    return () => window.removeEventListener('mena-language-change', onLanguageChange);
  }, [lang]);
  const changeLang = (next: Lang) => {
    setLang(next);
    window.dispatchEvent(new CustomEvent<Lang>('mena-language-change', { detail: next }));
  };
  return { lang, setLang: changeLang, t: text[lang] };
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
    <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><ShieldCheck size={19} strokeWidth={2.3} /></span>
    {!compact && <span className="font-display text-[15px] font-extrabold tracking-tight">MENA <span className="text-primary">Passport</span></span>}
  </Link>;
}

function LanguageToggle({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  return <button data-testid="button-language-toggle" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary">
    <Globe2 size={14} /> {lang === 'en' ? 'العربية' : 'English'}
  </button>;
}

function PublicLinkCard({ t }: { t: Copy }) {
  const [copied, setCopied] = useState(false);
  const publicLink = new URL(import.meta.env.BASE_URL || '/', window.location.origin).href;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
    } catch {
      const input = document.createElement('textarea');
      input.value = publicLink;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return <div className="mt-7 flex max-w-xl flex-col gap-3 rounded-2xl border border-border bg-card/75 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{t.publicLink}</p>
      <p dir="ltr" className="mt-1 truncate font-mono-app text-xs text-foreground">{publicLink}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t.publicLinkBody}</p>
    </div>
    <button data-testid="button-copy-public-link" onClick={copyLink} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-3.5 py-2.5 text-xs font-bold text-background transition hover:-translate-y-0.5">
      <Clipboard size={14} /> {copied ? t.copied : t.copyLink}
    </button>
  </div>;
}

function PublicHeader({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  return <header className="absolute inset-x-0 top-0 z-20">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
      <Logo />
      <div className="flex items-center gap-3"><LanguageToggle lang={lang} setLang={setLang} /><Link href="/login" data-testid="link-header-login" className="hidden rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background transition hover:-translate-y-0.5 sm:inline-flex">{text[lang].signIn}</Link></div>
    </div>
  </header>;
}

function Landing() {
  const { lang, setLang, t } = useLanguage();
  return <div className="min-h-[100dvh] overflow-hidden bg-background">
    <PublicHeader lang={lang} setLang={setLang} />
    <main>
      <section className="relative isolate overflow-hidden pb-16 pt-32 lg:pb-24 lg:pt-44">
        <div className="absolute -left-48 top-12 -z-10 size-[34rem] rounded-full bg-secondary/70 blur-3xl" />
        <div className="absolute -right-40 top-0 -z-10 size-[29rem] rounded-full bg-accent/15 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-end gap-14 px-5 lg:grid-cols-[1.1fr_.9fr] lg:px-10">
          <div className="animate-rise">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-primary"><span className="size-1.5 rounded-full bg-accent" /> {t.eyebrow}</div>
            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[.98] tracking-[-.055em] text-foreground sm:text-7xl lg:text-[6.6rem]">{t.hero}</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">{t.heroBody}</p>
             <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/login?role=patient" data-testid="link-hero-patient" className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90">{t.patientCta}<ArrowRight size={16} className="transition group-hover:translate-x-1 rtl:rotate-180" /></Link><Link href="/login?role=pharmacist" data-testid="link-hero-pharmacist" className="inline-flex items-center justify-center gap-3 rounded-full border border-border bg-card px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 hover:border-primary hover:text-primary">{t.pharmacistCta}<ArrowRight size={16} className="rtl:rotate-180" /></Link></div><PublicLinkCard t={t} />
          </div>
          <div className="relative animate-rise delay-2">
            <div className="relative mx-auto max-w-[440px] rotate-[2deg] rounded-[2rem] bg-foreground p-3 shadow-2xl">
              <div className="rounded-[1.5rem] bg-card p-5">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary"><ShieldCheck size={19} /></span><span className="font-display text-sm font-extrabold">Health passport</span></div><span className="font-mono-app text-[10px] text-primary">ACTIVE</span></div>
                <div className="mt-8 rounded-2xl bg-secondary/70 p-4"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Sharing with</p><p className="mt-2 font-display text-xl font-bold">Al Noor Pharmacy</p><p className="mt-1 text-xs text-muted-foreground">Dubai, United Arab Emirates</p><div className="mt-5 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Access ends in</p><p className="mt-1 font-mono-app text-2xl font-bold text-primary">01:42:18</p></div><span className="grid size-14 place-items-center rounded-xl bg-card text-foreground"><QrCode size={34} strokeWidth={1.4} /></span></div></div>
                <div className="mt-5 flex items-center gap-3 border-t border-border pt-4"><span className="size-2 rounded-full bg-primary" /><span className="text-xs font-medium text-muted-foreground">Active medications only</span></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:-left-9"><div className="flex items-center gap-2 text-xs font-bold"><span className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent"><LockKeyhole size={14} /></span> You choose what travels.</div></div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-24"><p className="text-center text-xs font-bold uppercase tracking-[.25em] text-muted-foreground">{t.trusted}</p><div className="mt-7 grid gap-5 lg:grid-cols-2"><div className="group relative overflow-hidden rounded-[1.75rem] bg-primary p-7 text-primary-foreground lg:p-10"><div className="absolute -right-10 -top-20 size-64 rounded-full border-[35px] border-primary-foreground/10" /><div className="relative"><div className="mb-16 flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-primary-foreground/12"><UserRound size={21} /></span><span className="font-mono-app text-xs text-primary-foreground/65">01 / 02</span></div><h2 className="font-display text-3xl font-extrabold">{t.patient}</h2><p className="mt-3 max-w-md leading-7 text-primary-foreground/75">{t.patientBody}</p><Link href="/login?role=patient" data-testid="link-patient-entry" className="mt-8 inline-flex items-center gap-2 text-sm font-bold underline decoration-primary-foreground/40 underline-offset-8 transition group-hover:gap-3">{t.patientCta}<ArrowRight size={15} className="rtl:rotate-180" /></Link></div></div><div className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-7 lg:p-10"><div className="absolute -bottom-28 -right-16 size-64 rounded-full border-[35px] border-accent/10" /><div className="relative"><div className="mb-16 flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-accent/15 text-accent"><Pill size={21} /></span><span className="font-mono-app text-xs text-muted-foreground">02 / 02</span></div><h2 className="font-display text-3xl font-extrabold">{t.pharmacy}</h2><p className="mt-3 max-w-md leading-7 text-muted-foreground">{t.pharmacyBody}</p><Link href="/login?role=pharmacist" data-testid="link-pharmacy-entry" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary underline decoration-primary/30 underline-offset-8 transition group-hover:gap-3">{t.pharmacistCta}<ArrowRight size={15} className="rtl:rotate-180" /></Link></div></div></div></section>
       <JourneySection t={t} lang={lang} />
       <section className="border-y border-border bg-secondary/35"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-24"><div><span className="font-mono-app text-xs text-primary">02 — PRINCIPLE</span><h2 className="mt-5 max-w-sm font-display text-4xl font-extrabold leading-tight tracking-tight">{t.how}</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">{t.howBody}</p></div><div className="grid gap-4">{[[t.step1,t.step1b,'01'],[t.step2,t.step2b,'02'],[t.step3,t.step3b,'03']].map(([a,b,n]) => <div key={n} className="flex items-center gap-5 border-b border-border py-5"><span className="font-mono-app text-xs text-primary">{n}</span><div><p className="font-display text-xl font-bold">{a}</p><p className="mt-1 text-sm text-muted-foreground">{b}</p></div></div>)}</div></div></section>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-24"><div className="rounded-[2rem] bg-foreground px-7 py-12 text-background lg:px-16 lg:py-16"><div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-2 text-accent"><ShieldCheck size={18} /><span className="font-mono-app text-xs uppercase tracking-[.18em]">MENA Passport</span></div><h2 className="mt-5 max-w-2xl font-display text-3xl font-extrabold leading-tight lg:text-5xl">{t.security}</h2></div><Link href="/login" data-testid="link-final-login" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 text-sm font-bold text-accent-foreground transition hover:-translate-y-0.5">{t.signIn}<ArrowRight size={15} className="rtl:rotate-180" /></Link></div></div></section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-border px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10"><Logo compact /><span>Informational demo · Built for trusted handoffs</span></footer>
  </div>;
}

function JourneySection({ t, lang }: { t: Copy; lang: Lang }) {
  return <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-24">
    <div className="grid items-center gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
      <div>
        <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">{t.journeyEyebrow}</p>
        <h2 className="mt-5 max-w-lg font-display text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">{t.journeyTitle}</h2>
        <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">{t.journeyBody}</p>
        <div className="mt-8 space-y-5">
          {[
            ['01', t.journeyStep1, t.journeyStep1b],
            ['02', t.journeyStep2, t.journeyStep2b],
            ['03', t.journeyStep3, t.journeyStep3b],
          ].map(([number, title, body]) => <div key={number} className="flex gap-4 border-b border-border pb-4">
            <span className="font-mono-app text-xs font-bold text-primary">{number}</span>
            <div><p className="font-display text-lg font-bold">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div>
          </div>)}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-7">
        <div className="absolute -right-20 -top-24 size-72 rounded-full border-[32px] border-accent/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">MENA ROUTE</p><p className="mt-1 font-display text-lg font-bold">Amman → Dubai → Riyadh</p></div>
            <Globe2 className="text-primary" size={22} />
          </div>
          <svg viewBox="0 0 760 360" role="img" aria-label={lang === 'ar' ? 'خريطة رحلة المريض من عمّان إلى دبي إلى الرياض' : 'Patient journey map from Amman to Dubai to Riyadh'} className="mt-4 h-auto w-full">
            <defs>
              <linearGradient id="route-sea" x1="0" x2="1">
                <stop offset="0%" stopColor="hsl(var(--secondary))" />
                <stop offset="100%" stopColor="hsl(var(--background))" />
              </linearGradient>
              <filter id="route-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="hsl(var(--foreground))" floodOpacity=".12" /></filter>
            </defs>
            <rect width="760" height="360" rx="30" fill="url(#route-sea)" />
            <path d="M112 67c40-19 82-13 107 11 15 14 25 33 43 41 21 10 53 4 76 17 24 13 35 42 60 51 25 9 56-3 80 10 28 15 38 55 67 70 29 15 63 6 92 23 17 10 28 28 40 42H157c14-27 8-51-10-69-17-18-40-33-48-57-7-21-2-50 13-73z" fill="hsl(var(--primary) / .16)" filter="url(#route-shadow)" />
            <path d="M173 112C278 67 381 216 526 177" fill="none" stroke="hsl(var(--accent))" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 18" />
            <path d="M173 112C278 67 381 216 526 177" fill="none" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" opacity=".55" />
            <circle cx="173" cy="112" r="15" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="6" />
            <circle cx="350" cy="155" r="11" fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth="5" />
            <circle cx="526" cy="177" r="15" fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth="6" />
            <circle cx="173" cy="112" r="4" fill="hsl(var(--primary))" />
            <circle cx="350" cy="155" r="4" fill="hsl(var(--accent))" />
            <circle cx="526" cy="177" r="4" fill="hsl(var(--accent))" />
            <text x="173" y="88" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="18" fontWeight="700" fill="hsl(var(--foreground))">01</text>
            <text x="350" y="131" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="18" fontWeight="700" fill="hsl(var(--foreground))">02</text>
            <text x="526" y="153" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="18" fontWeight="700" fill="hsl(var(--foreground))">03</text>
          </svg>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-bold text-muted-foreground"><span>Amman<br /><b className="font-normal text-muted-foreground/70">عمّان</b></span><span>Dubai<br /><b className="font-normal text-muted-foreground/70">دبي</b></span><span>Riyadh<br /><b className="font-normal text-muted-foreground/70">الرياض</b></span></div>
        </div>
      </div>
    </div>
  </section>;
}

function Login() {
  const { lang, setLang } = useLanguage();
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const [role, setRole] = useState<'patient' | 'pharmacist'>(params.get('role') === 'pharmacist' ? 'pharmacist' : 'patient');
  const login = useDemoLogin();
  const qc = useQueryClient();
  const submit = () => login.mutate({ data: { role: role === 'patient' ? DemoLoginInputRole.patient : DemoLoginInputRole.pharmacist } }, { onSuccess: (session) => { qc.setQueryData(getGetCurrentSessionQueryKey(), session); setLocation(role === 'patient' ? '/passport' : '/pharmacy-dashboard'); } });
  return <div className="min-h-[100dvh] bg-secondary/35"><header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10"><Logo /><LanguageToggle lang={lang} setLang={setLang} /></header><main className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:pt-20"><div className="animate-rise"><span className="font-mono-app text-xs font-bold text-primary">DEMO ACCESS / 2025</span><h1 className="mt-5 max-w-lg font-display text-5xl font-extrabold leading-[1.03] tracking-tight">Choose the side of the bridge you are crossing.</h1><p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">Use a seeded demo account to explore how patient consent and pharmacist precision meet.</p><div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground"><LockKeyhole size={15} className="text-primary" /> No real health information is used in this demo.</div></div><div className="panel animate-rise delay-2 rounded-[1.75rem] p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Sign in as</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><button data-testid="button-role-patient" onClick={() => setRole('patient')} className={`rounded-2xl border p-5 text-start transition ${role === 'patient' ? 'border-primary bg-primary/8 ring-2 ring-primary/15' : 'border-border hover:border-primary/50'}`}><UserRound className={role === 'patient' ? 'text-primary' : 'text-muted-foreground'} size={22} /><p className="mt-5 font-display font-bold">Patient</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your passport, grants, and access history.</p></button><button data-testid="button-role-pharmacist" onClick={() => setRole('pharmacist')} className={`rounded-2xl border p-5 text-start transition ${role === 'pharmacist' ? 'border-accent bg-accent/8 ring-2 ring-accent/15' : 'border-border hover:border-accent/50'}`}><Pill className={role === 'pharmacist' ? 'text-accent' : 'text-muted-foreground'} size={22} /><p className="mt-5 font-display font-bold">Pharmacist</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Lookups, substitutions, and FEFO inventory.</p></button></div><button data-testid="button-demo-login" onClick={submit} disabled={login.isPending} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">{login.isPending ? 'Opening workspace…' : `Continue as ${role === 'patient' ? 'patient' : 'pharmacist'}`}<ArrowRight size={16} className="rtl:rotate-180" /></button>{login.isError && <p data-testid="status-login-error" className="mt-4 flex items-center gap-2 text-sm text-destructive"><AlertTriangle size={15} /> We could not open the demo. Try again.</p>}<p className="mt-6 text-center text-xs text-muted-foreground">By continuing, you are entering an informational demo environment.</p></div></main></div>;
}

function Shell({ children, role }: { children: ReactNode; role: 'patient' | 'pharmacist' }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const session = useGetCurrentSession();
  const logout = useLogout();
  useEffect(() => { if (!session.isLoading && (!session.data || session.data.user.role !== role)) setLocation('/login'); }, [session.isLoading, session.data, role, setLocation]);
  const current = session.data?.user;
  if (session.isLoading || !current || current.role !== role) return <LoadingScreen />;
  const nav = role === 'patient'
    ? [
        { href: '/passport', label: lang === 'ar' ? 'جوازي الصحي' : 'My passport', icon: ShieldCheck },
        { href: '/patient-chat', label: lang === 'ar' ? 'إرشاد صحي' : 'Health guidance', icon: MessageCircle },
      ]
    : [{ href: '/pharmacy-dashboard', label: lang === 'ar' ? 'مساحة العمل' : 'Workspace', icon: Pill }];
  return <div className="min-h-[100dvh] bg-background"><aside className={`fixed inset-y-0 start-0 z-30 w-72 border-e border-border bg-card px-5 py-6 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}><div className="flex items-center justify-between"><Logo /><button data-testid="button-close-menu" onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted-foreground lg:hidden"><X size={18} /></button></div><div className="mt-12 rounded-2xl bg-secondary/55 p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{current.fullName.split(' ').map((x) => x[0]).join('').slice(0,2)}</span><div className="min-w-0"><p data-testid="text-sidebar-user" className="truncate text-sm font-bold">{current.fullName}</p><p className="truncate text-xs text-muted-foreground">{current.country}</p></div></div></div><nav className="mt-7 space-y-1">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={location === href ? 'page' : undefined} data-testid={`link-nav-${role}-${href.replace('/', '')}`} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${location === href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}><Icon size={18} />{label}<ChevronRight size={15} className="ms-auto rtl:rotate-180" /></Link>)}</nav><div className="absolute inset-x-5 bottom-6 space-y-2"><LanguageToggle lang={lang} setLang={setLang} /><button data-testid="button-logout" onClick={() => logout.mutate(undefined, { onSuccess: () => { queryClient.removeQueries({ queryKey: getGetCurrentSessionQueryKey() }); setLocation('/'); } })} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-destructive/8 hover:text-destructive"><LogOut size={17} /> Sign out</button></div></aside>{open && <button data-testid="button-menu-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-foreground/20 lg:hidden" />}<div className="lg:ps-72"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur lg:px-10"><button data-testid="button-open-menu" onClick={() => setOpen(true)} className="rounded-lg p-2 text-muted-foreground lg:hidden"><Menu size={20} /></button><div className="hidden text-xs font-bold uppercase tracking-[.18em] text-muted-foreground lg:block">{role === 'patient' ? 'Personal health passport' : 'Pharmacist operations'}</div><div className="ms-auto flex items-center gap-3"><LanguageToggle lang={lang} setLang={setLang} /><span className="hidden size-8 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent sm:grid">{current.fullName.slice(0,1)}</span></div></header>{children}</div></div>;
}

function LoadingScreen() { return <div className="grid min-h-[100dvh] place-items-center bg-background p-6"><div className="w-full max-w-sm space-y-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><div className="h-12 w-3/4 animate-pulse rounded-xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /></div></div>; }
function QueryError({ label, onRetry }: { label: string; onRetry: () => void }) { return <div data-testid="status-query-error" className="panel rounded-2xl p-8 text-center"><AlertTriangle className="mx-auto text-destructive" size={27} /><h3 className="mt-3 font-display text-lg font-bold">Could not load {label}</h3><p className="mt-1 text-sm text-muted-foreground">The service may be taking a moment.</p><button data-testid="button-retry" onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><RefreshCcw size={15} /> Try again</button></div>; }
function HeaderBlock({ eyebrow, title, body, action }: { eyebrow: string; title: string; body: string; action?: ReactNode }) { return <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="font-mono-app text-[11px] font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p><h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">{title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{body}</p></div>{action}</div>; }
function Stat({ label, value, icon: Icon, tone = 'primary' }: { label: string; value: string | number; icon: typeof ShieldCheck; tone?: 'primary' | 'accent' }) { return <div className="panel rounded-2xl p-5"><div className={`grid size-9 place-items-center rounded-xl ${tone === 'accent' ? 'bg-accent/12 text-accent' : 'bg-primary/10 text-primary'}`}><Icon size={18} /></div><p data-testid={`text-stat-${label.replace(/\s/g, '-').toLowerCase()}`} className="mt-5 font-display text-3xl font-extrabold">{value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p></div>; }
function formatDate(value?: string) { if (!value) return '—'; return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function formatTime(seconds = 0) { const h = Math.floor(seconds / 3600).toString().padStart(2, '0'); const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0'); const s = Math.floor(seconds % 60).toString().padStart(2, '0'); return `${h}:${m}:${s}`; }

function PassportPage() {
  const { lang } = useLanguage();
  const [, setLocation] = useLocation();
  const passport = useGetPassport();
  const summary = useGetPassportSummary();
  const meds = useListMedications();
  const records = useListPassportRecords();
  const grants = useListAccessGrants();
  const history = useListAccessHistory();
  const createGrant = useCreateAccessGrant();
  const revokeGrant = useRevokeAccessGrant();
  const createMed = useCreateMedication();
  const deleteMed = useDeleteMedication();
  const updateMed = useUpdateMedication();
  const createRecord = useCreatePassportRecord();
  const qc = useQueryClient();
  const [grantScope, setGrantScope] = useState<'active_medications_only' | 'full_passport'>('active_medications_only');
  const [showMedForm, setShowMedForm] = useState(false);
  const [medForm, setMedForm] = useState({ brandName: '', dosage: '', frequency: '', prescribingCountry: '', startDate: new Date().toISOString().slice(0, 10) });
  const [recordType, setRecordType] = useState<'prescription' | 'vaccination'>('vaccination');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordForm, setRecordForm] = useState({ name: '', country: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const activeGrant = summary.data?.activeGrant || passport.data?.activeGrant;
  const activeMeds = (meds.data || passport.data?.medications || []).filter((m) => m.isActive);
  const reload = () => { passport.refetch(); summary.refetch(); meds.refetch(); records.refetch(); grants.refetch(); history.refetch(); };
  if (passport.isLoading || summary.isLoading) return <LoadingScreen />;
  if (passport.isError || summary.isError) return <main className="mx-auto max-w-5xl px-5 py-16 lg:px-10"><QueryError label="your passport" onRetry={reload} /></main>;
  const profile = passport.data?.profile;
  return <main className="mx-auto max-w-7xl px-5 py-9 lg:px-10 lg:py-12"><HeaderBlock eyebrow="PATIENT PASSPORT / OVERVIEW" title={`Good to see you, ${passport.data?.patient.fullName.split(' ')[0]}.`} body="Your health context, held in one place and shared on your terms." action={<button data-testid="button-refresh-passport" onClick={reload} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary hover:text-primary"><RefreshCcw size={14} /> Refresh</button>} /><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Active medications" value={summary.data?.activeMedicationCount ?? activeMeds.length} icon={Pill} /><Stat label="Prescriptions" value={summary.data?.prescriptionCount ?? records.data?.prescriptions.length ?? 0} icon={FileText} /><Stat label="Vaccinations" value={summary.data?.vaccinationCount ?? records.data?.vaccinations.length ?? 0} icon={Syringe} tone="accent" /><Stat label="Access events" value={summary.data?.accessEventCount ?? history.data?.length ?? 0} icon={History} /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><section className="panel rounded-[1.5rem] p-6 sm:p-7"><div className="flex items-center justify-between"><div><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-primary">01 / CURRENT MEDICATIONS</p><h2 className="mt-2 font-display text-2xl font-extrabold">What you carry</h2></div><button data-testid="button-add-medication" onClick={() => setShowMedForm((v) => !v)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"><Plus size={15} /> Add</button></div>{showMedForm && <form data-testid="form-medication" onSubmit={(e) => { e.preventDefault(); createMed.mutate({ data: { ...medForm, isActive: true } }, { onSuccess: () => { setShowMedForm(false); setMedForm({ brandName: '', dosage: '', frequency: '', prescribingCountry: '', startDate: new Date().toISOString().slice(0, 10) }); qc.invalidateQueries({ queryKey: getListMedicationsQueryKey() }); qc.invalidateQueries({ queryKey: getGetPassportQueryKey() }); } }); }} className="mt-5 grid gap-3 rounded-2xl bg-secondary/55 p-4 sm:grid-cols-2"><Input label="Brand name" value={medForm.brandName} onChange={(v) => setMedForm({ ...medForm, brandName: v })} test="input-med-brand" required /><Input label="Dosage" value={medForm.dosage} onChange={(v) => setMedForm({ ...medForm, dosage: v })} test="input-med-dosage" required /><Input label="Frequency" value={medForm.frequency} onChange={(v) => setMedForm({ ...medForm, frequency: v })} test="input-med-frequency" required /><Input label="Prescribing country" value={medForm.prescribingCountry} onChange={(v) => setMedForm({ ...medForm, prescribingCountry: v })} test="input-med-country" required /><Input label="Start date" type="date" value={medForm.startDate} onChange={(v) => setMedForm({ ...medForm, startDate: v })} test="input-med-date" required /><button data-testid="button-save-medication" disabled={createMed.isPending} className="mt-5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background sm:col-span-2">{createMed.isPending ? 'Saving…' : 'Save medication'}</button></form>}{activeMeds.length === 0 ? <EmptyState icon={Pill} title="No active medications" body="Your current list will appear here when you add one." /> : <div className="mt-6 space-y-2">{activeMeds.map((med) => <div data-testid={`row-medication-${med.id}`} key={med.id} className="group flex items-center gap-4 rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-secondary/25"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Pill size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{med.brandName}</p><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">ACTIVE</span></div><p className="mt-1 text-xs text-muted-foreground">{med.dosage} · {med.frequency} · {med.innName || 'INN not specified'}</p><p className="mt-1 text-[11px] text-muted-foreground">Started {formatDate(med.startDate)} · {med.prescribingCountry}</p></div><button data-testid={`button-archive-medication-${med.id}`} title="Mark medication inactive" onClick={() => updateMed.mutate({ id: med.id, data: { brandName: med.brandName, dosage: med.dosage, frequency: med.frequency, prescribingCountry: med.prescribingCountry, startDate: med.startDate, endDate: med.endDate, isActive: false } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListMedicationsQueryKey() }) })} className="rounded-lg p-2 text-muted-foreground opacity-0 transition hover:bg-accent/10 hover:text-accent group-hover:opacity-100"><Check size={16} /></button><button data-testid={`button-delete-medication-${med.id}`} title="Delete medication" onClick={() => { if (window.confirm('Remove this medication from your passport?')) deleteMed.mutate({ id: med.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListMedicationsQueryKey() }) }); }} className="rounded-lg p-2 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"><Trash2 size={16} /></button></div>)}</div>}</section><section className="panel rounded-[1.5rem] p-6 sm:p-7"><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-primary">02 / PROFILE CONTEXT</p><h2 className="mt-2 font-display text-2xl font-extrabold">Useful in a handoff</h2><div className="mt-6 space-y-4">{[[CalendarDays, 'Date of birth', formatDate(profile?.dateOfBirth)], [Clipboard, 'Blood type', profile?.bloodType || 'Not recorded'], [AlertTriangle, 'Allergies', profile?.allergies || 'None recorded'], [Phone, 'Emergency contact', profile?.emergencyContactName ? `${profile.emergencyContactName} · ${profile.emergencyContactPhone}` : 'Not recorded']].map(([Icon, label, value]) => <div key={label as string} className="flex gap-3"><span className="mt-0.5 text-primary"><Icon size={16} /></span><div><p className="text-xs font-bold">{label as string}</p><p data-testid={`text-profile-${(label as string).replace(/\s/g, '-').toLowerCase()}`} className="mt-1 text-sm text-muted-foreground">{value as string}</p></div></div>)}</div></section></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><AccessGrantCard activeGrant={activeGrant} scope={grantScope} setScope={setGrantScope} createGrant={createGrant} revokeGrant={revokeGrant} reload={reload} /><section className="panel rounded-[1.5rem] p-6 sm:p-7"><div className="flex items-center justify-between"><div><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-primary">04 / RECORDS</p><h2 className="mt-2 font-display text-2xl font-extrabold">Passport records</h2></div><button data-testid="button-add-record" onClick={() => setShowRecordForm((v) => !v)} className="grid size-9 place-items-center rounded-xl border border-border text-primary transition hover:bg-primary/10"><Plus size={16} /></button></div>{showRecordForm && <form data-testid="form-record" onSubmit={(e) => { e.preventDefault(); const data = recordType === 'vaccination' ? { type: 'vaccination' as const, vaccineName: recordForm.name, country: recordForm.country, dateAdministered: recordForm.date, notes: recordForm.notes } : { type: 'prescription' as const, issuedBy: recordForm.name, issuedCountry: recordForm.country, issuedDate: recordForm.date, notes: recordForm.notes }; createRecord.mutate({ data }, { onSuccess: () => { setShowRecordForm(false); qc.invalidateQueries({ queryKey: getListPassportRecordsQueryKey() }); } }); }} className="mt-4 space-y-3 rounded-2xl bg-secondary/55 p-4"><select data-testid="select-record-type" value={recordType} onChange={(e) => setRecordType(e.target.value as 'prescription' | 'vaccination')} className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"><option value="vaccination">Vaccination</option><option value="prescription">Prescription</option></select><Input label={recordType === 'vaccination' ? 'Vaccine name' : 'Issued by'} value={recordForm.name} onChange={(v) => setRecordForm({ ...recordForm, name: v })} test="input-record-name" required /><Input label="Country" value={recordForm.country} onChange={(v) => setRecordForm({ ...recordForm, country: v })} test="input-record-country" required /><Input label="Date" type="date" value={recordForm.date} onChange={(v) => setRecordForm({ ...recordForm, date: v })} test="input-record-date" required /><Input label="Notes" value={recordForm.notes} onChange={(v) => setRecordForm({ ...recordForm, notes: v })} test="input-record-notes" /><button data-testid="button-save-record" className="w-full rounded-xl bg-foreground py-2.5 text-sm font-bold text-background">{createRecord.isPending ? 'Saving…' : 'Save record'}</button></form>}<div className="mt-5 space-y-4">{(records.data?.vaccinations || []).slice(0, 3).map((v) => <div data-testid={`row-vaccination-${v.id}`} key={`v-${v.id}`} className="flex gap-3 border-b border-border pb-4"><span className="grid size-9 place-items-center rounded-lg bg-accent/12 text-accent"><Syringe size={16} /></span><div><p className="text-sm font-bold">{v.vaccineName}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(v.dateAdministered)} · {v.country}</p></div></div>)}{(records.data?.prescriptions || []).slice(0, 3).map((p) => <div data-testid={`row-prescription-${p.id}`} key={`p-${p.id}`} className="flex gap-3 border-b border-border pb-4"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><FileText size={16} /></span><div><p className="text-sm font-bold">Prescription from {p.issuedBy}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(p.issuedDate)} · {p.issuedCountry}</p></div></div>)}{!records.data?.vaccinations?.length && !records.data?.prescriptions?.length && <EmptyState icon={FileText} title="No records yet" body="Add a vaccination or prescription when you are ready." />}</div></section></div><section className="panel mt-5 rounded-[1.5rem] p-6 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><History size={17} /></span><div><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-primary">05 / TRANSPARENCY</p><h2 className="mt-1 font-display text-2xl font-extrabold">Access history</h2></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-start text-sm"><thead><tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground"><th className="pb-3">Pharmacy</th><th className="pb-3">Viewed</th><th className="pb-3">When</th></tr></thead><tbody>{(history.data || []).map((h) => <tr data-testid={`row-access-${h.id}`} key={h.id} className="border-b border-border/70"><td className="py-3 font-bold">{h.pharmacyName}</td><td className="py-3 text-muted-foreground">{h.dataScopeViewed}</td><td className="py-3 text-muted-foreground">{formatDate(h.accessedAt)}</td></tr>)}</tbody></table>{!history.data?.length && <EmptyState icon={History} title="No pharmacy access yet" body="When a pharmacy views a grant, you will see the event here." />}</div></section><section className="mt-5"><p className="mb-3 font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">PAST GRANTS</p><div className="flex flex-wrap gap-2">{(grants.data || []).filter((g) => g.revoked || g.id !== activeGrant?.id).slice(0, 6).map((g) => <span data-testid={`badge-grant-${g.id}`} key={g.id} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">{g.accessCode} · {g.revoked ? 'Revoked' : 'Expired'}</span>)}</div></section></main>;
}

function AccessGrantCard({ activeGrant, scope, setScope, createGrant, revokeGrant, reload }: { activeGrant: any; scope: 'active_medications_only' | 'full_passport'; setScope: (s: 'active_medications_only' | 'full_passport') => void; createGrant: ReturnType<typeof useCreateAccessGrant>; revokeGrant: ReturnType<typeof useRevokeAccessGrant>; reload: () => void }) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const hasActive = activeGrant && !activeGrant.revoked && activeGrant.remainingSeconds > 0;
  return <section className="relative overflow-hidden rounded-[1.5rem] bg-foreground p-6 text-background shadow-lg sm:p-7"><div className="absolute -right-16 -top-20 size-60 rounded-full border-[30px] border-background/5" /><div className="relative"><div className="flex items-start justify-between"><div><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-accent">03 / TEMPORARY ACCESS</p><h2 className="mt-2 font-display text-2xl font-extrabold">A clear handoff</h2><p className="mt-2 max-w-md text-sm leading-6 text-background/65">Give a pharmacist exactly what they need. This access closes automatically.</p></div><span className="grid size-10 place-items-center rounded-xl bg-background/10 text-accent"><ScanLine size={19} /></span></div>{hasActive ? <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-background/55">Access code</p><p data-testid="text-active-access-code" className="mt-2 font-mono-app text-3xl font-bold tracking-[.18em] text-accent">{activeGrant.accessCode}</p><p className="mt-3 text-xs text-background/60">{activeGrant.scope === 'full_passport' ? 'Full passport' : 'Active medications only'} · expires {formatDate(activeGrant.expiresAt)}</p></div><div className="flex size-28 items-center justify-center rounded-2xl bg-background p-3 text-foreground"><QrVisual value={activeGrant.qrToken} /></div><div className="flex items-center justify-between border-t border-background/10 pt-4 sm:col-span-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-background/55">Remaining time</p><p data-testid="text-grant-countdown" className="mt-1 font-mono-app text-xl font-bold">{formatTime(activeGrant.remainingSeconds)}</p></div>{confirmRevoke ? <div className="flex items-center gap-2"><button data-testid="button-cancel-revoke" onClick={() => setConfirmRevoke(false)} className="rounded-lg border border-background/15 px-3 py-2 text-xs">Keep</button><button data-testid="button-confirm-revoke" onClick={() => revokeGrant.mutate({ id: activeGrant.id }, { onSuccess: reload })} className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground">Revoke now</button></div> : <button data-testid="button-revoke-grant" onClick={() => setConfirmRevoke(true)} className="rounded-lg border border-background/15 px-3 py-2 text-xs font-bold transition hover:bg-background/10">{revokeGrant.isPending ? 'Revoking…' : 'Revoke access'}</button>}</div></div> : <div className="mt-7 rounded-2xl bg-background/8 p-4"><p className="text-sm font-bold">No active access grant</p><p className="mt-1 text-xs text-background/60">Choose a scope to create a new, time-limited code.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><select data-testid="select-grant-scope" value={scope} onChange={(e) => setScope(e.target.value as 'active_medications_only' | 'full_passport')} className="h-11 flex-1 rounded-xl border border-background/15 bg-background/10 px-3 text-sm text-background"><option className="text-foreground" value="active_medications_only">Active medications only</option><option className="text-foreground" value="full_passport">Full passport</option></select><button data-testid="button-create-grant" onClick={() => createGrant.mutate({ data: { scope: scope === 'full_passport' ? AccessGrantInputScope.full_passport : AccessGrantInputScope.active_medications_only } }, { onSuccess: reload })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition hover:brightness-95">{createGrant.isPending ? 'Creating…' : 'Create access code'}<ArrowRight size={15} className="rtl:rotate-180" /></button></div></div>}</div></section>;
}

function PatientChatPage() {
  const { lang } = useLanguage();
  const onSend = async (message: string) => {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    return createPatientChatResponse(message, lang);
  };

  return <main className="mx-auto max-w-7xl px-5 py-9 lg:px-10 lg:py-12">
    <HeaderBlock
      eyebrow={lang === 'ar' ? 'مساعد المريض / PATIENT GUIDANCE' : 'PATIENT GUIDANCE / HEALTH EDUCATION'}
      title={lang === 'ar' ? 'اسأل عن مخاوفك الصحية' : 'Ask about a health concern'}
      body={lang === 'ar'
        ? 'إرشادات صحية عامة وآمنة مرتبطة بجوازك الصحي. لا تشارك اسمك أو أي بيانات تعريفية.'
        : 'General, cautious health education connected to your passport. Please do not share your name or personal identifiers.'}
    />
    <div className="mt-7">
      <PatientChatbot
        lang={lang}
        onSend={onSend}
      />
    </div>
  </main>;
}

function QrVisual({ value }: { value?: string }) { return <div data-testid="visual-qr" className="grid aspect-square w-full grid-cols-5 gap-0.5 bg-background p-1">{Array.from({ length: 25 }).map((_, i) => <span key={i} className={`${(value || '').charCodeAt(i % Math.max(1, (value || '').length)) % 3 !== 1 || [0,1,4,5,6,9,20,21,24].includes(i) ? 'bg-foreground' : 'bg-background'}`} />)}</div>; }
function Input({ label, value, onChange, type = 'text', test, required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; test: string; required?: boolean }) { return <label className="block text-xs font-bold text-muted-foreground">{label}<input data-testid={test} required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>; }
function EmptyState({ icon: Icon, title, body }: { icon: typeof Pill; title: string; body: string }) { return <div data-testid="state-empty" className="rounded-2xl border border-dashed border-border px-5 py-8 text-center"><Icon className="mx-auto text-muted-foreground/55" size={25} /><p className="mt-3 text-sm font-bold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{body}</p></div>; }

function PharmacyPage() {
  const summary = useGetPharmacySummary();
  const inventory = useListInventory();
  const lookup = useLookupPatient();
  const createInventory = useCreateInventoryItem();
  const updateInventory = useUpdateInventoryItem();
  const deleteInventory = useDeleteInventoryItem();
  const confirmSub = useConfirmSubstitution();
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [invForm, setInvForm] = useState({ drugBrandName: '', innName: '', batchNumber: '', quantity: '0', expiryDate: '', unitCost: '' });
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'rotate_now' | 'return_window'>('all');
  const reload = () => { summary.refetch(); inventory.refetch(); };
  const filtered = (inventory.data || []).filter((i) => (activeTab === 'all' || i.status === activeTab) && `${i.drugBrandName} ${i.innName} ${i.batchNumber}`.toLowerCase().includes(filter.toLowerCase()));
  if (summary.isLoading || inventory.isLoading) return <LoadingScreen />;
  if (summary.isError || inventory.isError) return <main className="mx-auto max-w-5xl px-5 py-16 lg:px-10"><QueryError label="your pharmacy workspace" onRetry={reload} /></main>;
  return <main className="mx-auto max-w-7xl px-5 py-9 lg:px-10 lg:py-12"><div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/8 px-4 py-3 text-xs leading-5 text-foreground"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-accent" /><span><b>Informational demo only.</b> PharmaLens supports pharmacist review; it never replaces clinical judgement or local dispensing rules.</span></div><HeaderBlock eyebrow="PHARMALENS / OPERATIONS" title={summary.data?.pharmacy.name || 'Pharmacy workspace'} body={`${summary.data?.pharmacy.city}, ${summary.data?.pharmacy.country} · Licence ${summary.data?.pharmacy.licenseNumber}`} action={<button data-testid="button-refresh-pharmacy" onClick={reload} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary hover:text-primary"><RefreshCcw size={14} /> Refresh</button>} /><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="SKUs tracked" value={summary.data?.totalSkus ?? 0} icon={PackageCheck} /><Stat label="Units on hand" value={summary.data?.totalUnits ?? 0} icon={Pill} /><Stat label="Expiring soon" value={summary.data?.expiringSoonCount ?? 0} icon={Clock3} tone="accent" /><Stat label="Rotate now" value={summary.data?.rotateNowCount ?? 0} icon={RotateCcw} tone="accent" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><section className="panel rounded-[1.5rem] p-6 sm:p-7"><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-primary">01 / PATIENT LOOKUP</p><h2 className="mt-2 font-display text-2xl font-extrabold">Start with a code</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Enter the code shared by the patient. It expires automatically.</p><form data-testid="form-patient-lookup" onSubmit={(e) => { e.preventDefault(); lookup.mutate({ data: { accessCode: code } }, { onSuccess: setLookupResult }); }} className="mt-6 flex gap-2"><input data-testid="input-patient-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} minLength={6} placeholder="e.g. MP-84K2Q" className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 font-mono-app text-sm uppercase outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /><button data-testid="button-lookup-patient" disabled={lookup.isPending} className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90"><Search size={18} /></button></form>{lookup.isError && <p data-testid="status-lookup-error" className="mt-3 text-xs font-semibold text-destructive">We could not find an active grant for that code.</p>}{lookupResult && <PatientLookupCard result={lookupResult} onConfirm={(id) => confirmSub.mutate({ id, data: { confirmed: true } })} />}</section><section className="panel rounded-[1.5rem] p-6 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-primary">02 / INVENTORY CONTROL</p><h2 className="mt-2 font-display text-2xl font-extrabold">Expiry-aware inventory</h2></div><button data-testid="button-add-inventory" onClick={() => setShowAdd((v) => !v)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground"><Plus size={15} /> Add stock</button></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={15} className="absolute start-3 top-3 text-muted-foreground" /><input data-testid="input-inventory-search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search brand, INN, batch" className="h-10 w-full rounded-xl border border-input bg-background ps-9 pe-3 text-sm outline-none focus:border-primary" /></div><div className="flex gap-1 rounded-xl bg-secondary/70 p-1"><TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} test="button-filter-all">All</TabButton><TabButton active={activeTab === 'return_window'} onClick={() => setActiveTab('return_window')} test="button-filter-return">Watch</TabButton><TabButton active={activeTab === 'rotate_now'} onClick={() => setActiveTab('rotate_now')} test="button-filter-rotate">Rotate</TabButton></div></div>{showAdd && <form data-testid="form-inventory" onSubmit={(e) => { e.preventDefault(); createInventory.mutate({ data: { ...invForm, quantity: Number(invForm.quantity), unitCost: invForm.unitCost ? Number(invForm.unitCost) : null } }, { onSuccess: () => { setShowAdd(false); qc.invalidateQueries({ queryKey: getListInventoryQueryKey() }); qc.invalidateQueries({ queryKey: getGetPharmacySummaryQueryKey() }); } }); }} className="mt-4 grid gap-3 rounded-2xl bg-secondary/55 p-4 sm:grid-cols-2"><Input label="Brand" value={invForm.drugBrandName} onChange={(v) => setInvForm({ ...invForm, drugBrandName: v })} test="input-stock-brand" required /><Input label="INN" value={invForm.innName} onChange={(v) => setInvForm({ ...invForm, innName: v })} test="input-stock-inn" required /><Input label="Batch number" value={invForm.batchNumber} onChange={(v) => setInvForm({ ...invForm, batchNumber: v })} test="input-stock-batch" required /><Input label="Quantity" type="number" value={invForm.quantity} onChange={(v) => setInvForm({ ...invForm, quantity: v })} test="input-stock-quantity" required /><Input label="Expiry date" type="date" value={invForm.expiryDate} onChange={(v) => setInvForm({ ...invForm, expiryDate: v })} test="input-stock-expiry" required /><Input label="Unit cost (optional)" type="number" value={invForm.unitCost} onChange={(v) => setInvForm({ ...invForm, unitCost: v })} test="input-stock-cost" /><button data-testid="button-save-inventory" className="rounded-xl bg-foreground py-2.5 text-sm font-bold text-background sm:col-span-2">{createInventory.isPending ? 'Saving…' : 'Save stock item'}</button></form>}<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground"><th className="pb-3">Product</th><th className="pb-3">Batch</th><th className="pb-3">Qty</th><th className="pb-3">Expiry</th><th className="pb-3">Status</th><th className="pb-3"></th></tr></thead><tbody>{filtered.map((item) => <InventoryRow key={item.id} item={item} onDelete={() => { if (window.confirm('Remove this stock item?')) deleteInventory.mutate({ id: item.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListInventoryQueryKey() }) }); }} onRotate={() => updateInventory.mutate({ id: item.id, data: { drugBrandName: item.drugBrandName, innName: item.innName, batchNumber: item.batchNumber, quantity: item.quantity, expiryDate: item.expiryDate, unitCost: item.unitCost } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListInventoryQueryKey() }) })} />)}</tbody></table>{!filtered.length && <EmptyState icon={PackageCheck} title="No stock matches" body="Try another search or add a stock item." />}</div></section></div><section className="panel mt-5 rounded-[1.5rem] p-6 sm:p-7"><div className="flex items-center justify-between"><div><p className="font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-primary">03 / RECENT ACTIVITY</p><h2 className="mt-2 font-display text-2xl font-extrabold">Lookup trail</h2></div><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground">{summary.data?.recentLookups.length || 0} events</span></div><div className="mt-5 grid gap-2 md:grid-cols-2">{(summary.data?.recentLookups || []).map((l) => <div data-testid={`row-lookup-${l.id}`} key={l.id} className="flex items-center gap-3 rounded-xl border border-border p-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><ScanLine size={16} /></span><div className="flex-1"><p className="text-sm font-bold">{l.pharmacyName}</p><p className="mt-1 text-xs text-muted-foreground">{l.dataScopeViewed} · {formatDate(l.accessedAt)}</p></div><Check size={15} className="text-primary" /></div>)}{!summary.data?.recentLookups.length && <EmptyState icon={History} title="No lookups yet" body="Patient access events will appear here." />}</div></section></main>;
}

function TabButton({ active, onClick, children, test }: { active: boolean; onClick: () => void; children: ReactNode; test: string }) { return <button data-testid={test} onClick={onClick} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${active ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{children}</button>; }
function PatientLookupCard({ result, onConfirm }: { result: any; onConfirm: (id: number) => void }) { return <div data-testid="card-patient-lookup-result" className="mt-6 rounded-2xl border border-primary/20 bg-primary/6 p-4"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">Access verified</p><p className="mt-2 font-display text-xl font-extrabold">{result.patientName}</p></div><span className="font-mono-app text-xs text-primary">{formatTime(result.remainingSeconds)}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Allergies</p><p className="mt-1 text-sm font-semibold">{result.allergies || 'None recorded'}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Medications</p><p className="mt-1 text-sm font-semibold">{result.medications?.length || 0} active</p></div></div><div className="mt-4 space-y-2">{(result.medications || []).map((m: any) => <div key={m.id} className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-xs"><span className="font-bold">{m.brandName}</span><span className="text-muted-foreground">{m.dosage} · {m.frequency}</span></div>)}</div>{result.suggestions?.length > 0 && <div className="mt-4 border-t border-primary/15 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-accent">Inventory suggestions</p>{result.suggestions.map((s: any) => <div key={s.id} className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold">{s.drugBrandName}</span><button data-testid={`button-confirm-substitution-${s.id}`} onClick={() => onConfirm(s.id)} className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-1 font-bold text-accent">Confirm match <Check size={12} /></button></div>)}</div>}</div>; }
function InventoryRow({ item, onDelete, onRotate }: { item: any; onDelete: () => void; onRotate: () => void }) { const urgent = item.status === 'rotate_now'; return <tr data-testid={`row-inventory-${item.id}`} className="group border-b border-border/70"><td className="py-3"><p className="font-bold">{item.drugBrandName}</p><p className="mt-1 text-xs text-muted-foreground">{item.innName}</p></td><td className="py-3 font-mono-app text-xs text-muted-foreground">{item.batchNumber}</td><td className="py-3 font-semibold">{item.quantity}</td><td className="py-3"><p className="text-xs">{formatDate(item.expiryDate)}</p><p className={`mt-1 text-[11px] font-bold ${urgent ? 'text-destructive' : 'text-muted-foreground'}`}>{item.daysToExpiry} days</p></td><td className="py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${urgent ? 'bg-destructive/10 text-destructive' : item.status === 'return_window' ? 'bg-accent/12 text-accent' : 'bg-primary/10 text-primary'}`}>{urgent ? 'ROTATE NOW' : item.status === 'return_window' ? 'WATCH' : 'FINE'}</span></td><td className="py-3 text-end"><div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100"><button data-testid={`button-rotate-inventory-${item.id}`} title="Mark reviewed" onClick={onRotate} className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"><Check size={15} /></button><button data-testid={`button-delete-inventory-${item.id}`} title="Delete stock item" onClick={onDelete} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></button></div></td></tr>; }

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={Landing} /><Route path="/login" component={Login} /><Route path="/passport"><Shell role="patient"><PassportPage /></Shell></Route><Route path="/patient-chat"><Shell role="patient"><PatientChatPage /></Shell></Route><Route path="/pharmacy-dashboard"><Shell role="pharmacist"><PharmacyPage /></Shell></Route><Route component={NotFound} /></Switch></ErrorBoundary>;
}
function App() { return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></QueryClientProvider>; }
export default App;