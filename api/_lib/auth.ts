import crypto from 'crypto';
import type { VercelRequest } from '@vercel/node';

const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'bazmanager_secure_prod_signature_salt_2026';
  return secret.trim();
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, expectedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');

    if (computedBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuf, expectedBuf);
  } catch {
    return false;
  }
}

export interface AuthPayload {
  username: string;
  role: string;
  awardFocus?: string | null;
  iat: number;
  exp: number;
}

export function createToken(payload: { username: string; role: string; awardFocus?: string | null }): string {
  const secret = getJwtSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const fullPayload: AuthPayload = {
    ...payload,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + TOKEN_EXPIRY_MS) / 1000),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

export function verifyToken(token: string): { valid: boolean; user?: AuthPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const secret = getJwtSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuf = Buffer.from(signatureB64);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payload: AuthPayload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, user: payload };
  } catch (err: any) {
    return { valid: false, error: 'Corrupt token payload' };
  }
}

export function authenticateRequest(req: VercelRequest): { valid: boolean; user?: AuthPayload; error?: string } {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { valid: false, error: 'Invalid Authorization header format' };
  }

  return verifyToken(match[1]);
}
