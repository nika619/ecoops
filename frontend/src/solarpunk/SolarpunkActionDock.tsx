/**
 * SolarpunkActionDock — Minimalist bottom bar.
 * Solid black pill "Merge Pipeline" + outline "View Full Report".
 */

interface SolarpunkActionDockProps {
  onMerge: () => void;
  onViewReport: () => void;
  onRestart?: () => void;
}

export default function SolarpunkActionDock({ onMerge, onViewReport, onRestart }: SolarpunkActionDockProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 24px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderRadius: '100px',
        border: '1px solid rgba(187, 203, 187, 0.15)',
        boxShadow: '0 20px 40px rgba(26, 28, 29, 0.06), 0 5px 10px rgba(26, 28, 29, 0.03)',
        animation: 'sp-dockSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <button
        onClick={onMerge}
        className="sp-btn-primary"
        style={{
          padding: '12px 28px',
          fontSize: '0.85rem',
          borderRadius: '100px',
        }}
      >
        🌱 Merge Pipeline
      </button>

      <button
        onClick={onViewReport}
        className="sp-btn-secondary"
        style={{
          padding: '12px 28px',
          fontSize: '0.85rem',
          borderRadius: '100px',
        }}
      >
        View Full Report
      </button>

      {onRestart && (
        <button
          onClick={onRestart}
          style={{
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            color: '#6c7b6d',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="Restart Analysis"
        >
          ↻
        </button>
      )}
    </div>
  );
}
