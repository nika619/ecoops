import { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Experience from './components/Experience';
import ActionDock from './components/ActionDock';
import ErrorBoundary from './components/ErrorBoundary';
import ProgressHUD from './components/ProgressHUD';
import { startAnalysis, subscribeProgress, fetchConfig } from './api';
import type { AnalysisResult, StepEvent } from './api';

export default function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTitle, setStepTitle] = useState('');
  const [stepIcon, setStepIcon] = useState('');
  const totalSteps = 6;
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [showLaunchPanel, setShowLaunchPanel] = useState(true);
  const [panelExpanded, setPanelExpanded] = useState(true);
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

  // Smooth loader
  useEffect(() => {
    const timer = setTimeout(() => setSceneReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLaunch = useCallback(async () => {
    if (!projectId || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setLogs([]);
    setAnalysisResult(null);
    setShowLaunchPanel(false);

    try {
      const sessionId = await startAnalysis(projectId, dryRun);

      cleanupRef.current = subscribeProgress(sessionId, {
        onStep: (step: StepEvent) => {
          setCurrentStep(step.step);
          setStepTitle(step.title);
          setStepIcon(step.icon);
        },
        onLog: (message: string) => {
          setLogs((prev) => [...prev, message]);
        },
        onComplete: (result: AnalysisResult) => {
          setAnalysisResult(result);
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

  // Build metrics from real data
  const liveMetrics = analysisResult
    ? {
        minutes_saved: analysisResult.savings.monthly.minutes_saved,
        cost_reduced: analysisResult.savings.monthly.cost_saved,
        energy_kwh: analysisResult.savings.monthly.energy_saved_kwh,
        co2_kg: analysisResult.savings.monthly.co2_avoided_kg,
        trees: analysisResult.savings.monthly.trees_equivalent,
      }
    : undefined;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050510', overflow: 'hidden', position: 'relative' }}>
      {/* ── Smooth Loading Screen ── */}
      {!sceneReady && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: '#050510', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            width: '48px', height: '48px',
            border: '3px solid rgba(0,255,204,0.1)', borderTop: '3px solid #00ffcc',
            borderRadius: '50%', animation: 'loaderSpin 1s linear infinite', marginBottom: '24px',
          }} />
          <div style={{
            fontFamily: "'Space Grotesk', monospace", fontSize: '14px', letterSpacing: '0.2em',
            background: 'linear-gradient(90deg, rgba(0,255,204,0.3), rgba(0,255,204,0.8), rgba(0,255,204,0.3))',
            backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmer 2s linear infinite',
          }}>INITIALIZING ECOOPS</div>
        </div>
      )}

      {/* ── Launch Panel (collapsible) ── */}
      {showLaunchPanel && !panelExpanded && (
        <div
          onClick={() => setPanelExpanded(true)}
          style={{
            position: 'absolute', top: '20px', left: '20px', zIndex: 20, pointerEvents: 'auto',
            background: 'rgba(10, 10, 20, 0.9)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,255,204,0.2)', borderRadius: '28px',
            padding: '10px 18px', cursor: 'pointer',
            fontFamily: "'Space Grotesk', monospace", fontSize: '13px', color: '#00ffcc',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.3s ease', boxShadow: '0 4px 16px rgba(0,255,204,0.08)',
          }}
        >
          🌱 ECOOPS <span style={{ opacity: 0.5, fontSize: '11px' }}>▼</span>
        </div>
      )}
      {showLaunchPanel && panelExpanded && (
        <div style={{
          position: 'absolute', top: '20px', left: '20px', zIndex: 20, pointerEvents: 'auto',
          background: 'rgba(10, 10, 20, 0.9)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,255,204,0.15)', borderRadius: '16px',
          padding: '22px', width: '300px', fontFamily: "'Space Grotesk', monospace",
          animation: 'fadeSlideLeft 0.4s cubic-bezier(0.16,1,0.3,1)',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '20px', marginBottom: '2px' }}>🌱 ECOOPS</div>
              <div style={{ color: 'rgba(185,203,194,0.5)', fontSize: '10px', letterSpacing: '0.12em' }}>EMISSION COST OPTIMIZER</div>
            </div>
            <div
              onClick={() => setPanelExpanded(false)}
              style={{
                cursor: 'pointer', color: 'rgba(185,203,194,0.4)', fontSize: '14px',
                padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,255,204,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              ▲
            </div>
          </div>

          <label style={{ color: 'rgba(0,255,204,0.6)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            GitLab Project ID
          </label>
          <input
            type="text" value={projectId} onChange={(e) => setProjectId(e.target.value)}
            placeholder="e.g. 80454464"
            style={{
              width: '100%', padding: '10px 14px', marginTop: '6px', marginBottom: '14px',
              background: 'rgba(5,5,15,0.8)', border: '1px solid rgba(0,255,204,0.2)', borderRadius: '8px',
              color: '#e3e0f3', fontFamily: "'Space Grotesk', monospace", fontSize: '15px', outline: 'none', boxSizing: 'border-box',
            }}
          />

          {/* Dry Run toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div onClick={() => setDryRun(!dryRun)} className="toggle-track" style={{
              width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', position: 'relative',
              background: dryRun ? 'linear-gradient(135deg, #00ffcc, #00e0b3)' : 'rgba(80,80,100,0.5)',
            }}>
              <div className="toggle-thumb" style={{
                width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute',
                top: '3px', left: dryRun ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </div>
            <span style={{ color: 'rgba(185,203,194,0.7)', fontSize: '12px' }}>
              Dry Run <span style={{ opacity: 0.5 }}>(no MR)</span>
            </span>
          </div>

          {error && (
            <div style={{
              padding: '8px 12px', marginBottom: '14px', background: 'rgba(255,34,68,0.1)',
              border: '1px solid rgba(255,34,68,0.3)', borderRadius: '8px', color: '#ff4466', fontSize: '12px',
            }}>⚠️ {error}</div>
          )}

          {/* Analyzing indicator */}
          {isAnalyzing && (
            <div style={{
              padding: '8px 12px', marginBottom: '14px', background: 'rgba(0,255,204,0.06)',
              border: '1px solid rgba(0,255,204,0.15)', borderRadius: '8px', color: '#00ffcc', fontSize: '12px',
              animation: 'pulse 1.5s infinite',
            }}>
              ● Analyzing pipeline... Scroll down to explore
            </div>
          )}

          {/* Log feed */}
          {logs.length > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '8px 10px',
              marginBottom: '14px', maxHeight: '60px', overflowY: 'auto', fontSize: '10px',
              color: 'rgba(0,255,204,0.5)', lineHeight: 1.5,
            }}>
              {logs.slice(-3).map((log, i) => <div key={i} className="log-line">› {log}</div>)}
            </div>
          )}

          <button onClick={handleLaunch} disabled={!projectId || !backendReady || isAnalyzing} style={{
            width: '100%', padding: '14px', borderRadius: '10px', border: 'none', cursor: (!projectId || !backendReady || isAnalyzing) ? 'not-allowed' : 'pointer',
            background: (!projectId || !backendReady || isAnalyzing) ? 'rgba(50,50,60,0.6)' : 'linear-gradient(135deg, #00ffcc, #00e0b3)',
            color: (!projectId || !backendReady || isAnalyzing) ? '#555' : '#050510', fontWeight: 700, fontSize: '14px',
            fontFamily: "'Space Grotesk', monospace", letterSpacing: '0.05em', textTransform: 'uppercase',
            boxShadow: (!projectId || !backendReady || isAnalyzing) ? 'none' : '0 0 20px rgba(0,255,204,0.2)',
          }}>
            🌱 {isAnalyzing ? 'Analyzing...' : 'Launch Analysis'}
          </button>

          <div style={{ marginTop: '12px', display: 'flex', gap: '14px', color: 'rgba(185,203,194,0.4)', fontSize: '11px' }}>
            <span>{backendReady ? '✅' : '❌'} Backend</span>
            <span>{projectId ? '✅' : '⬜'} Project ID</span>
          </div>
        </div>
      )}

      {/* ── Scroll Progress Indicator ── */}
      <div style={{
        position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 20,
        width: '3px', height: '120px', background: 'rgba(0,255,204,0.1)', borderRadius: '2px',
      }}>
        <div id="scroll-thumb" style={{
          width: '3px', height: '24px', background: '#00ffcc', borderRadius: '2px',
          boxShadow: '0 0 8px rgba(0,255,204,0.5)', transition: 'top 0.1s ease',
        }} />
      </div>

      {/* ── Live Progress HUD (visible during analysis) ── */}
      <ProgressHUD
        isAnalyzing={isAnalyzing}
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitle={stepTitle}
        stepIcon={stepIcon}
        logs={logs}
        analysisComplete={!!analysisResult}
      />

      {/* ── Action Dock (visible after analysis completes) ── */}
      {analysisResult && (
        <ActionDock
          onMerge={() => {
            if (analysisResult.mr_url) {
              window.open(analysisResult.mr_url, '_blank');
            } else if (dryRun) {
              window.alert('🌿 Dry Run — toggle OFF and re-run to create a real Merge Request!');
            } else {
              window.open('https://gitlab.com/sungodnikaa69-group/ecoops/-/merge_requests', '_blank');
            }
          }}
          onViewReport={() => window.open('http://localhost:5001', '_blank')}
          onRestart={() => {
            setAnalysisResult(null);
            setIsAnalyzing(false);
            setLogs([]);
            setError(null);
            setShowLaunchPanel(true);
          }}
        />
      )}

      {/* ── 3D WebGL Canvas ── */}
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 2, 12], fov: 45 }}
          gl={{ antialias: false, powerPreference: 'default' }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#050510']} />
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00ffcc" />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ff0055" />

          <Suspense fallback={null}>
            <Experience metrics={liveMetrics} currentStep={currentStep} totalSteps={totalSteps} isAnalyzing={isAnalyzing} />
          </Suspense>

          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
