import Navbar from "@/components/nav";

import Home from "./pages/Home";
import Stats from "./pages/Stats";
import Projects from "./pages/Projects";
import Academics from "./pages/Academics";
import Connect from "./pages/Connect";

import "./App.css";

import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/connect" element={<Connect />} />
      </Routes>
    </>
  );
}