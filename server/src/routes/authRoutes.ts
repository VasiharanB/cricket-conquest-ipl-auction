import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { UserManagementController } from '../controllers/userManagementController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────
router.post('/login', AuthController.login);

// ── Authenticated ────────────────────────────────────────────────────
router.get('/me', authenticateToken, AuthController.getMe);

// ── User Management: Admin only ──────────────────────────────────────
router.get('/users', authenticateToken, requireRole('Admin'), UserManagementController.listUsers);
router.post('/users', authenticateToken, requireRole('Admin'), UserManagementController.createUser);
router.patch('/users/:id/role', authenticateToken, requireRole('Admin'), UserManagementController.updateRole);
router.patch('/users/:id/status', authenticateToken, requireRole('Admin'), UserManagementController.toggleStatus);
router.patch('/users/:id/reset-password', authenticateToken, requireRole('Admin'), UserManagementController.resetPassword);
router.delete('/users/:id', authenticateToken, requireRole('Admin'), UserManagementController.deleteUser);

export default router;
