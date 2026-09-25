import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy } from 'lucide-react';
import { Button } from '../Button/Button';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.hash === path;

  return (
    <nav className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand">
          <Trophy size={22} className="navbar__logo-icon" />
          <div className="navbar__brand-text">
            <span className="navbar__brand-sub">ZenTriX'26</span>
            <span className="navbar__brand-name">Cricket Conquest</span>
          </div>
        </Link>

        <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
          <a href="/#overview" className={`navbar__link ${isActive('#overview') ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>Overview</a>
          <a href="/#rules" className={`navbar__link ${isActive('#rules') ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>Rules</a>
          <a href="/#how-it-works" className={`navbar__link ${isActive('#how-it-works') ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>How It Works</a>
          <Link to="/register" className="navbar__link-cta" onClick={() => setMobileOpen(false)}>
            <Button variant="primary" size="sm">Register</Button>
          </Link>
        </div>

        <button
          className="navbar__mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};
