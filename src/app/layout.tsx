import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Barber Shop – Premium Grooming in Waterloo, London",
  description:
    "Experience refined men's grooming near London Eye. Classic cuts, hot towel shaves, and complimentary drinks in an elegant atmosphere.",
  keywords: [
    "barber shop",
    "London barber",
    "Waterloo barber",
    "men's grooming",
    "haircut London",
    "hot towel shave",
    "premium barber",
    "London Eye barber",
  ],
  authors: [{ name: "The Barber Shop Waterloo" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "The Barber Shop – Premium Grooming in Waterloo, London",
    description:
      "Experience refined men's grooming near London Eye. Classic cuts, hot towel shaves, and complimentary drinks.",
    type: "website",
    locale: "en_GB",
    siteName: "The Barber Shop Waterloo",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Barber Shop – Premium Grooming in Waterloo",
    description:
      "Experience refined men's grooming near London Eye. Classic cuts, hot towel shaves, and complimentary drinks.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
