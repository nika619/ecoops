/**
 * GlobalMatrixApp — UI 4: ECOOPS Global Matrix
 * A cinematic holographic globe with deployment arcs, edge node routing,
 * glassmorphism metrics, and an AI routing console terminal.
 * Uses the `cobe` library for the WebGL globe.
 *
 * "DEPLOY TO EDGE" = Trigger the ECOOPS analysis pipeline.
 * Under the hood it calls startAnalysis() → backend /api/analyze.
 * The "edge deployment" metaphor is a visual narrative layer
 * over the real CI/CD waste analysis.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import VoiceMicButton from '../components/VoiceMicButton';
import ChatBox from '../components/ChatBox';
import type { ChatMessage } from '../components/ChatBox';
import { VoiceAgent } from '../voice/VoiceAgent';
import type { VoiceState } from '../voice/VoiceAgent';
import { startAnalysis, subscribeProgress, fetchConfig } from '../api';
import type { AnalysisResult, StepEvent } from '../api';
import '../telemetry/telemetry.css';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:5001' : '');

/* ── Edge node data ──────────────────────────────────── */
const EDGE_NODES = [
  { id: 'us-east', label: 'US-EAST', lat: 38.95, lng: -77.45, city: 'Virginia' },
  { id: 'eu-west', label: 'EU-WEST', lat: 50.11, lng: 8.68, city: 'Frankfurt' },
  { id: 'ap-ne',   label: 'AP-NE',   lat: 35.68, lng: 139.69, city: 'Tokyo' },
  { id: 'us-west', label: 'US-WEST', lat: 45.52, lng: -122.68, city: 'Oregon' },
  { id: 'sa-east', label: 'SA-EAST', lat: -23.55, lng: -46.63, city: 'São Paulo' },
  { id: 'ap-se',   label: 'AP-SE',   lat: -33.87, lng: 151.21, city: 'Sydney' },
];

const ORIGIN = { lat: 19.08, lng: 72.88, city: 'Mumbai' };

const AI_ROUTING_MESSAGES = [
  '› ECOOPS routing US traffic to us-east-1...',
  '› EU traffic optimized for eu-west-1 (Frankfurt)',
  '› APAC latency reduced by 38% via ap-northeast-1',
  '› Carbon offset: 21.77 kg CO₂/month saved',
  '› Load balancer re-weighting for us-west-2 delta...',
  '› All edge nodes healthy ✓',
];

/* ── Cobe Globe Component ─────────────────────────────── */
/* FIX #1: Globe no longer destroys/recreates on deploy state change.
   It creates once, and uses globe.update() to add/remove arcs dynamically. */
function CobeGlobe({ isDeploying }: { isDeploying: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const globeRef = useRef<ReturnType<typeof import('cobe').default> | null>(null);
  const isDeployingRef = useRef(isDeploying);
  const [globeSize, setGlobeSize] = useState(400);

  // Keep a ref in sync so the rotation loop reads the latest value
  useEffect(() => { isDeployingRef.current = isDeploying; }, [isDeploying]);

  // Measure container and compute responsive globe size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      // Use 85% of the smaller dimension, capped between 250 and 700
      const size = Math.max(250, Math.min(700, Math.floor(Math.min(width, height) * 0.85)));
      setGlobeSize(size);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Update cobe dimensions when globeSize changes
  useEffect(() => {
    if (!globeRef.current) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    globeRef.current.update({ width: globeSize * dpr, height: globeSize * dpr });
  }, [globeSize]);

  // Update arcs dynamically when deploy state changes (without destroying globe)
  useEffect(() => {
    if (!globeRef.current) return;
    const deployArcs = isDeploying ? EDGE_NODES.map(n => ({
      from: [ORIGIN.lat, ORIGIN.lng] as [number, number],
      to: [n.lat, n.lng] as [number, number],
      color: [0.3, 0.53, 0.97] as [number, number, number],
    })) : [];

    globeRef.current.update({
      arcs: deployArcs,
      markers: [
        { location: [ORIGIN.lat, ORIGIN.lng] as [number, number], size: isDeploying ? 0.12 : 0.08 },
        ...EDGE_NODES.map(n => ({
          location: [n.lat, n.lng] as [number, number],
          size: isDeploying ? 0.06 : 0.03,
        })),
      ],
    });
  }, [isDeploying]);

  // Create the globe exactly once
  useEffect(() => {
    let rafId: number;

    async function initGlobe() {
      const createGlobe = (await import('cobe')).default;
      if (!canvasRef.current) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globeRef.current = createGlobe(canvasRef.current, {
        devicePixelRatio: dpr,
        width: globeSize * dpr,
        height: globeSize * dpr,
        phi: phiRef.current,
        theta: 0.3,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.05, 0.05, 0.15],
        markerColor: [0.024, 0.714, 0.831],
        glowColor: [0.05, 0.1, 0.2],
        markers: [
          { location: [ORIGIN.lat, ORIGIN.lng], size: 0.08 },
          ...EDGE_NODES.map(n => ({
            location: [n.lat, n.lng] as [number, number],
            size: 0.03,
          })),
        ],
        arcs: [],
        arcColor: [0.3, 0.53, 0.97],
        arcWidth: 2,
        arcHeight: 0.4,
      });

      function rotate() {
        phiRef.current += isDeployingRef.current ? 0.003 : 0.005;
        if (globeRef.current) globeRef.current.update({ phi: phiRef.current });
        rafId = requestAnimationFrame(rotate);
      }
      rafId = requestAnimationFrame(rotate);
    }

    initGlobe();
    // Cleanup only on unmount — NOT on isDeploying change
    return () => { cancelAnimationFrame(rafId); if (globeRef.current) { globeRef.current.destroy(); globeRef.current = null; } };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${globeSize}px`,
          height: `${globeSize}px`,
          contain: 'layout paint size',
          opacity: 1,
        }}
      />
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────── */
type TabId = 'NETWORK' | 'TELEMETRY' | 'ARCS' | 'REGIONS';

export default function GlobalMatrixApp() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('NETWORK');
  const [logs, setLogs] = useState<string[]>([]);
  const [, setCurrentStep] = useState(0);
  const [, setStepTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>(['› System initialized. Awaiting deployment command...']);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, 'idle' | 'syncing' | 'active'>>(
    Object.fromEntries(EDGE_NODES.map(n => [n.id, 'idle']))
  );
  const cleanupRef = useRef<(() => void) | null>(null);
  const simRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Voice / Chat state ──────────────────────────────
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const voiceAgentRef = useRef<VoiceAgent | null>(null);
  // FIX #11: Console auto-scroll ref
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConfig()
      .then((cfg) => { setProjectId(cfg.project_id || ''); setBackendReady(cfg.has_gitlab_token && cfg.has_gemini_key); })
      .catch(() => setBackendReady(false));
  }, []);

  // FIX #11: Auto-scroll console when new lines arrive
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLines]);

  // Deploy simulation (synced with analysis)
  useEffect(() => {
    if (!isAnalyzing) return;
    let idx = 0;
    const deploy = () => {
      if (idx < EDGE_NODES.length) {
        const node = EDGE_NODES[idx];
        setNodeStatuses(prev => ({ ...prev, [node.id]: 'syncing' }));
        setConsoleLines(prev => [...prev, AI_ROUTING_MESSAGES[idx] || `› Deploying to ${node.label}...`]);
        setTimeout(() => setNodeStatuses(prev => ({ ...prev, [node.id]: 'active' })), 1500);
        idx++;
        simRef.current = setTimeout(deploy, 2000);
      }
    };
    deploy();
    return () => { if (simRef.current) clearTimeout(simRef.current); };
  }, [isAnalyzing]);

  // FIX #3 & #5: Reset function for re-running
  const handleReset = useCallback(() => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setError(null);
    setLogs([]);
    setConsoleLines(['› System reset. Ready for new deployment...']);
    setNodeStatuses(Object.fromEntries(EDGE_NODES.map(n => [n.id, 'idle'])));
  }, []);

  const handleLaunch = useCallback(async () => {
    if (!projectId || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setLogs([]);
    setAnalysisResult(null);
    setConsoleLines(['› Initiating global deployment sequence...']);
    setNodeStatuses(Object.fromEntries(EDGE_NODES.map(n => [n.id, 'idle'])));

    try {
      const sessionId = await startAnalysis(projectId, dryRun);
      cleanupRef.current = subscribeProgress(sessionId, {
        onStep: (step: StepEvent) => { setCurrentStep(step.step); setStepTitle(step.title); },
        onLog: (msg: string) => setLogs(prev => [...prev, msg]),
        onComplete: (result: AnalysisResult) => {
          setAnalysisResult(result);
          setIsAnalyzing(false);
          setConsoleLines(prev => [...prev, '› ✓ All edge nodes deployed and optimized.', `› Total savings: ${result.savings.monthly.minutes_saved} min/month`]);
          setNodeStatuses(Object.fromEntries(EDGE_NODES.map(n => [n.id, 'active'])));
        },
        onError: (msg: string) => { setError(msg); setIsAnalyzing(false); },
      });
    } catch (err) { setError(err instanceof Error ? err.message : 'Deploy failed'); setIsAnalyzing(false); }
  }, [projectId, dryRun, isAnalyzing]);

  useEffect(() => () => { if (cleanupRef.current) cleanupRef.current(); if (simRef.current) clearTimeout(simRef.current); voiceAgentRef.current?.stop(); }, []);

  // ── Voice toggle handler ──────────────────────────────
  const handleVoiceToggle = useCallback(async () => {
    if (voiceAgentRef.current && voiceState !== 'idle') {
      voiceAgentRef.current.stop();
      voiceAgentRef.current = null;
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/gemini-key`);
      const data = await res.json();
      if (!data.key) throw new Error('No Gemini API key');

      const agent = new VoiceAgent(data.key, {
        onStateChange: (s) => setVoiceState(s),
        onUserTranscript: (text) => {
          if (text.trim()) setChatMessages(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
        },
        onAITranscript: (text) => {
          if (text.trim()) setChatMessages(prev => [...prev, { role: 'ai', text, timestamp: Date.now() }]);
        },
        onError: (msg) => console.error('[Voice]', msg),
      });
      voiceAgentRef.current = agent;
      await agent.start();
    } catch (err) {
      console.error('Voice start failed:', err);
    }
  }, [voiceState]);

  const handleSendText = useCallback((text: string) => {
    if (voiceAgentRef.current) voiceAgentRef.current.sendText(text);
  }, []);

  const metrics = analysisResult?.savings?.monthly;

  // Derive button state: idle / deploying / complete
  const buttonLabel = isAnalyzing ? 'DEPLOYING...' : analysisResult ? '✓ DEPLOYED — RE-RUN?' : 'LAUNCH 🚀';
  const buttonDisabled = !projectId || !backendReady || isAnalyzing;

  return (
    <ErrorBoundary>
      <div className="telemetry-root" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* ── Top Bar ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '0.08em', margin: 0 }}>
              ECOOPS <span style={{ color: '#4cd7f6' }}>GLOBAL MATRIX</span>
            </h1>
            {(['NETWORK', 'TELEMETRY', 'ARCS', 'REGIONS'] as TabId[]).map((tab) => (
              <span key={tab} onClick={() => setActiveTab(tab)} style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.12em',
                color: activeTab === tab ? '#4cd7f6' : 'rgba(220,226,248,0.35)',
                cursor: 'pointer', userSelect: 'none',
                borderBottom: activeTab === tab ? '1px solid #4cd7f6' : '1px solid transparent',
                paddingBottom: '4px',
                transition: 'all 0.3s ease',
              }}>{tab}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: 'rgba(220,226,248,0.4)' }}>
            <span style={{ color: '#10b981' }}>●</span> 6 REGIONS ACTIVE
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

          {/* Left sidebar: Config + metrics */}
          <div style={{ width: '240px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10 }}>

            {/* FIX #7: Removed duplicate header. Compact subtitle only */}
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: 'rgba(220,226,248,0.3)', letterSpacing: '0.1em' }}>
                ENTERPRISE EDGE DEPLOYMENT NETWORK
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#4edea3', letterSpacing: '0.1em' }}>6 REGIONS ACTIVE</span>
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', color: 'rgba(6,182,212,0.4)', marginTop: '4px', animation: 'te-pulse 2s infinite' }}>
                › ECOOPS routing traffic optimally...
              </div>
            </div>

            {/* FIX #3: Config panel always visible, with reset after completion */}
            <div className="te-glass" style={{ padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(220,226,248,0.35)', marginBottom: '8px' }}>
                CONFIGURATION
              </div>
              <input
                type="text"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                placeholder="GitLab Project ID"
                className="te-input"
                style={{ marginBottom: '8px', fontSize: '0.8rem' }}
                disabled={isAnalyzing}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <div
                  onClick={() => !isAnalyzing && setDryRun(!dryRun)}
                  className="te-toggle-track"
                  style={{
                    background: dryRun ? 'linear-gradient(135deg, #06b6d4, #4cd7f6)' : 'rgba(46,53,69,0.8)',
                    opacity: isAnalyzing ? 0.5 : 1,
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="te-toggle-thumb" style={{ left: dryRun ? '21px' : '3px' }} />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: 'rgba(220,226,248,0.4)' }}>Dry Run</span>
              </div>
              {error && <div style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', color: '#ef4444', fontSize: '0.6rem', marginBottom: '6px' }}>⚠ {error}</div>}
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.55rem', color: 'rgba(220,226,248,0.25)', fontFamily: "'Inter', sans-serif" }}>
                <span>{backendReady ? '✅' : '❌'} Backend</span>
                <span>{projectId ? '✅' : '⬜'} Project</span>
              </div>
            </div>

            {/* Global Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                {
                  label: 'GLOBAL LATENCY',
                  // FIX #9: Show meaningful latency value
                  value: metrics ? `${Math.max(1, Math.round(12 - (metrics.minutes_saved / 100)))}ms` : '12ms',
                  sub: 'avg', color: '#4edea3',
                  points: '0,30 20,28 40,25 60,20 80,18 100,15 120,12',
                },
                {
                  label: 'MULTI-REGION SYNC',
                  value: '99.7%', sub: 'uptime', color: '#4cd7f6',
                  points: '0,5 20,5 40,5 60,5 80,4 100,5 120,5',
                },
                {
                  label: 'CO₂ AVOIDED',
                  // FIX #9: Show absolute kg value instead of misleading percentage
                  value: metrics ? `${metrics.co2_avoided_kg.toFixed(1)} kg` : '—',
                  sub: 'monthly', color: '#4edea3',
                  points: '0,10 20,14 40,18 60,22 80,26 100,30 120,34',
                },
              ].map(m => (
                <div key={m.label} className="te-glass" style={{ padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.45rem', letterSpacing: '0.15em', color: 'rgba(220,226,248,0.35)', marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.2rem', fontWeight: 700, color: m.color, textShadow: `0 0 8px ${m.color}30` }}>{m.value}</span>
                    <svg width="60" height="20" viewBox="0 0 120 40" preserveAspectRatio="none">
                      <polyline points={m.points} fill="none" stroke={m.color} strokeWidth="2" className="te-sparkline" style={{ filter: `drop-shadow(0 0 2px ${m.color})` }} />
                    </svg>
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.5rem', color: 'rgba(220,226,248,0.2)', marginTop: '2px' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Content — switches based on activeTab */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

            {/* ━━━ NETWORK TAB ━━━ Globe is always mounted (hidden via CSS) to avoid cobe destroy crash */}
            <div style={{ display: activeTab === 'NETWORK' ? 'contents' : 'none' }}>
              <CobeGlobe isDeploying={isAnalyzing} />

                {/* Deployment Command over globe */}
                <div className="te-glass" style={{
                  position: 'absolute', top: '16px', right: '16px', padding: '16px', width: '220px', borderRadius: '8px', zIndex: 15,
                }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.55rem', letterSpacing: '0.12em', color: 'rgba(220,226,248,0.4)', marginBottom: '10px' }}>
                    DEPLOYMENT COMMAND
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: 'rgba(220,226,248,0.3)' }}>
                    <span>ORIGIN</span>
                    <span style={{ color: '#4cd7f6', fontFamily: "'JetBrains Mono', monospace" }}>Mumbai, IN (Central)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: 'rgba(220,226,248,0.3)' }}>
                    <span>TARGET</span>
                    <span style={{ color: '#4cd7f6', fontFamily: "'JetBrains Mono', monospace" }}>6 Edge Nodes</span>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.45rem', color: 'rgba(220,226,248,0.25)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                    SYNC STATUS
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      background: 'linear-gradient(90deg, #06b6d4, #a855f7)',
                      width: isAnalyzing ? '60%' : analysisResult ? '100%' : '94%',
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <button
                    onClick={analysisResult ? handleReset : handleLaunch}
                    disabled={buttonDisabled}
                    style={{
                      width: '100%', padding: '10px', border: 'none', borderRadius: '6px',
                      background: isAnalyzing
                        ? 'rgba(6,182,212,0.15)'
                        : analysisResult
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                      color: isAnalyzing ? 'rgba(220,226,248,0.4)' : 'white',
                      fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em',
                      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: isAnalyzing ? 'none' : analysisResult ? '0 4px 16px rgba(16,185,129,0.3)' : '0 4px 16px rgba(6,182,212,0.3)',
                    }}
                  >
                    {buttonLabel}
                  </button>
                </div>

                {/* Edge Node Status Bar */}
                <div style={{
                  position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', alignItems: 'center', gap: '24px', zIndex: 15,
                }}>
                  {EDGE_NODES.map((node) => {
                    const status = nodeStatuses[node.id];
                    const dotColor = status === 'active' ? '#10b981' : status === 'syncing' ? '#f59e0b' : 'rgba(134,147,151,0.3)';
                    return (
                      <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor, transition: 'background 0.5s ease' }} className={status === 'syncing' ? 'te-dot-blink' : ''} />
                          {status === 'active' && <div className="te-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor }} />}
                        </div>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.4rem', letterSpacing: '0.1em', color: status === 'active' ? '#4edea3' : 'rgba(220,226,248,0.25)' }}>
                          {node.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Results overlay */}
                {analysisResult && metrics && (
                  <div style={{
                    position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: '10px', zIndex: 20, animation: 'te-fadeSlideUp 0.5s ease',
                  }}>
                    {[
                      { label: 'MINUTES SAVED', value: metrics.minutes_saved.toLocaleString(), color: '#4cd7f6' },
                      { label: 'COST REDUCED', value: `$${metrics.cost_saved.toFixed(2)}`, color: '#4edea3' },
                      { label: 'CO₂ AVOIDED', value: `${metrics.co2_avoided_kg.toFixed(1)} kg`, color: '#a855f7' },
                      { label: 'TREES', value: `≈ ${metrics.trees_equivalent}`, color: '#4edea3', icon: '🌳' },
                    ].map(m => (
                      <div key={m.label} className="te-glass te-glow-cyan" style={{ padding: '10px 14px', textAlign: 'center', minWidth: '100px' }}>
                        {m.icon && <div style={{ fontSize: '1rem' }}>{m.icon}</div>}
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.1rem', fontWeight: 700, color: m.color }}>{m.value}</div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.4rem', letterSpacing: '0.12em', color: 'rgba(220,226,248,0.3)', marginTop: '2px' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* ━━━ TELEMETRY TAB ━━━ */}
            {activeTab === 'TELEMETRY' && (
              <div style={{ width: '100%', height: '100%', padding: '24px', overflow: 'auto', animation: 'te-fadeSlideUp 0.4s ease' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(220,226,248,0.35)', marginBottom: '20px' }}>PIPELINE TELEMETRY DASHBOARD</div>

                {/* Top metric cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'JOBS ANALYZED', value: analysisResult ? `${analysisResult.jobs_optimized}` : '—', sub: 'optimization targets', color: '#4cd7f6', icon: '⚙️' },
                    { label: 'WASTE DETECTED', value: analysisResult ? `${analysisResult.metrics.waste_percentage.toFixed(1)}%` : '—', sub: 'of total runs', color: '#ef4444', icon: '🔥' },
                    { label: 'COMMITS SCANNED', value: analysisResult ? `${analysisResult.commits_analyzed}` : '—', sub: `over ${analysisResult?.metrics.days_analyzed || '—'} days`, color: '#a855f7', icon: '📊' },
                    { label: 'WASTED RUNS', value: analysisResult ? `${analysisResult.metrics.total_wasted_runs}` : '—', sub: 'unnecessary executions', color: '#f59e0b', icon: '⚠️' },
                  ].map(m => (
                    <div key={m.label} className="te-glass" style={{ padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{m.icon}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.6rem', fontWeight: 700, color: m.color, textShadow: `0 0 12px ${m.color}30` }}>{m.value}</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.45rem', letterSpacing: '0.12em', color: 'rgba(220,226,248,0.35)', marginTop: '4px' }}>{m.label}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.5rem', color: 'rgba(220,226,248,0.2)', marginTop: '2px' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Savings & Impact row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Projected Savings */}
                  <div className="te-glass" style={{ padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(220,226,248,0.35)', marginBottom: '14px' }}>MONTHLY PROJECTIONS</div>
                    {[
                      { label: 'Minutes Saved', value: metrics ? `${metrics.minutes_saved.toLocaleString()} min` : '—', color: '#4cd7f6' },
                      { label: 'Cost Reduction', value: metrics ? `$${metrics.cost_saved.toFixed(2)}` : '—', color: '#4edea3' },
                      { label: 'Energy Saved', value: metrics ? `${metrics.energy_saved_kwh.toFixed(2)} kWh` : '—', color: '#f59e0b' },
                      { label: 'CO₂ Avoided', value: metrics ? `${metrics.co2_avoided_kg.toFixed(2)} kg` : '—', color: '#a855f7' },
                      { label: 'Tree Equivalent', value: metrics ? `🌳 ${metrics.trees_equivalent} trees` : '—', color: '#10b981' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: 'rgba(220,226,248,0.4)' }}>{row.label}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 600, color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Annual Projection */}
                  <div className="te-glass" style={{ padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(220,226,248,0.35)', marginBottom: '14px' }}>ANNUAL PROJECTIONS</div>
                    {[
                      { label: 'Hours Saved', value: analysisResult ? `${analysisResult.savings.annual.hours_saved.toLocaleString()} hrs` : '—', color: '#4cd7f6' },
                      { label: 'Cost Reduction', value: analysisResult ? `$${analysisResult.savings.annual.cost_saved.toFixed(2)}` : '—', color: '#4edea3' },
                      { label: 'CO₂ Avoided', value: analysisResult ? `${analysisResult.savings.annual.co2_avoided_kg.toFixed(1)} kg` : '—', color: '#a855f7' },
                      { label: 'Tree Equivalent', value: analysisResult ? `🌳 ${analysisResult.savings.annual.trees_equivalent} trees` : '—', color: '#10b981' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: 'rgba(220,226,248,0.4)' }}>{row.label}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 600, color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                    {!analysisResult && (
                      <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', color: 'rgba(220,226,248,0.2)' }}>
                        Run an analysis to see projections
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ━━━ ARCS TAB ━━━ */}
            {activeTab === 'ARCS' && (
              <div style={{ width: '100%', height: '100%', padding: '24px', overflow: 'auto', animation: 'te-fadeSlideUp 0.4s ease' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(220,226,248,0.35)', marginBottom: '20px' }}>OPTIMIZATION ARC CONNECTIONS</div>

                {/* SVG arc visualization */}
                <div className="te-glass" style={{ borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                  <svg viewBox="0 0 800 320" style={{ width: '100%', height: 'auto' }}>
                    <defs>
                      <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                      </linearGradient>
                      <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    </defs>

                    {/* Job nodes (left) */}
                    {['build', 'test', 'lint', 'deploy', 'security'].map((job, i) => (
                      <g key={job}>
                        <rect x="20" y={20 + i * 58} width="120" height="38" rx="6" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.25)" strokeWidth="1" />
                        <text x="80" y={44 + i * 58} textAnchor="middle" fill="#4cd7f6" fontSize="11" fontFamily="'JetBrains Mono', monospace">{job}</text>
                        {/* Animated arc from job to file */}
                        <path
                          d={`M 140 ${39 + i * 58} C 350 ${39 + i * 58}, 450 ${80 + (i % 3) * 80}, 600 ${50 + (i % 4) * 70}`}
                          fill="none" stroke="url(#arcGrad)" strokeWidth="1.5" filter="url(#glow)"
                          strokeDasharray="8 4" opacity="0.6"
                        >
                          <animate attributeName="stroke-dashoffset" from="0" to="-24" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                        </path>
                      </g>
                    ))}

                    {/* File pattern nodes (right) */}
                    {['src/**/*.ts', 'tests/**', '.gitlab-ci.yml', 'Dockerfile'].map((pattern, i) => (
                      <g key={pattern}>
                        <rect x="600" y={30 + i * 70} width="170" height="38" rx="6" fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.25)" strokeWidth="1" />
                        <text x="685" y={54 + i * 70} textAnchor="middle" fill="#c084fc" fontSize="10" fontFamily="'JetBrains Mono', monospace">{pattern}</text>
                      </g>
                    ))}

                    {/* Legend */}
                    <text x="20" y="310" fill="rgba(220,226,248,0.25)" fontSize="9" fontFamily="'Inter', sans-serif">CI JOBS</text>
                    <text x="600" y="310" fill="rgba(220,226,248,0.25)" fontSize="9" fontFamily="'Inter', sans-serif">RULES:CHANGES PATTERNS</text>
                  </svg>
                </div>

                {/* Optimization summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'TOTAL ARCS', value: analysisResult ? `${analysisResult.jobs_optimized}` : '5', sub: 'job → pattern mappings', color: '#4cd7f6' },
                    { label: 'RULES ADDED', value: analysisResult ? `${analysisResult.jobs_optimized}` : '—', sub: 'rules:changes blocks', color: '#a855f7' },
                    { label: 'YAML STATUS', value: analysisResult?.lint_valid ? '✓ VALID' : '—', sub: 'CI linter check', color: '#10b981' },
                  ].map(m => (
                    <div key={m.label} className="te-glass" style={{ padding: '14px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.4rem', fontWeight: 700, color: m.color }}>{m.value}</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.45rem', letterSpacing: '0.12em', color: 'rgba(220,226,248,0.35)', marginTop: '4px' }}>{m.label}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.5rem', color: 'rgba(220,226,248,0.2)', marginTop: '2px' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ━━━ REGIONS TAB ━━━ */}
            {activeTab === 'REGIONS' && (
              <div style={{ width: '100%', height: '100%', padding: '24px', overflow: 'auto', animation: 'te-fadeSlideUp 0.4s ease' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(220,226,248,0.35)', marginBottom: '20px' }}>EDGE NODE REGION DETAILS</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  {EDGE_NODES.map((node, idx) => {
                    const status = nodeStatuses[node.id];
                    const isActive = status === 'active';
                    const latencies = [8, 14, 42, 12, 78, 56];
                    const uptimes = [99.97, 99.94, 99.89, 99.96, 99.82, 99.91];
                    const co2Shares = [18.2, 15.4, 12.1, 17.8, 8.3, 10.9];
                    return (
                      <div key={node.id} className="te-glass" style={{
                        padding: '18px', borderRadius: '10px',
                        border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.03)',
                        transition: 'border-color 0.3s ease',
                      }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', color: '#4cd7f6' }}>{node.label}</div>
                          <div style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.45rem', fontFamily: "'JetBrains Mono', monospace",
                            background: isActive ? 'rgba(16,185,129,0.15)' : status === 'syncing' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                            color: isActive ? '#10b981' : status === 'syncing' ? '#f59e0b' : 'rgba(220,226,248,0.25)',
                          }}>
                            {isActive ? 'ONLINE' : status === 'syncing' ? 'SYNCING' : 'STANDBY'}
                          </div>
                        </div>

                        {/* City */}
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', color: 'rgba(220,226,248,0.3)', marginBottom: '14px' }}>📍 {node.city}</div>

                        {/* Stats */}
                        {[
                          { label: 'Latency', value: `${latencies[idx]}ms`, color: latencies[idx] < 20 ? '#4edea3' : latencies[idx] < 50 ? '#f59e0b' : '#ef4444' },
                          { label: 'Uptime', value: `${uptimes[idx]}%`, color: '#4cd7f6' },
                          { label: 'CO₂ Share', value: `${co2Shares[idx]}%`, color: '#a855f7' },
                        ].map(stat => (
                          <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', color: 'rgba(220,226,248,0.3)' }}>{stat.label}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', fontWeight: 600, color: stat.color }}>{stat.value}</span>
                          </div>
                        ))}

                        {/* Mini sparkline */}
                        <svg width="100%" height="24" viewBox="0 0 120 24" preserveAspectRatio="none" style={{ marginTop: '10px' }}>
                          <polyline
                            points={Array.from({ length: 12 }, (_, i) => `${i * 11},${12 + Math.sin(i * 0.8 + idx) * 8}`).join(' ')}
                            fill="none" stroke="#4cd7f6" strokeWidth="1.5" opacity="0.4"
                            style={{ filter: 'drop-shadow(0 0 2px #4cd7f6)' }}
                          />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Right: AI Routing Console */}
          <div style={{ width: '260px', padding: '16px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
            <div className="te-glass" style={{ flex: 1, padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4cd7f6', display: 'inline-block' }} className={isAnalyzing ? 'te-dot-blink' : ''} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.5rem', letterSpacing: '0.12em', color: 'rgba(220,226,248,0.4)' }}>AI ROUTING CONSOLE v1.4</span>
              </div>
              <div style={{
                flex: 1, overflow: 'auto', background: '#070e1d', borderRadius: '4px', padding: '10px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', lineHeight: 1.8, color: 'rgba(6,182,212,0.5)',
              }}>
                {consoleLines.map((line, i) => (
                  <div key={i} style={{ animation: 'te-fadeSlideLeft 0.3s ease', color: line.includes('✓') || line.includes('savings') || line.includes('Total') ? '#4edea3' : 'rgba(6,182,212,0.5)' }}>
                    {line}
                  </div>
                ))}
                <div style={{ animation: 'te-pulse 1s infinite' }}>▊</div>
                {/* FIX #11: Scroll anchor */}
                <div ref={consoleEndRef} />
              </div>
            </div>

            {/* Log feed during analysis */}
            {isAnalyzing && logs.length > 0 && (
              <div style={{
                marginTop: '8px', background: 'rgba(7,14,29,0.9)', borderRadius: '6px', padding: '8px 10px',
                maxHeight: '80px', overflow: 'auto',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(6,182,212,0.3)', lineHeight: 1.6,
                border: '1px solid rgba(255,255,255,0.04)',
              }}>
                {logs.slice(-3).map((l, i) => <div key={i}>› {l}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Voice Mic Button (bottom center) ── */}
      <VoiceMicButton voiceState={voiceState} onToggle={handleVoiceToggle} />

      {/* ── Chat Box (bottom right) ── */}
      <ChatBox
        messages={chatMessages}
        onSendText={handleSendText}
        isConnected={voiceState === 'listening' || voiceState === 'speaking'}
      />

    </ErrorBoundary>
  );
}
