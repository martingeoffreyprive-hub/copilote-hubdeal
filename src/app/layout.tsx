import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { BottomBar } from "@/components/navigation/bottom-bar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hubdeal - Copilote Devis",
  description: "Application de devis pour artisans belges avec copilote AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${jakarta.variable} ${geistMono.variable} font-sans antialiased`}>
        <main className="pb-16">{children}</main>
        <BottomBar />
      </body>
    </html>
  );
}
