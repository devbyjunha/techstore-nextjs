#!/usr/bin/env node
/**
 * Scenario 2 — Legacy coupon migration (Management API Import coupons)
 *
 * Simulates: Go-live 전에 기존 쇼핑몰 쿠폰 코드를 CSV로 Talon에 적재.
 * (Dashboard UI Import와 동일 데이터를 API로 넣는 경로)
 *
 * Usage:
 *   npm run talon:import-coupons
 *   npm run talon:import-coupons -- ./scripts/talon-management/sample-legacy-coupons.csv
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  campaignCouponsPath,
  getManagementConfig,
  managementFetch,
  printJson,
} from './lib.mjs';

async function main() {
  const csvArg =
    process.argv[2] && !process.argv[2].startsWith('--')
      ? process.argv[2]
      : new URL('./sample-legacy-coupons.csv', import.meta.url).pathname;

  const csvPath = resolve(csvArg);
  const { applicationId, campaignId } = getManagementConfig();
  const csvBuffer = await readFile(csvPath);

  console.log('Importing coupons via Management API...');
  console.log(`  applicationId=${applicationId} campaignId=${campaignId}`);
  console.log(`  file=${csvPath}`);

  const form = new FormData();
  form.append(
    'file',
    new Blob([csvBuffer], { type: 'text/csv' }),
    csvPath.split('/').pop() || 'coupons.csv'
  );

  const { status, data } = await managementFetch(
    campaignCouponsPath('/import_coupons'),
    {
      method: 'POST',
      body: form,
      // Let fetch set multipart boundary — do not set Content-Type manually
    }
  );

  printJson(`HTTP ${status}`, data);

  console.log('\nNext steps:');
  console.log(`  1. Dashboard → Campaign ${campaignId} → Coupons 에서 방금 Import한 코드 확인`);
  console.log('  2. TechStore 장바구니에 예: MAPI-OPEN-OK 적용 (Integration API)');
  console.log(
    '  3. (선택) 이미 사용된 레거시 코드는 Integration closed session으로 redeemed 마킹'
  );
}

main().catch((err) => {
  console.error('\nImport coupons failed:', err.message);
  if (err.body) printJson('Error body', err.body);
  process.exit(1);
});
