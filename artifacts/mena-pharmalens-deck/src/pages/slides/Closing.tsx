import React from 'react';
export default function Closing() {
  return <div className="relative w-screen h-screen overflow-hidden bg-primary text-bg">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,139,130,0.45),transparent_30%),radial-gradient(circle_at_15%_85%,rgba(230,128,104,0.3),transparent_26%)]" />
    <div className="relative flex h-full flex-col justify-between px-[8vw] py-[8vh]">
      <div className="flex items-center gap-[1vw] text-[1.5vw] font-bold tracking-[0.18em] text-bg/70"><span className="flex h-[3.2vw] w-[3.2vw] items-center justify-center rounded-full bg-accent text-[1.7vw] text-bg">+</span><span>MENA PASSPORT + PHARMALENS</span></div>
      <div className="max-w-[72vw]">
        <div className="text-[1.5vw] font-bold uppercase tracking-[0.18em] text-[var(--slide-coral)]">05 / MVP READY</div>
        <h1 className="mt-[2vh] font-display text-[4.5vw] font-extrabold leading-[1] tracking-[-0.07em]">Built for the first real journey <span className="text-[var(--slide-coral)]">|</span> جاهز لأول رحلة حقيقية</h1>
        <div className="mt-[4vh] grid grid-cols-2 gap-x-[5vw] gap-y-[2.2vh] text-[1.55vw]">
          <div className="flex gap-[1vw]"><span className="text-[var(--slide-coral)]">—</span><span>Working MVP with seeded patient and pharmacy demos <span className="text-bg/65">— نسخة MVP عاملة مع بيانات تجريبية</span></span></div>
          <div className="flex gap-[1vw]"><span className="text-[var(--slide-coral)]">—</span><span>Patient → access code → pharmacist lookup → audited view <span className="text-bg/65">— المريض ← رمز الوصول ← بحث الصيدلي ← مشاهدة مسجلة</span></span></div>
          <div className="flex gap-[1vw]"><span className="text-[var(--slide-coral)]">—</span><span>FEFO inventory states: fine, return window, rotate now <span className="text-bg/65">— حالات المخزون: سليم، نافذة الإرجاع، التدوير الآن</span></span></div>
          <div className="flex gap-[1vw]"><span className="text-[var(--slide-coral)]">—</span><span>Next step: publish the app and share the public link <span className="text-bg/65">— الخطوة التالية: نشر التطبيق ومشاركة الرابط العام</span></span></div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-[3vw]">
        <div><div className="font-display text-[2.2vw] font-extrabold">MENA Passport + PharmaLens</div><div className="mt-[0.8vh] text-[1.7vw] text-bg/75">A clearer way across borders.</div><div dir="rtl" className="mt-[0.6vh] text-[1.7vw] text-bg/75">طريقة أوضح لعبور الحدود.</div></div>
        <div className="rounded-[1.3vw] border border-white/20 bg-white/10 px-[2vw] py-[1.4vh] text-right"><div className="text-[1.5vw] font-bold uppercase tracking-[0.16em] text-bg/60">PUBLIC APP LINK | الرابط العام</div><div className="mt-[0.5vh] text-[1.5vw] font-bold text-bg">added after publishing | يُضاف بعد النشر</div></div>
      </div>
    </div>
  </div>;
}