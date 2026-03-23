/**
 * TelemetryApp — Root component for the Telemetry Visualization Engine (UI 3).
 * Deep space HUD with glassmorphism pipeline nodes, SVG neural pathways,
 * pulsing AI Engine core, and real-time telemetry panels.
 * Same backend integration as App.tsx and SolarpunkApp.tsx.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import NeuralPathways from './NeuralPathways';
import AIEngineCore from './AIEngineCore';
import TelemetryPanels from './TelemetryPanels';
import ErrorBoundary from '../components/ErrorBoundary';
import { startAnalysis, subscribeProgress, fetchConfig } from '../api';
import type { AnalysisResult, StepEvent } from '../api';
import './telemetry.css';

const PIPELINE_STAGES = [
  { id: 'commit', label: 'COMMIT', icon: '◉' },
  { id: 'build', label: 'BUILD', icon: '⬡' },
  { id: 'test', label: 'TEST', icon: '△' },
  { id: 'deploy', label: 'DEPLOY', icon: '◈' },
];

const AI_MESSAGES = [
  'Analyzing commit history & file diffs...',
  'Optimizing Docker layer cache strategy...',
  'Parallelizing test shards across runners...',
  'Routing deployment to canary cluster...',
  'Computing green impact metrics...',
  'Generating merge request description...',
];

export default function TelemetryApp() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [_stepTitle, setStepTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  // Simulated pipeline state
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [stageStatuses, setStageStatuses] = useState<Record<string, 'idle' | 'active' | 'done'>>({
    commit: 'idle', build: 'idle', test: 'idle', deploy: 'idle',
  });
  const [aiMessage, setAiMessage] = useState('Monitoring Pipeline...');
  const cleanupRef = useRef<(() => void) | null>(null);
  const simRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch backend config
  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        setProjectId(cfg.project_id || '');
        setBackendReady(cfg.has_gitlab_token && cfg.has_gemini_key);
      })
      .catch(() => setBackendReady(false));
  }, []);

  // Loader
  useEffect(() => {
    const timer = setTimeout(() => setSceneReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Pipeline simulation (synced with real analysis steps)
  useEffect(() => {
    if (!isAnalyzing) return;

    const stageOrder = ['commit', 'build', 'test', 'deploy'];
    let stepIdx = 0;

    const runStage = () => {
      if (stepIdx < stageOrder.length) {
        const stage = stageOrder[stepIdx];
        setActiveStage(stage);
        setStageStatuses((prev) => ({ ...prev, [stage]: 'active' }));
        setAiMessage(AI_MESSAGES[stepIdx] || 'Processing...');

        // Mark previous as done
        if (stepIdx > 0) {
          const prevStage = stageOrder[stepIdx - 1];
          setStageStatuses((prev) => ({ ...prev, [prevStage]: 'done' }));
        }

        stepIdx++;
        simRef.current = setTimeout(runStage, 2500);
      } else {
        // All done
        setStageStatuses({ commit: 'done', build: 'done', test: 'done', deploy: 'done' });
        setActiveStage(null);
      }
    };

    runStage();
    return () => {
      if (simRef.current) clearTimeout(simRef.current);
    };
  }, [isAnalyzing]);

  const handleLaunch = useCallback(async () => {
    if (!projectId || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setLogs([]);
    setAnalysisResult(null);
    setStageStatuses({ commit: 'idle', build: 'idle', test: 'idle', deploy: 'idle' });

    try {
      const sessionId = await startAnalysis(projectId, dryRun);
      cleanupRef.current = subscribeProgress(sessionId, {
        onStep: (step: StepEvent) => {
          setCurrentStep(step.step);
          setStepTitle(step.title);
        },
        onLog: (message: string) => setLogs((prev) => [...prev, message]),
        onComplete: (result: AnalysisResult) => {
          setAnalysisResult(result);
          setIsAnalyzing(false);
          setAiMessage('Pipeline Complete. Resources Optimized.');
          setStageStatuses({ commit: 'done', build: 'done', test: 'done', deploy: 'done' });
          setActiveStage(null);
        },
        onError: (message: string) => {
          setError(message);
          setIsAnalyzing(false);
          setAiMessage('Error detected. Awaiting manual review.');
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Launch failed');
      setIsAnalyzing(false);
    }
  }, [projectId, dryRun, isAnalyzing]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (simRef.current) clearTimeout(simRef.current);
    };
  }, []);

  const liveMetrics = analysisResult
    ? {
        minutes_saved: analysisResult.savings.monthly.minutes_saved,
        cost_reduced: analysisResult.savings.monthly.cost_saved,
        co2_kg: analysisResult.savings.monthly.co2_avoided_kg,
        trees: analysisResult.savings.monthly.trees_equivalent,
      }
    : null;

  return (
    <ErrorBoundary>
      <div className="telemetry-root">
        {/* ── Loading Screen ── */}
        {!sceneReady && (
          <div style={{
            position: 'absolute', inset: 0, background: '#080f1e',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}>
            <div style={{
              width: '48px', height: '48px',
              border: '3px solid rgba(6,182,212,0.1)', borderTop: '3px solid #06b6d4',
              borderRadius: '50%', animation: 'te-loaderSpin 1s linear infinite', marginBottom: '24px',
            }} />
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', letterSpacing: '0.2em',
              color: '#4cd7f6', animation: 'te-pulse 2s ease-in-out infinite',
            }}>
              INITIALIZING TELEMETRY
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 28px',
          animation: 'te-fadeSlideDown 0.5s ease',
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 700,
              margin: 0, letterSpacing: '-0.02em',
              textShadow: '0 0 10px rgba(76, 215, 246, 0.3)',
            }}>
              ECOOPS <span style={{ color: '#4cd7f6' }}>CORE</span>
            </h1>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', margin: '4px 0 0',
              color: 'rgba(220, 226, 248, 0.4)', minHeight: '18px',
            }}>
              {isAnalyzing ? `● ${aiMessage}` : aiMessage}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Nav links */}
            {['METRICS', 'PIPELINES', 'LOGS', 'NEURAL MAP'].map((link) => (
              <span
                key={link}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.65rem',
                  letterSpacing: '0.12em', color: 'rgba(220, 226, 248, 0.35)',
                  cursor: 'pointer', transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#4cd7f6')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(220, 226, 248, 0.35)')}
              >
                {link}
              </span>
            ))}

            {/* Trigger button */}
            <button
              onClick={handleLaunch}
              disabled={!projectId || !backendReady || isAnalyzing}
              className="te-glass"
              style={{
                padding: '8px 18px',
                color: isAnalyzing ? 'rgba(220, 226, 248, 0.3)' : '#4cd7f6',
                fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.7rem',
                fontWeight: 600, letterSpacing: '0.1em',
                border: `1px solid ${isAnalyzing ? 'rgba(255,255,255,0.05)' : 'rgba(6,182,212,0.4)'}`,
                borderRadius: '6px', cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                background: isAnalyzing ? 'rgba(255,255,255,0.02)' : 'rgba(6,182,212,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (!isAnalyzing) e.currentTarget.style.boxShadow = '0 0 15px rgba(6,182,212,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isAnalyzing ? 'AI PIPELINE ACTIVE...' : 'TRIGGER AI PIPELINE'}
            </button>
          </div>
        </div>

        {/* ── Launch Config Panel ── */}
        {!isAnalyzing && !analysisResult && (
          <div
            className="te-glass"
            style={{
              position: 'absolute', top: '80px', left: '28px', zIndex: 20,
              padding: '20px', width: '260px',
              animation: 'te-fadeSlideLeft 0.5s ease',
              borderRadius: '10px',
            }}
          >
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem',
              letterSpacing: '0.15em', color: 'rgba(220, 226, 248, 0.4)',
              textTransform: 'uppercase', marginBottom: '10px',
            }}>
              CONFIGURATION
            </div>

            <label style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem',
              letterSpacing: '0.12em', color: 'rgba(220, 226, 248, 0.3)',
              textTransform: 'uppercase',
            }}>
              GITLAB PROJECT ID
            </label>
            <input
              type="text" value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g. 80454464"
              className="te-input"
              style={{ marginTop: '4px', marginBottom: '12px' }}
            />

            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                onClick={() => setDryRun(!dryRun)}
                className="te-toggle-track"
                style={{
                  background: dryRun
                    ? 'linear-gradient(135deg, #06b6d4, #4cd7f6)'
                    : 'rgba(46, 53, 69, 0.8)',
                }}
              >
                <div className="te-toggle-thumb" style={{ left: dryRun ? '21px' : '3px' }} />
              </div>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: '0.75rem',
                color: 'rgba(220, 226, 248, 0.5)',
              }}>
                Dry Run <span style={{ opacity: 0.4 }}>(no MR)</span>
              </span>
            </div>

            {error && (
              <div style={{
                padding: '8px 10px', marginBottom: '10px',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px', color: '#ef4444', fontSize: '0.7rem',
                fontFamily: "'Inter', sans-serif",
              }}>⚠ {error}</div>
            )}

            {/* Status */}
            <div style={{
              display: 'flex', gap: '12px', marginTop: '4px',
              fontFamily: "'Inter', sans-serif", fontSize: '0.65rem',
              color: 'rgba(220, 226, 248, 0.3)',
            }}>
              <span>{backendReady ? '✅' : '❌'} Backend</span>
              <span>{projectId ? '✅' : '⬜'} Project</span>
            </div>
          </div>
        )}

        {/* ── Pipeline Architecture Canvas ── */}
        <div style={{
          position: 'absolute',
          top: '85px', bottom: '40px',
          left: '170px', right: '220px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          zIndex: 5,
        }}>
          {/* Neural Pathways SVG Layer */}
          <NeuralPathways activeStage={activeStage} isOptimizing={isAnalyzing} />

          {/* Top Row: Pipeline Nodes */}
          <div style={{
            display: 'flex', justifyContent: 'space-around', width: '100%',
            paddingTop: '10px', zIndex: 5,
          }}>
            {PIPELINE_STAGES.map((stage) => {
              const status = stageStatuses[stage.id];
              const isActive = status === 'active';
              const isDone = status === 'done';

              return (
                <div
                  key={stage.id}
                  className={`te-glass ${isActive ? 'te-glow-cyan' : isDone ? 'te-glow-green' : ''}`}
                  style={{
                    width: '120px',
                    padding: '14px 16px',
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    animation: 'te-fadeSlideDown 0.5s ease',
                    animationDelay: `${PIPELINE_STAGES.indexOf(stage) * 0.1}s`,
                    animationFillMode: 'both',
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    position: 'absolute' as const, top: '8px', right: '8px',
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: isDone ? '#10b981' : isActive ? '#f59e0b' : 'rgba(134, 147, 151, 0.3)',
                  }}
                    className={isActive ? 'te-dot-blink' : ''}
                  />

                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.7rem',
                    fontWeight: 600, letterSpacing: '0.15em',
                    color: isActive ? '#4cd7f6' : isDone ? '#4edea3' : 'rgba(220, 226, 248, 0.5)',
                    transition: 'color 0.3s ease',
                  }}>
                    {stage.icon} {stage.label}
                  </div>

                  {/* Sub-label */}
                  {isActive && (
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem',
                      color: 'rgba(6, 182, 212, 0.5)', marginTop: '6px',
                      animation: 'te-pulse 1.5s infinite',
                    }}>
                      PROCESSING...
                    </div>
                  )}
                  {isDone && (
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem',
                      color: 'rgba(78, 222, 163, 0.5)', marginTop: '6px',
                    }}>
                      COMPLETE ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom: AI Engine Core */}
          <div style={{ zIndex: 5, marginBottom: '20px' }}>
            <AIEngineCore isOptimizing={isAnalyzing} message={aiMessage} />
          </div>
        </div>

        {/* ── Telemetry Side Panels ── */}
        <TelemetryPanels isOptimizing={isAnalyzing} currentStep={currentStep} />

        {/* ── Results Overlay (after analysis) ── */}
        {analysisResult && liveMetrics && (
          <div style={{
            position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, display: 'flex', gap: '12px',
            animation: 'te-fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {[
              { label: 'MINUTES SAVED', value: liveMetrics.minutes_saved.toLocaleString(), color: '#4cd7f6' },
              { label: 'COST REDUCED', value: `$${liveMetrics.cost_reduced.toFixed(2)}`, color: '#4edea3' },
              { label: 'CO₂ AVOIDED', value: `${liveMetrics.co2_kg.toFixed(1)} kg`, color: '#a855f7' },
              { label: 'TREES PLANTED', value: `≈ ${liveMetrics.trees}`, color: '#4edea3', icon: '🌳' },
            ].map((m) => (
              <div key={m.label} className="te-glass te-glow-cyan" style={{
                padding: '16px 20px', textAlign: 'center', minWidth: '130px',
              }}>
                {m.icon && <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{m.icon}</div>}
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '1.3rem',
                  fontWeight: 700, color: m.color,
                  textShadow: `0 0 10px ${m.color}40`,
                }}>
                  {m.value}
                </div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.5rem',
                  letterSpacing: '0.15em', color: 'rgba(220, 226, 248, 0.35)',
                  marginTop: '4px', textTransform: 'uppercase',
                }}>
                  {m.label}
                </div>
              </div>
            ))}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  if (analysisResult.mr_url) window.open(analysisResult.mr_url, '_blank');
                  else if (dryRun) window.alert('🌿 Dry Run — toggle OFF to create a real MR!');
                }}
                className="te-glass"
                style={{
                  padding: '8px 16px', color: '#4cd7f6',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.65rem',
                  fontWeight: 600, letterSpacing: '0.1em',
                  border: '1px solid rgba(6,182,212,0.4)', borderRadius: '6px',
                  cursor: 'pointer', background: 'rgba(6,182,212,0.08)',
                }}
              >
                🌱 MERGE PIPELINE
              </button>
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setIsAnalyzing(false);
                  setLogs([]);
                  setError(null);
                  setAiMessage('Monitoring Pipeline...');
                  setStageStatuses({ commit: 'idle', build: 'idle', test: 'idle', deploy: 'idle' });
                }}
                style={{
                  padding: '6px 14px', color: 'rgba(220, 226, 248, 0.3)',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.6rem',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                ↻ RESTART
              </button>
            </div>
          </div>
        )}

        {/* ── Log feed (bottom left during analysis) ── */}
        {isAnalyzing && logs.length > 0 && (
          <div style={{
            position: 'absolute', bottom: '40px', left: '20px', zIndex: 15,
            background: 'rgba(7, 14, 29, 0.9)', borderRadius: '8px',
            padding: '8px 12px', maxWidth: '280px', maxHeight: '80px',
            overflowY: 'auto',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
            color: 'rgba(6, 182, 212, 0.4)', lineHeight: 1.6,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {logs.slice(-4).map((log, i) => (
              <div key={i} style={{ animation: 'te-fadeSlideLeft 0.2s ease' }}>› {log}</div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
