import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './App.css';
import { useGameEngine } from './hooks/useGameEngine';
import { getNodePositions } from './components/CircleLayout';
import { NodeBox } from './components/NodeBox';
import { ProgressTrack } from './components/ProgressTrack';
import { HUD } from './components/HUD';
import { ConfigPanel } from './components/ConfigPanel';
import { FeedbackOverlay } from './components/FeedbackOverlay';
import { GridMaze } from './components/GridMaze';

const ARENA_W = 520;
const ARENA_H = 520;
const CX = ARENA_W / 2;
const CY = ARENA_H / 2;
const RADIUS = 170;

export default function App() {
  const [mode, setMode] = useState('lockpick'); // 'lockpick' | 'maze'

  const {
    phase,
    progress,
    currentNode,   // source of the active segment (0..3)
    sequence,      // key per node index [A, B, C, D, E]
    stats,
    feedback,
    config,
    updateConfig,
    sweetSpotStart,
    sweetSpotEnd,
    nodeCount,
    segmentCount,
    frozenProgress,
  } = useGameEngine();

  // 5 node positions (CCW from top)
  const positions = useMemo(() => getNodePositions(RADIUS, CX, CY), []);

  // 4 linear edges: A→B, B→C, C→D, D→E  (not circular)
  const edges = useMemo(() =>
    Array.from({ length: segmentCount }, (_, i) => ({
      from: positions[i],
      to:   positions[i + 1],
    })),
    [positions, segmentCount]
  );

  const isShaking = feedback === 'fail';

  const [scale, setScale] = useState(() =>
    Math.min((window.innerWidth - 16) / ARENA_W, (window.innerHeight - 180) / ARENA_H, 1)
  );
  useEffect(() => {
    const update = () =>
      setScale(Math.min((window.innerWidth - 16) / ARENA_W, (window.innerHeight - 180) / ARENA_H, 1));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#12121a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {mode === 'maze' && <GridMaze mode={mode} onModeChange={setMode} />}

      {mode === 'lockpick' && <>
      <HUD
        stats={stats}
        phase={phase}
        currentNode={currentNode}
        nodeCount={nodeCount}
        segmentCount={segmentCount}
        sequence={sequence}
        config={config}
        mode={mode}
        onModeChange={setMode}
      />

      {/* Arena — scaled for mobile, shakes on fail */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
      <motion.div
        animate={isShaking
          ? { x: [-9, 9, -7, 7, -4, 4, -1, 1, 0], y: [-4, 4, -3, 3, -1, 1, 0] }
          : { x: 0, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          position: 'relative',
          width: ARENA_W,
          height: ARENA_H,
          zIndex: 10,
        }}
      >
        {/* Center lock icon */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 64, height: 64,
          borderRadius: '50%',
          background: '#07070e',
          border: `2px solid ${feedback === 'fullSuccess' ? '#00ff88' : '#141424'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: feedback === 'fullSuccess' ? '0 0 24px #00ff88' : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          zIndex: 1,
        }}>
          <motion.div
            animate={feedback === 'fullSuccess' ? { rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 24, lineHeight: 1 }}
          >
            {feedback === 'fullSuccess' ? '🔓' : '🔒'}
          </motion.div>
        </div>

        {/* Static edge lines (trimmed, behind tracks) */}
        {edges.map((edge, i) => {
          if (i === currentNode && phase === 'running') return null;
          const dx        = edge.to.x - edge.from.x;
          const dy        = edge.to.y - edge.from.y;
          const fullLen   = Math.sqrt(dx * dx + dy * dy);
          const ux        = dx / fullLen;
          const uy        = dy / fullLen;
          const NODE_HALF = 50;
          const startX    = edge.from.x + ux * NODE_HALF;
          const startY    = edge.from.y + uy * NODE_HALF;
          const length    = fullLen - NODE_HALF * 2;
          const angle     = Math.atan2(dy, dx) * (180 / Math.PI);
          const done      = i < currentNode;
          return (
            <div
              key={`line-${i}`}
              style={{
                position: 'absolute',
                left: startX,
                top:  startY - 1.5,
                width: length,
                height: 3,
                transformOrigin: '0 50%',
                transform: `rotate(${angle}deg)`,
                background: done ? 'rgba(0,255,136,0.35)' : 'rgba(255,255,255,0.10)',
                borderRadius: 2,
              }}
            />
          );
        })}

        {/* Active progress track */}
        {edges.map((edge, i) => (
          <ProgressTrack
            key={`track-${i}`}
            fromPos={edge.from}
            toPos={edge.to}
            progress={i === currentNode ? progress : frozenProgress[i]}
            isActive={i === currentNode && phase === 'running'}
            feedback={feedback}
            sweetSpotStart={sweetSpotStart}
            sweetSpotEnd={sweetSpotEnd}
            showSweetSpot={config.showSweetSpot}
          />
        ))}

        {/* Nodes */}
        {positions.map((pos, i) => (
          <NodeBox
            key={i}
            index={i}
            x={pos.x}
            y={pos.y}
            direction={sequence[i]}
            // Target = destination of the active segment
            isTarget={phase === 'running' && i === currentNode + 1}
            // Start = node A waiting in idle
            isStart={phase === 'idle' && i === 0}
            // Completed = bar has already left this node
            isCompleted={phase !== 'idle' && i <= currentNode}
            // Fail flash on the target node
            feedback={phase === 'running' && i === currentNode + 1 ? feedback : null}
          />
        ))}
      </motion.div>
      </div>

      <FeedbackOverlay feedback={feedback} />
      <ConfigPanel config={config} onUpdate={updateConfig} />

      {/* Corner brackets */}
      {[
        { top: 12,    left: 12,   borderTop: true,    borderLeft: true  },
        { top: 12,    right: 12,  borderTop: true,    borderRight: true },
        { bottom: 12, left: 12,   borderBottom: true, borderLeft: true  },
        { bottom: 12, right: 12,  borderBottom: true, borderRight: true },
      ].map((s, idx) => (
        <div key={idx} style={{
          position: 'fixed',
          ...(s.top    !== undefined ? { top: s.top }       : { bottom: s.bottom }),
          ...(s.left   !== undefined ? { left: s.left }     : { right: s.right }),
          width: 20, height: 20,
          borderTop:    s.borderTop    ? '1px solid #161626' : 'none',
          borderBottom: s.borderBottom ? '1px solid #161626' : 'none',
          borderLeft:   s.borderLeft   ? '1px solid #161626' : 'none',
          borderRight:  s.borderRight  ? '1px solid #161626' : 'none',
          pointerEvents: 'none',
          zIndex: 400,
        }} />
      ))}
      </>}
    </div>
  );
}
