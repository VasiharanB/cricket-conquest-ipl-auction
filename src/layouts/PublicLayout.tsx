import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components';
import './PublicLayout.css';

export const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="public-layout__content">
        <Outlet />
      </main>
      <footer className="public-layout__footer">
        <div className="container">
          <div className="footer__inner">
            <div className="footer__brand">
              <span className="footer__title">Cricket Conquest</span>
              <span className="footer__sub">ZenTriX'26 – National Level Technical Symposium</span>
            </div>
            <div className="footer__links">
              <a href="/#overview">Overview</a>
              <a href="/#rules">Rules</a>
              <a href="/register">Register</a>
            </div>
            <div className="footer__copy">
              © 2026 ZenTriX. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
