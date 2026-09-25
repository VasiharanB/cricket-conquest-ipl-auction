import { Request, Response, NextFunction } from 'express';
import { UserManagementService } from '../services/userManagementService.js';

export class UserManagementController {
  /** GET /api/auth/users — List all organizer accounts (Admin only) */
  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserManagementService.listUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/auth/users — Create a new organizer account (Admin only) */
  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, role } = req.body;
      const user = await UserManagementService.createUser({ username, email, password, role });
      res.status(201).json({ success: true, message: `Organizer '${user.username}' created successfully.`, data: user });
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/auth/users/:id/role — Change role of an organizer (Admin only) */
  static async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.id);
      const { role } = req.body;
      const user = await UserManagementService.updateRole(userId, role);
      res.json({ success: true, message: `Role updated to '${role}' for user '${user.username}'.`, data: user });
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/auth/users/:id/status — Toggle active/inactive (Admin only) */
  static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (req.user?.id === userId) {
        res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
        return;
      }
      const user = await UserManagementService.toggleStatus(userId);
      res.json({ success: true, message: `Account '${user.username}' is now ${user.is_active ? 'Active' : 'Inactive'}.`, data: user });
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/auth/users/:id/reset-password — Admin resets a user's password */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.id);
      const { newPassword } = req.body;
      await UserManagementService.resetPassword(userId, newPassword);
      res.json({ success: true, message: 'Password reset successfully.' });
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/auth/users/:id — Delete an organizer account (Admin only) */
  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (req.user?.id === userId) {
        res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
        return;
      }
      await UserManagementService.deleteUser(userId);
      res.json({ success: true, message: 'Organizer account deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
