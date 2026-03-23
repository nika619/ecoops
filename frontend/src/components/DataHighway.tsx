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
  isAnalyzing: boolean;
}

export default function DataHighway({ currentStep, isAnalyzing }: DataHighwayProps) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseGlowRef = useRef<THREE.Mesh>(null);
  const pulseLightRef = useRef<THREE.PointLight>(null);
  const scroll = useScroll();
  const { progressRef } = useProgress();

  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(HIGHWAY_CURVE, 256, 0.05, 8, false), []);
  const tubeGlowGeometry = useMemo(() => new THREE.TubeGeometry(HIGHWAY_CURVE, 256, 0.12, 8, false), []);


  // Smooth world-space position that the pulse lerps toward
  const smoothPos = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!pulseRef.current || !pulseGlowRef.current) return;
    const t = state.clock.elapsedTime;
    const lerpSpeed = Math.min(delta * 2.0, 0.1);
    const n = STATION_POSITIONS.length; // 6

    if (isAnalyzing || currentStep > 0) {
      // ── Step-driven: lerp DIRECTLY toward the exact station position ──
      // currentStep goes 1..totalSteps; clamp to valid station index.
      const idx = Math.min(Math.max(currentStep - 1, 0), n - 1);
      smoothPos.current.lerp(STATION_POSITIONS[idx], lerpSpeed);

      // Use uniform param so CameraRig (getPoint) lands at same station
      progressRef.current = idx / (n - 1);
    } else {
      // ── Scroll-driven: use getPoint (uniform=control-point aligned) NOT getPointAt ──
      // scroll.offset goes 0→1 across SCROLL_PAGES pages.
      // getPoint(u) puts the ball AT STATION_POSITIONS[k] when u=k/(n-1) ✓
      const u = Math.max(0, Math.min(scroll.offset, 0.9999));
      smoothPos.current.lerp(HIGHWAY_CURVE.getPoint(u), lerpSpeed);
      progressRef.current = u;
    }

    pulseRef.current.position.copy(smoothPos.current);
    pulseGlowRef.current.position.copy(smoothPos.current);
    if (pulseLightRef.current) pulseLightRef.current.position.copy(smoothPos.current);

    // Pulsing glow
    const s = 1 + Math.sin(t * 5) * 0.3;
    pulseGlowRef.current.scale.setScalar(s);
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
