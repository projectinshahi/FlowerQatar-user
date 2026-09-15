import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryMedia, imagesOnly, stillOf, videoPoster } from '../lib/media';

test('legacy gallery rows with no type are sniffed from the url, so a clip never passes as a still', () => {
  const cloudinary = 'https://res.cloudinary.com/x/video/upload/v1/flower_products/abc';
  assert.deepEqual(imagesOnly([{ url: '/a.png' }, { url: '/old.mp4' }, { url: cloudinary }]), [{ url: '/a.png' }]);
});

test('a Cloudinary video yields its first frame as a jpg; anything else has no poster', () => {
  const v = 'https://res.cloudinary.com/x/video/upload/v1/flower_products/abc.mp4';
  assert.equal(videoPoster(v), 'https://res.cloudinary.com/x/video/upload/so_0,f_jpg/v1/flower_products/abc.jpg');
  assert.equal(videoPoster('/videos/clip.mp4'), undefined);
  assert.equal(videoPoster(undefined), undefined);
});

test('stillOf passes images through, turns videos into posters, and drops what it cannot', () => {
  const image = 'https://res.cloudinary.com/x/image/upload/v1/a.png';
  assert.equal(stillOf(image), image);
  assert.equal(stillOf('https://res.cloudinary.com/x/video/upload/v1/a.webm'), 'https://res.cloudinary.com/x/video/upload/so_0,f_jpg/v1/a.jpg');
  assert.equal(stillOf('/videos/clip.mp4'), undefined, 'no poster can be derived, so the caller falls through');
  assert.equal(stillOf(null), undefined);
});

test('galleryMedia keeps admin order, tags each item, and drops url-less rows', () => {
  const cloudinary = 'https://res.cloudinary.com/x/video/upload/v1/flower_products/c';
  assert.deepEqual(galleryMedia([{ url: '/a.png' }, { type: 'video' }, { url: '/clip.mp4' }, { url: cloudinary, type: 'image' }]), [
    { url: '/a.png', type: 'image' },
    { url: '/clip.mp4', type: 'video' },
    { url: cloudinary, type: 'video' },
  ]);
  assert.deepEqual(galleryMedia(undefined), []);
});
