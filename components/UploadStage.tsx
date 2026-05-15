"use client";

import BulletproofUploadFlow from "@/components/BulletproofUploadFlow";

export default function UploadStage() {
 return (
  <section id="upload" className="section relative py-12 md:py-20">
   <div className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-80 w-[80%] -translate-x-1/2 bg-radial-warm" />
   <BulletproofUploadFlow />
  </section>
 );
}
