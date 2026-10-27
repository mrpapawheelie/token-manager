import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminDashboard } from "@/components/admin-dashboard";
import { getProject } from "@/lib/mock-events";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = getProject(id);
  return {
    title: project ? `${project.event.name} admin · Token Manager` : "Admin",
  };
}

export default async function AdminPage({ params }: PageProps) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        <Link href={`/tokens/${project.event.id}`} className="underline">
          {project.event.name}
        </Link>
      </p>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {project.event.name} admin
        </h1>
        <p className="max-w-2xl text-sm text-stone-700">
          Overview of the mock project, plus placeholder panels for chat, X posts, ads,
          and Meteora. Sensitive controls stay disabled until a real guardian check
          exists.
        </p>
      </div>
      <AdminDashboard project={project} />
    </div>
  );
}
