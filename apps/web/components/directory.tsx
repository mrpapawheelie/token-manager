"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { DirectoryProject } from "@/lib/mock-events";

import { ActorBadge } from "./actor-badge";
import { BadgeList } from "./badges";
import { TagList } from "./tag-list";

const VERIFICATION = [
  "all",
  "unverified",
  "pending",
  "verified",
  "anonymous_verified",
] as const;

const fieldClass =
  "min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base sm:text-sm";

export function Directory({
  projects,
  sessionId,
}: {
  projects: DirectoryProject[];
  sessionId: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [verification, setVerification] = useState<(typeof VERIFICATION)[number]>("all");

  const categories = useMemo(
    () => [...new Set(projects.map((project) => project.event.category))].sort(),
    [projects],
  );

  const filtered = projects.filter((project) => {
    const haystack = [
      project.event.name,
      project.event.symbol,
      project.event.category,
      project.event.shortDescription,
      project.event.contract,
    ]
      .join(" ")
      .toLowerCase();
    const queryOk = query.trim() === "" || haystack.includes(query.trim().toLowerCase());
    const categoryOk = category === "all" || project.event.category === category;
    const verificationOk =
      verification === "all" || project.event.verification.status === verification;
    return queryOk && categoryOk && verificationOk;
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        Shared journey session {sessionId}. Live sync with MCP is off.
      </p>
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="space-y-1 text-sm">
          <span className="font-medium">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, symbol, or contract"
            className={fieldClass}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={fieldClass}
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Verification</span>
          <select
            value={verification}
            onChange={(event) =>
              setVerification(event.target.value as (typeof VERIFICATION)[number])
            }
            className={fieldClass}
          >
            {VERIFICATION.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All statuses" : item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </form>

      <p className="text-sm text-stone-600">
        {filtered.length} of {projects.length} mock creations
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-stone-300 px-4 py-8 text-center text-sm">
          No mock creations match these filters.
        </p>
      ) : (
        <>
          <ul className="space-y-3 lg:hidden">
            {filtered.map((project) => (
              <li
                key={project.event.id}
                className="rounded-lg border border-stone-200 bg-white p-4"
              >
                <ProjectHeading project={project} />
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <Fact label="Category" value={project.event.category} />
                  <Fact
                    label="Verification"
                    value={project.event.verification.status.replaceAll("_", " ")}
                  />
                  <Fact
                    label="Identity"
                    value={
                      project.event.identity
                        ? `${project.event.identity.total} / 100`
                        : "No score"
                    }
                  />
                  <Fact
                    label="Profile"
                    value={`${project.completion.percent}% complete`}
                  />
                </dl>
                <div className="mt-3">
                  <BadgeList badges={project.badges} />
                  <div className="mt-2">
                    <TagList tags={project.tags} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border border-stone-200 bg-white lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-600">
                <tr>
                  <th className="px-3 py-2 font-medium" scope="col">
                    Token
                  </th>
                  <th className="px-3 py-2 font-medium" scope="col">
                    Category
                  </th>
                  <th className="px-3 py-2 font-medium" scope="col">
                    Verification
                  </th>
                  <th className="px-3 py-2 font-medium" scope="col">
                    Identity
                  </th>
                  <th className="px-3 py-2 font-medium" scope="col">
                    Profile
                  </th>
                  <th className="px-3 py-2 font-medium" scope="col">
                    Labels
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr
                    key={project.event.id}
                    className="border-t border-stone-200 align-top"
                  >
                    <td className="px-3 py-3">
                      <ProjectHeading project={project} />
                    </td>
                    <td className="px-3 py-3">{project.event.category}</td>
                    <td className="px-3 py-3">
                      {project.event.verification.status.replaceAll("_", " ")}
                    </td>
                    <td className="px-3 py-3">
                      {project.event.identity
                        ? `${project.event.identity.total} / 100`
                        : "No score"}
                      <p className="text-stone-500">
                        {project.event.identity?.mode === "anonymous_verified"
                          ? "Anonymous, verified"
                          : "Public"}
                      </p>
                    </td>
                    <td className="px-3 py-3">{project.completion.percent}% complete</td>
                    <td className="px-3 py-3">
                      <BadgeList badges={project.badges} />
                      <div className="mt-2">
                        <TagList tags={project.tags} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectHeading({ project }: { project: DirectoryProject }) {
  return (
    <>
      <Link
        href={`/tokens/${project.event.id}`}
        className="font-semibold text-stone-900 underline-offset-2 hover:underline"
      >
        {project.event.name}
      </Link>
      <p className="text-stone-500">{project.event.symbol}</p>
      <ActorBadge
        actor={project.event.actor}
        feePolicy={project.feePolicy}
        lock={project.lock}
      />
      <p className="mt-1 max-w-sm text-stone-700">{project.event.shortDescription}</p>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
