/**
 * ProgressHUD — Floating progress overlay visible during analysis.
 * Shows current step, progress bar, and latest log messages.
 */

interface ProgressHUDProps {
  isAnalyzing: boolean;
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepIcon: string;
  logs: string[];
  analysisComplete: boolean;
}

// 6 steps matching the architecture table exactly
const STEP_LABELS = [
  { icon: '📡', title: 'GitLab API — Fetch 50+ commits, diffs, .gitlab-ci.yml' },
  { icon: '🤖', title: 'Gemini AI — Analyze which jobs depend on which files' },
  { icon: '⚙️', title: 'Gemini AI — Generate optimized YAML with rules:changes:' },
  { icon: '🔧', title: 'GitLab CI Linter — Validate optimized YAML' },
  { icon: '📤', title: 'GitLab API — Create branch ecoops/optimize-pipeline' },
  { icon: '🌱', title: 'GitLab API — Open MR with Green Impact Report' },
];

export default function ProgressHUD({
  isAnalyzing,
  currentStep,
  totalSteps,
  stepTitle,
  stepIcon,
  logs,
  analysisComplete,
}: ProgressHUDProps) {
  if (!isAnalyzing && !analysisComplete) return null;

  const progressPercent = Math.min((currentStep / totalSteps) * 100, 100);

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 30, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      animation: 'fadeSlideUp 0.5s ease-out',
    }}>
      {/* Step Progress Card */}
      <div style={{
        background: 'rgba(10, 10, 20, 0.92)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,255,204,0.15)', borderRadius: '14px',
        padding: '14px 24px', minWidth: '340px', maxWidth: '460px',
        fontFamily: "'Space Grotesk', monospace",
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,255,204,0.05)',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            fontSize: '18px',
            animation: isAnalyzing ? 'pulse 1.5s infinite' : 'none',
          }}>
            {analysisComplete ? '✅' : (stepIcon || '🔄')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '12px', fontWeight: 700, color: analysisComplete ? '#00ffcc' : '#e3e0f3',
              letterSpacing: '0.03em',
            }}>
              {analysisComplete ? 'Analysis Complete!' : (stepTitle || 'Starting...')}
            </div>
            <div style={{
              fontSize: '10px', color: 'rgba(185,203,194,0.5)',
              marginTop: '2px',
            }}>
              Step {currentStep}/{totalSteps}
            </div>
          </div>
          {isAnalyzing && (
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#00ffcc', animation: 'pulse 1s infinite',
              boxShadow: '0 0 8px rgba(0,255,204,0.6)',
            }} />
          )}
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: '3px', background: 'rgba(0,255,204,0.1)',
          borderRadius: '2px', overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPercent}%`, height: '100%',
            background: analysisComplete
              ? 'linear-gradient(90deg, #00ffcc, #00e0b3)'
              : 'linear-gradient(90deg, #00ffcc, #00e5ff)',
            borderRadius: '2px',
            transition: 'width 1s ease-out',
            boxShadow: '0 0 8px rgba(0,255,204,0.4)',
          }} />
        </div>

        {/* Step dots */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: '8px', padding: '0 2px',
        }}>
          {STEP_LABELS.map((step, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              opacity: (i + 1) <= currentStep ? 1 : 0.3,
              transition: 'opacity 0.5s ease',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: (i + 1) <= currentStep ? '#00ffcc' : 'rgba(0,255,204,0.2)',
                boxShadow: (i + 1) <= currentStep ? '0 0 6px rgba(0,255,204,0.5)' : 'none',
                transition: 'all 0.5s ease',
              }} />
              <div style={{
                fontSize: '7px', color: 'rgba(185,203,194,0.4)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                {step.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Latest log message */}
        {logs.length > 0 && (
          <div style={{
            marginTop: '8px', paddingTop: '8px',
            borderTop: '1px solid rgba(0,255,204,0.08)',
            fontSize: '9px', color: 'rgba(0,255,204,0.4)',
            fontFamily: "'Space Grotesk', monospace",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            › {logs[logs.length - 1]}
          </div>
        )}
      </div>
    </div>
  );
}
