import { API_URL } from '@/src/services/http';

/**
 * The API returns media paths relative to the backend (e.g. `/api/images/posts/xyz.jpg`
 * or `/uploads/avatars/xyz.jpg`). The frontend runs on a different origin, so those
 * paths need the backend origin prefixed before they can be used in an <img src>.
 */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
