import { Product } from '../types';

export const ROSE_COLORS = [
  { name: 'Classic Red', hex: '#B22222' },
  { name: 'Blush Pink', hex: '#FFB6C1' },
  { name: 'Pure White', hex: '#F8F9FA' },
  { name: 'Deep Black', hex: '#1A1A1A' },
  { name: 'Champagne Gold', hex: '#C9A96E' },
  { name: 'Soft Lavender', hex: '#E6E6FA' },
  { name: 'Burgundy Wine', hex: '#800020' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Dusty Rose', hex: '#DCAE9E' },
  { name: 'Peach', hex: '#FFDAB9' }
];

export const BOX_COLORS = [
  { name: 'Matte Black', hex: '#1A1A1A' },
  { name: 'Off-White Cream', hex: '#FAF9F6' },
  { name: 'Blush Pink Velvet', hex: '#FFE4E1' },
  { name: 'Champagne Gold Foil', hex: '#C9A96E' },
  { name: 'Emerald Suede', hex: '#0E2A1C' }
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-le-mini-round',
    slug: 'le-mini-round',
    name: 'Le Mini Round',
    price: 39,
    collection: 'le-mini',
    boxShape: 'Round',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [1],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.8,
    reviewCount: 142,
    description: 'A single, perfectly preserved Eternity® Rose housed in our signature Parisian-inspired mini round box. Compact, yet expressing timeless elegance.',
    dimensions: 'Box: 2" Diameter x 3" Height. Rose: 2" Diameter.',
    materials: 'Luxury textured paperboard box, real Ecuadorian rose preserved using proprietary natural oils.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.',
      'Dust lightly using a soft brush if needed.'
    ],
    isBestSeller: true
  },
  {
    id: 'prod-le-mini-square',
    slug: 'le-mini-square',
    name: 'Le Mini Square',
    price: 39,
    collection: 'le-mini',
    boxShape: 'Square',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [1],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.7,
    reviewCount: 98,
    description: 'A single breathtaking Eternity® Rose beautifully arranged in our sleek mini square box. The ultimate expression of sophisticated, modern charm.',
    dimensions: 'Box: 2" x 2" x 3". Rose: 2" Diameter.',
    materials: 'Luxury matte finish paperboard box, real Ecuadorian rose preserved using natural fluids.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.',
      'Dust lightly using a soft brush if needed.'
    ]
  },
  {
    id: 'prod-small-round',
    slug: 'small-round',
    name: 'Small Round Box',
    price: 149,
    collection: 'round',
    boxShape: 'Round',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [7],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.9,
    reviewCount: 88,
    description: 'Features 7 signature Ecuadorian Eternity® Roses curated in a beautiful, Parisian hatbox design. Ideal for console tables and small vanity settings.',
    dimensions: 'Box: 5" Diameter x 6" Height.',
    materials: 'Premium paperboard with gold foil branding, preserved flowers.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.'
    ]
  },
  {
    id: 'prod-small-square',
    slug: 'small-square',
    name: 'Small Square Box',
    price: 149,
    collection: 'square',
    boxShape: 'Square',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [9],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.8,
    reviewCount: 74,
    description: 'An elegant grid of 9 stunning preserved roses set in our structured mini-square hatbox. Perfect for minimalist and architectural interior schemes.',
    dimensions: 'Box: 4" x 4" x 5".',
    materials: 'Premium structured cardboard box, real Ecuadorian roses.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.'
    ]
  },
  {
    id: 'prod-classic-round-box',
    slug: 'classic-round-box',
    name: 'Classic Round Box',
    price: 299,
    originalPrice: 349,
    collection: 'round',
    boxShape: 'Round',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [18],
    sizes: ['Classic (18 Roses)', 'Grande (36 Roses)'],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    badge: 'Best Seller',
    rating: 4.9,
    reviewCount: 612,
    description: 'Our iconic, world-renowned arrangement. Features approximately 18 premium Ecuadorian Eternity® Roses individually set in our luxury round box.',
    dimensions: 'Box: 8" Diameter x 9" Height.',
    materials: 'French hatbox-inspired premium rigid paperboard, signature gold embossed details, real Ecuadorian roses.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.',
      'Dust lightly using a soft brush if needed.'
    ],
    isBestSeller: true
  },
  {
    id: 'prod-classic-square-box',
    slug: 'classic-square-box',
    name: 'Classic Square Box',
    price: 299,
    collection: 'square',
    boxShape: 'Square',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [16],
    sizes: ['Classic (16 Roses)', 'Grande (25 Roses)'],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    badge: 'Best Seller',
    rating: 4.9,
    reviewCount: 423,
    description: 'Clean-cut modern lines filled with lush preserved roses. Houses approximately 16 premium Ecuadorian Eternity® Roses, giving a structured, architectural appeal.',
    dimensions: 'Box: 7" x 7" x 8".',
    materials: 'Premium structured rigid paperboard box with hot-foil gold branding, hand-placed Ecuadorian roses.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.',
      'Dust lightly using a soft brush if needed.'
    ],
    isBestSeller: true
  },
  {
    id: 'prod-grande-round-box',
    slug: 'grande-round-box',
    name: 'Grande Round Box',
    price: 399,
    collection: 'round',
    boxShape: 'Round',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [36],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 5.0,
    reviewCount: 201,
    description: 'An absolutely grand statement. Houses approximately 36 large premium Ecuadorian Eternity® Roses. Designed to draw attention and elevate any master room.',
    dimensions: 'Box: 12" Diameter x 10" Height.',
    materials: 'French hatbox-inspired extra-thick premium rigid paperboard, gold foil print, real Ecuadorian roses.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.'
    ]
  },
  {
    id: 'prod-grande-square-box',
    slug: 'grande-square-box',
    name: 'Grande Square Box',
    price: 399,
    collection: 'square',
    boxShape: 'Square',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [25],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.8,
    reviewCount: 118,
    description: 'A spectacular, symmetrical masterwork. Incorporates 25 large premium Ecuadorian roses placed in a majestic square box structure.',
    dimensions: 'Box: 10" x 10" x 9".',
    materials: 'High-density rigid luxury container with satin texture finish, premium preserved Ecuadorian roses.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.'
    ]
  },
  {
    id: 'prod-small-heart-box',
    slug: 'small-heart-box',
    name: 'Small Eternity Heart Box',
    price: 199,
    collection: 'heart',
    boxShape: 'Heart',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [12],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    badge: 'Romantic',
    rating: 4.9,
    reviewCount: 304,
    description: 'Sculpted to symbolize deep romance. Our heart-shaped arrangement is hand-composed of approximately 12-14 roses to display affection in its most refined form.',
    dimensions: 'Box: 7.5" x 7" x 5".',
    materials: 'Luxury heart contour rigid container, high-density paperboard, real Ecuadorian preserved roses.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.'
    ],
    isBestSeller: true
  },
  {
    id: 'prod-large-heart-box',
    slug: 'large-heart-box',
    name: 'Large Eternity Heart Box',
    price: 349,
    collection: 'heart',
    boxShape: 'Heart',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [32],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 5.0,
    reviewCount: 82,
    description: 'An ultimate declaration of love. Houses 32-34 stunning luxury roses in a premium grand heart container. A majestic, striking showpiece.',
    dimensions: 'Box: 12" x 11.5" x 6.5".',
    materials: 'Luxury suede-feel thick board box, hand-pinned preserved real flowers.',
    care: [
      'Do not water the roses.',
      'Keep them in a cool, dry place away from direct sunlight.',
      'Do not remove the roses from their luxury box.'
    ]
  },
  {
    id: 'prod-le-clair-tresor',
    slug: 'le-clair-tresor',
    name: 'Le Clair Trésor',
    price: 129,
    originalPrice: 149,
    collection: 'gift-sets',
    boxShape: 'Square',
    colors: ROSE_COLORS,
    boxColors: [{ name: 'Acrylic Clear', hex: '#FFFFFF' }],
    quantities: [4],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png',
      '/images/product_master_1_1782290164345.png'
    ],
    badge: 'Popular',
    rating: 4.9,
    reviewCount: 167,
    description: 'A crystal-clear acrylic cube housing 4 perfectly preserved roses with a built-in pull drawer to store your jewelry, cosmetic pads, or keepsakes.',
    dimensions: 'Acrylic Case: 4" x 4" x 4".',
    materials: 'High-grade polished PMMA acrylic, real preserved Ecuadorian roses.',
    care: [
      'Do not expose to heavy moisture or alcohol sprays.',
      'Wipe acrylic surface gently with micro-fiber cloth.',
      'Do not remove the roses.'
    ]
  },
  {
    id: 'prod-le-clair-quinze',
    slug: 'le-clair-quinze',
    name: 'Le Clair Quinze',
    price: 289,
    collection: 'gift-sets',
    boxShape: 'Square',
    colors: ROSE_COLORS,
    boxColors: [{ name: 'Acrylic Clear', hex: '#FFFFFF' }],
    quantities: [15],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.8,
    reviewCount: 52,
    description: '15 beautiful preserved roses visible from all angles in a crystal-clear premium presentation acrylic box. Unmatched modern luxury design.',
    dimensions: 'Acrylic Case: 8.5" x 6.5" x 5.5".',
    materials: 'Premium polished acrylic, preserved eternity roses.',
    care: [
      'Avoid scratch-prone surfaces.',
      'Do not wash or spray water.',
      'Dust gently with dry microfiber.'
    ]
  },
  {
    id: 'prod-fleura-porcelain-vase',
    slug: 'fleura-porcelain-vase',
    name: 'Fleura Porcelain Vase',
    price: 189,
    collection: 'vases',
    boxShape: 'Custom',
    colors: ROSE_COLORS,
    boxColors: [{ name: 'Porcelain White', hex: '#FAF9F6' }],
    quantities: [6],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    badge: 'New',
    rating: 4.9,
    reviewCount: 45,
    description: 'Six premium preserved eternity roses set in a handcrafted, fine porcelain vase featuring elegant fluted details. Designed for formal tablescapes.',
    dimensions: 'Porcelain Vase: 4.5" Diameter x 7" Total Height.',
    materials: 'Hand-fired luxury porcelain clay, preserved real roses.',
    care: [
      'Handle vase with care to avoid chipping.',
      'Do not add water or keep in moist bathrooms.',
      'Keep away from heat sources.'
    ],
    isNew: true
  },
  {
    id: 'prod-le-mini-xo',
    slug: 'le-mini-xo',
    name: 'Le Mini "XO" Gift Set',
    price: 89,
    collection: 'gift-sets',
    boxShape: 'Custom',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [2],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.9,
    reviewCount: 91,
    description: 'A charming set featuring two individual Le Mini boxes forming the letter "XO", each housing a perfect rose. The ultimate cute romantic token.',
    dimensions: 'Set box: 6.5" x 3.5" x 3.5".',
    materials: 'Luxury cardbox, gold emboss, preserved roses.',
    care: [
      'Do not water.',
      'Keep in room temperature environment.'
    ]
  },
  {
    id: 'prod-le-mini-i-heart-u',
    slug: 'le-mini-i-heart-u',
    name: 'Le Mini "I Heart U" Set',
    price: 119,
    collection: 'gift-sets',
    boxShape: 'Custom',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [3],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    badge: 'New',
    rating: 5.0,
    reviewCount: 38,
    description: 'An elegant trio of mini boxes representing "I" "❤" "U". Expresses deep luxury romance across three perfectly color-coordinated roses.',
    dimensions: 'Trio layout: 10" x 3.5" x 3.5".',
    materials: 'Matte premium boxes, gold leaf accents, real Ecuadorian roses.',
    care: [
      'Handle with care.',
      'Keep away from high humidity.'
    ],
    isNew: true
  },
  {
    id: 'prod-luxury-suede-round',
    slug: 'luxury-suede-round',
    name: 'Suede Luxury Round',
    price: 329,
    collection: 'round',
    boxShape: 'Round',
    colors: ROSE_COLORS,
    boxColors: [{ name: 'Emerald Suede', hex: '#0E2A1C' }, { name: 'Matte Black Suede', hex: '#1A1A1A' }],
    quantities: [18],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.9,
    reviewCount: 54,
    description: 'Indulge in our classic round box crafted in rich, tactile luxury velvet suede fabric. Combines sensory texture with floral beauty.',
    dimensions: 'Box: 8" Diameter x 9" Height.',
    materials: 'Microfiber luxury suede wrap, premium structured core, Ecuadorian roses.',
    care: [
      'Do not expose suede wrap to liquids.',
      'Dust suede fabric with a dry lint roller or soft brush.'
    ]
  },
  {
    id: 'prod-luxury-suede-square',
    slug: 'luxury-suede-square',
    name: 'Suede Luxury Square',
    price: 329,
    collection: 'square',
    boxShape: 'Square',
    colors: ROSE_COLORS,
    boxColors: [{ name: 'Emerald Suede', hex: '#0E2A1C' }, { name: 'Matte Black Suede', hex: '#1A1A1A' }],
    quantities: [16],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.8,
    reviewCount: 46,
    description: 'An elegant square layout bound in plush premium suede. The geometric structures match the soft rose hues in a timeless format.',
    dimensions: 'Box: 7" x 7" x 8".',
    materials: 'Velvet suede board fabric, gold heat-stamp, preserved roses.',
    care: [
      'Keep away from wet surfaces.',
      'Clean suede with dry lint brush.'
    ]
  },
  {
    id: 'prod-thirteen-rose-heart',
    slug: 'thirteen-rose-heart',
    name: 'Thirteen Rose Heart',
    price: 179,
    collection: 'heart',
    boxShape: 'Heart',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [13],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.9,
    reviewCount: 110,
    description: 'Exactly 13 premium preserved roses arranged tightly in a romantic small heart container. Symbolizes loyalty and eternal love.',
    dimensions: 'Box: 6.5" x 6" x 4.5".',
    materials: 'Luxury textured paperboard, preserved roses.',
    care: [
      'Do not water the roses.',
      'Do not expose to sunlight.'
    ]
  },
  {
    id: 'prod-maison-porcelain-vase',
    slug: 'maison-porcelain-vase',
    name: 'Maison Porcelain Vase',
    price: 249,
    collection: 'vases',
    boxShape: 'Custom',
    colors: ROSE_COLORS,
    boxColors: [{ name: 'Porcelain White', hex: '#FAF9F6' }],
    quantities: [9],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 5.0,
    reviewCount: 22,
    description: 'A grander porcelain arrangement featuring 9 stunning large roses. Offers a classic, antique feel ideal for foyer entries or fireplace mantels.',
    dimensions: 'Porcelain Vase: 6" Diameter x 8.5" Total Height.',
    materials: 'Glazed fluted porcelain vase, Ecuadorian preserved roses.',
    care: [
      'Avoid dropped impacts on vase.',
      'Do not place in damp bathrooms.'
    ]
  },
  {
    id: 'prod-classic-candle-set',
    slug: 'classic-candle-set',
    name: 'Rose & Candle Gift Set',
    price: 159,
    collection: 'gift-sets',
    boxShape: 'Custom',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [4],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    badge: 'New',
    rating: 4.8,
    reviewCount: 19,
    description: 'A beautifully boxed gift pairing: four premium preserved roses and a hand-poured luxury soy candle scented with notes of damask rose, amber, and musk.',
    dimensions: 'Gift Box: 9.5" x 6" x 5.5". Candle: 8oz (45hr burn).',
    materials: 'Soy wax blend, premium scent oils, luxury box board, preserved roses.',
    care: [
      'Trim candle wick to 1/4" before lighting.',
      'Do not light candle near the preserved roses.',
      'Do not water the roses.'
    ],
    isNew: true
  },
  {
    id: 'prod-rose-care-spray',
    slug: 'rose-care-spray',
    name: 'Eternity® Rose Mist',
    price: 29,
    collection: 'gift-sets',
    boxShape: 'Custom',
    colors: [{ name: 'Neutral Scent', hex: '#FFFFFF' }],
    quantities: [1],
    image: '/images/product_master_1_1782290164345.png',
    hoverImage: '/images/product_master_1_1782290164345.png',
    images: [
      '/images/product_master_1_1782290164345.png'
    ],
    rating: 4.5,
    reviewCount: 138,
    description: 'Our proprietary rose scent spray. Rejuvenates the natural, subtle fragrance of your eternity roses. Formulated to be completely safe for preserved petals.',
    dimensions: 'Spray Bottle: 2oz (60ml).',
    materials: 'Natural rose essence, alcohol-free preservation mist agent.',
    care: [
      'Hold spray bottle 12 inches away from roses before misting.',
      'Use only once every 3-4 months.',
      'Do not saturate the petals.'
    ]
  },
  {
    id: 'prod-red-roses-classic',
    slug: 'red-roses-classic',
    name: 'Red Roses Elegance',
    price: 199,
    collection: 'red-roses',
    boxShape: 'Round',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [12],
    image: '/images/red rosses.png',
    hoverImage: '/images/red rosses.png',
    images: ['/images/red rosses.png'],
    rating: 4.9,
    reviewCount: 154,
    description: 'A beautiful bouquet of passionate red roses representing love and romance.',
    dimensions: 'Box: 8" Diameter.',
    materials: 'Premium preserved Ecuadorian red roses.',
    care: ['Do not water.', 'Keep away from direct sunlight.']
  },
  {
    id: 'prod-pink-roses-blush',
    slug: 'pink-roses-blush',
    name: 'Pink Roses Blush Box',
    price: 179,
    collection: 'pink-roses',
    boxShape: 'Square',
    colors: ROSE_COLORS,
    boxColors: BOX_COLORS,
    quantities: [16],
    image: '/images/rosses.png',
    hoverImage: '/images/rosses.png',
    images: ['/images/rosses.png'],
    rating: 4.8,
    reviewCount: 92,
    description: 'A delicate arrangement of soft pink roses, perfect for gentle affections and gratitude.',
    dimensions: 'Box: 7" x 7".',
    materials: 'Premium preserved Ecuadorian pink roses.',
    care: ['Do not water.', 'Keep away from direct sunlight.']
  },
  {
    id: 'prod-purple-orchids',
    slug: 'purple-orchids',
    name: 'Royal Purple Orchids',
    price: 249,
    collection: 'orchids',
    boxShape: 'Custom',
    colors: [{ name: 'Purple', hex: '#800080' }],
    boxColors: BOX_COLORS,
    quantities: [1],
    image: '/images/orchid.png',
    hoverImage: '/images/orchid.png',
    images: ['/images/orchid.png'],
    rating: 5.0,
    reviewCount: 65,
    description: 'Exotic and elegant, these purple orchids bring a touch of the tropics and profound luxury.',
    dimensions: 'Vase: 10" Height.',
    materials: 'Premium preserved orchids.',
    care: ['Do not water.', 'Keep away from direct sunlight.']
  },
  {
    id: 'prod-white-lilies',
    slug: 'white-lilies',
    name: 'Pure White Lilies',
    price: 229,
    collection: 'lilies',
    boxShape: 'Round',
    colors: [{ name: 'White', hex: '#FFFFFF' }],
    boxColors: BOX_COLORS,
    quantities: [6],
    image: '/images/lillies.png',
    hoverImage: '/images/lillies.png',
    images: ['/images/lillies.png'],
    rating: 4.7,
    reviewCount: 43,
    description: 'Crisp, pure white lilies symbolizing rebirth and purity. A stunning focal piece.',
    dimensions: 'Box: 9" Diameter.',
    materials: 'Premium preserved lilies.',
    care: ['Do not water.', 'Keep away from direct sunlight.']
  }
];
