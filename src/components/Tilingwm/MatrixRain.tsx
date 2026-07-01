import { useEffect, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アイウエオカキクケコサシスセソタチツテト";

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 16;
    let cols = 0;
    let drops: number[] = [];

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      cols = Math.floor(canvas.width / fontSize);
      drops = new Array(cols).fill(0).map(() => Math.random() * -40);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const frame = () => {
      ctx.fillStyle = "#0d0d0e33";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        // catppuccin green, with an occasional near-white leading char
        ctx.fillStyle = Math.random() > 0.93 ? "#e6fff2" : "#a6e3a1";
        ctx.fillText(ch, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const id = window.setInterval(frame, 45);

    return () => {
      window.clearInterval(id);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-canvas" />;
}
