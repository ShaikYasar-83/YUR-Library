import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    return new URLSearchParams(window.location.search).get('admin') === 'true';
  });
  const [errorMsg, setErrorMsg] = useState(() => {
    const msg = new URLSearchParams(window.location.search).get('msg');
    return msg === 'login_required' ? 'Please sign in to access this feature.' : '';
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Ensure that if they selected "Admin Login", they actually have the admin role
      if (isAdmin && data.user.role !== 'admin') {
        throw new Error('Not authorized as an admin account.');
      }

      // Store tokens
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect legacy paths
      if (data.user.role === 'admin') {
        window.location.href = '/admin-dashboard.html';
      } else {
        window.location.href = '/dashboard.html';
      }

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ flexDirection: 'column' }}>
      {/* Top Action Bar (Admin Toggle) */}
      <div style={{ width: '100%', maxWidth: '460px', display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        {!isAdmin && (
          <button 
            onClick={() => setIsAdmin(true)}
            style={{
              background: 'none', border: '1px solid var(--border-light)',
              color: 'var(--text-muted)', padding: '0.4rem 0.8rem',
              borderRadius: '40px', cursor: 'pointer', fontWeight: 600,
              transition: 'var(--transition)', fontSize: '0.85rem'
            }}
            onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            <i className="bi bi-shield-lock me-1"></i> Admin Sign In
          </button>
        )}

        {isAdmin && (
          <button 
            onClick={() => setIsAdmin(false)}
            style={{
              marginRight: 'auto', // Pushes it to the left
              background: 'none', border: '1px solid var(--border-light)',
              color: 'var(--text-muted)', padding: '0.4rem 0.8rem',
              borderRadius: '40px', cursor: 'pointer', fontWeight: 600,
              transition: 'var(--transition)', fontSize: '0.85rem'
            }}
          >
            <i className="bi bi-arrow-left me-1"></i> Back
          </button>
        )}
      </div>

      {/* Shared Auth Card (Admin or Student) */}
      <div className="auth-card">
        <div className="auth-header">
          <div className="nav-logo" style={{ justifyContent: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            <img src="/images/logo.jpg" alt="YUR LIBRARY Logo" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <span>{isAdmin ? 'Admin Portal' : 'YUR LIBRARY'}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isAdmin ? 'Sign in to manage users and resources' : 'Sign in to sync your notes across devices'}
          </p>
        </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
          <div className="mb-3" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '1.1rem'
                }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? (
              <span id="btn-loading"><div className="spinner"></div></span>
            ) : (
              <span id="btn-text">Sign In <i className="bi bi-arrow-right ml-1" style={{ marginLeft: '0.25rem' }}></i></span>
            )}
          </button>
        </form>

        {!isAdmin && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
              <span style={{ padding: '0 1rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
            </div>

            <button 
              onClick={() => window.location.href = '/dashboard.html'}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent-1)', background: 'none',
                color: 'var(--accent-1)', fontWeight: 600, cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onMouseOver={(e) => { e.target.style.background = 'rgba(79, 70, 229, 0.05)'; }}
              onMouseOut={(e) => { e.target.style.background = 'none'; }}
            >
              Continue as Guest
            </button>
          </>
        )}

        {!isAdmin && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account? 
            <Link to="/signup" style={{ color: 'var(--accent-1)', fontWeight: 600, marginLeft: '0.4rem' }}>Create Account</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
