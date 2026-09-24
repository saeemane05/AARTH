const CONFIGURED_API_BASE = String(
  (import.meta as ImportMeta & {
    env?: {
      VITE_API_URL?: string;
    };
  }).env?.VITE_API_URL || ''
).trim();

function trimTrailingSlash(url: string) {
  return String(url || '')
    .trim()
    .replace(/\/+$/, '');
}

/*
 * Local development:
 *   API_BASE = ''
 *   fetch('/api/...') goes through Vite's proxy:
 *   /api -> http://127.0.0.1:8000
 *
 * Production:
 *   Set VITE_API_URL to the deployed AARTH backend URL.
 */
export const API_BASE = trimTrailingSlash(CONFIGURED_API_BASE);