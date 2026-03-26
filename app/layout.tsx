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
  title: "Simple Trading Simulator",
  description: "A minimal stock simulator built with Next.js + Prisma",
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
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <a href="/" className="font-semibold tracking-tight">
              Simple Trading Simulator
            </a>
            <nav className="flex items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
              <a className="hover:underline" href="/">
                Portfolios
              </a>
              <a className="hover:underline" href="/signals">
                Signals
              </a>
              <a className="hover:underline" href="/api/signals?symbol=aapl.us">
                API
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-black/10 py-6 text-center text-xs text-zinc-500 dark:border-white/10">
          Built with Next.js + Prisma (SQLite)
        </footer>
      </body>
    </html>
  );
}
