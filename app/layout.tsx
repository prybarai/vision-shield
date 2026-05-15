import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
 title: "Naili — AI-powered home planning",
 description:
  "Upload a photo of your space. Get AI-powered cost estimates, material lists, design concepts, and contractor briefs — then decide between DIY or hiring a pro.",
};

export const viewport: Viewport = {
 themeColor: "#F6F3EE",
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
  <html lang="en">
   <body className="relative min-h-screen overflow-x-hidden">
    {children}
   </body>
  </html>
 );
}
