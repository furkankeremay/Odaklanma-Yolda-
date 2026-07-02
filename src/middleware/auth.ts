import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'yoldas-default-jwt-secret-key-12345';

export interface AuthRequest extends Request {
  user?: any;
}

export function generateToken(uid: string): string {
  const payload = JSON.stringify({ uid, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }); // 30 days
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

export function verifyToken(token: string): { uid: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) return null;
    return { uid: payload.uid };
  } catch (e) {
    return null;
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme başarısız: Token eksik!' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // 1. Try our lightweight custom signature verification first
    const customUser = verifyToken(token);
    if (customUser) {
      req.user = customUser;
      return next();
    }

    // 2. Fallback to Firebase Auth verify ID Token
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Error verifying ID token:', error);
    return res.status(401).json({ error: 'Yetkilendirme başarısız: Geçersiz Token!' });
  }
};
