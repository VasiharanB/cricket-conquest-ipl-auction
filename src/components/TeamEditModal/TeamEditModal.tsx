import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { teamService } from '../../services/teamService';
import type { TeamRecord } from '../../services/teamService';
import './TeamEditModal.css';

interface TeamEditModalProps {
  team: TeamRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTeam: TeamRecord) => void;
}

export const TeamEditModal: React.FC<TeamEditModalProps> = ({
  team,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [teamName, setTeamName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState<'CONFIRMED' | 'PENDING' | 'WAITLISTED' | 'CANCELLED'>('CONFIRMED');
  const [checkInStatus, setCheckInStatus] = useState<'NOT_CHECKED_IN' | 'CHECKED_IN'>('NOT_CHECKED_IN');
  const [startingPurse, setStartingPurse] = useState<number | string>(0);
  const [remainingPurse, setRemainingPurse] = useState<number | string>(0);

  // Additional members (Member 2, 3, 4)
  const [member2, setMember2] = useState('');
  const [member3, setMember3] = useState('');
  const [member4, setMember4] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setTeamName(team.teamName);
      setCollegeName(team.collegeName);
      setCaptainName(team.captainName);
      setCaptainEmail(team.captainEmail);
      setCaptainPhone(team.captainPhone);
      setRegistrationStatus(team.registrationStatus);
      setCheckInStatus(team.checkInStatus);
      setStartingPurse(team.startingPurse);
      setRemainingPurse(team.remainingPurse);

      // Members 2, 3, 4
      const nonCaptains = team.members.filter((m) => !m.isCaptain);
      setMember2(nonCaptains[0]?.fullName || '');
      setMember3(nonCaptains[1]?.fullName || '');
      setMember4(nonCaptains[2]?.fullName || '');

      setError(null);
    }
  }, [team]);

  if (!team) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError('Team Name is required');
      return;
    }
    if (!collegeName.trim()) {
      setError('College Name is required');
      return;
    }
    if (!captainName.trim()) {
      setError('Captain Name is required');
      return;
    }
    if (!captainEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captainEmail.trim())) {
      setError('A valid Captain Email is required');
      return;
    }
    if (!captainPhone.trim()) {
      setError('Captain Phone is required');
      return;
    }
    if (!member2.trim()) {
      setError('At least one additional team member (Member 2) is required');
      return;
    }

    const additionalMembers = [
      { fullName: member2.trim() },
      ...(member3.trim() ? [{ fullName: member3.trim() }] : []),
      ...(member4.trim() ? [{ fullName: member4.trim() }] : []),
    ];

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await teamService.updateTeam(team.teamId, {
        teamName: teamName.trim(),
        collegeName: collegeName.trim(),
        captainName: captainName.trim(),
        captainEmail: captainEmail.trim(),
        captainPhone: captainPhone.trim(),
        registrationStatus,
        checkInStatus,
        startingPurse: Number(startingPurse) || 0,
        remainingPurse: Number(remainingPurse) || 0,
        members: additionalMembers,
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Update team error:', err);
      setError(err.message || 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Team — ${team.teamId}`} size="lg">
      <form onSubmit={handleSubmit} className="team-edit-form">
        {error && (
          <div className="team-edit-form__error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="team-edit-form__section">
          <h4 className="team-edit-form__section-title">Team Identification</h4>
          <div className="team-edit-form__row team-edit-form__row--2">
            <div className="team-edit-form__group">
              <label>Team ID</label>
              <input type="text" value={team.teamId} disabled className="team-edit-form__input--disabled" />
            </div>
            <div className="team-edit-form__group">
              <label>Team Name <span className="text-danger">*</span></label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Royal Strikers"
                required
              />
            </div>
          </div>

          <div className="team-edit-form__group">
            <label>College Name <span className="text-danger">*</span></label>
            <input
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="e.g. College of Engineering"
              required
            />
          </div>
        </div>

        <div className="team-edit-form__section">
          <h4 className="team-edit-form__section-title">Captain Details</h4>
          <div className="team-edit-form__row team-edit-form__row--3">
            <div className="team-edit-form__group">
              <label>Captain Name <span className="text-danger">*</span></label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div className="team-edit-form__group">
              <label>Captain Email <span className="text-danger">*</span></label>
              <input
                type="email"
                value={captainEmail}
                onChange={(e) => setCaptainEmail(e.target.value)}
                placeholder="captain@college.edu"
                required
              />
            </div>
            <div className="team-edit-form__group">
              <label>Captain Phone <span className="text-danger">*</span></label>
              <input
                type="tel"
                value={captainPhone}
                onChange={(e) => setCaptainPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>
        </div>

        <div className="team-edit-form__section">
          <h4 className="team-edit-form__section-title">Team Members (Roster)</h4>
          <div className="team-edit-form__row team-edit-form__row--3">
            <div className="team-edit-form__group">
              <label>Member 2 <span className="text-danger">*</span></label>
              <input
                type="text"
                value={member2}
                onChange={(e) => setMember2(e.target.value)}
                placeholder="Required participant"
                required
              />
            </div>
            <div className="team-edit-form__group">
              <label>Member 3 (Optional)</label>
              <input
                type="text"
                value={member3}
                onChange={(e) => setMember3(e.target.value)}
                placeholder="Optional participant"
              />
            </div>
            <div className="team-edit-form__group">
              <label>Member 4 (Optional)</label>
              <input
                type="text"
                value={member4}
                onChange={(e) => setMember4(e.target.value)}
                placeholder="Optional participant"
              />
            </div>
          </div>
        </div>

        <div className="team-edit-form__section">
          <h4 className="team-edit-form__section-title">Status & Budget</h4>
          <div className="team-edit-form__row team-edit-form__row--4">
            <div className="team-edit-form__group">
              <label>Registration Status</label>
              <select
                value={registrationStatus}
                onChange={(e) => setRegistrationStatus(e.target.value as any)}
              >
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING">PENDING</option>
                <option value="WAITLISTED">WAITLISTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div className="team-edit-form__group">
              <label>Event Check-In</label>
              <select
                value={checkInStatus}
                onChange={(e) => setCheckInStatus(e.target.value as any)}
              >
                <option value="NOT_CHECKED_IN">NOT CHECKED IN</option>
                <option value="CHECKED_IN">CHECKED IN</option>
              </select>
            </div>
            <div className="team-edit-form__group">
              <label>Starting Purse (₹ Cr)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={startingPurse}
                onChange={(e) => setStartingPurse(e.target.value)}
              />
            </div>
            <div className="team-edit-form__group">
              <label>Remaining Purse (₹ Cr)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={remainingPurse}
                onChange={(e) => setRemainingPurse(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="team-edit-form__actions">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
