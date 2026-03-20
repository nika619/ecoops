import type { CSSProperties } from 'react';
import { Html, Float } from '@react-three/drei';

interface YamlDiffDisplaysProps {
  removedYaml?: string;
  addedYaml?: string;
}

/** A single holographic terminal with CSS-driven code-drift animation */
function HolographicTerminal({ text, title, color }: { text: string; title: string; color: string }) {
  const terminalStyle: CSSProperties = {
    background: 'rgba(5, 5, 15, 0.8)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${color}80`,
    boxShadow: `0 0 30px ${color}25, inset 0 1px 0 ${color}15`,
    borderRadius: '0px',
    padding: '20px',
    width: '280px',
    height: '320px',
    fontFamily: "'Space Grotesk', monospace",
    overflow: 'hidden',
    userSelect: 'none' as const,
    pointerEvents: 'none' as const,
    position: 'relative' as const,
  };

  // Inline keyframes for the drift (CSS animation approach — no useFrame)
  const driftKeyframes = `
    @keyframes codeDrift {
      0% { transform: translateY(-280px); }
      100% { transform: translateY(0px); }
    }
  `;

  const codeStyle: CSSProperties = {
    margin: 0,
    color: `${color}cc`,
    fontSize: '11px',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
    fontFamily: "'Space Grotesk', monospace",
    paddingBottom: '280px',
  };

  return (
    <div style={terminalStyle}>
      <style>{driftKeyframes}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: `1px solid ${color}25`,
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
        <span
          style={{
            color: color,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
          }}
        >
          {title}
        </span>
      </div>

      {/* Code drift container */}
      <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 40px)', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            width: '100%',
            animation: 'codeDrift 20s linear infinite',
          }}
        >
          <pre style={codeStyle}>{text}</pre>
          <pre style={codeStyle}>{text}</pre>
        </div>

        {/* Top fade gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(to bottom, rgba(5,5,15,0.95), transparent)',
            pointerEvents: 'none' as const,
            zIndex: 1,
          }}
        />
        {/* Bottom fade gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(to top, rgba(5,5,15,0.95), transparent)',
            pointerEvents: 'none' as const,
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

/** Two holographic YAML terminals flanking the Step 6 tree */
export default function YamlDiffDisplays({ removedYaml, addedYaml }: YamlDiffDisplaysProps) {
  const defaultRemoved = `lint:
  script: flake8 src/
build:
  script: python setup.py
test:
  script: pytest tests/
deploy:
  script: deploy.sh`;

  const defaultAdded = `lint:
  script: flake8 src/
  rules:
    - changes:
      - "src/**/*.py"
      - ".gitlab-ci.yml"
build:
  script: python setup.py
  rules:
    - changes:
      - "src/**"
test:
  script: pytest tests/
  rules:
    - changes:
      - "src/**/*.py"
      - "tests/**"`;

  const removed = removedYaml || defaultRemoved;
  const added = addedYaml || defaultAdded;

  return (
    <group>
      <Float speed={1.2} floatIntensity={0.15}>
        {/* Left Terminal — Before (Red) */}
        <Html
          position={[-7, 1, -3] as [number, number, number]}
          rotation={[0, Math.PI / 6, 0]}
          transform
          distanceFactor={8}
          occlude={false}
        >
          <HolographicTerminal text={removed} title="BEFORE: WASTEFUL YAML" color="#ff0055" />
        </Html>

        {/* Right Terminal — After (Cyan) */}
        <Html
          position={[7, 1, -3] as [number, number, number]}
          rotation={[0, -Math.PI / 6, 0]}
          transform
          distanceFactor={8}
          occlude={false}
        >
          <HolographicTerminal text={added} title="AFTER: ECOOPS OPTIMIZED" color="#00ffcc" />
        </Html>
      </Float>
    </group>
  );
}
