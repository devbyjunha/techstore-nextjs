import {
  parseLegacyMemberCsv,
  parseSampleLegacyMembers,
  parseSampleTierChange,
  SAMPLE_LEGACY_MEMBERS_CSV,
  SOURCE_PII_COLUMNS,
  toTalonProfileUpsert,
} from '../profile-migration';

describe('profile migration mapper', () => {
  it('keeps profileId + MembershipTier and drops source PII columns', () => {
    const result = parseSampleLegacyMembers();

    expect(result.errors).toEqual([]);
    expect(result.droppedColumns).toEqual(
      expect.arrayContaining([...SOURCE_PII_COLUMNS])
    );

    const gold = result.payloads.find((p) => p.integrationId === 'mig_gold_001');
    expect(gold).toEqual({
      integrationId: 'mig_gold_001',
      attributes: { MembershipTier: 'GOLD' },
    });

    const serialized = JSON.stringify(result.payloads);
    for (const pii of ['@example.com', 'PoC Gold Member', 'REDACTED']) {
      expect(serialized).not.toContain(pii);
    }
  });

  it('omits MembershipTier when the source grade is empty', () => {
    const result = parseSampleLegacyMembers();
    const none = result.payloads.find((p) => p.integrationId === 'mig_none_001');
    expect(none).toEqual({
      integrationId: 'mig_none_001',
      attributes: {},
    });
  });

  it('includes coupon-recipient ids used by the legacy coupon CSV', () => {
    const ids = parseSampleLegacyMembers().payloads.map((p) => p.integrationId);
    expect(ids).toEqual(
      expect.arrayContaining(['demo_user_001', 'demo_user_002'])
    );
  });

  it('overwrites GOLD to SILVER on re-import of the same profileId', () => {
    const result = parseSampleTierChange();
    expect(result.payloads).toEqual([
      {
        integrationId: 'mig_gold_001',
        attributes: { MembershipTier: 'SILVER' },
      },
    ]);
  });

  it('rejects invalid profileId and unknown tiers', () => {
    const csv = [
      'profileId,MembershipTier,scenario,legacy_email,legacy_display_name,legacy_phone,notes',
      'ab,GOLD,S1,x@example.com,Name,REDACTED,too short',
      'mig_bad_tier,PLATINUM,S1,x@example.com,Name,REDACTED,unknown tier',
    ].join('\n');

    const result = parseLegacyMemberCsv(csv);
    expect(result.payloads).toEqual([]);
    expect(result.errors.some((e) => e.includes('invalid profileId'))).toBe(
      true
    );
    expect(result.errors.some((e) => e.includes('MembershipTier'))).toBe(true);
  });

  it('does not copy PII fields even if they sit on the row object', () => {
    const payload = toTalonProfileUpsert({
      profileId: 'mig_gold_001',
      membershipTier: 'GOLD',
      scenario: 'S1',
    });
    expect(Object.keys(payload.attributes)).toEqual(['MembershipTier']);
    expect(SAMPLE_LEGACY_MEMBERS_CSV).toContain('legacy_email');
  });
});
