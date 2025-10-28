# World Bank - Design Guidelines

## Design Approach

**Reference-Based + System Hybrid**: Drawing from premium digital banking leaders (Chase, Revolut, N26) combined with Material Design foundations. Focus on trust, clarity, and sophisticated financial data presentation.

**Core Principles**: Professional authority, security-first design, clear information hierarchy, premium feel without unnecessary decoration.

---

## Typography System

**Primary Font**: Inter (Google Fonts) - exceptional clarity for financial data
**Accent Font**: Outfit (Google Fonts) - premium headlines and CTAs

**Type Scale**:
- Hero Headlines: text-5xl to text-7xl, font-bold
- Section Headers: text-3xl to text-4xl, font-semibold
- Card Titles: text-xl, font-semibold
- Body Text: text-base, font-normal (Inter maintains readability at all sizes)
- Financial Data: text-lg to text-2xl, font-semibold (emphasis on numbers)
- Labels/Metadata: text-sm, font-medium
- Fine Print: text-xs

---

## Layout System

**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12, 16, 24
- Tight spacing (p-3, gap-3): Financial data rows, compact lists
- Standard spacing (p-6, gap-6): Cards, form fields
- Generous spacing (p-12, p-16): Section padding, feature showcases
- Hero/Major sections: py-24, py-32

**Grid Strategy**:
- Dashboard: 3-4 column grid (lg:grid-cols-3, xl:grid-cols-4) for account cards
- Features: 2-3 columns (md:grid-cols-2, lg:grid-cols-3)
- Mobile: Always single column with full-width cards

**Container Strategy**:
- Marketing pages: max-w-7xl
- Application dashboard: max-w-screen-2xl (wider for data visibility)
- Forms: max-w-2xl

---

## Component Architecture

### Navigation
**Top Navigation Bar**:
- Fixed header with backdrop blur effect
- Logo left, primary navigation center, account/notifications right
- Height: h-16 to h-20
- Shadow: subtle drop shadow for depth
- Sticky positioning for application views

**Dashboard Sidebar** (Application):
- w-64 fixed sidebar on desktop
- Collapsible to icons-only on tablet
- Off-canvas drawer on mobile
- Account selector at top, navigation items, support at bottom

### Hero Section
**Full-width hero** (h-[600px] to h-[700px]):
- Professional banking imagery: Modern glass building architecture, business handshake in sophisticated setting, or abstract financial data visualization
- Overlay gradient for text readability
- Headline + subheadline + dual CTAs (primary: "Open Account", secondary: "Explore Features")
- Trust indicators below CTAs: "FDIC Insured • 256-bit Encryption • 24/7 Support"
- Buttons with backdrop blur (bg-white/10 backdrop-blur-md) when over images

### Account Dashboard Cards
**Account Summary Cards**:
- Elevated cards with subtle shadow (shadow-md to shadow-lg)
- Padding: p-6
- Account name + balance (large, prominent typography)
- Mini chart/graph showing activity
- Quick action buttons at bottom
- Hover: slight scale and shadow increase

### Feature Showcase (Marketing)
**6-8 Key Feature Sections**:

1. **Global Transfers** - Split layout with transfer form mockup + supporting imagery
2. **Investment Trading** - Real-time chart visualization + portfolio cards
3. **Credit Cards** - Premium card designs (3D perspective cards with gradient shimmer)
4. **Multi-Currency Accounts** - Currency flags grid + exchange rate ticker
5. **Security Features** - Biometric icons + security badges + encryption visualization
6. **Mobile Banking** - Phone mockup showing app interface
7. **Wealth Management** - Portfolio performance graphs + advisor matching
8. **24/7 Support** - Chat interface mockup + support team imagery

Each section: py-24, alternating layouts (image-left, image-right), mix of 1-column and 2-column content.

### Transaction Lists
- Table-style on desktop (structured data: date, description, amount, category)
- Card-based on mobile (stacked information)
- Alternating row backgrounds for readability
- Status indicators (pending, completed, failed) with badges
- Sortable columns, filter buttons

### Form Components
**Input Fields**:
- Height: h-12
- Padding: px-4
- Border: border-2 with focus states
- Labels: text-sm font-medium, mb-2
- Helper text: text-xs below field

**CTAs**:
- Primary buttons: px-8, py-4, text-base font-semibold, rounded-lg
- Secondary buttons: border-2, same dimensions
- Icon buttons for quick actions: h-10 w-10, rounded-full

### Investment/Trading Interface
- Real-time chart area (h-80 to h-96)
- Buy/Sell panel (sticky sidebar or modal)
- Watchlist cards (compact, data-dense)
- Price ticker scrolling header

### Credit Card Section
**Card Display**:
- Large card mockups (w-80 h-48 approximate aspect)
- 3D perspective transforms on hover
- Glassmorphic card designs
- Benefits list in 2-column grid below cards

### Footer
**Comprehensive Banking Footer**:
- 4-column grid: Products, Resources, Company, Legal
- Newsletter signup form
- Security badges (FDIC, SSL, PCI Compliance)
- Social links + language selector
- Trust seals and regulatory information
- py-16 padding

---

## Images

**Hero Section**: Professional banking environment - sleek modern bank interior with glass walls, or diverse business professionals in collaborative setting, or abstract digital finance visualization with geometric patterns. Dimensions: 1920x700px minimum.

**Feature Sections**:
- Global Transfers: World map with connection lines, smartphone showing transfer
- Investment: Financial charts, trading floor, or professional analyzing data
- Credit Cards: Premium metal credit cards with elegant lighting
- Mobile App: iPhone/Android device mockups with app interface
- Security: Fingerprint scanner, shield icons, lock mechanisms
- Support: Professional support team in modern office

**Trust Elements**: Bank branch imagery, security certification logos, team photos showing diversity.

---

## Animations & Interactions

**Minimal, Purposeful Motion**:
- Smooth page transitions (no page load animations)
- Card hover: subtle scale (scale-105) + shadow enhancement
- Number counters for balances (count-up effect on load)
- Chart animations: smooth line drawing
- Button states: slight background shift, no complex effects
- Loading states: skeleton screens for data tables
- Toast notifications for transactions (slide-in from top-right)

**Absolutely Avoid**: Excessive parallax, page-wide scroll animations, distracting hero animations

---

## Accessibility & Quality

- Minimum touch targets: 44x44px (h-11 w-11)
- Focus indicators: thick focus rings (ring-4) with high contrast
- ARIA labels for all interactive elements
- Keyboard navigation throughout
- Screen reader friendly transaction tables
- Error states with clear messaging and icons
- Loading states with progress indicators

---

## Page Structure Blueprint

**Marketing Landing**:
1. Navigation
2. Hero (large image background)
3. Trust Bar (statistics: "$500B Assets • 10M Customers • 150 Countries")
4. Features Grid (Global Transfers, Investments, Cards)
5. Security Showcase
6. Mobile App Section
7. Testimonials (3-column grid)
8. Pricing/Account Types (comparison table)
9. CTA Section ("Open Your Account Today")
10. Footer

**Application Dashboard**:
1. Top Navigation
2. Sidebar Navigation
3. Account Overview (4-column card grid)
4. Recent Transactions (table)
5. Quick Actions (transfer, deposit, pay bills)
6. Performance Charts
7. Notifications Panel

Deliver a premium, trust-inspiring banking experience with data clarity and sophisticated visual refinement.