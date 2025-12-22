import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface ClientCredentialsToken {
  sub: string; // clientId
  aud: string[]; // target application ids
  scope: string; // space-separated scopes with target: "appId:scope1 appId:scope2"
  iat: number;
  exp: number;
  type: 'client_credentials';
}

/**
 * Validates a JWT access token from the Authorization header.
 * Returns decoded token if valid, null if invalid or missing.
 */
export function validateClientToken(req: NextRequest): ClientCredentialsToken | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const jwtSecret = process.env.NEXTAUTH_SECRET;

    if (!jwtSecret) {
      console.error('NEXTAUTH_SECRET is not set');
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });

    // Type guard: ensure it's a client credentials token
    if (typeof decoded === 'object' && 'type' in decoded && decoded.type === 'client_credentials') {
      return decoded as ClientCredentialsToken;
    }

    return null;
  } catch (error) {
    // Token validation failed (expired, invalid signature, etc.)
    return null;
  }
}

/**
 * Check if a token has the required scope for a specific target application.
 * Example: hasScope(token, 'app-id-123', 'sync:orders')
 */
export function hasScope(
  token: ClientCredentialsToken,
  targetApplicationId: string,
  requiredScope: string,
): boolean {
  const scopes = token.scope.split(' ');
  const requiredScopePattern = `${targetApplicationId}:${requiredScope}`;
  return scopes.includes(requiredScopePattern);
}

/**
 * Check if a token is authorized for a specific target application.
 */
export function isAuthorizedForTarget(
  token: ClientCredentialsToken,
  targetApplicationId: string,
): boolean {
  return token.aud.includes(targetApplicationId);
}

/**
 * Extract all scopes for a target application from a token.
 */
export function getScopesForTarget(
  token: ClientCredentialsToken,
  targetApplicationId: string,
): string[] {
  const scopes = token.scope.split(' ');
  const prefix = `${targetApplicationId}:`;
  return scopes.filter((s) => s.startsWith(prefix)).map((s) => s.slice(prefix.length));
}
