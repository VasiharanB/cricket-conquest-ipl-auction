import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Users, User, UserPlus, ClipboardCheck, Loader2, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../../components';
import { teamService } from '../../services/teamService';
import './RegisterPage.css';

interface FormData {
  teamName: string;
  college: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  member2: string;
  member3: string;
  member4: string;
}

const initialForm: FormData = {
  teamName: '',
  college: '',
  captainName: '',
  captainEmail: '',
  captainPhone: '',
  member2: '',
  member3: '',
  member4: '',
};

const stepLabels = [
  { label: 'Team Info', icon: Users },
  { label: 'Captain', icon: User },
  { label: 'Members', icon: UserPlus },
  { label: 'Review', icon: ClipboardCheck },
];

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (submitError) setSubmitError(null);
  };

  const canNext = () => {
    if (step === 0) return form.teamName.trim() !== '' && form.college.trim() !== '';
    if (step === 1) return form.captainName.trim() !== '' && form.captainEmail.trim() !== '' && form.captainPhone.trim() !== '';
    if (step === 2) return form.member2.trim() !== '';
    return true;
  };

  const memberCount = [form.captainName, form.member2, form.member3, form.member4].filter(Boolean).length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const additionalMembers = [
        { fullName: form.member2.trim() },
        ...(form.member3.trim() ? [{ fullName: form.member3.trim() }] : []),
        ...(form.member4.trim() ? [{ fullName: form.member4.trim() }] : []),
      ];

      const createdTeam = await teamService.createTeam({
        teamName: form.teamName.trim(),
        collegeName: form.college.trim(),
        captain: {
          fullName: form.captainName.trim(),
          email: form.captainEmail.trim(),
          phone: form.captainPhone.trim(),
        },
        members: additionalMembers,
      });

      navigate('/register/success', {
        state: {
          teamId: createdTeam.teamId,
          teamName: createdTeam.teamName,
          college: createdTeam.collegeName,
          captain: createdTeam.captainName,
          memberCount: createdTeam.memberCount,
          status: createdTeam.registrationStatus,
          accessCode: createdTeam.accessCode,
        },
      });
    } catch (err: any) {
      console.error('Registration failed:', err);
      setSubmitError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="container-narrow">
        <div className="register-page__header">
          <h1 className="register-page__title">Register Your Team</h1>
          <p className="register-page__desc">Join Cricket Conquest at ZenTriX'26</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          {stepLabels.map((s, i) => (
            <div
              key={i}
              className={`step-indicator__item ${i === step ? 'step-indicator__item--active' : ''} ${i < step ? 'step-indicator__item--done' : ''}`}
            >
              <div className="step-indicator__circle">
                {i < step ? <Check size={14} /> : <s.icon size={14} />}
              </div>
              <span className="step-indicator__label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <Card className="register-form animate-slide-up">
          {submitError && (
            <div
              className="register-error-banner"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-danger-soft)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{submitError}</span>
            </div>
          )}

          {step === 0 && (
            <div className="form-step">
              <h2 className="form-step__title">Team Information</h2>
              <p className="form-step__desc">Choose a team name and enter your college</p>
              <div className="form-step__fields">
                <Input
                  label="Team / Franchise Name"
                  placeholder="e.g. Royal Strikers"
                  value={form.teamName}
                  onChange={(e) => updateField('teamName', e.target.value)}
                  required
                />
                <Input
                  label="College Name"
                  placeholder="e.g. PSG College of Technology"
                  value={form.college}
                  onChange={(e) => updateField('college', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form-step">
              <h2 className="form-step__title">Captain Details</h2>
              <p className="form-step__desc">The captain will be the primary point of contact</p>
              <div className="form-step__fields">
                <Input
                  label="Full Name"
                  placeholder="Captain's full name"
                  value={form.captainName}
                  onChange={(e) => updateField('captainName', e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="captain@email.com"
                  value={form.captainEmail}
                  onChange={(e) => updateField('captainEmail', e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.captainPhone}
                  onChange={(e) => updateField('captainPhone', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2 className="form-step__title">Team Members</h2>
              <p className="form-step__desc">Minimum 2 members (including captain) · Maximum 4 members</p>
              <div className="form-step__fields">
                <Input
                  label="Member 2 (Required)"
                  placeholder="Full name"
                  value={form.member2}
                  onChange={(e) => updateField('member2', e.target.value)}
                  required
                />
                <Input
                  label="Member 3 (Optional)"
                  placeholder="Full name"
                  value={form.member3}
                  onChange={(e) => updateField('member3', e.target.value)}
                />
                <Input
                  label="Member 4 (Optional)"
                  placeholder="Full name"
                  value={form.member4}
                  onChange={(e) => updateField('member4', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2 className="form-step__title">Review & Confirm</h2>
              <p className="form-step__desc">Please verify all details before submitting</p>
              <div className="review-card">
                <div className="review-row">
                  <span className="review-row__label">Team Name</span>
                  <span className="review-row__value">{form.teamName}</span>
                </div>
                <div className="review-row">
                  <span className="review-row__label">College</span>
                  <span className="review-row__value">{form.college}</span>
                </div>
                <div className="review-row">
                  <span className="review-row__label">Captain</span>
                  <span className="review-row__value">{form.captainName}</span>
                </div>
                <div className="review-row">
                  <span className="review-row__label">Email</span>
                  <span className="review-row__value">{form.captainEmail}</span>
                </div>
                <div className="review-row">
                  <span className="review-row__label">Phone</span>
                  <span className="review-row__value">{form.captainPhone}</span>
                </div>
                <div className="review-row">
                  <span className="review-row__label">Members</span>
                  <span className="review-row__value">{memberCount} members</span>
                </div>
                <div className="review-members">
                  <span className="review-members__label">Team Roster</span>
                  <ul className="review-members__list">
                    <li>👑 {form.captainName} (Captain)</li>
                    {form.member2 && <li>{form.member2}</li>}
                    {form.member3 && <li>{form.member3}</li>}
                    {form.member4 && <li>{form.member4}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-nav">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} />}>
                Back
              </Button>
            )}
            <div className="form-nav__spacer" />
            {step < 3 ? (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                icon={<ArrowRight size={16} />}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                icon={isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              >
                {isSubmitting ? 'Registering Team...' : 'Register Team'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
