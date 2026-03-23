import { STATION_POSITIONS } from '../curveConfig';

/**
 * Station 3: YAML Optimization — Just a simple glow effect at the station.
 * The actual YAML panels are now rendered in the HTML overlay (TypographySeq).
 */
export default function Section3Matrix() {
  const pos = STATION_POSITIONS[2];

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Holographic display stands (visual only) */}
      <mesh position={[-3, 0, 2]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.05, 4, 3]} />
        <meshStandardMaterial color="#112233" emissive="#ff2244" emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>
      <mesh position={[3, 0, 2]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.05, 4, 3]} />
        <meshStandardMaterial color="#112233" emissive="#00ffcc" emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>

      <pointLight color="#00ffcc" intensity={3} distance={12} position={[3, 2, 3]} />
      <pointLight color="#ff2244" intensity={2} distance={10} position={[-3, 2, 3]} />
    </group>
  );
}
