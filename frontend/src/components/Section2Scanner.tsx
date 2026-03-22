import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STATION_POSITIONS } from '../curveConfig';

/**
 * Station 2: Gemini AI Analysis — Translucent glass prism (octahedron).
 * Red spheres fly in from the left, green spheres emit from the right.
 */
export default function Section2Scanner() {
  const prismRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const pos = STATION_POSITIONS[1];

  // Input (red) and output (green) particles data
  const particles = useMemo(() => {
    const items: Array<{ side: 'input' | 'output'; phase: number; speed: number }> = [];
    for (let i = 0; i < 8; i++) {
      items.push({ side: 'input', phase: (i / 8) * Math.PI * 2, speed: 0.4 + Math.random() * 0.3 });
    }
    for (let i = 0; i < 8; i++) {
      items.push({ side: 'output', phase: (i / 8) * Math.PI * 2 + 0.3, speed: 0.3 + Math.random() * 0.4 });
    }
    return items;
  }, []);

  // Create refs array for particles
  const particleRefs = useRef<(THREE.Mesh | null)[]>(new Array(16).fill(null));

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate prism
    if (prismRef.current) {
      prismRef.current.rotation.y = t * 0.15;
      prismRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.15;
      wireRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }

    // Animate particles
    particles.forEach((p, i) => {
      const mesh = particleRefs.current[i];
      if (!mesh) return;

      const cycle = ((t * p.speed + p.phase) % (Math.PI * 2)) / (Math.PI * 2);

      if (p.side === 'input') {
        const dist = (1 - cycle) * 5;
        mesh.position.set(-dist, Math.sin(cycle * Math.PI * 4) * 1.5, Math.cos(cycle * Math.PI * 4) * 1.5);
        mesh.scale.setScalar(0.08 + (1 - cycle) * 0.08);
      } else {
        const dist = cycle * 5;
        mesh.position.set(dist, Math.sin(cycle * Math.PI * 3) * 1.2, Math.cos(cycle * Math.PI * 3) * 1.2);
        mesh.scale.setScalar(0.05 + cycle * 0.1);
      }
    });
  });

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Translucent glass prism */}
      <mesh ref={prismRef}>
        <octahedronGeometry args={[2, 0]} />
        <meshPhysicalMaterial
          color="#112244"
          emissive="#003366"
          emissiveIntensity={0.5}
          transparent
          opacity={0.25}
          roughness={0.05}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <octahedronGeometry args={[2.02, 0]} />
        <meshBasicMaterial color="#4488ff" wireframe transparent opacity={0.3} toneMapped={false} />
      </mesh>

      {/* Particles */}
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => { particleRefs.current[i] = el; }}
        >
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial
            color={p.side === 'input' ? '#ff2244' : '#00ffcc'}
            emissive={p.side === 'input' ? '#ff0022' : '#00ff88'}
            emissiveIntensity={4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Lighting */}
      <pointLight color="#4488ff" intensity={3} distance={10} />
      <pointLight color="#00ffcc" intensity={2} distance={8} position={[4, 0, 0]} />
      <pointLight color="#ff2244" intensity={2} distance={8} position={[-4, 0, 0]} />
    </group>
  );
}
