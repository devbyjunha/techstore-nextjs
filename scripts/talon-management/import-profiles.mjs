#!/usr/bin/env node
/**
 * Customer profile migration (Integration API bulk upsert)
 *
 * Simulates: Go-live 전 자사 회원 추출 CSV에서 profileId + MembershipTier만
 * Talon Customer Profile로 적재. 이메일/이름/전화는 보내지 않음.
 *
 * Usage:
 *   npm run talon:import-profiles
 *   npm run talon:import-profiles -- --tier-change
 *   npm run talon:import-profiles -- ./scripts/talon-management/sample-legacy-members.csv
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ALLOWED_TIERS = new Set(['GOLD', 'SILVER']);
const PROFILE_ID_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;
const KEEP_COLUMNS = new Set(['profileId', 'MembershipTier', 'scenario', 'notes']);

function getIntegrationConfig() {
  const baseUrl = (process.env.TALON_ONE_BASE_URL ?? '').replace(/\/$/, '');
  const apiKey = process.env.TALON_ONE_API_KEY ?? '';
  const missing = [];
  if (!baseUrl) missing.push('TALON_ONE_BASE_URL');
  if (!apiKey) missing.push('TALON_ONE_API_KEY');
  if (missing.length > 0) {
    throw new Error(
      `Missing env: ${missing.join(', ')}. Copy keys into .env.local (see .env.example).`
    );
  }
  return { baseUrl, apiKey };
}

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

function parseCsv(csv) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
  if (lines.length < 2) {
    throw new Error('CSV needs a header and at least one data row');
  }

  const header = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
  const droppedColumns = header.filter((col) => !KEEP_COLUMNS.has(col));
  const colIndex = Object.fromEntries(header.map((name, i) => [name, i]));
  if (colIndex.profileId === undefined) {
    throw new Error('CSV header must include profileId');
  }

  const customerProfiles = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]).map((c) => c.replace(/^"|"$/g, '').trim());
    const profileId = cells[colIndex.profileId] ?? '';
    if (!PROFILE_ID_PATTERN.test(profileId)) {
      throw new Error(`Line ${i + 1}: invalid profileId`);
    }
    const rawTier =
      colIndex.MembershipTier !== undefined
        ? (cells[colIndex.MembershipTier] ?? '').trim().toUpperCase()
        : '';
    if (rawTier && !ALLOWED_TIERS.has(rawTier)) {
      throw new Error(`Line ${i + 1}: MembershipTier must be GOLD, SILVER, or empty`);
    }
    const attributes = {};
    if (rawTier) attributes.MembershipTier = rawTier;
    customerProfiles.push({ integrationId: profileId, attributes });
  }

  return { customerProfiles, droppedColumns };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const tierChange = args.includes('--tier-change');
  const fileArg = args.find((a) => !a.startsWith('--'));

  const defaultFile = tierChange
    ? './sample-legacy-members-tier-change.csv'
    : './sample-legacy-members.csv';
  const csvPath = resolve(
    fileArg ?? new URL(defaultFile, import.meta.url).pathname
  );

  const { baseUrl, apiKey } = getIntegrationConfig();
  const csv = await readFile(csvPath, 'utf8');
  const { customerProfiles, droppedColumns } = parseCsv(csv);

  console.log('Importing customer profiles via Integration API...');
  console.log(`  file=${csvPath}`);
  console.log(`  count=${customerProfiles.length}`);
  console.log(`  dropped source columns: ${droppedColumns.join(', ') || '(none)'}`);
  console.log(
    '  payloads:',
    JSON.stringify(customerProfiles, null, 2)
  );

  const response = await fetch(`${baseUrl}/v2/customer_profiles?silent=true`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey-v1 ${apiKey}`,
    },
    body: JSON.stringify({ customerProfiles }),
  });

  const body = await response.json().catch(() => ({}));
  console.log(`\n=== HTTP ${response.status} ===`);
  console.log(JSON.stringify(body, null, 2));

  if (!response.ok) {
    process.exit(1);
  }

  console.log('\nNext steps:');
  console.log('  1. Dashboard → Customers 에서 mig_gold_001 검색, MembershipTier=GOLD 확인');
  console.log('  2. TechStore 로그인 → “GOLD 이관 회원” (등급 미전송)');
  console.log('  3. 5만원 이상 장바구니 → C3 GOLD bonus 적용');
}

main().catch((err) => {
  console.error('\nImport profiles failed:', err.message);
  process.exit(1);
});
