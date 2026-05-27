import type { Metadata } from "next";
import { Press_Start_2P, VT323, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  variable: "--font-arcade",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-terminal",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crypto Battle Arena",
  description: "Pick your coin. State your point. Win the crowd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${pressStart.variable} ${vt323.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-terminal scanlines">
        {children}
      </body>
    </html>
  );
}
