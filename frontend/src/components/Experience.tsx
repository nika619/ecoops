import { ScrollControls, Scroll, Environment } from '@react-three/drei';
import { ProgressProvider } from '../ProgressContext';
import CameraRig from './CameraRig';
import DataHighway from './DataHighway';
import Section1Rack from './Section1Rack';
import Section2Scanner from './Section2Scanner';
import Section3Matrix from './Section3Matrix';
import Section4Fork from './Section4Fork';
import Section5Impact from './Section5Impact';
import TypographySeq from './TypographySeq';
import { SCROLL_PAGES } from '../curveConfig';

/**
 * Experience — Master scroll-driven 3D scene.
 * Wrapped in ProgressProvider so DataHighway and CameraRig share
 * pulse progress via context ref (instead of scene.traverse).
 */
interface ExperienceProps {
  metrics?: {
    minutes_saved: number;
    cost_reduced: number;
    energy_kwh: number;
    co2_kg: number;
    trees: number;
  };
  currentStep?: number;
  totalSteps?: number;
  isAnalyzing?: boolean;
}

export default function Experience({ metrics, currentStep = 0, totalSteps = 5, isAnalyzing = false }: ExperienceProps) {
  return (
    <ProgressProvider>
      <Environment preset="night" environmentIntensity={0.05} />
      <ambientLight intensity={0.05} />

      <ScrollControls pages={SCROLL_PAGES} damping={0.12}>
        <CameraRig currentStep={currentStep} totalSteps={totalSteps} isAnalyzing={isAnalyzing} />
        <DataHighway currentStep={currentStep} totalSteps={totalSteps} isAnalyzing={isAnalyzing} />

        <group>
          <Section1Rack />
          <Section2Scanner />
          <Section3Matrix />
          <Section4Fork />
          <Section5Impact metrics={metrics} />
        </group>

        <Scroll html style={{ width: '100vw' }}>
          <TypographySeq metrics={metrics} />
        </Scroll>
      </ScrollControls>
    </ProgressProvider>
  );
}
