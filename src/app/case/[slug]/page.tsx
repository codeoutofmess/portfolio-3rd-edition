import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { DetailShell } from "@/components/hud/detail-shell";
import { ScrollPercent } from "@/components/hud/scroll-percent";
import { MdxImage } from "@/components/hud/mdx-image";
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
      <ScrollPercent />
      <p className="text-sm tracking-widest text-accent">
        {`// ${project.kind.toUpperCase()}`}
      </p>
      <h1 className="mt-3 text-xl font-semibold tracking-wide text-ink sm:text-2xl">
        {project.title.toUpperCase()}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed tracking-wide text-ink-soft">
        {project.summary}
      </p>

      <dl className="mt-7 grid grid-cols-2 gap-5 border-y border-line py-6 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink-dim">CLIENT</dt>
          <dd className="mt-1.5 text-ink-soft">{project.client}</dd>
        </div>
        <div>
          <dt className="text-ink-dim">ROLE</dt>
          <dd className="mt-1.5 text-ink-soft">{project.role.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-ink-dim">DURATION</dt>
          <dd className="mt-1.5 text-ink-soft">{project.duration}</dd>
        </div>
        <div>
          <dt className="text-ink-dim">YEAR</dt>
          <dd className="mt-1.5 text-ink-soft">{project.year}</dd>
        </div>
      </dl>

      {project.links?.prototype && (
        <a
          href={project.links.prototype}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded border border-line px-4 py-2.5 text-sm tracking-widest text-accent hover:bg-white/5"
        >
          VIEW PROTOTYPE ↗
        </a>
      )}

      <div className="prose prose-invert mt-9 max-w-none tracking-wide prose-headings:font-mono prose-headings:tracking-wide prose-headings:text-ink prose-p:text-base prose-p:leading-loose prose-p:text-ink-soft prose-a:text-accent prose-strong:text-ink prose-li:text-base prose-li:text-ink-soft prose-img:rounded-md prose-img:border prose-img:border-line">
        <MDXRemote source={project.content} components={{ img: MdxImage }} />
      </div>
    </DetailShell>
  );
}
