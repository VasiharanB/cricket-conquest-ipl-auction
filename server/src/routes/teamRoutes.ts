import { Router } from 'express';
import { TeamController } from '../controllers/teamController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────
// READ routes: Any authenticated organizer (Admin, Auctioneer, Volunteer)
// ─────────────────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireRole('Admin', 'Auctioneer', 'Volunteer'), TeamController.getTeams);
router.get('/:teamId', authenticateToken, requireRole('Admin', 'Auctioneer', 'Volunteer'), TeamController.getTeamById);
router.get('/:teamId/members', authenticateToken, requireRole('Admin', 'Auctioneer', 'Volunteer'), TeamController.getTeamMembers);

// ─────────────────────────────────────────────────────────────────────
// CHECK-IN: Auctioneer & Admin can check teams in (Volunteers are read-only)
// ─────────────────────────────────────────────────────────────────────
router.patch('/:teamId/check-in', authenticateToken, requireRole('Admin', 'Auctioneer'), TeamController.updateCheckInStatus);

// ─────────────────────────────────────────────────────────────────────
// WRITE routes: Admin only for destructive operations
// ─────────────────────────────────────────────────────────────────────
router.post('/', authenticateToken, requireRole('Admin'), TeamController.createTeam);
router.patch('/:teamId/status', authenticateToken, requireRole('Admin'), TeamController.updateRegistrationStatus);
router.put('/:teamId', authenticateToken, requireRole('Admin'), TeamController.updateTeam);
router.delete('/:teamId', authenticateToken, requireRole('Admin'), TeamController.deleteTeam);

export default router;
