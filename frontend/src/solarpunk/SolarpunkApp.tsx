/**
 * SolarpunkApp — Root component for the Solarpunk / Clean-Tech UI.
 * Mirrors App.tsx functionality with bright Kinetica Solar styling.
 * Same backend integration (startAnalysis, subscribeProgress, fetchConfig).
 */
import { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import SolarpunkExperience from './SolarpunkExperience';
import SolarpunkActionDock from './SolarpunkActionDock';
import GlassNav from './GlassNav';
import ErrorBoundary from '../components/ErrorBoundary';
import { startAnalysis, subscribeProgress, fetchConfig } from '../api';
import type { AnalysisResult, StepEvent } from '../api';
import './solarpunk.css';

export default function SolarpunkApp() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [showLaunchPanel, setShowLaunchPanel] = useState(true);
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
    <div className="solarpunk-root">
      {/* ── Smooth Loading Screen ── */}
      {!sceneReady && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: '#f5f5f7', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div
            style={{
              width: '48px', height: '48px',
              border: '3px solid rgba(0,109,55,0.1)', borderTop: '3px solid #2ecc71',
              borderRadius: '50%', animation: 'sp-loaderSpin 1s linear infinite', marginBottom: '24px',
            }}
          />
          <div
            style={{
              fontFamily: "'Manrope', sans-serif", fontSize: '14px', letterSpacing: '0.15em',
              fontWeight: 700, color: '#006d37',
              animation: 'sp-pulse 2s ease-in-out infinite',
            }}
          >
            INITIALIZING ECOOPS
          </div>
        </div>
      )}

      {/* ── Glass Navigation ── */}
      <GlassNav
        showGetStarted={!isAnalyzing && !analysisResult}
        onGetStarted={() => {
          const panel = document.getElementById('launch-panel');
          if (panel) panel.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* ── Launch Panel (Frosted Glass) ── */}
      {showLaunchPanel && (
        <div
          id="launch-panel"
          style={{
            position: 'absolute', top: '80px', left: '24px', zIndex: 20, pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            border: '1px solid rgba(187, 203, 187, 0.15)',
            borderRadius: '20px',
            padding: '28px', width: '320px',
            boxShadow: '0 20px 40px rgba(26, 28, 29, 0.06), 0 5px 10px rgba(26, 28, 29, 0.03)',
            animation: 'sp-fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '1.3rem',
              color: '#1a1c1d', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #006d37, #2ecc71)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                boxShadow: '0 2px 8px rgba(46, 204, 113, 0.25)',
              }}>🌱</span>
              ECOOPS
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#6c7b6d',
              letterSpacing: '0.1em', marginTop: '4px', marginLeft: '38px',
            }}>
              EMISSION COST OPTIMIZER
            </div>
          </div>

          {/* Project ID Input */}
          <label style={{
            fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 600,
            color: '#6c7b6d', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            GitLab Project ID
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="e.g. 80454464"
            className="sp-input"
            style={{ marginTop: '6px', marginBottom: '16px' }}
          />

          {/* Dry Run toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div
              onClick={() => setDryRun(!dryRun)}
              className={`sp-toggle-track ${dryRun ? 'on' : 'off'}`}
            >
              <div
                className="sp-toggle-thumb"
                style={{ left: dryRun ? '23px' : '3px' }}
              />
            </div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: '#3d4a3e' }}>
              Dry Run{' '}
              <span style={{ color: '#6c7b6d', fontSize: '0.7rem' }}>(no MR)</span>
            </span>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: '16px',
              background: 'rgba(186, 26, 26, 0.06)', border: '1px solid rgba(186, 26, 26, 0.2)',
              borderRadius: '10px', color: '#ba1a1a',
              fontFamily: "'Inter', sans-serif", fontSize: '0.8rem',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Analyzing indicator */}
          {isAnalyzing && (
            <div style={{
              padding: '10px 14px', marginBottom: '16px',
              background: 'rgba(46, 204, 113, 0.06)', border: '1px solid rgba(46, 204, 113, 0.2)',
              borderRadius: '10px', color: '#006d37',
              fontFamily: "'Inter', sans-serif", fontSize: '0.8rem',
              animation: 'sp-pulse 1.5s infinite',
            }}>
              ● Analyzing pipeline... Scroll down to explore
            </div>
          )}

          {/* Log feed */}
          {logs.length > 0 && (
            <div style={{
              background: 'rgba(238, 238, 240, 0.6)', borderRadius: '10px', padding: '10px 12px',
              marginBottom: '16px', maxHeight: '60px', overflowY: 'auto',
              fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '0.65rem',
              color: '#6c7b6d', lineHeight: 1.6,
            }}>
              {logs.slice(-3).map((log, i) => <div key={i}>› {log}</div>)}
            </div>
          )}

          {/* Launch Button */}
          <button
            onClick={handleLaunch}
            disabled={!projectId || !backendReady || isAnalyzing}
            className="sp-btn-green"
            style={{ width: '100%', padding: '14px', fontSize: '0.9rem' }}
          >
            🌱 {isAnalyzing ? 'Analyzing...' : 'Launch Analysis'}
          </button>

          {/* Status indicators */}
          <div style={{
            marginTop: '14px', display: 'flex', gap: '16px',
            fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#6c7b6d',
          }}>
            <span>{backendReady ? '✅' : '❌'} Backend</span>
            <span>{projectId ? '✅' : '⬜'} Project ID</span>
          </div>
        </div>
      )}

      {/* ── Progress indicator during analysis ── */}
      {isAnalyzing && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 20,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '14px', padding: '14px 20px',
          boxShadow: '0 10px 30px rgba(26, 28, 29, 0.06)',
          fontFamily: "'Inter', sans-serif",
          animation: 'sp-fadeSlideDown 0.4s ease',
        }}>
          <div style={{ fontSize: '0.7rem', color: '#6c7b6d', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            ANALYSIS PROGRESS
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '24px', height: '4px', borderRadius: '2px',
                  background: i < currentStep ? '#2ecc71' : i === currentStep ? '#006d37' : '#eeeef0',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Action Dock (visible after analysis) ── */}
      {analysisResult && (
        <SolarpunkActionDock
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
          camera={{ position: [0, 2, 10], fov: 45 }}
          gl={{ antialias: true, powerPreference: 'default' }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#f5f5f7']} />
          <Suspense fallback={null}>
            <SolarpunkExperience metrics={liveMetrics} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
