import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Project, ProjectFrontmatter } from "@/types/work";

const WORK_DIR = path.join(process.cwd(), "src/content/work");

function publicImageExists(imagePath?: string): boolean {
  if (!imagePath) return false;
  return fs.existsSync(path.join(process.cwd(), "public", imagePath));
}

function readProjectFile(filename: string): Project {
  const slug = filename.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(WORK_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as ProjectFrontmatter;

  return {
    ...frontmatter,
    coverImage: publicImageExists(frontmatter.coverImage)
      ? frontmatter.coverImage
      : undefined,
    logo: publicImageExists(frontmatter.logo) ? frontmatter.logo : undefined,
    slug,
    content,
    readingTime: readingTime(content).text,
  };
}

export function getAllProjects({ includeDrafts = false } = {}): Project[] {
  const files = fs.readdirSync(WORK_DIR).filter((f) => f.endsWith(".mdx"));
  const projects = files.map(readProjectFile);

  return projects
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((p) => p.featured);
}

export function getProjectsByCategory(category: Project["category"]): Project[] {
  return getAllProjects().filter((p) => p.category === category);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects({ includeDrafts: true }).find((p) => p.slug === slug);
}

export function getAllProjectSlugs(): string[] {
  return getAllProjects().map((p) => p.slug);
}

/** Short names for the home showcase list; falls back to the case title. */
export const SHORT_NAMES: Record<string, string> = {
  "boombapbombay": "Boom Bap Bombay",
  "fmkr": "FMKR",
  "fly-eire": "FLY.EIRE",
  "wellington-chess-club": "Wellington Chess Club",
  "first90-nz": "First90 NZ",
  "paste-up": "Paste Up",
  "shiftboard": "ShiftBoard",
  "desklog": "DeskLog",
  "consoleview": "ConsoleView",
  "consumer-nz-ia": "Consumer NZ",
  "candidacy-information": "Candidate Information",
  "beatstars-design-system": "Beatstars Design System",
};

export type Discipline = "web" | "ux" | "graphic";

/** Home filters, taken from each case study's roles. A project can be in several. */
export const DISCIPLINES: Record<string, Discipline[]> = {
  "boombapbombay": ["web", "graphic"],
  "fmkr": ["web", "graphic"],
  "fly-eire": ["web"],
  "wellington-chess-club": ["web"],
  "first90-nz": ["web", "ux"],
  "paste-up": ["web", "graphic"],
  "shiftboard": ["web"],
  "desklog": ["web"],
  "consoleview": ["web"],
  "consumer-nz-ia": ["ux"],
  "candidacy-information": ["ux"],
  "beatstars-design-system": ["ux"],
};

/** Still cover shown peeking out of the folder; the first frame of the site recording when there is one. */
export function coverFor(slug: string, still?: string) {
  const exists = (f: string) => fs.existsSync(path.join(process.cwd(), "public", f));
  for (const name of ["scroll", "prototype-preview"]) {
    const first = `/images/work/${slug}/${name}-still.jpg`;
    if (exists(first)) return first;
  }
  return still;
}
