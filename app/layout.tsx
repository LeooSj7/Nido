import type { Metadata } from "next";
import { IBM_Plex_Serif, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Nido — Organización del hogar",
  description: "Tareas, dinero, compras y agenda para toda tu familia en un solo lugar.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${plexSerif.variable} ${plexMono.variable} ${plexSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster
          theme="light"
          position="top-center"
          toastOptions={{
            style: {
              background: '#FFFDF7',
              border: '1.5px solid #2D2418',
              color: '#2D2418',
              fontFamily: 'var(--font-plex-mono)',
              fontSize: 12,
              letterSpacing: '0.02em',
              borderRadius: 2,
              boxShadow: '3px 4px 0 rgba(31,28,20,0.18)',
            },
          }}
        />
      </body>
    </html>
  );
}
