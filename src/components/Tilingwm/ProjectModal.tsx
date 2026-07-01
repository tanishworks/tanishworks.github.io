import { useState } from "react";
import type { MouseEvent } from "react";
import type { Project } from "./content";

export function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [broken, setBroken] = useState(false);

  const onBackdropDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onBackdropDown}>
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="close">
          ×
        </button>

        <div className="modal-image-frame">
          {!broken ? (
            <img src={project.image} alt={project.title} onError={() => setBroken(true)} />
          ) : (
            <div className="project-image-placeholder">
              <span>[ no preview ]</span>
            </div>
          )}
        </div>

        <div className="modal-body">
          <div className="modal-title">{project.title}</div>
          <p className="modal-desc">{project.description}</p>
          <div className="modal-row">
            <span className="nf-key">tech</span>: {project.tech.join(", ")}
          </div>
          <div className="modal-row">
            <span className="nf-key">languages</span>: {project.languages.join(", ")}
          </div>
          {project.link && (
            <a className="project-link" href={project.link} target="_blank" rel="noreferrer">
              {project.link.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
