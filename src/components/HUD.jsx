import { motion, AnimatePresence } from 'framer-motion';

const KEY_SYMBOLS = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

const KEY_COLORS = {
  ArrowUp: '#00aaff',
  ArrowDown: '#ff6600',
  ArrowLeft: '#aa44ff',
  ArrowRight: '#ffdd00',
};

// A → B → C → D → E
const NODE_LETTERS = ['A', 'B', 'C', 'D', 'E'];

function StatBlock({ label, value, color = '#00aaff', sub }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '10px 16px',
      background: '#07070e',
      border: '1px solid #141424',
      borderRadius: 8,
      minWidth: 80,
    }}>
      <div style={{
        fontSize: 28,
        fontWeight: 'bold',
        color,
        fontFamily: 'Courier New',
        lineHeight: 1,
        textShadow: `0 0 12px ${color}55`,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: '#2a2a3e', letterSpacing: 2, marginTop: 4 }}>
        {label}
      </div>
      {sub !== undefined && (
        <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>BEST: {sub}</div>
      )}
    </div>
  );
}

export function HUD({ stats, phase, currentNode, nodeCount, segmentCount, sequence, config }) {
  // Key the player must press RIGHT NOW (destination of active segment)
  const targetKey  = phase === 'running' ? sequence[currentNode + 1] : null;
  const targetColor = targetKey ? KEY_COLORS[targetKey] : '#00aaff';

  // Key the player must press to LAUNCH (node A's key)
  const startKey   = sequence[0];

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, #07070e 0%, transparent 100%)',
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            border: '2px solid #00aaff',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px #00aaff33',
          }}>
            <span style={{ color: '#00aaff', fontSize: 16 }}>⌗</span>
          </div>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 4, color: '#00aaff' }}>LOCKPICK</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#252535' }}>REFLEX TRAINER</div>
          </div>
        </div>

        {/* Segment progress dots  A·B·C·D·E with arrows between */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Array.from({ length: nodeCount }).map((_, i) => {
            const done    = phase !== 'idle' && i <= currentNode;
            const isNow   = phase === 'running' && i === currentNode + 1;
            const isStart = phase === 'idle' && i === 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Node dot */}
                <div style={{
                  width: done ? 22 : 10,
                  height: 10,
                  borderRadius: 5,
                  background: done ? '#00ff88' : isStart ? '#00aaff' : isNow ? targetColor : '#141424',
                  border: `1px solid ${done ? '#00ff88' : isNow ? targetColor : isStart ? '#00aaff' : '#1e1e2e'}`,
                  boxShadow: done ? '0 0 6px #00ff8877' : isNow ? `0 0 8px ${targetColor}88` : 'none',
                  transition: 'all 0.25s',
                }} />
                {/* Arrow between dots (not after last) */}
                {i < nodeCount - 1 && (
                  <div style={{
                    fontSize: 8,
                    color: i < currentNode && phase !== 'idle' ? '#00ff8866' : '#1a1a28',
                    transition: 'color 0.25s',
                  }}>
                    →
                  </div>
                )}
              </div>
            );
          })}
          <div style={{
            marginLeft: 6,
            fontSize: 10,
            color: '#252535',
            letterSpacing: 1,
            fontFamily: 'Courier New',
          }}>
            {currentNode}/{segmentCount}
          </div>
        </div>

        {/* Speed + latency badges */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            padding: '4px 10px',
            background: '#0a0a18',
            border: '1px solid #1a1a2e',
            borderRadius: 4,
            fontSize: 10,
            color: '#00aaff',
            letterSpacing: 1,
          }}>
            {config.speedMultiplier.toFixed(1)}x
          </div>
          {config.inputLatency > 0 && (
            <div style={{
              padding: '4px 10px',
              background: '#140800',
              border: '1px solid #ff6600',
              borderRadius: 4,
              fontSize: 10,
              color: '#ff6600',
              letterSpacing: 1,
            }}>
              LAG {config.inputLatency}ms
            </div>
          )}
        </div>
      </div>

      {/* ── Stats — bottom left ──────────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 24, left: 24,
        display: 'flex',
        gap: 10,
        zIndex: 50,
      }}>
        <StatBlock label="SUCCESSES" value={stats.successes} color="#00ff88" />
        <StatBlock label="FAILURES"  value={stats.failures}  color="#ff2244" />
        <StatBlock label="STREAK"    value={stats.streak}    color="#ffdd00" sub={stats.bestStreak} />
      </div>

      {/* ── IDLE overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            key="idle-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 110,
              pointerEvents: 'none',
              zIndex: 40,
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              <div style={{ fontSize: 9, letterSpacing: 4, color: '#00aaff55' }}>
                PRESS NODE  A  TO LAUNCH
              </div>
              <div style={{
                fontSize: 38,
                color: '#00aaff',
                textShadow: '0 0 18px #00aaff',
                lineHeight: 1,
              }}>
                {KEY_SYMBOLS[startKey]}
              </div>
              <div style={{ fontSize: 8, letterSpacing: 2, color: '#00aaff33' }}>
                ONLY THE CORRECT KEY STARTS
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Running: TARGET hint (centre of arena) ──────────────────────── */}
      <AnimatePresence>
        {phase === 'running' && targetKey && (
          <motion.div
            key={`target-${currentNode}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 5,  // behind nodes/tracks
            }}
          >
            <div style={{ fontSize: 8, letterSpacing: 4, color: '#1e1e2e', marginBottom: 4 }}>
              TARGET · NODE {NODE_LETTERS[currentNode + 1]}
            </div>
            <div style={{
              fontSize: 40,
              color: `${targetColor}22`,
              lineHeight: 1,
              textShadow: `0 0 20px ${targetColor}11`,
            }}>
              {KEY_SYMBOLS[targetKey]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
