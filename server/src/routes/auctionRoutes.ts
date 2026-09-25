import { Router } from 'express';
import { AuctionController } from '../controllers/auctionController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Read routes (Accessible by all connected clients and projector screens)
router.get('/state', AuctionController.getState);
router.get('/history', AuctionController.getHistory);
router.get('/results', AuctionController.getResults);

// Control routes (Restricted to Admin & Auctioneer)
router.post('/start', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.start);
router.post('/pause', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.pause);
router.post('/resume', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.resume);
router.post('/stage', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.setStage);
router.post('/next-player', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.nextPlayer);
router.post('/select-player', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.selectPlayer);
router.post('/bid', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.placeBid);
router.post('/sold', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.sell);
router.post('/unsold', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.unsold);
router.post('/undo', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.undo);
router.post('/timer', authenticateToken, requireRole('Admin', 'Auctioneer'), AuctionController.setTimer);
router.post('/publish-results', authenticateToken, requireRole('Admin'), AuctionController.publishResults);

export default router;
