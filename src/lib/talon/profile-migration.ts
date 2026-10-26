/**
 * Customer profile migration PoC.
 *
 * Talon is not a user master: we copy a stable profileId + rule attributes only.
 * Source-extract columns like email / display name / phone are stripped.
 */

export const TALON_PROFILE_ATTRIBUTE_WHITELIST = ['MembershipTier'] as const;

export type TalonProfileAttributeName =
  (typeof TALON_PROFILE_ATTRIBUTE_WHITELIST)[number];

export type MembershipTierValue = 'GOLD' | 'SILVER';

export const PROFILE_ID_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;

export const SOURCE_PII_COLUMNS = [
  'legacy_email',
  'legacy_display_name',
  'legacy_phone',
] as const;

export interface LegacyMemberRow {
  profileId: string;
  membershipTier?: MembershipTierValue;
  scenario: string;
  notes?: string;
}

export interface TalonProfileUpsert {
  integrationId: string;
  attributes: Partial<Record<TalonProfileAttributeName, string>>;
}

export interface ProfileMigrationParseResult {
  rows: LegacyMemberRow[];
  payloads: TalonProfileUpsert[];
  droppedColumns: string[];
  errors: string[];
}

export interface ProfileMigrationDemoAccount {
  profileId: string;
  label: string;
  membershipTierOnTalon?: MembershipTierValue;
  scenario: string;
  /** Login must not send this — C3 should come from the migrated profile. */
  sendTierFromClient: false;
}

/** PoC accounts: login uses profileId, and does not send MembershipTier. */
export const PROFILE_MIGRATION_DEMO_ACCOUNTS: ProfileMigrationDemoAccount[] = [
  {
    profileId: 'mig_gold_001',
    label: 'GOLD 이관 회원',
    membershipTierOnTalon: 'GOLD',
    scenario: 'S1',
    sendTierFromClient: false,
  },
  {
    profileId: 'mig_silver_001',
    label: 'SILVER 이관 회원',
    membershipTierOnTalon: 'SILVER',
    scenario: 'S2',
    sendTierFromClient: false,
  },
  {
    profileId: 'mig_none_001',
    label: '등급 없음 (이관만)',
    scenario: 'S3',
    sendTierFromClient: false,
  },
];

/** Initial Go-live extract (fictional IDs only — no real PII). */
export const SAMPLE_LEGACY_MEMBERS_CSV = [
  'profileId,MembershipTier,scenario,legacy_email,legacy_display_name,legacy_phone,notes',
  'mig_gold_001,GOLD,S1_GOLD_BONUS,mig_gold_001@example.com,PoC Gold Member 001,REDACTED,C3 applies without client sending tier',
  'mig_gold_002,GOLD,S1_GOLD_BONUS,mig_gold_002@example.com,PoC Gold Member 002,REDACTED,Second GOLD profile',
  'mig_silver_001,SILVER,S2_NO_GOLD_BONUS,mig_silver_001@example.com,PoC Silver Member 001,REDACTED,C1 only — no GOLD bonus',
  'mig_silver_002,SILVER,S2_NO_GOLD_BONUS,mig_silver_002@example.com,PoC Silver Member 002,REDACTED,Second SILVER profile',
  'mig_none_001,,S3_NO_TIER,mig_none_001@example.com,PoC No Tier 001,REDACTED,Profile exists but MembershipTier omitted',
  'demo_user_001,GOLD,S5_COUPON_RECIPIENT,demo_user_001@example.com,PoC Coupon Recipient Gold,REDACTED,Matches coupon recipientintegrationid',
  'demo_user_002,SILVER,S5_COUPON_RECIPIENT,demo_user_002@example.com,PoC Coupon Recipient Silver,REDACTED,Matches coupon recipientintegrationid',
].join('\n');

/** Same profileId, new tier — proves overwrite / re-import. */
export const SAMPLE_LEGACY_MEMBERS_TIER_CHANGE_CSV = [
  'profileId,MembershipTier,scenario,legacy_email,legacy_display_name,legacy_phone,notes',
  'mig_gold_001,SILVER,S7_OVERWRITE,mig_gold_001@example.com,PoC Gold Member 001,REDACTED,Re-import GOLD user as SILVER',
].join('\n');

export function parseLegacyMemberCsv(csv: string): ProfileMigrationParseResult {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  const errors: string[] = [];
  if (lines.length < 2) {
    return {
      rows: [],
      payloads: [],
      droppedColumns: [],
      errors: ['CSV needs a header and at least one data row'],
    };
  }

  const header = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
  const droppedColumns = header.filter(
    (col) =>
      col !== 'profileId' &&
      col !== 'MembershipTier' &&
      col !== 'scenario' &&
      col !== 'notes'
  );

  const colIndex = Object.fromEntries(header.map((name, i) => [name, i]));
  if (colIndex.profileId === undefined) {
    return {
      rows: [],
      payloads: [],
      droppedColumns,
      errors: ['CSV header must include profileId'],
    };
  }

  const rows: LegacyMemberRow[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]).map((c) => c.replace(/^"|"$/g, '').trim());
    const profileId = cells[colIndex.profileId] ?? '';
    const lineNo = i + 1;

    if (!PROFILE_ID_PATTERN.test(profileId)) {
      errors.push(`Line ${lineNo}: invalid profileId`);
      continue;
    }
    if (seen.has(profileId)) {
      errors.push(`Line ${lineNo}: duplicate profileId ${profileId}`);
      continue;
    }
    seen.add(profileId);

    const rawTier =
      colIndex.MembershipTier !== undefined
        ? (cells[colIndex.MembershipTier] ?? '').trim().toUpperCase()
        : '';
    if (rawTier && rawTier !== 'GOLD' && rawTier !== 'SILVER') {
      errors.push(`Line ${lineNo}: MembershipTier must be GOLD, SILVER, or empty`);
      continue;
    }

    rows.push({
      profileId,
      membershipTier: rawTier ? (rawTier as MembershipTierValue) : undefined,
      scenario: colIndex.scenario !== undefined ? cells[colIndex.scenario] ?? '' : '',
      notes: colIndex.notes !== undefined ? cells[colIndex.notes] ?? '' : '',
    });
  }

  return {
    rows,
    payloads: rows.map(toTalonProfileUpsert),
    droppedColumns,
    errors,
  };
}

export function toTalonProfileUpsert(row: LegacyMemberRow): TalonProfileUpsert {
  const attributes: TalonProfileUpsert['attributes'] = {};
  if (row.membershipTier) {
    attributes.MembershipTier = row.membershipTier;
  }
  return {
    integrationId: row.profileId,
    attributes,
  };
}

export function parseSampleLegacyMembers(): ProfileMigrationParseResult {
  return parseLegacyMemberCsv(SAMPLE_LEGACY_MEMBERS_CSV);
}

export function parseSampleTierChange(): ProfileMigrationParseResult {
  return parseLegacyMemberCsv(SAMPLE_LEGACY_MEMBERS_TIER_CHANGE_CSV);
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
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
