import { motion } from 'framer-motion';

const KEY_SYMBOLS = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

export function NodeBox({ index, x, y, direction, isTarget, isCompleted, isStart, feedback }) {
  const SIZE = 64;

  const isFail = feedback === 'fail' && isTarget;

  const bg     = isCompleted ? 'rgba(0,255,136,0.08)' : 'rgba(10,10,18,0.88)';
  const border = isFail      ? '#ff2244'
               : isTarget    ? 'rgba(255,255,255,0.55)'
               : isCompleted ? 'rgba(0,255,136,0.45)'
               : isStart     ? 'rgba(255,255,255,0.30)'
               : 'rgba(255,255,255,0.12)';

  const arrowColor = isFail      ? '#ff2244'
                   : isTarget    ? '#ffffff'
                   : isCompleted ? '#00ff88'
                   : isStart     ? 'rgba(255,255,255,0.75)'
                   : 'rgba(255,255,255,0.35)';

  const arrowSize = isTarget ? 30 : 24;

  return (
    <motion.div
      animate={isFail ? { x: [0, -7, 7, -5, 5, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: x - SIZE / 2,
        top:  y - SIZE / 2,
        width: SIZE,
        height: SIZE,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
        transition: 'border-color 0.12s, background 0.12s',
      }}
    >
      <span style={{
        fontSize: arrowSize,
        color: arrowColor,
        lineHeight: 1,
        transition: 'color 0.12s, font-size 0.12s',
        userSelect: 'none',
      }}>
        {KEY_SYMBOLS[direction]}
      </span>
    </motion.div>
  );
}
