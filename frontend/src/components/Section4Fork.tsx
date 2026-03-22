import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { STATION_POSITIONS } from '../curveConfig';

/**
 * Station 4: The Clean Branch — Pipeline fork.
 * Main orange line continues dimly; bright cyan branch diverges upward.
 */
export default function Section4Fork() {
  const pulseRef = useRef<THREE.Mesh>(null);
  const scroll = useScroll();
  const pos = STATION_POSITIONS[3];

  // Main pipeline (horizontal orange)
  const mainPath = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => new THREE.Vector3(-5 + i * 0.5, 0, 0));
  }, []);

  // Fork branch (curves upward and right, cyan)
  const forkPath = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const t = i / 13;
      return new THREE.Vector3(t * 7, t * 4, -t * 3);
    });
  }, []);

  useFrame((state) => {
    const progress = scroll.range(0.6, 0.18);
    const t = state.clock.elapsedTime;

    if (pulseRef.current) {
      const idx = Math.min(Math.floor(progress * forkPath.length), forkPath.length - 1);
      const pt = forkPath[idx];
      pulseRef.current.position.set(pt.x, pt.y, pt.z);
      const s = 0.12 + Math.abs(Math.sin(t * 4)) * 0.08;
      pulseRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Main pipeline (orange, dimming) */}
      {mainPath.map((pt, i) => (
        <mesh key={`m-${i}`} position={[pt.x, pt.y, pt.z]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#fc6d26" toneMapped={false} />
        </mesh>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 10, 6]} />
        <meshStandardMaterial color="#331a00" emissive="#fc6d26" emissiveIntensity={1.5} />
      </mesh>

      {/* Junction node (glowing torus) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.08, 12, 24]} />
        <meshStandardMaterial color="#332200" emissive="#ffaa00" emissiveIntensity={4} />
      </mesh>

      {/* Cyan fork branch */}
      {forkPath.map((pt, i) => (
        <mesh key={`f-${i}`} position={[pt.x, pt.y, pt.z]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color="#00ffcc" toneMapped={false} />
        </mesh>
      ))}

      {/* Traveling pulse on fork */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      <pointLight color="#00ffcc" intensity={3} distance={10} position={[5, 3, -2]} />
      <pointLight color="#fc6d26" intensity={2} distance={8} position={[-3, 0, 0]} />
    </group>
  );
}
