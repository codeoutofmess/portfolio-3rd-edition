import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { BackToWork } from "@/components/case/back";
import { Media, Pair, Step } from "@/components/case/blocks";
import { getAllProjects, getAllProjectSlugs, getProjectBySlug, SHORT_NAMES } from "@/lib/work";

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  return project ? { title: SHORT_NAMES[slug] ?? project.title, description: project.summary } : {};
}

/**
 * A case study, image first. The details (what it is, my role, when, what it's built with, links) sit in a fixed
 * column on the left; on the right a big title overlaps the hero, then the story is told mostly in big images and
 * GIFs with a few short numbered steps between them. On phones the title and hero come first, then the details: the
 * right-hand column and its story drop their wrappers there (display: contents), so `order` can lift the title and the
 * first image above the details.
 */
export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || project.draft) return notFound();

  const all = getAllProjects();
  const next = all[(all.findIndex((p) => p.slug === slug) + 1) % all.length];
  const name = SHORT_NAMES[slug] ?? project.title;
  const links = [
    project.links?.live && { href: project.links.live, label: "Visit site" },
    project.links?.prototype && { href: project.links.prototype, label: "Open prototype" },
    project.links?.repo && { href: project.links.repo, label: "View code" },
  ].filter(Boolean) as { href: string; label: string }[];

  const context = project.kind === "client" ? project.client : project.kind === "university" ? "University project" : "Personal project";
  const rows: [string, React.ReactNode][] = [
    ["About", project.summary],
    ...(project.outcome ? ([["Outcome", project.outcome]] as [string, string][]) : []),
    ["Role", project.role.join(", ")],
    ...(project.team?.length ? ([["Team", project.team.join(", ")]] as [string, string][]) : []),
    [project.kind === "client" ? "Client" : "Context", context],
    ["Year", project.duration ? `${project.year} · ${project.duration}` : project.year],
    ["Built with", project.tags.join(", ")],
  ];

  return (
    <main className="mx-auto grid w-full max-w-[1480px] font-file gap-10 px-5 pb-28 pt-32 sm:px-10 md:grid-cols-[280px_1fr] md:gap-12 md:pt-28 lg:grid-cols-[320px_1fr] lg:gap-16">
      {/* Project details: a fixed column on the left that stays put while the work scrolls */}
      {/* Phones: a way back sits at the very top, since the details (with their own back link) come after the hero. */}
      <Link href="/?view=work" className="-order-3 text-[14.5px] font-medium text-ink-soft hover:text-ink md:hidden">
        ← Work
      </Link>
      <aside className="text-[14px] leading-relaxed md:sticky md:top-24 md:max-h-[calc(100svh-7rem)] md:self-start md:overflow-y-auto md:pb-6 font-medium">
        <BackToWork className="max-md:hidden" />
        <dl className="mt-8 space-y-5 border-t border-line pt-5">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[12px] uppercase tracking-[0.08em] text-ink-dim font-medium">{k}</dt>
              <dd className={`mt-1 ${k === "About" ? "text-ink" : "text-ink-soft"}`}>{v}</dd>
            </div>
          ))}
        </dl>
        {/* The way out to the live project, closing the details: a large, borderless link-button with a big, clear label; any others sit beside it in the same style. */}
        {links.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line pt-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group inline-flex min-h-12 items-center gap-3 text-[19px] font-medium tracking-[0.01em] text-ink transition-colors hover:text-ink-soft"
              >
                {l.label}
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="h-6 w-6 fill-none stroke-current transition-transform duration-300 [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.1}
                >
                  <path d="M6.5 17.5 17.5 6.5M8.5 6.5h9v9" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </aside>

      <div className="min-w-0 max-md:contents">
        {/* Big title, top right, sitting over the top of the hero image or GIF. Difference blending keeps it
            readable on both the page and the picture. */}
        <h1
          // On screens wider than the page column, reach past it to the right edge of the window (keeping the page padding).
          style={{ marginRight: "min(0px, calc((1480px - 100vw) / 2))" }}
          className="pointer-events-none relative z-10 -mb-[0.42em] text-right font-title max-md:-order-2 max-md:mb-[calc(-0.42em-2.5rem)] text-[clamp(60px,9.4vw,166px)] font-normal leading-[0.88] tracking-[-0.03em] text-white mix-blend-difference">
          {name}
        </h1>

        <div className="flex flex-col gap-10 md:gap-14 max-md:contents max-md:[&>figure:first-child]:-order-1">
          <MDXRemote
            source={project.content}
            components={{ Media, Pair, Step, img: ({ src = "", alt = "" }: { src?: string; alt?: string }) => <Media src={src} alt={alt} /> }}
          />
        </div>

        <Link href={`/case/${next.slug}`} className="group mt-24 block border-t border-line pt-6">
          <span className="text-[14px] text-ink-dim font-medium">Next project</span>
          <span className="mt-2 block font-title text-[clamp(36px,5vw,72px)] font-normal leading-[0.95] tracking-[-0.03em] transition-colors group-hover:text-ink-soft">
            {SHORT_NAMES[next.slug] ?? next.title} →
          </span>
        </Link>
      </div>
    </main>
  );
}
