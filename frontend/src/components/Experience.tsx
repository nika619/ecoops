import { useState, useCallback } from 'react';
import { Environment, Stars } from '@react-three/drei';
import { Step1, Step2, Step3, Step4, Step5, Step6 } from './Steps';
import DataHighway from './DataHighway';
import CameraController from './CameraController';

const SPACING = 30;

interface ExperienceProps {
  currentStep: number;
  metrics?: {
    minutes_saved: number;
    cost_reduced: number;
    energy_kwh: number;
    co2_kg: number;
    trees: number;
  };
  diff?: {
    removed: string;
    added: string;
  };
}

export default function Experience({ currentStep, metrics, diff }: ExperienceProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);

  const handleTransitionUpdate = useCallback((transitioning: boolean, progress: number) => {
    setIsTransitioning(transitioning);
    setTransitionProgress(progress);
  }, []);

  return (
    <>
      {/* Smooth Camera Controller — replaces CameraControls teleport */}
      <CameraController
        currentStep={currentStep}
        onTransitionUpdate={handleTransitionUpdate}
      />

      <Environment preset="city" environmentIntensity={0.08} />
      <Stars radius={200} depth={80} count={3000} factor={4} saturation={0.2} fade speed={1} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#050510', 20, 80]} />

      {/* The Energy Stream — glowing highway connecting all steps */}
      <DataHighway
        currentStep={currentStep}
        isTransitioning={isTransitioning}
        transitionProgress={transitionProgress}
      />

      <group>
        <Step1 position={[0 * SPACING, 0, 0]} isActive={currentStep === 1} />
        <Step2 position={[1 * SPACING, 0, 0]} isActive={currentStep === 2} />
        <Step3 position={[2 * SPACING, 0, 0]} isActive={currentStep === 3} />
        <Step4 position={[3 * SPACING, 0, 0]} isActive={currentStep === 4} />
        <Step5 position={[4 * SPACING, 0, 0]} isActive={currentStep === 5} />
        <Step6
          position={[5 * SPACING, 0, 0]}
          isActive={currentStep === 6}
          metrics={metrics}
          diff={diff}
        />
      </group>
    </>
  );
}
