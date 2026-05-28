// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // O caminho para o teu CSS global

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HelloCamp | Os Melhores Campos de Férias",
  description: "Descubra e reserve os melhores campos de férias em Portugal e no estrangeiro para as suas crianças. Desporto, Aventura, Tecnologia, Artes e Línguas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}