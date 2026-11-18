export type ProjectKind = "client" | "university" | "personal";
export type ProjectCategory = "dev" | "design";

export interface ProjectLinks {
  live?: string;
  repo?: string;
  prototype?: string;
}

export interface ProjectFrontmatter {
  title: string;
  summary: string;
  /** Shorter line for the Dev/Design work cards; falls back to summary. */
  cardSummary?: string;
  /** A real, specific result already stated in the case study (live, a score, a number). Only where one exists. */
  outcome?: string;
  client: string;
  kind: ProjectKind;
  category: ProjectCategory;
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
  /** Sits in the ring round the dial when Work opens. */
  selected?: boolean;
  order?: number;
  draft?: boolean;
}

export interface Project extends ProjectFrontmatter {
  slug: string;
  content: string;
  readingTime: string;
}
