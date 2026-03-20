import { type CSSProperties, useState } from 'react';

interface ActionConsoleProps {
  isVisible: boolean;
  onMerge?: () => void;
  onViewReport?: () => void;
  onRestart?: () => void;
}

export default function ActionConsole({ isVisible, onMerge, onViewReport, onRestart }: ActionConsoleProps) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [clickedBtn, setClickedBtn] = useState<string | null>(null);

  if (!isVisible) return null;

  const handleClick = (id: string, handler?: () => void) => {
    setClickedBtn(id);
    setTimeout(() => setClickedBtn(null), 300);
    handler?.();
  };

  const primaryStyle: CSSProperties = {
    background: hoveredBtn === 'merge'
      ? 'linear-gradient(135deg, #00ffcc, #00cc99)'
      : 'linear-gradient(135deg, #00e0b3, #00ffcc)',
    color: '#050510',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
    fontFamily: "'Space Grotesk', monospace",
    fontSize: '14px',
    letterSpacing: '0.03em',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: hoveredBtn === 'merge'
      ? '0 0 30px rgba(0, 255, 204, 0.4), 0 4px 15px rgba(0, 255, 204, 0.3)'
      : '0 0 20px rgba(0, 255, 204, 0.2)',
    transform: hoveredBtn === 'merge'
      ? 'translateY(-2px) scale(1.02)'
      : clickedBtn === 'merge'
        ? 'scale(0.97)'
        : 'translateY(0)',
  };

  const secondaryStyle: CSSProperties = {
    background: hoveredBtn === 'report' ? 'rgba(0, 255, 204, 0.12)' : 'transparent',
    color: '#00ffcc',
    border: '1px solid rgba(0, 255, 204, 0.4)',
    padding: '14px 28px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: "'Space Grotesk', monospace",
    fontSize: '13px',
    letterSpacing: '0.03em',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: hoveredBtn === 'report' ? '0 0 15px rgba(0, 255, 204, 0.15)' : 'none',
    transform: hoveredBtn === 'report'
      ? 'translateY(-1px)'
      : clickedBtn === 'report'
        ? 'scale(0.97)'
        : 'translateY(0)',
  };

  const ghostStyle: CSSProperties = {
    background: 'transparent',
    color: hoveredBtn === 'restart' ? '#e3e0f3' : 'rgba(185, 203, 194, 0.5)',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 500,
    fontFamily: "'Space Grotesk', monospace",
    fontSize: '13px',
    transition: 'all 0.3s ease',
    transform: clickedBtn === 'restart' ? 'scale(0.95)' : 'translateY(0)',
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'rgba(12, 12, 24, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 255, 204, 0.15)',
        borderRadius: '16px',
        padding: '14px 24px',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 204, 0.05), inset 0 1px 0 rgba(255,255,255,0.04)',
        pointerEvents: 'auto',
        animation: 'dockSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <button
        style={primaryStyle}
        onMouseEnter={() => setHoveredBtn('merge')}
        onMouseLeave={() => setHoveredBtn(null)}
        onClick={() => handleClick('merge', onMerge)}
      >
        🌿 Merge 'ecoops/optimize-pipeline'
      </button>

      <div style={{ width: '1px', height: '28px', background: 'rgba(0, 255, 204, 0.15)' }} />

      <button
        style={secondaryStyle}
        onMouseEnter={() => setHoveredBtn('report')}
        onMouseLeave={() => setHoveredBtn(null)}
        onClick={() => handleClick('report', onViewReport)}
      >
        📊 View Green Impact Report
      </button>

      <button
        style={ghostStyle}
        onMouseEnter={() => setHoveredBtn('restart')}
        onMouseLeave={() => setHoveredBtn(null)}
        onClick={() => handleClick('restart', onRestart)}
      >
        ↻ Restart
      </button>
    </div>
  );
}
