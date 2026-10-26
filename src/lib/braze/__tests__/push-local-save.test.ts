import { PUSH_SAVE_SAMPLES } from '../push-save';
import { sendLocalPushSaveNotification } from '../push';

describe('sendLocalPushSaveNotification', () => {
  const originalNotification = global.Notification;
  const originalServiceWorker = navigator.serviceWorker;

  afterEach(() => {
    Object.defineProperty(global, 'Notification', {
      configurable: true,
      value: originalNotification,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });
  });

  it('returns permission when notifications are not granted', async () => {
    Object.defineProperty(global, 'Notification', {
      configurable: true,
      value: { permission: 'denied' },
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve({ showNotification: jest.fn() }) },
    });

    await expect(
      sendLocalPushSaveNotification(PUSH_SAVE_SAMPLES[0])
    ).resolves.toEqual({ ok: false, error: 'permission' });
  });

  it('shows a notification with extra keys', async () => {
    const showNotification = jest.fn(async () => undefined);
    Object.defineProperty(global, 'Notification', {
      configurable: true,
      value: { permission: 'granted' },
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: Promise.resolve({ showNotification }) },
    });

    await expect(
      sendLocalPushSaveNotification(PUSH_SAVE_SAMPLES[1])
    ).resolves.toEqual({ ok: true });

    expect(showNotification).toHaveBeenCalledWith(
      'TechStore 티켓이 도착했습니다',
      expect.objectContaining({
        data: {
          extra: {
            action: 'save_image',
            image_url: PUSH_SAVE_SAMPLES[1].imageUrl,
            file_name: PUSH_SAVE_SAMPLES[1].fileName,
          },
        },
      })
    );
  });
});
