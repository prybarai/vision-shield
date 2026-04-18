import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
 title: "Naili — The intelligence layer for home transformation",
 description:
 "Upload a photo of your space. Get a vision, a scope, and a realistic next move — whether that means DIY or bringing in the right pro.",
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
