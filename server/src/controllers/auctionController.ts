import { Request, Response, NextFunction } from 'express';
import { AuctionSessionService } from '../services/auctionSessionService.js';
import { BiddingService } from '../services/biddingService.js';
import { AuctionTransactionService } from '../services/auctionTransactionService.js';
import { AuctionAnalyticsService } from '../services/auctionAnalyticsService.js';

export class AuctionController {
  static async getState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
      const state = await AuctionSessionService.getAuctionState(sessionId);
      res.json({ success: true, data: state });
    } catch (error) {
      next(error);
    }
  }

  static async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const state = await AuctionSessionService.startAuction(sessionId);
      res.json({ success: true, message: 'Auction started', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async pause(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const state = await AuctionSessionService.pauseAuction(sessionId);
      res.json({ success: true, message: 'Auction paused', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async resume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const state = await AuctionSessionService.resumeAuction(sessionId);
      res.json({ success: true, message: 'Auction resumed', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async setStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const { stage } = req.body;
      const state = await AuctionSessionService.setStageState(sessionId, stage);
      res.json({ success: true, data: state });
    } catch (error) {
      next(error);
    }
  }

  static async nextPlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const state = await AuctionSessionService.nextPlayer(sessionId);
      res.json({ success: true, message: 'Advanced to next player', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async placeBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const { teamId, bidAmount } = req.body;
      const state = await BiddingService.placeBid({ sessionId, teamId, bidAmount: Number(bidAmount) });
      res.json({ success: true, message: 'Bid accepted', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async sell(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const state = await AuctionTransactionService.sellCurrentPlayer(sessionId);
      res.json({ success: true, message: 'Player sold successfully', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async unsold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const state = await AuctionTransactionService.markCurrentPlayerUnsold(sessionId);
      res.json({ success: true, message: 'Player marked as unsold', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async undo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const state = await AuctionTransactionService.undoLastSale(sessionId);
      res.json({ success: true, message: 'Last sale successfully undone', data: state });
    } catch (error) {
      next(error);
    }
  }

  static async setTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const { seconds } = req.body;
      await AuctionSessionService.setTimer(sessionId, Number(seconds));
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, limit } = req.query;
      const history = await AuctionAnalyticsService.getHistory({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  static async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await AuctionAnalyticsService.getResults();
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  static async publishResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId ? Number(req.body.sessionId) : await AuctionSessionService.getOrCreateActiveSession();
      const results = await AuctionAnalyticsService.publishResults(sessionId);
      res.json({ success: true, message: 'Official results published successfully! Winner declared.', data: results });
    } catch (error) {
      next(error);
    }
  }
}
