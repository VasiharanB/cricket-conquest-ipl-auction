import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { OrganizerLayout } from './layouts/OrganizerLayout';
import { LandingPage } from './pages/public/LandingPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { RegistrationSuccessPage } from './pages/public/RegistrationSuccessPage';
import { LoginPage } from './pages/organizer/LoginPage';
import { Dashboard } from './pages/organizer/Dashboard';
import { TeamsManagement } from './pages/organizer/TeamsManagement';
import { PlayerDatabase } from './pages/organizer/PlayerDatabase';
import { LiveAuction } from './pages/organizer/LiveAuction';
import { AuctionHistory } from './pages/organizer/AuctionHistory';
import { Results } from './pages/organizer/Results';
import { WatchdogMonitor } from './pages/organizer/WatchdogMonitor';
import { UserManagement } from './pages/organizer/UserManagement';
import { ParticipantLoginPage } from './pages/participant/ParticipantLoginPage';
import { ParticipantDashboard } from './pages/participant/ParticipantDashboard';
import { ParticipantAuctionRoom } from './pages/participant/ParticipantAuctionRoom';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/success" element={<RegistrationSuccessPage />} />
          </Route>

          {/* Participant Portal Routes */}
          <Route path="/participant/login" element={<ParticipantLoginPage />} />
          <Route path="/participant/dashboard" element={<ParticipantDashboard />} />
          <Route path="/participant/auction" element={<ParticipantAuctionRoom />} />

          {/* Organizer Login */}
          <Route path="/organizer/login" element={<LoginPage />} />

          {/* Organizer Protected Routes (all roles) */}
          <Route path="/organizer" element={<OrganizerLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="teams" element={<TeamsManagement />} />
            <Route path="players" element={<PlayerDatabase />} />
            <Route path="auction" element={<LiveAuction />} />
            <Route path="history" element={<AuctionHistory />} />
            <Route path="results" element={<Results />} />

            {/* Admin + Auctioneer + Volunteer (monitoring) */}
            <Route
              path="monitor"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Auctioneer', 'Volunteer']}>
                  <WatchdogMonitor />
                </ProtectedRoute>
              }
            />

            {/* Admin only – User Management */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
