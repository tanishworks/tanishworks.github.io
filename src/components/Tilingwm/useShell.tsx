import type { ReactNode } from "react";
import { NeofetchOutput, DirListing, EntryListing, ReadmeCard, HelpOutput } from "./content";
import type { Project } from "./content";
import { resolvePath, promptFor } from "./fs";

export interface LineEntry {
  id: number;
  kind: "cmd" | "text" | "err" | "dim" | "node";
  text?: string;
  node?: ReactNode;
  prompt?: string; // only set on kind "cmd" — the prompt as it was when typed
}

export interface WindowState {
  lines: LineEntry[];
  buffer: string;
  cmatrixRunning: boolean;
  cwd: string[]; // [] = home. ["tiling-wm-site"] = inside that project dir.
  history: string[]; // most recent last
  historyIndex: number | null; // null = not currently browsing history
}

let lineId = 0;
const nextId = () => ++lineId;

export function createWindow(initial?: Partial<WindowState>): WindowState {
  return { lines: [], buffer: "", cmatrixRunning: false, cwd: [], history: [], historyIndex: null, ...initial };
}

/** One command's worth of work, isolated so `&&` chains can run several in sequence. */
interface StepResult {
  extra: LineEntry[];
  cwd: string[];
  cmatrixRunning?: boolean;
  clear?: boolean;
}

function execStep(cwd: string[], cmd: string, openProject: (p: Project) => void): StepResult {
  if (cmd === "") return { extra: [], cwd };
  if (cmd === "clear") return { extra: [], cwd, clear: true };
  if (cmd === "help") return { extra: [{ id: nextId(), kind: "node", node: <HelpOutput /> }], cwd };
  if (cmd === "neofetch") return { extra: [{ id: nextId(), kind: "node", node: <NeofetchOutput /> }], cwd };
  if (cmd === "pwd") return { extra: [{ id: nextId(), kind: "text", text: cwd.length ? `~/${cwd.join("/")}` : "~" }], cwd };
  if (cmd === "cmatrix") return { extra: [], cwd, cmatrixRunning: true };

  const lsMatch = cmd.match(/^ls(?:\s+(.+))?$/);
  if (lsMatch) {
    const arg = lsMatch[1]?.trim();
    const res = resolvePath(cwd, arg || ".");
    if (res.type === "notfound")
      return { extra: [{ id: nextId(), kind: "err", text: `ls: cannot access '${arg}': No such file or directory` }], cwd };
    if (res.type === "dir") return { extra: [{ id: nextId(), kind: "node", node: <DirListing dir={res.dir} /> }], cwd };
    return { extra: [{ id: nextId(), kind: "node", node: <EntryListing entries={[res.file]} /> }], cwd };
  }

  const cdMatch = cmd.match(/^cd(?:\s+(.+))?$/);
  if (cdMatch) {
    const arg = cdMatch[1]?.trim();
    if (!arg || arg === "~") return { extra: [], cwd: [] };
    const res = resolvePath(cwd, arg);
    if (res.type === "notfound")
      return { extra: [{ id: nextId(), kind: "err", text: `bash: cd: ${arg}: No such file or directory` }], cwd };
    if (res.type === "file")
      return { extra: [{ id: nextId(), kind: "err", text: `bash: cd: ${arg}: Not a directory` }], cwd };
    return { extra: [], cwd: res.segments };
  }

  const catMatch = cmd.match(/^cat\s+(.+)$/);
  if (catMatch) {
    const arg = catMatch[1].trim();
    const res = resolvePath(cwd, arg);
    if (res.type === "notfound")
      return { extra: [{ id: nextId(), kind: "err", text: `cat: ${arg}: No such file or directory` }], cwd };
    if (res.type === "dir") return { extra: [{ id: nextId(), kind: "err", text: `cat: ${arg}: Is a directory` }], cwd };
    if (res.file.kind !== "md")
      return { extra: [{ id: nextId(), kind: "err", text: `cat: ${arg}: cannot cat a script — try running it` }], cwd };
    return { extra: [{ id: nextId(), kind: "node", node: <ReadmeCard project={res.file.project} /> }], cwd };
  }

  const scriptMatch = cmd.match(/^(?:\.\/)?(.*run\.sh)$/);
  if (scriptMatch) {
    const path = scriptMatch[1];
    const res = resolvePath(cwd, path);
    if (res.type === "notfound")
      return { extra: [{ id: nextId(), kind: "err", text: `bash: ./${path}: No such file or directory` }], cwd };
    if (res.type === "dir") return { extra: [{ id: nextId(), kind: "err", text: `bash: ./${path}: Is a directory` }], cwd };
    if (res.file.kind !== "sh")
      return { extra: [{ id: nextId(), kind: "err", text: `bash: ./${path}: Permission denied` }], cwd };
    openProject(res.file.project);
    return { extra: [], cwd };
  }

  return { extra: [{ id: nextId(), kind: "err", text: `command not found: ${cmd}` }], cwd };
}

/**
 * openProject is called (not returned) when a run.sh succeeds, since opening
 * the modal is a TilingWM-level concern, not something a per-window state
 * update can express on its own.
 *
 * Supports "cmd1 && cmd2 && cmd3" chains: cwd carries over between steps
 * (so `cd foo && cat readme.md` works), and hitting `cmatrix` mid-chain
 * stops processing further steps, same as a real shell where cmatrix
 * runs in the foreground until interrupted.
 */
export function runCommand(state: WindowState, raw: string, openProject: (p: Project) => void): WindowState {
  const trimmed = raw.trim();
  const prompt = promptFor(state.cwd);
  let lines: LineEntry[] = [...state.lines, { id: nextId(), kind: "cmd", text: trimmed, prompt }];

  const history =
    trimmed && trimmed !== state.history[state.history.length - 1] ? [...state.history, trimmed] : state.history;

  if (trimmed === "") return { ...state, lines, buffer: "", history, historyIndex: null };

  const parts = trimmed.split(/\s*&&\s*/).filter((p) => p.length > 0);
  let cwd = state.cwd;
  let cmatrixRunning = false;

  for (const part of parts) {
    const step = execStep(cwd, part, openProject);
    if (step.clear) {
      lines = [];
      cwd = step.cwd;
      continue;
    }
    lines = [...lines, ...step.extra];
    cwd = step.cwd;
    if (step.cmatrixRunning) {
      cmatrixRunning = true;
      break;
    }
  }

  return { ...state, lines, buffer: "", cwd, cmatrixRunning, history, historyIndex: null };
}
