export const SITE_URL = 'https://www.naili.ai';

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}
