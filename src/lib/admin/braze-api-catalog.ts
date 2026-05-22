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

/** Braze REST API catalog (official endpoint paths). */
export const BRAZE_API_CATALOG: ApiEndpointDefinition[] = [
  // User Data
  ep('users.track', 'User Data', 'Track Users', 'POST', '/users/track', 'Record custom events, purchases, and user attributes.', {
    attributes: [{ external_id: 'user_123', email: 'user@example.com', first_name: 'Test' }],
    events: [{ external_id: 'user_123', name: 'test_event', time: new Date().toISOString(), properties: { source: 'admin_tester' } }],
  }),
  ep('users.track.sync', 'User Data', 'Track Users (Synchronous)', 'POST', '/users/track/synchronous', 'Synchronous user track.', {
    attributes: [{ external_id: 'user_123', email: 'user@example.com' }],
  }),
  ep('users.track.bulk', 'User Data', 'Track Users (Bulk)', 'POST', '/users/track/bulk', 'Bulk user track for large batches.', {
    attributes: [{ external_id: 'user_123', email: 'user@example.com' }],
  }),
  ep('users.delete', 'User Data', 'Delete User', 'POST', '/users/delete', 'Delete a user profile.', {
    external_ids: ['user_123'],
  }),
  ep('users.alias.new', 'User Data', 'Create User Alias', 'POST', '/users/alias/new', 'Create a new alias for a user.', {
    user_aliases: [{ alias_name: 'alias_1', alias_label: 'label' }],
  }),
  ep('users.alias.update', 'User Data', 'Update User Alias', 'POST', '/users/alias/update', 'Update an existing user alias.', {
    alias_updates: [{ alias_name: 'alias_1', alias_label: 'label', new_alias_name: 'alias_2' }],
  }),
  ep('users.identify', 'User Data', 'Identify User', 'POST', '/users/identify', 'Identify an alias-only user with external ID.', {
    aliases_to_identify: [{ external_id: 'user_123', user_alias: { alias_name: 'alias_1', alias_label: 'label' } }],
  }),
  ep('users.merge', 'User Data', 'Merge Users', 'POST', '/users/merge', 'Merge two user profiles.', {
    merge_updates: [{ identifier_to_merge: { external_id: 'old_user' }, identifier_to_keep: { external_id: 'user_123' } }],
  }),
  ep('users.external_ids.rename', 'User Data', 'Rename External ID', 'POST', '/users/external_ids/rename', 'Rename external ID for a user.', {
    external_id_renames: [{ current_external_id: 'old_id', new_external_id: 'user_123' }],
  }),
  ep('users.external_ids.remove', 'User Data', 'Remove Deprecated External IDs', 'POST', '/users/external_ids/remove', 'Remove deprecated external IDs.', {
    external_ids: ['deprecated_id'],
  }),
  ep('users.export.ids', 'User Data', 'Export Users by ID', 'POST', '/users/export/ids', 'Export user profiles by identifier.', {
    external_ids: ['user_123'],
    fields_to_export: ['email', 'first_name'],
  }),
  ep('users.export.segment', 'User Data', 'Export Users by Segment', 'POST', '/users/export/segment', 'Export users in a segment.', {
    segment_id: 'segment_id_here',
    fields_to_export: ['email'],
  }),
  ep('users.export.global_control_group', 'User Data', 'Export Global Control Group', 'POST', '/users/export/global_control_group', 'Export global control group users.', {
    fields_to_export: ['email'],
  }),

  // Email
  ep('email.unsubscribe', 'Email', 'Query Unsubscribed Emails', 'GET', '/email/unsubscribes', 'Query unsubscribed email addresses.', undefined, {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    limit: '100',
  }),
  ep('email.status', 'Email', 'Update Email Subscription Status', 'POST', '/email/status', 'Set email subscription state.', {
    email: 'user@example.com',
    subscription_state: 'subscribed',
  }),
  ep('email.hard_bounces', 'Email', 'List Hard Bounces', 'GET', '/email/hard_bounces', 'Query hard bounced emails.', undefined, {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
  }),
  ep('email.bounce.remove', 'Email', 'Remove Hard Bounces', 'POST', '/email/bounce/remove', 'Remove emails from hard bounce list.', {
    email: 'user@example.com',
  }),
  ep('email.spam.remove', 'Email', 'Remove Spam List', 'POST', '/email/spam/remove', 'Remove emails from spam list.', {
    email: 'user@example.com',
  }),
  ep('email.blacklist', 'Email', 'Blacklist Emails', 'POST', '/email/blacklist', 'Blocklist email addresses.', {
    email: ['spam@example.com'],
  }),

  // Messages
  ep('messages.send', 'Messages', 'Send Messages', 'POST', '/messages/send', 'Send immediate messages to users.', {
    external_user_ids: ['user_123'],
    messages: { apple_push: { alert: 'Hello from API tester' } },
  }),
  ep('messages.schedule.create', 'Messages', 'Schedule Messages', 'POST', '/messages/schedule/create', 'Schedule messages.', {
    send_id: 'send_id_here',
    recipients: { external_user_ids: ['user_123'] },
    messages: { apple_push: { alert: 'Scheduled message' } },
  }),
  ep('messages.schedule.update', 'Messages', 'Update Scheduled Messages', 'POST', '/messages/schedule/update', 'Update scheduled messages.', {
    schedule_id: 'schedule_id_here',
  }),
  ep('messages.schedule.delete', 'Messages', 'Delete Scheduled Messages', 'POST', '/messages/schedule/delete', 'Delete scheduled messages.', {
    schedule_id: 'schedule_id_here',
  }),
  ep('messages.scheduled_broadcasts', 'Messages', 'List Scheduled Broadcasts', 'GET', '/messages/scheduled_broadcasts', 'Query scheduled broadcast messages.', undefined, {
    end_time: new Date(Date.now() + 86400000).toISOString(),
  }),
  ep('messages.live_activity.update', 'Messages', 'Update Live Activity', 'POST', '/messages/live_activity/update', 'Update iOS Live Activity.', {
    push_token: 'token_here',
    activity_attributes: {},
  }),

  // Campaigns
  ep('campaigns.trigger.send', 'Campaigns', 'Trigger Campaign Send', 'POST', '/campaigns/trigger/send', 'Trigger API-triggered campaign.', {
    campaign_id: 'campaign_id_here',
    recipients: { external_user_ids: ['user_123'] },
  }),
  ep('campaigns.trigger.schedule.create', 'Campaigns', 'Schedule Triggered Campaign', 'POST', '/campaigns/trigger/schedule/create', 'Schedule triggered campaign send.', {
    campaign_id: 'campaign_id_here',
    recipients: { external_user_ids: ['user_123'] },
  }),
  ep('campaigns.trigger.schedule.update', 'Campaigns', 'Update Triggered Campaign Schedule', 'POST', '/campaigns/trigger/schedule/update', 'Update scheduled triggered campaign.', {
    schedule_id: 'schedule_id_here',
  }),
  ep('campaigns.trigger.schedule.delete', 'Campaigns', 'Delete Triggered Campaign Schedule', 'POST', '/campaigns/trigger/schedule/delete', 'Delete scheduled triggered campaign.', {
    schedule_id: 'schedule_id_here',
  }),
  ep('campaigns.list', 'Campaigns', 'List Campaigns', 'GET', '/campaigns/list', 'Export list of campaigns.', undefined, {
    page: '0',
    include_archived: 'false',
  }),
  ep('campaigns.data_series', 'Campaigns', 'Campaign Analytics', 'GET', '/campaigns/data_series', 'Campaign analytics time series.', undefined, {
    campaign_id: 'campaign_id_here',
    length: '7',
  }),
  ep('campaigns.details', 'Campaigns', 'Campaign Details', 'GET', '/campaigns/details', 'Get campaign details.', undefined, {
    campaign_id: 'campaign_id_here',
  }),
  ep('sends.data_series', 'Campaigns', 'Send Analytics', 'GET', '/sends/data_series', 'Send analytics time series.', undefined, {
    campaign_id: 'campaign_id_here',
    send_id: 'send_id_here',
    length: '7',
  }),
  ep('sends.id.create', 'Campaigns', 'Create Send ID', 'POST', '/sends/id/create', 'Create send ID for tracking.', {
    campaign_id: 'campaign_id_here',
    send_id: 'custom_send_id',
  }),
  ep('transactional.send', 'Campaigns', 'Send Transactional Message', 'POST', '/transactional/v1/campaigns/{campaign_id}/send', 'Send transactional message. Replace {campaign_id} in path.', {
    external_user_ids: ['user_123'],
    trigger_properties: {},
  }),

  // Canvas
  ep('canvas.trigger.send', 'Canvas', 'Trigger Canvas Send', 'POST', '/canvas/trigger/send', 'Trigger API-triggered Canvas.', {
    canvas_id: 'canvas_id_here',
    recipients: { external_user_ids: ['user_123'] },
  }),
  ep('canvas.trigger.schedule.create', 'Canvas', 'Schedule Triggered Canvas', 'POST', '/canvas/trigger/schedule/create', 'Schedule triggered Canvas.', {
    canvas_id: 'canvas_id_here',
    recipients: { external_user_ids: ['user_123'] },
  }),
  ep('canvas.trigger.schedule.update', 'Canvas', 'Update Triggered Canvas Schedule', 'POST', '/canvas/trigger/schedule/update', 'Update scheduled Canvas.', {
    schedule_id: 'schedule_id_here',
  }),
  ep('canvas.trigger.schedule.delete', 'Canvas', 'Delete Triggered Canvas Schedule', 'POST', '/canvas/trigger/schedule/delete', 'Delete scheduled Canvas.', {
    schedule_id: 'schedule_id_here',
  }),
  ep('canvas.list', 'Canvas', 'List Canvases', 'GET', '/canvas/list', 'Export list of Canvases.', undefined, { page: '0' }),
  ep('canvas.data_series', 'Canvas', 'Canvas Analytics', 'GET', '/canvas/data_series', 'Canvas analytics time series.', undefined, {
    canvas_id: 'canvas_id_here',
    length: '7',
  }),
  ep('canvas.details', 'Canvas', 'Canvas Details', 'GET', '/canvas/details', 'Get Canvas details.', undefined, {
    canvas_id: 'canvas_id_here',
  }),
  ep('canvas.data_summary', 'Canvas', 'Canvas Analytics Summary', 'GET', '/canvas/data_summary', 'Canvas analytics summary rollup.', undefined, {
    canvas_id: 'canvas_id_here',
    length: '7',
  }),

  // Segments
  ep('segments.list', 'Segments', 'List Segments', 'GET', '/segments/list', 'Export list of segments.', undefined, { page: '0' }),
  ep('segments.data_series', 'Segments', 'Segment Analytics', 'GET', '/segments/data_series', 'Segment size time series.', undefined, {
    segment_id: 'segment_id_here',
    length: '7',
  }),
  ep('segments.details', 'Segments', 'Segment Details', 'GET', '/segments/details', 'Get segment details.', undefined, {
    segment_id: 'segment_id_here',
  }),

  // Purchases
  ep('purchases.product_list', 'Purchases', 'Product List', 'GET', '/purchases/product_list', 'List purchased product IDs.', undefined, {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
  }),
  ep('purchases.revenue_series', 'Purchases', 'Revenue Series', 'GET', '/purchases/revenue_series', 'Revenue per day time series.', undefined, {
    length: '7',
  }),
  ep('purchases.quantity_series', 'Purchases', 'Purchase Quantity Series', 'GET', '/purchases/quantity_series', 'Purchase count per day.', undefined, {
    length: '7',
  }),

  // Custom Events
  ep('events.list', 'Custom Events', 'List Custom Events', 'GET', '/events/list', 'List custom events.', undefined, { page: '0' }),
  ep('events.data_series', 'Custom Events', 'Custom Event Analytics', 'GET', '/events/data_series', 'Custom event occurrence time series.', undefined, {
    event: 'event_name_here',
    length: '7',
  }),

  // Sessions
  ep('sessions.data_series', 'Sessions', 'Session Analytics', 'GET', '/sessions/data_series', 'Sessions per day time series.', undefined, {
    length: '7',
  }),

  // KPIs
  ep('kpi.dau.data_series', 'KPIs', 'DAU Time Series', 'GET', '/kpi/dau/data_series', 'Daily active users.', undefined, { length: '7' }),
  ep('kpi.mau.data_series', 'KPIs', 'MAU Time Series', 'GET', '/kpi/mau/data_series', 'Monthly active users (30-day).', undefined, { length: '7' }),
  ep('kpi.new_users.data_series', 'KPIs', 'New Users Time Series', 'GET', '/kpi/new_users/data_series', 'New users per day.', undefined, { length: '7' }),
  ep('kpi.uninstalls.data_series', 'KPIs', 'Uninstalls Time Series', 'GET', '/kpi/uninstalls/data_series', 'Uninstalls per day.', undefined, { length: '7' }),

  // Email Templates
  ep('templates.email.list', 'Email Templates', 'List Email Templates', 'GET', '/templates/email/list', 'List email templates.', undefined, { page: '0' }),
  ep('templates.email.info', 'Email Templates', 'Email Template Info', 'GET', '/templates/email/info', 'Get email template info.', undefined, {
    email_template_id: 'template_id_here',
  }),
  ep('templates.email.create', 'Email Templates', 'Create Email Template', 'POST', '/templates/email/create', 'Create email template.', {
    template_name: 'API Test Template',
    subject: 'Test',
    body: 'Hello',
  }),
  ep('templates.email.update', 'Email Templates', 'Update Email Template', 'POST', '/templates/email/update', 'Update email template.', {
    email_template_id: 'template_id_here',
    template_name: 'Updated Template',
  }),

  // Content Blocks
  ep('content_blocks.list', 'Content Blocks', 'List Content Blocks', 'GET', '/content_blocks/list', 'List Content Blocks.', undefined, {}),
  ep('content_blocks.info', 'Content Blocks', 'Content Block Info', 'GET', '/content_blocks/info', 'Get Content Block info.', undefined, {
    content_block_id: 'block_id_here',
  }),
  ep('content_blocks.create', 'Content Blocks', 'Create Content Block', 'POST', '/content_blocks/create', 'Create Content Block.', {
    name: 'API Test Block',
    content: 'Hello',
  }),
  ep('content_blocks.update', 'Content Blocks', 'Update Content Block', 'POST', '/content_blocks/update', 'Update Content Block.', {
    content_block_id: 'block_id_here',
    name: 'Updated Block',
  }),

  // Preference Center
  ep('preference_center.list', 'Preference Center', 'List Preference Centers', 'GET', '/preference_center/v1/list', 'List preference centers.', undefined, {}),
  ep('preference_center.get', 'Preference Center', 'Get Preference Center', 'GET', '/preference_center/v1/{preferenceCenterExternalId}', 'Get preference center. Replace path param.', undefined, {}),
  ep('preference_center.create', 'Preference Center', 'Create Preference Center', 'POST', '/preference_center/v1', 'Create preference center.', {
    preference_center_name: 'Test Center',
  }),

  // Subscription Groups
  ep('subscription.status.set', 'Subscription Groups', 'Set Subscription Status', 'POST', '/subscription/status/set', 'Set user subscription group status.', {
    subscription_group_id: 'group_id_here',
    external_id: 'user_123',
    state: 'subscribed',
  }),
  ep('subscription.status.get', 'Subscription Groups', 'Get Subscription Status', 'GET', '/subscription/status/get', 'Get subscription status.', undefined, {
    subscription_group_id: 'group_id_here',
    external_id: 'user_123',
  }),
  ep('subscription.groups.get', 'Subscription Groups', 'Get User Subscription Groups', 'GET', '/subscription/user/status', 'Get user subscription groups.', undefined, {
    external_id: 'user_123',
  }),

  // SMS
  ep('sms.invalid_phone_numbers', 'SMS', 'Query Invalid Phone Numbers', 'GET', '/sms/invalid_phone_numbers', 'Query invalid phone numbers.', undefined, {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
  }),
  ep('sms.invalid_phone_numbers.remove', 'SMS', 'Remove Invalid Phone Flag', 'POST', '/sms/invalid_phone_numbers/remove', 'Remove invalid phone number flag.', {
    phone_numbers: ['+821012345678'],
  }),

  // Catalogs
  ep('catalogs.list', 'Catalogs', 'List Catalogs', 'GET', '/catalogs', 'List catalogs in workspace.', undefined, {}),
  ep('catalogs.create', 'Catalogs', 'Create Catalog', 'POST', '/catalogs', 'Create a catalog.', {
    catalogs: [{ name: 'test_catalog', fields: [{ name: 'id', type: 'string' }] }],
  }),
  ep('catalogs.delete', 'Catalogs', 'Delete Catalog', 'DELETE', '/catalogs/{catalog_name}', 'Delete catalog. Replace {catalog_name}.', undefined, {}),
  ep('catalogs.items.list', 'Catalogs', 'List Catalog Items', 'GET', '/catalogs/{catalog_name}/items', 'List items in catalog.', undefined, { page: '0' }),
  ep('catalogs.items.create', 'Catalogs', 'Create Catalog Item', 'POST', '/catalogs/{catalog_name}/items/{item_id}', 'Create catalog item.', {
    items: [{ id: 'item_1', name: 'Test Item' }],
  }),
  ep('catalogs.items.update', 'Catalogs', 'Update Catalog Item', 'PUT', '/catalogs/{catalog_name}/items/{item_id}', 'Update catalog item.', {
    items: [{ id: 'item_1', name: 'Updated Item' }],
  }),
  ep('catalogs.items.delete', 'Catalogs', 'Delete Catalog Item', 'DELETE', '/catalogs/{catalog_name}/items/{item_id}', 'Delete catalog item.', undefined, {}),

  // SDK Authentication
  ep('sdk_auth.keys', 'SDK Authentication', 'List SDK Auth Keys', 'GET', '/app_group/sdk_authentication/keys', 'List SDK authentication keys.', undefined, {}),
  ep('sdk_auth.create', 'SDK Authentication', 'Create SDK Auth Key', 'POST', '/app_group/sdk_authentication/create', 'Create SDK authentication key.', {
    description: 'API tester key',
  }),
  ep('sdk_auth.primary', 'SDK Authentication', 'Set Primary SDK Auth Key', 'PUT', '/app_group/sdk_authentication/primary', 'Set primary SDK auth key.', {
    sdk_authentication_key: 'key_id_here',
  }),
  ep('sdk_auth.delete', 'SDK Authentication', 'Delete SDK Auth Key', 'DELETE', '/app_group/sdk_authentication/delete', 'Delete SDK auth key.', {
    sdk_authentication_key: 'key_id_here',
  }),

  // Cloud Data Ingestion
  ep('cdi.integrations', 'Cloud Data Ingestion', 'List CDI Integrations', 'GET', '/cdi/integrations', 'List data warehouse integrations.', undefined, {}),
  ep('cdi.sync_status', 'Cloud Data Ingestion', 'CDI Sync Status', 'GET', '/cdi/integrations/{integration_id}/sync_status', 'Get sync status.', undefined, {}),
  ep('cdi.trigger_sync', 'Cloud Data Ingestion', 'Trigger CDI Sync', 'POST', '/cdi/integrations/{integration_id}/sync', 'Trigger integration sync.', {}),

  // SCIM
  ep('scim.users.get', 'SCIM', 'Get SCIM User', 'GET', '/scim/v2/Users/{user_id}', 'Get dashboard user by ID.', undefined, {}),
  ep('scim.users.list', 'SCIM', 'List SCIM Users', 'GET', '/scim/v2/Users', 'List dashboard users.', undefined, {}),
  ep('scim.users.create', 'SCIM', 'Create SCIM User', 'POST', '/scim/v2/Users', 'Create dashboard user.', {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    userName: 'user@example.com',
    name: { givenName: 'Test', familyName: 'User' },
  }),
  ep('scim.users.update', 'SCIM', 'Update SCIM User', 'PUT', '/scim/v2/Users/{user_id}', 'Update dashboard user.', {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    userName: 'user@example.com',
  }),
  ep('scim.users.delete', 'SCIM', 'Delete SCIM User', 'DELETE', '/scim/v2/Users/{user_id}', 'Delete dashboard user.', undefined, {}),
];

export const BRAZE_API_CATEGORIES = [
  ...new Set(BRAZE_API_CATALOG.map((e) => e.category)),
];

export function getBrazeEndpointById(id: string): ApiEndpointDefinition | undefined {
  return BRAZE_API_CATALOG.find((e) => e.id === id);
}

export const DEFAULT_BRAZE_REST_ENDPOINT = 'https://rest.iad-01.braze.com';
