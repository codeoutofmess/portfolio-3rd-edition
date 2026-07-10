import { ShellBox } from "@/components/hud/shell-box";
import { HudCardMenu } from "@/components/hud/hud-card-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";
import { getAllProjects } from "@/lib/work";

/** Until real logo files are dropped in, these labels stand in for them. */
const LOGO_FALLBACK: Record<string, string> = {
  "consumer-nz-ia": "CONSUMER NZ",
  "candidacy-information": "CITY COUNCIL",
  "beatstars-design-system": "BEATSTARS",
};

export default function WorkMenuPage() {
  const projects = getAllProjects();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <ShellBox backHref="/menu" size="compact">
        <div className="flex h-full items-center justify-center">
          <HudCardMenu
            items={projects.map((p) => ({
              label: p.title,
              href: `/case/${p.slug}`,
              logo: p.logo,
              fallback: LOGO_FALLBACK[p.slug] ?? p.title.charAt(0).toUpperCase(),
            }))}
            backHref="/menu"
          />
        </div>
      </ShellBox>
      <KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />
    </main>
  );
}
