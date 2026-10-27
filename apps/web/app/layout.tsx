import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { MockBanner } from "@/components/mock-banner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Token Manager",
  description: "Bonding-curve directory, name scoring, and a local brand kit.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased">
        <MockBanner />
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
            <Image src="/mark.svg" alt="" width={32} height={32} />
            <div className="mr-auto">
              <Link href="/" className="text-lg font-semibold">
                Token Manager
              </Link>
              <p className="text-sm text-stone-600">Bonding-curve directory.</p>
            </div>
            <nav className="flex flex-wrap gap-4 text-sm">
              <Link href="/" className="underline">
                Directory
              </Link>
              <Link href="/brand" className="underline">
                Name and brand
              </Link>
              <Link href="/template" className="underline">
                Template
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
