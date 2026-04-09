import { motion, AnimatePresence } from 'framer-motion';

export function FeedbackOverlay({ feedback }) {
  const isFail = feedback === 'fail';
  const isSuccess = feedback === 'success';
  const isFullSuccess = feedback === 'fullSuccess';

  return (
    <AnimatePresence>
      {isFail && (
        <motion.div
          key="fail"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0.2, 0.35, 0] }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#ff224488',
            pointerEvents: 'none',
            zIndex: 200,
          }}
        />
      )}

      {isSuccess && (
        <motion.div
          key="success"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0] }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#00ff8844',
            pointerEvents: 'none',
            zIndex: 200,
          }}
        />
      )}

      {isFullSuccess && (
        <motion.div
          key="fullSuccess"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 200,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{
              padding: '24px 48px',
              background: '#001a0d',
              border: '2px solid #00ff88',
              borderRadius: 12,
              textAlign: 'center',
              boxShadow: '0 0 40px #00ff88, 0 0 80px #00ff8844',
            }}
          >
            <div style={{ fontSize: 48, color: '#00ff88', lineHeight: 1 }}>✓</div>
            <div style={{
              fontSize: 14,
              letterSpacing: 6,
              color: '#00ff88',
              marginTop: 8,
            }}>
              LOCK CRACKED
            </div>
            <div style={{ fontSize: 10, color: '#00ff8866', letterSpacing: 3, marginTop: 4 }}>
              FULL SEQUENCE COMPLETE
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
