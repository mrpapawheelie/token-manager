import type { Metadata } from "next";
import Link from "next/link";
import { CONTRACT_ADDRESS_PLACEHOLDER } from "@token-manager/shared";

import { ContractAddress } from "@/components/contract-address";
import { SiteBlurbForm } from "@/components/site-blurb-form";

export const metadata: Metadata = {
  title: "Site template · Token Manager",
};

export default function SiteTemplatePage() {
  return (
    <div className="space-y-6">
      <ContractAddress address={null} placeholder={CONTRACT_ADDRESS_PLACEHOLDER} />
      <div className="space-y-2">
        <p className="text-sm text-stone-500">
          <Link href="/" className="underline">
            Directory
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Project site template</h1>
        <p className="max-w-2xl text-sm text-stone-700">
          Pre-mint preview. No coin exists yet, so the contract line is a placeholder.
          Founder sites ship on Vercel with Next.js, TypeScript, shadcn/ui, and Zod forms.
          The founder keeps the repo and can extend it after they leave Token Manager.
        </p>
      </div>
      <section className="max-w-xl space-y-2 rounded-lg bg-white p-4 ring-1 ring-stone-200">
        <h2 className="text-lg font-semibold">Form check</h2>
        <SiteBlurbForm />
      </section>
    </div>
  );
}
