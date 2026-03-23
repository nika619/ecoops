/**
 * EcoForge — Central morphing 3D machine.
 * Scroll-driven with 5 phases:
 *   0-20% Brutalist ring (The Heavy Burden)
 *   20-40% Glass lens slides over (Gemini Analysis)
 *   40-60% Robotic calipers refine blocks (YAML Optimization)
 *   60-80% Pneumatic tube shoots spheres (Clean Branch)
 *   80-100% Machine blooms into lotus/terrarium (Green Impact)
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

export default function EcoForge() {
  const group = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lensRef = useRef<THREE.Mesh>(null);
  const caliperLRef = useRef<THREE.Mesh>(null);
  const caliperRRef = useRef<THREE.Mesh>(null);
  const tubeRef = useRef<THREE.Mesh>(null);
  const petalRefs = useRef<THREE.Mesh[]>([]);
  const sphereRefs = useRef<THREE.Mesh[]>([]);
  const blockRefs = useRef<THREE.Mesh[]>([]);
  const scroll = useScroll();

  // Materials
  const metalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#8a8a8e',
        metalness: 0.95,
        roughness: 0.22,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
      }),
    []
  );

  const darkMetalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#3a3a3c',
        metalness: 0.9,
        roughness: 0.35,
        clearcoat: 0.2,
      }),
    []
  );

  const amberMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#f59e0b',
        metalness: 0.1,
        roughness: 0.3,
        emissive: '#f59e0b',
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.85,
      }),
    []
  );

  const cleanMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.05,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
    []
  );

  const greenMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#2ecc71',
        metalness: 0.1,
        roughness: 0.4,
        emissive: '#2ecc71',
        emissiveIntensity: 0.15,
      }),
    []
  );

  // Block positions (chaotic → refined)
  const blockData = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 3
        ),
        rot: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        scale: 0.3 + Math.random() * 0.3,
        targetPos: new THREE.Vector3(
          Math.cos((i / 8) * Math.PI * 2) * 1.2,
          Math.sin((i / 8) * Math.PI * 2) * 1.2,
          0
        ),
      })),
    []
  );

  // Petal geometry for bloom phase
  const petalAngles = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), []);

  useFrame(() => {
    const t = scroll.offset; // 0 → 1

    if (!group.current) return;

    // Slow orbit
    group.current.rotation.y = t * Math.PI * 2 * 0.6;

    // ── Phase 1 (0-20%): Heavy burden — ring + chaotic blocks ──
    const p1 = Math.min(t / 0.2, 1);

    if (ringRef.current) {
      ringRef.current.rotation.z = t * Math.PI * 0.5;
      // Ring gets slightly heated (emissive)
      const ringMat = ringRef.current.material as THREE.MeshPhysicalMaterial;
      ringMat.emissiveIntensity = p1 < 1 ? p1 * 0.15 : Math.max(0, 0.15 - (t - 0.2) * 0.5);
    }

    // Blocks: chaotic initially, get scanned in phase 2, refined in phase 3
    blockRefs.current.forEach((block, i) => {
      if (!block) return;
      const bd = blockData[i];
      const phase3T = Math.max(0, Math.min((t - 0.4) / 0.2, 1)); // 0.4-0.6

      // Position: chaotic → organized circle → shrink away
      const lerpT = Math.max(0, Math.min((t - 0.15) / 0.25, 1));
      block.position.lerpVectors(bd.pos, bd.targetPos, lerpT);

      // Shape: jagged → smooth sphere
      const scaleVal = bd.scale * (1 - phase3T * 0.7);
      block.scale.setScalar(scaleVal);

      // Color: metal → amber (waste detected) → white (refined)
      const blockMat = block.material as THREE.MeshPhysicalMaterial;
      if (t < 0.2) {
        blockMat.color.set('#8a8a8e');
        blockMat.emissiveIntensity = 0;
      } else if (t < 0.4) {
        const scanT = (t - 0.2) / 0.2;
        blockMat.color.lerpColors(new THREE.Color('#8a8a8e'), new THREE.Color('#f59e0b'), scanT);
        blockMat.emissiveIntensity = scanT * 0.3;
        blockMat.emissive = new THREE.Color('#f59e0b');
      } else {
        const refineT = phase3T;
        blockMat.color.lerpColors(new THREE.Color('#f59e0b'), new THREE.Color('#ffffff'), refineT);
        blockMat.emissiveIntensity = (1 - refineT) * 0.3;
      }

      // Rotation: wobbly → stable
      block.rotation.x = bd.rot.x * (1 - lerpT) + t * 0.5;
      block.rotation.z = bd.rot.z * (1 - lerpT);
    });

    // ── Phase 2 (20-40%): Glass lens slides in ──
    if (lensRef.current) {
      const lensT = Math.max(0, Math.min((t - 0.15) / 0.15, 1));
      lensRef.current.position.z = THREE.MathUtils.lerp(5, 0.5, lensT);
      lensRef.current.visible = t > 0.1 && t < 0.65;
      // Slight rotation
      lensRef.current.rotation.y = t * 0.3;
    }

    // ── Phase 3 (40-60%): Calipers carve away waste ──
    const caliperT = Math.max(0, Math.min((t - 0.35) / 0.15, 1));
    const caliperOut = Math.max(0, Math.min((t - 0.55) / 0.1, 1));
    const caliperPos = THREE.MathUtils.lerp(4, 1.5, caliperT) + caliperOut * 3;

    if (caliperLRef.current) {
      caliperLRef.current.position.x = -caliperPos;
      caliperLRef.current.visible = t > 0.3 && t < 0.7;
      caliperLRef.current.rotation.z = caliperT * 0.2;
    }

    if (caliperRRef.current) {
      caliperRRef.current.position.x = caliperPos;
      caliperRRef.current.visible = t > 0.3 && t < 0.7;
      caliperRRef.current.rotation.z = -caliperT * 0.2;
    }

    // ── Phase 4 (60-80%): Refined spheres shoot upward ──
    sphereRefs.current.forEach((sphere, i) => {
      if (!sphere) return;
      const sphereT = Math.max(0, Math.min((t - 0.55 - i * 0.03) / 0.2, 1));
      sphere.position.y = THREE.MathUtils.lerp(0, 6 + i * 1.5, sphereT);
      sphere.scale.setScalar(THREE.MathUtils.lerp(0, 0.25, Math.min(sphereT * 3, 1)));
      sphere.visible = t > 0.5;
    });

    if (tubeRef.current) {
      const tubeT = Math.max(0, Math.min((t - 0.55) / 0.15, 1));
      tubeRef.current.scale.y = THREE.MathUtils.lerp(0, 1, tubeT);
      tubeRef.current.visible = t > 0.5 && t < 0.85;
    }

    // ── Phase 5 (80-100%): Lotus bloom ──
    petalRefs.current.forEach((petal, i) => {
      if (!petal) return;
      const bloomT = Math.max(0, Math.min((t - 0.75 - i * 0.015) / 0.15, 1));
      const angle = petalAngles[i];
      const openAngle = bloomT * Math.PI * 0.35;

      petal.position.x = Math.cos(angle) * bloomT * 2;
      petal.position.z = Math.sin(angle) * bloomT * 2;
      petal.position.y = bloomT * 0.5;
      petal.rotation.x = -openAngle;
      petal.rotation.y = angle;
      petal.visible = t > 0.7;
    });

    // Ring visibility fades in bloom
    if (ringRef.current) {
      const bloomFade = Math.max(0, Math.min((t - 0.8) / 0.15, 1));
      ringRef.current.scale.setScalar(1 + bloomFade * 0.3);
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* ── The Main Ring ── */}
      <mesh ref={ringRef} material={darkMetalMat}>
        <torusGeometry args={[2.2, 0.3, 32, 64]} />
      </mesh>

      {/* Inner ring detail */}
      <mesh material={metalMat}>
        <torusGeometry args={[1.8, 0.08, 16, 64]} />
      </mesh>

      {/* ── Jagged Blocks (commits/jobs) ── */}
      {blockData.map((bd, i) => (
        <mesh
          key={`block-${i}`}
          ref={(el) => {
            if (el) blockRefs.current[i] = el;
          }}
          position={[bd.pos.x, bd.pos.y, bd.pos.z]}
          rotation={[bd.rot.x, bd.rot.y, bd.rot.z]}
          material={metalMat.clone()}
        >
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}

      {/* ── Glass Lens (Gemini Analysis Phase) ── */}
      <mesh ref={lensRef} position={[0, 0, 5]} visible={false}>
        <cylinderGeometry args={[2.5, 2.5, 0.15, 64]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={0.3}
          chromaticAberration={0.15}
          anisotropy={0.3}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          transmission={0.95}
          roughness={0.05}
          color="#e8f5e9"
        />
      </mesh>

      {/* ── Robotic Calipers (YAML Optimization Phase) ── */}
      <mesh ref={caliperLRef} position={[-4, 0, 0]} visible={false} material={metalMat}>
        <boxGeometry args={[0.15, 3, 0.5]} />
      </mesh>
      <mesh ref={caliperRRef} position={[4, 0, 0]} visible={false} material={metalMat}>
        <boxGeometry args={[0.15, 3, 0.5]} />
      </mesh>

      {/* Caliper jaw details */}
      <mesh position={[-1.5, 1.2, 0]} visible={false} material={amberMat}>
        <sphereGeometry args={[0.1, 16, 16]} />
      </mesh>

      {/* ── Refined Spheres (Clean Branch Phase) ── */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={`sphere-${i}`}
          ref={(el) => {
            if (el) sphereRefs.current[i] = el;
          }}
          visible={false}
          material={cleanMat}
        >
          <sphereGeometry args={[0.25, 32, 32]} />
        </mesh>
      ))}

      {/* Pneumatic tube */}
      <mesh ref={tubeRef} position={[0, 4, 0]} visible={false}>
        <cylinderGeometry args={[0.4, 0.4, 8, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0.05}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Lotus Petals (Bloom Phase) ── */}
      {petalAngles.map((_, i) => (
        <mesh
          key={`petal-${i}`}
          ref={(el) => {
            if (el) petalRefs.current[i] = el;
          }}
          visible={false}
          material={greenMat}
        >
          <boxGeometry args={[1.2, 0.06, 2]} />
        </mesh>
      ))}

      {/* Central terrarium sphere (visible in bloom) */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshPhysicalMaterial
            color="#2ecc71"
            metalness={0.05}
            roughness={0.6}
            emissive="#2ecc71"
            emissiveIntensity={0.08}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Float>

      {/* ── Ground Contact Shadow Catcher ── */}
      <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial transparent opacity={0.08} />
      </mesh>
    </group>
  );
}
