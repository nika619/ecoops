import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text, Float, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import YamlDiffDisplays from './YamlDiffDisplays';

interface Metrics {
  minutes_saved: number;
  cost_reduced: number;
  energy_kwh: number;
  co2_kg: number;
  trees: number;
}

interface DiffData {
  removed: string;
  added: string;
}

interface FinalResultsSceneProps {
  metrics?: Metrics;
  diff?: DiffData;
}

/* ─────────────────────────────────────────────────────────
   Compact Data Card — glassmorphism metric display
   ───────────────────────────────────────────────────────── */
function DataCard({
  position,
  icon,
  title,
  value,
  valueColor,
  subtitle,
}: {
  position: [number, number, number];
  icon: string;
  title: string;
  value: string;
  valueColor: string;
  subtitle: string;
}) {
  return (
    <Html position={position} transform scale={0.55} center>
      <div
        style={{
          background: 'rgba(5, 5, 15, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 255, 204, 0.25)',
          boxShadow: '0 0 12px rgba(0, 255, 204, 0.06)',
          borderRadius: '0px',
          padding: '12px 16px',
          width: '145px',
          fontFamily: "'Space Grotesk', monospace",
          userSelect: 'none' as const,
          pointerEvents: 'none' as const,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span
            style={{
              color: 'rgba(185, 203, 194, 0.6)',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
            }}
          >
            {title}
          </span>
        </div>
        <div
          style={{
            color: valueColor,
            fontSize: '20px',
            fontWeight: 700,
            textShadow: `0 0 10px ${valueColor}30`,
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        <div
          style={{
            color: 'rgba(185, 203, 194, 0.4)',
            fontSize: '9px',
            marginTop: '4px',
          }}
        >
          {subtitle}
        </div>
      </div>
    </Html>
  );
}

/* ─────────────────────────────────────────────────────────
   Pulse Rings — expanding rings at base of tree
   ───────────────────────────────────────────────────────── */
function PulseRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) {
      const s1 = 1 + (t % 4) * 0.8;
      ring1Ref.current.scale.set(s1, s1, s1);
      (ring1Ref.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.4 - (t % 4) * 0.1);
    }
    if (ring2Ref.current) {
      const s2 = 1 + ((t + 2) % 4) * 0.8;
      ring2Ref.current.scale.set(s2, s2, s2);
      (ring2Ref.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.4 - ((t + 2) % 4) * 0.1);
    }
  });

  return (
    <group position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ring1Ref}>
        <ringGeometry args={[3, 3.1, 32]} />
        <meshStandardMaterial emissive="#00ffcc" emissiveIntensity={2} color="#003322" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref}>
        <ringGeometry args={[3, 3.1, 32]} />
        <meshStandardMaterial emissive="#00ffcc" emissiveIntensity={2} color="#003322" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN: Final Results Scene
   Holographic YAML terminals + metric cards + hero text
   ───────────────────────────────────────────────────────── */
export default function FinalResultsScene({ metrics, diff }: FinalResultsSceneProps) {
  const data = metrics || {
    minutes_saved: 1680,
    cost_reduced: 13.44,
    energy_kwh: 14.0,
    co2_kg: 21.77,
    trees: 1,
  };

  const diffData = diff || {
    removed: `lint:\n  script: flake8 src/\nbuild:\n  script: python setup.py`,
    added: `lint:\n  script: flake8 src/\n  rules:\n    - changes:\n      - "src/**/*.py"\nbuild:\n  rules:\n    - changes:\n      - "src/**"`,
  };

  return (
    <PresentationControls
      global
      zoom={0.8}
      rotation={[0, 0, 0]}
      polar={[-Math.PI / 8, Math.PI / 8]}
      azimuth={[-Math.PI / 8, Math.PI / 8]}
    >
      <group>
        {/* ── HERO HOLOGRAM — "PIPELINE OPTIMIZED" ── */}
        <Float speed={2} floatIntensity={0.5} position={[0, 3.5, 2]}>
          <Text
            fontSize={0.65}
            color="#00ffcc"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#004433"
          >
            PIPELINE OPTIMIZED
            <meshBasicMaterial color="#00ffcc" toneMapped={false} />
          </Text>
          <Text position={[0, -0.5, 0]} fontSize={0.2} color="#e3e0f3" anchorX="center">
            {`${data.minutes_saved.toLocaleString()} Minutes Saved / Month`}
            <meshBasicMaterial color="#e3e0f3" toneMapped={false} transparent opacity={0.9} />
          </Text>
        </Float>

        {/* ── DATA CARDS — positioned to avoid UIOverlay ── */}
        {/* ── DATA CARDS — bottom row, spread wide to avoid overlap ── */}
        <DataCard
          position={[-3, -0.5, 8]}
          icon="💰"
          title="Cost Saved"
          value={`$${data.cost_reduced.toFixed(2)}/mo`}
          valueColor="#ffffff"
          subtitle="on CI runners"
        />
        <DataCard
          position={[-1, -0.5, 8]}
          icon="🌳"
          title="CO₂ Avoided"
          value={`${data.co2_kg} kg`}
          valueColor="#00ffcc"
          subtitle={`${data.trees} tree equiv.`}
        />
        <DataCard
          position={[1, -0.5, 8]}
          icon="⚡"
          title="Energy Saved"
          value={`${data.energy_kwh} kWh`}
          valueColor="#ffffff"
          subtitle="eliminated"
        />
        <DataCard
          position={[3, -0.5, 8]}
          icon="⏱️"
          title="Minutes"
          value={data.minutes_saved.toLocaleString()}
          valueColor="#00ffcc"
          subtitle="CI min / month"
        />

        {/* ── HOLOGRAPHIC YAML DIFF TERMINALS ──────── */}
        {/* Large, prominent terminals with code-drift animation */}
        <YamlDiffDisplays
          removedYaml={diffData.removed}
          addedYaml={diffData.added}
        />

        {/* ── ATMOSPHERIC RINGS ───────────────────── */}
        <PulseRings />
      </group>
    </PresentationControls>
  );
}
