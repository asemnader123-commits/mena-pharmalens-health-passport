import React from 'react';
const base = import.meta.env.BASE_URL;
export default function TravelPassport() {
  return <div className="relative w-screen h-screen overflow-hidden bg-primary text-bg">
    <div className="relative flex h-full items-center gap-[5vw] px-[7vw] py-[8vh]">
      <div className="w-[42vw]">
        <div className="text-[1.5vw] font-bold uppercase tracking-[0.18em] text-[var(--slide-coral)]">02 / JOURNEY</div>
        <h1 className="mt-[2vh] font-display text-[3.8vw] font-extrabold leading-[1.02] tracking-[-0.06em]">A passport that travels with you <span className="text-[var(--slide-coral)]">|</span> جواز يسافر معك</h1>
        <div className="mt-[3vh] inline-flex items-center rounded-full bg-white/10 px-[1.2vw] py-[0.8vh] text-[1.5vw] font-bold">Example journey | مثال رحلة</div>
        <div className="mt-[4vh] space-y-[2.6vh]">
          <div className="border-l-[0.25vw] border-[var(--slide-coral)] pl-[1.4vw]"><div className="text-[1.8vw] font-bold">Amman → Dubai → Riyadh <span className="text-[1.5vw] font-normal text-bg/70">— عمّان ← دبي ← الرياض</span></div></div>
          <div className="border-l-[0.25vw] border-accent pl-[1.4vw]"><div className="text-[1.65vw] leading-[1.25]">The patient shares a short-lived access code at the pharmacy</div><div dir="rtl" className="mt-[0.7vh] text-[1.5vw] leading-[1.25] text-bg/70">يشارك المريض رمز وصول مؤقتًا في الصيدلية</div></div>
          <div className="border-l-[0.25vw] border-accent pl-[1.4vw]"><div className="text-[1.65vw] leading-[1.25]">Brand names map to INN names so medication remains understandable</div><div dir="rtl" className="mt-[0.7vh] text-[1.5vw] leading-[1.25] text-bg/70">تُربط الأسماء التجارية بأسماء INN لتبقى الأدوية مفهومة</div></div>
          <div className="border-l-[0.25vw] border-[var(--slide-coral)] pl-[1.4vw]"><div className="text-[1.65vw] leading-[1.25]">Access expires automatically and every view is logged</div><div dir="rtl" className="mt-[0.7vh] text-[1.5vw] leading-[1.25] text-bg/70">ينتهي الوصول تلقائيًا ويتم تسجيل كل عملية مشاهدة</div></div>
        </div>
      </div>
      <div className="relative h-[70vh] w-[41vw] overflow-hidden rounded-[2vw] border border-white/20 bg-white/10">
        <img src={base + 'mena-travel-map.png'} crossOrigin="anonymous" alt="MENA travel route map" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/65 via-transparent to-primary/15" />
      </div>
    </div>
  </div>;
}