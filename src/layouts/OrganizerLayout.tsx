import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components';
import { ProtectedRoute } from '../components/ProtectedRoute';
import './OrganizerLayout.css';

export const OrganizerLayout: React.FC = () => {
  const location = useLocation();
  const isAuctionMode = location.pathname.startsWith('/organizer/auction');

  return (
    <ProtectedRoute>
      <div className={`organizer-layout ${isAuctionMode ? 'organizer-layout--auction-mode' : ''}`}>
        {!isAuctionMode && <Sidebar />}
        <main className={`organizer-layout__content ${isAuctionMode ? 'organizer-layout__content--auction' : ''}`}>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};
