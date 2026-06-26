# TrustWork Animation Guide

## 🎬 Scroll Animation Implementation

### Quick Start
All scroll animations are powered by the `useScrollAnimation` hook and work automatically when elements scroll into view.

### Usage Example

```jsx
import { useScrollAnimation, useStaggeredAnimation } from '../hooks/useScrollAnimation'

function MyComponent() {
  // Single element animation
  const anim = useScrollAnimation()
  
  return (
    <div 
      ref={anim.ref}
      className={`scroll-fade-in ${anim.inView ? 'visible' : ''}`}
    >
      Content here
    </div>
  )
}

// For lists/grids with staggered animation
function MyList({ items }) {
  return (
    <div>
      {items.map((item, index) => {
        const anim = useStaggeredAnimation(index, 100)
        return (
          <div
            key={item.id}
            ref={anim.ref}
            className={`scroll-fade-in ${anim.inView ? 'visible' : ''}`}
            style={anim.style}
          >
            {item.content}
          </div>
        )
      })}
    </div>
  )
}
```

## 🎨 Available Animation Classes

### 1. Fade In (Most Common)
```css
.scroll-fade-in
```
- Fades in while sliding up 30px
- Best for: Cards, sections, text blocks

### 2. Slide Left
```css
.scroll-slide-left
```
- Slides in from left (50px)
- Best for: Side panels, alternating content

### 3. Slide Right
```css
.scroll-slide-right
```
- Slides in from right (50px)
- Best for: Side panels, alternating content

### 4. Zoom In
```css
.scroll-zoom-in
```
- Scales from 0.8 to 1.0
- Best for: Hero elements, feature highlights

## 📍 Current Implementation

### Home Page
```
Hero Section (No animation - always visible)
  ↓
Features Grid
  → Card 1: 🔒 Escrow Protection (Fade-in, delay: 0ms)
  → Card 2: ⚡ Stellar Speed (Fade-in, delay: 150ms)
  → Card 3: ⚖️ Dispute Resolution (Fade-in, delay: 300ms)
  → Card 4: 🤖 Auto-Release (Fade-in, delay: 450ms) ✓
  ↓
How It Works Header (Fade-in)
  ↓
Steps Grid
  → Step 1: Connect Wallet (Zoom-in, delay: 0ms)
  → Step 2: Create Contract (Zoom-in, delay: 200ms)
  → Step 3: Work & Submit (Zoom-in, delay: 400ms)
  → Step 4: Approve & Pay (Zoom-in, delay: 600ms)
```

### Dashboard Page
```
Header (Fade-in)
  ↓
Stats Grid (Fade-in as group)
  ↓
Contract Cards (Staggered fade-in, 100ms delay each)
```

### CreateContract Page
```
Header (Fade-in)
  ↓
Form Card (Fade-in)
```

### Arbitration Page
```
Header (Fade-in)
  ↓
Contract Cards (Staggered fade-in, 100ms delay each)
```

### ContractDetail Page
```
Header (Fade-in)
  ↓
Escrow Visual (Zoom-in)
  ↓
Contract Details (Static)
```

## ⚙️ Configuration Options

### useScrollAnimation Options
```javascript
useScrollAnimation({
  threshold: 0.1,      // 0-1, how much visible before trigger
  triggerOnce: true,   // Only animate once
  delay: 0            // Delay in milliseconds
})
```

### useStaggeredAnimation Parameters
```javascript
useStaggeredAnimation(
  index,        // Item index in list
  staggerDelay  // Delay between items (ms)
)
```

## 🎯 Best Practices

1. **Use fade-in for most elements** - It's subtle and professional
2. **Zoom-in for important elements** - Like prices, CTAs, key stats
3. **Stagger delays for lists** - Creates a wave effect
4. **Keep delays short** - 100-200ms feels natural
5. **Don't over-animate** - Not everything needs animation

## 🚀 Performance Tips

- Animations use CSS transforms (GPU accelerated)
- IntersectionObserver is efficient (no scroll listeners)
- `triggerOnce: true` prevents repeated animations
- Animations are 0.6s - fast enough to feel smooth

## 🐛 Troubleshooting

### Animation doesn't trigger
- Check if element has both `scroll-*` class AND `visible` class
- Verify ref is attached to element
- Check threshold setting (increase if needed)

### Animation is jerky
- Element might be too large
- Try reducing transform distance
- Check for competing CSS animations

### Staggered animation not working
- Verify `style={animation.style}` is applied
- Check that index is correct
- Ensure each item has unique key

## 📱 Accessibility

Respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  .scroll-fade-in,
  .scroll-slide-left,
  .scroll-slide-right,
  .scroll-zoom-in {
    transition: none !important;
    transform: none !important;
  }
}
```

(Not yet implemented - add to index.css if needed)

## 🎉 Result

All pages now have smooth, professional animations that:
- ✅ Engage users as they scroll
- ✅ Don't hurt performance
- ✅ Feel native and smooth
- ✅ Work across all pages consistently
- ✅ Properly display Auto-Release feature inline
