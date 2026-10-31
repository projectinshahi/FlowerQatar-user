import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Provisions an administrator account, safely enough to run on every deploy.
 *
 * The password is only ever read from ADMIN_PASSWORD — never a literal here, never an argument
 * (argv shows up in shell history and in `ps`), and never printed. It is hashed with the same
 * bcrypt cost the application itself uses (lib/auth.ts hashPassword), so an account made here is
 * indistinguishable from one made by the sign-up flow.
 *
 *   ADMIN_PASSWORD='…' npx tsx scripts/seed-admin.ts admin@example.com
 *
 * Idempotent on purpose. Re-running it does not create a second account and does not touch a
 * password that already works, so a deploy pipeline carrying a stale ADMIN_PASSWORD cannot
 * silently lock the real administrator out. Changing an existing password is therefore an
 * explicit act:
 *
 *   ADMIN_PASSWORD='…' ADMIN_PASSWORD_RESET=1 npx tsx scripts/seed-admin.ts admin@example.com
 *
 * What it always repairs, because each of these alone is enough to make a correct password fail
 * at /admin/login (see app/api/auth/login/route.ts): a non-admin role, a deactivated or blocked
 * account, an unverified email, and a brute-force lock left over from failed attempts.
 */

const prisma = new PrismaClient();

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

async function main() {
  const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? 'admin@flowerqatar.com').toLowerCase().trim();
  const plainPassword = process.env.ADMIN_PASSWORD;
  const reset = process.env.ADMIN_PASSWORD_RESET === '1' || process.argv.includes('--reset');

  if (!plainPassword || plainPassword.length < 12) {
    throw new Error('Set ADMIN_PASSWORD (at least 12 characters) in the environment.');
  }
  // 72 bytes is bcrypt's ceiling: everything past it is silently ignored, which would mean the
  // stored hash does not actually cover the whole password the operator thinks they set.
  if (Buffer.byteLength(plainPassword, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD is longer than bcrypt\'s 72-byte limit.');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, password: true },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(plainPassword, 12),
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log(`Created admin account ${email}.`);
    return;
  }

  // Repairs that are safe to apply every run. SUPER_ADMIN is left alone — it outranks ADMIN,
  // and rewriting it would be a silent demotion.
  const data: Prisma.UserUpdateInput = {
    isActive: true,
    isBlocked: false,
    isDeleted: false,
    isEmailVerified: true,
    failedLoginAttempts: 0,
    lockUntil: null,
  };
  if (!ADMIN_ROLES.includes(existing.role as (typeof ADMIN_ROLES)[number])) data.role = 'ADMIN';

  const passwordAlreadyWorks =
    !!existing.password && (await bcrypt.compare(plainPassword, existing.password));

  if (passwordAlreadyWorks) {
    console.log(`${email} already has this password — leaving it unchanged.`);
  } else if (existing.password && !reset) {
    // Not an error: a repeat deploy reaching here is the case this guard exists for.
    console.log(
      `${email} already has a different password. Not changing it.\n` +
        'Re-run with ADMIN_PASSWORD_RESET=1 (or --reset) to set the one in ADMIN_PASSWORD.'
    );
  } else {
    data.password = await bcrypt.hash(plainPassword, 12);
    console.log(existing.password ? `Reset the password for ${email}.` : `Set a password for ${email}.`);
  }

  await prisma.user.update({ where: { email }, data });
  console.log(`${email} is an administrator, active, verified and unlocked.`);
}

main()
  .catch((e) => {
    // The message only ever names the account, never the password.
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
