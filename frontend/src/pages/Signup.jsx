import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BASE_URL } from '../api';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    branch: '',
    year: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Pass token to Render via URL params (stripped immediately on arrival)
      const p = new URLSearchParams();
      p.set('_t', data.token);
      p.set('_u', JSON.stringify(data.user));
      window.location.href = `https://yur-library.onrender.com/dashboard.html?${p.toString()}`;

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div className="nav-logo" style={{ justifyContent: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            <img src="https://yur-library.onrender.com/images/logo.jpg" alt="YUR LIBRARY Logo" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <span>Create Account</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Join YUR LIBRARY to access and share knowledge
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-control"
                placeholder="john"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="password">Password (min 6 chars)</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label" htmlFor="college">College</label>
              <input
                id="college"
                type="text"
                className="form-control"
                placeholder="University Name"
                value={formData.college}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="branch">Branch</label>
              <input
                id="branch"
                type="text"
                className="form-control"
                placeholder="e.g. CSE"
                value={formData.branch}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-4" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="year">Year of Study</label>
            <select
              id="year"
              className="form-select"
              value={formData.year}
              onChange={handleChange}
              required
            >
              <option value="">Select Year...</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
          </div>

          <button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <span>Get Started <i className="bi bi-person-plus ml-1" style={{ marginLeft: '0.25rem' }}></i></span>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account? 
          <Link to="/login" style={{ color: 'var(--accent-1)', fontWeight: 600, marginLeft: '0.4rem' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

