/**
 * Self-check for database-outage classification.
 * Run with:  npx tsx scripts/check-db-errors.ts
 *
 * This decides whether a failure means "not signed in" or "database is down". Get it wrong
 * and an admin is logged out during an outage and sent to a login page that cannot work
 * either — the failure mode this check exists to prevent.
 */
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { isDbUnreachable, retryOnUnreachable } from '../lib/prisma-error';

// Connection failures — must be recognised as "unreachable".
const p1001 = new Prisma.PrismaClientKnownRequestError("Can't reach database server", {
  code: 'P1001',
  clientVersion: 'test',
});
assert.equal(isDbUnreachable(p1001), true, 'P1001 = cannot reach server');

const p1002 = new Prisma.PrismaClientKnownRequestError('Timed out', {
  code: 'P1002',
  clientVersion: 'test',
});
assert.equal(isDbUnreachable(p1002), true, 'P1002 = connection timeout');

const p1017 = new Prisma.PrismaClientKnownRequestError('Server closed the connection', {
  code: 'P1017',
  clientVersion: 'test',
});
assert.equal(isDbUnreachable(p1017), true, 'P1017 = connection closed');

// The exact error from the reported crash.
const init = new Prisma.PrismaClientInitializationError('Cannot reach database', 'test');
assert.equal(isDbUnreachable(init), true, 'initialization failure = unreachable');

/*
 * Query-level failures must NOT be treated as outages — the database answered, the query was
 * simply wrong. Misclassifying these would return 503 and hide genuine bugs behind
 * "try again later".
 */
const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
  code: 'P2025',
  clientVersion: 'test',
});
assert.equal(isDbUnreachable(p2025), false, 'record-not-found is not an outage');

const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
  code: 'P2002',
  clientVersion: 'test',
});
assert.equal(isDbUnreachable(p2002), false, 'unique-violation is not an outage');

// Ordinary errors and non-errors must not be swallowed as outages either.
assert.equal(isDbUnreachable(new Error('boom')), false);
assert.equal(isDbUnreachable('P1001'), false, 'a bare string must not match');
assert.equal(isDbUnreachable(null), false);
assert.equal(isDbUnreachable(undefined), false);

/*
 * Retry behaviour. The rule this guards: a connection failure is worth retrying because the
 * database may simply be waking; anything else is deterministic and must surface at once.
 */
const unreachable = () =>
  new Prisma.PrismaClientKnownRequestError("Can't reach database server", {
    code: 'P1001',
    clientVersion: 'test',
  });

async function checkRetry() {
  // Succeeds first time: called exactly once, no delay.
  let calls = 0;
  assert.equal(await retryOnUnreachable(async () => { calls++; return 'ok'; }), 'ok');
  assert.equal(calls, 1, 'a working call must not be retried');

  // Unreachable then reachable: retried and the value returned.
  calls = 0;
  const recovered = await retryOnUnreachable(async () => {
    calls++;
    if (calls < 3) throw unreachable();
    return 'awake';
  }, 3, 1);
  assert.equal(recovered, 'awake', 'must return the value once the database wakes');
  assert.equal(calls, 3, 'must keep trying up to the attempt limit');

  // Still unreachable after every attempt: the original error surfaces, not a generic one.
  calls = 0;
  await assert.rejects(
    () => retryOnUnreachable(async () => { calls++; throw unreachable(); }, 3, 1),
    (e: unknown) => isDbUnreachable(e),
    'a database that never wakes must still fail as unreachable'
  );
  assert.equal(calls, 3, 'must stop at the attempt limit rather than retry forever');

  // A deterministic failure must NOT be retried — retrying a bad query just slows the error down.
  calls = 0;
  const badQuery = new Prisma.PrismaClientKnownRequestError('Table does not exist', {
    code: 'P2021',
    clientVersion: 'test',
  });
  await assert.rejects(
    () => retryOnUnreachable(async () => { calls++; throw badQuery; }, 3, 1),
    (e: unknown) => (e as { code?: string }).code === 'P2021'
  );
  assert.equal(calls, 1, 'a deterministic failure must surface on the first attempt');
}

checkRetry().then(
  () => console.log('db outage classification + retry OK'),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
