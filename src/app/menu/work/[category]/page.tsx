import { notFound } from "next/navigation";
import { ShellBox } from "@/components/hud/shell-box";
import { HudCardMenu } from "@/components/hud/hud-card-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";
import { CenteredPage } from "@/components/hud/centered-page";
import { getProjectsByCategory } from "@/lib/work";
import type { ProjectCategory } from "@/types/work";

const CATEGORIES: ProjectCategory[] = ["dev", "design"];

/** Until real logo files are dropped in, these labels stand in for them. */
const LOGO_FALLBACK: Record<string, string> = {
  "boombapbombay": "BOOM BAP BOMBAY",
  "fmkr": "FMKR",
  "wellington-chess-club": "WELLINGTON CHESS CLUB",
  "first90-nz": "FIRST90 NZ",
  "paste-up": "PASTE UP",
  "consumer-nz-ia": "CONSUMER NZ",
  "candidacy-information": "CITY COUNCIL",
  "beatstars-design-system": "BEATSTARS",
  "shiftboard": "SHIFTBOARD",
  "desklog": "DESKLOG",
  "consoleview": "CONSOLEVIEW",
};

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }));
}

export default async function WorkCategoryListPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!CATEGORIES.includes(category as ProjectCategory)) return notFound();

  const projects = getProjectsByCategory(category as ProjectCategory);

  return (
    <CenteredPage hint={<KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />}>
      <ShellBox backHref="/menu/work" size="compact" backLabel="WORK">
        <HudCardMenu
          items={projects.map((p) => ({
            label: p.title,
            href: `/case/${p.slug}`,
            logo: p.logo,
            fallback: LOGO_FALLBACK[p.slug] ?? p.title.charAt(0).toUpperCase(),
            summary: p.summary,
            tags: p.tags,
          }))}
          backHref="/menu/work"
        />
      </ShellBox>
    </CenteredPage>
  );
}
