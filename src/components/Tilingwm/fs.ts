import type { Project } from "./content";
import { PROJECTS } from "./content";

export interface FSFile {
  type: "file";
  name: string;
  kind: "md" | "sh";
  project: Project;
}
export interface FSDir {
  type: "dir";
  name: string;
  children: (FSDir | FSFile)[];
}

function buildRoot(): FSDir {
  return {
    type: "dir",
    name: "~",
    children: PROJECTS.map((p) => ({
      type: "dir",
      name: p.slug,
      children: [
        { type: "file", name: "readme.md", kind: "md", project: p },
        { type: "file", name: "run.sh", kind: "sh", project: p },
      ],
    })),
  };
}

export const ROOT: FSDir = buildRoot();

export function promptFor(cwd: string[]): string {
  return cwd.length ? `guest@site:~/${cwd.join("/")}$` : "guest@site:~$";
}

/**
 * Turns cwd + a raw path argument ("foldername", "./foldername/readme.md",
 * "../other", "run.sh") into an absolute list of segments from root,
 * resolving "." and ".." along the way. Returns null if ".." would go
 * above root.
 */
function normalizeSegments(cwd: string[], raw: string): string[] | null {
  const segs = raw.split("/").filter((s) => s !== "" && s !== ".");
  const working = raw.startsWith("/") ? [] : [...cwd];
  for (const seg of segs) {
    if (seg === "..") {
      if (working.length === 0) return null;
      working.pop();
    } else {
      working.push(seg);
    }
  }
  return working;
}

export type ResolveResult =
  | { type: "dir"; dir: FSDir; segments: string[] }
  | { type: "file"; file: FSFile; segments: string[] }
  | { type: "notfound" };

/** Resolves any relative/nested path (with . / .. / subdirectories) against cwd. */
export function resolvePath(cwd: string[], raw: string): ResolveResult {
  const working = normalizeSegments(cwd, raw);
  if (!working) return { type: "notfound" };

  let node: FSDir = ROOT;
  for (let i = 0; i < working.length; i++) {
    const seg = working[i];
    const isLast = i === working.length - 1;
    const child = node.children.find((c) => c.name === seg);
    if (!child) return { type: "notfound" };
    if (child.type === "dir") {
      node = child;
    } else if (isLast) {
      return { type: "file", file: child, segments: working };
    } else {
      return { type: "notfound" }; // tried to descend through a file
    }
  }
  return { type: "dir", dir: node, segments: working };
}
