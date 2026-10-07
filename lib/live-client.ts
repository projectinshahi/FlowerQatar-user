import type { Socket } from 'socket.io-client';
import { entityOf, type LiveEvent, type LiveHello } from '@/lib/live-events';

/**
 * Browser side of live updates: ONE Socket.IO connection per tab, shared by every component.
 *
 * Components subscribe with onLive()/onResync() and get a function to unsubscribe. The socket
 * is opened lazily by the first subscriber — the Socket.IO client itself is only downloaded
 * then — and its handlers are registered exactly once here, so re-renders never stack listeners.
 *
 * If the socket cannot connect (server without Socket.IO, network down) nothing breaks: pages
 * are server-rendered and correct on load; they just stop updating live until it reconnects.
 */

type Listener<T> = (value: T) => void;

const liveListeners = new Set<Listener<LiveEvent>>();
const resyncListeners = new Set<() => void>();

/** Newest version applied per entity key, so a late or duplicate event is ignored. */
const applied = new Map<string, number>();
/** What this tab had seen the last time it was connected. */
let seen: LiveHello | null = null;
let socket: Socket | null = null;
let connecting = false;

function connect() {
  if (connecting || typeof window === 'undefined') return;
  connecting = true;
  // A failed chunk load leaves the page static, as an unreachable server does; the next subscriber retries.
  import('socket.io-client').then(({ io }) => open(io), () => { connecting = false; });
}

function open(io: typeof import('socket.io-client').io) {
  socket = io({
    path: '/socket.io',
    // WebSocket only: no long-polling fallback hammering the server with HTTP requests.
    transports: ['websocket'],
    // Backs off to one attempt every 30s, so an unreachable server costs almost nothing.
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30_000,
  });

  // Back online: reconnect now rather than at the end of a backoff wait (measured ~19s).
  window.addEventListener('online', () => {
    if (!socket?.connected) socket?.connect();
  });

  socket.on('hello', (hello: LiveHello) => {
    /*
     * Sent on every (re)connect. First connect: the page was just rendered by the server, so
     * it is current; only remember the baseline. Reconnect: if anything was published while
     * this tab was disconnected, re-sync once instead of replaying events.
     */
    const missed = seen !== null && (hello.latest > seen.latest || hello.userLatest > seen.userLatest);
    seen = hello;
    if (missed) resyncListeners.forEach((fn) => fn());
  });

  socket.on('live', (event: LiveEvent) => {
    const key = `${entityOf(event.type)}:${event.ids?.join(',') ?? '*'}`;
    if ((applied.get(key) ?? 0) >= event.version) return;
    applied.set(key, event.version);
    // Keep the reconnect baseline moving so events received live are not counted as missed.
    if (seen) {
      if (event.type.startsWith('order.')) seen.userLatest = Math.max(seen.userLatest, event.version);
      else seen.latest = Math.max(seen.latest, event.version);
    }
    liveListeners.forEach((fn) => fn(event));
  });
}

/** Called for every live event. Returns the unsubscribe function (use it in effect cleanup). */
export function onLive(fn: Listener<LiveEvent>): () => void {
  connect();
  liveListeners.add(fn);
  return () => {
    liveListeners.delete(fn);
  };
}

/** Called after a reconnect when events were missed: re-read your data from the server. */
export function onResync(fn: () => void): () => void {
  connect();
  resyncListeners.add(fn);
  return () => {
    resyncListeners.delete(fn);
  };
}
