import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { STATION_POSITIONS } from '../curveConfig';

/**
 * Station 4: GitLab CI Linter — Validate optimized YAML.
 * Depicts a green scanning shield / checkmark validating the YAML.
 */
export default function Section4Validator() {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const pos = STATION_POSITIONS[3];

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Slow rotation on outer rings
    if (ringRef.current) ringRef.current.rotation.z = t * 0.4;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.25;

    // Shield bobs
    if (shieldRef.current) {
      shieldRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }

    // Scan beam sweeps vertically
    if (scanRef.current) {
      const sweep = Math.sin(t * 1.8) * 1.8;
      scanRef.current.position.y = sweep;
      (scanRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + Math.abs(Math.sin(t * 1.8)) * 0.25;
    }
  });

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Outer spinning validation ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.05, 8, 48]} />
        <meshBasicMaterial color="#00ffcc" toneMapped={false} transparent opacity={0.5} />
      </mesh>
      {/* Inner counter-spinning ring */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.04, 8, 48]} />
        <meshBasicMaterial color="#4299e1" toneMapped={false} transparent opacity={0.4} />
      </mesh>

      {/* Central shield group */}
      <group ref={shieldRef}>
        <Float speed={1.2} floatIntensity={0.2}>
          {/* Shield body (two facing panels) */}
          <mesh>
            <cylinderGeometry args={[1.2, 0.8, 0.12, 6]} />
            <meshStandardMaterial
              color="#0a1a2a"
              emissive="#00ffcc"
              emissiveIntensity={0.4}
              transparent opacity={0.85}
            />
          </mesh>
          {/* Wireframe overlay */}
          <mesh>
            <cylinderGeometry args={[1.22, 0.82, 0.14, 6]} />
            <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.25} toneMapped={false} />
          </mesh>

          {/* ✓ Checkmark as glowing text */}
          <Text
            fontSize={1.4}
            color="#00ffcc"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.12, 0]}
          >
            ✓
            <meshBasicMaterial color="#00ffcc" toneMapped={false} />
          </Text>

          {/* Scan beam */}
          <mesh ref={scanRef} position={[0, 0, 0]}>
            <boxGeometry args={[2.2, 0.06, 0.5]} />
            <meshBasicMaterial color="#00ffcc" toneMapped={false} transparent opacity={0.2} />
          </mesh>
        </Float>

        {/* YAML validation label */}
        <Text
          fontSize={0.28}
          color="#4299e1"
          anchorX="center"
          anchorY="middle"
          position={[0, -2, 0]}
        >
          CI LINTER: YAML VALID
          <meshBasicMaterial color="#4299e1" toneMapped={false} transparent opacity={0.8} />
        </Text>
      </group>

      {/* Dot particles orbiting the validator */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 2.5, Math.sin(angle * 0.5) * 0.5, Math.sin(angle) * 2.5]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#00ffcc' : '#4299e1'} toneMapped={false} />
          </mesh>
        );
      })}

      <pointLight color="#00ffcc" intensity={4} distance={14} />
      <pointLight color="#4299e1" intensity={2} distance={10} position={[3, 2, 0]} />
    </group>
  );
}
