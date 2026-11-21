import type { Metadata } from "next";
import {
  Cinzel,
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AdminSessionProvider } from "@/components/providers/AdminSessionProvider";
import { KonamiListener } from "@/components/admin/KonamiListener";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { GrainOverlay } from "@/components/texture/GrainOverlay";
import { CornerDecor } from "@/components/texture/CornerDecor";
import { SiteNav } from "@/components/nav/SiteNav";
import { FaviconCycler } from "@/components/FaviconCycler";

// Type to match the Piranesi plates in the decor:
// headings in Roman inscription capitals (like the plate titles),
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

// subtitles/accents in a Garamond italic (like the plate dedications),
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
});

// and body text in a sturdy screen serif for comfortable reading.

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "alikaner",
  description: "Movies watched, places visited, books read, and the rest of the journey.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${sourceSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pr-20 md:pl-20 md:pr-0">
        <ConvexClientProvider>
          <AdminSessionProvider>
            <SiteNav />
            <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-10 pb-24">
              {children}
            </main>
            <KonamiListener />
            <AdminLoginModal />
          </AdminSessionProvider>
        </ConvexClientProvider>
        <CornerDecor />
        <GrainOverlay />
        <FaviconCycler />
      </body>
    </html>
  );
}
