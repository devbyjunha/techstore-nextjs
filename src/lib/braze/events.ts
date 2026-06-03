/** Non-eCommerce Braze custom events (auth / lifecycle only). */
export const BRAZE_EVENTS = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
} as const;

export type BrazeEventName =
  (typeof BRAZE_EVENTS)[keyof typeof BRAZE_EVENTS];
