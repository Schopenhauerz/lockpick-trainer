import { useState, useCallback, useEffect, useRef } from 'react';

function createAlarm(volume) {
  let ctx;
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
  catch (e) { return { stop: () => {}, setVolume: () => {} }; }

  const masterGain = ctx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(ctx.destination);

  let stopped = false;
  let nextTime = ctx.currentTime;
  const CYCLE = 0.65;

  function scheduleChunk() {
    if (stopped) return;
    while (nextTime < ctx.currentTime + 2.0) {
      [[880, 0, 0.13], [660, 0.16, 0.13]].forEach(([freq, offset, dur]) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(masterGain);
        g.gain.setValueAtTime(0.35, nextTime + offset);
        g.gain.exponentialRampToValueAtTime(0.001, nextTime + offset + dur);
        osc.start(nextTime + offset);
        osc.stop(nextTime + offset + dur + 0.01);
      });
      nextTime += CYCLE;
    }
    setTimeout(scheduleChunk, 400);
  }

  scheduleChunk();

  return {
    stop:      () => { stopped = true; masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08); setTimeout(() => ctx.close(), 300); },
    setVolume: (v) => { masterGain.gain.value = v; },
  };
}

const GRID          = 6;
const CELL          = 80;
const GAP           = 4;
const DEFAULT_TIMER = 20;

const SYMBOLS  = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
const ALL_DIRS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

function getDelta(dir) {
  if (dir === 'ArrowUp')    return { dr: -1, dc:  0 };
  if (dir === 'ArrowDown')  return { dr:  1, dc:  0 };
  if (dir === 'ArrowLeft')  return { dr:  0, dc: -1 };
  if (dir === 'ArrowRight') return { dr:  0, dc:  1 };
}

function generateCells() {
  return Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => ({
      arrows: Array.from({ length: 4 }, () => ALL_DIRS[Math.floor(Math.random() * ALL_DIRS.length)]),
    }))
  );
}

function isStuck(row, col, visited, arrows) {
  // Only check directions the cell actually offers
  const available = [...new Set(arrows)];
  return available.every(dir => {
    const { dr, dc } = getDelta(dir);
    const nr = row + dr, nc = col + dc;
    return nr < 0 || nr >= GRID || nc < 0 || nc >= GRID || visited.has(`${nr}-${nc}`);
  });
}

function timerColor(ratio) {
  if (ratio > 0.5)  return '#00ff88';
  if (ratio > 0.25) return '#ffaa00';
  return '#ff4466';
}

// ── Shared mode switcher (mirrors HUD's version) ──────────────────────────────
function ModeSwitcher({ mode, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[{ key: 'lockpick', label: 'LOCKPICK' }, { key: 'maze', label: 'GRID MAZE' }].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: '4px 10px', fontSize: 10, letterSpacing: 1,
            background: mode === key ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
            border: mode === key ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, color: mode === key ? '#fff' : 'rgba(255,255,255,0.28)',
            cursor: 'pointer', fontFamily: 'monospace',
          }}
        >{label}</button>
      ))}
    </div>
  );
}

// ── Stat block (mirrors HUD's StatBlock) ─────────────────────────────────────
function StatBlock({ label, value, color }) {
  return (
    <div style={{
      textAlign: 'center', padding: '6px 10px',
      background: '#07070e', border: '1px solid #141424',
      borderRadius: 8, minWidth: 56,
    }}>
      <div style={{ fontSize: 20, fontWeight: 'bold', color, fontFamily: 'Courier New', lineHeight: 1, textShadow: `0 0 12px ${color}55` }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: '#2a2a3e', letterSpacing: 2, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Settings panel ────────────────────────────────────────────────────────────
function MazeConfig({ timerSecs, onTimerChange, volume, onVolumeChange }) {
  const [open, setOpen] = useState(false);

  function SliderRow({ label, value, min, max, step, onChange, display }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, letterSpacing: 2, color: '#666' }}>
          <span>{label}</span>
          <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{display}</span>
        </div>
        <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', height: 4, left: 0, right: 0, background: '#1a1a2e', borderRadius: 2, border: '1px solid #222244' }} />
          <div style={{
            position: 'absolute', height: 4, left: 0,
            width: `${((value - min) / (max - min)) * 100}%`,
            background: 'linear-gradient(90deg, #00aaff88, #00aaff)',
            borderRadius: 2, boxShadow: '0 0 6px #00aaff66',
          }} />
          <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            style={{ position: 'relative', width: '100%', height: 20, appearance: 'none', background: 'transparent', cursor: 'pointer', zIndex: 1 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? '#1a1a30' : '#0d0d1a',
          border: `1px solid ${open ? '#00aaff' : '#222244'}`,
          borderRadius: 8, padding: '8px 16px',
          color: open ? '#00aaff' : '#444',
          fontFamily: 'Courier New', fontSize: 11, letterSpacing: 3,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: open ? '0 0 12px #00aaff44' : 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>⚙</span> SETTINGS
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
          width: 260, background: '#080810', border: '1px solid #222244',
          borderRadius: 10, padding: 20,
          boxShadow: '0 0 30px #00000088, 0 0 60px #00aaff11',
        }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: '#00aaff', marginBottom: 18, borderBottom: '1px solid #1a1a2e', paddingBottom: 10 }}>
            SETTINGS
          </div>
          <SliderRow label="TIME LIMIT" value={timerSecs} min={5} max={60} step={5} onChange={onTimerChange} display={`${timerSecs}s`} />
          <SliderRow label="ALARM VOLUME" value={volume} min={0} max={1} step={0.05} onChange={onVolumeChange} display={`${Math.round(volume * 100)}%`} />
        </div>
      )}
    </div>
  );
}

// ── Grid cell ─────────────────────────────────────────────────────────────────
function Cell({ cell, isActive, isVisited, shake, onPick }) {
  return (
    <div style={{
      width: CELL, height: CELL,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
      gap: 3, padding: 5, boxSizing: 'border-box',
      background: isActive  ? 'rgba(0,150,255,0.13)'          : isVisited ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.03)',
      border:     isActive  ? '1px solid rgba(0,150,255,0.55)' : isVisited ? '1px solid rgba(0,255,136,0.22)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 6,
      animation: shake ? 'mazeShake 0.3s ease' : 'none',
    }}>
      {cell.arrows.map((dir, i) => (
        <button
          key={i}
          onClick={() => isActive && onPick(dir)}
          style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border:     isActive ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 3,
            color:  isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)',
            fontSize: 15, cursor: isActive ? 'pointer' : 'default',
            padding: 0, lineHeight: 1, fontFamily: 'monospace',
            transition: 'background 0.1s',
          }}
        >
          {SYMBOLS[dir]}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GridMaze({ mode, onModeChange }) {
  const [screen,    setScreen]    = useState('start');
  const [cells,     setCells]     = useState(() => generateCells());
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [visited,   setVisited]   = useState(() => new Set(['0-0']));
  const [phase,     setPhase]     = useState('playing');
  const [shake,     setShake]     = useState(false);
  const [flashFail, setFlashFail] = useState(false);
  const [stats,     setStats]     = useState({ success: 0, fail: 0 });
  const [timeRatio, setTimeRatio] = useState(1);
  const [gameKey,   setGameKey]   = useState(0);
  const [timerSecs, setTimerSecs] = useState(DEFAULT_TIMER);
  const [volume,    setVolume]    = useState(0.4);

  const phaseRef     = useRef('idle');
  const timerSecsRef = useRef(timerSecs);
  const volumeRef    = useRef(0.4);
  const alarmRef     = useRef(null);
  useEffect(() => { timerSecsRef.current = timerSecs; }, [timerSecs]);
  useEffect(() => { volumeRef.current = volume; if (alarmRef.current) alarmRef.current.setVolume(volume); }, [volume]);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) { alarmRef.current.stop(); alarmRef.current = null; }
  }, []);

  // Stop alarm when unmounting (mode switch)
  useEffect(() => stopAlarm, [stopAlarm]);

  const goToStart = useCallback(() => {
    stopAlarm();
    phaseRef.current = 'idle';
    setScreen('start');
    setPhase('idle');
    setShake(false);
    setFlashFail(false);
  }, [stopAlarm]);

  const startGame = useCallback(() => {
    stopAlarm();
    phaseRef.current = 'playing';
    setCells(generateCells());
    setPlayerPos({ row: 0, col: 0 });
    setVisited(new Set(['0-0']));
    setPhase('playing');
    setShake(false);
    setFlashFail(false);
    setTimeRatio(1);
    setScreen('playing');
    setGameKey(k => k + 1);
    alarmRef.current = createAlarm(volumeRef.current);
  }, [stopAlarm]);

  // Timer
  useEffect(() => {
    if (screen !== 'playing') return;
    const start    = Date.now();
    const duration = timerSecsRef.current * 1000;
    let rafId;
    const tick = () => {
      if (phaseRef.current !== 'playing') return;
      const ratio = Math.max(0, 1 - (Date.now() - start) / duration);
      setTimeRatio(ratio);
      if (ratio <= 0) {
        phaseRef.current = 'fail';
        setPhase('fail');
        setStats(s => ({ ...s, fail: s.fail + 1 }));
        setFlashFail(true);
        setTimeout(goToStart, 900);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [gameKey, screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerFail = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    phaseRef.current = 'fail';
    setPhase('fail');
    setFlashFail(true);
    setStats(s => ({ ...s, fail: s.fail + 1 }));
    setTimeout(goToStart, 900);
  }, [goToStart]);

  const handlePick = useCallback((dir) => {
    if (phaseRef.current !== 'playing') return;
    const { row, col } = playerPos;
    const { dr, dc }   = getDelta(dir);
    const nr = row + dr, nc = col + dc;
    const outOfBounds = nr < 0 || nr >= GRID || nc < 0 || nc >= GRID;
    const alreadySeen = !outOfBounds && visited.has(`${nr}-${nc}`);
    if (outOfBounds || alreadySeen) { triggerFail(); return; }
    const newVisited = new Set(visited);
    newVisited.add(`${nr}-${nc}`);
    if (nr === GRID - 1 && nc === GRID - 1) {
      phaseRef.current = 'success';
      stopAlarm();
      setPlayerPos({ row: nr, col: nc });
      setVisited(newVisited);
      setPhase('success');
      setStats(s => ({ ...s, success: s.success + 1 }));
      setTimeout(goToStart, 1000);
      return;
    }
    setPlayerPos({ row: nr, col: nc });
    setVisited(newVisited);
    if (isStuck(nr, nc, newVisited, cells[nr][nc].arrows)) {
      phaseRef.current = 'fail';
      setPhase('fail');
      setFlashFail(true);
      setStats(s => ({ ...s, fail: s.fail + 1 }));
      setTimeout(goToStart, 900);
    }
  }, [playerPos, visited, triggerFail, goToStart, stopAlarm, cells]);

  const totalW    = GRID * CELL + (GRID - 1) * GAP;
  const color     = timerColor(timeRatio);
  const secsLeft  = Math.ceil(timeRatio * timerSecs);
  const timerDisp = screen === 'playing' ? `${secsLeft}s` : `${timerSecs}s`;

  return (
    <>
      {/* ── Fixed top bar ────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, #07070e 0%, transparent 100%)',
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, border: '2px solid #00aaff', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px #00aaff33',
          }}>
            <span style={{ color: '#00aaff', fontSize: 16 }}>⊞</span>
          </div>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 4, color: '#00aaff' }}>GRID MAZE</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#252535' }}>REFLEX TRAINER</div>
          </div>
        </div>

        {/* Center: step counter while playing */}
        <div style={{ fontSize: 10, color: '#252535', letterSpacing: 1, fontFamily: 'Courier New' }}>
          {screen === 'playing'
            ? `${[...visited].length - 1} / ${GRID * 2 - 2} steps`
            : 'reach bottom-right'}
        </div>

        {/* Right: mode switcher + timer badge */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ModeSwitcher mode={mode} onChange={onModeChange} />
          <div style={{
            padding: '4px 10px', background: '#0a0a18',
            border: `1px solid ${screen === 'playing' ? color + '66' : '#1a1a2e'}`,
            borderRadius: 4, fontSize: 10,
            color: screen === 'playing' ? color : '#00aaff',
            letterSpacing: 1,
            transition: 'color 0.4s, border-color 0.4s',
          }}>
            {timerDisp}
          </div>
        </div>
      </div>

      {/* ── Timer strip ──────────────────────────────────────────────────── */}
      {screen === 'playing' && (
        <div style={{ position: 'fixed', top: 52, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)', zIndex: 49 }}>
          <div style={{
            height: '100%', width: `${timeRatio * 100}%`,
            background: color, boxShadow: `0 0 6px ${color}88`,
            transition: 'background 0.4s',
          }} />
        </div>
      )}

      {/* ── Bottom-left stats ─────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 16, left: 12, display: 'flex', gap: 6, zIndex: 50 }}>
        <StatBlock label="SUCCESSES" value={stats.success} color="#00ff88" />
        <StatBlock label="FAILURES"  value={stats.fail}    color="#ff2244" />
      </div>

      {/* ── Bottom-right config ───────────────────────────────────────────── */}
      <MazeConfig timerSecs={timerSecs} onTimerChange={setTimerSecs} volume={volume} onVolumeChange={setVolume} />

      {/* ── Center content ───────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 55, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {screen === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, fontFamily: 'monospace' }}>
            {/* Dim preview */}
            <div style={{
              position: 'relative', width: totalW, opacity: 0.13, pointerEvents: 'none',
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`,
              gridTemplateRows: `repeat(${GRID}, ${CELL}px)`,
              gap: GAP,
            }}>
              {Array.from({ length: GRID * GRID }, (_, i) => (
                <div key={i} style={{
                  width: CELL, height: CELL,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.4)', fontSize: 18,
                }}>
                  {SYMBOLS[ALL_DIRS[i % 4]]}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)', letterSpacing: 1 }}>
                Navigate from top-left to bottom-right · {timerSecs}s
              </div>
              <button
                onClick={startGame}
                style={{
                  padding: '10px 40px', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase',
                  background: 'rgba(0,170,255,0.10)', border: '1px solid rgba(0,170,255,0.45)',
                  borderRadius: 6, color: '#00aaff', cursor: 'pointer', fontFamily: 'monospace',
                  boxShadow: '0 0 16px rgba(0,170,255,0.12)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,170,255,0.18)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,170,255,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,170,255,0.10)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,170,255,0.12)'; }}
              >
                Start
              </button>
            </div>
          </div>
        )}

        {screen === 'playing' && (
          <div style={{ position: 'relative', width: totalW }}>
            <div style={{ position: 'absolute', left: -7, top: 0, width: 3, height: CELL, background: '#00aaff', borderRadius: 2 }} />
            <div style={{ position: 'absolute', right: -7, bottom: 0, width: 3, height: CELL, background: '#00aaff', borderRadius: 2 }} />
            {/* Fail flash overlay */}
            {flashFail && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 20, borderRadius: 6, pointerEvents: 'none',
                animation: 'gridFailFlash 0.9s ease forwards',
              }} />
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`,
              gridTemplateRows: `repeat(${GRID}, ${CELL}px)`,
              gap: GAP,
            }}>
              {Array.from({ length: GRID }, (_, row) =>
                Array.from({ length: GRID }, (_, col) => {
                  const key       = `${row}-${col}`;
                  const isActive  = playerPos.row === row && playerPos.col === col && phase === 'playing';
                  const isVisited = visited.has(key) && !isActive;
                  return (
                    <Cell
                      key={key}
                      cell={cells[row][col]}
                      isActive={isActive}
                      isVisited={isVisited}
                      shake={isActive && shake}
                      onPick={handlePick}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes mazeShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        @keyframes gridFailFlash {
          0%   { background: rgba(255,30,60,0.0); }
          15%  { background: rgba(255,30,60,0.55); }
          35%  { background: rgba(255,30,60,0.15); }
          55%  { background: rgba(255,30,60,0.45); }
          75%  { background: rgba(255,30,60,0.10); }
          100% { background: rgba(255,30,60,0.0); }
        }
      `}</style>
    </>
  );
}
