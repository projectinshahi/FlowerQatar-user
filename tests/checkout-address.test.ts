import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { isDeliverableAddress, missingAddressFields } from '../lib/qatar';
import { addressSchema, type Address } from '../lib/validations/address';

/** Shapes found in User.addresses: saved before the Qatar format, and after it. */
const legacy: Partial<Address> = { id: 'a1', label: 'Home', addressLine1: '1 Example Road', city: 'Doha', postalCode: '', countryCode: 'QA', countryName: 'Qatar', isDefault: true };
const qatar = { id: 'a2', label: 'Work', zone: '66', street: '920', building: '12', unit: null, countryCode: 'QA', countryName: 'Qatar', isDefault: false };
const update = addressSchema.parse({ label: 'Home', zone: '66', street: '920', building: '12' });

describe('checkout: saved addresses', () => {
  it('only a Qatar-format address can be delivered to', () => {
    assert.equal(isDeliverableAddress(qatar), true);
    assert.equal(isDeliverableAddress(legacy), false);
    assert.equal(isDeliverableAddress({ zone: '66', street: ' ', building: '12' }), false);
  });

  it('names exactly what an address is missing', () => {
    assert.deepEqual(missingAddressFields(legacy), ['zone', 'street', 'building']);
    assert.deepEqual(missingAddressFields({ zone: '66', street: '', building: '12' }), ['street']);
    assert.deepEqual(missingAddressFields(qatar), []);
  });

  it('updating an old address still requires zone, street and building', () => {
    assert.equal(addressSchema.safeParse({ label: legacy.label }).success, false);
    assert.equal(addressSchema.safeParse({ label: 'Home', zone: 'abc', street: '920', building: '12' }).success, false);
    // What the checkout editor saves makes the address deliverable, so it can then be picked.
    assert.equal(isDeliverableAddress(update), true);
  });

  it('an old address card in checkout opens the editor instead of doing nothing', () => {
    const page = readFileSync(new URL('../app/(client)/checkout/page.tsx', import.meta.url), 'utf8');
    assert.ok(page.includes('addresses.filter(isDeliverableAddress)'), 'checkout must use the shared deliverable rule');
    assert.ok(page.includes('missingAddressFields(a)'), 'the card must say what is missing');
    assert.ok(page.includes('onClick={usable ? undefined : () => openFix(a)}'), 'clicking an old-format card must open the editor');
    assert.ok(page.includes('<AddressForm key={fixing.id} initial={fixing}'), 'the editor must start from the old address');
    assert.ok(page.includes('setPicked(res.data.id)'), 'the updated address must be selected');
  });
});

describe('saving an address', () => {
  it('a dropped connection or an error page is a failed save, not a throw, and a retry then works', async () => {
    const { requestAddressSave } = await import('../hooks/useAddresses');
    const realFetch = globalThis.fetch;
    const calls: [string, string | undefined][] = [];
    try {
      globalThis.fetch = async () => {
        throw new TypeError('Failed to fetch');
      };
      assert.equal((await requestAddressSave(update, 'a1')).ok, false);

      globalThis.fetch = async () => new Response('<html>502 Bad Gateway</html>', { status: 502 });
      assert.equal((await requestAddressSave(update, 'a1')).ok, false);

      globalThis.fetch = async () => Response.json({ success: false, error: 'You already have an address labelled "Home".' }, { status: 409 });
      const conflict = await requestAddressSave(update, 'a1');
      assert.equal(conflict.ok ? null : conflict.error, 'You already have an address labelled "Home".');

      globalThis.fetch = async (url, init) => {
        calls.push([String(url), init?.method]);
        return Response.json({ success: true, data: { ...update, id: 'a1', countryCode: 'QA', countryName: 'Qatar', isDefault: true } });
      };
      const saved = await requestAddressSave(update, 'a1');
      assert.equal(saved.ok && saved.data.zone, '66');
      assert.deepEqual(calls, [['/api/addresses/a1', 'PUT']]);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});

describe('saved address ownership', () => {
  it("a customer cannot update another customer's address", async () => {
    // In-memory stand-in for the User table: lib/prisma reuses globalThis.prisma when set, and
    // each test file runs in its own process, so nothing reaches a database.
    const store: Record<string, unknown[]> = {
      u1: [{ ...qatar, id: 'mine' }],
      u2: [{ ...legacy, id: 'theirs' }],
    };
    (globalThis as unknown as { prisma: unknown }).prisma = {
      user: {
        findUnique: async ({ where }: { where: { id: string } }) => (where.id in store ? { addresses: store[where.id] } : null),
        update: async ({ where, data }: { where: { id: string }; data: { addresses: unknown[] } }) => {
          store[where.id] = data.addresses;
        },
      },
    };
    const { updateAddress } = await import('../lib/services/address');

    await assert.rejects(updateAddress('u1', 'theirs', update), { status: 404 });
    assert.equal((store.u2[0] as Address).zone, undefined, "the other customer's address is untouched");

    const own = await updateAddress('u2', 'theirs', update);
    assert.equal(isDeliverableAddress(own), true);
    assert.equal(own.isDefault, true, 'a default address stays the default');
  });
});
