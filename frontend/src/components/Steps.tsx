import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, Octahedron, Box, Text, Cylinder, Ring, Torus, Html } from '@react-three/drei';
import * as THREE from 'three';
import FinalResultsScene from './FinalResultsScene';

interface StepProps {
  position: [number, number, number];
  isActive: boolean;
}

/* ─────────────────────────────────────────────────────────
   STEP 1: Data Ingestion — The Chaotic Cloud
   Glowing GitLab sphere with orbiting commit particles
   ───────────────────────────────────────────────────────── */
function CommitParticles({ count, isActive }: { count: number; isActive: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      radius: 2.5 + Math.random() * 2,
      speed: 0.3 + Math.random() * 0.7,
      offset: (Math.PI * 2 * i) / count + Math.random() * 0.5,
      y: (Math.random() - 0.5) * 3,
      tilt: Math.random() * 0.4,
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      const angle = t * p.speed + p.offset;
      dummy.position.set(
        Math.cos(angle) * p.radius,
        p.y + Math.sin(t * p.speed * 0.5) * p.tilt,
        Math.sin(angle) * p.radius
      );
      dummy.scale.setScalar(isActive ? 0.08 : 0.04);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const colors = ['#fc6d26', '#ff9a4d', '#ffffff', '#ff5555', '#ffaa33'];

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color={colors[Math.floor(Math.random() * colors.length)]}
        emissive="#fc6d26"
        emissiveIntensity={isActive ? 3 : 0.5}
      />
    </instancedMesh>
  );
}

export function Step1({ position, isActive }: StepProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
          <Sphere args={[2, 32, 32]}>
            <meshStandardMaterial
              color="#000"
              emissive="#fc6d26"
              emissiveIntensity={isActive ? 2.5 : 0.5}
              wireframe
            />
          </Sphere>
        </Float>
        <CommitParticles count={80} isActive={isActive} />
      </group>
      {/* Point light for atmosphere */}
      <pointLight
        position={[0, 0, 0]}
        color="#fc6d26"
        intensity={isActive ? 8 : 1}
        distance={15}
      />
    </group>
  );
}


/* ─────────────────────────────────────────────────────────
   STEP 2: Gemini AI Analysis — The Prism of Truth
   Rotating glass prism with waste/valid particle separation
   ───────────────────────────────────────────────────────── */
function AnalysisParticles({ isActive }: { isActive: boolean }) {
  const wasteRef = useRef<THREE.Group>(null);
  const validRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (wasteRef.current) {
      wasteRef.current.rotation.y = t * 0.4;
      wasteRef.current.rotation.x = t * 0.15;
    }
    if (validRef.current) {
      validRef.current.rotation.y = -t * 0.3;
      validRef.current.rotation.z = t * 0.1;
    }
  });

  return (
    <>
      {/* Wasted runs (red, 70%) */}
      <group ref={wasteRef}>
        {Array.from({ length: 14 }, (_, i) => {
          const angle = (Math.PI * 2 * i) / 14;
          const r = 3 + Math.sin(i * 0.7) * 0.5;
          return (
            <Sphere key={`w-${i}`} args={[0.1, 8, 8]} position={[Math.cos(angle) * r, Math.sin(i) * 0.8, Math.sin(angle) * r]}>
              <meshStandardMaterial emissive="#ff2244" emissiveIntensity={isActive ? 3 : 0.5} color="#330000" />
            </Sphere>
          );
        })}
      </group>
      {/* Valid runs (green, 30%) */}
      <group ref={validRef}>
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI * 2 * i) / 6;
          const r = 3.5;
          return (
            <Sphere key={`v-${i}`} args={[0.12, 8, 8]} position={[Math.cos(angle) * r, Math.cos(i) * 0.6, Math.sin(angle) * r]}>
              <meshStandardMaterial emissive="#00ffcc" emissiveIntensity={isActive ? 4 : 0.5} color="#003322" />
            </Sphere>
          );
        })}
      </group>
    </>
  );
}

export function Step2({ position, isActive }: StepProps) {
  const prismRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (prismRef.current) {
      prismRef.current.rotation.x = state.clock.elapsedTime * 0.25;
      prismRef.current.rotation.y = state.clock.elapsedTime * 0.35;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} floatIntensity={0.3}>
        <Octahedron ref={prismRef} args={[2.5]}>
          <meshPhysicalMaterial
            color="#1a73e8"
            emissive="#4285f4"
            emissiveIntensity={isActive ? 1.5 : 0.2}
            transparent
            opacity={0.6}
            roughness={0}
            metalness={0.1}
            transmission={0.5}
            thickness={1}
          />
        </Octahedron>
      </Float>
      <AnalysisParticles isActive={isActive} />
      <pointLight position={[0, 0, 0]} color="#4285f4" intensity={isActive ? 6 : 1} distance={12} />
    </group>
  );
}


/* ─────────────────────────────────────────────────────────
   STEP 3: YAML Optimization — The Matrix Re-write
   Floating code text with emissive green glow
   ───────────────────────────────────────────────────────── */
export function Step3({ position, isActive }: StepProps) {
  const codeRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (codeRef.current) {
      codeRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  const codeLines = [
    '# ECOOPS: Optimized',
    'lint:',
    '  script: flake8 src/',
    '  rules:',
    '    - changes:',
    '      - "src/**/*.py"',
    '      - ".gitlab-ci.yml"',
  ];

  const deletedLines = [
    '# Before: Ran on EVERY commit',
    'lint:',
    '  script: flake8 src/',
  ];

  return (
    <group position={position}>
      <Float speed={1} floatIntensity={0.4} rotationIntensity={0.1}>
        <group ref={codeRef}>
          {/* Deleted (red) code fading away */}
          {deletedLines.map((line, i) => (
            <Text
              key={`del-${i}`}
              color={isActive ? '#ff2244' : '#331111'}
              fontSize={0.28}
              position={[-3.5, 2.5 - i * 0.5, -1]}
              anchorX="left"

            >
              {line}
              <meshStandardMaterial
                color="#220000"
                emissive="#ff2244"
                emissiveIntensity={isActive ? 1.5 : 0.1}
                transparent
                opacity={isActive ? 0.4 : 0.1}
              />
            </Text>
          ))}

          {/* New (green) optimized code */}
          {codeLines.map((line, i) => (
            <Text
              key={`add-${i}`}
              color={isActive ? '#00ffcc' : '#113322'}
              fontSize={0.3}
              position={[-1.5, 1.5 - i * 0.55, 0]}
              anchorX="left"

            >
              {line}
              <meshStandardMaterial
                color="#002211"
                emissive="#00ffcc"
                emissiveIntensity={isActive ? 2.5 : 0.2}
              />
            </Text>
          ))}
        </group>
      </Float>
      <pointLight position={[0, 0, 3]} color="#00ffcc" intensity={isActive ? 5 : 0.5} distance={10} />
    </group>
  );
}


/* ─────────────────────────────────────────────────────────
   STEP 4: Linter Validation — The Scanner
   Scanning gate with animated laser plane
   ───────────────────────────────────────────────────────── */
export function Step4({ position, isActive }: StepProps) {
  const scannerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (scannerRef.current && isActive) {
      scannerRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 2;
    }
    if (ringRef.current && isActive) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      ringRef.current.scale.set(scale, scale, scale);
      ringRef.current.rotation.z = state.clock.elapsedTime;
    }
  });

  return (
    <group position={position}>
      {/* Gate frame */}
      <Box args={[4, 4, 0.3]} position={[0, 0, -1]}>
        <meshStandardMaterial color="#111122" emissive="#223344" emissiveIntensity={0.3} wireframe />
      </Box>
      <Box args={[3.5, 3.5, 0.2]} position={[0, 0, -1]}>
        <meshStandardMaterial color="#0a0a15" transparent opacity={0.3} />
      </Box>

      {/* Scanning laser plane */}
      <Box ref={scannerRef} args={[3.8, 0.05, 0.4]} position={[0, 0, -0.8]}>
        <meshStandardMaterial
          emissive="#00ffcc"
          emissiveIntensity={isActive ? 5 : 0.5}
          color="#003322"
          transparent
          opacity={0.8}
        />
      </Box>

      {/* Success pulse ring */}
      <Ring ref={ringRef} args={[2, 2.2, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial
          emissive="#00ffcc"
          emissiveIntensity={isActive ? 3 : 0}
          color="#003322"
          transparent
          opacity={isActive ? 0.6 : 0}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Validated checkmark indicator */}
      {isActive && (
        <Html position={[0, -3, 0]} center>
          <div
            style={{
              background: 'rgba(0, 255, 204, 0.15)',
              border: '1px solid rgba(0, 255, 204, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#00ffcc',
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              textShadow: '0 0 10px rgba(0,255,204,0.5)',
            }}
          >
            ✅ YAML VALIDATED
          </div>
        </Html>
      )}

      <pointLight position={[0, 0, 2]} color="#00ffcc" intensity={isActive ? 6 : 0.5} distance={10} />
    </group>
  );
}


/* ─────────────────────────────────────────────────────────
   STEP 5: Branch & Commit — The Highway
   Glowing pipeline tubes that fork into two branches
   ───────────────────────────────────────────────────────── */
export function Step5({ position, isActive }: StepProps) {
  const branchRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (pulseRef.current && isActive) {
      const t = state.clock.elapsedTime;
      pulseRef.current.position.x = -2 + ((t * 2) % 6);
    }
    if (branchRef.current) {
      branchRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group position={position} ref={branchRef}>
      {/* Main pipeline */}
      <Cylinder args={[0.2, 0.2, 6]} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
        <meshStandardMaterial
          emissive="#fc6d26"
          emissiveIntensity={isActive ? 1.5 : 0.3}
          color="#331a00"
        />
      </Cylinder>

      {/* New branch splitting off */}
      <Cylinder args={[0.15, 0.15, 4]} rotation={[0, 0, Math.PI / 4]} position={[1.5, 1.8, 0]}>
        <meshStandardMaterial
          emissive="#00ffcc"
          emissiveIntensity={isActive ? 3 : 0.3}
          color="#003322"
        />
      </Cylinder>

      {/* Glowing data pulse traveling along pipe */}
      <Sphere ref={pulseRef} args={[0.3, 16, 16]} position={[-2, 0, 0]}>
        <meshStandardMaterial
          emissive="#00ffcc"
          emissiveIntensity={isActive ? 5 : 0}
          color="#003322"
        />
      </Sphere>

      {/* Connection node */}
      <Torus args={[0.4, 0.1, 16, 32]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          emissive="#ffaa00"
          emissiveIntensity={isActive ? 2 : 0.3}
          color="#332200"
        />
      </Torus>

      {/* Branch label */}
      {isActive && (
        <Html position={[2.5, 3.5, 0]} center>
          <div
            style={{
              background: 'rgba(0, 255, 204, 0.12)',
              border: '1px solid rgba(0, 255, 204, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#00ffcc',
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '11px',
              whiteSpace: 'nowrap',
              textShadow: '0 0 8px rgba(0,255,204,0.4)',
            }}
          >
            🌿 ecoops/optimize-pipeline
          </div>
        </Html>
      )}

      <pointLight position={[1, 2, 2]} color="#00ffcc" intensity={isActive ? 5 : 0.5} distance={12} />
      <pointLight position={[-1, 0, 2]} color="#fc6d26" intensity={isActive ? 3 : 0.5} distance={10} />
    </group>
  );
}


/* ─────────────────────────────────────────────────────────
   STEP 6: Green Impact — The Tree of Life
   Low-poly tree with pulsing leaves + floating metric cards
   ───────────────────────────────────────────────────────── */
// ImpactMetricCard removed — replaced by FinalResultsScene


export function Step6({ position, isActive, metrics, diff }: StepProps & {
  metrics?: { minutes_saved: number; cost_reduced: number; energy_kwh: number; co2_kg: number; trees: number };
  diff?: { removed: string; added: string };
}) {
  const leavesRef = useRef<THREE.Mesh>(null);
  const treeGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (leavesRef.current && isActive) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      leavesRef.current.scale.set(scale, scale, scale);
    }
    if (treeGroupRef.current) {
      treeGroupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Podium / base platform */}
      <Cylinder args={[3, 3.5, 0.5, 6]} position={[0, -3.3, 0]}>
        <meshStandardMaterial
          color="#111122"
          emissive="#00ffcc"
          emissiveIntensity={isActive ? 0.3 : 0.05}
        />
      </Cylinder>

      <group ref={treeGroupRef}>
        <Float speed={1.5} floatIntensity={0.3}>
          {/* Trunk */}
          <Cylinder args={[0.3, 0.5, 2.5]} position={[0, -1.5, 0]}>
            <meshStandardMaterial color="#4a3b2c" emissive="#2a1b0c" emissiveIntensity={0.3} />
          </Cylinder>

          {/* Leaves — lower cone */}
          <Cylinder args={[0, 2.5, 3, 6]} position={[0, 0.8, 0]}>
            <meshStandardMaterial
              color="#003322"
              emissive="#00ffcc"
              emissiveIntensity={isActive ? 1.5 : 0.3}
              wireframe
            />
          </Cylinder>

          {/* Leaves — upper cone (pulsing) */}
          <Cylinder ref={leavesRef} args={[0, 1.8, 2.5, 6]} position={[0, 2.5, 0]}>
            <meshStandardMaterial
              color="#001a11"
              emissive="#00ffcc"
              emissiveIntensity={isActive ? 2.5 : 0.5}
              wireframe
            />
          </Cylinder>

          {/* Tree top glow sphere */}
          <Sphere args={[0.3, 16, 16]} position={[0, 4, 0]}>
            <meshStandardMaterial
              emissive="#00ffcc"
              emissiveIntensity={isActive ? 5 : 1}
              color="#003322"
            />
          </Sphere>
        </Float>
      </group>

      {/* Full holographic results scene — surrounds the tree */}
      {isActive && <FinalResultsScene metrics={metrics} diff={diff} />}

      <pointLight position={[0, 3, 3]} color="#00ffcc" intensity={isActive ? 8 : 1} distance={15} />
    </group>
  );
}

