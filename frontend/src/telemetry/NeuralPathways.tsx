/**
 * NeuralPathways — SVG neural network connecting pipeline nodes to AI Engine.
 * Animated particle flows (cyan down, purple up) with glowing intersection dots.
 */

interface NeuralPathwaysProps {
  activeStage: string | null;
  isOptimizing: boolean;
}

export default function NeuralPathways({ activeStage, isOptimizing }: NeuralPathwaysProps) {
  // Path definitions from each node down to the AI core
  const paths = [
    { id: 'commit',  d: 'M 12.5% 0% C 12.5% 45%, 50% 45%, 50% 95%' },
    { id: 'build',   d: 'M 37.5% 0% C 37.5% 40%, 50% 50%, 50% 95%' },
    { id: 'test',    d: 'M 62.5% 0% C 62.5% 40%, 50% 50%, 50% 95%' },
    { id: 'deploy',  d: 'M 87.5% 0% C 87.5% 45%, 50% 45%, 50% 95%' },
  ];

  // Intersection dots (where paths cross / converge)
  const dots = [
    { cx: '30%', cy: '42%' },
    { cx: '50%', cy: '55%' },
    { cx: '70%', cy: '42%' },
    { cx: '42%', cy: '48%' },
    { cx: '58%', cy: '48%' },
  ];

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      preserveAspectRatio="none"
    >
      {/* Base passive paths */}
      {paths.map((p) => (
        <path
          key={`base-${p.id}`}
          d={p.d}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
        />
      ))}

      {/* Active cyan data streams */}
      {paths.map((p) => {
        const isActive = activeStage === p.id || isOptimizing;
        return isActive ? (
          <path
            key={`stream-${p.id}`}
            d={p.d}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            className="te-data-stream"
            style={{ filter: 'drop-shadow(0 0 4px #06b6d4)' }}
          />
        ) : null;
      })}

      {/* Purple optimization reverse streams */}
      {isOptimizing && paths.map((p) => (
        activeStage === p.id ? (
          <path
            key={`opt-${p.id}`}
            d={p.d}
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            className="te-optimization-stream"
            style={{ filter: 'drop-shadow(0 0 6px #a855f7)' }}
          />
        ) : null
      ))}

      {/* Glowing intersection dots */}
      {dots.map((dot, i) => (
        <g key={`dot-${i}`}>
          <circle
            cx={dot.cx}
            cy={dot.cy}
            r="3"
            fill={isOptimizing ? '#a855f7' : 'rgba(6, 182, 212, 0.3)'}
            style={{
              filter: isOptimizing ? 'drop-shadow(0 0 4px #a855f7)' : 'none',
              transition: 'all 0.5s ease',
            }}
          />
          {isOptimizing && (
            <circle
              cx={dot.cx}
              cy={dot.cy}
              r="3"
              fill="transparent"
              stroke="#a855f7"
              strokeWidth="1"
              className="te-ping"
              style={{ opacity: 0.5 }}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
