import test from 'node:test';
import assert from 'node:assert/strict';
import { curatedRatingUpdate, productSchema, productToFormValues } from '../lib/validations/product';

/** A stored product with a curated rating, shaped like the row getProductById returns. */
const stored = {
  id: '6f1c2a7e-3b0d-4c55-9a51-2f0f1e9b8c11',
  name: 'Velvet Rose Box',
  slug: 'velvet-rose-box',
  sku: 'VRB-01',
  shortDescription: 'Preserved roses',
  description: null,
  country: null,
  categoryType: 'FLOWER',
  subcategoryId: null,
  status: 'PUBLISHED',
  isFeatured: false,
  isBestSeller: true,
  isTrending: false,
  isNewArrival: false,
  rating: 4.5,
  variants: [
    {
      id: 'v1',
      variantName: 'Classic',
      sku: 'VRB-01-C',
      description: null,
      productCare: { dos: [], donts: [] },
      isDefault: true,
      isActive: true,
      specifications: [],
      colorVariants: [
        {
          id: 'c1',
          colorName: 'Red',
          colorCode: '#A81E1E',
          price: 250,
          salePrice: null,
          swatchImage: null,
          hoverImage: null,
          isDefault: true,
          isActive: true,
          galleryImages: [],
        },
      ],
    },
  ],
} satisfies Parameters<typeof productToFormValues>[0];

/** What updateProduct writes for rating, for a given set of submitted form values. */
const ratingWrite = (formValues: Record<string, unknown>) => curatedRatingUpdate(productSchema.parse(formValues).rating);

test('the edit form starts from the stored curated rating (both edit views share this mapping)', () => {
  assert.equal(productToFormValues(stored).rating, 4.5);
  // Nothing curated: blank, which the schema reads as "use the real reviews".
  assert.equal(productToFormValues({ ...stored, rating: null }).rating, '');
});

test('editing another field keeps the existing curated rating', () => {
  const edited = { ...productToFormValues(stored), name: 'Velvet Rose Box — Large', description: 'Now larger' };
  assert.deepEqual(ratingWrite(edited), { rating: 4.5 });
});

test('a submission without a rating field leaves the stored rating untouched', () => {
  // The products-list ?edit= view used to build the form without `rating` at all.
  const { rating, ...withoutRating } = productToFormValues(stored);
  void rating;
  assert.deepEqual(ratingWrite({ ...withoutRating, name: 'Renamed' }), {});
});

test('the admin can still clear or change the rating explicitly', () => {
  const defaults = productToFormValues(stored);
  assert.deepEqual(ratingWrite({ ...defaults, rating: '' }), { rating: null });
  assert.deepEqual(ratingWrite({ ...defaults, rating: '3.5' }), { rating: 3.5 });
});
