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
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // the backend might use role if needed, or simply resolves by credentials
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
        window.location.href = 'http://localhost:5000/admin-dashboard.html';
      } else {
        window.location.href = 'http://localhost:5000/dashboard.html';
      }

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      
      {/* Corner Admin Login Button */}
      {!isAdmin && (
        <button 
          onClick={() => setIsAdmin(true)}
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'none', border: '1px solid var(--border-light)',
            color: 'var(--text-muted)', padding: '0.5rem 1rem',
            borderRadius: '40px', cursor: 'pointer', fontWeight: 600,
            transition: 'var(--transition)'
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
            position: 'absolute', top: '1.5rem', left: '1.5rem',
            background: 'none', border: '1px solid var(--border-light)',
            color: 'var(--text-muted)', padding: '0.5rem 1rem',
            borderRadius: '40px', cursor: 'pointer', fontWeight: 600,
            transition: 'var(--transition)'
          }}
        >
          <i className="bi bi-arrow-left me-1"></i> Back
        </button>
      )}

      {/* Shared Auth Card (Admin or Student) */}
      <div className="auth-card">
        <div className="auth-header">
          <div className="nav-logo" style={{ justifyContent: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            <div className="icon-box" style={{ background: isAdmin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'var(--accent-1)' }}>
              {isAdmin ? '🛡️' : '📚'}
            </div>
            <span>{isAdmin ? 'Admin Portal' : 'YUR Hub'}</span>
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
              onClick={() => window.location.href = 'http://localhost:5000/dashboard.html'}
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
      </div>
    </div>
  );
};

export default Login;
