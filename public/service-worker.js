/* Braze Web Push service worker — must be served from site root (/service-worker.js)
 *
 * Extra-key click handling is registered BEFORE Braze's worker so save_image
 * can stopImmediatePropagation and avoid a second default tab.
 * Keep extras keys in sync with src/lib/braze/push-save.ts
 *
 * Braze Web Push stores Key-Value extras on payload.e (not extra/extras).
 * Localhost-only push logging is registered before Braze's worker.
 * Do not stopImmediatePropagation on push — Braze must still display the notification.
 */
function isLocalhostServiceWorker() {
  var host = self.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

if (isLocalhostServiceWorker()) {
  self.addEventListener('install', function () {
    self.skipWaiting();
  });

  self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('push', function (event) {
    var payload = null;
    try {
      payload = event.data ? event.data.json() : null;
    } catch (err) {
      try {
        payload = event.data ? event.data.text() : null;
      } catch (err2) {
        payload = null;
      }
    }

    var extra = readPushExtras(payload);
    var probe = {
      client_only_value: extra ? extra.client_only_value : undefined,
      liquid_render_probe: extra ? extra.liquid_render_probe : undefined,
      message_extras_probe: extra ? extra.message_extras_probe : undefined,
    };

    console.log('[Web Push payload]', payload);
    console.log('[Web Push extra]', extra);
    console.log('[client_only_value]', probe.client_only_value);
    console.log('[Web Push liquid probe]', probe);

    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(function (clientList) {
          for (var i = 0; i < clientList.length; i++) {
            clientList[i].postMessage({
              source: 'techstore-web-push-probe',
              extra: extra,
              client_only_value: probe.client_only_value,
              liquid_render_probe: probe.liquid_render_probe,
              message_extras_probe: probe.message_extras_probe,
            });
          }
        })
    );
  });
}

self.addEventListener('notificationclick', function (event) {
  var extras = readPushSaveExtras(event.notification && event.notification.data);
  if (!extras) {
    return;
  }

  event.stopImmediatePropagation();
  event.notification.close();

  var dest =
    '/push-save?action=save_image&image_url=' +
    encodeURIComponent(extras.imageUrl) +
    '&file_name=' +
    encodeURIComponent(extras.fileName);

  event.waitUntil(openPushSaveWindow(dest));
});

self.importScripts('https://js.appboycdn.com/web-sdk/6.7/service-worker.js');

function parseExtraObject(value) {
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (err) {
      return null;
    }
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value;
}

function readPushExtras(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Braze Web Push wire format stores Key-Value extras on `e`.
  // Local simulation uses `extra` / `extras`.
  return (
    parseExtraObject(data.e) ||
    parseExtraObject(data.extra) ||
    parseExtraObject(data.extras) ||
    null
  );
}

function readPushSaveExtras(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  var nested = readPushExtras(data) || {};
  var extras = Object.assign({}, data, nested);
  var action = extras.action || extras.ab_action;
  var imageUrl = extras.image_url || extras.imageUrl;
  if (action !== 'save_image' || !imageUrl) {
    return null;
  }

  return {
    imageUrl: String(imageUrl),
    fileName: String(extras.file_name || extras.fileName || 'techstore-ticket.svg'),
  };
}

function openPushSaveWindow(dest) {
  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client && typeof client.navigate === 'function') {
          return client.navigate(dest).then(function (navigated) {
            if (navigated && typeof navigated.focus === 'function') {
              return navigated.focus();
            }
            return navigated;
          });
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(dest);
      }
      return undefined;
    });
}
