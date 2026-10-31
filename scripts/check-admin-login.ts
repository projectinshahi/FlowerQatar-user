/**
 * End-to-end check of the administrator sign-in, against a running server.
 *
 *   ADMIN_PASSWORD='…' npx tsx scripts/check-admin-login.ts
 *   ADMIN_PASSWORD='…' BASE_URL=https://lebami.com npx tsx scripts/check-admin-login.ts admin@lebami.com
 *
 * The password is read from the environment and never printed, never written anywhere, and
 * never sent to any host other than BASE_URL. Everything it asserts is behaviour a customer or
 * an attacker could observe, so it is safe to run against production.
 *
 * It deliberately makes exactly ONE wrong-password attempt: the login route locks an account
 * after five and rate-limits an IP after twenty in fifteen minutes (app/api/auth/login/route.ts),
 * and a check that locked the account it just verified would be worse than no check. The
 * successful sign-in that follows resets the account's failed-attempt counter to zero.
 */
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? 'admin@lebami.com').toLowerCase().trim();

let failures = 0;
const check = (name: string, pass: boolean, detail?: unknown) => {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail === undefined ? '' : `  ${JSON.stringify(detail)}`}`);
};

/** The `session` cookie value from a Set-Cookie header, or null when it was cleared. */
function sessionFrom(res: Response): string | null {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const m = /^session=([^;]*)/.exec(c);
    if (!m) continue;
    return m[1] === '' ? null : m[1];
  }
  return null;
}

const login = (password: string, isAdminLogin: boolean) =>
  fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password, isAdminLogin }),
    redirect: 'manual',
  });

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Set ADMIN_PASSWORD in the environment.');
  console.log(`Checking ${EMAIL} against ${BASE_URL}\n`);

  // 1. A wrong password is refused, and says nothing about whether the account exists.
  const bad = await login(`${password}-definitely-wrong`, true);
  const badBody = await bad.json().catch(() => ({}));
  check('a wrong password is rejected', bad.status === 401, { status: bad.status });
  check(
    'the rejection does not reveal that the account exists',
    /invalid email or password/i.test(String(badBody.error ?? '')),
    { error: badBody.error }
  );
  check('no session cookie is issued for a wrong password', sessionFrom(bad) === null);

  // 2. The real password signs in and is handed a session.
  const good = await login(password, true);
  const goodBody = await good.json().catch(() => ({}));
  const session = sessionFrom(good);
  check('the correct password signs in', good.status === 200, { status: good.status, error: goodBody.error });
  check('an administrator role comes back', ['ADMIN', 'SUPER_ADMIN'].includes(goodBody?.user?.role), {
    role: goodBody?.user?.role,
  });
  check('a session cookie is issued', !!session);
  check('the response carries no password or hash', !JSON.stringify(goodBody).toLowerCase().includes('password'));
  if (!session) throw new Error('No session cookie — the checks below cannot run.');

  const asAdmin = { cookie: `session=${session}` };

  // 3. The session verifies server-side, and the admin dashboard renders for it.
  const me = await fetch(`${BASE_URL}/api/auth/me`, { headers: asAdmin });
  const meBody = await me.json().catch(() => ({}));
  check('the session verifies server-side', me.status === 200 && meBody?.user?.email === EMAIL, {
    status: me.status,
    email: meBody?.user?.email,
  });

  const dash = await fetch(`${BASE_URL}/admin`, { headers: asAdmin, redirect: 'manual' });
  check('the admin dashboard loads for that session', dash.status === 200, { status: dash.status });

  const adminApi = await fetch(`${BASE_URL}/api/admin/users?page=1`, { headers: asAdmin });
  check('an admin API answers that session', adminApi.status === 200, { status: adminApi.status });

  // 4. Nobody else gets in.
  const anonApi = await fetch(`${BASE_URL}/api/admin/users?page=1`, { redirect: 'manual' });
  check('an admin API refuses a request with no session', [401, 403].includes(anonApi.status), {
    status: anonApi.status,
  });

  const anonDash = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
  const sentToLogin = [302, 303, 307].includes(anonDash.status)
    ? (anonDash.headers.get('location') ?? '').includes('/admin/login')
    : false;
  check('the admin dashboard turns an anonymous visitor away', sentToLogin || anonDash.status === 401, {
    status: anonDash.status,
    location: anonDash.headers.get('location'),
  });

  // The customer portal must not accept an admin, or it would reveal which emails are admins.
  const viaCustomerPortal = await login(password, false);
  check('the customer login refuses an administrator', viaCustomerPortal.status === 401, {
    status: viaCustomerPortal.status,
  });

  // 5. Signing out stops the session being accepted.
  const out = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', headers: asAdmin });
  check('logout succeeds', out.status === 200, { status: out.status });
  check('logout clears the session cookie', sessionFrom(out) === null);

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  if (failures) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
