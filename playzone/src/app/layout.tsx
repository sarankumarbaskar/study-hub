import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PlayZone - Free Online Games & Quizzes",
    template: "%s | PlayZone",
  },
  description:
    "Play free online games, take fun quizzes, and challenge your friends! Snake, 2048, Memory Match, trivia and more.",
  keywords: ["free games", "online games", "quizzes", "trivia", "snake game", "2048", "memory game"],
  openGraph: {
    title: "PlayZone - Free Online Games & Quizzes",
    description: "Play free online games, take fun quizzes, and challenge your friends!",
    type: "website",
    siteName: "PlayZone",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayZone - Free Online Games & Quizzes",
    description: "Play free online games, take fun quizzes, and challenge your friends!",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {adsenseId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
