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
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '3rem' }}>⚠️</p>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '20rem' }}>
            {error.message ?? 'A critical error occurred.'}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '0.5rem',
              borderRadius: '9999px',
              background: '#22c55e',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
