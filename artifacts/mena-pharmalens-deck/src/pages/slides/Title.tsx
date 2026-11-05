import React from 'react';
const base = import.meta.env.BASE_URL;
export default function Title() {
  return <div className="relative w-screen h-screen overflow-hidden bg-bg text-text">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(230,128,104,0.18),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(37,139,130,0.16),transparent_35%)]" />
    <div className="relative flex h-full w-full items-center gap-[5vw] px-[7vw] py-[7vh]">
      <div className="flex h-full w-[48vw] flex-col justify-between py-[2vh]">
        <div className="flex items-center gap-[1vw] text-[1.5vw] font-bold tracking-[0.18em] text-primary">
          <span className="flex h-[3.2vw] w-[3.2vw] items-center justify-center rounded-full bg-accent text-[1.7vw] text-bg">+</span>
          <span>MENA PASSPORT + PHARMALENS</span>
        </div>
        <div className="max-w-[45vw]">
          <h1 className="font-display text-[5.4vw] font-extrabold leading-[0.98] tracking-[-0.07em] text-primary">Your health, ready for the next border.</h1>
          <p className="mt-[3vh] max-w-[39vw] text-[1.85vw] leading-[1.35] text-muted">صحتك جاهزة للحدود القادمة.</p>
          <p className="mt-[1.5vh] max-w-[40vw] text-[1.65vw] leading-[1.4] text-muted">A portable patient passport connected to a pharmacist workspace for safer cross-border medication access.</p>
          <p dir="rtl" className="mt-[1vh] max-w-[40vw] text-[1.65vw] leading-[1.4] text-muted">جواز صحي محمول متصل بواجهة للصيدلي لتسهيل الوصول الآمن إلى معلومات الأدوية عبر الحدود.</p>
        </div>
        <div className="flex items-end justify-between gap-[2vw] text-[1.5vw] font-medium text-muted">
          <span className="whitespace-nowrap">Public app link | الرابط العام:</span>
          <span className="whitespace-nowrap rounded-full border border-primary/15 bg-white/55 px-[1.2vw] py-[0.8vh] text-primary">added after publishing | يُضاف بعد النشر</span>
        </div>
      </div>
      <div className="relative h-[72vh] w-[39vw] overflow-hidden rounded-[2.2vw] border-[0.5vw] border-primary bg-primary shadow-[1.5vw_1.5vw_0_rgba(31,53,68,0.12)]">
        <img src={base + 'hero-passport.png'} crossOrigin="anonymous" alt="Passport and medication organizer" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/15 to-transparent" />
      </div>
    </div>
  </div>;
}