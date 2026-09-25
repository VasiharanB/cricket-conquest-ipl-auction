import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Lock, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/organizer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-page__glow" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-icon">
            <Trophy size={28} />
          </div>
          <h1 className="login-title">Organizer Portal</h1>
          <p className="login-subtitle">ZenTriX'26 Cricket Conquest Control Center</p>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="username">Username / Email</label>
            <div className="login-input-wrap">
              <User size={18} />
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="login-form-group">
            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <Lock size={18} />
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin-animation" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-quickfill">
          <div className="login-quickfill-title">Quick Demo Logins</div>
          <div className="login-quickfill-chips">
            <button
              type="button"
              className="quickfill-chip"
              onClick={() => handleQuickFill('admin', 'Admin@ZenTriX26')}
            >
              Admin
            </button>
            <button
              type="button"
              className="quickfill-chip"
              onClick={() => handleQuickFill('auctioneer', 'Auction@ZenTriX26')}
            >
              Auctioneer
            </button>
            <button
              type="button"
              className="quickfill-chip"
              onClick={() => handleQuickFill('volunteer', 'Volunteer@ZenTriX26')}
            >
              Volunteer
            </button>
          </div>
        </div>

        <Link to="/" className="login-back-link">
          ← Back to Public Website
        </Link>
      </div>
    </div>
  );
};
