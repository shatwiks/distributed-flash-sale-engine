import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flash-Sale Engine | Real-Time Distributed Inventory Manager",
  description:
    "Enterprise-grade 10,000+ RPS flash-sale dashboard powered by atomic Redis Lua gates and PostgreSQL persistence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-[#120D0A] text-[#F5EFEB] selection:bg-[#C5A059] selection:text-[#120D0A]">
        {children}
      </body>
    </html>
  );
}
