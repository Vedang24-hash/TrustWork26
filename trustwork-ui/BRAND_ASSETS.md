# TrustWork Brand Assets Guide

This document outlines the usage guidelines for TrustWork's visual identity and brand assets.

---

## 🎨 Logo Files

### Available Formats

| File | Size | Usage |
|------|------|-------|
| `/public/logo.svg` | 120x120px | Full logo for marketing, documentation |
| `/public/logo-icon.svg` | 40x40px | Icon for navbar, favicons, app icons |
| `/public/favicon.svg` | 16x16px | Browser favicon |

### Logo Usage Guidelines

✅ **DO:**
- Use the full logo on landing pages and marketing materials
- Use the icon version in constrained spaces (navbar, mobile apps)
- Maintain clear space around the logo (minimum 8px)
- Use on dark backgrounds (primary usage)
- Scale proportionally

❌ **DON'T:**
- Distort or skew the logo
- Change the colors or gradient
- Add effects like drop shadows or outlines
- Use on light backgrounds without adjustment
- Place on busy backgrounds that reduce visibility

---

## 🎨 Color Palette

### Primary Colors

```css
--accent: #3b82f6;        /* Primary Blue */
--accent-hover: #2563eb;  /* Hover Blue */
--purple: #8b5cf6;        /* Secondary Purple */
```

**Usage:** Primary actions, links, accents, gradients

### Background Colors

```css
--bg: #080b14;            /* Main Background */
--bg-card: #0d1120;       /* Card Background */
--bg-elevated: #111827;   /* Elevated Elements */
```

**Usage:** Page backgrounds, cards, modals

### Text Colors

```css
--text-heading: #f1f5f9;  /* Headings */
--text: #94a3b8;          /* Body Text */
--text-muted: #475569;    /* Secondary Text */
```

**Usage:** All text content

### Semantic Colors

```css
--green: #10b981;         /* Success */
--red: #ef4444;           /* Error/Danger */
--yellow: #f59e0b;        /* Warning */
```

**Usage:** Status indicators, alerts, notifications

---

## 🖼️ Brand Elements

### Gradients

**Primary Gradient:**
```css
background: linear-gradient(135deg, #3b82f6, #8b5cf6);
```
**Usage:** Buttons, logos, accent elements

**Glow Effects:**
```css
box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
```
**Usage:** Interactive elements on hover

### Border Radius

```css
--radius: 12px;           /* Cards, Modals */
--radius-sm: 8px;         /* Buttons, Inputs */
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

---

## ✍️ Typography

### Font Family

**Primary Font:** Inter  
**Fallback:** system-ui, -apple-system, sans-serif

### Font Sizes

| Element | Size | Weight |
|---------|------|--------|
| H1 | 2rem-3.5rem (clamp) | 600 |
| H2 | 1.4rem-2rem (clamp) | 600 |
| H3 | 1.1rem | 600 |
| Body | 0.875rem-1rem | 400 |
| Small | 0.75rem-0.8rem | 400-500 |

---

## 🎭 Iconography

### Icon Style
- **Type:** Duotone/Line icons
- **Weight:** Medium (2px stroke)
- **Corners:** Rounded
- **Size:** 16px, 20px, 24px (multiples of 4px)

### Emoji Usage
Current implementation uses emojis for quick iconography:
- ⚡ - Logo/Brand
- 📋 - Dashboard
- ＋ - Create/Add
- ⚖️ - Arbitration
- 🔒 - Security
- ✅ - Success
- ❌ - Error

**Note:** Consider replacing with consistent icon set (Heroicons, Lucide) in future updates.

---

## 🎬 Animations & Transitions

### Transition Timing

```css
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Animation Duration
- **Micro-interactions:** 150-300ms
- **Page transitions:** 300-500ms
- **Loading states:** 800ms-2s

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 480px) { ... }

/* Tablet */
@media (max-width: 768px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

---

## 🖥️ Component Examples

### Primary Button
```jsx
<button className="btn btn-primary">
  Connect Wallet
</button>
```

### Card with Hover Effect
```jsx
<div className="card card-clickable">
  <h3>Contract Title</h3>
  <p>Contract details...</p>
</div>
```

### Glassmorphism Element
```jsx
<div className="glass">
  Semi-transparent elevated content
</div>
```

---

## 📦 Asset Export Guidelines

### For Developers

**SVG Logos:**
- Optimize with SVGO
- Inline for small icons (<2KB)
- External file for large illustrations

**PNG Exports:**
- @1x: Standard resolution
- @2x: Retina displays
- @3x: High-density mobile

### For Designers

**Figma/Sketch:**
- Export at 1x, 2x, 3x
- Use proper naming convention: `logo-icon@2x.png`
- Include color profiles (sRGB)

---

## 🚀 Implementation Checklist

When adding brand assets:

- [ ] SVG properly optimized
- [ ] Alt text provided for accessibility
- [ ] Responsive sizes defined
- [ ] Dark mode compatibility checked
- [ ] Loading states implemented
- [ ] Hover/active states styled
- [ ] Animation performance tested
- [ ] Cross-browser compatibility verified

---

## 📞 Brand Contact

For brand usage questions or custom asset requests:
- **GitHub Issues:** [Report Issue](https://github.com/Vedang24-hash/TrustWork26/issues)
- **Email:** [Your contact email]

---

## 📄 License

All brand assets are part of the TrustWork project and follow the MIT License.

**Last Updated:** January 2026  
**Version:** 1.0.0
