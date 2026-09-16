/**
 * Self-check for the wishlist toggle race — the reason un-hearting right after hearting used to
 * leave the item in the wishlist. Run with:  npx tsx scripts/check-wishlist-toggle.ts
 */
import assert from 'node:assert/strict';
import { syncToggle } from '../lib/wishlist';

/** A server that answers on demand, so a click can be made to land mid-request. */
const server = () => {
  const sent: boolean[] = [];
  let release: (() => void) | null = null;
  const send = async (_slug: string, wishlisted: boolean) => {
    sent.push(wishlisted);
    await new Promise<void>((r) => (release = r));
    return { wishlisted };
  };
  return { sent, send, flush: () => { release?.(); release = null; return new Promise((r) => setImmediate(r)); } };
};

async function main() {
  // A click during an in-flight request must still reach the server, and win.
  {
    const desired = new Map<string, boolean>();
    const s = server();
    desired.set('roses', true);
    const done = syncToggle('roses', desired, s.send);
    await new Promise((r) => setImmediate(r));
    desired.set('roses', false); // user un-hearts while the "add" is still out
    await s.flush();
    await s.flush();
    const { ok, result } = await done;
    assert.deepEqual(s.sent, [true, false], 'the later click must be sent, not dropped');
    assert.equal(ok, true);
    assert.equal((result as { wishlisted: boolean }).wishlisted, false, 'server must end on what the user sees');
    assert.equal(desired.has('roses'), false, 'settled intent must be cleared');
  }

  // The quiet case: one click, one request.
  {
    const desired = new Map([['roses', true]]);
    const s = server();
    const done = syncToggle('roses', desired, s.send);
    await new Promise((r) => setImmediate(r));
    await s.flush();
    const { ok } = await done;
    assert.deepEqual(s.sent, [true]);
    assert.equal(ok, true);
    assert.equal(desired.size, 0);
  }

  // A failed request reports back so the caller can resync, and keeps the intent for that resync.
  {
    const desired = new Map([['roses', true]]);
    const { ok, result } = await syncToggle('roses', desired, async () => null);
    assert.equal(ok, false);
    assert.equal(result, null);
  }

  // Never loops on an untouched slug.
  {
    const { ok, result } = await syncToggle('roses', new Map(), async () => ({ wishlisted: true }));
    assert.equal(ok, true);
    assert.equal(result, null);
  }

  console.log('wishlist toggle: latest click wins + settle + failure OK');
}

main();
