"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { DirectoryProject } from "@/lib/mock-events";

import { BadgeList } from "./badges";

const VERIFICATION = [
  "all",
  "unverified",
  "pending",
  "verified",
  "anonymous_verified",
] as const;

export function Directory({ projects }: { projects: DirectoryProject[] }) {
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
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
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
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
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
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="min-w-[64rem] w-full text-left text-sm">
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
                    <Link
                      href={`/tokens/${project.event.id}`}
                      className="font-semibold text-stone-900 underline-offset-2 hover:underline"
                    >
                      {project.event.name}
                    </Link>
                    <p className="text-stone-500">{project.event.symbol}</p>
                    <p className="mt-1 max-w-sm text-stone-700">
                      {project.event.shortDescription}
                    </p>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
