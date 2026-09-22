<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dev server — do not kill it

`npm run dev` runs `node server.mjs`: Next.js plus the Socket.IO live-update server in one process
(see server.mjs and lib/live-sync.ts). A plain `next dev` still works, just without live updates.

A `npm run dev` server may already be running on http://localhost:3000. It belongs to the
user. Killing it forces them to restart it by hand, which is the single most disruptive thing
you can do to their working session.

- **Never terminate it.** No `kill <pid>`, no `pkill -f "next dev"`, no `pkill -f server.mjs`, no `pkill -f next-server`,
  and no killing whatever process is holding port 3000.
- **Check before starting one**, so you reuse theirs instead of racing it onto port 3001:
  `curl -sf -o /dev/null http://localhost:3000 && echo "dev server already up"`
- **If you do start one, detach it** so it outlives your shell and your session:
  `nohup npm run dev > dev-server.log 2>&1 & disown`
- **`npm run build` is not safe alongside it.** Both write the same `.next/` directory that
  `next dev` is serving from, so a verification build can leave the running server broken.
  Ask before building while a dev server is up.
- **Leave it running when you finish a task.** Stopping it is the user's call, not yours.
