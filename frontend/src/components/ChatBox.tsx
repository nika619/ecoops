import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendText: (text: string) => void;
  isConnected: boolean;
}

export type { ChatMessage };

export default function ChatBox({ messages, onSendText, isConnected }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !isConnected) return;
    onSendText(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle button */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 50,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10,10,20,0.85)',
            border: '1px solid rgba(0,255,204,0.2)',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,255,204,0.5)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,204,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,255,204,0.2)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
          }}
        >
          {/* Chat icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              stroke="#00ffcc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Unread badge */}
          {messages.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#00ffcc',
              border: '2px solid rgba(10,10,20,0.9)',
            }} />
          )}
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 50,
          width: '360px',
          maxHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(8,8,18,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,255,204,0.12)',
          borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,255,204,0.05)',
          fontFamily: "'Space Grotesk', monospace",
          animation: 'chatSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid rgba(0,255,204,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isConnected ? '#00ffcc' : 'rgba(185,203,194,0.3)',
                boxShadow: isConnected ? '0 0 8px rgba(0,255,204,0.5)' : 'none',
              }} />
              <span style={{
                fontSize: '13px', fontWeight: 600,
                color: '#e3e0f3', letterSpacing: '0.05em',
              }}>
                ECOOPS AI Chat
              </span>
            </div>
            <div
              onClick={() => setIsOpen(false)}
              style={{
                cursor: 'pointer',
                color: 'rgba(185,203,194,0.4)',
                fontSize: '18px',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#00ffcc';
                e.currentTarget.style.background = 'rgba(0,255,204,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(185,203,194,0.4)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ✕
            </div>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            minHeight: '200px',
            maxHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: 'rgba(185,203,194,0.3)',
                fontSize: '12px',
                padding: '40px 20px',
                lineHeight: 1.6,
              }}>
                {isConnected
                  ? '🌱 Voice session active.\nSpeak or type a message below.'
                  : 'Click the mic button to start a voice session, or type here.'}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user'
                    ? 'rgba(0,255,204,0.12)'
                    : 'rgba(162,89,255,0.1)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,255,204,0.15)' : 'rgba(162,89,255,0.15)'}`,
                  color: '#e3e0f3',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  animation: 'chatMsgIn 0.25s ease-out',
                }}>
                  <div style={{
                    fontSize: '9px',
                    color: msg.role === 'user' ? 'rgba(0,255,204,0.5)' : 'rgba(162,89,255,0.5)',
                    marginBottom: '3px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    {msg.role === 'user' ? 'You' : 'ECOOPS AI'}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{
            display: 'flex',
            padding: '10px 12px',
            borderTop: '1px solid rgba(0,255,204,0.08)',
            gap: '8px',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Type a message...' : 'Start voice first...'}
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'rgba(5,5,15,0.6)',
                border: '1px solid rgba(0,255,204,0.12)',
                borderRadius: '8px',
                color: '#e3e0f3',
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '12.5px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || !isConnected}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: inputValue.trim() && isConnected
                  ? 'linear-gradient(135deg, #00ffcc, #00e0b3)'
                  : 'rgba(50,50,60,0.5)',
                color: inputValue.trim() && isConnected ? '#050510' : '#555',
                cursor: inputValue.trim() && isConnected ? 'pointer' : 'not-allowed',
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
