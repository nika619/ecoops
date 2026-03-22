import type { CSSProperties } from 'react';

/**
 * ActionDock — Bottom glassmorphism action buttons.
 * Appears as a fixed bar at the bottom of the last scroll section.
 */
interface ActionDockProps {
  onMerge: () => void;
  onViewReport: () => void;
  onRestart: () => void;
}

export default function ActionDock({ onMerge, onViewReport, onRestart }: ActionDockProps) {
  return (
    <div style={dockStyle}>
      <button style={{ ...btnStyle, background: 'linear-gradient(135deg, #00ffcc, #00e0b3)' }} onClick={onMerge}>
        🌿 Merge Pipeline
      </button>
      <button style={{ ...btnStyle, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,255,204,0.3)' }} onClick={onViewReport}>
        📊 View Report
      </button>
      <button style={{ ...btnStyle, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }} onClick={onRestart}>
        ↻ Restart
      </button>
    </div>
  );
}

const dockStyle: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  padding: '20px 40px',
  background: 'rgba(5, 5, 15, 0.8)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(0, 255, 204, 0.1)',
  zIndex: 50,
  fontFamily: "'Space Grotesk', monospace",
};

const btnStyle: CSSProperties = {
  padding: '14px 28px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '14px',
  color: '#fff',
  fontFamily: "'Space Grotesk', monospace",
  letterSpacing: '0.04em',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};
