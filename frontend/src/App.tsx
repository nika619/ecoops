import { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Experience from './components/Experience';
import UIOverlay from './components/UIOverlay';
import ActionConsole from './components/ActionConsole';
import { startAnalysis, subscribeProgress, fetchConfig } from './api';
import type { AnalysisResult, StepEvent } from './api';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Fetch backend config on mount
  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        setProjectId(cfg.project_id || '');
        setBackendReady(cfg.has_gitlab_token && cfg.has_gemini_key);
      })
      .catch(() => setBackendReady(false));
  }, []);

  const handleLaunch = useCallback(async () => {
    if (!projectId || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setLogs([]);
    setAnalysisResult(null);
    setCurrentStep(1);

    try {
      const sessionId = await startAnalysis(projectId, dryRun);

      cleanupRef.current = subscribeProgress(sessionId, {
        onStep: (step: StepEvent) => {
          if (step.status === 'done') {
            // Auto-advance to next step when current completes
            setCurrentStep((prev) => Math.min(prev + 1, 6));
          }
        },
        onLog: (message: string) => {
          setLogs((prev) => [...prev, message]);
        },
        onComplete: (result: AnalysisResult) => {
          setAnalysisResult(result);
          setCurrentStep(6);
          setIsAnalyzing(false);
        },
        onError: (message: string) => {
          setError(message);
          setIsAnalyzing(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Launch failed');
      setIsAnalyzing(false);
    }
  }, [projectId, dryRun, isAnalyzing]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  // Build metrics for FinalResultsScene from real data
  const liveMetrics = analysisResult
    ? {
        minutes_saved: analysisResult.savings.monthly.minutes_saved,
        cost_reduced: analysisResult.savings.monthly.cost_saved,
        energy_kwh: analysisResult.savings.monthly.energy_saved_kwh,
        co2_kg: analysisResult.savings.monthly.co2_avoided_kg,
        trees: analysisResult.savings.monthly.trees_equivalent,
      }
    : undefined;

  const liveDiff = analysisResult
    ? {
        removed: analysisResult.original_yaml?.slice(0, 300) || '',
        added: analysisResult.optimized_yaml?.slice(0, 300) || '',
      }
    : undefined;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050510', overflow: 'hidden', position: 'relative' }}>
      {/* 2D Glassmorphism UI HUD */}
      <UIOverlay
        currentStep={currentStep}
        onNext={() => setCurrentStep((s) => Math.min(s + 1, 6))}
        onPrev={() => setCurrentStep((s) => Math.max(s - 1, 1))}
        isAnalyzing={isAnalyzing}
        projectId={projectId}
        onProjectIdChange={setProjectId}
        dryRun={dryRun}
        onDryRunChange={setDryRun}
        onLaunch={handleLaunch}
        backendReady={backendReady}
        error={error}
        logs={logs}
      />

      {/* Action Console — appears at Step 6 */}
      <ActionConsole
        isVisible={currentStep === 6}
        onMerge={() => {
          if (analysisResult?.mr_url) {
            window.open(analysisResult.mr_url, '_blank');
          } else {
            alert('🌿 Run analysis with Dry Run OFF to create a Merge Request!');
          }
        }}
        onViewReport={() => window.open('http://localhost:5001', '_blank')}
        onRestart={() => {
          setCurrentStep(1);
          setAnalysisResult(null);
          setIsAnalyzing(false);
          setLogs([]);
          setError(null);
        }}
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
          <Experience
            currentStep={currentStep}
            metrics={liveMetrics}
            diff={liveDiff}
          />
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
