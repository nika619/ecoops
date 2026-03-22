import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { HIGHWAY_CURVE, STATION_POSITIONS } from '../curveConfig';
import { useProgress } from '../ProgressContext';

/**
 * DataHighway — The glowing wire + step-driven data pulse.
 * Pulse only moves when analysis steps fire. Uses shared ProgressContext
 * instead of injecting properties on scene objects.
 */
interface DataHighwayProps {
  currentStep: number;
  totalSteps: number;
  isAnalyzing: boolean;
}

export default function DataHighway({ currentStep, totalSteps, isAnalyzing }: DataHighwayProps) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseGlowRef = useRef<THREE.Mesh>(null);
  const pulseLightRef = useRef<THREE.PointLight>(null);
  const scroll = useScroll();
  const smoothT = useRef(0);
  const { progressRef } = useProgress();

  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(HIGHWAY_CURVE, 256, 0.05, 8, false), []);
  const tubeGlowGeometry = useMemo(() => new THREE.TubeGeometry(HIGHWAY_CURVE, 256, 0.12, 8, false), []);

  useFrame((state, delta) => {
    if (!pulseRef.current || !pulseGlowRef.current) return;
    const t = state.clock.elapsedTime;

    // Step-driven target
    const stepT = (isAnalyzing || currentStep > 0)
      ? Math.min(currentStep / totalSteps, 1.0)
      : 0;

    // Use whichever is further ahead: scroll or step progress
    const targetT = Math.max(scroll.offset, stepT);

    // Smoothly animate pulse towards target
    smoothT.current += (targetT - smoothT.current) * Math.min(delta * 1.5, 0.08);
    const progress = Math.max(0, Math.min(smoothT.current, 0.999));

    // Position pulse on curve
    const pulsePos = HIGHWAY_CURVE.getPointAt(progress);
    pulseRef.current.position.copy(pulsePos);
    pulseGlowRef.current.position.copy(pulsePos);
    if (pulseLightRef.current) pulseLightRef.current.position.copy(pulsePos);

    // Pulsing glow
    const s = 1 + Math.sin(t * 5) * 0.3;
    pulseGlowRef.current.scale.setScalar(s);

    // Share progress via context ref (no scene.traverse needed)
    progressRef.current = progress;
  });

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <mesh geometry={tubeGlowGeometry}>
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.12} toneMapped={false} />
      </mesh>

      {STATION_POSITIONS.map((pos, i) => (
        <group key={i} position={[pos.x, pos.y, pos.z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.06, 8, 24]} />
            <meshStandardMaterial emissive="#00ffcc" emissiveIntensity={2} color="#003322" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshBasicMaterial color="#00ffcc" toneMapped={false} />
          </mesh>
          <pointLight color="#00ffcc" intensity={2} distance={8} />
        </group>
      ))}

      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh ref={pulseGlowRef}>
        <sphereGeometry args={[0.7, 10, 10]} />
        <meshBasicMaterial color="#00ffcc" toneMapped={false} transparent opacity={0.2} />
      </mesh>
      <pointLight ref={pulseLightRef} color="#00ffcc" intensity={3} distance={10} />
    </group>
  );
}
