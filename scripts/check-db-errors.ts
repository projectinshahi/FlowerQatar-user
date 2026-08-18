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
import { isDbUnreachable } from '../lib/prisma-error';

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

console.log('db outage classification OK');
