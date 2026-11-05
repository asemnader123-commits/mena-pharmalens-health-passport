import React from 'react';
export default function TwoPortals() {
  return <div className="relative w-screen h-screen overflow-hidden bg-bg text-text">
    <div className="relative flex h-full flex-col px-[8vw] py-[8vh]">
      <div className="text-[1.25vw] font-bold uppercase tracking-[0.18em] text-accent">03 / PRODUCT LOOP</div>
      <h1 className="mt-[2vh] font-display text-[3.8vw] font-extrabold tracking-[-0.06em] text-primary">Two portals. One safer loop. <span className="text-accent">|</span> بوابتان، حلقة أكثر أمانًا</h1>
      <div className="mt-[5vh] grid flex-1 grid-cols-2 gap-[2vw]">
        <div className="relative overflow-hidden rounded-[2vw] bg-accent p-[3vw] text-bg">
          <div className="absolute -right-[4vw] -top-[7vh] h-[18vw] w-[18vw] rounded-full border-[1vw] border-white/15" />
          <div className="text-[1.5vw] font-bold uppercase tracking-[0.18em] text-bg/65">PATIENT PORTAL</div>
          <div dir="rtl" className="mt-[1vh] text-[1.7vw] font-bold text-bg/80">بوابة المريض</div>
          <div className="mt-[6vh] space-y-[3vh]">
            <div><div className="text-[1.9vw] font-bold leading-[1.15]">Active medications, allergies, prescriptions, vaccinations</div><div dir="rtl" className="mt-[1vh] text-[1.55vw] text-bg/75">الأدوية الحالية والحساسيات والوصفات واللقاحات</div></div>
            <div><div className="text-[1.9vw] font-bold leading-[1.15]">Generate, share, and revoke a temporary access grant</div><div dir="rtl" className="mt-[1vh] text-[1.55vw] text-bg/75">إنشاء رمز وصول مؤقت ومشاركته وإلغاؤه</div></div>
          </div>
          <div className="absolute bottom-[3vw] left-[3vw] text-[4vw] font-display font-extrabold text-bg/15">01</div>
        </div>
        <div className="relative overflow-hidden rounded-[2vw] bg-primary p-[3vw] text-bg">
          <div className="absolute -bottom-[8vh] -right-[5vw] h-[22vw] w-[22vw] rounded-full border-[1vw] border-white/10" />
          <div className="text-[1.5vw] font-bold uppercase tracking-[0.18em] text-bg/65">PHARMACIST PORTAL</div>
          <div dir="rtl" className="mt-[1vh] text-[1.7vw] font-bold text-bg/80">بوابة الصيدلي</div>
          <div className="mt-[5vh] space-y-[2.5vh]">
            <div><div className="text-[1.75vw] font-bold leading-[1.15]">Look up minimum-necessary patient information</div><div dir="rtl" className="mt-[0.8vh] text-[1.45vw] text-bg/70">عرض الحد الأدنى الضروري من المعلومات</div></div>
            <div><div className="text-[1.75vw] font-bold leading-[1.15]">Manage inventory with FEFO expiry visibility</div><div dir="rtl" className="mt-[0.8vh] text-[1.45vw] text-bg/70">إدارة المخزون حسب أقرب صلاحية</div></div>
            <div><div className="text-[1.75vw] font-bold leading-[1.15]">Review matched stock manually</div><div dir="rtl" className="mt-[0.8vh] text-[1.45vw] text-bg/70">مراجعة المطابقة يدويًا</div></div>
          </div>
          <div className="absolute bottom-[3vw] left-[3vw] text-[4vw] font-display font-extrabold text-bg/15">02</div>
        </div>
      </div>
    </div>
  </div>;
}