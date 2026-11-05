/**
 * PORTFOLIO CONTENT
 * -----------------
 * Every book on the shelf is defined here. Content is taken from Joseph's existing portfolio
 * and resume. Anything marked with a `placeholder` block is waiting for a real asset - replace
 * it with an `image` / `gallery` block once you have the screenshot or render.
 *
 * Images live in /public/assets/projects (WebP). Use the `img()` helper below.
 */
import type { Book, Img, Track } from "./types";

const img = (name: string, alt: string, caption?: string): Img => ({
  src: `assets/projects/${name}.webp`,
  alt,
  caption,
});

export const LINKS = {
  email: "mailto:jrkwekub@gmail.com",
  emailText: "jrkwekub@gmail.com",
  linkedin: "https://www.linkedin.com/in/jbuadoo/",
  github: "https://github.com/JBuadoo",
  resume: "files/Resume_Joseph_Buadoo_UX_UI_Designer_2026-08.pdf",
  tapin: "https://tapinwaitlist.framer.website/",
  cjc: "https://jbuadoo.github.io/CJC-Music/",
  baratie: "https://jbuadoo.github.io/The-Baratie/",
  osPortfolio: "https://jbuadoo.github.io/portfolio/",
};

export const TRACKS: Track[] = [
  { title: "Royal", src: "audio/royal.mp3", genre: "Melodic", bpm: "130 BPM", key: "B Major" },
  { title: "Mixed Emotions", src: "audio/mixed-emotions.mp3", genre: "New Jack Swing", bpm: "118 BPM", key: "E Minor" },
  { title: "Unusual Things", src: "audio/unusual-things.mp3", genre: "Synthwave", bpm: "85 BPM", key: "E Minor" },
  { title: "Love Taps", src: "audio/love-taps.mp3", genre: "R&B", bpm: "138 BPM", key: "C Minor" },
  { title: "Let Me", src: "audio/let-me.mp3", genre: "2000's Swag", bpm: "108 BPM", key: "E Minor" },
  { title: "Chrome Dome", src: "audio/chrome-dome.mp3", genre: "Electronic Club", bpm: "80 BPM", key: "D# Minor" },
  { title: "Toy Bin OST 1", src: "audio/toy-bin-ost-1.mp3", genre: "Game Soundtrack", bpm: "130 BPM", key: "E Minor" },
  { title: "Patience (as a feature)", src: "audio/patience.mp3", genre: "R&B", bpm: "116 BPM", key: "C# Minor" },
  { title: "New Wave", src: "audio/new-wave.mp3", genre: "New Jack Swing", bpm: "112 BPM", key: "E♭ Minor" },
  { title: "Joestar", src: "audio/joestar.mp3", genre: "Live Test", bpm: "125 BPM", key: "D Major" },
  { title: "Sweet Ballad", src: "audio/sweet-ballad.mp3", genre: "Ballad", bpm: "88 BPM", key: "A Minor" },
];

// ---------------------------------------------------------------------------
// UI/UX DESIGN
// ---------------------------------------------------------------------------
const uiux: Book = {
  id: "uiux",
  title: "UI/UX Design",
  cover: "UI/UX\nDesign",
  icon: "cursor",
  onShelf: true,
  intro: "Research-driven product design: mobile apps, prototypes and website redesigns.",
  entries: [
    {
      id: "tap-in",
      title: "Tap In",
      subtitle: "Music Social App",
      icon: "note",
      logo: "assets/icons/tapin-logo.svg",
      tagline: "A music promotion & discovery platform",
      blurb: "A mobile platform that helps artists grow their presence while empowering listeners to discover, discuss and share fresh sounds.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Case Study · Mobile App" },
            { t: "title", text: "Tap In", sub: "Music promotion & discovery platform", logo: "assets/icons/tapin-logo.svg" },
            {
              t: "p",
              lead: true,
              text: "Music is growing in unique ways, yet emerging talent often struggles to find dedicated room to flourish. Tap In is a music promotion & discussion platform designed to help artists grow their presence while empowering listeners to discover fresh sounds.",
            },
            {
              t: "meta",
              rows: [
                ["Role", "Project Lead · UX/UI Designer"],
                ["Timeline", "Jan – Apr 2026 (Interaction Design II) · May 2026 – present"],
                ["Team", "Led a team of three for the prototype; now leading a team of developers"],
                ["Method", "Lean UX"],
              ],
            },
            { t: "tags", title: "Tools", items: ["Figma", "FigJam", "Front-end", "Back-end"] },
          ],
          right: [
            {
              t: "gallery",
              phone: true,
              cols: 3,
              images: [
                img("tapin-home", "Tap In home feed screen"),
                img("tapin-genre", "Tap In genre page screen"),
                img("tapin-song", "Tap In song discussion screen"),
              ],
            },
            {
              t: "list",
              title: "My contributions",
              items: [
                "Project leadership, product planning and team priorities",
                "Primary and sole UI designer: user flows, interfaces, prototypes and design system",
                "Front-end and back-end development alongside the dev team",
                "User interviews and usability testing to guide product decisions",
              ],
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Research" },
            { t: "h", text: "The problem" },
            {
              t: "p",
              text: "The modern music industry lacks a dedicated, unified space for organic grassroots discovery and authentic community engagement.",
            },
            {
              t: "list",
              items: [
                "Growth is increasingly difficult for independent artists in an oversaturated streaming landscape.",
                "Discovery feels fractured across algorithms that prioritise viral hits over personal resonance.",
                "Artists and fans are forced onto general-purpose social platforms not tailored to music creators.",
                "Aspiring creatives struggle to find collaborative networking channels to produce new work.",
              ],
            },
          ],
          right: [
            { t: "kicker", text: "Solutions" },
            {
              t: "feature",
              icon: "star",
              title: "Spotlight",
              text: "Equitable exposure for artists while helping listeners discover new artists, tracks and genres.",
              img: img("spotlight", "Spotlight feature card in Tap In"),
              noFlip: true,
            },
            {
              t: "feature",
              icon: "sparkle",
              title: "Randomization",
              text: "Randomised track suggestions turn exploration into a gamified journey that elevates under-the-radar songs.",
              img: img("randomization", "Randomized song player in Tap In"),
              noFlip: true,
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Solutions" },
            {
              t: "feature",
              icon: "chat",
              title: "Connecting",
              text: "Direct creative networking for collaborations, studio sessions and feedback through streamlined messaging.",
              img: img("dms-full", "Tap In direct messages inbox"),
              noFlip: true,
            },
            {
              t: "feature",
              icon: "chat",
              title: "Discussions",
              text: "A purpose-built hub to share reviews, track breakdowns and playlists with contextual listening tools.",
              img: img("reply1", "Discussion post with a song attached"),
              noFlip: true,
            },
          ],
          right: [
            {
              t: "feature",
              icon: "globe",
              title: "Community",
              text: "Genre-based sub-communities and fan spaces, filling the void left by fragmented mainstream groups.",
              img: img("communities1", "Tap In communities and announcements"),
              noFlip: true,
            },
            { t: "h", text: "Design decisions" },
            {
              t: "list",
              items: [
                "Blended retro OS aesthetics with a modern design system.",
                "Rich micro-interactions built with Figma components, variants and interactive states.",
                "Scoped an MVP to protect quality within fixed semester deadlines.",
              ],
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Reflection" },
            { t: "h", text: "Lessons learned" },
            {
              t: "list",
              icon: "sparkle",
              items: [
                "Genuine project management means clear delegation, open communication and aligning work with each teammate's strengths.",
                "Learning to scale back features gracefully protected product quality without sacrificing the core vision.",
                "Open-ended prompts in interviews and usability tests unlocked our most valuable breakthroughs.",
                "Just like stepping away from a mix, taking breaks prevents burnout and sharpens design output.",
              ],
            },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "Full case study.", ratio: "3 / 4" },
          ],
        },
      ],
    },
    {
      id: "reel",
      title: "Reel",
      subtitle: "Movie Review App",
      icon: "clapper",
      logo: "assets/icons/reel.svg",
      tagline: "A movie & show discussion app",
      blurb: "A collaborative mobile prototype for film, TV and anime fans to discover, discuss and review what they watch.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Case Study · Mobile App" },
            { t: "title", text: "Reel", sub: "Movie & TV discussion and review app", logo: "assets/icons/reel.svg" },
            {
              t: "p",
              lead: true,
              text: "Letterboxd is the go-to movie review platform, but television and anime fans are often left underserved. Reel is a collaborative mobile prototype designed to challenge conventions in film and TV discussion.",
            },
            {
              t: "meta",
              rows: [
                ["Course", "Interaction Design I · university team project"],
                ["Timeline", "Aug – Nov 2025"],
                ["Method", "Goal-Directed Design"],
                ["Tools", "Figma, FigJam"],
              ],
            },
            {
              t: "list",
              title: "My contributions",
              items: ["User research & interviews", "Product design documentation", "Prototyping", "Usability testing"],
            },
          ],
          right: [
            {
              t: "gallery",
              phone: true,
              cols: 3,
              images: [
                img("reel-home", "Reel home feed with friends' reviews"),
                img("reel-releases", "Reel release calendar screen"),
                img("reel-reply", "Reel show page with discussion"),
              ],
            },
            { t: "h", text: "The problem" },
            {
              t: "list",
              items: [
                "Existing platforms focus on feature films, leaving TV series and episodic storytelling neglected.",
                "Letterboxd poses a steep learning curve for casual users and a dated interface hierarchy.",
                "Limited real-time social engagement and community discussion.",
              ],
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Solutions" },
            {
              t: "feature",
              icon: "film",
              title: "Inclusion",
              text: "A unified feed celebrating films, TV shows and anime alike.",
              img: img("reel-home1-v2", "Reel unified feed"),
              large: true,
            },
            {
              t: "feature",
              icon: "sparkle",
              title: "Clean UI",
              text: "Streamlined layout for immediate learnability: direct ratings, cast notes and episode guides.",
              img: img("show-screen-v2", "Reel show detail screen"),
              large: true,
            },
          ],
          right: [
            {
              t: "feature",
              icon: "chat",
              title: "Discussions",
              text: "Conversational threads and spoiler-shielded replies matching familiar social patterns.",
              img: img("reel-reply1-v2", "Reel reply composer"),
              large: true,
            },
            {
              t: "feature",
              icon: "compass",
              title: "Discoverability",
              text: "Release schedules showing premiere dates and streaming availability in one place.",
              img: img("reel-releases1-v2", "Reel releases calendar"),
              large: true,
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Reflection" },
            { t: "h", text: "Lessons learned" },
            {
              t: "list",
              icon: "sparkle",
              items: [
                "As a dedicated collaborator, navigating conflicting viewpoints sharpened my active listening and consensus skills.",
                "Design tokens and variables belong on day one - adding dark mode late showed why.",
                "Detailed sprint backlogs make sure high-impact features are planned early, not rushed.",
                "File hygiene - named frames, auto layout, organised libraries - prevents compounding design debt.",
              ],
            },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "Reel website rebrand.", ratio: "4 / 3" },
            { t: "placeholder", label: "Coming soon", note: "Full case study.", ratio: "16 / 9" },
          ],
        },
      ],
    },
    {
      id: "mixr",
      title: "Mixr",
      subtitle: "Music Discovery Prototype",
      icon: "headphones",
      logo: "assets/icons/mixr.svg",
      tagline: "A new way to discover music",
      blurb: "Senior Capstone group project: a music discovery platform built for discussion, tailored feeds and learnability.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Capstone · Mobile App" },
            { t: "title", text: "Mixr", sub: "A new way to discover music", logo: "assets/icons/mixr.svg" },
            {
              t: "p",
              lead: true,
              text: "Finding new music can be a drag in an oversaturated environment. Mixr helps users discover new music on a platform built for discussion. A group project for our Senior Capstone Showcase, following Goal-Directed Design to conduct research, user interviews and usability tests.",
            },
            {
              t: "meta",
              rows: [
                ["Course", "Senior Capstone Showcase"],
                ["Timeline", "Jan – Apr 2026"],
                ["Method", "Goal-Directed Design"],
                ["Tools", "Figma, FigJam, Google Forms, Google Docs"],
              ],
            },
          ],
          right: [
            {
              t: "gallery",
              phone: true,
              cols: 3,
              images: [
                img("mixr-home", "Mixr home screen"),
                img("mixr-community", "Mixr fan community page"),
                img("mixr-review", "Mixr album review screen"),
              ],
            },
            { t: "h", text: "The problem" },
            {
              t: "list",
              items: [
                "Mainstream suggestions are hit or miss, serving what is popular instead of what fits the listener.",
                "Discussion is limited, if it exists at all.",
                "Features are often locked behind a paywall.",
                "Platforms often have poor learnability.",
              ],
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Solutions" },
            {
              t: "feature",
              icon: "sparkle",
              title: "Tailored feeds",
              text: "Feeds based on interests chosen at sign-up and on interactions across the platform.",
              img: img("mixer-info-v2", "Mixr onboarding genre selection"),
              large: true,
            },
            {
              t: "feature",
              icon: "chat",
              title: "Expanded discussion",
              text: "Fan pages dedicated to music discussion beyond the review features.",
              img: img("mixr-community1-v2", "Mixr fan page"),
              large: true,
            },
          ],
          right: [
            {
              t: "feature",
              icon: "star",
              title: "Open platform",
              text: "Nothing is locked behind a paywall - everyone can take part in every feature.",
              img: img("mixer-profile1-v2", "Mixr profile page"),
              large: true,
            },
            {
              t: "feature",
              icon: "layers",
              title: "Simplistic UI",
              text: "Clearly labelled items ease new users onto the platform.",
              img: img("mixer-review-v2", "Mixr review screen"),
              large: true,
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Reflection" },
            { t: "h", text: "Lessons learned" },
            {
              t: "list",
              icon: "sparkle",
              items: [
                "Spring 2026 meant leading Tap In, collaborating on Mixr, curating my portfolio and Visual Design II studio work - I learned to prioritise and balance parallel workstreams.",
                "Every team has its own dynamic; adapting taught me to communicate with empathy and harmonise perspectives.",
                "Rather than waiting for direction, we used user feedback and goal-directed milestones to set our own roadmap.",
                "Flexibility is a design asset: pivoting decisively kept our momentum from kickoff to showcase.",
              ],
            },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "Full case study.", ratio: "3 / 4" },
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// DEVELOPMENT
// ---------------------------------------------------------------------------
const dev: Book = {
  id: "dev",
  title: "Dev",
  cover: "Dev",
  icon: "code",
  onShelf: true,
  intro: "Front-end builds, apps, databases and game development.",
  entries: [
    {
      id: "tap-in-dev",
      title: "Tap In",
      subtitle: "App Development",
      icon: "phone",
      logo: "assets/icons/tap-in-music.svg",
      tagline: "From prototype to product",
      blurb: "Taking Tap In from a Figma prototype to a working product with a team of developers.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Product Development" },
            { t: "title", text: "Tap In", sub: "From prototype to product", logo: "assets/icons/tap-in-music.svg" },
            {
              t: "p",
              lead: true,
              text: "Since May 2026 I've led a team of developers building Tap In, a music discussion and discovery application, while serving as its primary UI designer.",
            },
            {
              t: "list",
              title: "Development role",
              items: [
                "Contribute to front-end and back-end development.",
                "Collaborate with developers to translate designs into functional product features.",
                "Balance user needs with technical constraints while managing priorities.",
              ],
            },
            { t: "links", links: [{ label: "Visit waitlist", href: LINKS.tapin, icon: "external" }] },
          ],
          right: [
            {
              t: "gallery",
              phone: true,
              cols: 3,
              images: [
                img("tapin-dev-home", "Tap In - Home feed screen"),
                img("tapin-dev-feed", "Tap In - Post feed screen"),
                img("tapin-dev-profile", "Tap In - User profile screen"),
              ],
            },
            {
              t: "gallery",
              phone: true,
              cols: 2,
              images: [
                img("tapin-dev-artist", "Tap In - Artist profile screen"),
                img("tapin-dev-song", "Tap In - Song discussion screen"),
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cjc-music",
      title: "CJC Music",
      subtitle: "Music Brand Website",
      icon: "note",
      logo: "assets/icons/cjcmusic.svg",
      tagline: "Frontend Development II · Oct – Nov 2025",
      blurb: "A responsive site for an independent music brand with JS audio controls, a canvas background and parallax.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Front-End · Website" },
            { t: "title", text: "CJC Music", sub: "Independent music brand website", logo: "assets/icons/cjcmusic.svg" },
            {
              t: "p",
              lead: true,
              text: "A digital platform for an independent music brand co-founded with creative peers. The project focused on responsive layouts, interactive JavaScript audio controls and visual depth through parallax scrolling.",
            },
            { t: "meta", rows: [["Course", "Frontend Development II"], ["Timeline", "October – November 2025"]] },
            { t: "tags", title: "Built with", items: ["HTML", "CSS", "JavaScript"] },
            { t: "links", links: [{ label: "Visit CJC live", href: LINKS.cjc, icon: "external" }] },
          ],
          right: [
            { t: "image", img: img("cjc-home", "CJC Music home page on desktop"), maxH: 260, fit: "contain", bare: true },
            {
              t: "list",
              title: "What I built",
              items: [
                "Animated, canvas-driven JavaScript background",
                "Custom JS hamburger menu with accessible transitions",
                "Fluid mobile and desktop breakpoints",
                "Multi-layer, scroll-linked parallax",
                "Interactive audio player to preview tracks",
              ],
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Mobile View" },
            {
              t: "p",
              text: "Responsive media queries keep the hierarchy and tap targets comfortable on phones and widescreen monitors alike.",
            },
            { t: "image", img: img("cjc-mobile", "CJC Music on a phone"), maxH: 400, fit: "contain" },
          ],
          right: [
            { t: "image", img: img("cjc-mobile1", "CJC Music mobile navigation"), maxH: 220, fit: "contain" },
            { t: "placeholder", label: "Coming soon", note: "Interaction recordings.", ratio: "16 / 9" },
          ],
        },
      ],
    },
    {
      id: "baratie",
      title: "The Baratie",
      subtitle: "Restaurant Website",
      icon: "monitor",
      logo: "assets/icons/thebaratie.svg",
      tagline: "Frontend Development I · April 2025",
      blurb: "A customised, responsive Bootstrap site inspired by One Piece's iconic ocean restaurant.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Front-End · Website" },
            { t: "title", text: "The Baratie", sub: "Anime restaurant website", logo: "assets/icons/thebaratie.svg" },
            {
              t: "p",
              lead: true,
              text: "A fully customised, responsive site built on Bootstrap components. Drawing inspiration from One Piece, I transformed standard templates into a vibrant, whimsical experience for the ocean restaurant The Baratie.",
            },
            { t: "meta", rows: [["Course", "Frontend Development I"], ["Timeline", "April 2025"]] },
            {
              t: "list",
              title: "What I learned",
              items: ["Web framework customisation", "Responsive utility classes", "Translating anime iconography into interactive UI"],
            },
          ],
          right: [
            { t: "image", img: img("baratie-home", "The Baratie website home page"), maxH: 300, fit: "contain", bare: true },
            { t: "tags", title: "Built with", items: ["HTML", "CSS", "Bootstrap"] },
            { t: "links", links: [{ label: "Visit The Baratie", href: LINKS.baratie, icon: "external" }] },
          ],
        },
      ],
    },
    {
      id: "os-portfolio",
      title: "Old portfolio",
      subtitle: "Portfolio v1",
      icon: "monitor",
      tagline: "Personal Project · Apr 2026",
      blurb: "My previous portfolio: a retro operating-system desktop with draggable windows.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Personal Project · Apr 2026" },
            { t: "title", text: "Old portfolio", sub: "Retro desktop portfolio", icon: "monitor" },
            {
              t: "p",
              lead: true,
              text: "As much as I liked (more like tolerated) my old portfolio, I felt like I could push the boundaries of my creativeness to create something even better. Hence, my current cozy shelf portfolio. That being said, I still want to highlight and archive it somewhere. The old Windows XP design with a modern sleek design combined what I strive for in designs. Taking the old and blending it with the new. I wanted it to feel like going through my personal computer with all my projects and unique quirks.",
            },
            {
              t: "list",
              title: "Features",
              items: [
                "Window manager with focus, minimise, maximise and resize",
                "Taskbar and start menu",
                "Music snippets player",
                "Day / night theme toggle",
              ],
            },
            { t: "tags", title: "Built with", items: ["Figma", "HTML", "CSS", "JavaScript", "Node"] },
          ],
          right: [{ t: "placeholder", label: "Coming soon", note: "Gallery.", ratio: "3 / 4" }],
        },
      ],
    },
    {
      id: "dnd-database",
      title: "D&D Database",
      subtitle: "Campaign Database",
      icon: "server",
      tagline: "Personal Project · Jan 2026",
      blurb: "A campaign database for D&D and Monster of the Week to track characters, abilities, lore, and notes.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Personal Project · Jan 2026" },
            { t: "title", text: "D&D Campaign Database", sub: "Campaign database", icon: "server" },
            {
              t: "p",
              lead: true,
              text: "On my off time, I love playing games like D&D (Dungeons and Dragons) and MOTW (Monster of the Week). Being able to have your creativeness shine through is the most appealing part to me. That being said, those games carry a lot of lore and saving notes. That's why I created a database for my friends and I to document everything about our characters, abilities, weapons, connections, locations, groups, and so much more.",
            },
            {
              t: "p",
              text: "By seeing the struggle with trying to remember everything, messy notes, and time wasted on getting the game prepared, I challenged those issues with a straightforward UI that has a strong sense of information architecture to greatly improve the game's flow.",
            },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "Screenshots of the campaign database.", ratio: "4 / 3" },
          ],
        },
      ],
    },
    {
      id: "ghana-language",
      title: "Ghana Language",
      subtitle: "Language Learning",
      icon: "globe",
      tagline: "Personal Project · Oct 2026",
      blurb: "Biribiara Bɔkɔɔ: a personal study app for learning Twi and Fante with voice recordings, notes, and memorization algorithms.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Personal Project · Oct 2026" },
            { t: "title", text: "Ghana Language Learning", sub: "Biribiara Bɔkɔɔ study app", icon: "globe" },
            {
              t: "p",
              lead: true,
              text: "Culture is very important to me and I often try to keep it alive. One thing I started doing again to keep it alive is to speak and better my Twi and Fante, which are languages in Ghana. That's why I made a personal study app for myself called \"Biribiara Bɔkɔɔ\" (Bee-beeyah-boh-koh), meaning \"Everything Cool\" which is my little catchphrase.",
            },
            {
              t: "p",
              text: "I used the Ghanaian flag colors, golden accents relating to the abundance of Gold in Ghana (formerly called the Gold Coast), and Adinkra symbols, which are Akan symbols with deep-rooted meaning. These blended together into a Quizlet-like studying platform where I can input words, phrases, and sentences to study with my own voice recordings, notes, and a studying algorithm to better memorization.",
            },
          ],
          right: [
            {
              t: "gallery",
              cols: 1,
              bare: true,
              fit: "contain",
              images: [
                img("bb-1", "Biribiara Bɔkɔɔ - Flashcards study mode with audio pronunciation"),
                img("bb-2", "Biribiara Bɔkɔɔ - Vocabulary library and phrase mastery list"),
                img("bb-3", "Biribiara Bɔkɔɔ - Side-by-side bilingual parallel text reader"),
              ],
            },
          ],
        },
        {
          left: [
            { t: "spacer" },
            {
              t: "gallery",
              phone: true,
              large: true,
              cols: 2,
              images: [
                img("bb-4", "Biribiara Bɔkɔɔ - Mobile flashcards interface"),
                img("bb-vocab", "Biribiara Bɔkɔɔ - Create New Vocabulary entry modal"),
              ],
            },
            { t: "spacer" },
          ],
          right: [
            { t: "kicker", text: "Features & Stack" },
            {
              t: "list",
              title: "Core features",
              items: [
                "Flashcards with flip interactions, shuffle mode and native audio clips",
                "Vocabulary categorization by word, phrase, and sentence",
                "Mastery tracking: Unrated, Difficult, Good, and Mastered",
                "Custom Akan character bar (ɛ, ɔ, ŋ, Ɲ) for authentic input",
                "Dual-column parallel text reader for bilingual study",
              ],
            },
            { t: "tags", title: "Built with", items: ["Figma", "React", "TypeScript", "Tailwind CSS", "Web Audio API"] },
          ],
        },
      ],
    },
    {
      id: "toy-bin",
      title: "Toy Bin",
      subtitle: "Roblox Game",
      icon: "gamepad",
      tagline: "Personal project · In development",
      blurb: "A Toy Story-inspired game: play as a toy and escape the store before morning.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Dev · Game" },
            { t: "title", text: "Toy Bin", sub: "Roblox game", icon: "gamepad" },
            {
              t: "p",
              lead: true,
              text: "Toy Bin is a Toy Story-inspired game I'm developing where you play as a toy and must escape the store before morning. The game progresses like a movie, with alternate paths for replayability.",
            },
            { t: "p", text: "This personal project draws on my UI/UX, animation, modeling, 3D spatial and sound design skills." },
            { t: "placeholder", label: "Coming soon", note: "Gameplay.", ratio: "5 / 2" },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "In-game screenshots.", ratio: "4 / 3" },
            { t: "placeholder", label: "Coming soon", note: "Play link.", ratio: "16 / 6" },
          ],
        },
      ],
    },
  ],
};



// ---------------------------------------------------------------------------
// MUSIC
// ---------------------------------------------------------------------------
const music: Book = {
  id: "music",
  title: "Music",
  cover: "Music",
  icon: "note",
  onShelf: true,
  intro: "Music production and audio mixing.",
  entries: [
    {
      id: "production",
      title: "Music Production",
      subtitle: "Audio Mixing",
      icon: "headphones",
      tagline: "Beats from the Joë Collection",
      blurb: "Music production and audio mixing - press play on a few snippets.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Audio" },
            { t: "title", text: "Music Production", sub: "Production & audio mixing", icon: "headphones" },
            {
              t: "p",
              lead: true,
              text: "Music production and audio mixing are part of how I create. These snippets come from my Joë Collection.",
            },
            { t: "image", img: img("royal-cover", "Royal cover art: Joseph in a white tank top against a purple glow, Isaiah 62:3"), fit: "contain", maxH: 260 },
          ],
          right: [{ t: "audio", title: "Joë Collection", tracks: TRACKS }],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// CREATIVE WORK
// ---------------------------------------------------------------------------
const creative: Book = {
  id: "creative",
  title: "Creative Work",
  cover: "Creative\nWork",
  icon: "palette",
  onShelf: true,
  intro: "Branding, typography, cover art, illustration, architecture, Photoshop, animation and freelance work.",
  entries: [
    {
      id: "milestone",
      title: "Milestone Rebrand",
      subtitle: "Branding & Comics",
      icon: "brush",
      logo: "assets/icons/soul.svg",
      tagline: "Visual Design II · Mar – Apr 2026",
      blurb: "A web rebrand, an original character and series (SOUL), and a variant cover for Milestone Media.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Branding · Illustration" },
            { t: "title", text: "Milestone Comics", sub: "Rebrand", logo: "assets/icons/soul.svg" },
            {
              t: "p",
              lead: true,
              text: "Milestone Media was founded in 1993 by Black creatives to address the exclusion of Black characters and storytellers in mainstream comics. Its legends returned to DC continuity, and the brand called for a revamp.",
            },
            {
              t: "list",
              title: "Three deliverables",
              items: ["Rebranding the web presence", "An original character & comic series: SOUL", "A variant cover for “The Dakota Incident”"],
            },
            { t: "meta", rows: [["Course", "Visual Design II"], ["Timeline", "March – April 2026"], ["Tools", "Figma, Photoshop, Paint.net"]] },
          ],
          right: [
            { t: "image", img: img("milestone-home", "Redesigned Milestone Media home page"), maxH: 220, bare: true },
            {
              t: "gallery",
              cols: 2,
              bare: true,
              fit: "contain",
              images: [img("soul-left", "SOUL cover art"), img("variant-right", "Dakota Incident variant cover")],
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Website Rebrand" },
            {
              t: "p",
              text: "The original site felt tied to standard newsprint. Preserving the signature white, black and red palette with comic-panel collages, I built an interface with a true “Rebirth” feel - heroes break through dynamic panels while the layout reads with the rhythm of a comic book.",
            },
            {
              t: "gallery",
              title: "Old design",
              cols: 2,
              stackMobile: true,
              images: [img("old-milestone", "Original Milestone site"), img("old-milestone2", "Original Milestone story page"), img("old-milestone3", "Original Milestone news page")],
            },
          ],
          right: [
            { t: "kicker", text: "New Design" },
            {
              t: "gallery",
              cols: 1,
              large: true,
              images: [img("new-milestone1", "Redesigned hero"), img("new-milestone2", "Redesigned story section"), img("new-milestone3", "Redesigned comics section")],
            },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Original Series" },
            { t: "h", text: "SOUL" },
            {
              t: "p",
              text: "Milestone champions Black culture, but as someone with heritage from Ghana, I felt West African influences were underrepresented. SOUL follows Benjamin “Benji” Boateng, a young teen whose family hails from West Africa, who awakens latent spiritual abilities - heightened perception and kinetic movement - and discovers not every spirit around him is benevolent.",
            },
            {
              t: "list",
              items: [
                "Benji's silhouette glows with internal energy - who he is within.",
                "The sharp red accent keeps synergy with the Milestone universe.",
                "West African line art inside the silhouette weaves heritage into the hero.",
              ],
            },
          ],
          right: [{ t: "image", img: img("soul", "SOUL comic cover with West African line art"), maxH: 430, fit: "contain" }],
        },
        {
          left: [
            { t: "kicker", text: "Variant Cover" },
            { t: "h", text: "The Dakota Incident" },
            {
              t: "p",
              text: "To celebrate the Milestone and DC crossover, I designed a collector-grade variant cover for “New History of the DC Universe: The Dakota Incident”, highlighting the core heroes uniting against new threats.",
            },
          ],
          right: [{ t: "image", img: img("variant", "Dakota Incident variant cover"), maxH: 430, fit: "contain" }],
        },
      ],
    },
    {
      id: "alverata",
      title: "Alverata",
      subtitle: "Typeface Poster",
      icon: "type",
      logo: "assets/icons/alverata.svg",
      tagline: "Visual Design II · Feb 2026",
      blurb: "A typeface specimen evoking an old, weathered Greek look.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Typography" },
            { t: "title", text: "Alverata", sub: "Typeface assignment", logo: "assets/icons/alverata.svg" },
            {
              t: "p",
              lead: true,
              text: "This piece kept evolving as I worked on it, incorporating ideas I initially thought wouldn't work. Focusing on multiple Greek styles instead of one helped fill the page. A grid for structure, contrast of designs and asymmetry for the man-made element bring an old, weathered Greek look to mind.",
            },
            { t: "meta", rows: [["Course", "Visual Design II"], ["Date", "February 2026"]] },
          ],
          right: [{ t: "image", img: img("alverata-typeface", "Alverata typeface specimen poster"), maxH: 430, fit: "contain" }],
        },
      ],
    },
    {
      id: "covers",
      title: "Cover Art",
      subtitle: "Music Covers",
      icon: "note",
      tagline: "Song & album artwork",
      blurb: "Cover artwork that captures the feel of each song.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Cover Artwork" },
            { t: "title", text: "Music Covers", sub: "2025", icon: "note" },
            {
              t: "p",
              lead: true,
              text: "A few music covers made with various Adobe tools. Each cover encapsulates the feel and thematic value of the song attached to it.",
            },
            { t: "p", text: "As a freelancer I also create song and album cover artwork for artists to visually represent their music." },
          ],
          right: [{ t: "image", img: img("music-covers", "Grid of four music cover artworks"), maxH: 430, fit: "contain" }],
        },
      ],
    },
    {
      id: "cjc-brand",
      title: "CJC Identity",
      subtitle: "Brand System",
      icon: "sparkle",
      logo: "assets/icons/cjcmusic.svg",
      tagline: "Visual Design I",
      blurb: "Logomark, type scale, iconography and palette for the CJC music brand.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Brand Identity" },
            { t: "title", text: "CJC Music", sub: "Brand identity & design system", logo: "assets/icons/cjcmusic.svg" },
            {
              t: "p",
              lead: true,
              text: "A Visual Design I study defining the turntable-inspired CJC logomark, typography scale, iconography and monochromatic colour palette - later used for the CJC website.",
            },
            { t: "goto", label: "See the CJC website build", entry: "dev/cjc-music" },
          ],
          right: [{ t: "image", img: img("brand-assignment", "CJC brand identity board"), maxH: 360, fit: "contain" }],
        },
      ],
    },
    {
      id: "freelance",
      title: "Freelance",
      subtitle: "Sites, Apps & Editing",
      icon: "camera",
      tagline: "Designer, Developer & Editor · 2016 – present",
      blurb: "Websites, church media and photo and video editing for clients.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Freelance · 2016 – present" },
            { t: "title", text: "Freelance Work", sub: "Sites, apps & editing", icon: "camera" },
            {
              t: "p",
              text: "Client work across sites, apps and editing: redesigning MarthaEDU's website for usability and accessibility, and recording, photographing and editing sermons and events for All Nations Church NW. I also edit videos, photos, thumbnails and cover art for creators and artists.",
            },
            { t: "h", text: "MarthaEDU" },
            {
              t: "image",
              img: { src: "assets/projects/marthaedu.mp4", poster: "assets/projects/marthaedu-poster.webp", alt: "Scrolling through the Martha Educational Foundation website" },
              fit: "contain",
            },
          ],
          right: [
            { t: "h", text: "All Nations Church NW" },
            { t: "placeholder", label: "Coming soon", note: "Church media photos and edits.", ratio: "2 / 1" },
          ],
        },
      ],
    },
    {
      id: "photoshop",
      title: "Photoshop",
      subtitle: "Photo Editing",
      icon: "layers",
      tagline: "Adobe Photoshop",
      blurb: "Photo editing and image alteration in Photoshop.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Photoshop" },
            { t: "title", text: "Photoshop", sub: "Photo editing & manipulation", icon: "layers" },
            { t: "p", text: "Photo editing and image alteration in Photoshop: manga and anime blends, album cover recreations and composites." },
            { t: "gallery", cols: 2, square: true, images: [img("ps-01", "Manga Anime blend Bleach Grimmjow Jaegerjaquez"), img("ps-02", "Demon Slayer Zenitsu Agatsuma")] },
          ],
          right: [{ t: "gallery", cols: 2, square: true, images: [img("ps-03", "Demon Slayer Kyōjurō Rengoku"), img("ps-04", "Minecraft Death inventory"), img("ps-05", "Miles Morales Building side shot"), img("ps-06", "Demon Slayer Tengen Uzui")] }],
        },
        {
          left: [{ t: "gallery", cols: 1, square: true, images: [img("ps-07", "J. Cole 2014 Forest Hills Drive Album Cover"), img("ps-08", "Tyler, The Creator Call Me If You Get Lost Album Cover")] }],
          right: [{ t: "gallery", cols: 1, square: true, images: [img("ps-09", "Demon Slayer Kaigaku"), img("ps-10", "Rurouni Kenshin Himura Kenshin with reverse blade")] }],
        },
      ],
    },
    {
      id: "drawing",
      title: "Drawing",
      subtitle: "Foundation Studies",
      icon: "pencil",
      tagline: "Drawing I · Spring 2025",
      blurb: "Studies in light, shadow, value and form.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Drawing I · Spring 2025" },
            { t: "title", text: "Foundation Drawing", sub: "Light, shadow & form", icon: "pencil" },
            {
              t: "p",
              text: "Spheres: a study in light, shadow and continuous gradient rendering - core shadow, reflected light and specular highlights in pencil on tonal paper.",
            },
            { t: "image", img: img("sphere", "Pencil studies of shaded spheres"), maxH: 250, fit: "contain" },
          ],
          right: [
            { t: "p", text: "Shading practice: value transitions, edge control and surface texture across planar solids, then cross-hatching densities and atmospheric depth." },
            { t: "gallery", cols: 1, large: true, images: [img("shading", "Still-life shading practice"), img("shading2", "Shading practice with cross-hatching")] },
          ],
        },
      ],
    },
    {
      id: "architecture",
      title: "Architecture",
      subtitle: "Studio & CAD",
      icon: "columns",
      tagline: "Studio I · AutoCAD · Revit",
      blurb: "Architectural studio work, perspective drawing, AutoCAD and Revit.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Studio I · 2025" },
            { t: "title", text: "One Story Lair", sub: "Architectural studio project", icon: "columns" },
            {
              t: "p",
              lead: true,
              text: "We were given various shapes to put together. It was later revealed that we would have to make a space out of it, evolving the composition into a final building.",
            },
            { t: "tags", title: "Focus", items: ["Massing", "Spatial design", "Physical modeling"] },
          ],
          right: [{ t: "image", img: img("architecture-lair", "One Story Lair model and drawings"), maxH: 420, fit: "contain" }],
        },
        {
          left: [
            { t: "kicker", text: "Studio I · Drawing" },
            { t: "title", text: "Two-Point Perspective", sub: "Architectural exterior study", icon: "ruler" },
            {
              t: "p",
              lead: true,
              text: "A linear two-point perspective exterior study examining massing, structural cantilevers, vanishing-point convergence and architectural spatial proportion.",
            },
          ],
          right: [{ t: "image", img: img("perspective", "Two-point perspective drawing of a building"), maxH: 420, fit: "contain" }],
        },
        {
          left: [
            { t: "kicker", text: "Software" },
            { t: "title", text: "AutoCAD & Revit", sub: "Drafting and BIM", icon: "layers" },
            { t: "p", text: "Certified in AutoCAD and Revit." },
            { t: "tags", title: "Certifications", items: ["AutoCAD", "Revit"] },
            { t: "placeholder", label: "Coming soon", note: "Plan / section drawing.", ratio: "4 / 3" },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "Revit model.", ratio: "4 / 3" },
            { t: "placeholder", label: "Coming soon", note: "3D visualisation.", ratio: "16 / 9" },
          ],
        },
      ],
    },
    {
      id: "3d-animation",
      title: "Animation",
      subtitle: "Blender & Mocap",
      icon: "cube",
      tagline: "Blender · Cycles · Motion capture",
      blurb: "3D modeling, rendering, animation, motion capture and game assets.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "3D" },
            { t: "title", text: "Blender Modeling", sub: "Modeling & Cycles rendering", icon: "cube" },
            { t: "p", text: "3D modeling in Blender, rendered with Cycles." },
            { t: "placeholder", label: "Coming soon", note: "Hero render.", ratio: "4 / 3" },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "Wireframe / clay pass.", ratio: "4 / 3" },
            { t: "placeholder", label: "Coming soon", note: "Render breakdown.", ratio: "16 / 7" },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Animation" },
            { t: "title", text: "Animation & Mocap", sub: "Movement and timing", icon: "film" },
            { t: "p", text: "Animation and motion-capture projects." },
            { t: "placeholder", label: "Coming soon", note: "Animation reel.", ratio: "16 / 9" },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "Motion-capture session.", ratio: "4 / 3" },
            { t: "placeholder", label: "Coming soon", note: "Process notes.", ratio: "16 / 6" },
          ],
        },
        {
          left: [
            { t: "kicker", text: "Assets" },
            { t: "title", text: "Game Assets", sub: "& visual experiments", icon: "gamepad" },
            { t: "p", text: "Game-related 3D assets and visual experiments." },
            { t: "placeholder", label: "Coming soon", note: "Asset sheet.", ratio: "4 / 3" },
          ],
          right: [
            { t: "placeholder", label: "Coming soon", note: "Experiment 01.", ratio: "4 / 3" },
            { t: "placeholder", label: "Coming soon", note: "Experiment 02.", ratio: "4 / 3" },
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// JOURNAL (About + Contact) - lives on the desk, not on the shelf
// ---------------------------------------------------------------------------
const journal: Book = {
  id: "journal",
  title: "Journal",
  cover: "Journal",
  icon: "book",
  onShelf: true,
  intro: "About me, my resume, skills and how to get in touch.",
  entries: [
    {
      id: "about",
      title: "About Me",
      subtitle: "Joseph K. Buadoo",
      icon: "user",
      tagline: "Interactive Designer & Creative Developer",
      blurb: "Designer, developer and lifelong learner pushing what modern design can be.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "About" },
            { t: "title", text: "Joseph K. Buadoo", sub: "Interactive Designer & Creative Developer", icon: "user" },
            {
              t: "p",
              lead: true,
              text: "Hey, I'm Joseph - and clearly based off my portfolio, I love picking up new things. Being creative in new ways has been my motto from a young age, and I believe that's what design needs today.",
            },
            {
              t: "p",
              text: "I love combining things to create whole new possibilities while pushing uniqueness. Instead of following the status quo, how will we know what'll work unless we try?",
            },
          ],
          right: [
            { t: "quote", text: "People who say it cannot be done should not speak for those who are doing it." },
            {
              t: "meta",
              rows: [
                ["Education", "B.S. Interactive Design, Kennesaw State University (May 2026)"],
                ["Based", "Kennesaw, GA"],
              ],
            },
            { t: "goto", label: "Get in touch", entry: "journal/contact" },
            { t: "image", img: { src: "assets/photos/about-ksu.webp", alt: "Joseph in his graduation gown and kente stole standing on the Kennesaw State University logo" }, fit: "contain", maxH: 205 },
          ],
        },
      ],
    },
    {
      id: "resume",
      title: "Resume",
      subtitle: "Experience",
      icon: "book",
      tagline: "Where I've worked",
      blurb: "Roles in UX design, front-end development, project leadership and media.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Experience" },
            { t: "h", text: "Project Lead / UX/UI Designer" },
            { t: "meta", rows: [["Tap In", "May 2026 – present"]] },
            { t: "p", text: "Lead a team of developers building Tap In as primary and sole UI designer; contribute to front-end and back-end development; run user interviews and usability tests." },
            { t: "h", text: "UX/UI Designer & Front-End Developer" },
            { t: "meta", rows: [["New Creative Living", "July 2026"]] },
            { t: "p", text: "Designed and developed a real estate website for an older user demographic." },
            { t: "h", text: "UX Designer" },
            { t: "meta", rows: [["MarthaEDU · Remote", "Oct 2024 – present"]] },
            { t: "p", text: "Redesigned an existing website to improve usability, clarity and accessibility." },
          ],
          right: [
            { t: "h", text: "Designer & Editor" },
            { t: "meta", rows: [["Freelance", "Jan 2018 – present"]] },
            { t: "p", text: "YouTube channel assets, video editing, cover artwork and photo editing." },
            { t: "h", text: "Church Staff" },
            { t: "meta", rows: [["All Nations Church NW", "Jan 2016 – present"]] },
            { t: "p", text: "Church media through recording, photography and editing; drums for choir performances." },
            { t: "links", links: [{ label: "Download resume (PDF)", href: LINKS.resume, icon: "download", download: true }] },
          ],
        },
      ],
    },
    {
      id: "skills",
      title: "Skills",
      subtitle: "& Certifications",
      icon: "star",
      tagline: "Toolbox",
      blurb: "Design, research, development and professional skills.",
      spreads: [
        {
          left: [
            { t: "kicker", text: "Skills" },
            { t: "tags", title: "Design", items: ["UI Design", "Visual Design", "Prototyping", "User-Centered Design", "Design Methods"] },
            { t: "tags", title: "Research", items: ["User Research", "Usability Testing"] },
            { t: "tags", title: "Development", items: ["Front-End Development", "HTML", "CSS", "JavaScript", "Bootstrap"] },
            { t: "tags", title: "Professional", items: ["Project Management", "Leadership", "Critical Thinking", "Communication"] },
          ],
          right: [
            { t: "kicker", text: "Certifications" },
            { t: "list", icon: "star", items: ["AutoCAD", "Revit", "CITI", "PMI"] },
            { t: "tags", title: "Tools", items: ["Figma", "FigJam", "Photoshop", "Adobe tools", "Paint.net", "Blender"] },
          ],
        },
      ],
    },
  ],
};

export const BOOKS: Book[] = [uiux, dev, music, creative, journal];
export const SHELF_BOOKS = BOOKS.filter((b) => b.onShelf);
export const getBook = (id: string) => BOOKS.find((b) => b.id === id);
