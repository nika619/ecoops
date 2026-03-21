import type { CSSProperties } from 'react';

interface StepInfo {
  title: string;
  desc: string;
  icon: string;
}

const STEP_DATA: Record<number, StepInfo> = {
  1: {
    title: 'Step 1: Data Ingestion',
    desc: 'Connecting to GitLab REST API. Pulling 50 recent commits, reading .gitlab-ci.yml, and mapping the full repository tree.',
    icon: '📡',
  },
  2: {
    title: 'Step 2: Gemini AI Analysis',
    desc: 'Google Gemini 2.5 Flash is cross-referencing CI jobs with file changes. Identifying wasted pipeline runs across your history.',
    icon: '🔍',
  },
  3: {
    title: 'Step 3: YAML Optimization',
    desc: 'Generating smart rules:changes blocks. Eliminating wasted compute while preserving all existing job configurations.',
    icon: '⚙️',
  },
  4: {
    title: 'Step 4: Linter Validation',
    desc: 'Validating the optimized .gitlab-ci.yml with GitLab CI Linter API. Ensuring 100% syntax validity before committing.',
    icon: '🔧',
  },
  5: {
    title: 'Step 5: Branch & Commit',
    desc: 'Creating new branch: ecoops/optimize-pipeline. Committing the optimized CI configuration to GitLab.',
    icon: '📤',
  },
  6: {
    title: 'Step 6: Green Impact',
    desc: 'Analysis complete! Review the Green Impact Report with CO₂, cost, and energy savings.',
    icon: '🌱',
  },
};

interface UIOverlayProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  isAnalyzing?: boolean;
  projectId?: string;
  onProjectIdChange?: (id: string) => void;
  dryRun?: boolean;
  onDryRunChange?: (v: boolean) => void;
  onLaunch?: () => void;
  backendReady?: boolean;
  error?: string | null;
  logs?: string[];
}

export default function UIOverlay({
  currentStep,
  onNext,
  onPrev,
  isAnalyzing = false,
  projectId = '',
  onProjectIdChange,
  dryRun = true,
  onDryRunChange,
  onLaunch,
  backendReady = false,
  error,
  logs = [],
}: UIOverlayProps) {
  const data = STEP_DATA[currentStep];

  const btnStyle = (disabled: boolean): CSSProperties => ({
    background: disabled
      ? 'rgba(50, 50, 60, 0.6)'
      : 'linear-gradient(135deg, #00ffcc, #00e0b3)',
    color: disabled ? '#555' : '#050510',
    border: disabled ? '1px solid rgba(80,80,90,0.4)' : '1px solid rgba(0, 255, 204, 0.5)',
    padding: '12px 28px',
    borderRadius: '10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontFamily: "'Space Grotesk', monospace",
    fontSize: '14px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    transition: 'all 0.3s ease',
    boxShadow: disabled ? 'none' : '0 0 20px rgba(0, 255, 204, 0.2)',
  });

  const progressPercent = ((currentStep - 1) / 5) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: "'Space Grotesk', 'Manrope', sans-serif",
      }}
    >
      {/* Top Progress Bar */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '3px',
          background: 'rgba(0, 255, 204, 0.08)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #00ffcc, #00E5FF)',
            boxShadow: '0 0 12px rgba(0, 255, 204, 0.5), 0 0 4px rgba(0, 255, 204, 0.8)',
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Progress label */}
        <div
          style={{
            position: 'absolute',
            right: '40px',
            top: '8px',
            color: 'rgba(0, 255, 204, 0.5)',
            fontFamily: "'Space Grotesk', monospace",
            fontSize: '10px',
            letterSpacing: '0.15em',
          }}
        >
          PIPELINE {Math.round(progressPercent)}%
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px',
        }}
      >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div
            style={{
              color: '#00ffcc',
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '28px',
              fontWeight: 'bold',
              textShadow: '0 0 15px rgba(0, 255, 204, 0.4)',
              letterSpacing: '0.02em',
            }}
          >
            🌱 ECOOPS{' '}
            <span style={{ color: 'rgba(227, 224, 243, 0.6)', fontSize: '18px', fontWeight: 400 }}>
              // Pipeline Optimizer
            </span>
          </div>
          <div
            style={{
              color: 'rgba(185, 203, 194, 0.5)',
              fontSize: '12px',
              fontFamily: "'Space Grotesk', monospace",
              marginTop: '4px',
              letterSpacing: '0.1em',
            }}
          >
            EMISSION COST OPTIMIZER — OPERATIONS PIPELINE SYSTEM
          </div>
        </div>

        {/* Step indicator dots + status */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isAnalyzing && (
            <span
              style={{
                color: '#00ffcc',
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '11px',
                letterSpacing: '0.1em',
                animation: 'pulse 1.5s infinite',
              }}
            >
              ● ANALYZING
            </span>
          )}
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              style={{
                width: s === currentStep ? '32px' : '10px',
                height: '10px',
                borderRadius: s === currentStep ? '5px' : '50%',
                background:
                  s === currentStep
                    ? 'linear-gradient(90deg, #00ffcc, #00e0b3)'
                    : s < currentStep
                      ? 'rgba(0, 255, 204, 0.4)'
                      : 'rgba(80, 80, 100, 0.4)',
                transition: 'all 0.4s ease',
                boxShadow: s === currentStep ? '0 0 12px rgba(0,255,204,0.5)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Glass Card */}
      {currentStep === 1 && !isAnalyzing ? (
        /* Step 1 idle: Show launch controls */
        <div
          style={{
            background: 'rgba(18, 18, 31, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 255, 204, 0.15)',
            borderRadius: '16px',
            padding: '32px',
            width: '440px',
            pointerEvents: 'auto',
            alignSelf: 'flex-start',
            boxShadow: '0 8px 32px rgba(0, 255, 204, 0.08), inset 0 1px 0 rgba(0, 255, 204, 0.1)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</div>
          <h2
            style={{
              color: '#e3e0f3',
              margin: '0 0 16px 0',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '22px',
              fontWeight: 700,
            }}
          >
            Analyze Your Pipeline
          </h2>

          {/* Project ID input */}
          <label
            style={{
              color: 'rgba(0, 255, 204, 0.6)',
              fontSize: '11px',
              fontFamily: "'Space Grotesk', monospace",
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            GitLab Project ID
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => onProjectIdChange?.(e.target.value)}
            placeholder="e.g. 80454464"
            style={{
              width: '100%',
              padding: '12px 16px',
              marginTop: '6px',
              marginBottom: '16px',
              background: 'rgba(5, 5, 15, 0.8)',
              border: '1px solid rgba(0, 255, 204, 0.2)',
              borderRadius: '8px',
              color: '#e3e0f3',
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Dry Run toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <div
              onClick={() => onDryRunChange?.(!dryRun)}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: dryRun
                  ? 'linear-gradient(135deg, #00ffcc, #00e0b3)'
                  : 'rgba(80, 80, 100, 0.5)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.3s',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: '3px',
                  left: dryRun ? '23px' : '3px',
                  transition: 'left 0.3s',
                }}
              />
            </div>
            <span
              style={{
                color: 'rgba(185, 203, 194, 0.7)',
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '13px',
              }}
            >
              Dry Run <span style={{ opacity: 0.5 }}>(analyze only, no MR)</span>
            </span>
          </div>

          {/* Error display */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                marginBottom: '16px',
                background: 'rgba(255, 34, 68, 0.1)',
                border: '1px solid rgba(255, 34, 68, 0.3)',
                borderRadius: '8px',
                color: '#ff4466',
                fontSize: '13px',
                fontFamily: "'Space Grotesk', monospace",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Launch button */}
          <button
            onClick={onLaunch}
            disabled={!projectId || !backendReady}
            style={{
              ...btnStyle(!projectId || !backendReady),
              width: '100%',
              padding: '16px',
              fontSize: '16px',
            }}
          >
            🌱 Launch Analysis
          </button>

          {/* Status indicators */}
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              gap: '16px',
              color: 'rgba(185, 203, 194, 0.5)',
              fontSize: '12px',
              fontFamily: "'Space Grotesk', monospace",
            }}
          >
            <span>{backendReady ? '✅' : '❌'} Backend</span>
            <span>{projectId ? '✅' : '⬜'} Project ID</span>
          </div>
        </div>
      ) : currentStep === 6 ? (
        /* Step 6: minimal compact controls */
        <div
          style={{
            background: 'rgba(18, 18, 31, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 255, 204, 0.15)',
            borderRadius: '12px',
            padding: '12px 20px',
            pointerEvents: 'auto',
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(0, 255, 204, 0.06)',
          }}
        >
          <button onClick={onPrev} style={btnStyle(false)}>
            ← Prev
          </button>
          <span
            style={{
              color: 'rgba(0, 255, 204, 0.5)',
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '11px',
              letterSpacing: '0.12em',
            }}
          >
            STEP 6 OF 6
          </span>
        </div>
      ) : (
        /* Steps 2-5: step info card with live log */
        <div
          style={{
            background: 'rgba(18, 18, 31, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 255, 204, 0.15)',
            borderRadius: '16px',
            padding: '32px',
            width: '440px',
            pointerEvents: 'auto',
            alignSelf: 'flex-start',
            boxShadow: '0 8px 32px rgba(0, 255, 204, 0.08), inset 0 1px 0 rgba(0, 255, 204, 0.1)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            {data.icon}
          </div>
          <h2
            style={{
              color: '#e3e0f3',
              margin: '0 0 12px 0',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '0.01em',
            }}
          >
            {data.title}
          </h2>
          <p
            style={{
              color: 'rgba(185, 203, 194, 0.7)',
              lineHeight: '1.7',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '14px',
              margin: '0 0 16px 0',
            }}
          >
            {data.desc}
          </p>

          {/* Live log feed */}
          {logs.length > 0 && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                maxHeight: '80px',
                overflowY: 'auto',
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '11px',
                color: 'rgba(0, 255, 204, 0.6)',
                lineHeight: 1.6,
              }}
            >
              {logs.slice(-4).map((log, i) => (
                <div key={i}>› {log}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onPrev} disabled={currentStep === 1 || isAnalyzing} style={btnStyle(currentStep === 1 || isAnalyzing)}>
              ← Prev
            </button>
            <button onClick={onNext} disabled={currentStep === 6 || isAnalyzing} style={btnStyle(currentStep === 6 || isAnalyzing)}>
              Next →
            </button>
          </div>

          <div
            style={{
              marginTop: '16px',
              color: 'rgba(0, 255, 204, 0.4)',
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '12px',
              letterSpacing: '0.15em',
            }}
          >
            STEP {currentStep} OF 6
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
