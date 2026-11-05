import React from 'react';
export default function TravelProblem() {
  return <div className="relative w-screen h-screen overflow-hidden bg-bg text-text">
    <div className="absolute left-0 top-0 h-[100vh] w-[17vw] bg-primary" />
    <div className="relative flex h-full flex-col justify-between px-[8vw] py-[8vh]">
      <div className="max-w-[78vw]">
        <div className="text-[1.25vw] font-bold uppercase tracking-[0.18em] text-accent">01 / CONTEXT</div>
        <h1 className="mt-[2vh] font-display text-[4vw] font-extrabold tracking-[-0.06em] text-primary">The travel problem <span className="text-accent">|</span> مشكلة السفر</h1>
      </div>
      <div className="grid grid-cols-2 gap-x-[5vw] gap-y-[3.5vh] pl-[3vw]">
        <div className="flex gap-[1.2vw]"><span className="mt-[0.7vh] h-[1.1vw] w-[1.1vw] shrink-0 rounded-full bg-[var(--slide-coral)]" /><div><div className="text-[1.65vw] font-bold leading-[1.2] text-primary">Brand names change from country to country</div><div dir="rtl" className="mt-[0.8vh] text-[1.45vw] leading-[1.25] text-muted">تختلف الأسماء التجارية بين الدول</div></div></div>
        <div className="flex gap-[1.2vw]"><span className="mt-[0.7vh] h-[1.1vw] w-[1.1vw] shrink-0 rounded-full bg-accent" /><div><div className="text-[1.65vw] font-bold leading-[1.2] text-primary">Medication records are often scattered or carried on paper</div><div dir="rtl" className="mt-[0.8vh] text-[1.45vw] leading-[1.25] text-muted">السجلات الدوائية غالبًا متفرقة أو ورقية</div></div></div>
        <div className="flex gap-[1.2vw]"><span className="mt-[0.7vh] h-[1.1vw] w-[1.1vw] shrink-0 rounded-full bg-accent" /><div><div className="text-[1.65vw] font-bold leading-[1.2] text-primary">Pharmacists need the right information, not an entire medical file</div><div dir="rtl" className="mt-[0.8vh] text-[1.45vw] leading-[1.25] text-muted">الصيدلي يحتاج المعلومات الضرورية فقط</div></div></div>
        <div className="flex gap-[1.2vw]"><span className="mt-[0.7vh] h-[1.1vw] w-[1.1vw] shrink-0 rounded-full bg-[var(--slide-coral)]" /><div><div className="text-[1.65vw] font-bold leading-[1.2] text-primary">Pharmacies also need visibility into expiry and stock rotation</div><div dir="rtl" className="mt-[0.8vh] text-[1.45vw] leading-[1.25] text-muted">والصيدلية تحتاج وضوحًا حول الصلاحية ودوران المخزون</div></div></div>
      </div>
    </div>
  </div>;
}