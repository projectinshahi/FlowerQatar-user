/**
 * Run with: npx tsx --env-file=.env scripts/<this file>
 *
 * One-off sandbox + database regression check of the PRODUCT payment flow.
 * Creates a throwaway user and cart, runs the flow, and deletes everything it made.
 */
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { addItem } from '../lib/services/cart';
import { createPendingOrder, confirmOrderPaid } from '../lib/services/order';
import { createPayment, confirmSkipCashPayment, findPaymentOwner } from '../lib/services/skipcash';

const ok = (label: string, cond: boolean, detail = '') =>
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);

interface ColorJson { id?: string }
interface VariantJson { id?: string; colorVariants?: ColorJson[] }

async function main() {
  const product = await prisma.product.findFirst({
    where: { status: 'PUBLISHED' },
    select: { id: true, name: true, slug: true, variants: true },
  });
  if (!product) throw new Error('no published product to test with');

  const variants = (Array.isArray(product.variants) ? product.variants : []) as VariantJson[];
  const variant = variants[0];
  const color = variant?.colorVariants?.[0];
  console.log(`product: ${product.name}`);

  const user = await prisma.user.create({
    data: { email: `skipcash-order-${randomUUID()}@lebami.test`, firstName: 'Sandbox', lastName: 'Check' },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  try {
    const cart = await addItem(user.id, {
      productId: product.id,
      variantId: variant?.id ?? null,
      colorId: color?.id ?? null,
      quantity: 1,
      unitPrice: 1,
      selection: null,
    });
    ok('cart has one line', cart.items.length === 1, `subtotal ${cart.summary.subtotal}`);

    const order = await createPendingOrder(user.id, {
      shippingMethod: 'standard',
      shippingInfo: {
        firstName: 'Sandbox',
        lastName: 'Check',
        email: user.email,
        phone: '33123456',
        address: '1 Test Street',
        city: 'Doha',
        zip: '',
      },
    });
    ok('order created', Boolean(order.orderId), `total ${order.totalAmount}`);

    const created = await prisma.order.findUniqueOrThrow({ where: { id: order.orderId } });
    ok('order starts UNPAID', created.paymentStatus === 'UNPAID', created.paymentStatus);

    const cartAfterOrder = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { cart: true } });
    ok(
      'cart is NOT cleared when the order is created',
      Array.isArray(cartAfterOrder.cart) && (cartAfterOrder.cart as unknown[]).length === 1
    );

    // --- real sandbox call -------------------------------------------------
    const payment = await createPayment({
      reference: order.orderId,
      amount: order.totalAmount,
      customer: { firstName: 'Sandbox', lastName: 'Check', email: user.email, phone: '33123456' },
    });
    ok('SkipCash sandbox created a payment', Boolean(payment.paymentId && payment.payUrl), payment.payUrl?.slice(0, 48));

    await prisma.order.update({
      where: { id: order.orderId },
      data: { paymentId: payment.paymentId, paymentStatus: 'PENDING', paymentProvider: 'SKIPCASH' },
    });

    const owner = await findPaymentOwner(payment.paymentId);
    ok('payment resolves to the product order', owner?.kind === 'PRODUCT' && owner.orderId === order.orderId);

    const verified = await confirmSkipCashPayment(payment.paymentId);
    ok('unpaid payment verifies as PENDING', verified.status === 'PENDING', verified.status);
    ok('verification reports PRODUCT', verified.kind === 'PRODUCT');

    const stillPending = await prisma.order.findUniqueOrThrow({ where: { id: order.orderId } });
    ok('order is not paid by a return visit', stillPending.paymentStatus === 'PENDING', stillPending.paymentStatus);
    const cartStill = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { cart: true } });
    ok('cart survives an unpaid payment', (cartStill.cart as unknown[]).length === 1);

    // --- confirmation ------------------------------------------------------
    const first = await confirmOrderPaid(order.orderId, { provider: 'SKIPCASH', paymentTxnId: 'test-txn' });
    ok('first confirmation settles the order', first === true);

    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.orderId } });
    ok('order is PAID', paid.paymentStatus === 'PAID');
    ok('paidAt recorded', Boolean(paid.paidAt));
    ok('fulfilment status untouched', paid.status === 'PENDING', paid.status);

    const cartCleared = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { cart: true } });
    ok('purchased line cleared after payment', (cartCleared.cart as unknown[]).length === 0);

    // --- idempotency -------------------------------------------------------
    const second = await confirmOrderPaid(order.orderId, { provider: 'SKIPCASH' });
    ok('duplicate confirmation is a no-op', second === false);

    const items = await prisma.orderItem.count({ where: { orderId: order.orderId } });
    ok('order items not duplicated', items === 1, String(items));
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    console.log('cleaned up test user');
  }
}

main()
  .catch((e) => {
    console.error('ERROR', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
