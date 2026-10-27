import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTRACT_ADDRESS_PLACEHOLDER } from "@token-manager/shared";

import { BadgeList } from "@/components/badges";
import { ContractAddress } from "@/components/contract-address";
import { IdentityScorePanel } from "@/components/identity-score";
import { getProject } from "@/lib/mock-events";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = getProject(id);
  return { title: project ? `${project.event.name} · Token Manager` : "Token Manager" };
}

export default async function TokenPage({ params }: PageProps) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const { event, completion, badges } = project;
  const socials = Object.entries(event.socials);

  return (
    <div className="space-y-8">
      <ContractAddress
        address={event.contract}
        placeholder={CONTRACT_ADDRESS_PLACEHOLDER}
      />
      <div className="space-y-2">
        <p className="text-sm text-stone-500">
          <Link href="/" className="underline">
            Directory
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {event.name} <span className="text-stone-500">{event.symbol}</span>
        </h1>
        <p className="max-w-2xl text-stone-700">{event.shortDescription}</p>
        <p className="text-sm">
          {completion.percent}% complete. {event.category}. Verification{" "}
          {event.verification.status.replaceAll("_", " ")}.
        </p>
        <Link
          href={`/tokens/${event.id}/admin`}
          className="inline-block rounded-md bg-stone-900 px-3 py-2 text-sm text-white"
        >
          Admin shell
        </Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Status labels</h2>
        <p className="text-sm text-stone-600">
          Grey means the check is still open. Color means the mock row marks it done.
          These are checks, not rank badges.
        </p>
        <BadgeList badges={badges} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Profile completion</h2>
        <p className="text-sm">{completion.benefit}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Checklist title="Done" items={completion.completed} />
          <Checklist title="Still open" items={completion.missing} />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Contract and launch</h2>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-stone-500">Contract</dt>
            <dd className="font-mono text-xs break-all">{event.contract}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Launch time</dt>
            <dd>{event.launchAt}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Dump caveat</dt>
            <dd>
              The creator record acknowledges that a dump after graduation is typical.
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Socials</h2>
        {socials.length === 0 ? (
          <p className="text-sm text-stone-600">No social links on this mock row.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {socials.map(([key, value]) => (
              <li key={key}>
                <span className="text-stone-500">{key}: </span>
                {value?.startsWith("http") ? (
                  <a href={value} className="underline" rel="noreferrer">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Locks</h2>
        {event.locks.length === 0 ? (
          <p className="text-sm text-stone-600">No locks in this mock record.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {event.locks.map((lock) => (
              <li
                key={`${lock.kind}-${lock.subject}`}
                className="rounded-md bg-white p-3 ring-1 ring-stone-200"
              >
                <p className="font-medium">{lock.kind}</p>
                <p className="font-mono text-xs break-all">{lock.subject}</p>
                {lock.supplyBps !== undefined ? (
                  <p>{lock.supplyBps} bps of supply</p>
                ) : null}
                {lock.compoundingFeeBps !== undefined ? (
                  <p>compounding_fee_bps = {lock.compoundingFeeBps}</p>
                ) : null}
                {lock.cliffSeconds !== undefined ? (
                  <p>
                    Cliff {lock.cliffSeconds} seconds, stream {lock.streamSeconds} seconds
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Verification</h2>
        <p className="text-sm text-stone-600">
          OAuth verification is not live in this shell. The status below is mock data.
        </p>
        <p className="text-sm">{event.verification.status.replaceAll("_", " ")}</p>
        <ul className="list-disc pl-5 text-sm">
          {event.verification.methods.map((method) => (
            <li key={method}>{method}</li>
          ))}
        </ul>
      </section>

      {event.identity ? <IdentityScorePanel score={event.identity} /> : null}
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">None.</p>
      ) : (
        <ul className="mt-1 list-disc pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
