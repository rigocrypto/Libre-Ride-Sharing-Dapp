# Libre Design Guidelines

## Design Approach

**Miami Vice-City Neon Aesthetic** - Drawing inspiration from 1980s Miami vice aesthetics meets modern Web3 design, prioritizing visual impact and emotional engagement. This is an experience-focused application where the vibrant personality drives user adoption in a competitive ride-sharing market.

## Core Design Principles

1. **Neon Energy**: Bold, electric colors that command attention
2. **Glassmorphism Depth**: Layered transparency creates spatial hierarchy
3. **Confident Motion**: Purposeful animations that enhance, never distract
4. **Trust Through Clarity**: Safety-critical information always readable despite bold design

---

## Typography

**Primary Font**: Inter (Google Fonts)
- Headlines: 700 weight, tracking-tight
- Body: 400-500 weight
- UI Elements: 600 weight, uppercase for emphasis

**Type Scale**:
- Hero: text-6xl md:text-7xl lg:text-8xl
- Section Headers: text-4xl md:text-5xl
- Card Titles: text-2xl md:text-3xl
- Body: text-base md:text-lg
- UI Labels: text-sm uppercase tracking-wide

---

## Color System

**Primary Palette**:
- Hot Pink: `#ff2d92` - Primary CTAs, active states, surge indicators
- Miami Teal: `#02f7f3` - Secondary actions, success states, driver indicators
- Neon Purple: `#a020f0` - Accents, badges, premium features

**Gradients**:
- Hero: `linear-gradient(135deg, #ff2d92 0%, #a020f0 50%, #02f7f3 100%)`
- Cards: `linear-gradient(145deg, rgba(255,45,146,0.1) 0%, rgba(160,32,240,0.1) 100%)`
- Overlays: `linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)`

**Neutrals** (Dark Mode Focus):
- Background: `#0a0a0a`
- Surface: `#1a1a1a` with 40% opacity blur
- Borders: `rgba(255,255,255,0.1)`
- Text Primary: `#ffffff`
- Text Secondary: `rgba(255,255,255,0.7)`

---

## Spacing System

**Tailwind Units**: 4, 6, 8, 12, 16, 24, 32
- Component padding: p-6 to p-8
- Section spacing: py-16 md:py-24 lg:py-32
- Card gaps: gap-6 md:gap-8
- Button padding: px-8 py-4

---

## Component Library

### Navigation
- Fixed top navbar with glassmorphism (backdrop-blur-xl bg-black/40)
- Language toggle (EN/ES) top-right
- CTA buttons always visible
- Mobile: Hamburger menu with full-screen overlay

### Hero Section (Landing)
- Full viewport height (min-h-screen)
- Orlando skyline background image with gradient overlay
- Animated car SVG elements moving horizontally
- Centered headline with gradient text effect
- Dual CTAs: "Become a Driver" (hot pink) + "Request a Ride" (teal)
- Countdown widget below CTAs (glassmorphism card)

### Cards (Universal Pattern)
- Glassmorphism: `bg-white/5 backdrop-blur-lg border border-white/10`
- Rounded: rounded-2xl
- Padding: p-6 md:p-8
- Hover: Subtle lift with pink glow shadow
- Active rides: Pulsing teal border animation

### Map Interface (Rider/Driver)
- Full-width dark-styled Mapbox
- Glassmorphism controls overlaid on map
- Route line: Neon teal (#02f7f3) with glow effect
- Pickup pin: Hot pink marker
- Dropoff pin: Purple marker
- Disney Easter Egg: Mickey ears SVG replaces standard pin

### Ride Status Flow
- Progress bar with 5 stages (Matching → En-route → Arrived → On trip → Complete)
- Each stage icon with color: gray → teal → pink → purple → gradient
- Large status card center-screen with live driver photo/car details
- Bottom sheet (mobile) or sidebar (desktop) for controls

### Forms & Inputs
- Autocomplete fields: Glassmorphism with teal focus ring
- Icon prefixes (location, search) in muted teal
- Suggestions dropdown: Dark with white/10 borders
- Error states: Red-pink glow

### Buttons
**Primary** (Hot Pink):
- bg-[#ff2d92] with gradient on hover
- text-white font-semibold
- px-8 py-4 rounded-full
- Glow shadow on hover

**Secondary** (Teal):
- border-2 border-[#02f7f3] bg-transparent
- text-[#02f7f3] font-semibold
- px-8 py-4 rounded-full
- Fill with teal on hover

**Glass** (Overlaid on images):
- bg-white/10 backdrop-blur-md
- text-white font-semibold
- No hover interactions (rely on Button component's built-in states)

### Safety Elements
- SOS button: Fixed bottom-right, red with pulse animation
- Safety badge: Shield icon in teal
- Verification checkmarks: Teal with subtle glow

### Badges & NFTs
- Circular badges with gradient borders
- Achievement icons centered
- Stats below in small caps
- Grid layout: 2-3 columns on mobile, 4-6 on desktop

### Admin Dashboard
- Dark table with striped rows (white/5 alternating)
- Status pills: Small rounded-full badges with colors
- Metrics cards: Large numbers (text-5xl) with trend indicators
- Charts: Teal/pink dual-color scheme

---

## Layout Patterns

### Landing Page Structure
1. Hero (100vh) - Orlando skyline + animated cars
2. How It Works (3-column grid on desktop)
3. Driver Benefits (2-column split: image + features list)
4. Safety Features (centered cards with icons)
5. Waitlist CTA (full-width gradient section)
6. Footer (glassmorphism with links)

### Rider App Layout
- Top: Address inputs (pickup/dropoff)
- Center: Full-width map (60vh minimum)
- Bottom: Price estimate + surge indicator + CTA button
- Active ride: Map expands, bottom sheet with driver info

### Driver Dashboard Layout
- Top: Go Online toggle (large, centered)
- Main: Split view - map (left 60%) + ride requests (right 40%)
- Bottom: Earnings summary bar
- Mobile: Tabs for Map/Requests/Earnings

### Profile Page
- Hero card: Avatar + reputation score + level
- NFT badge grid
- Stats in 2-3 columns
- Referral link card (glassmorphism)

---

## Animation Guidelines

**Sparingly Used**:
- Hero car animations: Continuous horizontal translate
- Button hover: Gentle lift (translateY(-2px)) + glow
- Card hover: Subtle scale (1.02)
- Status transitions: Smooth color fade (300ms)
- Confetti: On ride completion only
- Pulse: SOS button, new ride notifications

**No Animation**:
- Page transitions
- Scroll effects
- Excessive parallax

---

## Images

### Hero Section
**Orlando Skyline**: Wide panoramic shot of Orlando at dusk/night with city lights. Purple-pink gradient overlay (40% opacity) to blend with neon theme. Image should be 1920x1080 minimum, positioned with object-position center.

### Driver Benefits Section
**Professional Driver**: Modern, diverse driver smiling in car with sunset/golden hour lighting. Should feel authentic, not stock. Used in 2-column layout next to feature list.

### About/Trust Section
**Fleet Collage**: Grid of 3-4 clean vehicles (sedans, SUVs) in urban Orlando settings. Subtle teal color grade to match brand.

**Placement**: All images use object-cover with rounded corners (rounded-2xl). Background images have gradient overlays for text readability.

---

## Mobile Optimization

- Sticky bottom action bar (z-50) for primary CTAs
- Collapsible map (swipe-up gesture)
- Larger touch targets (min 48px)
- Full-screen modals for critical actions
- Hamburger menu with slide-in drawer
- Ride status card: Bottom sheet pattern

---

## Accessibility

- WCAG AA contrast maintained despite neon colors (white text on dark backgrounds)
- Focus states: Teal ring (ring-2 ring-[#02f7f3])
- SOS button: Always visible, high contrast
- Screen reader labels on all interactive elements
- Keyboard navigation for all flows

---

**Design Philosophy**: Libre merges Web3 innovation with Miami's electric nightlife energy. Every interaction should feel premium, fast, and trustworthy—a ride-sharing experience that looks as cutting-edge as its blockchain foundation.