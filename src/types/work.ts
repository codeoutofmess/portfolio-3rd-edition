export type ProjectKind = "client" | "university" | "personal";

export interface ProjectLinks {
  live?: string;
  repo?: string;
  prototype?: string;
}

export interface ProjectFrontmatter {
  title: string;
  summary: string;
  client: string;
  kind: ProjectKind;
  role: string[];
  year: string;
  duration: string;
  team?: string[];
  tags: string[];
  coverImage?: string;
  coverAlt?: string;
  logo?: string;
  links?: ProjectLinks;
  featured?: boolean;
  order?: number;
  draft?: boolean;
}

export interface Project extends ProjectFrontmatter {
  slug: string;
  content: string;
  readingTime: string;
}
