export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

/** Turns a backend-relative media path (e.g. "/uploads/avatars/x.png") into an absolute URL. */
export function mediaUrl(path?: string): string | undefined {
  if (!path) {
    return undefined;
  }
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** A request that never got a response. It is an ApiError (status 0) so forms show its message. */
export class NetworkError extends ApiError {
  constructor(message = "Can't reach the server. Check your connection and try again.") {
    super(message, 0);
    this.name = 'NetworkError';
  }
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  'server error': 'Something went wrong on our side. Please try again in a moment.',
  'invalid request body': 'Something in that request was not valid. Please check it and try again.',
  unauthorized: 'Your session has expired. Please sign in again.',
  'title is required': 'Please enter a title.',
  'title and eventtime are required': 'Please add a title and pick a date and time.',
  'content is required': 'Please write something first.',
  'content is too long': 'That is too long. Please shorten it.',
  'invalid image': 'That image could not be used. Try a JPEG, PNG or GIF under 5 MB.',
  'invalid privacy value': 'Please choose who can see this.',
  'user not found': "We couldn't find that person.",
  'user is already a member': 'That person is already in this group.',
  'already a member': 'You are already a member of this group.',
  'invalid user id': "We couldn't find that person.",
  'invalid group id': "We couldn't find that group.",
  'invalid post id': "We couldn't find that post.",
};

const STATUS_FALLBACKS: Record<number, string> = {
  400: 'Something in that request was not valid. Please check it and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find that.",
  409: 'That conflicts with something that already exists.',
  413: 'That file is too large.',
};

function friendlyMessage(raw: string | null, status: number): string {
  if (status >= 500) {
    return 'Something went wrong on our side. Please try again in a moment.';
  }
  if (raw) {
    const text = raw.trim();
    const known = FRIENDLY_MESSAGES[text.toLowerCase()];
    if (known) return known;
    return text.charAt(0).toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? '' : '.');
  }
  return STATUS_FALLBACKS[status] ?? 'Something went wrong. Please try again.';
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: { ...headers },
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      init.headers = { 'Content-Type': 'application/json', ...init.headers };
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new NetworkError();
  }

  const text = await res.text();
  let data: unknown = null;
  if (text !== '') {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const raw =
      data &&
      typeof data === 'object' &&
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : null;
    throw new ApiError(friendlyMessage(raw, res.status), res.status);
  }

  return data as T;
}