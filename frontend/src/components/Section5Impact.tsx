import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { STATION_POSITIONS } from '../curveConfig';

/**
 * Station 5: Green Impact — Glowing wireframe tree on podium.
 * Metric cards are now rendered in the HTML overlay (TypographySeq).
 */
export default function Section5Impact() {
  const leavesRef = useRef<THREE.Mesh>(null);
  const treeRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const pos = STATION_POSITIONS[5];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (leavesRef.current) { leavesRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.04); }
    if (treeRef.current) { treeRef.current.rotation.y = t * 0.08; }
    if (ring1Ref.current) {
      const s1 = 1 + (t % 3.5) * 0.5;
      ring1Ref.current.scale.setScalar(s1);
      (ring1Ref.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.3 - (t % 3.5) * 0.08);
    }
    if (ring2Ref.current) {
      const s2 = 1 + ((t + 1.75) % 3.5) * 0.5;
      ring2Ref.current.scale.setScalar(s2);
      (ring2Ref.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.3 - ((t + 1.75) % 3.5) * 0.08);
    }
  });

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Hero text — inside camera view: station at world y=8, camera at y≈12 looking ahead */}
      <Float speed={1.5} floatIntensity={0.2} position={[0, 3.5, 0]}>
        <Text fontSize={1.0} color="#00ffcc" anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#003322">
          PIPELINE OPTIMIZED
          <meshBasicMaterial color="#00ffcc" toneMapped={false} />
        </Text>
      </Float>

      {/* Wireframe tree */}
      <group ref={treeRef}>
        <Float speed={1} floatIntensity={0.15}>
          <mesh position={[0, -1.5, 0]}>
            <cylinderGeometry args={[0.3, 0.5, 2.5, 8]} />
            <meshStandardMaterial color="#4a3b2c" emissive="#2a1b0c" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[2.5, 3, 6]} />
            <meshStandardMaterial color="#003322" emissive="#00ffcc" emissiveIntensity={1.5} wireframe />
          </mesh>
          <mesh ref={leavesRef} position={[0, 2.5, 0]}>
            <coneGeometry args={[1.8, 2.5, 6]} />
            <meshStandardMaterial color="#001a11" emissive="#00ffcc" emissiveIntensity={2.5} wireframe />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <sphereGeometry args={[0.3, 10, 10]} />
            <meshStandardMaterial emissive="#00ffcc" emissiveIntensity={5} color="#003322" />
          </mesh>
        </Float>
      </group>

      {/* Hexagonal podium */}
      <mesh position={[0, -3.3, 0]}>
        <cylinderGeometry args={[3, 3.5, 0.4, 6]} />
        <meshStandardMaterial color="#111122" emissive="#00ffcc" emissiveIntensity={0.3} />
      </mesh>

      {/* Pulse rings */}
      <group position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={ring1Ref}>
          <ringGeometry args={[2.2, 2.35, 24]} />
          <meshStandardMaterial emissive="#00ffcc" emissiveIntensity={2} color="#003322" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={ring2Ref}>
          <ringGeometry args={[2.2, 2.35, 24]} />
          <meshStandardMaterial emissive="#00ffcc" emissiveIntensity={2} color="#003322" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <pointLight color="#00ffcc" intensity={5} distance={20} position={[0, 5, 6]} />
    </group>
  );
}
