import { Request, Response, NextFunction } from 'express';
import { PlayerService } from '../services/playerService.js';

export class PlayerController {
  static async getPlayers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, role, nationality, status } = req.query;

      const result = await PlayerService.getPlayers({
        page: page ? Number(page) : undefined,
        limit: limit !== undefined ? Number(limit) : 20,
        search: search ? String(search) : undefined,
        role: role ? String(role) : undefined,
        nationality: nationality ? String(nationality) : undefined,
        status: status ? String(status) : undefined,
      });

      res.json({
        success: true,
        data: result.players,
        pagination: result.pagination,
        stats: result.stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPlayerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playerId = String(req.params.playerId || '');
      const player = await PlayerService.getPlayerById(playerId);

      if (!player) {
        res.status(404).json({
          success: false,
          message: `Player with ID '${playerId}' not found`,
        });
        return;
      }

      res.json({
        success: true,
        data: player,
      });
    } catch (error) {
      next(error);
    }
  }

  static async importPlayers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { players, onDuplicate } = req.body;

      if (!Array.isArray(players)) {
        res.status(400).json({
          success: false,
          message: 'Expected "players" to be an array of player objects',
        });
        return;
      }

      const result = await PlayerService.importPlayers(players, onDuplicate || 'skip');

      res.json({
        success: true,
        total: result.total,
        inserted: result.inserted,
        skipped: result.skipped,
        failed: result.failed,
        errors: result.errors,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playerId = String(req.params.playerId || '');
      const updated = await PlayerService.updatePlayer(playerId, req.body);

      res.json({
        success: true,
        message: `Player '${playerId}' updated successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playerId = String(req.params.playerId || '');
      await PlayerService.deletePlayer(playerId);

      res.json({
        success: true,
        message: `Player '${playerId}' deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}
