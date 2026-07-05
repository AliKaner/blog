import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Lumanosimo,
  Manufacturing_Consent,
  Nova_Cut,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AdminSessionProvider } from "@/components/providers/AdminSessionProvider";
import { KonamiListener } from "@/components/admin/KonamiListener";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { GrainOverlay } from "@/components/texture/GrainOverlay";
import { SiteNav } from "@/components/nav/SiteNav";
import { PetStrip } from "@/components/pets/PetStrip";

const novaCut = Nova_Cut({
  variable: "--font-nova-cut",
  subsets: ["latin"],
  weight: "400",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const manufacturingConsent = Manufacturing_Consent({
  variable: "--font-manufacturing-consent",
  subsets: ["latin"],
  weight: "400",
});

const lumanosimo = Lumanosimo({
  variable: "--font-lumanosimo",
  subsets: ["latin"],
  weight: "400",
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
      className={`${novaCut.variable} ${sourceSerif.variable} ${plexMono.variable} ${manufacturingConsent.variable} ${lumanosimo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>
          <AdminSessionProvider>
            <SiteNav />
            <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 pb-24">
              {children}
            </main>
            <KonamiListener />
            <AdminLoginModal />
            <PetStrip />
          </AdminSessionProvider>
        </ConvexClientProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}
