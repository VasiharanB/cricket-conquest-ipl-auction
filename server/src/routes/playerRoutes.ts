import { Router } from 'express';
import { PlayerController } from '../controllers/playerController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────
// READ routes: Any authenticated organizer (Admin, Auctioneer, Volunteer)
// ─────────────────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireRole('Admin', 'Auctioneer', 'Volunteer'), PlayerController.getPlayers);
router.get('/:playerId', authenticateToken, requireRole('Admin', 'Auctioneer', 'Volunteer'), PlayerController.getPlayerById);

// ─────────────────────────────────────────────────────────────────────
// WRITE routes: Admin & Auctioneer can manage player data; Admin deletes
// ─────────────────────────────────────────────────────────────────────
router.post('/import', authenticateToken, requireRole('Admin', 'Auctioneer'), PlayerController.importPlayers);
router.post('/bulk-delete', authenticateToken, requireRole('Admin'), PlayerController.bulkDeletePlayers);
router.delete('/all', authenticateToken, requireRole('Admin'), PlayerController.deleteAllPlayers);
router.put('/:playerId', authenticateToken, requireRole('Admin', 'Auctioneer'), PlayerController.updatePlayer);
router.delete('/:playerId', authenticateToken, requireRole('Admin'), PlayerController.deletePlayer);

export default router;
