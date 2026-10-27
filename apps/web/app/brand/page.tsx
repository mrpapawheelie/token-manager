import type { Metadata } from "next";
import Link from "next/link";
import { NAME_RULES } from "@token-manager/shared";

import { BrandStudio } from "@/components/brand-studio";

export const metadata: Metadata = {
  title: "Name and brand · Token Manager",
  description:
    "Market intake, name score, Cloudflare .com plan, and a local SVG brand kit.",
};

export default function BrandPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-2">
        <p className="text-sm text-stone-500">
          <Link href="/" className="underline">
            Directory
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Name and brand</h1>
        <p className="text-sm text-stone-700">
          Same helpers as the MCP tools. Guidance is optional. Wallets, the GitHub repo,
          the domain, and X stay on accounts you own. Leaving Token Manager does not take
          them with it. Bonding-curve creation stays free.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Rules</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {NAME_RULES.map((rule) => (
            <li
              key={rule.id}
              className="rounded-lg bg-white p-3 text-sm ring-1 ring-stone-200"
            >
              <p className="font-medium">{rule.rule}</p>
              <p className="text-stone-600">{rule.prefer}</p>
            </li>
          ))}
        </ul>
      </section>
      <BrandStudio />
    </div>
  );
}
