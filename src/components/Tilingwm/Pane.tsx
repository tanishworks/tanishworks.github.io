import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import type { WindowState } from "./useShell";
import type { Edge } from "./layout-tree";
import { promptFor } from "./fs";
import { MatrixRain } from "./MatrixRain";

interface PaneProps {
  windowId: string;
  state: WindowState;
  focused: boolean;
  dropEdge: Edge | null;
  cursorVisible: boolean; // shared clock — see TilingWM — keeps every pane's cursor in sync
  onMouseEnter: () => void;
  onAltMouseDown: (e: MouseEvent) => void;
}

export function Pane({ windowId, state, focused, dropEdge, cursorVisible, onMouseEnter, onAltMouseDown }: PaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.lines, state.cmatrixRunning]);

  return (
    <div
      className={`pane${focused ? " pane-focused" : ""}`}
      data-window-id={windowId}
      onMouseEnter={onMouseEnter}
      onMouseDown={onAltMouseDown}
    >
      {state.cmatrixRunning ? (
        <MatrixRain />
      ) : (
        <div className="term">
          <div className="term-scroll" ref={scrollRef}>
            {state.lines.map((line) => {
              if (line.kind === "cmd") {
                return (
                  <div className="term-line" key={line.id}>
                    <span className="prompt">{line.prompt}</span> <span className="cmdtext">{line.text}</span>
                  </div>
                );
              }
              if (line.kind === "node") {
                return (
                  <div className="term-line" key={line.id}>
                    {line.node}
                  </div>
                );
              }
              const cls = line.kind === "err" ? "term-line err" : line.kind === "dim" ? "term-line dim" : "term-line";
              return (
                <div className={cls} key={line.id}>
                  {line.text}
                </div>
              );
            })}
            <div className="prompt-line">
              <span className="prompt">{promptFor(state.cwd)}</span>
              <span className="typed">{state.buffer}</span>
              <span
                className={`cursor${focused ? "" : " cursor-inactive"}`}
                style={focused ? { opacity: cursorVisible ? 1 : 0 } : undefined}
              />
            </div>
          </div>
        </div>
      )}
      {dropEdge && <div className={`drop-indicator drop-${dropEdge}`} />}
    </div>
  );
}
