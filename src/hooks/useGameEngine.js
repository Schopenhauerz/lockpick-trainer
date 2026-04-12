import { useState, useEffect, useRef, useCallback } from 'react';

const DIRECTIONS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const SWEET_SPOT_END = 0.98;    // sweet spot always ends at 98% of track
const NODE_COUNT = 5;           // nodes: A B C D E
export const SEGMENT_COUNT = NODE_COUNT - 1; // 4 segments: A→B  B→C  C→D  D→E
const BASE_DURATION = 2000;     // ms per segment at 1x speed

// Generate one key per node (A..E), no two consecutive identical
function generateSequence() {
  const result = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    let pick;
    do {
      pick = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    } while (result.length > 0 && pick === result[result.length - 1]);
    result.push(pick);
  }
  return result;
}

export function useGameEngine() {
  // currentNode = index of the SOURCE node of the active segment (0..3)
  //   segment 0 → A→B  (bar leaves A, player must hit B's key)
  //   segment 1 → B→C  (bar leaves B, player must hit C's key)
  //   segment 2 → C→D
  //   segment 3 → D→E  ← last segment; hitting E's key wins
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [currentNode, setCurrentNode] = useState(0);
  const [sequence, setSequence] = useState(() => generateSequence());
  const [stats, setStats] = useState({ successes: 0, failures: 0, streak: 0, bestStreak: 0 });
  const [feedback, setFeedback] = useState(null); // null|'success'|'fail'|'fullSuccess'
  const [config, setConfig] = useState({
    speedMultiplier: 4.0,
    inputLatency: 0,
    sweetSpotWidth: 0.15,  // 83-98% window
    showSweetSpot: false,
  });

  const rafRef        = useRef(null);
  const startTimeRef  = useRef(null);
  const progressRef   = useRef(0);
  const phaseRef      = useRef('idle');
  const currentNodeRef = useRef(0);
  const sequenceRef   = useRef(sequence);
  const configRef     = useRef(config);
  const pendingEvalRef = useRef(false); // true while a latency-delayed eval is in-flight

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { currentNodeRef.current = currentNode; }, [currentNode]);
  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { configRef.current = config; }, [config]);

  const getDuration = useCallback(() =>
    BASE_DURATION / (configRef.current.speedMultiplier || 1), []);

  // ── Reset helper ────────────────────────────────────────────────────────────
  const doReset = useCallback((delay) => {
    setTimeout(() => {
      const newSeq = generateSequence();
      sequenceRef.current = newSeq;
      pendingEvalRef.current = false;
      progressRef.current = 0;
      currentNodeRef.current = 0;
      startTimeRef.current = null;
      setSequence(newSeq);
      setProgress(0);
      setCurrentNode(0);
      setFeedback(null);
      phaseRef.current = 'idle';
      setPhase('idle');
    }, delay);
  }, []);

  // ── Fail ────────────────────────────────────────────────────────────────────
  const triggerFail = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    phaseRef.current = 'fail';
    pendingEvalRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setFeedback('fail');
    setPhase('fail');
    setStats(s => ({ ...s, failures: s.failures + 1, streak: 0 }));
    doReset(850);
  }, [doReset]);

  // ── Success (one segment or full run) ───────────────────────────────────────
  const triggerSuccess = useCallback(() => {
    if (phaseRef.current !== 'running') return;

    const completedSrc = currentNodeRef.current;
    const next         = completedSrc + 1; // next = destination node index (1..4)

    pendingEvalRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    const bumpStats = s => {
      const streak = s.streak + 1;
      return { ...s, successes: s.successes + 1, streak, bestStreak: Math.max(s.bestStreak, streak) };
    };

    if (next >= SEGMENT_COUNT) {
      // ── next === 4 === E — all segments done, lock cracked ──
      phaseRef.current = 'success';
      setPhase('success');
      setFeedback('fullSuccess');
      setStats(bumpStats);
      doReset(1100);
    } else {
      // Zero delay: advance immediately — phaseRef stays 'running'
      currentNodeRef.current = next;
      progressRef.current    = 0;
      startTimeRef.current   = null;
      setStats(bumpStats);
      setProgress(0);
      setCurrentNode(next);  // triggers the RAF useEffect
    }
  }, [doReset]);

  // ── Evaluate a captured keypress against the DESTINATION node ───────────────
  // capturedProgress: progress value snapshotted at the exact moment of keypress
  const evaluate = useCallback((key, capturedProgress) => {
    if (phaseRef.current !== 'running') return;
    // Expected key = key assigned to the DESTINATION node (currentNode + 1)
    const expected       = sequenceRef.current[currentNodeRef.current + 1];
    const activeWidth    = configRef.current.showSweetSpot ? configRef.current.sweetSpotWidth : 0.15;
    const sweetSpotStart = SWEET_SPOT_END - activeWidth;
    const inSweetSpot    = capturedProgress >= sweetSpotStart && capturedProgress <= SWEET_SPOT_END;
    if (key === expected && inSweetSpot) {
      triggerSuccess();
    } else {
      triggerFail();
    }
  }, [triggerSuccess, triggerFail]);

  // ── Key handler ─────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (!DIRECTIONS.includes(e.key)) return;
    e.preventDefault();

    if (phaseRef.current === 'idle') {
      // Only A's key (sequence[0]) launches the bar — no timing needed
      if (e.key === sequenceRef.current[0]) {
        phaseRef.current = 'running';
        setPhase('running');
      }
      // Wrong key in idle: silently ignored — the node is already showing what to press
      return;
    }

    if (phaseRef.current !== 'running') return;
    if (pendingEvalRef.current) return; // one in-flight eval at a time

    const latency = configRef.current.inputLatency || 0;
    if (latency > 0) {
      const capturedKey = e.key;
      pendingEvalRef.current = true;
      // Read progress AFTER the delay — player must press early to compensate
      setTimeout(() => {
        pendingEvalRef.current = false;
        evaluate(capturedKey, progressRef.current);
      }, latency);
    } else {
      evaluate(e.key, progressRef.current);
    }
  }, [evaluate]);

  // ── Animation loop (rAF) ────────────────────────────────────────────────────
  const animate = useCallback((timestamp) => {
    if (phaseRef.current !== 'running') return;

    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const p = Math.min((timestamp - startTimeRef.current) / getDuration(), 1.0);

    progressRef.current = p;
    setProgress(p);

    if (p >= 1.0) {
      triggerFail();
      return;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [getDuration, triggerFail]);

  // Restart RAF whenever we enter 'running' or advance to a new segment
  useEffect(() => {
    if (phase !== 'running') return;
    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [phase, currentNode, animate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const updateConfig = useCallback((key, value) => {
    setConfig(c => {
      const next = { ...c, [key]: value };
      configRef.current = next;
      return next;
    });
  }, []);

  return {
    phase,
    progress,
    currentNode,   // source of active segment (0..3)
    sequence,      // key per node: [A, B, C, D, E]
    stats,
    feedback,
    config,
    updateConfig,
    sweetSpotStart: SWEET_SPOT_END - config.sweetSpotWidth,
    sweetSpotEnd: SWEET_SPOT_END,
    nodeCount: NODE_COUNT,
    segmentCount: SEGMENT_COUNT,
  };
}
