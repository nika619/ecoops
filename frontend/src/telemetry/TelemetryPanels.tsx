/**
 * TelemetryPanels — Floating side panels with metrics and sparklines.
 * Left: Throughput, Latency, Cache Hit
 * Right: SVG sparkline charts
 */

interface TelemetryPanelsProps {
  isOptimizing: boolean;
  currentStep: number;
}

export default function TelemetryPanels({ isOptimizing, currentStep }: TelemetryPanelsProps) {
  const metrics = [
    { label: 'THROUGHPUT', value: '847', unit: 'ops/s', color: '#4cd7f6' },
    { label: 'LATENCY', value: '12', unit: 'ms', color: '#4edea3' },
    { label: 'CACHE HIT', value: '94', unit: '%', color: '#4cd7f6' },
  ];

  const sparklines = [
    { label: 'RESOURCE LOAD', value: '12%', color: '#4edea3', points: '0,30 15,28 30,32 45,25 60,22 75,18 90,15 105,12 120,14' },
    { label: 'ERROR DELTA', value: '-0.64%', color: '#ef4444', points: '0,10 15,12 30,18 45,14 60,16 75,20 90,15 105,12 120,8' },
    { label: 'DEPLOY SPEED', value: '+38%', color: '#a855f7', points: '0,35 15,32 30,28 45,30 60,24 75,20 90,16 105,12 120,8' },
  ];

  return (
    <>
      {/* Left — Metric Cards */}
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 10,
          animation: 'te-fadeSlideLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          animationDelay: '0.3s',
          animationFillMode: 'both',
        }}
      >
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className="te-glass"
            style={{
              padding: '12px 16px',
              width: '130px',
              animation: 'te-fadeSlideLeft 0.5s ease',
              animationDelay: `${0.4 + i * 0.1}s`,
              animationFillMode: 'both',
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.55rem',
                letterSpacing: '0.15em',
                color: 'rgba(220, 226, 248, 0.4)',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              {m.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: m.color,
                  textShadow: `0 0 10px ${m.color}40`,
                }}
              >
                {m.value}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.65rem',
                  color: 'rgba(220, 226, 248, 0.3)',
                }}
              >
                {m.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right — Sparkline Charts */}
      <div
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 10,
          animation: 'te-fadeSlideRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          animationDelay: '0.3s',
          animationFillMode: 'both',
        }}
      >
        {sparklines.map((s, i) => (
          <div
            key={s.label}
            className="te-glass"
            style={{
              padding: '12px 16px',
              width: '180px',
              animation: 'te-fadeSlideRight 0.5s ease',
              animationDelay: `${0.4 + i * 0.1}s`,
              animationFillMode: 'both',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.5rem',
                  letterSpacing: '0.15em',
                  color: 'rgba(220, 226, 248, 0.4)',
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: s.color,
                }}
              >
                {s.value}
              </span>
            </div>
            <svg width="100%" height="32" viewBox="0 0 120 40" preserveAspectRatio="none">
              <polyline
                points={s.points}
                fill="none"
                stroke={s.color}
                strokeWidth="1.5"
                className="te-sparkline"
                style={{ filter: `drop-shadow(0 0 3px ${s.color})` }}
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Footer Status Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.6rem',
          color: 'rgba(220, 226, 248, 0.25)',
          letterSpacing: '0.1em',
        }}
      >
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>
            <span style={{ color: '#10b981', marginRight: '6px' }}>■</span>
            CLUSTER_ID: ALPHA-PRIME
          </span>
          <span>
            <span style={{ color: '#06b6d4', marginRight: '6px' }}>◆</span>
            REGION: US-EAST-1
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🌱</span>
          <span>{isOptimizing ? `${currentStep} OPS ACTIVE` : 'STANDBY'}</span>
        </div>
      </div>
    </>
  );
}
