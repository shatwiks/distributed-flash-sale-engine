import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flash-Sale Engine | Real-Time Distributed Concurrency & Inventory",
  description:
    "Production-grade distributed flash-sale engine sustaining 10,000+ RPS burst throughput with guaranteed 0.00% overbooking via Redis Lua atomic gatekeeping and PostgreSQL persistence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-[100dvh] bg-[#f5f4f2] text-[#0a0a0a] font-sans selection:bg-[#0a0a0a] selection:text-[#ffffff]">
        {children}
      </body>
    </html>
  );
}
