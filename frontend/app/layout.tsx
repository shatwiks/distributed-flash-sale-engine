import type { Metadata } from "next";
import { Libre_Franklin, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Flash-Sale Engine | Zero Overbooking at 10,000+ RPS",
  description:
    "Distributed concert and cinema ticket reservation engine sustaining 10,480 RPS with guaranteed 0.00% overbooking via single-threaded Redis Lua gatekeeping and PostgreSQL persistence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${libreFranklin.variable} ${sourceSerif.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-[100dvh] bg-[#f5f4f2] text-[#0a0a0a] selection:bg-[#0a0a0a] selection:text-[#ffffff]">
        {children}
      </body>
    </html>
  );
}
