const DOTS = [
  { x: 20, y: 40, r: 1.4, c: "#b355f7" },
  { x: 90, y: 15, r: 1, c: "#ff2ec4" },
  { x: 150, y: 70, r: 1.6, c: "#b355f7" },
  { x: 210, y: 30, r: 1, c: "#ff2ec4" },
  { x: 260, y: 90, r: 1.3, c: "#b355f7" },
  { x: 60, y: 120, r: 1, c: "#ff2ec4" },
  { x: 130, y: 160, r: 1.5, c: "#b355f7" },
  { x: 190, y: 140, r: 1, c: "#ff2ec4" },
  { x: 240, y: 190, r: 1.2, c: "#b355f7" },
  { x: 30, y: 200, r: 1, c: "#ff2ec4" },
  { x: 280, y: 230, r: 1.4, c: "#b355f7" },
  { x: 100, y: 260, r: 1, c: "#ff2ec4" },
];

const PARTICLE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
  ${DOTS.map((d) => `<circle cx='${d.x}' cy='${d.y}' r='${d.r}' fill='${d.c}' />`).join("")}
</svg>`;

const PARTICLE_DATA_URI = `url("data:image/svg+xml,${encodeURIComponent(PARTICLE_SVG)}")`;

export function ParticleOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 animate-[particle-drift_50s_linear_infinite]"
      style={{
        backgroundImage: PARTICLE_DATA_URI,
        backgroundRepeat: "repeat",
        backgroundSize: "300px 300px",
        opacity: 0.55,
      }}
    />
  );
}
