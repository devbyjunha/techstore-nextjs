import type { ApiEndpointDefinition } from './api-tester-types';

function ep(
  id: string,
  category: string,
  name: string,
  method: ApiEndpointDefinition['method'],
  path: string,
  description: string,
  sampleBody?: Record<string, unknown>,
  sampleQuery?: Record<string, string>
): ApiEndpointDefinition {
  return { id, category, name, method, path, description, sampleBody, sampleQuery };
}

/** Amplitude HTTP API catalog. */
export const AMPLITUDE_API_CATALOG: ApiEndpointDefinition[] = [
  // Event Ingestion (US)
  ep('httpapi.v2', 'Event Ingestion (US)', 'HTTP V2 - Send Events', 'POST', '/2/httpapi', 'Send events to Amplitude (US). Include api_key in body.', {
    api_key: 'YOUR_API_KEY',
    events: [
      {
        user_id: 'user_12345',
        event_type: 'api_test_event',
        time: Date.now(),
        event_properties: { source: 'admin_tester' },
      },
    ],
  }),
  ep('identify', 'Event Ingestion (US)', 'Identify API', 'POST', '/identify', 'Set user properties without sending an event.', {
    api_key: 'YOUR_API_KEY',
    identification: JSON.stringify({
      user_id: 'user_12345',
      user_properties: { plan: 'premium' },
    }),
  }),
  ep('batch', 'Event Ingestion (US)', 'Batch Event Upload', 'POST', '/batch', 'Upload large batches of events.', {
    api_key: 'YOUR_API_KEY',
    events: [
      {
        user_id: 'user_12345',
        event_type: 'batch_test_event',
        time: Date.now(),
      },
    ],
  }),
  ep('httpapi.legacy', 'Event Ingestion (US)', 'HTTP API (Legacy)', 'POST', '/httpapi', 'Legacy HTTP API endpoint.', {
    api_key: 'YOUR_API_KEY',
    event: {
      user_id: 'user_12345',
      event_type: 'legacy_test_event',
    },
  }),

  // Event Ingestion (EU)
  ep('httpapi.v2.eu', 'Event Ingestion (EU)', 'HTTP V2 - Send Events (EU)', 'POST', '/2/httpapi', 'Send events to Amplitude (EU residency).', {
    api_key: 'YOUR_API_KEY',
    events: [
      {
        user_id: 'user_12345',
        event_type: 'api_test_event',
        time: Date.now(),
      },
    ],
  }),
  ep('identify.eu', 'Event Ingestion (EU)', 'Identify API (EU)', 'POST', '/identify', 'Identify API for EU projects.', {
    api_key: 'YOUR_API_KEY',
    identification: JSON.stringify({ user_id: 'user_12345', user_properties: {} }),
  }),
  ep('batch.eu', 'Event Ingestion (EU)', 'Batch Upload (EU)', 'POST', '/batch', 'Batch upload for EU projects.', {
    api_key: 'YOUR_API_KEY',
    events: [{ user_id: 'user_12345', event_type: 'batch_test', time: Date.now() }],
  }),

  // Special event types
  ep('revenue', 'Revenue', 'Revenue Event (via HTTP V2)', 'POST', '/2/httpapi', 'Send revenue event.', {
    api_key: 'YOUR_API_KEY',
    events: [
      {
        user_id: 'user_12345',
        event_type: 'revenue_event',
        time: Date.now(),
        price: 29.99,
        quantity: 1,
        revenue: 29.99,
        productId: 'sku_001',
        revenueType: 'purchase',
      },
    ],
  }),
  ep('identify.event', 'User Properties', '$identify Event', 'POST', '/2/httpapi', 'Update user properties via $identify.', {
    api_key: 'YOUR_API_KEY',
    events: [
      {
        user_id: 'user_12345',
        event_type: '$identify',
        user_properties: { $set: { email: 'user@example.com', plan: 'pro' } },
      },
    ],
  }),
  ep('groupidentify', 'Groups', '$groupidentify Event', 'POST', '/2/httpapi', 'Update group properties.', {
    api_key: 'YOUR_API_KEY',
    events: [
      {
        user_id: 'user_12345',
        event_type: '$groupidentify',
        groups: { org_id: 'org_123' },
        group_properties: { $set: { org_name: 'Acme Inc' } },
      },
    ],
  }),

  // Export API (different host — use full URL in endpoint field)
  ep('export', 'Export', 'Export Events', 'GET', '/api/2/export', 'Export raw event data. Use base URL https://amplitude.com', undefined, {
    start: '20240101T00',
    end: '20240102T00',
  }),
  ep('export.eu', 'Export', 'Export Events (EU)', 'GET', '/api/2/export', 'EU export. Use base URL https://analytics.eu.amplitude.com', undefined, {
    start: '20240101T00',
    end: '20240102T00',
  }),

  // Dashboard REST API
  ep('dashboard.active_users', 'Dashboard REST', 'Active Users', 'GET', '/api/2/users', 'Dashboard API - active users. Use https://amplitude.com as base.', undefined, {
    start: '20240101',
    end: '20240107',
    m: 'active',
  }),
  ep('dashboard.event_segmentation', 'Dashboard REST', 'Event Segmentation', 'GET', '/api/2/events/segmentation', 'Event segmentation query.', undefined, {
    e: JSON.stringify({ event_type: 'api_test_event' }),
    start: '20240101',
    end: '20240107',
  }),
  ep('dashboard.funnels', 'Dashboard REST', 'Funnel Analysis', 'GET', '/api/2/funnels', 'Funnel analysis.', undefined, {
    start: '20240101',
    end: '20240107',
  }),
  ep('dashboard.retention', 'Dashboard REST', 'Retention Analysis', 'GET', '/api/2/retention', 'Retention analysis.', undefined, {
    start: '20240101',
    end: '20240107',
  }),

  // User Profile API
  ep('userprofile', 'User Profile', 'User Profile Lookup', 'GET', '/api/2/userprofile', 'Look up user profile. Use https://profile-api.amplitude.com', undefined, {
    user_id: 'user_12345',
    get_amp_id: 'true',
  }),

  // Taxonomy API
  ep('taxonomy.events', 'Taxonomy', 'List Events', 'GET', '/api/2/taxonomy/event', 'List event types in taxonomy.', undefined, {}),
  ep('taxonomy.event_props', 'Taxonomy', 'List Event Properties', 'GET', '/api/2/taxonomy/event-property', 'List event properties.', undefined, {
    event_type: 'api_test_event',
  }),
  ep('taxonomy.user_props', 'Taxonomy', 'List User Properties', 'GET', '/api/2/taxonomy/user-property', 'List user properties.', undefined, {}),

  // Behavioral Cohorts
  ep('cohorts.list', 'Behavioral Cohorts', 'List Cohorts', 'GET', '/api/3/cohorts', 'List behavioral cohorts.', undefined, {}),
  ep('cohorts.get', 'Behavioral Cohorts', 'Get Cohort', 'GET', '/api/3/cohorts/{cohort_id}', 'Get cohort by ID.', undefined, {}),

  // Attribution API
  ep('attribution', 'Attribution', 'Attribution Report', 'GET', '/api/2/attribution', 'Attribution report.', undefined, {
    start: '20240101',
    end: '20240107',
  }),

  // User Privacy API
  ep('privacy.delete', 'User Privacy', 'Delete User Data', 'POST', '/api/2/deletions/users', 'Request user data deletion.', {
    user_ids: ['user_12345'],
    ignore_invalid_id: 'true',
    delete_from_org: 'false',
    requester: 'admin@example.com',
  }),
  ep('privacy.status', 'User Privacy', 'Deletion Request Status', 'GET', '/api/2/deletions/users', 'Check deletion status.', undefined, {
    request_id: 'request_id_here',
  }),
];

export const AMPLITUDE_API_CATEGORIES = [
  ...new Set(AMPLITUDE_API_CATALOG.map((e) => e.category)),
];

export function getAmplitudeEndpointById(id: string): ApiEndpointDefinition | undefined {
  return AMPLITUDE_API_CATALOG.find((e) => e.id === id);
}

export const AMPLITUDE_BASE_URL_OPTIONS = [
  { label: 'US - api2.amplitude.com (Ingestion)', value: 'https://api2.amplitude.com' },
  { label: 'EU - api.eu.amplitude.com (Ingestion)', value: 'https://api.eu.amplitude.com' },
  { label: 'US - amplitude.com (Export/Dashboard)', value: 'https://amplitude.com' },
  { label: 'EU - analytics.eu.amplitude.com (Export)', value: 'https://analytics.eu.amplitude.com' },
  { label: 'User Profile API', value: 'https://profile-api.amplitude.com' },
];

export const DEFAULT_AMPLITUDE_ENDPOINT = 'https://api2.amplitude.com';
