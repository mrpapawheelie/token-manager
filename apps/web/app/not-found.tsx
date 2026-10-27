import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">That mock creation is not in the shell.</h1>
      <Link href="/" className="text-sm underline">
        Back to the directory
      </Link>
    </div>
  );
}
