/**
 * TechStore × Talon.One Store definitions.
 * Each store maps to a storeIntegrationId configured in the Talon.One dashboard.
 */

export interface TechStoreDefinition {
  /** Talon.One storeIntegrationId — immutable once created in dashboard */
  storeIntegrationId: string;
  /** Display name (matches Talon.One dashboard) */
  name: string;
  /** Channel type */
  channel: 'online' | 'offline';
  /** City / location label (offline only) */
  city?: string;
}

/** Online store — TechStore Next.js e-Commerce */
export const ONLINE_STORE: TechStoreDefinition = {
  storeIntegrationId: 'techstore-online',
  name: 'TechStore Online',
  channel: 'online',
};

/** Offline POS stores — 6 cities */
export const POS_STORES: TechStoreDefinition[] = [
  { storeIntegrationId: 'techstore-pos-seoul', name: 'TechStore 서울점', channel: 'offline', city: '서울' },
  { storeIntegrationId: 'techstore-pos-incheon', name: 'TechStore 인천점', channel: 'offline', city: '인천' },
  { storeIntegrationId: 'techstore-pos-daejeon', name: 'TechStore 대전점', channel: 'offline', city: '대전' },
  { storeIntegrationId: 'techstore-pos-daegu', name: 'TechStore 대구점', channel: 'offline', city: '대구' },
  { storeIntegrationId: 'techstore-pos-busan', name: 'TechStore 부산점', channel: 'offline', city: '부산' },
  { storeIntegrationId: 'techstore-pos-gwangju', name: 'TechStore 광주점', channel: 'offline', city: '광주' },
];

/** All stores (online + offline) */
export const ALL_STORES: TechStoreDefinition[] = [ONLINE_STORE, ...POS_STORES];

/** Lookup by storeIntegrationId */
export function findStoreById(storeIntegrationId: string): TechStoreDefinition | undefined {
  return ALL_STORES.find((s) => s.storeIntegrationId === storeIntegrationId);
}

/** Default offline store for POS simulator */
export const DEFAULT_POS_STORE = POS_STORES[0]; // 서울점
