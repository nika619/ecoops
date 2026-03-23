/**
 * SolarpunkTypography — 5 scroll sections with Manrope headlines / Inter body.
 * Matches the Stitch Kinetica Solar design system.
 * Uses <Scroll html> from drei.
 */
import React from 'react';

interface SolarpunkTypographyProps {
  metrics?: {
    minutes_saved: number;
    cost_reduced: number;
    energy_kwh: number;
    co2_kg: number;
    trees: number;
  };
}

export default function SolarpunkTypography({ metrics }: SolarpunkTypographyProps) {
  const data = metrics || {
    minutes_saved: 1680,
    cost_reduced: 13.44,
    energy_kwh: 14.0,
    co2_kg: 21.77,
    trees: 1,
  };

  return (
    <div style={{ width: '100vw', height: '500vh', color: '#1a1c1d' }}>
      {/* ── STEP 1: The Heavy Burden (0-100vh) ── */}
      <div style={{ ...sectionStyle, alignItems: 'flex-start' }}>
        <div style={fadeInStyle}>
          <div style={chipStyle}>
            <span style={{ fontSize: '10px' }}>●</span> STAGE 01 — INEFFICIENCY
          </div>
          <h1 style={displayStyle}>
            Your CI/CD<br />
            pipeline is<br />
            <span style={{ color: '#006d37' }}>running blind.</span>
          </h1>
          <p style={bodyStyle}>
            Every commit triggers every job. Resources wasted.
            Carbon emitted. The friction of growth shouldn't cost the Earth.
          </p>
          <a href="#how-it-works" style={linkStyle}>
            Explore the Burden →
          </a>
        </div>
      </div>

      {/* ── STEP 2: The Glass Lens (100-200vh) ── */}
      <div style={{ ...sectionStyle, alignItems: 'flex-end', textAlign: 'right', paddingRight: '10vw', paddingLeft: '10vw' }}>
        <div style={fadeInStyle}>
          <div style={{ ...chipStyle, marginLeft: 'auto' }}>
            <span style={{ fontSize: '10px' }}>●</span> GEMINI 2.5 FLASH
          </div>
          <h1 style={{ ...displayStyle, textAlign: 'right' }}>
            Gemini 2.5 Flash<br />
            maps dependencies<br />
            and isolates{' '}
            <span style={{ color: '#f59e0b' }}>waste.</span>
          </h1>
          <p style={{ ...bodyStyle, textAlign: 'right', marginLeft: 'auto' }}>
            Experience surgical precision in CI/CD. Our AI-driven lens identifies
            architectural inefficiencies before they impact your carbon footprint.
          </p>

          {/* Floating metrics */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {[
              { value: '47', label: 'JOBS ANALYZED' },
              { value: '12', label: 'REDUNDANT BUILDS' },
              { value: '3.2 hrs', label: 'WASTE PER WEEK' },
            ].map((m) => (
              <div key={m.label} style={miniCardStyle}>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1a1c1d', letterSpacing: '-0.02em' }}>
                  {m.value}
                </div>
                <div style={miniLabelStyle}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP 3: The Refinement (200-300vh) ── */}
      <div style={{ ...sectionStyle, paddingRight: '4vw', flexDirection: 'row', alignItems: 'center', gap: '4vw' }}>
        {/* Left: Text */}
        <div style={{ ...fadeInStyle, flex: '0 0 auto', maxWidth: '400px' }}>
          <div style={chipStyle}>
            <span style={{ fontSize: '10px' }}>●</span> YAML OPTIMIZATION
          </div>
          <h1 style={displayStyle}>
            Zero logic<br />
            removed.<br />
            <span style={{ color: '#006d37' }}>Pure efficiency.</span>
          </h1>
          <p style={bodyStyle}>
            ECOOPS adds intelligent <code style={codeStyle}>rules:changes:</code> blocks
            to your <code style={codeStyle}>.gitlab-ci.yml</code>, surgically removing
            CI/CD redundancy.
          </p>

          {/* Precision metrics */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...progressBar, background: '#006d37' }}>
                <div style={{ width: '100%', height: '100%', background: '#2ecc71', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#006d37' }}>100%</span>
              <span style={{ fontSize: '0.7rem', color: '#6c7b6d' }}>Logic Integrity</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <div style={{ ...progressBar, background: '#eeeef0' }}>
              <div style={{ width: '85%', height: '100%', background: '#2ecc71', borderRadius: '4px' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#006d37' }}>85%</span>
            <span style={{ fontSize: '0.7rem', color: '#6c7b6d' }}>Redundancy Cut</span>
          </div>
        </div>

        {/* Right: YAML Panels */}
        <div style={{ flex: '1 1 auto', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={yamlPanelStyle('wasteful')}>
            <div style={{ ...yamlHeaderStyle, color: '#98472a' }}>⚠ WASTEFUL YAML</div>
            <pre style={{ ...yamlCodeStyle, color: '#98472a' }}>{`lint:
  script: flake8 src/
  # No rules! Runs on EVERY commit

test:
  script: pytest tests/
  # README changes trigger it`}</pre>
          </div>
          <div style={yamlPanelStyle('optimized')}>
            <div style={{ ...yamlHeaderStyle, color: '#006d37' }}>✓ ECOOPS OPTIMIZED</div>
            <pre style={{ ...yamlCodeStyle, color: '#006d37' }}>{`# ECOOPS: Added rules:changes
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

      {/* ── STEP 4: The Clean Branch (300-400vh) ── */}
      <div style={{ ...sectionStyle, alignItems: 'center', textAlign: 'center' }}>
        <div style={{ ...fadeInStyle, maxWidth: '600px' }}>
          <div style={{ ...chipStyle, margin: '0 auto' }}>
            <span style={{ fontSize: '10px' }}>●</span> SYNTAX VALIDATED
          </div>
          <h1 style={{ ...displayStyle, textAlign: 'center' }}>
            Syntax Validated.<br />
            <span style={{ color: '#006d37' }}>
              Branched to<br />
              ecoops/optimize-pipeline.
            </span>
          </h1>
          <p style={{ ...bodyStyle, textAlign: 'center', margin: '20px auto 0' }}>
            The optimized config is verified by the GitLab CI Linter API —
            every job rule is validated before a single byte is committed.
            A new branch is created and the optimized YAML is committed.
          </p>

          {/* Validation pills */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['YAML syntax valid', 'All stages resolved', 'rules:changes verified'].map((check) => (
              <div key={check} style={validationPill}>
                <span style={{ color: '#2ecc71', fontWeight: 700 }}>✓</span> {check}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP 5: The Bloom / Green Impact (400-500vh) ── */}
      <div style={{ ...sectionStyle, alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
        <div style={{ ...fadeInStyle, width: '100%', maxWidth: '800px' }}>
          <h1 style={{ ...displayStyle, textAlign: 'center', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
            The Bloom
          </h1>
          <p style={{ ...bodyStyle, textAlign: 'center', margin: '12px auto 0', maxWidth: '500px' }}>
            Your pipeline isn't just code; it's a living ecosystem. Optimization has
            transformed your digital footprint into a positive force for the planet.
          </p>

          {/* Metric Panels — Apple Vision Pro style */}
          <div style={{
            display: 'flex', gap: '16px', marginTop: '36px',
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <MetricPanel value={data.minutes_saved.toLocaleString()} label="Minutes Saved" color="#006d37" />
            <MetricPanel value={`$${data.cost_reduced.toFixed(2)}`} label="Cost Reduced" color="#1a1c1d" />
            <MetricPanel value={`${data.co2_kg.toFixed(2)} kg`} label="CO₂ Avoided" color="#006d37" />
            <MetricPanel
              value={`≈ ${data.trees} Tree`}
              label="Planted Today"
              color="#2ecc71"
              icon="🌳"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function MetricPanel({ value, label, color, icon }: { value: string; label: string; color: string; icon?: string }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      border: '1px solid rgba(187, 203, 187, 0.15)',
      borderRadius: '16px',
      padding: '22px 28px',
      minWidth: '140px',
      textAlign: 'center',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      animation: 'sp-float 4s ease-in-out infinite',
      animationDelay: `${Math.random() * 2}s`,
    }}>
      {icon && <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{icon}</div>}
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: '1.8rem',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        color,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: '#6c7b6d',
        marginTop: '4px',
      }}>
        {label}
      </div>
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const sectionStyle: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  paddingLeft: '8vw',
};

const fadeInStyle: React.CSSProperties = {
  animation: 'sp-fadeSlideUp 0.8s ease-out both',
};

const displayStyle: React.CSSProperties = {
  fontFamily: "'Manrope', sans-serif",
  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
  fontWeight: 800,
  margin: 0,
  letterSpacing: '-0.04em',
  lineHeight: 1.05,
  maxWidth: '600px',
  color: '#1a1c1d',
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '1rem',
  color: '#3d4a3e',
  marginTop: '20px',
  maxWidth: '460px',
  lineHeight: 1.65,
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  background: 'rgba(46, 204, 113, 0.1)',
  color: '#006d37',
  borderRadius: '100px',
  fontSize: '0.7rem',
  fontWeight: 600,
  fontFamily: "'Inter', sans-serif",
  letterSpacing: '0.08em',
  marginBottom: '18px',
};

const codeStyle: React.CSSProperties = {
  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  color: '#006d37',
  fontSize: '0.9rem',
  background: 'rgba(46, 204, 113, 0.08)',
  padding: '2px 6px',
  borderRadius: '4px',
};

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  color: '#006d37',
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.85rem',
  fontWeight: 600,
  textDecoration: 'none',
  marginTop: '24px',
  transition: 'gap 0.2s ease',
};

const miniCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(12px)',
  borderRadius: '10px',
  padding: '12px 16px',
  boxShadow: '0 4px 16px rgba(26, 28, 29, 0.04)',
  textAlign: 'center',
  minWidth: '100px',
};

const miniLabelStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.6rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#6c7b6d',
  marginTop: '2px',
};

const progressBar: React.CSSProperties = {
  width: '80px',
  height: '6px',
  borderRadius: '4px',
  overflow: 'hidden',
};

const yamlPanelStyle = (variant: string): React.CSSProperties => ({
  background: '#ffffff',
  borderRadius: '12px',
  padding: '16px 20px',
  boxShadow: '0 4px 16px rgba(26, 28, 29, 0.04)',
  borderLeft: variant === 'wasteful' ? '3px solid #ff9875' : '3px solid #2ecc71',
  width: '260px',
});

const yamlHeaderStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  fontWeight: 700,
  textTransform: 'uppercase',
  fontFamily: "'Inter', sans-serif",
  marginBottom: '10px',
};

const yamlCodeStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  lineHeight: 1.7,
  margin: 0,
  whiteSpace: 'pre-wrap',
  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
};

const validationPill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '100px',
  fontSize: '0.75rem',
  fontWeight: 500,
  fontFamily: "'Inter', sans-serif",
  color: '#3d4a3e',
  boxShadow: '0 2px 8px rgba(26, 28, 29, 0.04)',
};
