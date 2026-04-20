// Utility functions

export function createParticle(x, y, type) {
  // Creates an explosion particle at the specified coordinates
  // Parameters:
  //   x, y: starting position in pixels (viewport coordinates)
  //   type: "main" for larger colored particles, "sparkle" for smaller white sparkles
  const p = document.createElement("div");
  p.className = type === "main" ? "explosion-particle" : "explosion-sparkle";
  
  // Calculate random angle for particle direction
  // "main" particles go in all directions (0-2π), "sparkle" particles go upward (0-π)
  const angle =
    type === "main" ? Math.PI * 2 * Math.random() : Math.random() * Math.PI * 2;
  
  // Calculate random velocity for particle speed
  // "main" particles are faster (100-350), "sparkle" are slower (60-210)
  const vel =
    type === "main" ? 100 + Math.random() * 250 : 60 + Math.random() * 150;
  
  // Calculate velocity components with vertical bias for "main" particles
  const vx = Math.cos(angle) * vel;
  const vy = Math.sin(angle) * vel + (type === "main" ? 80 : 0);
  
  // Color palette for "main" particles (sparkles are always white)
  const colors = [
    "#8b5cf6",
    "#ec4899",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ffffff",
  ];

  // Apply CSS styles and animation to particle
  p.style.cssText = `
    position: fixed; left: ${x}px; top: ${y}px;
    width: ${type === "main" ? 6 + Math.random() * 12 : 2 + Math.random() * 3}px;
    height: ${type === "main" ? 6 + Math.random() * 12 : 2 + Math.random() * 3}px;
    background: ${type === "main" ? colors[Math.floor(Math.random() * colors.length)] : "#ffffff"};
    border-radius: 50%;
    box-shadow: ${type === "main" ? `0 0 ${15 + Math.random() * 15}px ${p.style.background}` : "0 0 15px #ffffff, 0 0 30px #8b5cf6"};
    z-index: 9999; pointer-events: none;
    --tx: ${vx}px; --ty: ${vy}px;
    animation: ${type === "main" ? "particleExplode" : "sparkleExplode"} ${type === "main" ? 0.6 + Math.random() * 0.4 : 0.4 + Math.random() * 0.3}s ease-out forwards;
  `;
  
  // Add particle to DOM and remove after animation completes
  document.body.appendChild(p);
  setTimeout(() => p.remove(), type === "main" ? 1200 : 800);
}
