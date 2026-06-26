# Venus et Fleur Clone — Luxury E-commerce Frontend

A complete, production-ready luxury e-commerce frontend clone of the renowned preserved flower brand **Venus et Fleur** (venusetfleur.com). Bootstrapped on Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4, this frontend is fully responsive across mobile, tablet, and desktop viewports.

---

## 🎨 Design System & Brand Identity

- **Colors**:
  - Primary Background: `#FFFFFF` (Pure white)
  - Secondary Background: `#FAF9F6` (Warm luxury cream)
  - Accent Color: `#D4AF37` (Soft champagne gold)
  - Text Primary: `#1A1A1A` (Near-black)
  - Text Secondary: `#6B6B6B` (Warm editorial gray)
  - Borders & Dividers: `#E8E8E8` (Light hairline gray)
- **Typography**:
  - Headlines: Elegant serif font loaded dynamically from Google Fonts (`Playfair Display`).
  - Body Copy: Clean sans-serif (`Inter`).
  - Luxury Spacing: Large spacing `tracking-[0.2em]` on uppercase tags and navigation tabs.
- **Animations**:
  - Smooth page transitions and exit-intent newsletter capture overlays using `Framer Motion`.
  - Image scaling on hover (`1.05x`) with 500ms ease-out transitions.
  - Custom golden cursor tracking desktop pointers.

---

## 📂 Project Structure

```txt
flower/
├── app/                      # Next.js App Router folders
│   ├── account/              # User Dashboard and Login panels
│   │   ├── login/            # /account/login Page
│   │   └── page.tsx          # /account Dashboard
│   ├── cart/                 # /cart Shopping Cart summary
│   ├── checkout/             # /checkout Stepped Form wizard
│   ├── collections/          # /collections Overview Directory
│   ├── custom/               # /custom Live preview arrangement builder
│   ├── journal/              # /journal Blog and post detail routing
│   │   ├── [slug]/           # /journal/[slug] post details
│   │   └── page.tsx          # /journal list view
│   ├── product/              # /product/[slug] details and swatches
│   │   └── [slug]/           # Product details page template
│   ├── search/               # /search Autocomplete query results
│   ├── care/                 # Care Guide page
│   ├── contact/              # Boutique locations and inquiries
│   ├── faq/                  # Support accordions page
│   ├── shipping-returns/     # Delivery fees and policies
│   ├── globals.css           # Tailwind v4 import and custom @theme classes
│   ├── layout.tsx            # Global layout wrappers and contexts
│   ├── loading.tsx           # Loader transitions
│   ├── error.tsx             # Error boundary
│   └── page.tsx              # Home Page landing
├── components/               # Shared reusable components
│   ├── Breadcrumbs.tsx       # Gold slash navigation trails
│   ├── CartDrawer.tsx        # Right slide-in Shopping Cart panel
│   ├── CustomCursor.tsx      # Gold point cursor math tracker
│   ├── Footer.tsx            # 4-column brand directories and links
│   ├── Header.tsx            # Sticky transparent header and search drawers
│   ├── NewsletterPopup.tsx   # Exit-intent email collectors
│   ├── ProductCard.tsx       # Catalog product cards with wishlist buttons
│   ├── QuickViewModal.tsx    # Radix overlay dialog for quick orders
│   └── ToastContainer.tsx    # Staggered toast overlay list
├── context/                  # Global Session Context
│   └── AppContext.tsx        # Cart additions, Wishlists, and Toast triggers
├── data/                     # Mock Catalogs
│   └── mockData.ts           # Product list, Rose swatches, Blog posts
├── package.json              # System dependencies
└── tsconfig.json             # TypeScript compiler rules
```

---

## 🛠️ Installation & Setup

1. **Install Node.js Dependencies**:
   Due to React 19's new dependency tree requirements, run the installation with `--legacy-peer-deps` to allow older component bindings to install smoothly:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run the Development Server**:
   Start the local dev environment:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

3. **Build the Production Bundle**:
   Verify types, static site compilation, and linting rules:
   ```bash
   npm run build
   ```
   Run the production build:
   ```bash
   npm run start
   ```

---

## ✨ Features Implemented

1. **Multi-step Visual Customizer**: Customers can design a custom rose box with live SVG renderings showing exact rose densities, custom lid parameters, and price calculations in real time.
2. **Dynamic Search**: Prominent auto-completing search triggers in the Header that suggest products and categories as you type.
3. **Cart & Wishlist drawers**: Persistent storage across pages using localStorage.
4. **Checkout Validation**: Stepped billing, shipping, and credit card inputs showing validation error text in red.
5. **SEO & Performance Optimization**: High-quality placeholder images (optimized), fast LCP loading above fold, responsive layouts, and proper heading hierarchy.
