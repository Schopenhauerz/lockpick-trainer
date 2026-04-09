const TRACK_HEIGHT = 3;
const NODE_HALF    = 50;

export function ProgressTrack({ fromPos, toPos, progress, isActive, feedback, sweetSpotStart, sweetSpotEnd, showSweetSpot }) {
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const fullLength = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / fullLength;
  const uy = dy / fullLength;

  const startX = fromPos.x + ux * NODE_HALF;
  const startY = fromPos.y + uy * NODE_HALF;
  const length = fullLength - NODE_HALF * 2;
  const angle  = Math.atan2(dy, dx) * (180 / Math.PI);

  const p = Math.min(progress * 100, 100);

  let fillColor = 'rgba(255,255,255,0.55)';
  if (isActive) {
    if (showSweetSpot && progress >= sweetSpotStart && progress <= sweetSpotEnd) fillColor = '#00ff88';
    if (showSweetSpot && progress > sweetSpotEnd)   fillColor = '#ffaa00';
    if (feedback === 'fail')       fillColor = '#ff2244';
  }

  return (
    <div style={{
      position: 'absolute',
      left: startX,
      top: startY - TRACK_HEIGHT / 2,
      width: length,
      height: TRACK_HEIGHT,
      transformOrigin: '0 50%',
      transform: `rotate(${angle}deg)`,
      pointerEvents: 'none',
    }}>
      {/* Track groove */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.10)',
        borderRadius: TRACK_HEIGHT,
      }} />

      {/* Sweet spot zone */}
      {isActive && showSweetSpot && (
        <div style={{
          position: 'absolute',
          top: -1, bottom: -1,
          left: `${sweetSpotStart * 100}%`,
          right: `${(1 - sweetSpotEnd) * 100}%`,
          background: 'rgba(0,255,136,0.15)',
          border: '1px solid rgba(0,255,136,0.4)',
          borderRadius: 2,
        }} />
      )}

      {/* Fill bar */}
      {isActive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          width: `${p}%`,
          background: fillColor,
          borderRadius: TRACK_HEIGHT,
          boxShadow: `0 0 6px ${fillColor}`,
        }} />
      )}
    </div>
  );
}
