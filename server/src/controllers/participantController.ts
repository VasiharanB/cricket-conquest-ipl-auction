import { Request, Response, NextFunction } from 'express';
import { ParticipantService } from '../services/participantService.js';
import { BiddingService } from '../services/biddingService.js';
import { AuctionSessionService } from '../services/auctionSessionService.js';

export class ParticipantController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, accessCode } = req.body;
      const result = await ParticipantService.login(identifier, accessCode);
      res.json({
        success: true,
        message: `Welcome, Team ${result.team.teamName}!`,
        token: result.token,
        team: result.team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamDbId = (req as any).participant?.id || req.user?.id;
      if (!teamDbId) {
        res.status(401).json({ success: false, message: 'Unauthenticated team' });
        return;
      }
      const profile = await ParticipantService.getProfile(teamDbId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async ping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamDbId = (req as any).participant?.id;
      const { page } = req.body;
      if (teamDbId) {
        await ParticipantService.ping(teamDbId, page);
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async requestHelp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamDbId = (req as any).participant?.id;
      const { message } = req.body;
      if (!teamDbId) {
        res.status(401).json({ success: false, message: 'Unauthenticated team' });
        return;
      }
      await ParticipantService.requestHelp(teamDbId, message);
      res.json({ success: true, message: 'Helper support requested. A volunteer will assist you.' });
    } catch (error) {
      next(error);
    }
  }

  static async placeSelfBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const team = (req as any).participant;
      if (!team) {
        res.status(401).json({ success: false, message: 'Only authenticated participants can place team bids.' });
        return;
      }

      const { bidAmount } = req.body;
      const sessionId = await AuctionSessionService.getOrCreateActiveSession();

      const state = await BiddingService.placeBid({
        sessionId,
        teamId: team.id, // Authenticated team's own ID!
        bidAmount: Number(bidAmount),
      });

      res.json({ success: true, message: 'Bid accepted for your team!', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async getWatchdogData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ParticipantService.getWatchdogData();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async resolveHelp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamId = Number(req.params.teamId);
      await ParticipantService.resolveHelp(teamId);
      res.json({ success: true, message: 'Contestant support request marked resolved.' });
    } catch (error) {
      next(error);
    }
  }
}
