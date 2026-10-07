import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { signUpload } from '../lib/cloudinary';

process.env.CLOUDINARY_CLOUD_NAME = 'demo';
process.env.CLOUDINARY_API_KEY = 'key';
process.env.CLOUDINARY_API_SECRET = 'secret';

const sha1 = (s: string) => crypto.createHash('sha1').update(s).digest('hex');

test('allowed_formats is part of the signature, in Cloudinary’s alphabetical param order', () => {
  const sig = signUpload('flower_users', 'jpg,png');
  assert.equal(sig.allowedFormats, 'jpg,png');
  assert.equal(sig.signature, sha1(`allowed_formats=jpg,png&folder=flower_users&timestamp=${sig.timestamp}secret`));
});

test('without allowed formats the signature covers folder and timestamp only', () => {
  const sig = signUpload('flower_products');
  assert.equal(sig.allowedFormats, undefined);
  assert.equal(sig.signature, sha1(`folder=flower_products&timestamp=${sig.timestamp}secret`));
});
