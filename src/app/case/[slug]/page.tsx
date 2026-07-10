import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { DetailShell } from "@/components/hud/detail-shell";
import { getAllProjectSlugs, getProjectBySlug } from "@/lib/work";

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  return project ? { title: project.title } : {};
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || project.draft) return notFound();

  return (
    <DetailShell backHref="/menu/work">
      <p className="text-xs tracking-widest text-accent">
        {`// ${project.kind.toUpperCase()}`}
      </p>
      <h1 className="mt-3 text-lg font-semibold tracking-wide text-ink sm:text-xl">
        {project.title.toUpperCase()}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
        {project.summary}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-5 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-ink-dim">CLIENT</dt>
          <dd className="mt-1 text-ink-soft">{project.client}</dd>
        </div>
        <div>
          <dt className="text-ink-dim">ROLE</dt>
          <dd className="mt-1 text-ink-soft">{project.role.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-ink-dim">DURATION</dt>
          <dd className="mt-1 text-ink-soft">{project.duration}</dd>
        </div>
        <div>
          <dt className="text-ink-dim">YEAR</dt>
          <dd className="mt-1 text-ink-soft">{project.year}</dd>
        </div>
      </dl>

      {project.links?.prototype && (
        <a
          href={project.links.prototype}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded border border-line px-4 py-2 text-xs tracking-widest text-accent hover:bg-white/5"
        >
          VIEW PROTOTYPE ↗
        </a>
      )}

      <div className="prose prose-invert prose-sm mt-8 max-w-none prose-headings:font-mono prose-headings:tracking-wide prose-headings:text-ink prose-p:text-ink-soft prose-a:text-accent prose-strong:text-ink prose-img:rounded-md prose-img:border prose-img:border-line">
        <MDXRemote source={project.content} />
      </div>
    </DetailShell>
  );
}
