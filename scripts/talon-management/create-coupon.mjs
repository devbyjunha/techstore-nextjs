#!/usr/bin/env node
/**
 * Scenario 1 — Braze-style issuance (Management API Create coupons)
 *
 * Simulates: CRM/Braze issues a new single-use code for a member,
 * without creating it manually in Campaign Manager.
 *
 * Usage:
 *   npm run talon:create-coupon
 *   npm run talon:create-coupon -- --profile=demo_user_001
 */

import {
  campaignCouponsPath,
  getManagementConfig,
  managementFetch,
  printJson,
} from './lib.mjs';

function parseArgs(argv) {
  const out = { profile: null, count: 1 };
  for (const arg of argv) {
    if (arg.startsWith('--profile=')) out.profile = arg.slice('--profile='.length);
    if (arg.startsWith('--count=')) out.count = Number(arg.slice('--count='.length)) || 1;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { applicationId, campaignId } = getManagementConfig();

  const body = {
    // Single-use codes — typical CRM issuance
    usageLimit: 1,
    numberOfCoupons: Math.min(Math.max(args.count, 1), 20),
    // Easy to spot/delete in Dashboard after PoC
    couponPattern: 'BRAZE-######',
    validCharacters: [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      'A', 'B', 'C', 'D', 'E', 'F',
    ],
  };

  // Optional: bind to a profile (personal coupon). Requires campaign support.
  if (args.profile) {
    body.couponPattern = 'BRAZE-######';
    body.numberOfCoupons = 1;
    body.recipientIntegrationId = args.profile;
  }

  console.log('Creating coupon(s) via Management API...');
  console.log(`  applicationId=${applicationId} campaignId=${campaignId}`);
  if (args.profile) console.log(`  recipientIntegrationId=${args.profile}`);

  const { status, data } = await managementFetch(campaignCouponsPath('/coupons'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  printJson(`HTTP ${status}`, data);

  const coupons = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : data?.coupon
        ? [data.coupon]
        : [];

  const codes = coupons
    .map((c) => c?.value ?? c?.Value)
    .filter(Boolean);

  if (codes.length === 0 && typeof data === 'object' && data?.value) {
    codes.push(data.value);
  }

  console.log('\nNext steps:');
  if (codes.length > 0) {
    console.log(`  1. Dashboard → Campaign ${campaignId} → Coupons 에서 코드 확인`);
    console.log(`  2. TechStore 장바구니에 아래 코드 적용 (Integration API 경로):`);
    for (const code of codes) console.log(`       ${code}`);
  } else {
    console.log('  Response shape may vary — copy `value` from JSON above into the cart.');
  }
}

main().catch((err) => {
  console.error('\nCreate coupon failed:', err.message);
  if (err.body) printJson('Error body', err.body);
  process.exit(1);
});
