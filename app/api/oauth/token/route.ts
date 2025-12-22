import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  clientApplications,
  clientSecrets,
  grantedPermissions,
  applicationDefinedScopes,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Token expiry in seconds (10 minutes)
const TOKEN_EXPIRY = 600;

/**
 * POST /api/oauth/token
 * Implements OAuth2 client credentials flow for machine-to-machine authentication.
 * Accepts application/x-www-form-urlencoded or application/json.
 *
 * Request body:
 * {
 *   "grant_type": "client_credentials",
 *   "client_id": "...",
 *   "client_secret": "..."
 * }
 *
 * Response:
 * {
 *   "access_token": "...",
 *   "token_type": "Bearer",
 *   "expires_in": 600
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body (support both form and JSON)
    let client_id: string | null = null;
    let client_secret: string | null = null;
    let grant_type: string | null = null;

    const contentType = req.headers.get('content-type');

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const body = await req.text();
      const params = new URLSearchParams(body);
      client_id = params.get('client_id');
      client_secret = params.get('client_secret');
      grant_type = params.get('grant_type');
    } else {
      const body = await req.json();
      client_id = body.client_id;
      client_secret = body.client_secret;
      grant_type = body.grant_type;
    }

    // Validate grant type
    if (grant_type !== 'client_credentials') {
      return NextResponse.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only client_credentials grant type is supported',
        },
        { status: 400 },
      );
    }

    // Validate required parameters
    if (!client_id || !client_secret) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'client_id and client_secret are required',
        },
        { status: 400 },
      );
    }

    // Fetch client application with secrets and granted permissions
    const app = await db.query.clientApplications.findFirst({
      where: eq(clientApplications.clientId, client_id),
      with: {
        secrets: {
          where: eq(clientSecrets.active, true),
        },
      },
    });

    if (!app) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: 'Client not found or inactive',
        },
        { status: 401 },
      );
    }

    // Validate secret
    const secretHash = crypto.createHash('sha256').update(client_secret).digest('hex');
    const validSecret = app.secrets.find((s) => s.secretHash === secretHash && s.active);

    if (!validSecret) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        },
        { status: 401 },
      );
    }

    // Update last used timestamp
    await db
      .update(clientSecrets)
      .set({ lastUsedAt: new Date() })
      .where(eq(clientSecrets.id, validSecret.id));

    // Fetch granted permissions for this application
    const permissions = await db.query.grantedPermissions.findMany({
      where: eq(grantedPermissions.grantedToApplicationId, app.id),
      with: {
        definedScope: {
          with: {
            application: true,
          },
        },
      },
    });

    // Group scopes by the application that defined them (targetApplication)
    // NOTE: we use the target application's public `clientId` here (permission.definedScope.application.clientId)
    // so that the generated token's `aud` and scope prefixes are the stable public identifiers that other
    // services will check against (rather than the internal DB id).
    const scopesByTarget = permissions.reduce(
      (acc, permission) => {
        const targetAppId = permission.definedScope.application.clientId;
        const scopeName = permission.definedScope.scope;
        if (!acc[targetAppId]) {
          acc[targetAppId] = [];
        }
        acc[targetAppId].push(scopeName);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    // Generate JWT access token
    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.error('NEXTAUTH_SECRET is not set');
      return NextResponse.json(
        { error: 'server_error', error_description: 'Token generation failed' },
        { status: 500 },
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + TOKEN_EXPIRY;

    const accessToken = jwt.sign(
      {
        sub: app.clientId,
        aud: Object.keys(scopesByTarget), // Audience is list of target applications
        scope: Object.entries(scopesByTarget)
          .map(([target, scopes]) => scopes.map((s) => `${target}:${s}`).join(' '))
          .join(' '),
        iat: now,
        exp: expiresAt,
        type: 'client_credentials',
      },
      jwtSecret,
      { algorithm: 'HS256' },
    );

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: TOKEN_EXPIRY,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in token endpoint:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'An error occurred during token generation' },
      { status: 500 },
    );
  }
}

// GET: Return 405 Method Not Allowed
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: 'invalid_request', error_description: 'Use POST to request tokens' },
    { status: 405 },
  );
}
