/**
 * Production and development entry point: Next.js and Socket.IO on ONE HTTP server.
 *
 * Why a custom server: Next route handlers cannot hold a WebSocket open, and a second process
 * would need its own port, proxy rule and an internal API for Next to call. In one process the
 * admin routes hand events straight to Socket.IO through globalThis (see lib/live-sync.ts).
 *
 * Plain JavaScript on purpose: this file is not compiled by Next, and keeping it JS means
 * production needs nothing beyond `node`.
 *
 * ponytail: single-process state (event versions, rooms). Running more than one instance needs
 * @socket.io/redis-adapter for the sockets and a shared Next cacheHandler for invalidation.
 */
import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { parseCookie } from 'cookie';

/*
 * Development unless told otherwise, by EITHER route:
 *
 *   --production   the flag `npm start` passes, because `NODE_ENV=production node ...` in an
 *                  npm script does not work on Windows.
 *   NODE_ENV       what a host sets for us. Some platforms (GoDaddy/cPanel via Passenger among
 *                  them) start this file directly rather than through an npm script, so there
 *                  is no argv to carry the flag - and this line used to OVERWRITE their
 *                  NODE_ENV=production back to 'development'. Next then booted its Turbopack
 *                  dev compiler, which spawns helper processes that bind their own sockets; a
 *                  restricted container refuses that ("Permission denied (os error 13)"), the
 *                  first asset it needed failed to compile, and every page answered 500.
 *
 * Production therefore wins if either says so; nothing here can downgrade a host's production
 * environment to development.
 */
const dev = !process.argv.includes('--production') && process.env.NODE_ENV !== 'production';
process.env.NODE_ENV = dev ? 'development' : 'production';
const port = Number(process.env.PORT) || 3000;

const httpServer = createServer();
// Passing httpServer lets Next attach its own dev HMR WebSocket upgrade handler to it.
const app = next({ dev, port, httpServer });
const handle = app.getRequestHandler();
await app.prepare();

// Initialize subscription plans on startup
try {
  const { ensureSubscriptionPlansExist } = await import('./lib/services/subscription/initialize.ts');
  await ensureSubscriptionPlansExist();
} catch (error) {
  console.warn('Could not initialize subscription plans:', error.message);
}
/*
 * Browser-safe caching for pages.
 *
 * Next marks ISR pages `s-maxage=N, stale-while-revalidate=<up to a year>` for CDNs. Browsers
 * honour stale-while-revalidate too, and the router re-requests the same `?_rsc=` URL on every
 * refresh, so Chrome answered a refresh from its own cache with the PREVIOUS render and only
 * revalidated in the background. Measured: after an admin re-published a product, the open
 * product page's refresh got the stale "unpublished" payload in 15ms while the server already
 * had the new one. revalidatePath/revalidateTag cannot reach a browser or CDN copy.
 *
 * So page responses (HTML and RSC) must be revalidated with the server on every use. Speed is
 * unaffected in practice: the server still answers from its own ISR cache. /_next/static
 * assets keep their immutable caching (their header has no s-maxage, so it is untouched).
 */
const PAGE_CACHE_CONTROL = 'public, max-age=0, must-revalidate';
const browserSafe = (name, value) =>
  String(name).toLowerCase() === 'cache-control' && /s-maxage/i.test(String(value)) ? PAGE_CACHE_CONTROL : value;

httpServer.on('request', (req, res) => {
  const setHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => setHeader(name, browserSafe(name, value));
  handle(req, res);
});

const io = new Server(httpServer, {
  path: '/socket.io',
  serveClient: false,
  // Other upgrade requests (Next's dev HMR socket) are not ours: leave them alone instead of
  // engine.io's default of destroying unknown upgrades.
  destroyUpgrade: false,
  /*
   * Same-origin only. Sockets can join a signed-in user's private room from the session
   * cookie, so a page on another site must not be able to open one with the visitor's cookies.
   */
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    if (!origin) return callback(null, true);
    try {
      callback(null, new URL(origin).host === req.headers.host);
    } catch {
      callback(null, false);
    }
  },
});

// Same secret and dev fallback as lib/auth.ts. Read lazily: Next loads .env during prepare().
const jwtSecret = () =>
  process.env.JWT_SECRET || (dev ? 'insecure-dev-only-secret-do-not-use-in-prod' : null);

/** Signed-in customers get their private room; guests (and bad tokens) connect as public. */
io.use((socket, nextMiddleware) => {
  const token = parseCookie(socket.request.headers.cookie || '').session;
  const secret = jwtSecret();
  if (token && secret) {
    try {
      const payload = jwt.verify(token, secret);
      if (payload && typeof payload === 'object' && typeof payload.userId === 'string') {
        socket.data.userId = payload.userId;
      }
    } catch {
      // Expired or forged session: still allowed to receive public events.
    }
  }
  nextMiddleware();
});

/*
 * Versions: strictly increasing per process, so a client can drop an older event that arrives
 * late, and can tell after a reconnect whether it missed anything.
 */
let lastVersion = 0;
let latestPublic = 0;
// ponytail: unbounded map, one number per customer who got an order event since boot.
const latestByUser = new Map();
const stamp = (change) => ({ ...change, version: (lastVersion = Math.max(Date.now(), lastVersion + 1)) });

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  if (userId) socket.join(`user:${userId}`);
  socket.emit('hello', { latest: latestPublic, userLatest: userId ? latestByUser.get(userId) ?? 0 : 0 });
});

globalThis[Symbol.for('lebami.live')] = {
  publish(change) {
    const event = stamp(change);
    latestPublic = event.version;
    io.emit('live', event);
  },
  toUser(userId, change) {
    const event = stamp(change);
    latestByUser.set(userId, event.version);
    io.to(`user:${userId}`).emit('live', event);
  },
};

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`> Lebami ready on http://localhost:${port} (${dev ? 'development' : 'production'}, live updates on)`);
});
