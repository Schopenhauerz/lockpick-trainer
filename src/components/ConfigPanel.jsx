import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Slider({ label, value, min, max, step, onChange, unit, color = '#00aaff', formatValue }) {
  const display = formatValue
    ? formatValue(value)
    : `${typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}${unit}`;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 6,
        fontSize: 11,
        letterSpacing: 2,
        color: '#666',
      }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 'bold' }}>{display}</span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute',
          height: 4,
          left: 0, right: 0,
          background: '#1a1a2e',
          borderRadius: 2,
          border: '1px solid #222244',
        }} />
        <div style={{
          position: 'absolute',
          height: 4,
          left: 0,
          width: `${((value - min) / (max - min)) * 100}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 2,
          boxShadow: `0 0 6px ${color}66`,
        }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'relative',
            width: '100%',
            height: 20,
            appearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange, color = '#00ff88' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <span style={{ fontSize: 11, letterSpacing: 2, color: '#666' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 42, height: 22,
          borderRadius: 11,
          background: value ? `${color}22` : '#1a1a2e',
          border: `1px solid ${value ? color : '#333'}`,
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3,
          left: value ? 22 : 3,
          width: 14, height: 14,
          borderRadius: '50%',
          background: value ? color : '#444',
          transition: 'all 0.2s',
          boxShadow: value ? `0 0 6px ${color}88` : 'none',
        }} />
      </button>
    </div>
  );
}

function LatencyInput({ value, onChange }) {
  const [raw, setRaw] = useState(String(value));

  const commit = () => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 0 && n <= 1000) {
      onChange(n);
    } else {
      setRaw(String(value));
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 6,
        fontSize: 11,
        letterSpacing: 2,
        color: '#666',
      }}>
        <span>INPUT LATENCY SIM</span>
        <span style={{ color: '#ff6600', fontSize: 9 }}>0–1000ms</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#0d0d1a',
        border: '1px solid #222244',
        borderRadius: 6,
        padding: '6px 10px',
      }}>
        <input
          type="number"
          min={0}
          max={1000}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') { commit(); e.target.blur(); } e.stopPropagation(); }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ff6600',
            fontFamily: 'Courier New',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'right',
          }}
        />
        <span style={{ color: '#444', fontSize: 12, letterSpacing: 1 }}>ms</span>
      </div>
      {value > 0 && (
        <div style={{
          marginTop: 4,
          fontSize: 9,
          color: '#ff660066',
          letterSpacing: 1,
        }}>
          ⚠ SIMULATING {value}ms PING LAG
        </div>
      )}
    </div>
  );
}

export function ConfigPanel({ config, onUpdate }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: open ? '#1a1a30' : '#0d0d1a',
          border: `1px solid ${open ? '#00aaff' : '#222244'}`,
          borderRadius: 8,
          padding: '8px 16px',
          color: open ? '#00aaff' : '#444',
          fontFamily: 'Courier New',
          fontSize: 11,
          letterSpacing: 3,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: open ? '0 0 12px #00aaff44' : 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>⚙</span>
        CONFIG
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: 8,
              width: 280,
              background: '#080810',
              border: '1px solid #222244',
              borderRadius: 10,
              padding: 20,
              boxShadow: '0 0 30px #00000088, 0 0 60px #00aaff11',
            }}
          >
            <div style={{
              fontSize: 10,
              letterSpacing: 4,
              color: '#00aaff',
              marginBottom: 18,
              borderBottom: '1px solid #1a1a2e',
              paddingBottom: 10,
            }}>
              CONFIGURATION
            </div>

            <Slider
              label="SPEED MULTIPLIER"
              value={config.speedMultiplier}
              min={0.5}
              max={10.0}
              step={0.1}
              unit="x"
              color="#00aaff"
              onChange={v => onUpdate('speedMultiplier', v)}
            />

            <div style={{
              marginBottom: 12,
              padding: '6px 10px',
              background: '#0d0d1a',
              borderRadius: 6,
              border: '1px solid #1a1a2e',
              fontSize: 10,
              color: '#333',
              letterSpacing: 1,
            }}>
              <span style={{ color: '#00ff88' }}>
                {(2000 / config.speedMultiplier).toFixed(0)}ms
              </span>
              {' '}per segment at current speed
            </div>

            <Slider
              label="SWEET SPOT WIDTH"
              value={config.sweetSpotWidth}
              min={0.05}
              max={0.30}
              step={0.01}
              color="#00ff88"
              formatValue={v => `${Math.round(v * 100)}%`}
              onChange={v => onUpdate('sweetSpotWidth', v)}
            />

            <Toggle
              label="SHOW SWEET SPOT"
              value={config.showSweetSpot}
              onChange={v => onUpdate('showSweetSpot', v)}
            />

            <div style={{ borderTop: '1px solid #1a1a2e', margin: '4px 0 16px' }} />

            <LatencyInput
              value={config.inputLatency}
              onChange={v => onUpdate('inputLatency', v)}
            />

            <div style={{
              marginTop: 8,
              padding: '8px 10px',
              background: '#080810',
              borderRadius: 6,
              border: '1px solid #1a1a2e',
              fontSize: 9,
              color: '#333',
              letterSpacing: 1,
              lineHeight: 1.6,
            }}>
              Key is evaluated AFTER the delay — press early<br/>
              to compensate. Bar keeps moving; overshoot = fail.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
