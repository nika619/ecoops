import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const SPACING = 30;

/** Generate curving points between all 6 stations */
function generateHighwayPoints(): THREE.Vector3[] {
  const stations: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    stations.push([i * SPACING, 0, 0]);
  }

  const points: THREE.Vector3[] = [];
  const segments = 100;

  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const x = t * (5 * SPACING);
    // Gentle wave on Y and Z for organic feel
    const y = Math.sin(t * Math.PI * 3) * 0.6 + Math.sin(t * Math.PI * 7) * 0.15;
    const z = Math.cos(t * Math.PI * 2.5) * 0.4;
    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

interface DataHighwayProps {
  currentStep: number;
  isTransitioning: boolean;
  transitionProgress: number; // 0-1 progress during transition
}

/** The glowing fiber-optic "Energy Stream" connecting all 6 pipeline stations */
export default function DataHighway({ currentStep, isTransitioning, transitionProgress }: DataHighwayProps) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseGlowRef = useRef<THREE.Mesh>(null);

  const highwayPoints = useMemo(() => generateHighwayPoints(), []);
  const linePoints = useMemo(() => highwayPoints.map(p => [p.x, p.y, p.z] as [number, number, number]), [highwayPoints]);

  // Data Pulse animation — travels along the highway
  useFrame((state) => {
    if (!pulseRef.current) return;
    const t = state.clock.elapsedTime;

    let pulsePos: number;
    if (isTransitioning) {
      // During transition: pulse moves from prev step to current step
      const prevStep = Math.max(1, currentStep - 1);
      const fromX = (prevStep - 1) * SPACING;
      const toX = (currentStep - 1) * SPACING;
      pulsePos = fromX + (toX - fromX) * transitionProgress;
    } else {
      // Idle: pulse gently oscillates around current station
      const baseX = (currentStep - 1) * SPACING;
      pulsePos = baseX + Math.sin(t * 2) * 1.5;
    }

    // Find the closest point on the highway curve for accurate Y/Z positioning
    const normalizedT = Math.max(0, Math.min(1, pulsePos / (5 * SPACING)));
    const index = Math.floor(normalizedT * (highwayPoints.length - 1));
    const point = highwayPoints[Math.min(index, highwayPoints.length - 1)];

    pulseRef.current.position.set(point.x, point.y, point.z);

    // Pulsing glow scale
    if (pulseGlowRef.current) {
      const scale = 1 + Math.sin(t * 4) * 0.3;
      pulseGlowRef.current.scale.setScalar(scale);
      pulseGlowRef.current.position.copy(pulseRef.current.position);
    }
  });

  return (
    <group>
      {/* Main Energy Stream line */}
      <Line
        points={linePoints}
        color="#00FFCC"
        lineWidth={2}
        transparent
        opacity={0.5}
      />

      {/* Secondary inner glow line */}
      <Line
        points={linePoints}
        color="#00E5FF"
        lineWidth={1}
        transparent
        opacity={0.25}
      />

      {/* Station nodes at each step position */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const isCompleted = i + 1 < currentStep;
        const isActive = i + 1 === currentStep;
        const isPending = i + 1 > currentStep;

        return (
          <group key={i} position={[i * SPACING, 0, 0]}>
            {/* Station ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.6, 0.75, 32]} />
              <meshStandardMaterial
                emissive={isPending ? '#334455' : '#00ffcc'}
                emissiveIntensity={isActive ? 4 : isCompleted ? 2 : 0.2}
                color={isPending ? '#111122' : '#003322'}
                transparent
                opacity={isPending ? 0.3 : 0.8}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Station glow sphere */}
            {(isActive || isCompleted) && (
              <Sphere args={[0.2, 12, 12]}>
                <meshBasicMaterial
                  color="#00ffcc"
                  toneMapped={false}
                  transparent
                  opacity={isActive ? 0.9 : 0.4}
                />
              </Sphere>
            )}

            {/* Station point light */}
            <pointLight
              color="#00ffcc"
              intensity={isActive ? 3 : isCompleted ? 1 : 0}
              distance={5}
            />
          </group>
        );
      })}

      {/* The Data Pulse — the bright sphere traveling the highway */}
      <Sphere ref={pulseRef} args={[0.35, 12, 12]}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </Sphere>

      {/* Pulse outer glow */}
      <Sphere ref={pulseGlowRef} args={[0.7, 12, 12]}>
        <meshBasicMaterial
          color="#00ffcc"
          toneMapped={false}
          transparent
          opacity={0.3}
        />
      </Sphere>

      {/* Pulse point light (follows pulse) */}
      <pointLight
        color="#00ffcc"
        intensity={3}
        distance={8}
        position={[0, 0, 0]}
        ref={(light) => {
          if (light && pulseRef.current) {
            // Will be updated by parent in useFrame
          }
        }}
      />
    </group>
  );
}
