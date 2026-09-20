const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080').replace(
  /^http/,
  'ws'
);

const RECONNECT_DELAY_MS = 3000;

export function connectSocket(
  onMessage: (data: unknown) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  function open() {
    socket = new WebSocket(`${WS_URL}/ws`);

    socket.onopen = () => {
      onStatusChange?.(true);
    };

    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        // ignore malformed payloads
      }
    };

    socket.onclose = () => {
      onStatusChange?.(false);
      if (!stopped) {
        reconnectTimer = setTimeout(open, RECONNECT_DELAY_MS);
      }
    };

    socket.onerror = () => {
      socket?.close();
    };
  }

  open();

  return function disconnect() {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  };
}