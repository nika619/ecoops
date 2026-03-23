/**
 * TypographySeq — Cinematic text overlays.
 * 6 sections × 100vh = 600vh total (matches SCROLL_PAGES=6).
 * Strictly matches the 6-step architecture table.
 */

interface TypographySeqProps {
  metrics?: {
    minutes_saved: number;
    cost_reduced: number;
    energy_kwh: number;
    co2_kg: number;
    trees: number;
  };
}

export default function TypographySeq({ metrics }: TypographySeqProps) {
  const data = metrics || {
    minutes_saved: 1680,
    cost_reduced: 13.44,
    energy_kwh: 14.0,
    co2_kg: 21.77,
    trees: 1,
  };

  return (
    <div style={{ width: '100vw', height: '600vh', color: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── STATION 1: A + B — User triggers → GitLab API Fetch (0–100vh) ── */}
      <div style={{ ...sectionStyle, alignItems: 'flex-start' }}>
        <div style={fadeInStyle}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={nodeTag('#667eea')}>A  👤 User Runs ECOOPS</span>
            <span style={{ color: 'rgba(0,255,204,0.4)', alignSelf: 'center' }}>→</span>
            <span style={nodeTag('#f6ad55')}>B  📡 GitLab REST API</span>
          </div>
          <h1 style={headingStyle}>
            Fetch pipelines,<br />commits<br />
            <span style={{ color: '#00ffcc' }}>&amp; diffs.</span>
          </h1>
          <p style={subtextStyle}>
            ECOOPS connects to your GitLab project and pulls 50+ commits with full
            file-change diffs, your <code style={codeInline}>.gitlab-ci.yml</code>, and
            the complete repository tree.
          </p>
        </div>
      </div>

      {/* ── STATION 2: C — Gemini Analyze Waste (100–200vh) ── */}
      <div style={{ ...sectionStyle, alignItems: 'flex-end', textAlign: 'right', paddingRight: '10vw', paddingLeft: '10vw' }}>
        <div style={fadeInStyle}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'flex-end' }}>
            <span style={nodeTag('#48bb78')}>C  🤖 Gemini 2.0 Flash</span>
          </div>
          <h1 style={{ ...headingStyle, textAlign: 'right' }}>
            Analyze<br />
            <span style={{ color: '#00ffcc' }}>Waste Patterns.</span>
          </h1>
          <p style={{ ...subtextStyle, textAlign: 'right', marginLeft: 'auto' }}>
            Gemini cross-references every CI job against every commit's file changes —
            identifying which jobs ran on irrelevant commits, isolated at line level.
          </p>
        </div>
      </div>

      {/* ── STATION 3: D — Gemini Generate Optimized YAML (200–300vh) ── */}
      <div style={{ ...sectionStyle, paddingRight: '4vw', flexDirection: 'row', alignItems: 'center', gap: '4vw' }}>
        {/* Left: Text */}
        <div style={{ ...fadeInStyle, flex: '0 0 auto', maxWidth: '380px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <span style={nodeTag('#48bb78')}>D  ⚙️ Gemini 2.0 Flash</span>
          </div>
          <h1 style={headingStyle}>
            Generate<br />
            <span style={{ color: '#00ffcc' }}>Optimized YAML.</span>
          </h1>
          <p style={subtextStyle}>
            Injects smart <code style={codeInline}>rules:changes:</code> blocks into
            every wasteful job. Zero logic removed — 100% compute efficiency gained.
          </p>
        </div>
        {/* Right: YAML Panels */}
        <div style={{ flex: '1 1 auto', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={yamlPanelStyle('#ff2244')}>
            <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#ff6666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>⚠ BEFORE — Runs on EVERY commit</div>
            <pre style={{ fontSize: '10px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', color: '#ff6666' }}>{`lint:\n  script: flake8 src/\n  # No rules!\n\ntest:\n  script: pytest tests/\n  # README triggers it`}</pre>
          </div>
          <div style={yamlPanelStyle('#00ffcc')}>
            <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#00ffcc', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>✓ ECOOPS — rules:changes added</div>
            <pre style={{ fontSize: '10px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', color: '#00ffcc' }}>{`# ECOOPS: rules:changes\nlint:\n  script: flake8 src/\n  rules:\n    - changes:\n      - "src/**/*.py"\n      - ".gitlab-ci.yml"\n\ntest:\n  script: pytest tests/\n  rules:\n    - changes:\n      - "tests/**/*.py"`}</pre>
          </div>
        </div>
      </div>

      {/* ── STATION 4: E — GitLab CI Linter — Validate YAML (300–400vh) ── */}
      <div style={{ ...sectionStyle, paddingRight: '4vw', flexDirection: 'row', alignItems: 'center', gap: '4vw' }}>
        <div style={{ ...fadeInStyle, flex: '0 0 auto', maxWidth: '380px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <span style={nodeTag('#4299e1')}>E  🔧 GitLab CI Linter</span>
          </div>
          <h1 style={headingStyle}>
            Validate<br />
            <span style={{ color: '#00ffcc' }}>Optimized YAML.</span>
          </h1>
          <p style={subtextStyle}>
            The optimized config is sent to the{' '}
            <code style={codeInline}>GitLab CI Linter API</code> — every job rule
            is verified before a single byte is committed.
          </p>
        </div>
        {/* Validation Panel */}
        <div style={{ flex: '1 1 auto', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={yamlPanelStyle('#4299e1')}>
            <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#4299e1', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 700 }}>🔧 GitLab CI Linter — API Response</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['lint: rules:changes ✓', 'test: rules:changes ✓', 'deploy: rules:changes ✓', 'YAML syntax valid ✓', 'All stages resolved ✓'].map((line, i) => (
                <div key={i} style={{ fontSize: '10px', color: '#4299e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#00ffcc', fontWeight: 700 }}>✓</span> {line.replace(' ✓', '')}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px', padding: '6px 8px', background: 'rgba(0,255,204,0.06)', border: '1px solid rgba(0,255,204,0.2)', borderRadius: '4px', fontSize: '9px', color: '#00ffcc', fontWeight: 700, letterSpacing: '0.1em' }}>STATUS: VALID ✓</div>
          </div>
        </div>
      </div>

      {/* ── STATION 5: F — GitLab API — Create Branch + Commit (400–500vh) ── */}
      <div style={{ ...sectionStyle, alignItems: 'flex-end', textAlign: 'right', paddingRight: '10vw', paddingLeft: '10vw' }}>
        <div style={fadeInStyle}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <span style={nodeTag('#4299e1')}>F  📤 GitLab REST API</span>
          </div>
          <h1 style={{ ...headingStyle, textAlign: 'right' }}>
            Branch.<br />
            <span style={{ color: '#00ffcc' }}>Commit. Ship.</span>
          </h1>
          <p style={{ ...subtextStyle, textAlign: 'right', marginLeft: 'auto' }}>
            A new branch{' '}
            <code style={{ ...codeInline, color: '#fc6d26' }}>ecoops/optimize-pipeline</code>
            {' '}is created and the optimized YAML is committed — ready for review.
          </p>
        </div>
      </div>

      {/* ── STATION 6: G — GitLab API — Open MR + Green Impact (500–600vh) ── */}
      <div style={{ ...sectionStyle, justifyContent: 'flex-end', alignItems: 'flex-start', paddingLeft: '6vw', paddingBottom: '6vh' }}>
        <div style={{ ...fadeInStyle, textAlign: 'left', width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <span style={nodeTag('#68d391')}>G  🌱 Merge Request + Green Impact Report</span>
          </div>
          {/* Metric cards row — compact, left-aligned, keeps center free for 3D tree */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            <div style={metricCardStyle}>
              <div style={{ fontSize: '18px' }}>💰</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>${data.cost_reduced.toFixed(2)}/mo</div>
              <div style={metricLabel}>Cost Saved</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: '18px' }}>🌳</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#00ffcc' }}>{data.co2_kg.toFixed(1)} kg</div>
              <div style={metricLabel}>CO₂ Avoided</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: '18px' }}>⚡</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{data.energy_kwh.toFixed(1)} kWh</div>
              <div style={metricLabel}>Energy Saved</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: '18px' }}>⏱️</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#00ffcc' }}>{data.minutes_saved.toLocaleString()}</div>
              <div style={metricLabel}>CI min / month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  paddingLeft: '8vw',
};

const fadeInStyle: React.CSSProperties = {
  animation: 'fadeSlideUp 0.8s ease-out both',
};



const headingStyle: React.CSSProperties = {
  fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
  fontWeight: 800,
  margin: 0,
  letterSpacing: '-2px',
  lineHeight: 1.05,
  maxWidth: '600px',
  textShadow: '0 2px 30px rgba(0,0,0,0.95), 0 0 60px rgba(5,5,16,0.9)',
};

const subtextStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  color: '#999',
  marginTop: '20px',
  maxWidth: '460px',
  lineHeight: 1.6,
  fontFamily: "'Inter', 'Manrope', sans-serif",
  textShadow: '0 2px 20px rgba(0,0,0,0.9)',
};

const codeInline: React.CSSProperties = {
  color: '#00ffcc',
  fontFamily: "'Space Grotesk', monospace",
  textShadow: '0 0 10px rgba(0,255,204,0.3)',
};

const yamlPanelStyle = (accent: string): React.CSSProperties => ({
  background: 'rgba(5,5,16,0.92)',
  backdropFilter: 'blur(12px)',
  border: `1px solid ${accent}33`,
  borderLeft: `3px solid ${accent}`,
  padding: '14px 18px',
  width: '260px',
  fontFamily: "'Space Grotesk', monospace",
  boxShadow: `0 0 20px ${accent}15`,
});

const metricCardStyle: React.CSSProperties = {
  background: 'rgba(5,5,15,0.88)',
  backdropFilter: 'blur(14px)',
  border: '1px solid rgba(0,255,204,0.18)',
  borderRadius: '6px',
  padding: '12px 14px',
  width: '120px',
  textAlign: 'center',
  fontFamily: "'Space Grotesk', monospace",
  boxShadow: '0 0 20px rgba(0,255,204,0.08)',
};

const metricLabel: React.CSSProperties = {
  color: 'rgba(185,203,194,0.5)',
  fontSize: '9px',
  marginTop: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

// Graph-node style badge — matches the mermaid diagram fill colors
const nodeTag = (bg: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: `${bg}22`,
  border: `1px solid ${bg}66`,
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 700,
  color: bg,
  fontFamily: "'Space Grotesk', monospace",
  letterSpacing: '0.05em',
  textShadow: `0 0 12px ${bg}44`,
});
