import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import "./nav.css";

const items = [
  { label: "Home", path: "/" },
  { label: "Stats", path: "/stats" },
  { label: "Projects", path: "/projects" },
  { label: "Academics", path: "/academics" },
  { label: "Connect", path: "/connect" },
];

export default function Navbar() {
  return (
    <nav className="nav-bar bitcount-prop-single">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className="nav-item"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="nav-pill"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                  }}
                />
              )}

              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}