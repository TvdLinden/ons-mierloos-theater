import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@ons-mierloos-theater/shared/db';
import { clientApplications } from '@ons-mierloos-theater/shared/db/schema';
import { eq } from 'drizzle-orm';

export interface ClientCredentialsToken {
  sub: string; // clientId
  aud: string[] | string; // target application ids (some tokens may encode aud as a single string)
  scope: string; // space-separated scopes with target: "appId:scope1 appId:scope2"
  iat: number;
  exp: number;
  type: 'client_credentials';
}

/**
 * Validates a JWT access token from the Authorization header.
 * Returns decoded token if valid, null if invalid or missing.
 */
export async function validateClientToken(
  req: NextRequest,
): Promise<ClientCredentialsToken | null> {
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
      const tokenObj = decoded as ClientCredentialsToken & Record<string, any>;

      // Normalize sub: some tokens may use the DB id (client_application.id) instead of the public clientId.
      // If so, attempt to resolve the DB id to the canonical clientId stored in the DB and replace it.
      try {
        const subValue = String(tokenObj.sub);
        // If sub looks like a UUID (simple heuristic) or if there's no client with clientId === subValue,
        // attempt to find a client by id and normalize.
        const looksLikeUuid =
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            subValue,
          );

        let clientRecord = null;
        if (looksLikeUuid) {
          clientRecord = await db.query.clientApplications.findFirst({
            where: eq(clientApplications.id, subValue),
          });
        }

        if (!clientRecord) {
          // Also try matching by clientId in case sub already contains the clientId
          clientRecord = await db.query.clientApplications.findFirst({
            where: eq(clientApplications.clientId, subValue),
          });
        }

        if (clientRecord) {
          // Normalize sub to the public clientId so downstream code can rely on that value
          tokenObj.sub = clientRecord.clientId;
        }
      } catch (err) {
        // Ignore DB normalization errors and return the decoded token as-is
        console.error('Error normalizing token.sub:', err);
      }

      // Optionally enforce that the token was intended for this application
      // (APP_ID environment variable should contain this app's clientId; default 'self' disables enforcement)
      try {
        const appId = process.env.APP_ID || 'self';
        if (appId && appId !== 'self') {
          // Use isAuthorizedForTarget to validate aud/sub against this app's id
          if (!isAuthorizedForTarget(tokenObj as ClientCredentialsToken, appId)) {
            console.error('Token not authorized for this application (APP_ID mismatch)');
            return null;
          }
        }
      } catch (err) {
        console.error('Error validating token audience:', err);
      }

      return tokenObj as ClientCredentialsToken;
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
  // Support aud as array or single string. Also allow token `sub` (the clientId)
  const aud = token.aud;
  if (Array.isArray(aud)) {
    if (aud.includes(targetApplicationId)) return true;
  } else if (typeof aud === 'string' && aud === targetApplicationId) {
    return true;
  }

  // As a fallback, allow tokens that list the client (sub) as audience to access their own resources
  if (token.sub === targetApplicationId) return true;

  return false;
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
