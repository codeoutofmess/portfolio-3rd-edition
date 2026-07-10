import { HudCardMenu } from "@/components/hud/hud-card-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";
import { getAllProjects } from "@/lib/work";

/** Until real logo files are dropped in, these labels stand in for them. */
const LOGO_FALLBACK: Record<string, string> = {
  "consumer-nz-ia": "C",
  "candidacy-information": "POLICY",
  "beatstars-design-system": "B",
};

export default function WorkMenuPage() {
  const projects = getAllProjects();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <HudCardMenu
        items={projects.map((p) => ({
          label: p.title,
          href: `/case/${p.slug}`,
          logo: p.logo,
          fallback: LOGO_FALLBACK[p.slug] ?? p.title.charAt(0).toUpperCase(),
        }))}
        backHref="/menu"
      />
      <KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />
    </main>
  );
}
