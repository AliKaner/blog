import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AdminSessionProvider } from "@/components/providers/AdminSessionProvider";
import { KonamiListener } from "@/components/admin/KonamiListener";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { GrainOverlay } from "@/components/texture/GrainOverlay";
import { SiteNav } from "@/components/nav/SiteNav";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
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
      className={`${fraunces.variable} ${sourceSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>
          <AdminSessionProvider>
            <SiteNav />
            <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
              {children}
            </main>
            <KonamiListener />
            <AdminLoginModal />
          </AdminSessionProvider>
        </ConvexClientProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}
