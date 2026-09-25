import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { Button, Card } from '../../components';
import './RegistrationSuccessPage.css';

interface LocationState {
  teamId?: string;
  teamName?: string;
  college?: string;
  captain?: string;
  memberCount?: number;
  status?: string;
  accessCode?: string;
}

export const RegistrationSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;

  const teamId = state?.teamId || 'CC26-001';
  const teamName = state?.teamName || 'Royal Strikers';
  const college = state?.college || 'Prince Shri Venkateshwara Padmavathy Engineering College';
  const captain = state?.captain || 'Arun Kumar';
  const memberCount = state?.memberCount || 4;
  const status = state?.status || 'CONFIRMED';
  const accessCode = state?.accessCode || 'CC26-ROYA-1001';

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
      QRCode.toDataURL(
        JSON.stringify({
          event: 'ZenTriX 26 Cricket Conquest',
          teamId,
          teamName,
          captain,
          accessCode,
        }),
        {
          width: 200,
          margin: 1,
          color: {
            dark: '#1B2A4A',
            light: '#FFFFFF',
          },
        }
      )
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [teamId, teamName, captain, accessCode]);

  const handleDownload = () => {
    const confirmationText = `================================================
CRICKET CONQUEST - ZENTRIX'26
TEAM REGISTRATION CONFIRMATION
================================================
Team ID: ${teamId}
Team Name: ${teamName}
Access Code: ${accessCode}
College: ${college}
Captain: ${captain}
Total Members: ${memberCount}
Status: ${status}
================================================
IMPORTANT FOR CONTESTANTS:
Your Access Code is: ${accessCode}
Use this code along with your Team ID to login to the
Live Auction & Participant Dashboard at /participant/login
Please present this Team ID during event-day check-in.
================================================
`;
    const blob = new Blob([confirmationText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${teamId}_registration_confirmation.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="success-page">
      <div className="container-narrow">
        <div className="success-page__content animate-slide-up">
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>

          <h1 className="success-page__title">Registration Confirmed!</h1>
          <p className="success-page__desc">Your team has been successfully registered for Cricket Conquest</p>

          <Card className="confirmation-card">
            <div className="confirmation-card__header">
              <span className="confirmation-card__badge">{status}</span>
            </div>

            <div className="confirmation-card__body">
              <div className="confirmation-row">
                <span className="confirmation-row__label">Team</span>
                <span className="confirmation-row__value">{teamName}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-row__label">Team ID</span>
                <span className="confirmation-row__value confirmation-row__value--mono">{teamId}</span>
              </div>
              <div className="confirmation-row" style={{ background: 'rgba(0, 245, 155, 0.08)', borderRadius: 8, padding: '10px 12px', margin: '4px 0' }}>
                <span className="confirmation-row__label" style={{ color: '#00F59B', fontWeight: 700 }}>
                  🔑 Participant Access Code
                </span>
                <span className="confirmation-row__value confirmation-row__value--mono" style={{ color: '#00F59B', fontWeight: 800, fontSize: 16, border: '1px dashed #00F59B' }}>
                  {accessCode}
                </span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-row__label">College</span>
                <span className="confirmation-row__value">{college}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-row__label">Captain</span>
                <span className="confirmation-row__value">{captain}</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-row__label">Members</span>
                <span className="confirmation-row__value">{memberCount} participants</span>
              </div>
              <div className="confirmation-row">
                <span className="confirmation-row__label">Status</span>
                <span className="confirmation-row__value confirmation-row__value--status">
                  ✅ {status}
                </span>
              </div>
            </div>

            <div className="confirmation-qr">
              <div className="confirmation-qr__placeholder">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR Code for Team ${teamId}`}
                    style={{ width: 140, height: 140, borderRadius: 8 }}
                  />
                ) : (
                  <QrCode size={80} strokeWidth={1} />
                )}
              </div>
              <p className="confirmation-qr__hint">
                Save your Team ID (<strong>{teamId}</strong>) and Access Code (<strong>{accessCode}</strong>). You will need both to enter the Live Auction Room.
              </p>
            </div>
          </Card>

          <div className="success-actions" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/participant/login" style={{ width: '100%', textDecoration: 'none' }}>
              <Button
                variant="primary"
                fullWidth
                style={{
                  background: 'linear-gradient(135deg, #00F59B, #0284C7)',
                  color: '#050814',
                  fontWeight: 800,
                  fontSize: 16,
                  padding: '14px',
                  boxShadow: '0 0 20px rgba(0, 245, 155, 0.4)'
                }}
              >
                🚀 Enter Participant Portal Now
              </Button>
            </Link>

            <Button
              variant="outline"
              icon={<Download size={16} />}
              fullWidth
              onClick={handleDownload}
            >
              Download Confirmation Receipt
            </Button>

            <Link to="/" style={{ width: '100%' }}>
              <Button variant="secondary" icon={<ArrowLeft size={16} />} fullWidth>
                Back to Event Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
