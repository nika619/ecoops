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
    desc: 'Merge Request created with full Green Impact Report! 1,680 minutes saved. Equivalent to 5.4 kg CO₂ avoided per month.',
    icon: '🌱',
  },
};

interface UIOverlayProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
}

export default function UIOverlay({ currentStep, onNext, onPrev }: UIOverlayProps) {
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

        {/* Step indicator dots */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

      {/* Main Glass Card — compact at Step 6 to avoid overlap */}
      {currentStep === 6 ? (
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
        /* Steps 1-5: full glass card */
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
              margin: '0 0 24px 0',
            }}
          >
            {data.desc}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onPrev} disabled={currentStep === 1} style={btnStyle(currentStep === 1)}>
              ← Prev
            </button>
            <button onClick={onNext} disabled={currentStep === 6} style={btnStyle(currentStep === 6)}>
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
