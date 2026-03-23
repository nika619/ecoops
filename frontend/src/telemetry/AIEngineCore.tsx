/**
 * AIEngineCore — Pulsing concentric circle AI engine with purple glow.
 * The hero element at the bottom center of the telemetry dashboard.
 */

interface AIEngineCoreProps {
  isOptimizing: boolean;
  message: string;
}

export default function AIEngineCore({ isOptimizing, message }: AIEngineCoreProps) {
  return (
    <div
      className={`te-glass ${isOptimizing ? 'te-glow-purple' : ''}`}
      style={{
        width: '280px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        borderRadius: '16px',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      }}
    >
      {/* Concentric rings */}
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        {/* Outer ring */}
        <div
          className="te-ring-pulse"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `3px solid ${isOptimizing ? '#a855f7' : 'rgba(168, 85, 247, 0.3)'}`,
            transition: 'border-color 0.3s ease',
          }}
        />

        {/* Middle ring */}
        <div
          style={{
            position: 'absolute',
            inset: '12px',
            borderRadius: '50%',
            border: `2px solid ${isOptimizing ? 'rgba(168, 85, 247, 0.6)' : 'rgba(168, 85, 247, 0.15)'}`,
            transition: 'border-color 0.3s ease',
          }}
        />

        {/* Inner core */}
        <div
          className={isOptimizing ? 'te-ai-pulse-fast' : 'te-ai-pulse'}
          style={{
            position: 'absolute',
            inset: '24px',
            borderRadius: '50%',
            background: isOptimizing
              ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
              : 'rgba(168, 85, 247, 0.4)',
            boxShadow: isOptimizing
              ? '0 0 20px rgba(168, 85, 247, 0.6)'
              : '0 0 10px rgba(168, 85, 247, 0.2)',
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
          }}
        />

        {/* Ping effect when active */}
        {isOptimizing && (
          <div
            className="te-ping"
            style={{
              position: 'absolute',
              inset: '24px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.4)',
            }}
          />
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: '0.85rem',
          letterSpacing: '0.2em',
          color: isOptimizing ? '#ddb7ff' : 'rgba(221, 183, 255, 0.6)',
          textTransform: 'uppercase',
          transition: 'color 0.3s ease',
        }}
      >
        ECOOPS ENGINE
      </div>

      {/* Status message */}
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.7rem',
          color: 'rgba(220, 226, 248, 0.4)',
          textAlign: 'center',
          lineHeight: 1.4,
          maxWidth: '220px',
        }}
      >
        {message}
      </div>
    </div>
  );
}
