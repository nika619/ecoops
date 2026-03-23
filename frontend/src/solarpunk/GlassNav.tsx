/**
 * GlassNav — Frosted-glass fixed navigation bar.
 * Solarpunk "Digital Arboretum" aesthetic.
 */

interface GlassNavProps {
  showGetStarted?: boolean;
  onGetStarted?: () => void;
}

export default function GlassNav({ showGetStarted = true, onGetStarted }: GlassNavProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '60px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        borderBottom: '1px solid rgba(187, 203, 187, 0.1)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #006d37, #2ecc71)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(46, 204, 113, 0.25)',
          }}
        >
          🌱
        </div>
        <span
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: '-0.02em',
            color: '#1a1c1d',
          }}
        >
          ECOOPS
        </span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        {['How it Works', 'Impact'].map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase().replace(/\s/g, '-')}`}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#3d4a3e',
              textDecoration: 'none',
              letterSpacing: '0.01em',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#006d37')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#3d4a3e')}
          >
            {link}
          </a>
        ))}

        {showGetStarted && (
          <button
            onClick={onGetStarted}
            style={{
              padding: '8px 20px',
              background: '#006d37',
              color: 'white',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '100px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0, 109, 55, 0.2)',
            }}
          >
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
}
