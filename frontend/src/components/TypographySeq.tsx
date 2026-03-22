/**
 * TypographySeq — Cinematic text overlays.
 * 5 sections × 100vh = 500vh total (matches SCROLL_PAGES=5).
 * YAML panels and metric cards are inline HTML for reliable rendering.
 * Metric cards now show real data when available.
 * Each section fades in/out via CSS scroll-driven opacity.
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
    <div style={{ width: '100vw', height: '500vh', color: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* STATION 1: GitLab Ingestion (0–100vh) */}
      <div style={{ ...sectionStyle, alignItems: 'flex-start' }}>
        <div style={fadeInStyle}>
          <div style={labelStyle}>01 // THE PROBLEM</div>
          <h1 style={headingStyle}>
            You are<br />burning<br />
            <span style={{ color: '#00ffcc' }}>compute.</span>
          </h1>
          <p style={subtextStyle}>
            Physical infrastructure masks digital waste. Redundant CI jobs
            run on every commit — consuming compute, energy, and budget.
          </p>
        </div>
      </div>

      {/* STATION 2: AI Analysis (100–200vh) */}
      <div style={{ ...sectionStyle, alignItems: 'flex-end', textAlign: 'right', paddingRight: '10vw', paddingLeft: '10vw' }}>
        <div style={fadeInStyle}>
          <div style={{ ...labelStyle, textAlign: 'right' }}>02 // AI ANALYSIS</div>
          <h1 style={{ ...headingStyle, textAlign: 'right' }}>
            AI-Native<br />
            <span style={{ color: '#00ffcc' }}>Waste Isolation.</span>
          </h1>
          <p style={{ ...subtextStyle, textAlign: 'right', marginLeft: 'auto' }}>
            Gemini 2.5 Flash cross-references every CI job with every
            commit's file changes — isolating wasted compute in real-time.
          </p>
        </div>
      </div>

      {/* STATION 3: YAML Optimization (200–300vh) — includes YAML panels */}
      <div style={{ ...sectionStyle, paddingRight: '4vw', flexDirection: 'row', alignItems: 'center', gap: '4vw' }}>
        {/* Left: Text */}
        <div style={{ ...fadeInStyle, flex: '0 0 auto', maxWidth: '380px' }}>
          <div style={labelStyle}>03 // YAML OPTIMIZATION</div>
          <h1 style={headingStyle}>
            Autonomous<br />
            <span style={{ color: '#00ffcc' }}>Optimization.</span>
          </h1>
          <p style={subtextStyle}>
            Injecting smart <code style={codeInline}>rules:changes</code> blocks.
            Zero logic removed. 100% efficiency gained.
          </p>
        </div>
        {/* Right: YAML Panels */}
        <div style={{ flex: '1 1 auto', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={yamlPanelStyle('#ff2244')}>
            <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#ff6666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>⚠ WASTEFUL YAML</div>
            <pre style={{ fontSize: '10px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', color: '#ff6666' }}>{`# Ran on EVERY commit
lint:
  script: flake8 src/
  # No rules!

test:
  script: pytest tests/
  # README triggers it`}</pre>
          </div>
          <div style={yamlPanelStyle('#00ffcc')}>
            <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#00ffcc', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>✓ ECOOPS: OPTIMIZED</div>
            <pre style={{ fontSize: '10px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', color: '#00ffcc' }}>{`# ECOOPS: rules:changes
lint:
  script: flake8 src/
  rules:
    - changes:
      - "src/**/*.py"
      - ".gitlab-ci.yml"

test:
  script: pytest tests/
  rules:
    - changes:
      - "tests/**/*.py"`}</pre>
          </div>
        </div>
      </div>

      {/* STATION 4: Seamless Integration (300–400vh) */}
      <div style={{ ...sectionStyle, alignItems: 'flex-end', textAlign: 'right', paddingRight: '10vw', paddingLeft: '10vw' }}>
        <div style={fadeInStyle}>
          <div style={{ ...labelStyle, textAlign: 'right' }}>04 // INTEGRATION</div>
          <h1 style={{ ...headingStyle, textAlign: 'right' }}>
            Seamless<br />
            <span style={{ color: '#00ffcc' }}>Integration.</span>
          </h1>
          <p style={{ ...subtextStyle, textAlign: 'right', marginLeft: 'auto' }}>
            Validated via GitLab CI Linter API. Branched to
            <code style={{ ...codeInline, color: '#fc6d26' }}> ecoops/optimize-pipeline</code>
            &nbsp;and ready to merge.
          </p>
        </div>
      </div>

      {/* STATION 5: Green Impact (400–500vh) — includes metric cards */}
      <div style={{ ...sectionStyle, justifyContent: 'center', alignItems: 'center', paddingLeft: 0 }}>
        <div style={{ ...fadeInStyle, textAlign: 'center', width: '100%', marginTop: '35vh' }}>
          <div style={{ ...labelStyle, textAlign: 'center' }}>05 // GREEN IMPACT</div>
          {/* Metric cards row — uses real data when available */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <div style={metricCardStyle}>
              <div style={{ fontSize: '18px' }}>💰</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>${data.cost_reduced.toFixed(2)}/mo</div>
              <div style={metricLabel}>Cost Saved</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: '18px' }}>🌳</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#00ffcc' }}>{data.co2_kg.toFixed(1)} kg</div>
              <div style={metricLabel}>CO₂ Avoided</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: '18px' }}>⚡</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{data.energy_kwh.toFixed(1)} kWh</div>
              <div style={metricLabel}>Energy Saved</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: '18px' }}>⏱️</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#00ffcc' }}>{data.minutes_saved.toLocaleString()}</div>
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

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(0,255,204,0.5)',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  marginBottom: '16px',
  fontFamily: "'Space Grotesk', monospace",
  textShadow: '0 0 20px rgba(0,0,0,0.9)',
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
  background: 'rgba(5,5,15,0.9)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(0,255,204,0.15)',
  padding: '14px 18px',
  width: '140px',
  textAlign: 'center',
  fontFamily: "'Space Grotesk', monospace",
  boxShadow: '0 0 16px rgba(0,255,204,0.06)',
};

const metricLabel: React.CSSProperties = {
  color: 'rgba(185,203,194,0.5)',
  fontSize: '9px',
  marginTop: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};
