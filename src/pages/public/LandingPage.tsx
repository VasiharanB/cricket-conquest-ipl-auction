import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Zap, Trophy, Calendar, MapPin, Clock, ChevronRight, ArrowRight, CircleDot } from 'lucide-react';
import { Button } from '../../components';
import './LandingPage.css';

const rules = [
  'Each team consists of 2–4 registered student participants.',
  'Total auction purse per team is strictly ₹50.00 Crore (exceeding purse results in immediate disqualification).',
  'Each team must acquire exactly 15 players in their final squad.',
  'Squad Role Minimums: Minimum 5 Batsmen / Wicketkeepers, Minimum 3 Bowlers, and Minimum 3 All-rounders (remaining 4 picks of any role to complete 15 players).',
  'Overseas Quota: Maximum 4 Foreign players per team.',
  'Capped and uncapped players have no limit — choose any tier to optimize your strategy.',
  'Elimination Policy: Any team failing to satisfy these minimum role requirements or exceeding purse/overseas limits is eliminated from championship contention.',
  'Championship Decision: The team with the highest Secret Key Points among qualified squads wins the tournament. Tiebreak is decided by lowest purse spent.',
];

const steps = [
  { step: '01', title: 'Register Your Team', desc: 'Form a team of 2–4 members and register with your college details.' },
  { step: '02', title: 'Get Your Purse', desc: 'Each team receives a fixed virtual purse to spend during the auction.' },
  { step: '03', title: 'Bid for Players', desc: 'Strategically bid for players in a live auction environment.' },
  { step: '04', title: 'Build Your Squad', desc: 'Complete your team within the budget and squad requirements to compete.' },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero" id="overview">
        <div className="container">
          <div className="hero__content">
            <div className="hero__badge">
              <Zap size={14} />
              ZenTriX'26 — National Level Technical Symposium
            </div>
            <h1 className="hero__title">
              <span className="hero__title-line hero__title-line--accent">Cricket</span>
              <span className="hero__title-line">Conquest</span>
            </h1>
            <p className="hero__subtitle">IPL Auction</p>
            <p className="hero__tagline">Build Your Franchise. Master the Auction.</p>

            <div className="hero__meta">
              <div className="hero__meta-item">
                <Calendar size={16} />
                <span>To be announced</span>
              </div>
              <div className="hero__meta-item">
                <MapPin size={16} />
                <span>To be announced</span>
              </div>
              <div className="hero__meta-item">
                <Clock size={16} />
                <span>Team size: 2–4 participants</span>
              </div>
            </div>

            <div className="hero__actions">
              <Link to="/register">
                <Button variant="primary" size="lg" icon={<ArrowRight size={18} />}>
                  Register Your Team
                </Button>
              </Link>
              <a href="#rules">
                <Button variant="outline" size="lg">View Rules</Button>
              </a>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__cricket-icon">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero__cricket-svg">
                {/* Cricket ball */}
                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.15"/>
                <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1.5" opacity="0.1"/>
                <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" opacity="0.08"/>
                {/* Seam lines */}
                <path d="M60 70 Q100 50 140 70" stroke="currentColor" strokeWidth="2" opacity="0.2" fill="none"/>
                <path d="M60 130 Q100 150 140 130" stroke="currentColor" strokeWidth="2" opacity="0.2" fill="none"/>
                {/* Center dot */}
                <circle cx="100" cy="100" r="8" fill="currentColor" opacity="0.12"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-strip__grid">
            <div className="stats-strip__item">
              <div className="stats-strip__icon"><Users size={22} /></div>
              <div className="stats-strip__value">16</div>
              <div className="stats-strip__label">Team Slots</div>
            </div>
            <div className="stats-strip__item">
              <div className="stats-strip__icon"><Users size={22} /></div>
              <div className="stats-strip__value">2–4</div>
              <div className="stats-strip__label">Members per Team</div>
            </div>
            <div className="stats-strip__item">
              <div className="stats-strip__icon"><Zap size={22} /></div>
              <div className="stats-strip__value">Live</div>
              <div className="stats-strip__label">Auction</div>
            </div>
            <div className="stats-strip__item">
              <div className="stats-strip__icon"><Trophy size={22} /></div>
              <div className="stats-strip__value">Exciting</div>
              <div className="stats-strip__label">Prizes</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-desc">Your journey from registration to championship</p>
          </div>
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.step} className="step-card">
                <div className="step-card__number">{s.step}</div>
                <h3 className="step-card__title">{s.title}</h3>
                <p className="step-card__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="rules-section" id="rules">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Rules & Regulations</h2>
            <p className="section-desc">Please read all rules carefully before registering</p>
          </div>
          <div className="rules-card">
            <ol className="rules-list">
              {rules.map((rule, i) => (
                <li key={i} className="rules-list__item">
                  <CircleDot size={16} className="rules-list__icon" />
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-card__title">Ready to Compete?</h2>
            <p className="cta-card__desc">Limited to 16 teams. Register now to secure your spot.</p>
            <Link to="/register">
              <Button variant="primary" size="lg" icon={<ChevronRight size={18} />}>
                Register Your Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
