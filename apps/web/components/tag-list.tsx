import type { CredentialTag } from "@token-manager/shared";

export function TagList({ tags }: { tags: CredentialTag[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          key={tag.id}
          title={tag.detail}
          className={`rounded-full px-2.5 py-1 text-xs ring-1 ${
            tag.active
              ? "bg-sky-100 text-sky-950 ring-sky-300"
              : "bg-stone-200 text-stone-500 ring-stone-300"
          }`}
        >
          {tag.label}
        </li>
      ))}
    </ul>
  );
}
