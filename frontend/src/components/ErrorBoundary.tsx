import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — Catches render errors in the 3D scene.
 * Prevents a single broken component from crashing the entire canvas.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ECOOPS Scene Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#050510', color: '#ff4466',
          fontFamily: "'Space Grotesk', monospace", fontSize: '14px',
          flexDirection: 'column', gap: '12px', zIndex: 50,
        }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div>Scene rendering error</div>
          <div style={{ color: '#666', fontSize: '11px', maxWidth: '400px', textAlign: 'center' }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '8px', padding: '8px 20px', background: 'rgba(0,255,204,0.1)',
              border: '1px solid rgba(0,255,204,0.3)', borderRadius: '6px',
              color: '#00ffcc', cursor: 'pointer', fontFamily: "'Space Grotesk', monospace",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
