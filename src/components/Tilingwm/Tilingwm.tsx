import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  type LayoutNode,
  type Edge,
  type DropEdge,
  type Path,
  initialLayout,
  removeLeaf,
  insertLeafNextTo,
  swapLeaves,
  updateRatioAtPath,
} from "./layout-tree";
import { Pane } from "./Pane";
import { createWindow, runCommand } from "./useShell";
import type { WindowState } from "./useShell";
import type { Project } from "./content";
import { ProjectModal } from "./ProjectModal";
import { promptFor } from "./fs";
import "./Tilingwm.css";

type WindowMap = Record<string, WindowState>;
const noopOpenProject = () => {};

function makeInitialWindows(): WindowMap {
  return {
    w1: runCommand(createWindow(), "neofetch", noopOpenProject),
    w2: createWindow({ cmatrixRunning: true }),
    w3: createWindow(),
  };
}

interface DropTarget {
  windowId: string;
  edge: Edge;
}

export function TilingWM() {
  const [tree, setTree] = useState<LayoutNode>(initialLayout);
  const [windows, setWindows] = useState<WindowMap>(makeInitialWindows);
  const [focusedWindowId, setFocusedWindowId] = useState<string>("w1");
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // refs so the global keydown listener always sees current state
  // without needing to rebind on every keystroke
  const focusedRef = useRef(focusedWindowId);
  focusedRef.current = focusedWindowId;
  const windowsRef = useRef(windows);
  windowsRef.current = windows;
  const activeProjectRef = useRef(activeProject);
  activeProjectRef.current = activeProject;

  // one shared clock drives every pane's cursor, so they all blink in sync
  // instead of each pane's CSS animation starting on its own mount time
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const id = window.setInterval(() => setCursorVisible((v) => !v), 530);
    return () => window.clearInterval(id);
  }, []);

  // counter for new windows opened at runtime — w1/w2/w3 are the starting three
  const nextWindowId = useRef(4);

  const openWindow = useCallback(() => {
    const id = `w${nextWindowId.current++}`;
    // alternate the split direction so new panes dwindle row/col like a real WM
    // instead of always stacking the same way
    const edge: DropEdge = nextWindowId.current % 2 === 0 ? "right" : "bottom";
    setWindows((w) => ({ ...w, [id]: createWindow() }));
    setTree((t) => insertLeafNextTo(t, focusedRef.current, id, edge));
    setFocusedWindowId(id);
  }, []);

  const closeWindow = useCallback((id: string) => {
    if (Object.keys(windowsRef.current).length <= 1) return; // always keep one window open
    setWindows((w) => {
      const { [id]: _omit, ...rest } = w;
      return rest;
    });
    setTree((t) => removeLeaf(t, id));
    setFocusedWindowId((prev) => {
      if (prev !== id) return prev;
      const remaining = Object.keys(windowsRef.current).filter((k) => k !== id);
      return remaining[0] ?? prev;
    });
  }, []);

  /* keyboard routing (focus is hover-based, not DOM focus) */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeProjectRef.current) {
        if (e.key === "Escape") setActiveProject(null);
        return; // modal is up — don't also route keys into the terminal underneath
      }

      const id = focusedRef.current;
      const win = windowsRef.current[id];
      if (!win) return;

      // alt+enter: new window. alt+q: close focused window. (Hyprland-style binds)
      if (e.altKey && (e.key === "q" || e.key === "Q")) {
        e.preventDefault();
        openWindow();
        return;
      }
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        closeWindow(id);
        return;
      }

      if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        if (win.cmatrixRunning) {
          e.preventDefault();
          setWindows((w) => ({
            ...w,
            [id]: {
              ...w[id],
              cmatrixRunning: false,
              lines: [...w[id].lines, { id: Date.now(), kind: "dim" as const, text: "^C" }],
            },
          }));
        }
        return; // let real ctrl+c (copy) through otherwise
      }

      if (win.cmatrixRunning) return; // input suspended while the rain runs
      if (e.altKey || e.metaKey || e.ctrlKey) return; // leave real shortcuts alone

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setWindows((w) => {
          const cur = w[id];
          if (cur.history.length === 0) return w;
          const idx = cur.historyIndex === null ? cur.history.length - 1 : Math.max(0, cur.historyIndex - 1);
          return { ...w, [id]: { ...cur, buffer: cur.history[idx], historyIndex: idx } };
        });
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setWindows((w) => {
          const cur = w[id];
          if (cur.historyIndex === null) return w;
          const idx = cur.historyIndex + 1;
          if (idx >= cur.history.length) return { ...w, [id]: { ...cur, buffer: "", historyIndex: null } };
          return { ...w, [id]: { ...cur, buffer: cur.history[idx], historyIndex: idx } };
        });
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const typed = win.buffer.trim();
        const pushHistory = (w: WindowMap): WindowMap => {
          const cur = w[id];
          const history = typed && typed !== cur.history[cur.history.length - 1] ? [...cur.history, typed] : cur.history;
          return { ...w, [id]: { ...cur, history, historyIndex: null } };
        };
        if (typed === "open") {
          setWindows((w) => {
            const next = pushHistory(w);
            return {
              ...next,
              [id]: {
                ...next[id],
                buffer: "",
                lines: [...next[id].lines, { id: Date.now(), kind: "cmd" as const, text: "open", prompt: promptFor(next[id].cwd) }],
              },
            };
          });
          openWindow();
          return;
        }
        if (typed === "exit" || typed === "close") {
          setWindows((w) => {
            const next = pushHistory(w);
            return {
              ...next,
              [id]: {
                ...next[id],
                buffer: "",
                lines: [...next[id].lines, { id: Date.now(), kind: "cmd" as const, text: typed, prompt: promptFor(next[id].cwd) }],
              },
            };
          });
          closeWindow(id);
          return;
        }
        setWindows((w) => ({ ...w, [id]: runCommand(w[id], w[id].buffer, setActiveProject) }));
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        setWindows((w) => ({ ...w, [id]: { ...w[id], buffer: w[id].buffer.slice(0, -1) } }));
        return;
      }
      if (e.key.length === 1) {
        e.preventDefault();
        setWindows((w) => ({ ...w, [id]: { ...w[id], buffer: w[id].buffer + e.key } }));
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openWindow, closeWindow]);

  /* divider drag → resize the split at `path` */
  const startResize = useCallback((path: Path, dir: "row" | "col", e: MouseEvent) => {
    e.preventDefault();
    const container = (e.currentTarget as HTMLElement).parentElement as HTMLElement;

    const onMove = (ev: globalThis.MouseEvent) => {
      const rect = container.getBoundingClientRect();
      let ratio =
        dir === "row" ? (ev.clientX - rect.left) / rect.width : (ev.clientY - rect.top) / rect.height;
      ratio = Math.min(0.85, Math.max(0.15, ratio));
      setTree((t) => updateRatioAtPath(t, path, ratio));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  /* alt+drag → edge-aware reorder (real BSP move, not a content swap) */
  const handleAltMouseDown = useCallback((windowId: string, e: MouseEvent) => {
    if (!e.altKey) return;
    e.preventDefault();
    setDragSource(windowId);

    const onMove = (ev: globalThis.MouseEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const paneEl = el?.closest("[data-window-id]") as HTMLElement | null;
      if (!paneEl || paneEl.dataset.windowId === windowId) {
        setDropTarget(null);
        return;
      }
      const rect = paneEl.getBoundingClientRect();
      const relX = (ev.clientX - rect.left) / rect.width;
      const relY = (ev.clientY - rect.top) / rect.height;
      const dists: [Edge, number][] = [
        ["left", relX],
        ["right", 1 - relX],
        ["top", relY],
        ["bottom", 1 - relY],
      ];
      dists.sort((a, b) => a[1] - b[1]);
      // near an edge (outer quarter of the pane) -> split that edge.
      // otherwise -> dropped in the middle -> plain swap.
      const edge: Edge = dists[0][1] > 0.25 ? "center" : dists[0][0];
      setDropTarget({ windowId: paneEl.dataset.windowId!, edge });
    };

    const onUp = () => {
      setDropTarget((current) => {
        if (current && current.windowId !== windowId) {
          setTree((t) =>
            current.edge === "center"
              ? swapLeaves(t, windowId, current.windowId)
              : insertLeafNextTo(removeLeaf(t, windowId), current.windowId, windowId, current.edge as DropEdge)
          );
          setFocusedWindowId(current.windowId);
        }
        return null;
      });
      setDragSource(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  /* tree -> JSX */
  const renderNode = (node: LayoutNode, path: Path): ReactNode => {
    if (node.type === "leaf") {
      return (
        <Pane
          key={node.windowId}
          windowId={node.windowId}
          state={windows[node.windowId]}
          focused={focusedWindowId === node.windowId}
          dropEdge={dropTarget?.windowId === node.windowId ? dropTarget.edge : null}
          cursorVisible={cursorVisible}
          onMouseEnter={() => {
            if (!dragSource) setFocusedWindowId(node.windowId);
          }}
          onAltMouseDown={(e) => handleAltMouseDown(node.windowId, e)}
        />
      );
    }
    return (
      <div className={`split split-${node.dir}`} key={path.join("") || "root"}>
        <div className="split-child" style={{ flex: `0 0 ${node.ratio * 100}%` }}>
          {renderNode(node.a, [...path, "a"])}
        </div>
        <div className={`divider divider-${node.dir}`} onMouseDown={(e) => startResize([...path], node.dir, e)} />
        <div className="split-child" style={{ flex: "1 1 auto" }}>
          {renderNode(node.b, [...path, "b"])}
        </div>
      </div>
    );
  };

  return (
    <div className="tiling-wm">
      {renderNode(tree, [])}
      {activeProject && <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />}
    </div>
  );
}
