import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ShieldOff, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Admin' | 'Auctioneer' | 'Volunteer')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#38BDF8', gap: 12 }}>
        <Loader2 size={36} className="spin-animation" />
        <span style={{ fontSize: 16, fontWeight: 600 }}>Verifying Organizer Access...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/organizer/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const userRole = String(user.role || '').toLowerCase();
    const isAllowed = allowedRoles.some((r) => String(r).toLowerCase() === userRole);
    if (!isAllowed) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 40,
        textAlign: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)',
          border: '2px solid rgba(239,68,68,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}>
          <ShieldOff size={32} color="#F87171" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F87171', margin: 0 }}>Access Denied</h2>
        <p style={{ color: '#94A3B8', maxWidth: 380, fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          Your role <strong style={{ color: '#F8FAFC' }}>{user.role}</strong> does not have permission to access this section.
          <br />
          Required: <strong style={{ color: '#38BDF8' }}>{allowedRoles.join(' or ')}</strong>
        </p>
        <button
          onClick={() => navigate('/organizer')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            color: '#F8FAFC',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
            marginTop: 8,
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );
  }
}

  return <>{children}</>;
};
