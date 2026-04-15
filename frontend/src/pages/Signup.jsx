import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
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
  const [successMsg, setSuccessMsg] = useState('');
  
  // Verification State
  const [showVerification, setShowVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Success - show verification form
      setSuccessMsg(data.message);
      setShowVerification(true);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Store tokens
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccessMsg('Email verified! Redirecting...');
      
      // Redirect to student dashboard
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      setSuccessMsg('A new code has been sent to your email.');

    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div className="nav-logo" style={{ justifyContent: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            <div className="icon-box" style={{ background: 'var(--accent-1)' }}>
               <i className={showVerification ? "bi bi-shield-check" : "bi bi-person-plus"} style={{ color: '#fff' }}></i>
            </div>
            <span>{showVerification ? 'Verify Email' : 'Create Account'}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {showVerification 
               ? `Enter the 6-digit code sent to ${formData.email}`
               : 'Join YUR LIBRARY to access and share knowledge'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {!showVerification ? (
          <form onSubmit={handleSignup} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  placeholder="Jane Doe"
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
                  placeholder="you@college.edu"
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
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="mb-4" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="otp" style={{ textAlign: 'center', display: 'block' }}>Verification Code</label>
              <input
                id="otp"
                type="text"
                className="form-control"
                placeholder="000000"
                maxLength="6"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 'bold' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <button type="submit" className="btn-primary-custom" disabled={verifying}>
              {verifying ? (
                <div className="spinner"></div>
              ) : (
                <span>Verify Account <i className="bi bi-check-circle ml-1" style={{ marginLeft: '0.25rem' }}></i></span>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Didn't receive the code? 
                <button 
                  type="button" 
                  onClick={handleResendOTP}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-1)', fontWeight: 600, marginLeft: '0.5rem', cursor: 'pointer' }}
                >
                  Resend OTP
                </button>
              </p>
              <button 
                type="button" 
                onClick={() => setShowVerification(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem', cursor: 'pointer' }}
              >
                ← Back to registration
              </button>
            </div>
          </form>
        )}

        {!showVerification && (
          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account? 
            <Link to="/login" style={{ color: 'var(--accent-1)', fontWeight: 600, marginLeft: '0.4rem' }}>Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Signup;

