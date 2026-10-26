import { NextRequest, NextResponse } from 'next/server';
import {
  getManagementStores,
  createManagementStore,
  deleteManagementStore,
  updateManagementStore,
} from '@/lib/talon/management-client';
import { ALL_STORES } from '@/lib/talon/stores';

/**
 * GET /api/admin/talon/stores
 * List stores from Talon.One Application
 */
export async function GET() {
  const result = await getManagementStores();
  return NextResponse.json(result, {
    status: result.status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

/**
 * POST /api/admin/talon/stores
 * Supports:
 * - Single store creation: { action: 'create', name, storeIntegrationId, description }
 * - Batch sync 7 stores: { action: 'sync-all' }
 * - Update store: { action: 'update', storeId, name, description }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'sync-all') {
      const results = [];
      for (const store of ALL_STORES) {
        const res = await createManagementStore({
          name: store.name,
          storeIntegrationId: store.storeIntegrationId,
          description: store.channel === 'online' ? 'Online e-Commerce Store' : `Offline POS ${store.city || ''} Store`,
        });
        results.push({
          name: store.name,
          storeIntegrationId: store.storeIntegrationId,
          ok: res.ok,
          status: res.status,
          error: res.error,
          data: res.data,
        });
      }
      return NextResponse.json({ ok: true, results });
    }

    if (body.action === 'create') {
      const { name, storeIntegrationId, description } = body;
      if (!name || !storeIntegrationId) {
        return NextResponse.json(
          { ok: false, error: 'name and storeIntegrationId are required' },
          { status: 400 }
        );
      }
      const res = await createManagementStore({ name, storeIntegrationId, description });
      return NextResponse.json(res, { status: res.status });
    }

    if (body.action === 'update') {
      const { storeId, name, description } = body;
      if (!storeId || !name) {
        return NextResponse.json(
          { ok: false, error: 'storeId and name are required' },
          { status: 400 }
        );
      }
      const res = await updateManagementStore({ storeId, name, description });
      return NextResponse.json(res, { status: res.status });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/talon/stores?storeId=...
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ ok: false, error: 'storeId is required' }, { status: 400 });
  }

  const res = await deleteManagementStore(storeId);
  // Talon.One returns 204 No Content on successful deletion.
  // NextResponse.json cannot have 204 status (must have no body).
  // Return standard 200 with ok: true.
  if (res.ok || res.status === 204) {
    return NextResponse.json({ ok: true, storeId });
  }

  return NextResponse.json(
    { ok: false, error: res.error || 'Failed to delete store' },
    { status: res.status >= 400 ? res.status : 500 }
  );
}

