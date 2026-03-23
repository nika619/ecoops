import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STATION_POSITIONS } from '../curveConfig';

/**
 * Station 1: GitLab Ingestion — Wireframe Globe with orbiting commit particles.
 * Globe is positioned at Y:2 so it's at camera eye-level (camera is Y+4).
 */
export default function Section1Rack() {
  const globeRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const pos = STATION_POSITIONS[0];

  // Generate orbital spheres
  const orbitals = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      radius: 3.5 + Math.random() * 3,
      speed: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 2,
      yOscFreq: 0.3 + Math.random() * 0.5,
      scale: 0.1 + Math.random() * 0.15,
      color: i % 3 === 0 ? '#ff4422' : i % 3 === 1 ? '#ff7733' : '#fc6d26',
      emissive: i % 3 === 0 ? '#ff2200' : i % 3 === 1 ? '#ff5500' : '#ff3300',
    }));
  }, []);

  const sphereRefs = useRef<(THREE.Mesh | null)[]>(new Array(18).fill(null));

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate globe slowly
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.08;
      globeRef.current.rotation.x = Math.sin(t * 0.04) * 0.1;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.08;
      wireRef.current.rotation.x = Math.sin(t * 0.04) * 0.1;
    }

    // Animate orbiting spheres
    orbitals.forEach((orb, i) => {
      const mesh = sphereRefs.current[i];
      if (!mesh) return;
      const angle = t * orb.speed + orb.phase;
      mesh.position.set(
        Math.cos(angle) * orb.radius,
        Math.sin(angle * orb.yOscFreq) * orb.radius * 0.4 + orb.tilt,
        Math.sin(angle) * orb.radius
      );
      const s = orb.scale * (1 + Math.sin(t * 3 + i) * 0.15);
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group position={[pos.x, pos.y + 2, pos.z]}>
      {/* Central wireframe globe — large, at eye level */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2.2, 32, 20]} />
        <meshStandardMaterial
          color="#0a0a20"
          emissive="#fc6d26"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[2.25, 32, 20]} />
        <meshBasicMaterial color="#fc6d26" wireframe transparent opacity={0.4} toneMapped={false} />
      </mesh>
      {/* Inner glow core */}
      <mesh>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={0.12} />
      </mesh>

      {/* Orbital red/orange spheres */}
      {orbitals.map((orb, i) => (
        <mesh key={i} ref={(el) => { sphereRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={orb.color}
            emissive={orb.emissive}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Orbital rings for visual richness */}
      <mesh rotation={[Math.PI * 0.35, 0, Math.PI * 0.1]}>
        <torusGeometry args={[4, 0.025, 8, 64]} />
        <meshBasicMaterial color="#fc6d26" transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI * 0.55, Math.PI * 0.3, 0]}>
        <torusGeometry args={[5, 0.02, 8, 64]} />
        <meshBasicMaterial color="#ff7733" transparent opacity={0.18} toneMapped={false} />
      </mesh>

      {/* Ambient lighting */}
      <pointLight color="#ff4422" intensity={5} distance={18} />
      <pointLight color="#fc6d26" intensity={3} distance={12} position={[3, 2, 0]} />
    </group>
  );
}
