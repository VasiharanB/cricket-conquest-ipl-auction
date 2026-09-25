import { Router } from 'express';
import { ParticipantController } from '../controllers/participantController.js';
import { authenticateParticipant } from '../middleware/participantAuth.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public Contestant Auth
router.post('/login', ParticipantController.login);

// Contestant Protected Routes
router.get('/me', authenticateParticipant, ParticipantController.getMe);
router.post('/ping', authenticateParticipant, ParticipantController.ping);
router.post('/request-help', authenticateParticipant, ParticipantController.requestHelp);
router.post('/bid', authenticateParticipant, ParticipantController.placeSelfBid);

// Helper & Admin Watchdog Routes
router.get('/watchdog', authenticateToken, requireRole('Admin', 'Volunteer', 'Auctioneer'), ParticipantController.getWatchdogData);
router.post('/resolve-help/:teamId', authenticateToken, requireRole('Admin', 'Volunteer', 'Auctioneer'), ParticipantController.resolveHelp);

export default router;
