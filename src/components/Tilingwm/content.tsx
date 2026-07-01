// Edit PROJECTS / NEOFETCH_ROWS / FOLDER_ICONS future crucible :).
import { useState } from "react";
import type { FSDir, FSFile } from "./fs";

export const NEOFETCH_ART = [
  // "   .-----------.   ",
  // "  /  ._______.  \\  ",
  // " |   |       |   | ",
  // " |   |  www  |   | ",
  // " |   |_______|   | ",
  // " |_______________| ",
  // "  \\_____________/  ",



" \`*-. ",
"  )  _`-. ",
" .  : `. . ",
" : _   '  \ ",
" ; o` _.   `*-._ ",
" `-.-'          `-. ",
"   ;       `       `. ",
"  :.       .        \ ",
"   . \  .   :   .-'   . ",
"   '  `+.;  ;  '      : ",
"   :  '  |    ;       ;-. ",
"   ; '   : :`-:     _.`* ;",
"  /  .*' ; .*`- +'  `*' ",
" *-*   `*-*  `*-*'",

].join("\n");

export const NEOFETCH_ROWS: { label: string; value: string }[] = [
  { label: "OS", value: "CrucibleOS x86_64" },
  { label: "Host", value: "tanishworks.github.io" },
  { label: "Kernel", value: "6.6.0-tanish" },
  { label: "Uptime", value: "since the day I opened gh-pages idk bro" },
  { label: "Shell", value: "CSH 5.9" },
  { label: "WM", value: "CrucibleWM (this one)" },
  { label: "CPU", value: "Imagine one or smth" },
  { label: "Fun fact", value: "I use Arch, btw"},
  { label: "Also", value: "I made up those numbers but they chill"},
];

export interface Project {
  slug: string; // the directory name, e.g. cd tiling-wm-site
  title: string;
  description: string; // the gist
  tech: string[]; // frameworks / tools
  languages: string[];
  image: string; // put files in /public/projects/ and reference as "/projects/x.png"
  link?: string;
}

// One entry per project. This drives `ls`, `cd`, `cat readme.md`, and `./run.sh`.
export const PROJECTS: Project[] = [
  {
    slug: "lockin",
    title: "LockIn",
    description: "A mobile app combining teen allowances and goals + productivity + chores",
    tech: ["react", "vite"],
    languages: ["typescript", "css"],
    image: "./src/assets/ascii-pfp.svg",
    link: "https://github.com/infinotiver/lockin",
  },
  {
    slug: "dotfiles",
    title: "dotfiles",
    description: "Hyprland + terminal config, kept just clean enough to show people.",
    tech: ["hyprland", "waybar"],
    languages: ["shell", "toml"],
    image: "/projects/dotfiles.png",
  },
  {
    slug: "weekend-hacks",
    title: "weekend-hacks",
    description: "Small experiments that didn't earn their own repo.",
    tech: ["various"],
    languages: ["python", "javascript"],
    image: "/projects/weekend-hacks.png",
  },
];

// A plain boxy glyph for now. You said you'll swap this for a real
// Nerd Font icon
// (check the exact export name in your installed hugeicons package).
export const FOLDER_ICON = "\u{1F5C0}"; // 🗀
const SH_ICON = "\u2699"; // ⚙
const MD_ICON = "\u2261"; // ≡

export function NeofetchOutput() {
  return (
    <div className="neofetch">
      <pre className="nf-art">{NEOFETCH_ART}</pre>
      <div className="nf-info">
        {NEOFETCH_ROWS.map((r) => (
          <div className="nf-row" key={r.label}>
            <span className="nf-key">{r.label}</span>: {r.value}
          </div>
        ))}
        <div className="nf-swatches">
          {["ctp-red", "ctp-peach", "ctp-yellow", "ctp-green", "ctp-blue", "ctp-mauve"].map((c) => (
            <span key={c} className={`swatch ${c}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** `ls` — directories in blue/bold, .sh executables in green/bold, .md files plain. */
export function EntryListing({ entries }: { entries: (FSDir | FSFile)[] }) {
  return (
    <div className="ls-grid">
      {entries.map((c) =>
        c.type === "dir" ? (
          <span className="ls-item ls-dir" key={c.name}>
            <span className="ficon">{FOLDER_ICON}</span>
            {c.name}/
          </span>
        ) : (
          <span className={`ls-item ${c.kind === "sh" ? "ls-exec" : "ls-file"}`} key={c.name}>
            <span className="ficon">{c.kind === "sh" ? SH_ICON : MD_ICON}</span>
            {c.name}
          </span>
        )
      )}
    </div>
  );
}

export function DirListing({ dir }: { dir: FSDir }) {
  return <EntryListing entries={dir.children} />;
}

/** `cat readme.md` — a card: image up top, outlined tech/language chips, short description. */
export function ReadmeCard({ project }: { project: Project }) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="readme-card">
      <div className="readme-card-image">
        {!broken ? (
          <img src={project.image} alt={project.title} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="project-image-placeholder">
            <span>[ no preview ]</span>
          </div>
        )}
      </div>
        <div className="tag-row">
          {project.tech.map((t) => (
            <span className="tag-chip" key={t}>
              {t}
            </span>
          ))}
          {project.languages.map((l) => (
            <span className="tag-chip tag-chip-lang" key={l}>
              {l}
            </span>
          ))}
        </div>
      <div className="readme-card-body">
        <div className="readme-card-title">{project.title}</div>
        <p className="readme-card-desc">{project.description}</p>
      </div>
    </div>
  );
}

export function HelpOutput() {
  const rows: [string, string][] = [
    ["neofetch", "show system info"],
    ["cmatrix", "start the matrix rain (ctrl+c to stop)"],
    ["ls [path]", "list a directory (defaults to cwd)"],
    ["cd <dir>", "enter a project directory (cd .. to go back)"],
    ["cat <path>", "show a file's card, e.g. cat readme.md"],
    ["./run.sh", "run a project, e.g. ./tiling-wm-site/run.sh"],
    ["cmd1 && cmd2", "chain commands, e.g. cd tiling-wm-site && cat readme.md"],
    ["\u2191 / \u2193", "cycle through command history"],
    ["pwd", "print working directory"],
    ["clear", "clear this pane"],
    ["open", "open a new pane   (alt+enter also works)"],
    ["exit", "close this pane   (alt+q also works)"],
  ];
  return (
    <div>
      <div>available commands:</div>
      {rows.map(([c, d]) => (
        <div key={c}>
          {"  "}
          <span className="nf-key">{c}</span> — {d}
        </div>
      ))}
    </div>
  );
}
