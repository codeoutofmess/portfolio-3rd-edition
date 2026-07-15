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
