import type { Discipline } from "@/lib/work";

/** Behance projects shown in the showcase. They open on Behance in a new tab. */
export interface BehanceProject {
  name: string;
  href: string;
  /** Local cover. Omitted where Behance has no public cover for the project. */
  cover?: string;
  tag: string;
  groups: Discipline[];
  /** Sits in the ring round the dial when Work opens. */
  selected?: boolean;
}

const g = "https://www.behance.net/gallery";

export const behanceProjects: BehanceProject[] = [
  { name: "FMKR Animation", href: `${g}/256859019/ANIMATION-FAT-MAN-KILLS-RECORDS`, cover: "/images/behance/fmkr-animation.webp", tag: "Animation", groups: ["graphic"], selected: true },
  { name: "Boom Bap Bombay Alt Designs", href: `${g}/235168731/BOOMBAPBOMBAY-ALT-DESIGNS`, cover: "/images/behance/bbb-alt-designs.webp", tag: "Alt designs", groups: ["graphic"] },
  { name: "FMKR Logo", href: `${g}/235166127/LOGO-DESIGN-FOR-FMKR`, cover: "/images/behance/fmkr-logo.webp", tag: "Logo design", groups: ["graphic"] },
  { name: "Motion Graphics Concept", href: `${g}/235161227/MOTION-GRAPHICS-CONCEPTUAL-PROJECTUNOFFICIAL`, cover: "/images/behance/motion-graphics.webp", tag: "Motion graphics", groups: ["graphic"] },
  { name: "Sarjeant Quarterly Magazine", href: `${g}/224110023/Sarjeant-Quarterly-Magazine`, cover: "/images/behance/sarjeant-magazine.webp", tag: "Magazine", groups: ["graphic"] },
  { name: "Album Art (Devil's Dance)", href: `${g}/223271359/Album-art-(devils-dance)`, cover: "/images/behance/album-art-devils-dance.webp", tag: "Album art", groups: ["graphic"], selected: true },
  { name: "Death of a Language", href: `${g}/223270951/death-of-a-language`, cover: "/images/behance/death-of-a-language.webp", tag: "Design", groups: ["graphic"], selected: true },
  { name: "The Letter V", href: `${g}/223270679/The-letter-V`, cover: "/images/behance/the-letter-v.webp", tag: "Design", groups: ["graphic"], selected: true },
  { name: "Tarantino Infographic", href: `${g}/223269613/Tarantino-Infographic`, cover: "/images/behance/tarantino-infographic.webp", tag: "Infographic", groups: ["graphic"] },
];
