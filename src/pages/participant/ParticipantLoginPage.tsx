import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, KeyRound, AlertCircle, Loader2, ArrowRight, Trophy } from 'lucide-react';
import { participantService } from '../../services/participantService';
import './ParticipantLoginPage.css';

export const ParticipantLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !accessCode.trim()) {
      setError('Please provide your Team ID / Email and Access Code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await participantService.login(identifier.trim(), accessCode.trim());
      navigate('/participant/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (id: string, code: string) => {
    setIdentifier(id);
    setAccessCode(code);
    setError(null);
  };

  return (
    <div className="part-login-page">
      <div className="part-login-card">
        <div style={{ textAlign: 'center' }}>
          <div className="part-login-badge">
            <Trophy size={14} />
            <span>Cricket Conquest Contestant</span>
          </div>
          <h1 className="part-login-title">Team Login</h1>
          <p className="part-login-desc">Enter your Team ID and Access Code provided after registration.</p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              padding: '12px 16px',
              borderRadius: 12,
              marginBottom: 20,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase' }}>
              Team ID or Captain Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Shield size={18} style={{ position: 'absolute', left: 14, color: '#00F59B' }} />
              <input
                type="text"
                placeholder="e.g. CC26-001 or captain@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 48,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  padding: '0 16px 0 46px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase' }}>
              Access Code
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: 14, color: '#00F59B' }} />
              <input
                type="text"
                placeholder="e.g. CC26-MUMB-5692"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 48,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 12,
                  padding: '0 16px 0 46px',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              />
            </div>
          </div>

          <button type="submit" className="part-login-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin-animation" />
                <span>Validating Team Pass...</span>
              </>
            ) : (
              <>
                <span>Enter Team Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="part-quickfill-box">
          <div className="part-quickfill-label">Quick Demo Team Passwords</div>
          <div className="part-quickfill-chips">
            <button
              type="button"
              className="part-chip"
              onClick={() => handleQuickFill('CC26-001', 'CC26-CSK-2026')}
            >
              CSK (CC26-001)
            </button>
            <button
              type="button"
              className="part-chip"
              onClick={() => handleQuickFill('CC26-002', 'CC26-MI-2026')}
            >
              MI (CC26-002)
            </button>
            <button
              type="button"
              className="part-chip"
              onClick={() => handleQuickFill('CC26-003', 'CC26-RCB-2026')}
            >
              RCB (CC26-003)
            </button>
            <button
              type="button"
              className="part-chip"
              onClick={() => handleQuickFill('CC26-004', 'CC26-KKR-2026')}
            >
              KKR (CC26-004)
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/register" style={{ color: '#00F59B', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            Haven't registered your team yet? Register Here →
          </Link>
        </div>
      </div>
    </div>
  );
};
