/**
 * PM2 process file for production:  npm ci && npm run build && pm2 start ecosystem.config.cjs
 *
 * ONE instance in fork mode, deliberately. Live updates (Socket.IO rooms, event versions) and
 * Next's cache invalidation both live in this one process's memory. Cluster mode or
 * instances > 1 would split them: an admin edit handled by one process would neither reach
 * the sockets held by another nor clear the other's page cache. Scaling out needs
 * @socket.io/redis-adapter plus a shared Next cacheHandler first.
 */
module.exports = {
  apps: [
    {
      name: 'lebami',
      script: 'server.mjs',
      args: '--production',
      exec_mode: 'fork',
      instances: 1,
      env: { PORT: 3000 },
      max_memory_restart: '1G',
    },
  ],
};
