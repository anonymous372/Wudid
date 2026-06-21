import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api/auth';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(initialError ? 'error' : 'idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState(initialError || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email');
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to request link');
      
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '48px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>Wudid</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Sign in to continue</p>
        
        {status === 'success' ? (
          <div style={{ padding: '24px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', color: '#4ade80' }}>
            <p style={{ margin: 0 }}>Magic link sent! Check your terminal console to log in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
              style={{
                width: '100%',
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            {status === 'error' && <p style={{ color: '#ef4444', fontSize: '14px', margin: 0, textAlign: 'left' }}>{errorMsg}</p>}
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '16px',
                background: '#0f172a',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
                transition: 'opacity 0.2s, transform 0.2s'
              }}
            >
              {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
