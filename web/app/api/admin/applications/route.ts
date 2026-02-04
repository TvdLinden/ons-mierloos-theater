import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { db } from '@ons-mierloos-theater/shared/db';
import {
  clientApplications,
  clientSecrets,
  applicationDefinedScopes,
  grantedPermissions,
} from '@ons-mierloos-theater/shared/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Helper to hash secrets
function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

// Helper to generate a secret
function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper to check admin authorization
async function checkAdminAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return false;
  }
  return true;
}

// GET: List all applications with their secrets and defined scopes
export async function GET(req: NextRequest) {
  try {
    if (!(await checkAdminAuth(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apps = await db.select().from(clientApplications);
    const secretsData = await db.select().from(clientSecrets);
    const definedScopesData = await db.select().from(applicationDefinedScopes);
    const grantedPermissionsData = await db.select().from(grantedPermissions);

    const applicationsWithDetails = apps.map((app) => ({
      ...app,
      secrets: secretsData.filter((s) => s.clientApplicationId === app.id),
      definedScopes: definedScopesData.filter((s) => s.applicationId === app.id),
      grantedPermissions: grantedPermissionsData.filter((p) => p.grantedToApplicationId === app.id),
    }));

    return NextResponse.json({
      applications: applicationsWithDetails,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new application
export async function POST(req: NextRequest) {
  try {
    if (!(await checkAdminAuth(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate a unique client ID
    const clientId = crypto.randomBytes(16).toString('hex');

    const [newApp] = await db
      .insert(clientApplications)
      .values({
        name,
        clientId,
      })
      .returning();

    // Generate an initial secret
    const secret = generateSecret();
    const secretHash = hashSecret(secret);

    const [newSecret] = await db
      .insert(clientSecrets)
      .values({
        clientApplicationId: newApp.id,
        secretHash,
        active: true,
      })
      .returning();

    return NextResponse.json(
      {
        ...newApp,
        secret, // Return the unhashed secret once for user to save
        secrets: [
          {
            ...newSecret,
            secretHash: undefined, // Don't expose hash to client
          },
        ],
        scopes: [],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update application or manage its secrets/scopes
export async function PATCH(req: NextRequest) {
  try {
    if (!(await checkAdminAuth(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId, action, ...rest } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Update application info
    if (action === 'update_info') {
      const { name } = rest;
      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      const [updated] = await db
        .update(clientApplications)
        .set({ name, updatedAt: new Date() })
        .where(eq(clientApplications.id, applicationId))
        .returning();

      return NextResponse.json(updated);
    }

    // Generate new secret for application
    if (action === 'generate_secret') {
      const secret = generateSecret();
      const secretHash = hashSecret(secret);

      const [newSecret] = await db
        .insert(clientSecrets)
        .values({
          clientApplicationId: applicationId,
          secretHash,
          active: true,
        })
        .returning();

      return NextResponse.json(
        {
          ...newSecret,
          secret, // Return the unhashed secret once for user to save
          secretHash: undefined,
        },
        { status: 201 },
      );
    }

    // Deactivate a secret
    if (action === 'deactivate_secret') {
      const { secretId } = rest;
      if (!secretId) {
        return NextResponse.json({ error: 'Secret ID is required' }, { status: 400 });
      }

      const [updated] = await db
        .update(clientSecrets)
        .set({ active: false })
        .where(eq(clientSecrets.id, secretId))
        .returning();

      return NextResponse.json(updated);
    }

    // Add scope definition to application
    if (action === 'add_defined_scope') {
      const { scope, description } = rest;
      if (!scope) {
        return NextResponse.json({ error: 'Scope name is required' }, { status: 400 });
      }

      const [newScope] = await db
        .insert(applicationDefinedScopes)
        .values({
          applicationId,
          scope,
          description: description || null,
        })
        .returning();

      return NextResponse.json(newScope, { status: 201 });
    }

    // Remove scope definition from application
    if (action === 'remove_defined_scope') {
      const { scopeId } = rest;
      if (!scopeId) {
        return NextResponse.json({ error: 'Scope ID is required' }, { status: 400 });
      }

      await db.delete(applicationDefinedScopes).where(eq(applicationDefinedScopes.id, scopeId));

      return NextResponse.json({ success: true });
    }

    // Grant permission to an application for a scope
    if (action === 'grant_permission') {
      const { definedScopeId } = rest;
      if (!definedScopeId) {
        return NextResponse.json({ error: 'Defined scope ID is required' }, { status: 400 });
      }

      const [newPermission] = await db
        .insert(grantedPermissions)
        .values({
          grantedToApplicationId: applicationId,
          definedScopeId,
        })
        .returning();

      return NextResponse.json(newPermission, { status: 201 });
    }

    // Revoke permission from an application
    if (action === 'revoke_permission') {
      const { permissionId } = rest;
      if (!permissionId) {
        return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
      }

      await db.delete(grantedPermissions).where(eq(grantedPermissions.id, permissionId));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete an application and all associated secrets/scopes
export async function DELETE(req: NextRequest) {
  try {
    if (!(await checkAdminAuth(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Delete application (secrets and scopes will cascade delete)
    await db.delete(clientApplications).where(eq(clientApplications.id, applicationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
