import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { ParticipantUser } from '../services/participantService.js';

export function authenticateParticipant(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Contestant authentication required.',
    });
    return;
  }

  const secret = process.env.JWT_SECRET || 'zentrix26_cricket_conquest_super_secure_jwt_secret_key_2026';

  jwt.verify(token, secret, (err, decoded: any) => {
    if (err || !decoded || decoded.role !== 'Participant') {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired participant session. Please log in again.',
      });
      return;
    }

    (req as any).participant = decoded as ParticipantUser;
    next();
  });
}
