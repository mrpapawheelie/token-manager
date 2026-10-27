"use client";

import type { BadgeDefinition } from "@token-manager/shared";

function badgeClass(badge: BadgeDefinition): string {
  if (!badge.active) {
    return "bg-stone-200 text-stone-500 ring-stone-300";
  }
  if (badge.tier === "partial") {
    return "bg-amber-100 text-amber-950 ring-amber-300";
  }
  return "bg-emerald-100 text-emerald-950 ring-emerald-300";
}

export function BadgeList({ badges }: { badges: BadgeDefinition[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <li
          key={badge.id}
          title={badge.detail}
          className={`rounded-full px-2.5 py-1 text-xs ring-1 ${badgeClass(badge)}`}
        >
          <span className="font-semibold">{badge.active ? "On" : "Off"}</span>
          <span> · {badge.label}</span>
        </li>
      ))}
    </ul>
  );
}
