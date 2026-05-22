import { NextResponse } from 'next/server';
import {
  BRAZE_API_CATALOG,
  BRAZE_API_CATEGORIES,
  DEFAULT_BRAZE_REST_ENDPOINT,
} from '@/lib/admin/braze-api-catalog';

/** Braze REST API catalog for admin tester (static metadata, no secrets). */
export async function GET() {
  return NextResponse.json({
    provider: 'braze',
    defaultEndpoint: DEFAULT_BRAZE_REST_ENDPOINT,
    categories: BRAZE_API_CATEGORIES,
    catalog: BRAZE_API_CATALOG,
    count: BRAZE_API_CATALOG.length,
  });
}
