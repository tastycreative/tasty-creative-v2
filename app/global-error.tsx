'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 50%, #fefce8 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '28rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                margin: '0 auto 1.5rem',
                height: '4rem',
                width: '4rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}>
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: '#0f172a',
                marginBottom: '0.75rem'
              }}>
                Something went wrong
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                marginBottom: '0'
              }}>
                We encountered a critical system error. Please refresh the page to continue.
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div style={{
                margin: '0 2rem 1.5rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#dc2626',
                  wordBreak: 'break-word',
                  margin: '0'
                }}>
                  {error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{
              padding: '0 2rem 2rem'
            }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #ef4444 0%, #ea580c 100%)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#0f172a',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Go to Home
              </button>
              <p style={{
                fontSize: '0.75rem',
                textAlign: 'center',
                color: '#94a3b8',
                marginTop: '1rem',
                marginBottom: '0'
              }}>
                If this problem persists, please contact support
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .8;
            }
          }
          
          button {
            transition: all 0.2s ease;
          }
        `}</style>
      </body>
    </html>
  );
}
