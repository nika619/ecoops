/**
 * SolarpunkExperience — Bright 3D scene with studio lighting.
 * Uses <Environment preset="studio" />, white background,
 * ContactShadows, and ScrollControls for the 5-step narrative.
 */
import { Suspense } from 'react';
import { ScrollControls, Scroll, Environment, ContactShadows } from '@react-three/drei';
import EcoForge from './EcoForge';
import SolarpunkTypography from './SolarpunkTypography';

interface SolarpunkExperienceProps {
  metrics?: {
    minutes_saved: number;
    cost_reduced: number;
    energy_kwh: number;
    co2_kg: number;
    trees: number;
  };
}

export default function SolarpunkExperience({ metrics }: SolarpunkExperienceProps) {
  return (
    <>
      {/* Bright studio environment */}
      <Environment preset="studio" environmentIntensity={0.8} />

      {/* Key lights — warm, bright, Apple-studio feel */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[8, 12, 8]}
        intensity={2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.8} color="#f0fdf4" />

      {/* Warm fill light from below */}
      <directionalLight position={[0, -5, 5]} intensity={0.3} color="#fef3c7" />

      <ScrollControls pages={5} damping={0.12}>
        <Suspense fallback={null}>
          <EcoForge />
        </Suspense>

        {/* Contact shadows for grounding */}
        <ContactShadows
          position={[0, -3, 0]}
          opacity={0.3}
          scale={15}
          blur={2.5}
          far={6}
        />

        {/* HTML overlay with typography */}
        <Scroll html style={{ width: '100vw' }}>
          <SolarpunkTypography metrics={metrics} />
        </Scroll>
      </ScrollControls>
    </>
  );
}
