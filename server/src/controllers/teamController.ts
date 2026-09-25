import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/teamService.js';

export class TeamController {
  static async getTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, checkIn } = req.query;

      const result = await TeamService.getTeams({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        checkIn: checkIn ? String(checkIn) : undefined,
      });

      res.json({
        success: true,
        data: result.teams,
        stats: result.stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = String(req.params.teamId || '');
      const team = await TeamService.getTeamById(teamId);

      if (!team) {
        res.status(404).json({
          success: false,
          message: `Team '${teamId}' not found`,
        });
        return;
      }

      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = String(req.params.teamId || '');
      const members = await TeamService.getTeamMembers(teamId);

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const team = await TeamService.createTeam(req.body);

      res.status(201).json({
        success: true,
        message: `Team '${team.team_name}' registered successfully with ID ${team.team_id}`,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRegistrationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = String(req.params.teamId || '');
      const { status } = req.body;

      const updated = await TeamService.updateRegistrationStatus(teamId, status);

      res.json({
        success: true,
        message: `Registration status updated to ${updated.registration_status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCheckInStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = String(req.params.teamId || '');
      const checkInStatus = req.body.checkInStatus || req.body.status;

      const updated = await TeamService.updateCheckInStatus(teamId, checkInStatus);

      res.json({
        success: true,
        message: `Check-in status updated to ${updated.check_in_status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = String(req.params.teamId || '');
      const updated = await TeamService.updateTeam(teamId, req.body);

      res.json({
        success: true,
        message: `Team '${updated.team_name}' updated successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = String(req.params.teamId || '');
      await TeamService.deleteTeam(teamId);

      res.json({
        success: true,
        message: `Team '${teamId}' deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamSquad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = String(req.params.teamId || '');
      const squad = await TeamService.getTeamSquad(teamId);
      res.json({ success: true, data: squad });
    } catch (error) {
      next(error);
    }
  }
}
