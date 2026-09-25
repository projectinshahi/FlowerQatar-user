import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryMedia, imagesOnly, orderedItemImage, stillOf, videoPoster, videoSrc, widthFromSizes } from '../lib/media';

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

test('videoSrc asks Cloudinary to re-encode, and leaves anything else alone', () => {
  const v = 'https://res.cloudinary.com/x/video/upload/v1/flower_products/abc.mov';
  assert.equal(
    videoSrc(v),
    'https://res.cloudinary.com/x/video/upload/f_auto:video,q_auto,c_limit,w_1280/v1/flower_products/abc.mov',
    'no rendered width means the largest bucket'
  );
  assert.match(videoSrc(v, 480), /c_limit,w_640\//, 'a width snaps up to the next bucket, never down');
  assert.match(videoSrc(v, 640), /c_limit,w_640\//, 'an exact bucket width is used as-is');
  assert.match(videoSrc(v, 4000), /c_limit,w_1280\//, 'wider than the largest bucket is capped, not exceeded');
  // A locally hosted file has no transformation server behind it.
  assert.equal(videoSrc('/videos/clip.mp4', 320), '/videos/clip.mp4');
  assert.equal(videoSrc(null), '');
});

test('widthFromSizes reads the widest slot a next/image sizes attribute can describe', () => {
  assert.equal(widthFromSizes('72px'), 72);
  assert.equal(widthFromSizes('100vw'), 1440, 'vw resolves against the layout max width');
  assert.equal(widthFromSizes('(max-width: 768px) 100vw, 33vw'), 1440, 'the widest branch wins, not the last');
  assert.equal(widthFromSizes('(max-width: 768px) 50vw, 300px'), 720);
  assert.equal(widthFromSizes(undefined), undefined, 'nothing to read asks for the largest bucket');
});

const VARIANTS = [
  {
    colorVariants: [
      { colorName: 'White', isDefault: true, swatchImage: '/white-swatch.png' },
      {
        colorName: 'Red',
        galleryImages: [{ url: '/red-2.png' }, { url: '/red-primary.png', isPrimary: true }],
      },
      { colorName: 'Gold', hoverImage: '/gold-hover.png' },
    ],
  },
];

test('an order line shows the colour that was actually bought, not the first one on the product', () => {
  assert.equal(orderedItemImage(VARIANTS, 'Red'), '/red-primary.png', 'primary wins over gallery order');
  assert.equal(orderedItemImage(VARIANTS, 'White'), '/white-swatch.png', 'the swatch is a colour\'s main image');
  assert.equal(orderedItemImage(VARIANTS, 'Gold'), '/gold-hover.png', 'hover media is the last resort');
});

test('a colour that no longer exists falls back to the default, then to the first, then to nothing', () => {
  assert.equal(orderedItemImage(VARIANTS, 'Renamed'), '/white-swatch.png', 'White is isDefault');
  assert.equal(orderedItemImage(VARIANTS, null), '/white-swatch.png', 'no colour recorded on the line');
  assert.equal(orderedItemImage([{ colorVariants: [{ colorName: 'Blue', swatchImage: '/blue.png' }] }], 'Renamed'), '/blue.png');
  assert.equal(orderedItemImage([{ colorVariants: [{ colorName: 'Blue' }] }], 'Blue'), null, 'a colour with no media');
  assert.equal(orderedItemImage(null, 'Red'), null, 'products predating the variants JSON');
  assert.equal(orderedItemImage([], 'Red'), null);
});

test('a video swatch on an order line becomes its poster frame, never the clip', () => {
  const clip = 'https://res.cloudinary.com/x/video/upload/v1/flower_products/a.mp4';
  assert.equal(
    orderedItemImage([{ colorVariants: [{ colorName: 'Red', swatchImage: clip, galleryImages: [{ url: '/red.png' }] }] }], 'Red'),
    'https://res.cloudinary.com/x/video/upload/so_0,f_jpg/v1/flower_products/a.jpg'
  );
  assert.equal(
    orderedItemImage([{ colorVariants: [{ colorName: 'Red', swatchImage: '/local.mp4', galleryImages: [{ url: '/red.png' }] }] }], 'Red'),
    '/red.png',
    'no poster can be derived from a non-Cloudinary clip, so the gallery still is used'
  );
});
