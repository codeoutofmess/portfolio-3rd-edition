import { HudMenu } from "@/components/hud/hud-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";
import { getAllProjects } from "@/lib/work";

export default function WorkMenuPage() {
  const projects = getAllProjects();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <HudMenu
        items={projects.map((p) => ({ label: p.title, href: `/case/${p.slug}` }))}
        backHref="/menu"
      />
      <KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />
    </main>
  );
}
