import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Experience from './components/Experience';
import UIOverlay from './components/UIOverlay';
import ActionConsole from './components/ActionConsole';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050510', overflow: 'hidden', position: 'relative' }}>
      {/* 2D Glassmorphism UI HUD */}
      <UIOverlay
        currentStep={currentStep}
        onNext={() => setCurrentStep((s) => Math.min(s + 1, 6))}
        onPrev={() => setCurrentStep((s) => Math.max(s - 1, 1))}
      />

      {/* Action Console — appears at Step 6 */}
      <ActionConsole
        isVisible={currentStep === 6}
        onMerge={() => alert('🌿 Merge Request would be created via GitLab API!')}
        onViewReport={() => window.open('http://localhost:5001', '_blank')}
        onRestart={() => setCurrentStep(1)}
      />

      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050510']} />

        {/* Volumetric / Ambient Lighting setup */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#00ffcc" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#ff0055" />

        <Suspense fallback={null}>
          <Experience currentStep={currentStep} />
        </Suspense>

        {/* Cinematic Post-Processing */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={2.0} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

