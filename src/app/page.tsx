import { Suspense } from "react";
import { DialMenu } from "@/components/dial-menu";
import type { WorkItem } from "@/components/work-scatter";
import { behanceProjects } from "@/content/behance";
import { coverFor, DISCIPLINES, getProjectsByCategory, SHORT_NAMES } from "@/lib/work";

export default function HomePage() {
  const projects = [...getProjectsByCategory("dev"), ...getProjectsByCategory("design")];
  const items: WorkItem[] = [
    ...projects.map((p) => ({
      slug: p.slug,
      name: SHORT_NAMES[p.slug] ?? p.title,
      cover: coverFor(p.slug, p.coverImage),
      href: `/case/${p.slug}`,
      groups: DISCIPLINES[p.slug] ?? [],
      selected: p.selected,
      summary: p.cardSummary ?? p.summary,
      facts: [
        ["Client", p.client],
        ["Year", p.year],
        ["Role", p.role.join(", ")],
        ["Tools", p.tags.slice(0, 4).join(", ")],
      ] as [string, string][],
    })),
    ...behanceProjects.map((b) => ({
      slug: b.name,
      name: b.name,
      cover: b.cover,
      href: b.href,
      external: true,
      groups: b.groups,
      selected: b.selected,
      facts: [
        ["Type", b.tag],
        ["On", "Behance"],
      ] as [string, string][],
    })),
  ];

  return (
    <Suspense>
      <DialMenu items={items} />
    </Suspense>
  );
}
