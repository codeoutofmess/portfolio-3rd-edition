/** Text files that scatter across the page when About is open. Experience comes from the résumé; edit freely. */
export interface Note {
  id: string;
  file: string;
  /** First line of the file. */
  heading: string;
  /** Second line, e.g. place and dates. */
  meta?: string;
  /** Bullets ("- " prefix) or plain lines. */
  lines: string[];
  bullets?: boolean;
  /** Prompt that types out under the cursor while hovering the file. */
  hint: string;
  /** An image file (shown as a picture in its window) rather than text. */
  image?: { src: string; thumb: string; alt: string; w: number; h: number };
  /** A video file (plays in its window). Upright phone video; `thumb` is a still from it. */
  video?: { src: string; poster: string; thumb: string; label: string };
  /** Files in a group sit together on the page. */
  group: "experience" | "about" | "landing";
}

export const notes: Note[] = [
  {
    id: "freelance",
    hint: "read work experience",
    group: "experience",
    file: "freelance.txt",
    heading: "Front-End Developer & Designer",
    meta: "Freelance · Wellington, NZ · Oct 2024 – Present",
    bullets: true,
    lines: [
      "Designed and built BOOM BAP BOMBAY end to end, a beat store for an independent hip-hop label: brand identity, UI and motion design, a Three.js and GSAP front end with a cursor-tracked 3D scene, and an Express, Supabase and PostgreSQL back end handling Razorpay checkout, server-side order verification and gated downloads. Hardened with helmet and rate limiting, covered by tests, with 3D assets compressed through a gltf-transform build pipeline.",
      "Designed a logo and website for a music distribution label, including defining brand values.",
      "Led UX analysis for IMFS, an India-based education counselling company, partnering with their in-house team to redesign and rebuild its website.",
    ],
  },
  {
    id: "consumer-nz",
    hint: "read work experience",
    group: "experience",
    file: "consumer-nz.txt",
    heading: "UX Designer",
    meta: "Consumer NZ · Wellington, NZ · University internship · Feb 2024 – May 2024",
    bullets: true,
    lines: [
      "Researched the website, users and stakeholders through content audits and usability testing with current members.",
      "Improved information architecture and content discoverability through user-tested wireframes, prototypes, a design system and a detailed proposal report.",
    ],
  },
  {
    id: "right-aligned",
    hint: "read work experience",
    group: "experience",
    file: "right-aligned.txt",
    heading: "UX Designer",
    meta: "Right Aligned Solutions · Bengaluru, India · Feb 2022 – May 2023",
    bullets: true,
    lines: [
      "Started as a UX researcher, then moved into Figma-based design work across an Agile, multi-project workload, building research-backed prototypes and running competitive audits.",
    ],
  },
  {
    id: "fabkraft",
    hint: "read work experience",
    group: "experience",
    file: "fabkraft.txt",
    heading: "Intern",
    meta: "fabkraft · Mumbai, India · May 2021 – Nov 2021",
    bullets: true,
    lines: ["Sourced new sales leads through cold calls and email, wrote content, and learned SEO/SEM fundamentals."],
  },
  {
    id: "education",
    hint: "read education",
    group: "experience",
    file: "education.txt",
    heading: "Education",
    bullets: true,
    lines: [
      "Master of Design (UX), Victoria University of Wellington. Jul 2023 – Jul 2024.",
      "Bachelor of Engineering (IT), SIES Graduate School of Technology, Mumbai. Aug 2016 – Oct 2020.",
    ],
  },
  {
    id: "id",
    hint: "view my ID card",
    group: "about",
    file: "ID.png",
    heading: "ID",
    lines: [],
    image: {
      src: "/about/ID-card.png",
      thumb: "/about/ID-card-thumb.png",
      alt: "ID card for Pradyumna Vishwanath, designer and developer in Wellington, open to work",
      w: 1712,
      h: 1080,
    },
  },
  {
    id: "skills",
    hint: "read skills",
    group: "about",
    file: "skills.txt",
    heading: "Skills",
    lines: [
      "Languages    JavaScript, TypeScript, Python, SQL, HTML/CSS",
      "Front end    React, Next.js, Three.js, GSAP, Tailwind",
      "Back end     Node.js, Express, Supabase, PostgreSQL, Django, REST APIs",
      "Design       Figma, design systems, prototyping, motion graphics, Illustrator, Photoshop, After Effects",
      "UX practice  User research, usability testing, wireframing, journey mapping, information architecture",
      "Also used    Java, C/C++, PHP (degree coursework)",
    ],
  },
  {
    id: "hobbies",
    hint: "read hobbies",
    group: "about",
    file: "hobbies.txt",
    heading: "Hobbies",
    bullets: true,
    lines: [
      "I get lost in the world of dance and music. My creativity comes out most naturally, without inhibitions, when I dance.",
      "Likely to lay down a sick beat with my homeboy [S/O KSHAH] and spit some lukewarm bars every now and then.",
      "Picked up the guitar recently, got a beautiful one gifted to me. Just learning the favs for now.",
      "I play chess games whenever and wherever I get time, also why I'm in the bathroom a lot.",
      "Life itself.",
    ],
  },
  {
    id: "secret-recipe",
    hint: "read the secret recipe",
    group: "about",
    file: "secret-recipe.txt",
    heading: "Secret recipe",
    meta: "Deep research and analysis + Thoughtful design + Rigorous testing + Impeccable engineering",
    lines: [
      "01 Research  Who it's for, what already exists and what's already broken. I talk to people and read the data before I draw anything.",
      "02 Analysis  Boil it down to one clear problem and what done looks like.",
      "03 Design  Sketch and prototype with real content from the start, not lorem ipsum.",
      "04 Testing  Put it in front of real people and fix what they trip on. Then again after it's built.",
      "05 Engineering  Build it properly: fast, accessible and checked on a real phone.",
      "06 Ship  Launch it, watch what happens and keep improving it.",
    ],
  },
];

/** Files on the landing view, beside the dial: the live chess demo. */
export const landingNotes: Note[] = [
  {
    id: "chess-demo-video",
    hint: "watch my live chess board",
    group: "landing",
    file: "chess-demo.mov",
    heading: "Live chess demo",
    lines: [],
    video: {
      src: "/about/chess-demo.mp4",
      poster: "/about/chess-demo-poster.jpg",
      thumb: "/about/chess-demo-thumb.jpg",
      label: "A chess game on my phone showing up live, move by move, on the home page of this site",
    },
  },
  {
    id: "chess-demo-text",
    hint: "read how the live chess works",
    group: "landing",
    file: "chess-demo.txt",
    heading: "Live chess on my portfolio",
    meta: "Side project · November 2026",
    lines: [
      "When I play chess on my phone, the game shows up live on the home page of this site. Each move lands on the board a second or so after I play it, and when the game ends the board quietly goes away.",
      "Chess.com doesn't share live games with other sites, so I built a small Android app to do it. Chess.com names every square of its board for people using screen readers, like \"White Knight on f3\". My app reads those names, works out the position and sends it to my website.",
      "The website works out which move was played from one position to the next, so the pieces slide across the board instead of jumping. Everyone visiting sees the same game at the same moment, however many people are watching.",
      "I designed the board and pieces to fit the rest of the site: soft greys, a little 3D shading, and a window you can drag around and resize. My opponent always goes by the name \"Probably a genius\".",
      "The app only reads what's on screen. It never touches the game itself.",
    ],
  },
];
