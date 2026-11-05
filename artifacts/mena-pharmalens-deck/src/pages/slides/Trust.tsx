import React from 'react';
export default function Trust() {
  return <div className="relative w-screen h-screen overflow-hidden bg-bg text-text">
    <div className="absolute right-0 top-0 h-full w-[25vw] bg-[var(--slide-card)]" />
    <div className="relative flex h-full flex-col px-[8vw] py-[8vh]">
      <div className="text-[1.5vw] font-bold uppercase tracking-[0.18em] text-accent">04 / SAFETY MODEL</div>
      <h1 className="mt-[2vh] font-display text-[4vw] font-extrabold tracking-[-0.06em] text-primary">Trust is a product feature <span className="text-accent">|</span> الثقة جزء من المنتج</h1>
      <div className="mt-[5vh] grid grid-cols-[1.2fr_0.8fr] gap-[7vw]">
        <div className="space-y-[2.7vh]">
          <div className="flex gap-[1.4vw]"><span className="font-display text-[2.4vw] font-extrabold text-accent">01</span><div><div className="text-[1.8vw] font-bold leading-[1.15]">Time-limited access with a 6-digit fallback code and QR token</div><div dir="rtl" className="mt-[0.7vh] text-[1.5vw] text-muted">وصول محدد بوقت مع رمز من 6 أرقام ورمز QR</div></div></div>
          <div className="flex gap-[1.4vw]"><span className="font-display text-[2.4vw] font-extrabold text-accent">02</span><div><div className="text-[1.8vw] font-bold leading-[1.15]">Scope control: active medications only or full passport</div><div dir="rtl" className="mt-[0.7vh] text-[1.5vw] text-muted">تحديد النطاق: الأدوية الحالية فقط أو الجواز الكامل</div></div></div>
          <div className="flex gap-[1.4vw]"><span className="font-display text-[2.4vw] font-extrabold text-accent">03</span><div><div className="text-[1.8vw] font-bold leading-[1.15]">Patient-visible access history</div><div dir="rtl" className="mt-[0.7vh] text-[1.5vw] text-muted">سجل وصول ظاهر للمريض</div></div></div>
          <div className="flex gap-[1.4vw]"><span className="font-display text-[2.4vw] font-extrabold text-accent">04</span><div><div className="text-[1.8vw] font-bold leading-[1.15]">No diagnosis, prescribing, or automatic substitution</div><div dir="rtl" className="mt-[0.7vh] text-[1.5vw] text-muted">لا تشخيص ولا وصف ولا استبدال تلقائي</div></div></div>
          <div className="flex gap-[1.4vw]"><span className="font-display text-[2.4vw] font-extrabold text-accent">05</span><div><div className="text-[1.8vw] font-bold leading-[1.15]">Licensed pharmacist confirmation is required</div><div dir="rtl" className="mt-[0.7vh] text-[1.5vw] text-muted">تأكيد الصيدلي المرخص إلزامي</div></div></div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute h-[22vw] w-[22vw] rounded-full border-[0.7vw] border-accent/20" />
          <div className="absolute h-[16vw] w-[16vw] rounded-full border-[0.7vw] border-[var(--slide-coral)]/30" />
          <div className="relative flex h-[10vw] w-[10vw] items-center justify-center rounded-full bg-primary font-display text-[5vw] font-extrabold text-bg">✓</div>
        </div>
      </div>
    </div>
  </div>;
}