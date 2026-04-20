"use client";

import SimpleUploadFlow from "@/components/SimpleUploadFlow";

export default function UploadStage() {
 return (
 <section id="upload" className="section relative py-12 md:py-20">
 <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-[80%] -translate-x-1/2 bg-radial-warm pointer-events-none -z-10" />
 <SimpleUploadFlow />
 </section>
 );
}
