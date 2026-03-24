import { useState } from 'react';
import type { VoiceState } from '../voice/VoiceAgent';

interface VoiceMicButtonProps {
  voiceState: VoiceState;
  onToggle: () => void;
}

export default function VoiceMicButton({ voiceState, onToggle }: VoiceMicButtonProps) {
  const [hovered, setHovered] = useState(false);

  const isActive = voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'connecting';
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isConnecting = voiceState === 'connecting';

  const statusText = isConnecting
    ? 'Connecting...'
    : isSpeaking
      ? 'AI Speaking...'
      : isListening
        ? 'Listening...'
        : 'Click to talk';

  const accentColor = isSpeaking ? '#a259ff' : '#00ffcc';
  const glowColor = isSpeaking ? 'rgba(162,89,255,0.4)' : 'rgba(0,255,204,0.4)';

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      left: '28px',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      pointerEvents: 'auto',
    }}>
      {/* Status text */}
      <div style={{
        fontFamily: "'Space Grotesk', monospace",
        fontSize: '11px',
        letterSpacing: '0.12em',
        color: isActive ? accentColor : 'rgba(185,203,194,0.4)',
        textTransform: 'uppercase',
        transition: 'all 0.3s ease',
        opacity: isActive || hovered ? 1 : 0,
        transform: isActive || hovered ? 'translateY(0)' : 'translateY(6px)',
      }}>
        {statusText}
      </div>

      {/* Mic button */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: isActive
            ? `radial-gradient(circle, ${accentColor}22 0%, ${accentColor}08 70%)`
            : 'rgba(10,10,20,0.8)',
          border: `2px solid ${isActive ? accentColor : 'rgba(185,203,194,0.15)'}`,
          backdropFilter: 'blur(16px)',
          transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: isActive
            ? `0 0 24px ${glowColor}, 0 0 48px ${glowColor}40`
            : hovered
              ? '0 0 16px rgba(0,255,204,0.15)'
              : 'none',
        }}
      >
        {/* Pulse ring when active */}
        {isActive && (
          <>
            <div className="voice-pulse-ring" style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px solid ${accentColor}`,
              animation: 'voicePulse 2s cubic-bezier(0,0,0.2,1) infinite',
            }} />
            <div className="voice-pulse-ring" style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px solid ${accentColor}`,
              animation: 'voicePulse 2s cubic-bezier(0,0,0.2,1) 0.5s infinite',
            }} />
          </>
        )}

        {/* Mic icon SVG */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {isActive ? (
            // Active mic icon
            <>
              <rect x="9" y="2" width="6" height="12" rx="3" fill={accentColor} />
              <path d="M5 11a7 7 0 0 0 14 0" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="18" x2="12" y2="22" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="22" x2="16" y2="22" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            // Inactive mic icon
            <>
              <rect x="9" y="2" width="6" height="12" rx="3" fill="rgba(185,203,194,0.5)" />
              <path d="M5 11a7 7 0 0 0 14 0" stroke="rgba(185,203,194,0.5)" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="18" x2="12" y2="22" stroke="rgba(185,203,194,0.5)" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="22" x2="16" y2="22" stroke="rgba(185,203,194,0.5)" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
