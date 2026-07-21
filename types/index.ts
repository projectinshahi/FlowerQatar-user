export interface ProductColor {
  name: string;
  hex: string;
  image?: string; // this color variant's primary image
  hoverImage?: string; // this color variant's secondary/hover image
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  collection: string; // e.g., 'le-mini', 'round', 'square', 'heart', 'custom', 'vases', 'gift-sets'
  boxShape?: 'Round' | 'Square' | 'Heart' | 'Custom';
  colors: ProductColor[];
  boxColors?: ProductColor[];
  quantities?: number[]; // Supported rose counts (e.g., [1, 4, 16, 25, 36])
  sizes?: string[]; // Legacy/alternative sizes
  image: string;
  hoverImage: string;
  images?: string[]; // Gallery images fallback
  badge?: string; // e.g. "Best Seller", "New"
  rating: number;
  reviewCount: number;
  description: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  categoryType?: string; // one of the six fixed CategoryType values (for shop category filtering)
  dimensions?: string;
  materials?: string;
  care?: string[];
}

export interface Collection {
  slug: string;
  name: string;
  description: string;
  image: string;
  isCustom?: boolean;
}

export interface BlogPost {
  slug: string;
  title: string;
  category: 'Gifting' | 'Weddings' | 'Decor' | 'Care' | 'Lifestyle';
  excerpt: string;
  content: string;
  image: string;
  readTime: string;
  date: string;
  author: string;
}

export interface PressMention {
  publication: string;
  quote: string;
  date: string;
  logo: string;
}
