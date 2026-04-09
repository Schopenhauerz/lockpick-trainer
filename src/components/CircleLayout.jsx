// Positions for 5 nodes in a circle.
// Node 0 = top, then counter-clockwise (top → upper-left → lower-left → lower-right → upper-right)
export function getNodePositions(radius, cx, cy) {
  const positions = [];
  for (let i = 0; i < 5; i++) {
    // Subtract angle to go CCW in screen coordinates (y-axis points down)
    const angle = -Math.PI / 2 - (i * 2 * Math.PI) / 5;
    positions.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return positions;
}
