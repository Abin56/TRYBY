# DESIGN SYSTEM — Premium Dropshipping Platform
## "Apple-level design meets trending-product discovery"

**Version:** 1.0.0  
**Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion 11  
**Market:** India (INR ₹)  
**Theme:** Dark-only  
**References:** Apple.com, Linear.app, Stripe.com, Notion, Raycast

---

# SECTION 1: DESIGN TOKENS

## 1.1 globals.css — Complete CSS Custom Properties

```css
/* ============================================================
   globals.css — Design System Tokens
   Platform: Premium Dropshipping (Dark-only)
   ============================================================ */

@import "tailwindcss";

@layer base {
  :root {
    /* ─── CORE BRAND COLORS ─────────────────────────────────── */
    --color-bg:                  #0A0A0A;
    --color-surface:             #111111;
    --color-surface-raised:      #161616;
    --color-surface-overlay:     #1C1C1C;
    --color-surface-sunken:      #080808;

    /* ─── BORDER COLORS ─────────────────────────────────────── */
    --color-border:              #1F1F1F;
    --color-border-subtle:       #171717;
    --color-border-strong:       #2A2A2A;
    --color-border-focus:        #2563EB;
    --color-border-error:        #EF4444;
    --color-border-success:      #22C55E;

    /* ─── PRIMARY (BLUE) SCALE ──────────────────────────────── */
    --color-primary-50:          #EFF6FF;
    --color-primary-100:         #DBEAFE;
    --color-primary-200:         #BFDBFE;
    --color-primary-300:         #93C5FD;
    --color-primary-400:         #60A5FA;
    --color-primary-500:         #3B82F6;
    --color-primary-600:         #2563EB;
    --color-primary-700:         #1D4ED8;
    --color-primary-800:         #1E40AF;
    --color-primary-900:         #1E3A8A;
    --color-primary:             #2563EB;
    --color-primary-hover:       #1D4ED8;
    --color-primary-active:      #1E40AF;
    --color-primary-muted:       rgba(37, 99, 235, 0.12);
    --color-primary-glow:        rgba(37, 99, 235, 0.35);

    /* ─── TEXT COLORS ───────────────────────────────────────── */
    --color-text:                #FFFFFF;
    --color-text-secondary:      #9CA3AF;
    --color-text-tertiary:       #6B7280;
    --color-text-quaternary:     #4B5563;
    --color-text-disabled:       #374151;
    --color-text-inverse:        #0A0A0A;
    --color-text-link:           #60A5FA;
    --color-text-link-hover:     #93C5FD;

    /* ─── SEMANTIC COLORS ───────────────────────────────────── */
    --color-success:             #22C55E;
    --color-success-bg:          rgba(34, 197, 94, 0.10);
    --color-success-border:      rgba(34, 197, 94, 0.25);
    --color-success-text:        #4ADE80;

    --color-error:               #EF4444;
    --color-error-bg:            rgba(239, 68, 68, 0.10);
    --color-error-border:        rgba(239, 68, 68, 0.25);
    --color-error-text:          #F87171;

    --color-warning:             #F59E0B;
    --color-warning-bg:          rgba(245, 158, 11, 0.10);
    --color-warning-border:      rgba(245, 158, 11, 0.25);
    --color-warning-text:        #FCD34D;

    --color-info:                #3B82F6;
    --color-info-bg:             rgba(59, 130, 246, 0.10);
    --color-info-border:         rgba(59, 130, 246, 0.25);
    --color-info-text:           #60A5FA;

    /* ─── ACCENT / SPECIAL ──────────────────────────────────── */
    --color-trending:            #F97316;
    --color-trending-bg:         rgba(249, 115, 22, 0.12);
    --color-viral:               #A855F7;
    --color-viral-bg:            rgba(168, 85, 247, 0.12);
    --color-sale:                #EF4444;
    --color-sale-bg:             rgba(239, 68, 68, 0.12);
    --color-new:                 #22C55E;
    --color-new-bg:              rgba(34, 197, 94, 0.12);
    --color-verified:            #2563EB;
    --color-verified-bg:         rgba(37, 99, 235, 0.12);
    --color-star:                #F59E0B;
    --color-star-empty:          #374151;

    /* ─── GRADIENTS ─────────────────────────────────────────── */
    --gradient-hero:             linear-gradient(135deg, #0A0A0A 0%, #0F0F1A 50%, #0A0A0A 100%);
    --gradient-card:             linear-gradient(145deg, #161616 0%, #111111 100%);
    --gradient-primary:          linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    --gradient-primary-hover:    linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
    --gradient-shimmer:          linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
    --gradient-text-primary:     linear-gradient(135deg, #FFFFFF 0%, #9CA3AF 100%);
    --gradient-text-blue:        linear-gradient(135deg, #60A5FA 0%, #2563EB 100%);
    --gradient-surface-top:      linear-gradient(180deg, #161616 0%, #111111 100%);
    --gradient-overlay-bottom:   linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.95) 100%);
    --gradient-glow-primary:     radial-gradient(ellipse at center, rgba(37,99,235,0.20) 0%, transparent 70%);
    --gradient-glow-hero:        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 100%);

    /* ─── GLOW / SHADOW EFFECTS ─────────────────────────────── */
    --glow-primary-sm:           0 0 12px rgba(37, 99, 235, 0.40);
    --glow-primary-md:           0 0 24px rgba(37, 99, 235, 0.35);
    --glow-primary-lg:           0 0 48px rgba(37, 99, 235, 0.30);
    --glow-white-sm:             0 0 12px rgba(255, 255, 255, 0.08);
    --glow-card:                 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.40);
    --glow-trending:             0 0 20px rgba(249, 115, 22, 0.30);
    --glow-viral:                0 0 20px rgba(168, 85, 247, 0.30);

    /* ─── TYPOGRAPHY ─────────────────────────────────────────── */
    --font-sans:                 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono:                 'JetBrains Mono', 'Fira Code', monospace;

    --text-xs:                   0.75rem;     /* 12px */
    --text-sm:                   0.875rem;    /* 14px */
    --text-base:                 1rem;        /* 16px */
    --text-md:                   1.0625rem;   /* 17px */
    --text-lg:                   1.125rem;    /* 18px */
    --text-xl:                   1.25rem;     /* 20px */
    --text-2xl:                  1.5rem;      /* 24px */
    --text-3xl:                  1.875rem;    /* 30px */
    --text-4xl:                  2.25rem;     /* 36px */
    --text-5xl:                  3rem;        /* 48px */
    --text-6xl:                  3.75rem;     /* 60px */
    --text-7xl:                  4.5rem;      /* 72px */
    --text-8xl:                  6rem;        /* 96px */

    --font-normal:               400;
    --font-medium:               500;
    --font-semibold:             600;
    --font-bold:                 700;
    --font-extrabold:            800;

    --leading-none:              1;
    --leading-tight:             1.15;
    --leading-snug:              1.3;
    --leading-normal:            1.5;
    --leading-relaxed:           1.625;
    --leading-loose:             2;

    --tracking-tighter:          -0.05em;
    --tracking-tight:            -0.025em;
    --tracking-snug:             -0.015em;
    --tracking-normal:           0em;
    --tracking-wide:             0.025em;
    --tracking-wider:            0.05em;
    --tracking-widest:           0.1em;

    /* ─── SPACING ────────────────────────────────────────────── */
    --space-0:                   0px;
    --space-px:                  1px;
    --space-0_5:                 2px;
    --space-1:                   4px;
    --space-1_5:                 6px;
    --space-2:                   8px;
    --space-2_5:                 10px;
    --space-3:                   12px;
    --space-3_5:                 14px;
    --space-4:                   16px;
    --space-5:                   20px;
    --space-6:                   24px;
    --space-7:                   28px;
    --space-8:                   32px;
    --space-9:                   36px;
    --space-10:                  40px;
    --space-11:                  44px;
    --space-12:                  48px;
    --space-14:                  56px;
    --space-16:                  64px;
    --space-18:                  72px;
    --space-20:                  80px;
    --space-24:                  96px;
    --space-28:                  112px;
    --space-32:                  128px;
    --space-36:                  144px;
    --space-40:                  160px;
    --space-48:                  192px;
    --space-56:                  224px;
    --space-64:                  256px;

    /* ─── BORDER RADIUS ──────────────────────────────────────── */
    --radius-none:               0px;
    --radius-xs:                 2px;
    --radius-sm:                 4px;
    --radius-md:                 6px;
    --radius-lg:                 8px;
    --radius-xl:                 12px;
    --radius-2xl:                16px;
    --radius-3xl:                24px;
    --radius-4xl:                32px;
    --radius-full:               9999px;

    /* ─── SHADOWS ────────────────────────────────────────────── */
    --shadow-xs:                 0 1px 2px rgba(0, 0, 0, 0.40);
    --shadow-sm:                 0 2px 4px rgba(0, 0, 0, 0.50);
    --shadow-md:                 0 4px 12px rgba(0, 0, 0, 0.60);
    --shadow-lg:                 0 8px 24px rgba(0, 0, 0, 0.70);
    --shadow-xl:                 0 16px 48px rgba(0, 0, 0, 0.80);
    --shadow-2xl:                0 24px 64px rgba(0, 0, 0, 0.90);
    --shadow-card:               0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.60);
    --shadow-card-hover:         0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.70), var(--glow-primary-sm);
    --shadow-modal:              0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px rgba(0,0,0,0.90);
    --shadow-dropdown:           0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.80);
    --shadow-button-primary:     0 2px 8px rgba(37, 99, 235, 0.40);
    --shadow-button-primary-hover: 0 4px 16px rgba(37, 99, 235, 0.50);

    /* ─── ANIMATION DURATIONS ────────────────────────────────── */
    --duration-instant:          50ms;
    --duration-fast:             100ms;
    --duration-normal:           150ms;
    --duration-moderate:         200ms;
    --duration-slow:             300ms;
    --duration-slower:           400ms;
    --duration-sluggish:         500ms;
    --duration-crawl:            700ms;
    --duration-page:             800ms;

    /* ─── ANIMATION EASINGS ──────────────────────────────────── */
    --ease-linear:               linear;
    --ease-in:                   cubic-bezier(0.4, 0, 1, 1);
    --ease-out:                  cubic-bezier(0, 0, 0.2, 1);
    --ease-in-out:               cubic-bezier(0.4, 0, 0.2, 1);
    --ease-spring:               cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --ease-bounce:               cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-smooth:               cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --ease-expo-out:             cubic-bezier(0.19, 1, 0.22, 1);
    --ease-expo-in:              cubic-bezier(0.95, 0.05, 0.795, 0.035);

    /* ─── Z-INDEX SCALE ──────────────────────────────────────── */
    --z-below:                   -1;
    --z-base:                    0;
    --z-raised:                  10;
    --z-dropdown:                100;
    --z-sticky:                  200;
    --z-overlay:                 300;
    --z-modal:                   400;
    --z-toast:                   500;
    --z-tooltip:                 600;
    --z-top:                     9999;

    /* ─── BLUR TOKENS ────────────────────────────────────────── */
    --blur-none:                 blur(0px);
    --blur-xs:                   blur(2px);
    --blur-sm:                   blur(4px);
    --blur-md:                   blur(8px);
    --blur-lg:                   blur(16px);
    --blur-xl:                   blur(24px);
    --blur-2xl:                  blur(40px);
    --blur-navbar:               blur(20px);

    /* ─── LAYOUT ─────────────────────────────────────────────── */
    --container-sm:              640px;
    --container-md:              768px;
    --container-lg:              1024px;
    --container-xl:              1280px;
    --container-2xl:             1400px;
    --container-prose:           680px;

    --navbar-height:             64px;
    --navbar-height-mobile:      56px;
    --sidebar-width:             280px;
    --cart-drawer-width:         420px;
    --filter-drawer-width:       320px;
  }
}

/* ─── GLOBAL BASE STYLES ─────────────────────────────────────── */
@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
    border-color: var(--color-border);
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    scroll-behavior: smooth;
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    min-height: 100vh;
  }

  /* Selection */
  ::selection {
    background-color: var(--color-primary-muted);
    color: var(--color-text);
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--color-bg); }
  ::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: var(--radius-full); }
  ::-webkit-scrollbar-thumb:hover { background: var(--color-text-quaternary); }

  /* Focus ring — default hidden, visible on keyboard nav */
  :focus { outline: none; }
  :focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

/* ─── UTILITY CLASSES ────────────────────────────────────────── */
@layer utilities {
  .text-balance { text-wrap: balance; }
  .text-pretty { text-wrap: pretty; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* Glass morphism */
  .glass {
    background: rgba(17, 17, 17, 0.80);
    backdrop-filter: var(--blur-navbar);
    -webkit-backdrop-filter: var(--blur-navbar);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Gradient text */
  .gradient-text {
    background: var(--gradient-text-blue);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Glow effects */
  .glow-primary { box-shadow: var(--glow-primary-md); }
  .glow-primary-sm { box-shadow: var(--glow-primary-sm); }
  .glow-primary-lg { box-shadow: var(--glow-primary-lg); }
  .glow-card { box-shadow: var(--shadow-card); }
  .glow-card-hover { box-shadow: var(--shadow-card-hover); }

  /* Shimmer animation */
  .shimmer {
    background: linear-gradient(
      90deg,
      var(--color-surface) 0%,
      var(--color-surface-raised) 50%,
      var(--color-surface) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Marquee */
  @keyframes marquee-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  @keyframes marquee-right {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }

  .animate-marquee {
    animation: marquee-left 35s linear infinite;
  }

  .animate-marquee-reverse {
    animation: marquee-right 35s linear infinite;
  }

  .marquee-wrapper:hover .animate-marquee,
  .marquee-wrapper:hover .animate-marquee-reverse {
    animation-play-state: paused;
  }

  /* Float animation */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }

  .animate-float {
    animation: float 4s var(--ease-in-out) infinite;
  }

  /* Glow pulse */
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }

  .animate-glow-pulse {
    animation: glow-pulse 3s var(--ease-in-out) infinite;
  }

  /* Count-up number */
  @keyframes count-up {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
}
```

---

## 1.2 tailwind.config.ts — Complete Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        bg:               'var(--color-bg)',
        surface:          'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        'surface-overlay':'var(--color-surface-overlay)',
        'surface-sunken': 'var(--color-surface-sunken)',

        // Borders
        border:           'var(--color-border)',
        'border-subtle':  'var(--color-border-subtle)',
        'border-strong':  'var(--color-border-strong)',
        'border-focus':   'var(--color-border-focus)',
        'border-error':   'var(--color-border-error)',
        'border-success': 'var(--color-border-success)',

        // Primary palette
        primary: {
          DEFAULT:   'var(--color-primary)',
          50:        'var(--color-primary-50)',
          100:       'var(--color-primary-100)',
          200:       'var(--color-primary-200)',
          300:       'var(--color-primary-300)',
          400:       'var(--color-primary-400)',
          500:       'var(--color-primary-500)',
          600:       'var(--color-primary-600)',
          700:       'var(--color-primary-700)',
          800:       'var(--color-primary-800)',
          900:       'var(--color-primary-900)',
          hover:     'var(--color-primary-hover)',
          active:    'var(--color-primary-active)',
          muted:     'var(--color-primary-muted)',
        },

        // Text
        text: {
          DEFAULT:    'var(--color-text)',
          secondary:  'var(--color-text-secondary)',
          tertiary:   'var(--color-text-tertiary)',
          quaternary: 'var(--color-text-quaternary)',
          disabled:   'var(--color-text-disabled)',
          inverse:    'var(--color-text-inverse)',
          link:       'var(--color-text-link)',
        },

        // Semantic
        success:    'var(--color-success)',
        error:      'var(--color-error)',
        warning:    'var(--color-warning)',
        info:       'var(--color-info)',

        // Special
        trending:   'var(--color-trending)',
        viral:      'var(--color-viral)',
        sale:       'var(--color-sale)',
        star:       'var(--color-star)',
      },

      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },

      fontSize: {
        xs:   ['var(--text-xs)',  { lineHeight: 'var(--leading-normal)' }],
        sm:   ['var(--text-sm)',  { lineHeight: 'var(--leading-normal)' }],
        base: ['var(--text-base)',{ lineHeight: 'var(--leading-normal)' }],
        md:   ['var(--text-md)', { lineHeight: 'var(--leading-normal)' }],
        lg:   ['var(--text-lg)', { lineHeight: 'var(--leading-snug)' }],
        xl:   ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
        '2xl':['var(--text-2xl)',{ lineHeight: 'var(--leading-tight)' }],
        '3xl':['var(--text-3xl)',{ lineHeight: 'var(--leading-tight)' }],
        '4xl':['var(--text-4xl)',{ lineHeight: 'var(--leading-tight)' }],
        '5xl':['var(--text-5xl)',{ lineHeight: 'var(--leading-none)' }],
        '6xl':['var(--text-6xl)',{ lineHeight: 'var(--leading-none)' }],
        '7xl':['var(--text-7xl)',{ lineHeight: 'var(--leading-none)' }],
        '8xl':['var(--text-8xl)',{ lineHeight: 'var(--leading-none)' }],
      },

      spacing: {
        '0.5':   '2px',
        '1':     '4px',
        '1.5':   '6px',
        '2':     '8px',
        '2.5':   '10px',
        '3':     '12px',
        '3.5':   '14px',
        '4':     '16px',
        '5':     '20px',
        '6':     '24px',
        '7':     '28px',
        '8':     '32px',
        '9':     '36px',
        '10':    '40px',
        '11':    '44px',
        '12':    '48px',
        '14':    '56px',
        '16':    '64px',
        '18':    '72px',
        '20':    '80px',
        '24':    '96px',
        '28':    '112px',
        '32':    '128px',
        '36':    '144px',
        '40':    '160px',
        '48':    '192px',
        '56':    '224px',
        '64':    '256px',
        '72':    '288px',
        '80':    '320px',
        '96':    '384px',
        'navbar':  'var(--navbar-height)',
        'sidebar': 'var(--sidebar-width)',
      },

      borderRadius: {
        none:  'var(--radius-none)',
        xs:    'var(--radius-xs)',
        sm:    'var(--radius-sm)',
        md:    'var(--radius-md)',
        lg:    'var(--radius-lg)',
        xl:    'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        '4xl': 'var(--radius-4xl)',
        full:  'var(--radius-full)',
      },

      boxShadow: {
        xs:                'var(--shadow-xs)',
        sm:                'var(--shadow-sm)',
        md:                'var(--shadow-md)',
        lg:                'var(--shadow-lg)',
        xl:                'var(--shadow-xl)',
        '2xl':             'var(--shadow-2xl)',
        card:              'var(--shadow-card)',
        'card-hover':      'var(--shadow-card-hover)',
        modal:             'var(--shadow-modal)',
        dropdown:          'var(--shadow-dropdown)',
        'button-primary':  'var(--shadow-button-primary)',
        'button-primary-hover': 'var(--shadow-button-primary-hover)',
        'glow-primary':    'var(--glow-primary-md)',
        'glow-primary-sm': 'var(--glow-primary-sm)',
        'glow-primary-lg': 'var(--glow-primary-lg)',
        'glow-trending':   'var(--glow-trending)',
        'glow-viral':      'var(--glow-viral)',
      },

      backgroundImage: {
        'gradient-hero':    'var(--gradient-hero)',
        'gradient-card':    'var(--gradient-card)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-shimmer': 'var(--gradient-shimmer)',
        'gradient-text':    'var(--gradient-text-primary)',
        'gradient-text-blue':'var(--gradient-text-blue)',
        'gradient-overlay': 'var(--gradient-overlay-bottom)',
        'gradient-glow':    'var(--gradient-glow-primary)',
        'gradient-glow-hero':'var(--gradient-glow-hero)',
      },

      transitionDuration: {
        instant:  'var(--duration-instant)',
        fast:     'var(--duration-fast)',
        normal:   'var(--duration-normal)',
        moderate: 'var(--duration-moderate)',
        slow:     'var(--duration-slow)',
        slower:   'var(--duration-slower)',
        sluggish: 'var(--duration-sluggish)',
        crawl:    'var(--duration-crawl)',
      },

      transitionTimingFunction: {
        spring:    'var(--ease-spring)',
        bounce:    'var(--ease-bounce)',
        smooth:    'var(--ease-smooth)',
        'expo-out':'var(--ease-expo-out)',
        'expo-in': 'var(--ease-expo-in)',
      },

      zIndex: {
        below:    'var(--z-below)',
        base:     'var(--z-base)',
        raised:   'var(--z-raised)',
        dropdown: 'var(--z-dropdown)',
        sticky:   'var(--z-sticky)',
        overlay:  'var(--z-overlay)',
        modal:    'var(--z-modal)',
        toast:    'var(--z-toast)',
        tooltip:  'var(--z-tooltip)',
        top:      'var(--z-top)',
      },

      backdropBlur: {
        xs:     '2px',
        sm:     '4px',
        md:     '8px',
        lg:     '16px',
        xl:     '24px',
        '2xl':  '40px',
        navbar: '20px',
      },

      animation: {
        shimmer:          'shimmer 1.8s ease-in-out infinite',
        'marquee-left':   'marquee-left 35s linear infinite',
        'marquee-right':  'marquee-right 35s linear infinite',
        float:            'float 4s ease-in-out infinite',
        'glow-pulse':     'glow-pulse 3s ease-in-out infinite',
        'count-up':       'count-up 0.4s ease-out forwards',
        'fade-in':        'fadeIn 0.3s ease-out forwards',
        'slide-up':       'slideUp 0.4s ease-out forwards',
        'scale-in':       'scaleIn 0.3s ease-out forwards',
      },

      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'marquee-left': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-right': {
          '0%':   { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%':      { opacity: '1', transform: 'scale(1.05)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },

      screens: {
        xs:  '375px',
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl':'1400px',
      },

      maxWidth: {
        prose:  'var(--container-prose)',
        sm:     'var(--container-sm)',
        md:     'var(--container-md)',
        lg:     'var(--container-lg)',
        xl:     'var(--container-xl)',
        '2xl':  'var(--container-2xl)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

# SECTION 2: TYPOGRAPHY SYSTEM

## 2.1 Font Choices and Reasoning

### Inter — Primary UI Font
- **Why Inter:** Designed specifically for computer screens. Optimized at small sizes, excellent legibility in dark backgrounds, neutral personality that doesn't compete with content, used by Linear, Vercel, Stripe, GitHub. Variable font axes allow weight interpolation without layout shift.
- **Weights used:** 400 (body), 500 (medium/labels), 600 (semibold/headings), 700 (bold/CTAs), 800 (extrabold/hero)
- **Axes:** `wght` 100–900, `opsz` 14–32 (optical sizing at large display)

### JetBrains Mono — Code / Technical
- **Why JetBrains Mono:** Superior legibility for tracking numbers (prices, order IDs, product SKUs). Ligatures for technical content. Used in order confirmation codes, promo code inputs, SKU displays.
- **Weights used:** 400, 500, 700

### Font Loading Strategy

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  adjustFontFallback: true,   // auto adjusts fallback to minimize CLS
  axes: ['opsz'],             // load optical sizing axis
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,             // not critical path
  fallback: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

---

## 2.2 Full Type Scale Table

| Token      | Size px | Size rem | Weight | Line-height | Letter-spacing | Use Case |
|------------|---------|----------|--------|-------------|----------------|----------|
| `text-xs`  | 12px    | 0.75rem  | 400    | 1.5 (normal)| 0em            | Captions, legal text, timestamps, badge labels |
| `text-sm`  | 14px    | 0.875rem | 400    | 1.5         | 0em            | Secondary body, form labels, nav links, card meta |
| `text-base`| 16px    | 1rem     | 400    | 1.5         | 0em            | Body copy, product descriptions, default UI text |
| `text-md`  | 17px    | 1.0625rem| 500    | 1.5         | -0.01em        | Emphasized body, feature list items |
| `text-lg`  | 18px    | 1.125rem | 500    | 1.3 (snug)  | -0.015em       | Sub-headings, card titles, prominent labels |
| `text-xl`  | 20px    | 1.25rem  | 600    | 1.3         | -0.02em        | Section sub-headings, price displays (lg) |
| `text-2xl` | 24px    | 1.5rem   | 600    | 1.15 (tight)| -0.025em       | Card headings, small section titles |
| `text-3xl` | 30px    | 1.875rem | 700    | 1.15        | -0.03em        | Section headings (H2 on mobile) |
| `text-4xl` | 36px    | 2.25rem  | 700    | 1.1         | -0.035em       | Section headings (H2 on desktop), PDP product name |
| `text-5xl` | 48px    | 3rem     | 800    | 1.0 (none)  | -0.04em        | Hero sub-heading, feature highlights |
| `text-6xl` | 60px    | 3.75rem  | 800    | 1.0         | -0.045em       | Hero headline (mobile) |
| `text-7xl` | 72px    | 4.5rem   | 800    | 1.0         | -0.05em        | Hero headline (desktop) |
| `text-8xl` | 96px    | 6rem     | 800    | 1.0         | -0.05em        | Display text, reserved for hero numbers |

---

## 2.3 Heading Hierarchy Rules

```
H1 — One per page. Hero page title or primary page name.
     Size: 7xl (desktop) / 6xl (mobile)
     Weight: 800 (extrabold)
     Color: #FFFFFF
     Letter-spacing: -0.05em
     Max-width: 900px, text-balance

H2 — One per major section. Section titles in content areas.
     Size: 4xl (desktop) / 3xl (mobile)
     Weight: 700 (bold)
     Color: #FFFFFF
     Letter-spacing: -0.035em
     Max-width: 600px

H3 — Sub-sections within H2 sections. Card titles when prominent.
     Size: 2xl (desktop) / xl (mobile)
     Weight: 600 (semibold)
     Color: #FFFFFF
     Letter-spacing: -0.025em

H4 — Tertiary headings, sidebar titles, filter group labels
     Size: lg
     Weight: 600
     Color: #FFFFFF

H5 — Rarely used. Micro-section labels.
     Size: base
     Weight: 600
     Color: #9CA3AF (secondary)
     Letter-spacing: 0.05em (widest — treated as label/overline)
     Text-transform: uppercase

H6 — Avoid. Use a label pattern instead.
```

---

## 2.4 Responsive Typography Rules

| Token       | Mobile (375px) | Tablet (768px) | Desktop (1280px) |
|-------------|----------------|----------------|------------------|
| Display H1  | `text-6xl` / 60px | `text-6xl` / 60px | `text-7xl` / 72px |
| Hero Sub    | `text-3xl` / 30px | `text-4xl` / 36px | `text-5xl` / 48px |
| Section H2  | `text-3xl` / 30px | `text-3xl` / 30px | `text-4xl` / 36px |
| Card H3     | `text-xl` / 20px  | `text-xl` / 20px  | `text-2xl` / 24px |
| Body        | `text-base` / 16px| `text-base` / 16px| `text-base` / 16px|
| Small body  | `text-sm` / 14px  | `text-sm` / 14px  | `text-sm` / 14px  |
| Caption     | `text-xs` / 12px  | `text-xs` / 12px  | `text-xs` / 12px  |
| Price large | `text-3xl` / 30px | `text-3xl` / 30px | `text-4xl` / 36px |
| Price mid   | `text-xl` / 20px  | `text-xl` / 20px  | `text-2xl` / 24px |
| Nav links   | `text-base` / 16px| `text-sm` / 14px  | `text-sm` / 14px  |

---

## 2.5 Text Color Pairings

| Background Token     | Hex      | Primary Text | Secondary Text | Disabled Text | Notes |
|----------------------|----------|--------------|----------------|---------------|-------|
| `--color-bg`         | #0A0A0A  | #FFFFFF (4.5:1+) | #9CA3AF (3.2:1) | #374151 | Main page background |
| `--color-surface`    | #111111  | #FFFFFF      | #9CA3AF        | #374151       | Card background |
| `--color-surface-raised` | #161616 | #FFFFFF   | #9CA3AF        | #4B5563       | Elevated cards |
| `--color-surface-overlay` | #1C1C1C | #FFFFFF  | #9CA3AF        | #4B5563       | Modals, dropdowns |
| `--color-primary`    | #2563EB  | #FFFFFF      | rgba(255,255,255,0.75) | — | Button text on primary bg |

---

## 2.6 Maximum Line Lengths

| Font Size | Characters per line | Tailwind class  | Reasoning |
|-----------|---------------------|-----------------|-----------|
| 12px (xs) | 90 chars max        | `max-w-prose`   | Dense text, small size reads wide |
| 14px (sm) | 80 chars max        | `max-w-2xl`     | Standard label/secondary text |
| 16px (base)| 70 chars max       | `max-w-prose`   | Optimal for reading comprehension |
| 18px (lg) | 65 chars max        | `max-w-xl`      | Sub-heading level |
| 24px (2xl)| 50 chars max        | `max-w-lg`      | Card headings |
| 30px+ (3xl+)| 40 chars max      | `max-w-md`      | Section headings — use text-balance |

---

# SECTION 3: COLOR SYSTEM

## 3.1 Complete Color Palette

### Neutrals (Brand Backgrounds)
| Token                    | Hex       | Usage |
|--------------------------|-----------|-------|
| `--color-bg`             | #0A0A0A   | Page background — darkest layer |
| `--color-surface`        | #111111   | Card background — primary surface |
| `--color-surface-raised` | #161616   | Elevated cards, hovered cards |
| `--color-surface-overlay`| #1C1C1C   | Modals, dropdowns, tooltips |
| `--color-surface-sunken` | #080808   | Input backgrounds, inset areas |

### Borders
| Token                  | Hex / Alpha       | Usage |
|------------------------|-------------------|-------|
| `--color-border`       | #1F1F1F           | Default card borders, dividers |
| `--color-border-subtle`| #171717           | Subtle separators |
| `--color-border-strong`| #2A2A2A           | Emphasized dividers, table borders |
| `--color-border-focus` | #2563EB           | Focus rings, active inputs |
| `--color-border-error` | #EF4444           | Error state inputs |
| `--color-border-success`| #22C55E          | Success state inputs |

### Primary Blue Scale
| Token                   | Hex       | Usage |
|-------------------------|-----------|-------|
| `--color-primary-50`    | #EFF6FF   | Not used (light mode only) |
| `--color-primary-100`   | #DBEAFE   | Not used (light mode only) |
| `--color-primary-200`   | #BFDBFE   | Not used (light mode only) |
| `--color-primary-300`   | #93C5FD   | Not used (light mode only) |
| `--color-primary-400`   | #60A5FA   | Link colors, text on dark bg |
| `--color-primary-500`   | #3B82F6   | Secondary blue uses |
| `--color-primary-600`   | #2563EB   | PRIMARY — buttons, active states |
| `--color-primary-700`   | #1D4ED8   | Button hover state |
| `--color-primary-800`   | #1E40AF   | Button active/pressed state |
| `--color-primary-muted` | rgba(37,99,235,0.12) | Badge backgrounds, highlights |
| `--color-primary-glow`  | rgba(37,99,235,0.35) | Glow effects |

### Text Colors
| Token                    | Hex       | Contrast on #0A0A0A | Usage |
|--------------------------|-----------|---------------------|-------|
| `--color-text`           | #FFFFFF   | 21:1                | Primary text, headings |
| `--color-text-secondary` | #9CA3AF   | 5.6:1               | Secondary text, labels, meta |
| `--color-text-tertiary`  | #6B7280   | 3.3:1               | Placeholder text (use sparingly) |
| `--color-text-quaternary`| #4B5563   | 2.2:1               | Disabled labels (use disabled attribute) |
| `--color-text-disabled`  | #374151   | 1.8:1               | Disabled form text — decorative only |
| `--color-text-link`      | #60A5FA   | 4.1:1               | Inline links |
| `--color-text-link-hover`| #93C5FD   | 6.1:1               | Hovered links |

### Semantic Colors
| Token                 | Hex       | Background              | Border                    | Text      |
|-----------------------|-----------|-------------------------|---------------------------|-----------|
| `--color-success`     | #22C55E   | rgba(34,197,94,0.10)    | rgba(34,197,94,0.25)      | #4ADE80   |
| `--color-error`       | #EF4444   | rgba(239,68,68,0.10)    | rgba(239,68,68,0.25)      | #F87171   |
| `--color-warning`     | #F59E0B   | rgba(245,158,11,0.10)   | rgba(245,158,11,0.25)     | #FCD34D   |
| `--color-info`        | #3B82F6   | rgba(59,130,246,0.10)   | rgba(59,130,246,0.25)     | #60A5FA   |

### Special / Accent Colors
| Token               | Hex       | Background              | Usage |
|---------------------|-----------|-------------------------|-------|
| `--color-trending`  | #F97316   | rgba(249,115,22,0.12)   | Trending badges, fire icon |
| `--color-viral`     | #A855F7   | rgba(168,85,247,0.12)   | Viral product badges |
| `--color-sale`      | #EF4444   | rgba(239,68,68,0.12)    | Sale price, discount badge |
| `--color-new`       | #22C55E   | rgba(34,197,94,0.12)    | New arrival badge |
| `--color-verified`  | #2563EB   | rgba(37,99,235,0.12)    | Verified seller badge |
| `--color-star`      | #F59E0B   | —                       | Star ratings (filled) |
| `--color-star-empty`| #374151   | —                       | Star ratings (empty) |

---

## 3.2 Semantic Color System Explanation

The color system has three layers:

**Layer 1 — Structural Colors:** `bg`, `surface`, `surface-raised`, `surface-overlay`. These define physical space — how far from the viewer a surface appears. Darker = further back. Use in strict order: never place a `surface` on top of `surface-raised`.

**Layer 2 — Semantic Colors:** `success`, `error`, `warning`, `info`. Always applied as a triad: bg color (10% alpha fill), border color (25% alpha), and text color (high-lightness variant). Never use just one of the three.

**Layer 3 — Accent Colors:** `trending`, `viral`, `sale`, `new`. Product personality colors. Applied only to badges and highlights, never to full backgrounds or large areas.

---

## 3.3 Color Usage Rules

**ALWAYS:**
- Use `--color-text` (#FFFFFF) for all primary readable text
- Use `--color-text-secondary` (#9CA3AF) for supporting metadata
- Use `--color-primary` (#2563EB) for a single primary CTA per view
- Use border tokens from the border scale for all borders
- Apply semantic colors as bg+border+text triads together

**NEVER:**
- Use white backgrounds or light surfaces (dark-only system)
- Place `--color-text-tertiary` on `--color-bg` for readable text (fails AA)
- Use more than one accent color per product card
- Use `--color-viral` (#A855F7) and `--color-trending` (#F97316) on the same element
- Use `--color-primary` for decorative elements — it signals interactivity
- Apply gradients on small elements under 24px height
- Use `--color-star` (#F59E0B) for anything other than ratings

---

## 3.4 Dark-Only System

This platform is dark-only. Reasons:
1. **Brand positioning:** Premium electronics and gadget-adjacent products read more trustworthy and desirable on dark backgrounds (Apple Space Black, premium tech aesthetic)
2. **Performance:** No flash of light mode during hydration, no color-scheme media query complexity
3. **OLED savings:** True black (#0A0A0A) saves ~20% battery on AMOLED displays (primary Indian smartphone screens)
4. **Consistency:** No CSS variable duplication for two themes — all tokens have a single value, making maintenance simpler

**Constraints of dark-only:**
- All imagery must render well on dark backgrounds. Use product images with transparent or dark backgrounds.
- Third-party widgets (payment gateways, maps) must be styled or sandboxed to prevent white-bg flash
- `color-scheme: dark` must be set in `<meta>` and `:root` to prevent browser UI conflicts
- Print stylesheet must override to light mode: `@media print { background: white; color: black; }`

---

## 3.5 Contrast Ratios (WCAG AA)

| Foreground          | Background           | Ratio  | WCAG AA Pass? |
|---------------------|----------------------|--------|---------------|
| #FFFFFF (text)      | #0A0A0A (bg)         | 21.0:1 | Pass (AAA)    |
| #FFFFFF (text)      | #111111 (surface)    | 18.4:1 | Pass (AAA)    |
| #FFFFFF (text)      | #2563EB (primary)    | 4.9:1  | Pass (AA)     |
| #9CA3AF (secondary) | #0A0A0A (bg)         | 5.6:1  | Pass (AA)     |
| #9CA3AF (secondary) | #111111 (surface)    | 4.9:1  | Pass (AA)     |
| #60A5FA (link)      | #0A0A0A (bg)         | 4.1:1  | Pass (AA)     |
| #6B7280 (tertiary)  | #0A0A0A (bg)         | 3.3:1  | FAIL — do not use for text |
| #4ADE80 (success)   | #0A0A0A (bg)         | 8.7:1  | Pass (AAA)    |
| #F87171 (error)     | #0A0A0A (bg)         | 5.2:1  | Pass (AA)     |
| #FCD34D (warning)   | #0A0A0A (bg)         | 10.2:1 | Pass (AAA)    |
| #F97316 (trending)  | #0A0A0A (bg)         | 4.5:1  | Pass (AA)     |
| #F59E0B (star)      | #111111 (surface)    | 6.1:1  | Pass (AA)     |

**Note:** `--color-text-tertiary` (#6B7280) FAILS WCAG AA on dark backgrounds. It must only be used for placeholder text inside form inputs (decorative, not informational) and only when the empty state is obvious from context.

---

## 3.6 Gradient Catalog

| Name                  | CSS Value | Use |
|-----------------------|-----------|-----|
| `gradient-hero`       | `linear-gradient(135deg, #0A0A0A 0%, #0F0F1A 50%, #0A0A0A 100%)` | Hero section background |
| `gradient-card`       | `linear-gradient(145deg, #161616 0%, #111111 100%)` | Premium card backgrounds |
| `gradient-primary`    | `linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)` | Primary button fill |
| `gradient-primary-hover` | `linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)` | Primary button hover |
| `gradient-shimmer`    | `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)` | CTA shimmer sweep, skeleton |
| `gradient-text-white` | `linear-gradient(135deg, #FFFFFF 0%, #9CA3AF 100%)` | Gradient heading text effect |
| `gradient-text-blue`  | `linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)` | Accent heading gradient |
| `gradient-overlay-bottom` | `linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.95) 100%)` | Image overlay for text legibility |
| `gradient-overlay-top` | `linear-gradient(0deg, transparent 0%, rgba(10,10,10,0.60) 100%)` | Top image overlay |
| `gradient-glow-hero`  | `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 100%)` | Hero top glow bloom |
| `gradient-glow-primary` | `radial-gradient(ellipse at center, rgba(37,99,235,0.20) 0%, transparent 70%)` | Button glow bloom |

---

## 3.7 Glow Effects Catalog

| Name                | Box-shadow Value | Use |
|---------------------|-----------------|-----|
| `glow-primary-sm`   | `0 0 12px rgba(37,99,235,0.40)` | Small button glow |
| `glow-primary-md`   | `0 0 24px rgba(37,99,235,0.35)` | Card on hover, active input |
| `glow-primary-lg`   | `0 0 48px rgba(37,99,235,0.30)` | Hero element glow |
| `glow-white-sm`     | `0 0 12px rgba(255,255,255,0.08)` | Subtle white glow on dark elements |
| `glow-card`         | `0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.40)` | Resting card shadow |
| `glow-card-hover`   | `0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.70), 0 0 12px rgba(37,99,235,0.30)` | Hovered card |
| `glow-trending`     | `0 0 20px rgba(249,115,22,0.30)` | Trending product highlight |
| `glow-viral`        | `0 0 20px rgba(168,85,247,0.30)` | Viral product highlight |
| `glow-toast-success`| `0 0 16px rgba(34,197,94,0.20)` | Success toast notification |
| `glow-toast-error`  | `0 0 16px rgba(239,68,68,0.20)` | Error toast notification |

---

## 3.8 Color for State Variants

| Element        | Default                        | Hover                          | Active/Pressed                | Disabled                     | Focus                              | Error                         | Success                        |
|----------------|--------------------------------|--------------------------------|-------------------------------|------------------------------|------------------------------------|-------------------------------|-------------------------------|
| Primary Button | bg:#2563EB, text:#FFF          | bg:#1D4ED8, translateY(-1px)   | bg:#1E40AF, scale(0.98)       | bg:#1F2937, text:#4B5563     | ring-2 ring-primary offset-2       | —                             | bg:#16A34A (momentary)         |
| Ghost Button   | bg:transparent, text:#FFF      | bg:rgba(255,255,255,0.06)      | bg:rgba(255,255,255,0.10)     | text:#4B5563                 | ring-2 ring-white/20 offset-2      | —                             | —                              |
| Outline Button | border:#2A2A2A, text:#FFF      | border:#2563EB, bg:primary-muted| border:#1D4ED8               | border:#1F1F1F, text:#4B5563 | ring-2 ring-primary offset-2       | —                             | —                              |
| Input field    | border:#1F1F1F, bg:#080808     | border:#2A2A2A                 | —                             | bg:#0D0D0D, text:#374151     | border:#2563EB, shadow:glow-primary| border:#EF4444, bg:error-bg   | border:#22C55E, bg:success-bg  |
| Card           | shadow:card, border:#1F1F1F    | shadow:card-hover, translateY(-2px) | shadow:card, translateY(0)| opacity:0.5                  | ring-2 ring-primary/40             | —                             | —                              |
| Checkbox       | border:#2A2A2A, bg:#080808     | border:#2563EB                 | —                             | opacity:0.4                  | ring-2 ring-primary offset-1       | border:#EF4444                | border:#22C55E                 |
| Link           | text:#60A5FA                   | text:#93C5FD, underline        | text:#3B82F6                  | text:#4B5563                 | ring-1 ring-primary/40 rounded-xs  | —                             | —                              |
| Wishlist Btn   | text:#6B7280 (outline heart)   | text:#EF4444, scale(1.1)       | scale(0.9)                    | opacity:0.4                  | ring-2 ring-primary offset-2       | —                             | text:#EF4444, fill (toggled)   |
| Cart Icon      | text:#9CA3AF                   | text:#FFF, scale(1.05)         | scale(0.95)                   | opacity:0.4                  | ring-2 ring-primary offset-2       | —                             | badge bounce spring            |
| Select         | border:#1F1F1F, bg:#080808     | border:#2A2A2A                 | —                             | opacity:0.5                  | border:#2563EB, shadow:glow-primary| border:#EF4444                | —                              |
| Radio Button   | border:#2A2A2A, bg:transparent | border:#2563EB                 | —                             | opacity:0.4                  | ring-2 ring-primary offset-1       | border:#EF4444                | —                              |
| Toggle/Switch  | bg:#1F2937 (off)               | bg:#374151 (off hover)         | scale(0.97)                   | opacity:0.4                  | ring-2 ring-primary offset-1       | —                             | bg:#2563EB (on state)          |

---

# SECTION 4: SPACING & LAYOUT SYSTEM

## 4.1 8px Base Grid

All spacing values are multiples of 8px (4px half-steps allowed for tight UI).

```
4px   (space-1)  — minimum gap: icon padding, badge padding
8px   (space-2)  — tight: icon-to-text, tag spacing
12px  (space-3)  — snug: input internal padding-x, small card padding
16px  (space-4)  — base: default padding, list item gap
24px  (space-6)  — comfortable: card padding sm, form field gap
32px  (space-8)  — spacious: card padding md
40px  (space-10) — open: card padding lg
48px  (space-12) — section inner padding-y
64px  (space-16) — large section gap
80px  (space-20) — section-y padding desktop
96px  (space-24) — large section-y (hero, featured)
128px (space-32) — hero padding-y
```

Rule: Only deviate with 2px or 4px adjustments for optical corrections.

---

## 4.2 Section Vertical Rhythm Rules

| Section Type            | pad-top desktop | pad-bot desktop | pad-top mobile | pad-bot mobile |
|-------------------------|-----------------|-----------------|----------------|----------------|
| Hero                    | 128px           | 128px           | 80px           | 80px           |
| Primary content section | 96px            | 96px            | 64px           | 64px           |
| Secondary section       | 80px            | 80px            | 48px           | 48px           |
| Tight section           | 64px            | 64px            | 40px           | 40px           |
| Divider band            | 48px            | 48px            | 32px           | 32px           |
| Footer                  | 64px            | 40px            | 48px           | 32px           |
| Navbar                  | 0               | 0               | 0              | 0              |

Sections butt together with 0 gap. Use background color changes to visually separate sections.

---

## 4.3 Container Widths and Horizontal Padding

| Breakpoint | Screen  | Container Max-W | H-Padding    | Columns |
|------------|---------|-----------------|--------------|---------|
| xs         | 375px   | 100%            | 16px (px-4)  | 4       |
| sm         | 640px   | 100%            | 24px (px-6)  | 8       |
| md         | 768px   | 100%            | 32px (px-8)  | 8       |
| lg         | 1024px  | 1024px          | 40px (px-10) | 12      |
| xl         | 1280px  | 1280px          | 48px (px-12) | 12      |
| 2xl        | 1400px  | 1400px          | 48px (px-12) | 12      |

```tsx
// Container className:
"mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12"
```

Special containers:
- `max-w-prose` (680px) — article body, PDP description
- `max-w-2xl` (672px) — newsletter, auth pages, centered modals
- `max-w-4xl` (896px) — checkout, account dashboard
- Full-bleed — hero background, review marquee, category banner

---

## 4.4 12-Column Grid System

```
Breakpoint | Cols | Col-W   | Gutter | Margin
-----------|------|---------|--------|-------
xs (375px) |  4   | ~75px   | 16px   | 16px
sm (640px) |  8   | ~65px   | 16px   | 24px
md (768px) |  8   | ~77px   | 24px   | 32px
lg (1024px)|  12  | ~68px   | 24px   | 40px
xl (1280px)|  12  | ~86px   | 32px   | 48px
```

Common layouts:
```
Product grid desktop:  4 cols — each span-3
Product grid tablet:   2 cols — each span-4
Product grid mobile:   2 cols — each span-2

PDP desktop: Gallery span-7, Purchase span-5
PDP tablet:  Gallery span-8, Purchase span-4
PDP mobile:  Gallery span-full then Purchase span-full (stacked)

With sidebar desktop: Sidebar span-3, Content span-9
With sidebar mobile:  Sidebar as drawer, Content span-full
```

---

## 4.5 Card Inner Spacing Rules

| Card Size | Padding    | Element gap | Image aspect |
|-----------|------------|-------------|--------------|
| sm        | 12px (p-3) | 8px (gap-2) | 1:1          |
| md        | 16px (p-4) | 12px (gap-3)| 4:3 or 1:1   |
| lg        | 24px (p-6) | 16px (gap-4)| 16:9 or 4:3  |
| xl        | 32px (p-8) | 20px (gap-5)| 16:9         |

Product card anatomy (top to bottom):

```
[Image — aspect-square]
[16px padding-x, 12px padding-top]
[Badge row — gap-2 between badges]
[8px gap]
[Product name — text-base font-medium, 2 lines max, line-clamp-2]
[4px gap]
[Price row — current price + compare-at price]
[8px gap]
[Star rating row — stars + review count]
[12px gap]
[Add to cart button — full width h-9]
[16px padding-x, 16px padding-bottom]
```

---

## 4.6 Icon-to-Text Spacing Rules

| Icon Size | Gap to text | Context |
|-----------|-------------|---------|
| 14px      | 4px (gap-1) | Caption row |
| 16px      | 6px (gap-1.5) | Label/secondary text |
| 20px      | 8px (gap-2) | Body text, nav items |
| 24px      | 10px (gap-2.5) | Feature list, prominent labels |
| 32px      | 12px (gap-3) | Feature cards, large callouts |

Icon and text: always vertically centered with `items-center`. Icon color should match or be slightly dimmer than accompanying text.

---

## 4.7 List Item Spacing Rules

| List Type        | Item gap   | Internal padding |
|------------------|------------|------------------|
| Navigation links | 2px        | 8px v, 12px h    |
| Feature list     | 12px       | 0                |
| Settings list    | 2px        | 12px v, 16px h   |
| Order item list  | 16px       | 16px             |
| FAQ accordion    | 4px        | 16px v, 0 h      |
| Breadcrumb       | 8px        | 0                |
| Footer links     | 8px        | 4px v, 0 h       |

---

## 4.8 Form Field Spacing Rules

```
Label to input gap:           8px  (mb-2 on label)
Input height sm:              36px (h-9)
Input height md (default):    40px (h-10)
Input height lg:              48px (h-12)
Input horizontal padding:     12px (px-3)
Input horizontal padding lg:  16px (px-4)

Field to next field:          20px (space-y-5)
Field group to next group:    32px (space-y-8)
Error message below input:    6px  (mt-1.5)
Helper text below input:      6px  (mt-1.5)
Submit button gap from last field: 24px (mt-6)
```

---

## 4.9 Page-Level Spacing

```
Navbar height desktop:        64px (sticky, glass morphism)
Navbar height mobile:         56px (sticky, glass morphism)
Content top offset:           64px (padding-top to clear navbar)
Footer top padding:           64px
Footer bottom padding:        40px
Section gap:                  0px (sections butt together)
Sidebar width:                280px
Cart drawer width:            420px desktop / 100vw mobile
Filter drawer width:          320px mobile bottom sheet
Modal max-width sm:           480px
Modal max-width md:           560px
Modal max-width lg:           720px
```

---

## 4.10 Key Page Grid Wireframe Descriptions

### Homepage Layout
```
┌────────────────────────────────────────────────────────────┐
│ NAVBAR [64px, sticky, glass]                               │
├────────────────────────────────────────────────────────────┤
│ HERO [min-h:100vh, 2-col split]                           │
│  Left 6cols: eyebrow tag / H1 / body copy / CTA buttons   │
│  Right 6cols: floating product image                       │
├────────────────────────────────────────────────────────────┤
│ TRENDING CAROUSEL [96px pad]                               │
│  Section heading + "View all" link                         │
│  4 product cards, horizontal scroll on mobile              │
├────────────────────────────────────────────────────────────┤
│ PROBLEM SOLVERS [96px pad, 3-col grid]                     │
│  [Feature card 1] [Feature card 2] [Feature card 3]        │
├────────────────────────────────────────────────────────────┤
│ VIRAL PRODUCTS [96px pad, masonry 2-col]                   │
│  [Large card 6col] [Small card 3col] [Small card 3col]     │
│  [Small card 3col] [Small card 3col] [Large card 6col]     │
├────────────────────────────────────────────────────────────┤
│ WHY US [96px pad, 4-col trust signals]                     │
│  [Delivery] [Returns] [Security] [Support]                 │
├────────────────────────────────────────────────────────────┤
│ REVIEWS MARQUEE [80px pad, full-bleed]                     │
│  Row 1: ←←← review cards scrolling left ←←←              │
│  Row 2: →→→ review cards scrolling right →→→              │
├────────────────────────────────────────────────────────────┤
│ NEWSLETTER [96px pad, centered max-w-2xl]                  │
│  Heading / sub / email input / subscribe button            │
├────────────────────────────────────────────────────────────┤
│ FOOTER [64px/40px, 4-col + bottom bar]                     │
└────────────────────────────────────────────────────────────┘
```

### Product Listing Page
```
┌────────────────────────────────────────────────────────────┐
│ NAVBAR                                                     │
├──────────┬─────────────────────────────────────────────────┤
│ SIDEBAR  │ PRODUCT GRID                                    │
│ 280px    │ 4-col desktop / 2-col tablet / 2-col mobile     │
│          │                                                 │
│ Filters  │ [card][card][card][card]                        │
│ Category │ [card][card][card][card]                        │
│ Price    │ [card][card][card][card]                        │
│ Brand    │                                                 │
│ Rating   │ [PAGINATION centered]                           │
│ Color    │                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

### Product Detail Page (above fold)
```
┌────────────────────────────────────────────────────────────┐
│ NAVBAR                                                     │
├──────────────────────────┬─────────────────────────────────┤
│ GALLERY (7 of 12 cols)   │ PURCHASE BOX (5 of 12 cols)    │
│                          │                                 │
│ [Main image 500px tall]  │ Brand name (text-sm secondary)  │
│                          │ Product H1 (text-2xl bold)      │
│ [Thumb][Thumb][Thumb]    │ ★★★★☆ 4.8 (2,341 reviews)     │
│                          │ ─────────────────────────────   │
│                          │ ₹1,499  ~~₹2,999~~  -50% off   │
│                          │ or ₹125/month no-cost EMI       │
│                          │                                 │
│                          │ Color: [●Blue][○Red][○Green]    │
│                          │ Size: [S][M][L][XL]             │
│                          │                                 │
│                          │ Qty: [−][1][+]                  │
│                          │ [Add to Cart — full width]      │
│                          │ [Buy Now — full width, outline] │
│                          │                                 │
│                          │ [🚚 Free delivery by Thu]       │
│                          │ [↩ 30-day easy returns]        │
│                          │ [🔒 Secure payment]            │
└──────────────────────────┴─────────────────────────────────┘
```

---

# SECTION 5: COMPONENT SPECIFICATIONS

## 5.1 Button

### Visual Description
Tall enough for touch targets (min 40px default, 48px on lg). Rounded corners (radius-lg = 8px). Primary draws most attention; ghost is lowest priority.

### All Variants

**Primary Button**
```tsx
// Base (shared across all buttons):
const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg \
transition-all duration-150 ease-out cursor-pointer select-none \
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary \
focus-visible:ring-offset-2 focus-visible:ring-offset-bg \
disabled:pointer-events-none disabled:opacity-40"

// Sizes:
const sm = "h-9 px-4 text-sm"
const md = "h-10 px-5 text-sm"   // default
const lg = "h-12 px-6 text-base"

// Primary color:
const primary = "bg-primary text-white shadow-button-primary \
hover:bg-primary-hover hover:-translate-y-px hover:shadow-button-primary-hover \
active:bg-primary-active active:translate-y-0 active:scale-[0.98]"
```

**Outline Button**
```tsx
"border border-border-strong bg-transparent text-text \
hover:border-primary hover:bg-primary-muted \
active:scale-[0.98]"
```

**Ghost Button**
```tsx
"bg-transparent text-text border-transparent \
hover:bg-white/[0.06] active:bg-white/[0.10] active:scale-[0.98]"
```

**Destructive Button**
```tsx
"bg-error text-white shadow-[0_2px_8px_rgba(239,68,68,0.40)] \
hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(239,68,68,0.50)] \
active:bg-red-700 active:scale-[0.98]"
```

**Shimmer Button (hero CTA only)**
```tsx
// Wrap in overflow-hidden div. Inside button:
// <span className="absolute inset-0 bg-gradient-shimmer animate-shimmer" />
// <span className="relative z-10">{label}</span>
// Do NOT use on more than one element per page.
```

**Icon-only Button**
```tsx
// sm: h-8 w-8 p-0 rounded-lg  → 14px icon inside
// md: h-10 w-10 p-0 rounded-lg → 16px icon inside
// lg: h-12 w-12 p-0 rounded-xl → 20px icon inside
// MUST have aria-label
```

**Loading state**
```tsx
// Add aria-busy="true", replace text with spinner
// "h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin"
// Keep button width stable with min-w to prevent layout shift
```

**Animation**
```ts
const buttonVariants = {
  initial: { scale: 1, y: 0 },
  hover:   { scale: 1.01, y: -1, transition: { duration: 0.10, ease: 'easeOut' } },
  tap:     { scale: 0.98, y: 0,  transition: { duration: 0.05, ease: 'easeOut' } }
}
```

**Accessibility**
- All buttons: visible text or `aria-label` for icon-only
- Minimum tap target: 44×44px
- Use `disabled` attribute, not just CSS
- Loading: `aria-busy="true"` + `aria-label="Loading..."`
- Use `<button>` element, never `<div>` or `<a>` for actions

**DO / DON'T**
```
DO:   One Primary per view | Ghost for tertiary | 2-4 word labels | Include loading spinner
DONT: Two Primaries side-by-side | All-caps text | Shimmer outside hero | Varying button width
```

---

## 5.2 Input Field

```tsx
// Base:
"w-full rounded-lg bg-surface-sunken text-text text-sm border border-border \
transition-all duration-150 placeholder:text-text-tertiary \
focus:outline-none focus:ring-0 focus:border-border-focus \
focus:shadow-[0_0_0_3px_var(--color-primary-muted)] \
disabled:pointer-events-none disabled:opacity-50"

// sm: "h-9 px-3 text-xs" | md: "h-10 px-3 text-sm" | lg: "h-12 px-4 text-base"

// Error state: "border-border-error focus:border-border-error focus:shadow-[0_0_0_3px_var(--color-error-bg)]"
// Success:     "border-border-success focus:border-border-success focus:shadow-[0_0_0_3px_var(--color-success-bg)]"
```

With label and error:
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-text">
    Email <span className="text-error ml-1">*</span>
  </label>
  <input type="email" aria-invalid={hasError} aria-describedby="email-error" />
  {hasError && (
    <p id="email-error" className="text-xs text-error-text flex items-center gap-1.5 mt-1.5">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Valid email required
    </p>
  )}
</div>
```

With prefix icon:
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
  <input className="pl-9 [base classes]" />
</div>
```

**Rules:** Always show label above input. Show error on blur, not onChange. Use `font-mono` for promo codes, OTP, SKUs.

---

## 5.3 Textarea

```tsx
"w-full rounded-lg bg-surface-sunken text-text text-sm border border-border \
px-3 py-2.5 min-h-[100px] resize-y transition-all duration-150 \
placeholder:text-text-tertiary \
focus:outline-none focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-primary-muted)] \
disabled:pointer-events-none disabled:opacity-50"

// min-h variants: review 120px | support 160px | admin description 200px
```

---

## 5.4 Select Dropdown

```tsx
// Trigger:
"h-10 w-full rounded-lg bg-surface-sunken border border-border px-3 text-sm text-text \
transition-all hover:border-border-strong \
focus:ring-0 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-primary-muted)] \
data-[placeholder]:text-text-tertiary"

// Dropdown panel:
"rounded-xl bg-surface-overlay border border-border shadow-dropdown p-1 z-dropdown"

// Item: "rounded-lg px-3 py-2 text-sm text-text cursor-pointer hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
// Active item: "text-primary font-medium"
// Chevron: ChevronDown 16px text-text-tertiary, rotate 180deg when open
```

---

## 5.5 Checkbox

```tsx
"h-4 w-4 rounded-sm border border-border-strong bg-surface-sunken \
transition-colors duration-150 hover:border-primary \
focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-bg \
data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white \
disabled:opacity-40 disabled:pointer-events-none"

// Check icon: Lucide Check 10px stroke-width 3, scale 0→1 on check (100ms ease-out)

<div className="flex items-center gap-2">
  <Checkbox id="cb" />
  <label htmlFor="cb" className="text-sm text-text cursor-pointer">Label text</label>
</div>
```

---

## 5.6 Radio Button

```tsx
"h-4 w-4 rounded-full border border-border-strong bg-surface-sunken \
transition-colors hover:border-primary \
focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 \
data-[state=checked]:border-primary"

// Inner dot when checked: h-1.5 w-1.5 rounded-full bg-primary
// Transition: scale 0→1, duration 150ms ease-spring
```

---

## 5.7 Toggle / Switch

```tsx
// Track:
"peer h-6 w-11 rounded-full border-2 border-transparent bg-surface-overlay \
transition-colors duration-200 \
focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 \
disabled:opacity-40 data-[state=checked]:bg-primary"

// Thumb:
"block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 \
translate-x-0 data-[state=checked]:translate-x-5"
```

---

## 5.8 Badge

```tsx
// Base:
"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"

// Trending:  bg-[rgba(249,115,22,0.12)] text-[#F97316] border border-[rgba(249,115,22,0.20)] + Flame 10px
// Viral:     bg-[rgba(168,85,247,0.12)] text-[#A855F7] border border-[rgba(168,85,247,0.20)] + Zap 10px
// Sale:      bg-[rgba(239,68,68,0.12)]  text-[#EF4444] border border-[rgba(239,68,68,0.20)]  + Tag 10px
// New:       bg-[rgba(34,197,94,0.12)]  text-[#22C55E] border border-[rgba(34,197,94,0.20)]  (no icon)
// Verified:  bg-[rgba(37,99,235,0.12)]  text-[#60A5FA] border border-[rgba(37,99,235,0.20)]  + BadgeCheck 10px
// Info:      bg-[rgba(59,130,246,0.12)] text-[#60A5FA] border border-[rgba(59,130,246,0.20)]

// Status dot: "h-2 w-2 rounded-full bg-success" (in-stock) | "bg-error" (out-of-stock)
```

---

## 5.9 Card

**Product Card**
```tsx
// Container:
"group relative flex flex-col rounded-2xl bg-surface border border-border overflow-hidden \
cursor-pointer transition-all duration-300 ease-out \
hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover"

// Image area: "relative aspect-square overflow-hidden bg-surface-raised"
// Primary image: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
// Secondary image (crossfade): "absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
// Wishlist button: "absolute top-3 right-3 h-8 w-8 rounded-full bg-bg/80 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 hover:scale-110 active:scale-95"
// Badge row: "absolute top-3 left-3 flex flex-col gap-1" (max 2 badges)
// Content area: "flex flex-col gap-3 p-4"
// Product name: "text-sm font-medium text-text leading-snug line-clamp-2"
// Price row: "flex items-baseline gap-2"
// Star row: "flex items-center gap-1.5 text-xs text-text-secondary"
// CTA button: "w-full h-9 [primary button classes]"
```

**Review Card**
```tsx
"rounded-2xl bg-surface border border-border p-5 flex flex-col gap-4 min-w-[320px] max-w-[380px]"
// Header: avatar h-10 w-10 rounded-full | name text-sm font-semibold | date text-xs text-text-secondary
// Stars + review text: text-sm text-text-secondary leading-relaxed line-clamp-4
// Bottom: product snippet text-xs text-text-tertiary border-t border-border pt-2
```

**Feature Card**
```tsx
"rounded-2xl bg-gradient-card border border-border p-6 flex flex-col gap-4 \
hover:border-border-strong transition-all duration-300"
// Icon box: "h-10 w-10 rounded-xl bg-primary-muted flex items-center justify-center" — 20px icon text-primary
// Title: "text-lg font-semibold text-text"
// Body: "text-sm text-text-secondary leading-relaxed"
```

**Stats Card**
```tsx
"rounded-2xl bg-surface border border-border p-6 flex flex-col gap-2"
// Value: "text-4xl font-extrabold text-text tracking-tight"
// Label: "text-sm text-text-secondary"
// Trend: "flex items-center gap-1 text-xs font-medium text-success" + TrendingUp 12px
```

---

## 5.10 Avatar

```tsx
// Base: "relative inline-flex shrink-0 rounded-full overflow-hidden bg-surface-raised ring-2 ring-border"
// xs:  h-6  w-6  text-[10px]
// sm:  h-8  w-8  text-xs
// md:  h-10 w-10 text-sm     (default)
// lg:  h-12 w-12 text-base
// xl:  h-16 w-16 text-lg

// Initials fallback: "w-full h-full flex items-center justify-center font-semibold text-primary bg-primary-muted"
// Presence dot: "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-bg"
// Avatar group: each item -ml-3, ring-2 ring-bg, hover:z-10 hover:-translate-y-0.5
```

---

## 5.11 Star Rating

**Static Display**
```tsx
// Filled:  <Star className="h-4 w-4 fill-star text-star" />
// Half:    filled star clipped to 50% width, layered on empty star
// Empty:   <Star className="h-4 w-4 text-star-empty" />
// Text:    "text-xs text-text-secondary ml-1.5"  e.g. "4.8 (2,341 reviews)"
```

**Interactive (Review Form)**
```tsx
// Each star: "cursor-pointer transition-all duration-100 hover:scale-110 active:scale-95"
// Hovered and below: fill-star text-star | Beyond hover: text-star-empty
// On set: spring bounce — scale [1, 1.35, 1], 300ms ease-out
```

---

## 5.12 Progress Bar

**Review Rating Bar**
```tsx
<div className="flex items-center gap-3">
  <span className="text-xs text-text-secondary w-3">5</span>
  <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
    <div className="h-full rounded-full bg-star transition-all duration-700 ease-expo-out"
         style={{ width: `${pct}%` }} />
  </div>
  <span className="text-xs text-text-secondary w-8 text-right">{pct}%</span>
</div>
```

**Checkout Step Indicator**
```tsx
// Completed: h-8 w-8 rounded-full bg-primary text-white, Check icon 14px inside
// Current:   h-8 w-8 rounded-full border-2 border-primary text-primary
// Upcoming:  h-8 w-8 rounded-full border-2 border-border text-text-tertiary
// Connector: flex-1 h-px bg-border mx-1 — completed connector: bg-primary
// Label:     text-xs font-medium text-text-secondary below node — current: text-primary font-semibold
```

---

## 5.13 Skeleton Loaders

```tsx
// Base: "rounded-lg bg-surface-raised animate-shimmer"

// Product card skeleton:
// [aspect-square bg-surface-raised animate-shimmer]   (image)
// p-4 space-y-3:
//   [h-5 w-20 rounded-full animate-shimmer]           (badge)
//   [h-4 w-full animate-shimmer]                      (title line 1)
//   [h-4 w-3/4 animate-shimmer]                       (title line 2)
//   [h-5 w-24 animate-shimmer]                        (price)
//   [h-9 w-full rounded-lg animate-shimmer]           (button)

// Text skeleton:   "h-4 rounded-md bg-surface-raised animate-shimmer" — vary width
// Avatar skeleton: "h-10 w-10 rounded-full bg-surface-raised animate-shimmer"
// Image skeleton:  "aspect-square rounded-2xl bg-surface-raised animate-shimmer"
```

---

## 5.14 Spinner / Loading Indicator

```tsx
// CSS spinner:
"h-5 w-5 rounded-full border-2 border-border-strong border-t-primary animate-spin"
// Sizes: h-4 w-4 (sm) | h-5 w-5 (md) | h-6 w-6 (lg) | h-8 w-8 (xl)
// Inside primary button: border-t-white
// Always: role="status" aria-label="Loading" with <span className="sr-only">Loading</span>

// Dots (inline async states): 3 dots, h-1.5 w-1.5, bg-text-secondary, animate-bounce, delay 0/150/300ms

// Full-page overlay: "fixed inset-0 z-top flex items-center justify-center bg-bg/80 backdrop-blur-sm"
```

---

## 5.15 Toast Notification

```tsx
// Base panel:
"rounded-xl border p-4 flex items-start gap-3 bg-surface-overlay backdrop-blur-md shadow-lg \
min-w-[320px] max-w-[420px]"

// Success: border-success-border + shadow-[0_0_16px_rgba(34,197,94,0.20)] + CheckCircle2 18px text-success
// Error:   border-error-border   + shadow-[0_0_16px_rgba(239,68,68,0.20)]  + XCircle 18px text-error
// Warning: border-warning-border + AlertTriangle 18px text-warning
// Info:    border-info-border    + Info 18px text-info

// Title: "text-sm font-semibold text-text"
// Description: "text-xs text-text-secondary mt-0.5"
// Close: absolute top-3 right-3, X 14px, text-text-tertiary hover:text-text
// Position: bottom-right desktop / bottom-center mobile
// Auto-dismiss: 4000ms | Max visible: 3

const toastVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0,        scale: 0.95,  transition: { duration: 0.15 } }
}
```

---

## 5.16 Tooltip

```tsx
// Content:
"rounded-lg bg-surface-overlay border border-border text-xs text-text \
px-2.5 py-1.5 shadow-dropdown z-tooltip max-w-[200px] text-center leading-snug"

// Entry: opacity 0→1, scale 0.95→1, y 4→0, 100ms
// Exit:  opacity 1→0, scale 1→0.95, 80ms
// Show delay: 400ms (prevents flicker)
// Prefer placement top, fallback bottom
```

---

## 5.17 Popover

```tsx
"rounded-2xl bg-surface-overlay border border-border shadow-dropdown p-4 z-dropdown \
min-w-[220px] max-w-[320px]"

const popoverVariants = {
  initial: { opacity: 0, scale: 0.97, y: 6 },
  animate: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.10 } }
}
// Close on: outside click, Escape, trigger re-click. Radix handles focus trap.
```

---

## 5.18 Modal / Dialog

```tsx
// Backdrop: "fixed inset-0 z-overlay bg-bg/60 backdrop-blur-sm"
// Container: "fixed inset-0 z-modal flex items-center justify-center p-4"
// Panel: "relative w-full rounded-2xl bg-surface-overlay border border-border shadow-modal overflow-hidden"
// sm: max-w-[480px] | md: max-w-[560px] | lg: max-w-[720px]

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.20 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } }
}
const modalVariants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } }
}

// Header: px-6 pt-6 pb-4, title text-lg font-semibold, close h-8 w-8 at top-4 right-4
// Body: px-6 py-4 | max-h-[80vh] overflow-y-auto for tall content
// Footer: px-6 pb-6 pt-4 flex justify-end gap-3 border-t border-border
// Close on backdrop click, Escape, close button. Focus trapped.
```

---

## 5.19 Drawer / Sheet

**Right Cart Drawer**
```tsx
// Panel: "fixed inset-y-0 right-0 z-modal w-full max-w-[420px] bg-surface-overlay \
//         border-l border-border shadow-2xl flex flex-col"
const cartDrawerVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0,      opacity: 1, transition: { duration: 0.35, ease: [0.19,1,0.22,1] } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }
}
// Header: px-6 py-4 border-b, "Your Cart" text-lg font-semibold + close button
// Body: flex-1 overflow-y-auto px-6 py-4 space-y-4
// Footer: px-6 py-4 border-t — subtotal row + "Checkout" primary button full-width
```

**Bottom Filter Drawer (Mobile)**
```tsx
// Panel: "fixed inset-x-0 bottom-0 z-modal bg-surface-overlay rounded-t-3xl \
//         border-t border-border max-h-[85vh] flex flex-col"
// Drag handle: "h-1 w-12 rounded-full bg-border-strong mx-auto mt-3 mb-1"
const bottomDrawerVariants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { duration: 0.35, ease: [0.19,1,0.22,1] } },
  exit:    { y: '100%', transition: { duration: 0.25, ease: 'easeIn' } }
}
// Footer: px-5 py-4 border-t flex gap-3 — ghost "Clear all" + primary flex-1 "Apply filters"
```

---

## 5.20 Tabs

```tsx
// Tab list: "flex gap-1 bg-surface rounded-xl p-1 border border-border"
// Inactive: "relative rounded-lg px-4 py-2 text-sm font-medium text-text-secondary \
//            transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-primary"
// Active background — use layoutId animated indicator:
const TabIndicator = () => (
  <motion.div layoutId="tab-indicator"
    className="absolute inset-0 rounded-lg bg-surface-raised shadow-sm"
    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }} />
)
// Content panel: pt-4, opacity fade 150ms on tab switch

// Underline variant (PDP tabs):
// "border-b-2 border-transparent" → "border-primary text-primary" on active
```

---

## 5.21 Accordion / FAQ

```tsx
// Item: "border-b border-border last:border-none"
// Trigger: "flex w-full items-center justify-between py-4 text-sm font-medium text-text \
//           text-left hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
// Chevron: "h-4 w-4 text-text-tertiary shrink-0 transition-transform duration-200 data-[state=open]:rotate-180"
// Content: animated height via Radix, overflow-hidden
// Inner padding: "pb-4 text-sm text-text-secondary leading-relaxed"
```

---

## 5.22 Breadcrumb

```tsx
<nav aria-label="Breadcrumb">
  <ol className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
    {crumbs.map((c, i) => (
      <li key={i} className="flex items-center gap-2">
        {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-quaternary" />}
        {i < crumbs.length - 1
          ? <a href={c.href} className="hover:text-text transition-colors truncate max-w-[120px]">{c.label}</a>
          : <span aria-current="page" className="text-text font-medium truncate max-w-[180px]">{c.label}</span>
        }
      </li>
    ))}
  </ol>
</nav>
// Max 4 levels: Home > Category > Sub-category > Product
```

---

## 5.23 Pagination

```tsx
// Prev/Next: "h-9 w-9 rounded-lg border border-border text-text-secondary flex items-center justify-center \
//             transition-all hover:border-border-strong hover:text-text hover:bg-surface-raised disabled:opacity-40"
// Inactive:  "h-9 w-9 rounded-lg border border-transparent text-text-secondary text-sm font-medium \
//             flex items-center justify-center hover:border-border hover:text-text hover:bg-surface-raised"
// Active:    "h-9 w-9 rounded-lg bg-primary text-white text-sm font-medium flex items-center justify-center shadow-button-primary"
// Ellipsis:  "h-9 w-9 flex items-center justify-center text-text-quaternary text-sm"
// Show: current ±2 desktop, ±1 mobile. Always show first and last numbers.
```

---

## 5.24 Price Display

```tsx
// PDP large:
<div className="flex items-baseline gap-3">
  <span className="text-4xl font-bold text-text tracking-tight">
    ₹{price.toLocaleString('en-IN')}
  </span>
  {compare && <span className="text-lg text-text-tertiary line-through">₹{compare.toLocaleString('en-IN')}</span>}
  {discount && <span className="text-sm font-semibold text-sale bg-sale-bg px-2 py-0.5 rounded-full">{discount}% off</span>}
</div>

// Card:
<div className="flex items-baseline gap-2">
  <span className="text-base font-semibold text-text">₹{price.toLocaleString('en-IN')}</span>
  {compare && <span className="text-sm text-text-quaternary line-through">₹{compare.toLocaleString('en-IN')}</span>}
</div>

// Rules:
// - Always en-IN locale (1,00,000 Indian format)
// - ₹0 displays as "Free" in text-success
// - Discount: Math.floor((1 - current/compare) * 100)
// - EMI: "or ₹X/month no-cost EMI" text-xs text-text-secondary below price
```

---

## 5.25 Product Badge (Image Overlay)

```tsx
// Container: absolute top-3 left-3, flex flex-col gap-1, max 2 badges

// Trending:
"inline-flex items-center gap-1 px-2.5 py-1 rounded-full \
bg-[rgba(249,115,22,0.85)] backdrop-blur-sm text-white text-xs font-bold \
shadow-[0_0_20px_rgba(249,115,22,0.30)]"
// Icon: <Flame className="h-3 w-3" />

// Viral:
"inline-flex items-center gap-1 px-2.5 py-1 rounded-full \
bg-[rgba(168,85,247,0.85)] backdrop-blur-sm text-white text-xs font-bold \
shadow-[0_0_20px_rgba(168,85,247,0.30)]"
// Icon: <Zap className="h-3 w-3" />

// Sale:
"inline-flex items-center px-2.5 py-1 rounded-full \
bg-[rgba(239,68,68,0.90)] backdrop-blur-sm text-white text-xs font-bold"
// Content: "-30%" string

// Entry animation: x -8→0, scale 0.85→1, opacity 0→1, 250ms ease-out
// Stagger: 60ms delay between multiple badges
```

---

# SECTION 6: ICON SYSTEM

## 6.1 Icon Library: Lucide React

Lucide React is the sole icon library for this platform. Reasons:
- Consistent 2px stroke-width across all 1000+ icons
- Tree-shakeable — only imported icons are bundled
- SVG-based — scales perfectly at all sizes
- MIT licensed
- Used by Vercel, shadcn/ui, Linear

```tsx
// Import pattern (always named import, never default):
import { ShoppingCart, Heart, Search, ChevronRight } from 'lucide-react'

// Usage:
<ShoppingCart className="h-5 w-5 text-text-secondary" />

// Never use: strokeWidth prop (use the default 2)
// Never use: fill prop except for star ratings (fill-star)
// Never scale with transform — always use h-/w- Tailwind classes
```

---

## 6.2 Icon Sizes: When to Use Each

| Size    | Class          | Use Case |
|---------|----------------|----------|
| 14px    | `h-3.5 w-3.5`  | Caption badges, tiny inline indicators, breadcrumb separators |
| 16px    | `h-4 w-4`      | Form field prefix/suffix, list item bullets, star ratings, small labels |
| 20px    | `h-5 w-5`      | Navigation links, button icons (md button), card action icons |
| 24px    | `h-6 w-6`      | Feature list headers, primary nav icons, toolbar icons |
| 32px    | `h-8 w-8`      | Feature card icons (inside a colored container), empty state icons |
| 48px    | `h-12 w-12`    | Large empty state illustrations, hero feature callouts |

**Rule:** Icon size should be proportional to surrounding text. A text-sm label gets a 16px icon. A text-lg heading gets a 20px–24px icon.

---

## 6.3 Icon Colors: When to Use Each

| Color                    | Tailwind             | When to Use |
|--------------------------|----------------------|-------------|
| White `#FFFFFF`          | `text-text`          | Active/selected nav icons, CTA button icons |
| Secondary `#9CA3AF`      | `text-text-secondary`| Default nav icons, form field prefix icons, inactive states |
| Tertiary `#6B7280`       | `text-text-tertiary`  | Placeholder/disabled context only |
| Primary `#2563EB`        | `text-primary`        | Interactive icon buttons on hover, feature card icons |
| Primary 400 `#60A5FA`    | `text-primary-400`   | Active filter chips, link icons |
| Success `#4ADE80`        | `text-success`        | Checkmarks, in-stock indicators, success states |
| Error `#F87171`          | `text-error-text`     | Error states, remove/delete icons |
| Warning `#FCD34D`        | `text-warning-text`   | Warning indicators |
| Star `#F59E0B`           | `text-star`           | Filled star ratings ONLY |
| Trending `#F97316`       | `text-trending`       | Trending badge Flame icon ONLY |
| Viral `#A855F7`          | `text-viral`          | Viral badge Zap icon ONLY |

---

## 6.4 Icon + Text Spacing Rules

```tsx
// Always use flex + items-center + gap for icon+text pairs:
<div className="flex items-center gap-2">
  <Truck className="h-5 w-5 text-text-secondary shrink-0" />
  <span className="text-sm text-text-secondary">Free delivery</span>
</div>

// Gap lookup by icon size:
// 14px icon → gap-1  (4px)
// 16px icon → gap-1.5 (6px)
// 20px icon → gap-2  (8px)
// 24px icon → gap-2.5 (10px)
// 32px icon → gap-3  (12px)

// shrink-0 on icons always — prevents icon from compressing on flex
// Never position icon after text in reading order unless purely decorative
```

---

## 6.5 Navigation Icon List (Exact Lucide Names)

| Purpose           | Lucide Icon Name     | Size  | Notes |
|-------------------|----------------------|-------|-------|
| Home              | `Home`               | 20px  | Filled variant on active via fill class |
| Search            | `Search`             | 20px  | Opens search overlay |
| Shopping cart     | `ShoppingCart`       | 20px  | Shows badge count |
| User account      | `User`               | 20px  | Avatar when logged in |
| Menu (hamburger)  | `Menu`               | 20px  | Mobile nav toggle |
| Close menu        | `X`                  | 20px  | Replaces Menu when open |
| Wishlist/Heart    | `Heart`              | 20px  | Toggle: outline→filled |
| Star (rating)     | `Star`               | 16px  | fill-star for filled |
| Trending          | `TrendingUp`         | 20px  | Nav trending section |
| Arrow right       | `ArrowRight`         | 16px  | View all links |
| Arrow left        | `ArrowLeft`          | 16px  | Back navigation |
| Check             | `Check`              | 14px  | Checkbox, success step |
| Check circle      | `CheckCircle2`       | 18px  | Toast success, complete state |
| X circle          | `XCircle`            | 18px  | Toast error |
| Alert triangle    | `AlertTriangle`      | 18px  | Toast warning |
| Info              | `Info`               | 18px  | Toast info, tooltips |
| Alert circle      | `AlertCircle`        | 14px  | Inline form error |
| Chevron right     | `ChevronRight`       | 14px  | Breadcrumb, carousel |
| Chevron left      | `ChevronLeft`        | 14px  | Breadcrumb, carousel |
| Chevron down      | `ChevronDown`        | 16px  | Select dropdown, accordion |
| Chevron up        | `ChevronUp`          | 16px  | Scroll to top |
| Plus              | `Plus`               | 16px  | Add item, expand |
| Minus             | `Minus`              | 16px  | Remove item, quantity |
| Filter            | `SlidersHorizontal`  | 20px  | Filter button |
| Sort              | `ArrowUpDown`        | 16px  | Sort dropdown |
| Grid view         | `LayoutGrid`         | 20px  | Toggle product grid |
| List view         | `List`               | 20px  | Toggle product list |
| Share             | `Share2`             | 16px  | Share product |
| Copy              | `Copy`               | 14px  | Copy promo code |
| External link     | `ExternalLink`       | 14px  | Opens new tab |
| Log out           | `LogOut`             | 16px  | Account dropdown |
| Settings          | `Settings`           | 16px  | Account settings |
| Package           | `Package`            | 16px  | Orders section |
| Bell              | `Bell`               | 20px  | Notifications |
| Edit              | `Pencil`             | 14px  | Edit action |
| Trash             | `Trash2`             | 14px  | Delete action |
| Eye               | `Eye`                | 16px  | View/preview |
| Eye off           | `EyeOff`             | 16px  | Hide password |
| Upload            | `Upload`             | 16px  | File/image upload |
| Image             | `ImageIcon`          | 16px  | Image placeholder |
| Flame             | `Flame`              | 10px  | Trending badge |
| Zap               | `Zap`                | 10px  | Viral badge |
| Tag               | `Tag`                | 10px  | Sale badge |
| Badge check       | `BadgeCheck`         | 10px  | Verified badge |
| Badge trending    | `TrendingUp`         | 20px  | Section icon |

---

## 6.6 Product Trust Icon List

| Trust Signal         | Lucide Icon Name  | Size  | Color |
|----------------------|-------------------|-------|-------|
| Free delivery        | `Truck`           | 20px  | text-text-secondary |
| Fast shipping        | `Zap`             | 20px  | text-text-secondary |
| Easy returns         | `RotateCcw`       | 20px  | text-text-secondary |
| Secure payment       | `Lock`            | 20px  | text-text-secondary |
| Authenticity         | `BadgeCheck`      | 20px  | text-primary-400 |
| Customer support     | `Headphones`      | 20px  | text-text-secondary |
| COD available        | `Banknote`        | 20px  | text-text-secondary |
| EMI available        | `CreditCard`      | 20px  | text-text-secondary |
| In stock             | `Package`         | 16px  | text-success |
| Out of stock         | `PackageX`        | 16px  | text-error-text |
| Express delivery     | `Timer`           | 16px  | text-text-secondary |
| Gift wrapping        | `Gift`            | 16px  | text-text-secondary |

---

## 6.7 Category Icon List

| Category             | Lucide Icon Name   | Notes |
|----------------------|--------------------|-------|
| Electronics          | `Cpu`              | |
| Health & Beauty      | `Heart`            | |
| Home & Kitchen       | `Home`             | |
| Fashion              | `Shirt`            | |
| Sports & Fitness     | `Dumbbell`         | |
| Books                | `BookOpen`         | |
| Toys & Games         | `Gamepad2`         | |
| Automotive           | `Car`              | |
| Garden              | `Leaf`             | |
| Pet Supplies         | `PawPrint`         | |
| Baby & Kids          | `Baby`             | |
| Office Supplies      | `Briefcase`        | |

---

# SECTION 7: ANIMATION SYSTEM

All animations use Framer Motion 11. Every animated element must respect `prefers-reduced-motion`:

```tsx
// Wrap all motion components with this hook:
import { useReducedMotion } from 'framer-motion'

const prefersReduced = useReducedMotion()
// If true, skip all non-essential animations; keep only opacity transitions
```

---

## 7.1 Page Entry Animations

### Base Variants (reuse across all components)

```ts
// Fade up — most common page entry
export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] } }
}

// Fade in — no movement
export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }
}

// Fade left — for right-side content panels
export const fadeLeft = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] } }
}

// Scale up — for modals, cards
export const scaleUp = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } }
}

// Stagger container — wraps a list of children
export const staggerContainer = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

// Stagger child — used inside staggerContainer
export const staggerChild = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] } }
}

// Stagger child (horizontal — for horizontal lists)
export const staggerChildX = {
  hidden:  { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } }
}
```

### Scroll-triggered Variant

```tsx
// Use Framer Motion's whileInView:
<motion.div
  variants={fadeUp}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
>
  {children}
</motion.div>

// viewport.once: true — animates only first time element enters viewport
// viewport.amount: 0.2 — triggers when 20% of element is visible
// For smaller elements (badges, icons): amount: 0.5
// For hero content: no whileInView — use initial animate directly
```

---

## 7.2 Component-Level Animations

### Button Hover/Tap

```ts
const buttonMotion = {
  whileHover: { scale: 1.01, y: -1, transition: { duration: 0.10, ease: 'easeOut' } },
  whileTap:   { scale: 0.98, y: 0,  transition: { duration: 0.05, ease: 'easeOut' } }
}

// Primary button glow pulse on hover (CSS-only, not Framer):
// box-shadow transitions from shadow-button-primary to shadow-button-primary-hover
```

### Card Hover (Product Card)

```ts
// CSS transition handles most of card hover for performance
// class: "transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"

// For premium cards, use Framer:
const cardHover = {
  rest:  { y: 0, boxShadow: 'var(--shadow-card)' },
  hover: {
    y: -4,
    boxShadow: 'var(--shadow-card-hover)',
    transition: { duration: 0.3, ease: 'easeOut' }
  }
}
```

### Image Crossfade (Product Card Secondary Image)

```tsx
// Controlled by group-hover CSS class:
// Primary image:   "opacity-100 group-hover:opacity-0 transition-opacity duration-500"
// Secondary image: "opacity-0   group-hover:opacity-100 transition-opacity duration-500"
// Both in absolute position, same container
// Duration 500ms ensures smooth, non-jarring crossfade
```

### Wishlist Heart Toggle

```tsx
const heartVariants = {
  idle:      { scale: 1 },
  hover:     { scale: 1.1, transition: { duration: 0.15 } },
  tap:       { scale: 0.85, transition: { duration: 0.1 } },
  activated: {
    scale: [1, 1.4, 1.1, 1],
    transition: { duration: 0.4, times: [0, 0.3, 0.7, 1], ease: 'easeOut' }
  }
}
// Color: text-text-tertiary (outline) → text-error (filled), transition-colors 200ms
// Fill: 'none' → 'currentColor' toggled via className
```

### Cart Count Badge Spring

```tsx
const cartBadgeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15 }
  },
  increment: {
    scale: [1, 1.4, 1],
    transition: { duration: 0.3, times: [0, 0.4, 1] }
  }
}
// Badge: absolute -top-1.5 -right-1.5, h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold
// Use AnimatePresence for mount/unmount when count goes 0↔1
```

### Number Counter Animation (Count-up)

```tsx
// For stats section — animate from 0 to target number
import { useMotionValue, useTransform, animate } from 'framer-motion'

function CountUp({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString('en-IN'))

  useEffect(() => {
    const controls = animate(count, target, {
      duration,
      ease: 'easeOut',
      delay: 0.2
    })
    return controls.stop
  }, [target])

  return <motion.span>{rounded}</motion.span>
}

// Trigger count-up when section enters viewport (use IntersectionObserver or whileInView)
```

### Shimmer Sweep (CTA Button)

```css
/* CSS keyframe for shimmer sweep */
@keyframes shimmer-sweep {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.shimmer-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.12) 50%,
    transparent 100%
  );
  animation: shimmer-sweep 2.5s ease-in-out infinite;
}
/* Button must have: position:relative, overflow:hidden */
```

---

## 7.3 Navigation Animations

### Navbar Scroll Transition

```tsx
// Transparent at top → glass blur when scrolled past 80px
const [scrolled, setScrolled] = useState(false)

useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 80)
  window.addEventListener('scroll', handler, { passive: true })
  return () => window.removeEventListener('scroll', handler)
}, [])

// Apply:
<motion.nav
  animate={{
    backgroundColor: scrolled ? 'rgba(10,10,10,0.85)' : 'rgba(10,10,10,0)',
    backdropFilter:  scrolled ? 'blur(20px)' : 'blur(0px)',
    borderBottomColor: scrolled ? 'rgba(31,31,31,1)' : 'rgba(31,31,31,0)',
  }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
  className="fixed top-0 left-0 right-0 z-sticky"
>
```

### Mega Menu Open/Close

```tsx
const megaMenuVariants = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15 } }
}

<AnimatePresence>
  {isOpen && (
    <motion.div variants={megaMenuVariants} initial="initial" animate="animate" exit="exit">
      {/* menu content */}
    </motion.div>
  )}
</AnimatePresence>
// Trigger: hover on nav item (desktop), or click (mobile)
// Close on: mouse leave, Escape, route change
```

### Mobile Drawer Slide

```tsx
const mobileNavVariants = {
  initial: { x: '-100%' },
  animate: { x: 0, transition: { duration: 0.35, ease: [0.19, 1, 0.22, 1] } },
  exit:    { x: '-100%', transition: { duration: 0.25, ease: 'easeIn' } }
}
// Backdrop fades independently: opacity 0→0.6, 200ms
```

---

## 7.4 Hero Animations — Full Timeline

```tsx
// All delays in milliseconds from page mount

// Step 1 (0ms):       Background gradient appears (opacity 0→1, 600ms)
// Step 2 (100ms):     Eyebrow tag fades up (opacity 0→1, y 16→0, 400ms)
// Step 3 (250ms):     H1 line 1 fades up (opacity 0→1, y 24→0, 600ms, expo-out)
// Step 4 (400ms):     H1 line 2 fades up (same)
// Step 5 (550ms):     H1 line 3 / rotating word starts (see rotating words below)
// Step 6 (700ms):     Body paragraph fades up (opacity 0→1, y 16→0, 400ms)
// Step 7 (900ms):     CTA buttons fade up staggered (60ms between)
// Step 8 (300ms):     Right-side product image fades left (opacity 0→1, x 32→0, 700ms)
// Step 9 (600ms):     Product image starts float loop animation
// Step 10 (1200ms):   Glow bloom beneath product image pulses in
// Step 11 (1500ms):   Social proof row / star count fades in

// Implementation:
const heroVariants = {
  tag:    { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.10 } } },
  h1a:   { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.25, ease: [0.19,1,0.22,1] } } },
  h1b:   { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.40, ease: [0.19,1,0.22,1] } } },
  body:  { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.70 } } },
  cta1:  { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.90 } } },
  cta2:  { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.96 } } },
  image: { hidden: { opacity: 0, x: 32 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.30, ease: [0.19,1,0.22,1] } } },
  glow:  { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.8, delay: 1.20 } } },
  social:{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, delay: 1.50 } } },
}
```

### Floating Product Image

```tsx
// CSS animation (no Framer needed — loop doesn't benefit from JS):
.hero-product-image {
  animation: float 4s ease-in-out infinite;
  will-change: transform;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33%       { transform: translateY(-8px) rotate(0.5deg); }
  66%       { transform: translateY(-4px) rotate(-0.3deg); }
}
// Subtle rotation (±0.5deg) adds organic feel
```

### Rotating Words (AnimatePresence Vertical Flip)

```tsx
const words = ['Trending', 'Viral', 'Loved', 'Discovered']
const [index, setIndex] = useState(0)

useEffect(() => {
  const interval = setInterval(() => {
    setIndex(i => (i + 1) % words.length)
  }, 2500)
  return () => clearInterval(interval)
}, [])

// Render:
<span className="relative inline-block overflow-hidden h-[1.2em]">
  <AnimatePresence mode="wait">
    <motion.span
      key={words[index]}
      className="inline-block text-primary"
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: '0%',   opacity: 1, transition: { duration: 0.4, ease: [0.19,1,0.22,1] } }}
      exit={{    y: '-100%', opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
    >
      {words[index]}
    </motion.span>
  </AnimatePresence>
</span>
```

### Glow Pulse (Hero Background)

```tsx
// CSS-only radial glow beneath hero section:
.hero-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 60%;
  background: radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%);
  animation: glow-pulse 4s ease-in-out infinite;
  pointer-events: none;
}
```

---

## 7.5 Carousel Animations

```tsx
// Using Framer Motion drag on a horizontal flex container

const CarouselTrack = () => {
  const trackRef = useRef(null)
  const x = useMotionValue(0)

  return (
    <div className="overflow-hidden cursor-grab active:cursor-grabbing">
      <motion.div
        ref={trackRef}
        className="flex gap-4"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -(totalWidth - containerWidth), right: 0 }}
        dragElastic={0.08}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
      >
        {items.map(...)}
      </motion.div>
    </div>
  )
}

// Auto-scroll behavior:
useEffect(() => {
  if (isPaused) return
  const interval = setInterval(() => {
    const nextX = current - cardWidth - gap
    if (nextX < -(totalWidth - containerWidth)) {
      animate(x, 0, { duration: 0.6, ease: 'easeOut' }) // loop back
    } else {
      animate(x, nextX, { duration: 0.6, ease: 'easeInOut' })
    }
  }, 3500)
  return () => clearInterval(interval)
}, [isPaused, current])

// Pause auto-scroll on hover: onHoverStart={() => setIsPaused(true)} onHoverEnd={() => setIsPaused(false)}

// Arrow button hover:
const arrowHover = {
  whileHover: { scale: 1.05, backgroundColor: 'rgba(37,99,235,0.15)' },
  whileTap:   { scale: 0.95 }
}
```

---

## 7.6 Modal / Drawer Animations

### Cart Sheet Slide-in

```tsx
// Wrap with AnimatePresence at the usage site:
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-overlay bg-bg/60 backdrop-blur-sm"
        onClick={close}
      />
      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0, transition: { duration: 0.35, ease: [0.19, 1, 0.22, 1] } }}
        exit={{ x: '100%', transition: { duration: 0.25, ease: 'easeIn' } }}
        className="fixed inset-y-0 right-0 z-modal ..."
      />
    </>
  )}
</AnimatePresence>
```

### Modal Scale-in

```tsx
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div key="backdrop" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration: 0.2 }} className="fixed inset-0 z-overlay bg-bg/60 backdrop-blur-sm" />
      <motion.div key="modal" initial={{ opacity:0, scale:0.96, y:8 }}
        animate={{ opacity:1, scale:1, y:0, transition:{ duration:0.25, ease:'easeOut' } }}
        exit={{ opacity:0, scale:0.96, y:8, transition:{ duration:0.15 } }}
        className="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[560px] rounded-2xl bg-surface-overlay ...">
          {children}
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

---

## 7.7 Scroll-triggered Section Animations

```tsx
// Standard scroll-triggered section:
<motion.section
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.15 }}
>
  <motion.h2 variants={fadeUp}>Section Heading</motion.h2>
  <motion.p variants={fadeUp}>Subtext</motion.p>

  <div className="grid grid-cols-3 gap-6">
    {cards.map((card, i) => (
      <motion.div key={i} variants={staggerChild}>
        <FeatureCard {...card} />
      </motion.div>
    ))}
  </div>
</motion.section>

// Thresholds by section type:
// Hero:                amount: 0 (immediate — no scroll wait)
// Trending carousel:   amount: 0.15
// Feature cards:       amount: 0.20
// Stats section:       amount: 0.30 (needs more visibility to trigger count-up)
// Reviews marquee:     amount: 0.10
// Newsletter:          amount: 0.25
// Footer:              amount: 0.05

// Y offset amounts:
// Primary content (h2, paragraphs): y: 24
// Secondary (labels, small text):   y: 16
// Cards and larger blocks:          y: 32
// Stagger delay between children:   0.08s (80ms)
// Stagger delay for dense grids:    0.05s (50ms, 4+ items)
```

---

## 7.8 Loading to Loaded Transitions

### Skeleton to Real Content

```tsx
// Approach: render both skeleton and real content, fade out skeleton on load

const ProductCard = ({ isLoading, product }) => (
  <div className="relative">
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="skeleton"
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="absolute inset-0 rounded-2xl"
        >
          <ProductCardSkeleton />
        </motion.div>
      )}
    </AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoading ? 0 : 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {product && <ProductCardContent product={product} />}
    </motion.div>
  </div>
)
```

### Page Skeleton to Hydrated State

```tsx
// Use React Suspense + streaming SSR:
// Show skeleton fallback during server stream

// Fallback component fades in immediately (opacity 1, no animation)
// Real content: AnimatePresence with fadeUp, staggerContainer
// Prevents CLS by matching skeleton dimensions exactly

// Page-level loading state (route change):
// Thin progress bar at top: bg-primary, height 2px, position fixed top-0 z-top
// Animate width 0→85% (indeterminate), then 85→100% on complete, then fade out
```

---

## 7.9 Micro-interactions

### Add to Cart Success Flash

```tsx
// When item added: button shows checkmark for 1500ms, then reverts
const [added, setAdded] = useState(false)

const handleAddToCart = async () => {
  await addItem(product)
  setAdded(true)
  setTimeout(() => setAdded(false), 1500)
}

// Button content (AnimatePresence between text and check icon):
<AnimatePresence mode="wait">
  {added ? (
    <motion.span key="check"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
      className="flex items-center gap-2 text-white">
      <Check className="h-4 w-4" /> Added!
    </motion.span>
  ) : (
    <motion.span key="cart"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      Add to Cart
    </motion.span>
  )}
</AnimatePresence>
// Button bg: primary → success (momentary), then back to primary — via animate + setTimeout
```

### Quantity Stepper Number Change

```tsx
// Number slides up or down based on direction:
const [qty, setQty] = useState(1)
const [direction, setDirection] = useState(1) // 1=up, -1=down

const increment = () => { setDirection(1); setQty(q => q + 1) }
const decrement = () => { setDirection(-1); setQty(q => Math.max(1, q - 1)) }

<div className="flex items-center gap-3">
  <button onClick={decrement} className="[icon button classes]"><Minus className="h-4 w-4" /></button>
  <div className="w-8 text-center overflow-hidden h-6 relative">
    <AnimatePresence mode="wait" custom={direction}>
      <motion.span key={qty}
        custom={direction}
        variants={{
          enter:  (d) => ({ y: d > 0 ? 20 : -20, opacity: 0 }),
          center: { y: 0, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
          exit:   (d) => ({ y: d > 0 ? -20 : 20, opacity: 0, transition: { duration: 0.15 } })
        }}
        initial="enter" animate="center" exit="exit"
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-text"
      >
        {qty}
      </motion.span>
    </AnimatePresence>
  </div>
  <button onClick={increment} className="[icon button classes]"><Plus className="h-4 w-4" /></button>
</div>
```

### Filter Checkbox Toggle

```tsx
// Checkbox fill animation:
// Check icon: scale 0→1, duration 100ms, ease-out spring
// Fill bg: backgroundColor rgba(37,99,235,0)→rgba(37,99,235,1), 150ms

// Filter chip (active state):
const filterChipVariants = {
  inactive: { backgroundColor: 'rgba(17,17,17,1)', borderColor: 'rgba(31,31,31,1)' },
  active:   { backgroundColor: 'rgba(37,99,235,0.12)', borderColor: 'rgba(37,99,235,0.4)' }
}
// Transition: duration 150ms ease-out
```

### Form Input Focus Ring

```css
/* CSS handles this — Framer not needed for focus */
input:focus-visible {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-muted);
  transition: border-color 150ms, box-shadow 150ms;
}
/* The ring expands from 0 to 3px — no animation needed, instant is fine here */
```

---

## 7.10 Marquee Animation (Reviews Section)

```css
/* CSS-only marquee — no JS/Framer needed */

/* Row 1: scrolls left */
@keyframes marquee-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* Row 2: scrolls right */
@keyframes marquee-right {
  from { transform: translateX(-50%); }
  to   { transform: translateX(0); }
}

.marquee-track {
  display: flex;
  width: max-content; /* must be wider than container */
  /* Duplicate content: render items twice for seamless loop */
}

.marquee-track--left {
  animation: marquee-left 35s linear infinite;
}

.marquee-track--right {
  animation: marquee-right 35s linear infinite;
}

/* Pause on hover */
.marquee-wrapper:hover .marquee-track--left,
.marquee-wrapper:hover .marquee-track--right {
  animation-play-state: paused;
}

/* Speed calculation:
   Given N cards, each card-width W, gap G:
   total-width = N * (W + G)
   For seamless loop: duplicate = 2 * total-width
   Speed in px/s = total-width / duration(s)
   Example: 6 cards × (340px + 24px) = 2184px
   At 35s: 2184 / 35 ≈ 62px/s — comfortable reading speed
*/

/* Edge fade (left/right transparency mask) */
.marquee-wrapper {
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 8%,
    black 92%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 8%,
    black 92%,
    transparent 100%
  );
}
```

```tsx
// Marquee HTML structure:
<div className="marquee-wrapper overflow-hidden">
  {/* Row 1 — scrolls left */}
  <div className="mb-4">
    <div className="marquee-track marquee-track--left flex gap-4">
      {[...reviews, ...reviews].map((r, i) => <ReviewCard key={i} {...r} />)}
    </div>
  </div>
  {/* Row 2 — scrolls right */}
  <div>
    <div className="marquee-track marquee-track--right flex gap-4">
      {[...reviewsAlt, ...reviewsAlt].map((r, i) => <ReviewCard key={i} {...r} />)}
    </div>
  </div>
</div>

// Reduced motion: if prefers-reduced-motion, set animation-play-state: paused always
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
```

---

# SECTION 8: ASCII WIREFRAMES

All wireframes use box-drawing characters. Character width represents approximate proportional layout.

---

## 8.1 Navigation Bar

### Desktop Navbar
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [Logo ◆ BrandName]   Home  Shop  Trending  Deals  About    [🔍] [♡] [🛒 2] [User]  │
└──────────────────────────────────────────────────────────────────────────────┘
  ←───── 64px tall, sticky, glass blur on scroll, max-w-[1280px] centered ────→
```

Detail breakdown:
```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    │
│  ◆ PlatformName      Home   Shop▾  Trending  Deals        🔍  ♡  🛒₂  [Account ▾]  │
│  (logo 32px)         (nav links, gap-1, text-sm)       (icon buttons, h-10 w-10)  │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
 bg: transparent→glass on scroll | h: 64px | border-bottom: 0→1px border-border
 z-index: 200 (sticky)
```

### Mobile Navbar (Collapsed)
```
┌──────────────────────────────┐
│ ☰  ◆ PlatformName   🔍  🛒₂  │
│ (menu) (logo)   (search)(cart)│
└──────────────────────────────┘
 h: 56px | glass on scroll
```

### Mobile Navbar (Expanded Drawer)
```
┌──────────────────────────────┐
│ ✕  ◆ PlatformName            │
├──────────────────────────────┤
│ 👤 Sign In / Register        │
├──────────────────────────────┤
│ 🏠 Home                      │
│ 🛍️ Shop All                  │
│ 🔥 Trending                  │
│ 💰 Deals                     │
│ ──────────────────────────   │
│ Categories                   │
│   Electronics          ›     │
│   Health & Beauty      ›     │
│   Home & Kitchen       ›     │
│   Sports & Fitness     ›     │
│   Fashion              ›     │
│ ──────────────────────────   │
│ 📦 My Orders                 │
│ ❤️ Wishlist                  │
│ ⚙️ Settings                  │
│ 🚪 Sign Out                  │
└──────────────────────────────┘
 width: 100vw | slides from left | backdrop blur behind
```

---

## 8.2 Hero Section

### Desktop (2-column, min-h: 100vh)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   [subtle blue glow bloom at top-center]                      │
│                                                                               │
│   ┌───────────────────────────────┐   ┌─────────────────────────────────┐   │
│   │ LEFT COLUMN (6/12 cols)       │   │ RIGHT COLUMN (6/12 cols)        │   │
│   │                               │   │                                 │   │
│   │ [🔥 Trending in India]         │   │    ╭─────────────────────╮     │   │
│   │                               │   │    │                     │     │   │
│   │ Discover Products             │   │    │   [Product Image]   │     │   │
│   │ People Are                    │   │    │   floating, 480px   │     │   │
│   │ [Obsessed With]               │   │    │                     │     │   │
│   │  ↑ animated word rotation     │   │    ╰─────────────────────╯     │   │
│   │                               │   │         [glow beneath]         │   │
│   │ Curated viral products from   │   │                                 │   │
│   │ across the internet, hand-    │   │  ┌──────────────────────────┐   │   │
│   │ picked for quality & value.   │   │  │ ★★★★★ 4.9 · 12,400+     │   │   │
│   │                               │   │  │ happy customers          │   │   │
│   │ [Shop Trending ↗] [Browse All]│   │  └──────────────────────────┘   │   │
│   │  primary+shimmer   outline    │   │                                 │   │
│   │                               │   │                                 │   │
│   │ ┌───┐ ┌───┐ ┌───┐            │   │                                 │   │
│   │ │+2K│ │4.9│ │48h│            │   │                                 │   │
│   │ │rev│ │★  │ │del│            │   │                                 │   │
│   │ └───┘ └───┘ └───┘            │   │                                 │   │
│   └───────────────────────────────┘   └─────────────────────────────────┘   │
│                                                                               │
│                      [↓ Scroll indicator]                                     │
└──────────────────────────────────────────────────────────────────────────────┘
 bg: #0A0A0A + subtle radial gradient | min-h: 100vh | pt: 128px + 64px navbar
```

### Mobile (stacked, min-h: auto)
```
┌──────────────────────────┐
│    [navbar 56px]         │
├──────────────────────────┤
│                          │
│  [🔥 Trending in India]   │
│                          │
│  Discover Products       │
│  People Are              │
│  [Obsessed With]         │
│                          │
│  ╭────────────────────╮  │
│  │   [Product Image]  │  │
│  │   300px, floating  │  │
│  ╰────────────────────╯  │
│                          │
│  Curated viral products  │
│  hand-picked for you.    │
│                          │
│  [Shop Trending ↗]       │
│  [Browse All Products]   │
│                          │
│  ★★★★★ 4.9 · 12,400+     │
│                          │
└──────────────────────────┘
 pt: 80px | pb: 80px | single column
```

---

## 8.3 Trending Products Carousel (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  🔥 Trending Right Now                              [View All Products →]    │
│  What everyone's buying this week                                             │
│                                                                               │
│  ◄   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ►           │
│      │          │  │          │  │          │  │          │                 │
│      │ [image]  │  │ [image]  │  │ [image]  │  │ [image]  │                 │
│      │          │  │          │  │          │  │          │                 │
│      ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤                 │
│      │🔥Trending│  │⚡Viral   │  │-40% Sale │  │🔥Trending│                 │
│      │          │  │          │  │          │  │          │                 │
│      │Neck       │  │Portable  │  │LED Strip │  │Mini Blender│               │
│      │Massager   │  │Projector │  │Lights    │  │Pro       │                 │
│      │          │  │          │  │          │  │          │                 │
│      │★★★★☆ 4.7│  │★★★★★ 4.9│  │★★★★☆ 4.6│  │★★★★★ 5.0│                 │
│      │(1,203)   │  │(892)     │  │(3,441)   │  │(521)     │                 │
│      │          │  │          │  │          │  │          │                 │
│      │₹1,299    │  │₹3,499    │  │₹799      │  │₹2,199    │                 │
│      │~~₹2,199~~│  │~~₹5,999~~│  │~~₹1,499~~│  │~~₹3,499~~│                 │
│      │          │  │          │  │          │  │          │                 │
│      │[Add Cart]│  │[Add Cart]│  │[Add Cart]│  │[Add Cart]│                 │
│      └──────────┘  └──────────┘  └──────────┘  └──────────┘                 │
│                                                                               │
│                    ●  ○  ○  ○  (dot indicators)                              │
└──────────────────────────────────────────────────────────────────────────────┘
 pt/pb: 96px | arrows: ghost icon buttons h-10 w-10 | drag to scroll
```

---

## 8.4 Problem Solvers Section (3-column Grid)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                    Products That Actually                                     │
│                    Solve Real Problems                                        │
│              Stop buying things that disappoint you.                          │
│                                                                               │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ │
│  │ ┌──┐                 │ │ ┌──┐                 │ │ ┌──┐                 │ │
│  │ │🔵│ Pain Relief      │ │ │🔵│ Sleep Better    │ │ │🔵│ Productivity    │ │
│  │ └──┘                 │ │ └──┘                 │ │ └──┘                 │ │
│  │                      │ │                      │ │                      │ │
│  │ Products engineered  │ │ From white noise to  │ │ Tools that eliminate │ │
│  │ for chronic back and │ │ sleep masks — gadgets│ │ distraction and keep │ │
│  │ neck pain sufferers. │ │ proven to improve    │ │ you in deep work     │ │
│  │                      │ │ sleep quality.       │ │ mode longer.         │ │
│  │ [Shop Pain Relief →] │ │ [Shop Sleep →]       │ │ [Shop Productivity→] │ │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
 bg: #111111 (surface) | pt/pb: 96px | cards: border border-border rounded-2xl
```

---

## 8.5 Viral Products Section (Masonry-style)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ⚡ Going Viral                                     [See All Viral →]        │
│  These are flying off the shelves — literally                                 │
│                                                                               │
│  ┌──────────────────────────┐    ┌──────────────┐   ┌──────────────┐        │
│  │ ⚡VIRAL                  │    │              │   │              │        │
│  │                          │    │  [image]     │   │  [image]     │        │
│  │   [Large product image   │    │              │   │              │        │
│  │    ~350px tall]          │    ├──────────────┤   ├──────────────┤        │
│  │                          │    │⚡Viral       │   │🔥Trending    │        │
│  ├──────────────────────────┤    │Product Name  │   │Product Name  │        │
│  │ Product Name Long Title  │    │★★★★★ 4.9    │   │★★★★☆ 4.7    │        │
│  │ ★★★★★ 5.0 (3,211)        │    │₹2,499 ~~₹4K~~│   │₹899 ~~₹1.5K~~│        │
│  │ ₹4,999  ~~₹8,999~~  -44% │    │[Add to Cart] │   │[Add to Cart] │        │
│  │ [Add to Cart — wide]     │    └──────────────┘   └──────────────┘        │
│  └──────────────────────────┘                                                │
│                                                                               │
│  ┌──────────────┐   ┌──────────────┐    ┌──────────────────────────┐        │
│  │              │   │              │    │ ⚡VIRAL                  │        │
│  │  [image]     │   │  [image]     │    │   [Large product image]  │        │
│  │              │   │              │    │                          │        │
│  ├──────────────┤   ├──────────────┤    ├──────────────────────────┤        │
│  │🔥Trending    │   │-30% Sale     │    │ Product Name             │        │
│  │Product Name  │   │Product Name  │    │ ★★★★★ 4.8 (1,822)        │        │
│  │₹1,299        │   │₹599          │    │ ₹3,299  ~~₹5,999~~  -45% │        │
│  │[Add to Cart] │   │[Add to Cart] │    │ [Add to Cart — wide]     │        │
│  └──────────────┘   └──────────────┘    └──────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────────┘
 bg: #0A0A0A | pt/pb: 96px | left large col: span-6, right 2-col: span-3 each
```

---

## 8.6 Why Us / Trust Signals Section

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                      Why 12,000+ Indians Choose Us                           │
│                                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │                │  │                │  │                │  │            │ │
│  │     🚚         │  │      ↩         │  │      🔒        │  │     🎧     │ │
│  │                │  │                │  │                │  │            │ │
│  │ Free Delivery  │  │ Easy Returns   │  │ Secure Pay     │  │ 24/7       │ │
│  │                │  │                │  │                │  │ Support    │ │
│  │ Free shipping  │  │ 30-day hassle- │  │ 100% secure    │  │            │ │
│  │ on orders      │  │ free returns   │  │ checkout with  │  │ Real humans│ │
│  │ above ₹499     │  │ on all items   │  │ SSL encryption │  │ not bots   │ │
│  │                │  │                │  │                │  │            │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └────────────┘ │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                               │
│    12,400+          4.9★          48hr           100%                        │
│    Reviews          Rating        Delivery       Authentic                    │
│    (animated count-up on scroll-enter)                                        │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
 bg: #111111 | pt/pb: 96px | 4-col icons + stats row below
```

---

## 8.7 Reviews Marquee Section

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Edge fade left]                                          [Edge fade right]  │
│                                                                               │
│  ←←  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  ←←      │
│      │ ◉ Priya S.      │ │ ◉ Rohan K.      │ │ ◉ Anjali M.     │          │
│      │ ★★★★★           │ │ ★★★★★           │ │ ★★★★☆           │          │
│      │ "This massager  │ │ "The projector  │ │ "Delivery was   │          │
│      │ changed my      │ │ is insane for   │ │ super fast and  │          │
│      │ morning routine │ │ the price. My   │ │ product quality │          │
│      │ completely!"    │ │ kids love it."  │ │ is top notch."  │          │
│      │ — Neck Massager │ │ — Mini Projector│ │ — LED Strip     │          │
│      └─────────────────┘ └─────────────────┘ └─────────────────┘          │
│                                                                               │
│  →→  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  →→      │
│      │ ◉ Amit D.       │ │ ◉ Sneha P.      │ │ ◉ Vikram T.     │          │
│      │ ★★★★★           │ │ ★★★★★           │ │ ★★★★★           │          │
│      │ "Ordered 3 for  │ │ "Finally a      │ │ "Best purchase  │          │
│      │ family gifts.   │ │ product that    │ │ I've made this  │          │
│      │ Everyone loved  │ │ actually works  │ │ year. Zero      │          │
│      │ it!"            │ │ as advertised." │ │ complaints."    │          │
│      │ — Smart Speaker │ │ — Posture Fix   │ │ — Blender Pro   │          │
│      └─────────────────┘ └─────────────────┘ └─────────────────┘          │
│                                                                               │
│           ★★★★★  4.9 average from 12,400+ verified reviews                  │
└──────────────────────────────────────────────────────────────────────────────┘
 bg: #111111 | pt/pb: 80px | full-bleed (no container max-width)
 Cards: min-w-[320px] | Row 1 scrolls left, Row 2 scrolls right
 Pause on hover | Edge mask gradient on left/right
```

---

## 8.8 Newsletter Section

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                   ┌──────────────────────────────────┐                      │
│                   │                                  │                      │
│                   │   📧 Never Miss a Viral Drop     │                      │
│                   │                                  │                      │
│                   │   Get notified when trending     │                      │
│                   │   products hit our store.        │                      │
│                   │   Subscribers get early access   │                      │
│                   │   + exclusive discounts.         │                      │
│                   │                                  │                      │
│                   │  ┌────────────────────┐ ┌──────┐ │                      │
│                   │  │ your@email.com     │ │ Join │ │                      │
│                   │  └────────────────────┘ └──────┘ │                      │
│                   │                                  │                      │
│                   │  🔒 No spam. Unsubscribe anytime │                      │
│                   │                                  │                      │
│                   └──────────────────────────────────┘                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
 bg: #0A0A0A | pt/pb: 96px | max-w-2xl centered | subtle border card
```

---

## 8.9 Product Listing Page (With Sidebar Filters + Grid)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                       │
├────────────────────────────────────────────────────────────────────────────────┤
│ Home > Shop > Electronics                  Sort: Most Popular ▾    ☰ Filters  │
├──────────────┬─────────────────────────────────────────────────────────────────┤
│ SIDEBAR      │ PRODUCT GRID (4-col desktop)                                   │
│ 280px fixed  │                                                                 │
│              │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ FILTERS      │ │🔥Trending│ │          │ │⚡Viral   │ │          │          │
│ ─────────    │ │[img]     │ │[img]     │ │[img]     │ │[img]     │          │
│              │ │          │ │          │ │          │ │          │          │
│ Category     │ │Name...   │ │Name...   │ │Name...   │ │Name...   │          │
│ ● All        │ │★★★★☆ 4.7│ │★★★★★ 4.9│ │★★★★☆ 4.6│ │★★★★★ 5.0│          │
│ ○ Electronics│ │₹1,299    │ │₹3,499    │ │₹799      │ │₹2,199    │          │
│ ○ Health     │ │[Add Cart]│ │[Add Cart]│ │[Add Cart]│ │[Add Cart]│          │
│ ○ Home       │ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│ ○ Fashion    │                                                                 │
│              │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ Price Range  │ │          │ │🔥Trending│ │          │ │⚡Viral   │          │
│ ─────────    │ │[img]     │ │[img]     │ │[img]     │ │[img]     │          │
│ ₹0  ────  ₹5K│ │          │ │          │ │          │ │          │          │
│ [slider]     │ │Name...   │ │Name...   │ │Name...   │ │Name...   │          │
│              │ │₹899      │ │₹1,199    │ │₹2,799    │ │₹1,099    │          │
│ Rating       │ │[Add Cart]│ │[Add Cart]│ │[Add Cart]│ │[Add Cart]│          │
│ ─────────    │ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│ ★★★★★ (214)  │                                                                 │
│ ★★★★☆ (891)  │             ‹  1  2  3  4  5  ›   Page 1 of 12               │
│ ★★★☆☆ (340)  │                                                                 │
│              │                                                                 │
│ Brand        │                                                                 │
│ ─────────    │                                                                 │
│ □ BrandA     │                                                                 │
│ □ BrandB     │                                                                 │
│ □ BrandC     │                                                                 │
│              │                                                                 │
│ [Clear All]  │                                                                 │
│ [Apply]      │                                                                 │
└──────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 8.10 Product Detail Page — Above Fold

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                       │
├────────────────────────────────────────────────────────────────────────────────┤
│ Home > Electronics > Neck Massager Pro                                         │
├───────────────────────────────────────┬────────────────────────────────────────┤
│ GALLERY (7/12 cols)                   │ PURCHASE BOX (5/12 cols)              │
│                                       │                                        │
│  ┌───────────────────────────────┐    │  NeckRelief Brand                      │
│  │                               │    │                                        │
│  │                               │    │  Neck & Shoulder Massager Pro          │
│  │       [Main Product Image]    │    │  with Heat Therapy                     │
│  │         500px × 500px         │    │                                        │
│  │                               │    │  ★★★★☆  4.7  (1,203 reviews)           │
│  │                               │    │  ✓ Verified 1,203 purchases            │
│  └───────────────────────────────┘    │                                        │
│                                       │  ─────────────────────────────────     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │                                        │
│  │thumb1│ │thumb2│ │thumb3│ │thumb4│ │  ₹1,299   ~~₹2,199~~   -41% off        │
│  └──────┘ └──────┘ └──────┘ └──────┘ │  or ₹130/month with no-cost EMI        │
│                                       │                                        │
│                                       │  Color                                 │
│                                       │  [● Black] [○ White] [○ Rose Gold]    │
│                                       │                                        │
│                                       │  ─────────────────────────────────     │
│                                       │                                        │
│                                       │  Quantity                              │
│                                       │  [−]  [  1  ]  [+]                    │
│                                       │                                        │
│                                       │  [     Add to Cart      ]  ← primary  │
│                                       │  [     Buy Now          ]  ← outline  │
│                                       │                                        │
│                                       │  ─────────────────────────────────     │
│                                       │                                        │
│                                       │  🚚 Free delivery by Thursday         │
│                                       │  ↩  30-day easy returns               │
│                                       │  🔒 Secure SSL checkout               │
│                                       │  ✓  In stock — ships in 24 hours      │
│                                       │                                        │
└───────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 8.11 Product Detail Page — Below Fold

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Product Description Tab] [Reviews Tab] [FAQs Tab]  ← tab underline variant   │
├────────────────────────────────────────────────────────────────────────────────┤
│                    The Problem We're Solving                                   │
│                                                                                │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐    │
│  │  ❌ Without this product        │  │  ✓ With this product            │    │
│  │                                 │  │                                 │    │
│  │  • Chronic neck stiffness       │  │  • 15-min daily relief session  │    │
│  │  • Expensive physio sessions    │  │  • Portable, use anywhere       │    │
│  │  • Temporary pain relief only   │  │  • Long-term improvement        │    │
│  └─────────────────────────────────┘  └─────────────────────────────────┘    │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                         Key Features                                           │
│                                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 🌡️ Heat     │  │ 📳 3 Modes  │  │ 🔋 Battery  │  │ 🤫 Quiet    │         │
│  │ Therapy     │  │ Intensity   │  │ 4hr Runtime  │  │ <40dB       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│  Customer Reviews              ★★★★☆  4.7  ·  1,203 reviews                   │
│                                                                                │
│  Rating breakdown:                                                             │
│  5★  ████████████████████░░░░ 68%                                              │
│  4★  █████████░░░░░░░░░░░░░░ 22%                                              │
│  3★  ███░░░░░░░░░░░░░░░░░░░░  7%                                              │
│  2★  ░░░░░░░░░░░░░░░░░░░░░░░  2%                                              │
│  1★  ░░░░░░░░░░░░░░░░░░░░░░░  1%                                              │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────┐       │
│  │ ◉ Priya S.  ★★★★★   Verified  ·  2 days ago                       │       │
│  │ "Absolutely love this! My neck pain is gone after just 3 days..."  │       │
│  └────────────────────────────────────────────────────────────────────┘       │
│  ┌────────────────────────────────────────────────────────────────────┐       │
│  │ ◉ Rohan M.  ★★★★☆   Verified  ·  1 week ago                       │       │
│  │ "Good product. Heat feature is great. Battery could be better..."   │       │
│  └────────────────────────────────────────────────────────────────────┘       │
│                         [Load More Reviews]                                    │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│  Frequently Asked Questions                                                    │
│                                                                                │
│  ▼ Is this product safe for daily use?                                         │
│    Yes, designed for daily 15-20 minute sessions...                            │
│                                                                                │
│  ▶ What's included in the box?                                                 │
│  ▶ How long does the battery last?                                             │
│  ▶ Can I use it while charging?                                                │
│  ▶ What is the return policy?                                                  │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8.12 Cart Drawer (Open State)

```
┌──────────────────────────────────────────────────┐
│  Your Cart                          ✕            │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ ┌──────┐  Neck Massager Pro               │  │
│  │ │[img] │  Color: Black                   │  │
│  │ │60px  │  ₹1,299   ~~₹2,199~~            │  │
│  │ └──────┘  Qty: [−][1][+]    [🗑 Remove]  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ ┌──────┐  Mini Portable Projector         │  │
│  │ │[img] │  Color: White                   │  │
│  │ │60px  │  ₹3,499   ~~₹5,999~~            │  │
│  │ └──────┘  Qty: [−][2][+]    [🗑 Remove]  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ Have a promo code?                          │  │
│  │ [ENTER CODE          ] [Apply]              │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
├──────────────────────────────────────────────────┤
│  Subtotal (3 items)              ₹8,297          │
│  Delivery                         FREE           │
│  ─────────────────────────────────────────────   │
│  Total                           ₹8,297          │
│                                                  │
│  [        Proceed to Checkout       ]            │
│  [        Continue Shopping         ]            │
│                                                  │
│  🔒 Secure checkout  ·  🚚 Free delivery ₹499+   │
└──────────────────────────────────────────────────┘
 width: 420px | slides from right | backdrop blur behind
```

---

## 8.13 Checkout Page — Address Step

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR simplified — logo + "Secure Checkout" + lock icon]                     │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  [Step 1: Address] ────────── [Step 2: Payment] ────────── [Step 3: Review]   │
│         ●                           ○                              ○           │
│                                                                                │
├──────────────────────────────────────┬─────────────────────────────────────────┤
│ DELIVERY DETAILS (max-w prose)       │ ORDER SUMMARY (sticky)                 │
│                                      │                                         │
│  Full Name                           │  ┌───────────────────────────────────┐  │
│  [                              ]    │  │ Neck Massager Pro × 1    ₹1,299  │  │
│                                      │  │ Mini Projector × 2       ₹6,998  │  │
│  Phone Number                        │  │                                   │  │
│  [+91                          ]     │  │ ─────────────────────────────── │  │
│                                      │  │ Subtotal                 ₹8,297  │  │
│  Email Address                       │  │ Delivery                   FREE  │  │
│  [                              ]    │  │ ─────────────────────────────── │  │
│                                      │  │ Total                    ₹8,297  │  │
│  Address Line 1                      │  └───────────────────────────────────┘  │
│  [                              ]    │                                         │
│                                      │  🔒 256-bit SSL Encryption              │
│  Address Line 2 (optional)           │  ✓ Trusted by 12,000+ customers         │
│  [                              ]    │                                         │
│                                      │                                         │
│  City              State             │                                         │
│  [           ]     [         ▾]      │                                         │
│                                      │                                         │
│  PIN Code          Country           │                                         │
│  [           ]     [India    ▾]      │                                         │
│                                      │                                         │
│  □ Save address for future orders    │                                         │
│                                      │                                         │
│  [    Continue to Payment    ]       │                                         │
│                                      │                                         │
└──────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 8.14 Checkout Page — Payment Step

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR simplified]                                                            │
├────────────────────────────────────────────────────────────────────────────────┤
│  [Step 1: Address ✓] ──── [Step 2: Payment] ──────── [Step 3: Review]          │
│          ✓                       ●                          ○                  │
├──────────────────────────────────────┬─────────────────────────────────────────┤
│ PAYMENT METHOD                       │ ORDER SUMMARY (sticky, same as step 1) │
│                                      │                                         │
│  ● UPI                               │                                         │
│    [UPI ID: yourname@upi      ]      │                                         │
│    [Verify & Pay]                    │                                         │
│                                      │                                         │
│  ○ Credit / Debit Card               │                                         │
│    Card Number                       │                                         │
│    [                              ]  │                                         │
│    Cardholder Name                   │                                         │
│    [                              ]  │                                         │
│    Expiry MM/YY   CVV                │                                         │
│    [        ]     [   ]              │                                         │
│                                      │                                         │
│  ○ Net Banking                       │                                         │
│    [Select Bank              ▾]      │                                         │
│                                      │                                         │
│  ○ Cash on Delivery                  │                                         │
│    Extra ₹50 COD charges apply       │                                         │
│                                      │                                         │
│  ○ No-Cost EMI                       │                                         │
│    6 months × ₹1,383/month           │                                         │
│                                      │                                         │
│  [      Place Order — ₹8,297    ]    │                                         │
│                                      │                                         │
│  🔒 Your payment is 100% secure      │                                         │
└──────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 8.15 Order Confirmation Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR simplified]                                                            │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│               ┌─────────────────────────────────────────┐                    │
│               │                                         │                    │
│               │          ✓ (animated checkmark)         │                    │
│               │                                         │                    │
│               │      Order Confirmed! 🎉                │                    │
│               │                                         │                    │
│               │   Your order #ORD-2026-38291 has been  │                    │
│               │   placed successfully.                  │                    │
│               │                                         │                    │
│               │   Estimated Delivery: Thu, Jun 4        │                    │
│               │                                         │                    │
│               │   A confirmation has been sent to       │                    │
│               │   priya@example.com                     │                    │
│               │                                         │                    │
│               └─────────────────────────────────────────┘                    │
│                                                                                │
│               Order Summary                                                    │
│               ┌────────────────────────────────────────┐                     │
│               │ Neck Massager Pro × 1       ₹1,299     │                     │
│               │ Mini Projector × 2          ₹6,998     │                     │
│               │ ─────────────────────────────────────  │                     │
│               │ Total                        ₹8,297    │                     │
│               │ Payment: UPI                           │                     │
│               │ Ship to: 42 MG Road, Bangalore...      │                     │
│               └────────────────────────────────────────┘                     │
│                                                                                │
│               [Track Your Order]      [Continue Shopping]                     │
│                                                                                │
│               You might also like:                                             │
│               [product][product][product][product]  ← recommendation row      │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8.16 Account Dashboard

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                       │
├──────────────────┬─────────────────────────────────────────────────────────────┤
│ SIDEBAR          │ CONTENT AREA                                               │
│ 240px            │                                                             │
│                  │  Welcome back, Priya! 👋                                    │
│ ◉ ○ Priya Singh  │                                                             │
│ priya@email.com  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│                  │  │    3     │ │    1     │ │    5     │ │  ₹8,297  │     │
│ ─────────────    │  │  Orders  │ │ Wishlist │ │ Reviews  │ │ Spent    │     │
│                  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│ 📦 My Orders     │                                                             │
│ ❤️ Wishlist (5)  │  Recent Orders                           [View All →]      │
│ 📝 Reviews       │  ┌──────────────────────────────────────────────────────┐  │
│ 👤 Profile       │  │ #ORD-38291 · Jun 1 · ₹8,297 · Delivered  [Track]   │  │
│ 📍 Addresses     │  │ 2 items: Neck Massager, Mini Projector              │  │
│ 💳 Payments      │  └──────────────────────────────────────────────────────┘  │
│ 🔔 Notifications │  ┌──────────────────────────────────────────────────────┐  │
│ ⚙️ Settings      │  │ #ORD-37102 · May 15 · ₹2,199 · Delivered [Review]  │  │
│ 🚪 Sign Out      │  │ 1 item: Smart LED Strip Lights                      │  │
│                  │  └──────────────────────────────────────────────────────┘  │
│                  │                                                             │
│                  │  Recommended For You                                        │
│                  │  [card][card][card][card]                                  │
└──────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 8.17 Login / Register Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR simplified — logo only]                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│         ┌─────────────────────────────────────────────────────┐              │
│         │                                                     │              │
│         │              ◆ PlatformName                         │              │
│         │                                                     │              │
│         │     [Sign In]  [Create Account]  ← tab toggle       │              │
│         │                                                     │              │
│         │  Email Address                                      │              │
│         │  [                                             ]    │              │
│         │                                                     │              │
│         │  Password                                           │              │
│         │  [                                        👁 ]      │              │
│         │                                  Forgot password?  │              │
│         │                                                     │              │
│         │  [           Sign In           ]                    │              │
│         │                                                     │              │
│         │  ─────────────  or  ─────────────                  │              │
│         │                                                     │              │
│         │  [G  Continue with Google     ]                     │              │
│         │                                                     │              │
│         │  Don't have an account? Create one →               │              │
│         │                                                     │              │
│         └─────────────────────────────────────────────────────┘              │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
 max-w-[400px] centered | bg: #0A0A0A | card: bg-surface-overlay border
```

---

## 8.18 Admin Dashboard Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Admin Navbar: Logo | Dashboard | Products | Orders | Analytics | Settings]    │
├──────────────┬─────────────────────────────────────────────────────────────────┤
│ SIDEBAR      │ ADMIN CONTENT                                                  │
│ 200px        │                                                                 │
│              │  Dashboard Overview                 Today: Jun 1, 2026          │
│ Dashboard    │                                                                 │
│ Products     │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ Orders       │  │ ₹48,291  │ │   127    │ │   23     │ │  4.8 ★   │         │
│ Customers    │  │ Revenue  │ │ Orders   │ │ Products │ │ Avg Rat  │         │
│ Analytics    │  │ Today    │ │ Today    │ │ Low Stock│ │          │         │
│ Discounts    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│ Settings     │                                                                 │
│              │  Revenue Chart (7-day)                     [7d][30d][90d]      │
│              │  ┌───────────────────────────────────────────────────────────┐ │
│              │  │     ╭──╮                                                  │ │
│              │  │  ╭──╯  ╰──╮   ╭──╮                                       │ │
│              │  │ ╭╯        ╰───╯  ╰──╮                                    │ │
│              │  └───────────────────────────────────────────────────────────┘ │
│              │                                                                 │
│              │  Recent Orders                          [View All Orders →]    │
│              │  ┌───────────────────────────────────────────────────────────┐ │
│              │  │ #38291 │ Priya S.   │ ₹8,297 │ Processing │ [View]       │ │
│              │  │ #38290 │ Rohan K.   │ ₹3,499 │ Shipped    │ [View]       │ │
│              │  │ #38289 │ Anjali M.  │ ₹1,299 │ Delivered  │ [View]       │ │
│              │  └───────────────────────────────────────────────────────────┘ │
│              │                                                                 │
│              │  Low Stock Alerts                                               │
│              │  ┌───────────────────────────────────────────────────────────┐ │
│              │  │ Neck Massager Pro    ·  3 units left   [Restock ↗]        │ │
│              │  │ Mini Projector       ·  1 unit left    [Restock ↗]        │ │
│              │  └───────────────────────────────────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 8.19 Admin Product Form

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Admin Navbar]                                                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│ ‹ Back to Products      Add New Product                    [Save Draft] [Publish]│
├──────────────────────────────────────────┬─────────────────────────────────────┤
│ PRODUCT DETAILS                          │ MEDIA & PRICING                    │
│                                          │                                     │
│  Product Title                           │  Images                             │
│  [                                   ]   │  ┌───────────┬──────┬──────┐       │
│                                          │  │           │      │      │       │
│  Description                             │  │  [Main    │[img2]│[img3]│       │
│  [                                   ]   │  │  Image]   │      │      │       │
│  [                                   ]   │  │           │      │      │       │
│  [                                   ]   │  └───────────┴──────┴──────┘       │
│  [                                   ]   │  [+ Upload Images]                  │
│                                          │                                     │
│  Brand                                   │  Pricing                            │
│  [                                   ]   │  Price (₹)    [          ]          │
│                                          │  Compare-at   [          ]          │
│  Category                                │  Cost price   [          ]          │
│  [Select category               ▾]       │                                     │
│                                          │  Stock                              │
│  Tags (comma separated)                  │  Quantity     [          ]          │
│  [                                   ]   │  SKU          [          ]          │
│                                          │                                     │
│  Variants                                │  Status                             │
│  Color: [Add option]                     │  ● Active  ○ Draft  ○ Archived     │
│  Size:  [Add option]                     │                                     │
│                                          │  Badge                              │
│  Problem it solves (for PDP section)     │  ○ None  ● Trending  ○ Viral       │
│  [                                   ]   │  ○ New   ○ Sale      ○ Featured    │
│  [                                   ]   │                                     │
│                                          │  SEO                                │
│  Features (one per line)                 │  Meta title  [                  ]   │
│  [                                   ]   │  Meta desc   [                  ]   │
│  [                                   ]   │                                     │
└──────────────────────────────────────────┴─────────────────────────────────────┘
```

---

## 8.20 Mobile Product Detail Page

```
┌──────────────────────────────┐
│ [←] [  Neck Massager Pro  ] [♡][⋮]│
├──────────────────────────────┤
│                              │
│  ╔════════════════════════╗  │
│  ║                        ║  │
│  ║   [Main Product Image] ║  │
│  ║       360px tall       ║  │
│  ║                        ║  │
│  ╚════════════════════════╝  │
│   ─ ─ ● ─ ─  (thumb dots)   │
│                              │
│  🔥 Trending                 │
│                              │
│  Neck & Shoulder             │
│  Massager Pro with Heat      │
│                              │
│  ★★★★☆  4.7  (1,203)         │
│                              │
│  ₹1,299   ~~₹2,199~~         │
│  -41% off                    │
│  or ₹130/mo EMI              │
│                              │
│  Color: Black                │
│  [●Black][○White][○Rose]     │
│                              │
│  ─────────────────────────   │
│                              │
│  🚚 Free delivery Thu        │
│  ↩  30-day returns           │
│  🔒 Secure checkout          │
│                              │
│  ─────────────────────────   │
│                              │
│  Product Details  Reviews    │
│  FAQs                        │
│  ─────────────────────────   │
│  [tab content area]          │
│                              │
├──────────────────────────────┤
│  QTY: [−][1][+]              │
│  [    Add to Cart    ]       │
│  [    Buy Now        ]       │
└──────────────────────────────┘
 Bottom bar: fixed, py-3 px-4 border-t, bg-surface-overlay
```

---

## 8.21 Mobile Navigation Drawer

```
┌──────────────────────────────┐
│ ✕             ◆ PlatformName │
├──────────────────────────────┤
│ ┌────────────────────────┐   │
│ │ ◉ Sign In / Register  │   │
│ │ Get early access & more│   │
│ └────────────────────────┘   │
├──────────────────────────────┤
│ 🏠 Home                      │
│ 🛍️ Shop All Products         │
│ 🔥 Trending Now              │
│ ⚡ Going Viral               │
│ 🏷️ Deals & Offers            │
├──────────────────────────────┤
│ CATEGORIES                   │
│ 💻 Electronics          ›    │
│ 💄 Health & Beauty      ›    │
│ 🏠 Home & Kitchen       ›    │
│ 👟 Sports & Fitness     ›    │
│ 👕 Fashion              ›    │
│ 🧸 Toys & Games         ›    │
├──────────────────────────────┤
│ 📦 My Orders                 │
│ ❤️  Wishlist (3)             │
│ ⚙️  Settings                 │
│ 🚪 Sign Out                  │
└──────────────────────────────┘
 Slides from left, full-height, 85vw max-width
 Backdrop: bg-bg/60 backdrop-blur-sm
```

---

## 8.22 Search Results Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                       │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────┐                 │
│  │ 🔍  neck massager                                    ✕   │                 │
│  └──────────────────────────────────────────────────────────┘                 │
│                                                                                │
│  48 results for "neck massager"               Sort: Relevance ▾               │
│                                                                                │
│  Filter chips: [All] [Under ₹1,000] [₹1K–₹3K] [₹3K+] [4★+] [Free Delivery]  │
│                                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │🔥Trending│ │          │ │⚡Viral   │ │          │                         │
│  │[img]     │ │[img]     │ │[img]     │ │[img]     │                         │
│  │Neck Mass.│ │Cervical  │ │Shiatsu   │ │EMS       │                         │
│  │₹1,299    │ │₹899      │ │₹2,499    │ │₹1,999    │                         │
│  │[Add Cart]│ │[Add Cart]│ │[Add Cart]│ │[Add Cart]│                         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │          │ │🔥Trending│ │          │ │-30% Sale │                         │
│  │[img]     │ │[img]     │ │[img]     │ │[img]     │                         │
│  │₹799      │ │₹1,599    │ │₹3,299    │ │₹699      │                         │
│  │[Add Cart]│ │[Add Cart]│ │[Add Cart]│ │[Add Cart]│                         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                         │
│                                                                                │
│              ‹  1  2  3  …  12  ›                                              │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8.23 Empty Cart State

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                       │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│                      ┌───────────────────────────────┐                       │
│                      │                               │                       │
│                      │        🛒  (large icon)       │                       │
│                      │                               │                       │
│                      │     Your cart is empty        │                       │
│                      │                               │                       │
│                      │  Looks like you haven't       │                       │
│                      │  added anything yet.          │                       │
│                      │  Let's fix that!              │                       │
│                      │                               │                       │
│                      │  [  Start Shopping  ]         │                       │
│                      │  [  View Trending   ]         │                       │
│                      │                               │                       │
│                      └───────────────────────────────┘                       │
│                                                                                │
│         Trending Products                                                      │
│         [card] [card] [card] [card]    ← recommendations                      │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8.24 404 Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                                       │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│                                                                                │
│              404                                                               │
│              (huge, text-8xl, gradient text)                                   │
│                                                                                │
│              Page Not Found                                                    │
│                                                                                │
│              The page you're looking for doesn't                               │
│              exist or has been moved.                                          │
│                                                                                │
│              [  Go to Homepage  ]    [  Browse Products  ]                    │
│                                                                                │
│              ─────────────────────────────────────────────                    │
│                                                                                │
│              You might be looking for:                                         │
│              [card] [card] [card]  ← popular products                         │
│                                                                                │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
 min-h: 100vh flex items-center justify-center (content area)
 "404" uses gradient-text-blue class
```

---

# SECTION 9: RESPONSIVE STRATEGY

## 9.1 Breakpoint System

```
xs:  375px  — iPhone SE, small Androids (mobile-first baseline)
sm:  640px  — Large phones, small tablets (portrait)
md:  768px  — Tablets (portrait), large phones (landscape)
lg:  1024px — Tablets (landscape), small laptops
xl:  1280px — Laptops, desktops (primary target)
2xl: 1400px — Large monitors, wide displays
```

All CSS is written mobile-first. Tailwind classes without prefix apply to all sizes. Prefixed classes (`md:`, `lg:`, etc.) apply at and above that breakpoint.

---

## 9.2 Navigation — Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| xs–md      | Hamburger menu, logo centered-ish, cart+search icons right | Drawer slides from left |
| lg+        | Horizontal nav links, logo left, icons right | Mega menu on hover |

```tsx
// Navbar responsive classes:
"h-[56px] lg:h-[64px]"

// Logo: always visible
// Nav links: "hidden lg:flex items-center gap-1"
// Mobile menu button: "flex lg:hidden"
// Search icon: always visible
// Cart icon: always visible
// Account icon: "hidden lg:flex" — mobile uses drawer menu
```

---

## 9.3 Hero — Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| xs         | Single column, text top, image below | min-h: auto, pt-20 pb-20 |
| sm–md      | Single column, text centered, image below | min-h: auto |
| lg+        | 2-column split, text left, image right | min-h: 100vh |

```tsx
// Hero grid:
"grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 items-center"

// Image order: below text on mobile (order-2 lg:order-1), right on desktop
"order-2 lg:order-none"

// H1 size:
"text-5xl sm:text-6xl lg:text-7xl"

// Hero padding:
"pt-24 pb-20 lg:pt-32 lg:pb-32"

// Image size: "w-full max-w-[340px] mx-auto lg:max-w-none lg:w-[480px]"
```

---

## 9.4 Product Grid — Responsive Behavior

| Breakpoint | Columns | Card aspect |
|------------|---------|-------------|
| xs         | 2       | 1:1.1 (portrait) |
| sm         | 2       | 1:1 |
| md         | 3       | 1:1 |
| lg         | 3–4     | 1:1 |
| xl         | 4       | 1:1 |

```tsx
"grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"

// On mobile: cards get slightly less padding
// "p-3 sm:p-4"

// Product name: line-clamp-2 on all sizes
// Add to cart button: always full-width within card
// Price: always visible (never truncated)
```

---

## 9.5 PDP Layout — Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| xs–md      | Stacked: image full-width top, purchase box below | No sidebar |
| lg+        | Side by side: 7/12 gallery, 5/12 purchase | Both visible |

```tsx
// PDP grid:
"grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"

// Gallery: "lg:col-span-7"
// Purchase box: "lg:col-span-5"

// Main image: "aspect-square w-full lg:aspect-[4/3]"
// Thumbnails: "flex gap-2 overflow-x-auto lg:overflow-visible"
// Sticky purchase box: "lg:sticky lg:top-[80px]" (accounts for navbar)

// Mobile bottom bar (fixed Add to Cart):
"fixed bottom-0 left-0 right-0 z-sticky lg:hidden
 bg-surface-overlay border-t border-border px-4 py-3 flex gap-3"
// [Buy Now ghost] [Add to Cart primary flex-1]
```

---

## 9.6 Cart — Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| xs–md      | Full-screen drawer (100vw) | Bottom checkout bar |
| lg+        | Side drawer (420px max) | Standard checkout button in footer |

```tsx
"fixed inset-y-0 right-0 z-modal w-full max-w-full sm:max-w-[420px]"

// On mobile: cart drawer is effectively full-screen
// Close button: always visible at top-right
// Product images in cart: "h-16 w-16 sm:h-20 sm:w-20"
```

---

## 9.7 Checkout — Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| xs–md      | Single column: form then summary | Summary collapses/expands |
| lg+        | 2-column: form left, summary right sticky | |

```tsx
"grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8"

// Order summary on mobile: collapsible accordion
// "lg:sticky lg:top-[80px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto"

// Step indicator: shows labels on lg+, only icons on mobile
"hidden sm:flex" for step labels
```

---

## 9.8 Account — Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| xs–md      | Tabs at top (horizontal scroll), full-width content | No sidebar |
| lg+        | Left sidebar (240px), content right | |

```tsx
// Sidebar: "hidden lg:block w-[240px] shrink-0"
// Mobile tab navigation: horizontal scroll tabs at top
"flex overflow-x-auto gap-1 border-b border-border no-scrollbar"
```

---

## 9.9 Footer — Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| xs         | Single column stacked | Logo, then each column stacked |
| sm–md      | 2-column grid | |
| lg+        | 4-column grid | |

```tsx
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"

// Social icons: always visible (row)
// Newsletter in footer: hidden on mobile (standalone section above handles it)
// Copyright bar: flex-col on mobile, flex-row on desktop
```

---

## 9.10 Touch Interaction Adaptations

```
Minimum tap target:   48×48px (all interactive elements)
Swipe gestures:       Carousel: horizontal swipe | Bottom drawer: swipe down to close
Long press:           Not used (avoids conflict with native text selection)
Pinch zoom:           Allowed on product images (don't disable user-scale)
Scroll:               Momentum scrolling: -webkit-overflow-scrolling: touch
Pull to refresh:      Not implemented (rely on browser native)

Hover states on touch: suppress hover CSS on touch devices
@media (hover: none) {
  .card:hover { transform: none; box-shadow: var(--shadow-card); }
  button:hover { transform: none; }
}

Touch target padding helper:
.touch-target {
  position: relative;
}
.touch-target::after {
  content: '';
  position: absolute;
  inset: -8px; /* Extends tap area without affecting visual */
}
```

---

## 9.11 Font Size Adjustments Per Breakpoint

| Element          | xs (375px) | sm (640px) | md (768px) | lg+ (1024px+) |
|------------------|------------|------------|------------|---------------|
| H1 hero          | text-5xl   | text-6xl   | text-6xl   | text-7xl      |
| H2 sections      | text-3xl   | text-3xl   | text-3xl   | text-4xl      |
| H3 sub-sections  | text-xl    | text-xl    | text-xl    | text-2xl      |
| Body             | text-base  | text-base  | text-base  | text-base     |
| Small text       | text-sm    | text-sm    | text-sm    | text-sm       |
| Caption          | text-xs    | text-xs    | text-xs    | text-xs       |
| Price (PDP)      | text-3xl   | text-3xl   | text-3xl   | text-4xl      |
| Price (card)     | text-sm    | text-base  | text-base  | text-base     |
| Nav links        | —          | text-sm    | text-sm    | text-sm       |
| Button sm        | text-xs    | text-xs    | text-sm    | text-sm       |
| Button md        | text-sm    | text-sm    | text-sm    | text-sm       |
| Badge text       | text-[10px]| text-xs    | text-xs    | text-xs       |

---

## 9.12 Desktop-Only vs Mobile-Only Features

**Desktop-Only:**
- Horizontal navigation links (replaced by hamburger drawer on mobile)
- Mega menu on hover
- Side-by-side PDP layout (stacked on mobile)
- Product grid 4-column layout (max 2 on mobile)
- Persistent left sidebar on product listing (drawer on mobile)
- Cart drawer at 420px max (full-screen on mobile)
- Sticky order summary on checkout
- Account page sidebar navigation

**Mobile-Only:**
- Fixed bottom bar (Add to Cart + Buy Now) on PDP
- Hamburger / drawer navigation
- Bottom sheet for filters
- Full-screen cart drawer
- Tab-based account navigation (no sidebar)
- Swipe gesture on carousels (arrows still visible but secondary)
- Pull-to-close gesture on bottom drawers

---

# SECTION 10: ACCESSIBILITY STANDARDS

## 10.1 WCAG 2.1 AA Compliance Checklist

```
PERCEIVABLE
✓ 1.1.1  Non-text content: All images have alt text. Decorative images: alt=""
✓ 1.3.1  Info and relationships: Use semantic HTML (nav, main, aside, footer, h1-h6)
✓ 1.3.2  Meaningful sequence: DOM order matches visual reading order
✓ 1.3.3  Sensory characteristics: Not relying on color alone to convey info
✓ 1.4.1  Use of color: Icons + text labels (never color alone for status)
✓ 1.4.3  Contrast (minimum): AA — all text at 4.5:1 minimum (verified in Section 3)
✓ 1.4.4  Resize text: Works at 200% browser zoom without horizontal scroll
✓ 1.4.10 Reflow: Single column at 320px width, no horizontal scrolling
✓ 1.4.11 Non-text contrast: UI components 3:1 minimum against adjacent colors
✓ 1.4.12 Text spacing: Supports increased line/letter/word spacing without breakage

OPERABLE
✓ 2.1.1  Keyboard: All interactive elements reachable and operable by keyboard alone
✓ 2.1.2  No keyboard trap: Focus can move in/out of all components
✓ 2.4.1  Skip navigation: "Skip to main content" link as first focusable element
✓ 2.4.2  Page titled: Unique <title> per page/route
✓ 2.4.3  Focus order: Logical focus order matching visual layout
✓ 2.4.4  Link purpose: Link text describes destination (never "click here")
✓ 2.4.6  Headings/labels: Descriptive headings, visible labels on all forms
✓ 2.4.7  Focus visible: All focused elements have visible focus ring

UNDERSTANDABLE
✓ 3.1.1  Language of page: <html lang="en">
✓ 3.2.1  On focus: No unexpected context changes on focus
✓ 3.2.2  On input: No unexpected context changes on input
✓ 3.3.1  Error identification: Errors identified in text, not color alone
✓ 3.3.2  Labels or instructions: All form fields have visible labels
✓ 3.3.3  Error suggestion: Error messages suggest corrections when possible

ROBUST
✓ 4.1.1  Parsing: Valid HTML5, no duplicate IDs
✓ 4.1.2  Name/role/value: ARIA roles and labels on custom components
✓ 4.1.3  Status messages: Screen reader receives success/error announcements (aria-live)
```

---

## 10.2 Focus Ring Specification

```css
/* Default focus ring — keyboard navigation only */
:focus { outline: none; }

:focus-visible {
  outline: 2px solid #2563EB;        /* --color-primary */
  outline-offset: 2px;
  border-radius: 4px;                 /* matches element radius approximately */
}

/* For rounded elements (buttons, pills): */
.rounded-full:focus-visible { border-radius: 9999px; }
.rounded-lg:focus-visible   { border-radius: 8px; }
.rounded-2xl:focus-visible  { border-radius: 16px; }

/* High contrast mode support: */
@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid ButtonText;
    outline-offset: 2px;
  }
}
```

---

## 10.3 Skip Navigation Link

```tsx
// First element in <body>, before navbar:
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
             focus:z-top focus:px-4 focus:py-2 focus:rounded-lg
             focus:bg-primary focus:text-white focus:text-sm focus:font-semibold
             focus:shadow-lg"
>
  Skip to main content
</a>

// Main content target:
<main id="main-content" tabIndex={-1}>
  {children}
</main>
// tabIndex={-1} allows programmatic focus without appearing in tab order
```

---

## 10.4 ARIA Roles and Labels for Key Components

```tsx
// Navigation
<nav aria-label="Main navigation">
<nav aria-label="Breadcrumb">
<nav aria-label="Pagination">

// Buttons with icons only
<button aria-label="Add to wishlist">
<button aria-label="Remove from cart">
<button aria-label="Close cart">
<button aria-label={`Add ${product.name} to cart`}>

// Cart badge
<span aria-label={`${count} items in cart`}>
  {/* Visible: number badge */}
</span>

// Star rating (static display)
<div role="img" aria-label={`Rated ${rating} out of 5 stars`}>
  {/* Visual stars */}
</div>

// Star rating (interactive)
<fieldset aria-label="Rate this product">
  <legend className="sr-only">Your rating</legend>
  {[1,2,3,4,5].map(star => (
    <label key={star}>
      <input type="radio" name="rating" value={star} className="sr-only" />
      <Star aria-label={`${star} star${star > 1 ? 's' : ''}`} />
    </label>
  ))}
</fieldset>

// Image gallery
<div role="region" aria-label="Product images">
  <img alt={`${product.name} — view 1 of ${total}`} />
  <button aria-label="Previous image">
  <button aria-label="Next image">
</div>

// Modal/Dialog
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Delete</h2>
</div>

// Accordion
<div role="region" aria-labelledby="faq-btn-1">
  <button id="faq-btn-1" aria-expanded={isOpen} aria-controls="faq-panel-1">
    Question text
  </button>
  <div id="faq-panel-1" role="region" aria-labelledby="faq-btn-1" hidden={!isOpen}>
    Answer text
  </div>
</div>

// Loading/async states
<div aria-busy="true" aria-label="Loading products">
<div role="status" aria-live="polite">Products loaded</div>
<div role="alert" aria-live="assertive">Error loading products</div>

// Form errors
<input aria-invalid={hasError} aria-describedby="field-error" />
<p id="field-error" role="alert">Error message</p>

// Cart drawer
<div role="dialog" aria-label="Shopping cart" aria-modal="true">

// Tabs
<div role="tablist" aria-label="Product details">
  <button role="tab" aria-selected={isActive} aria-controls="tab-panel-id">
<div role="tabpanel" id="tab-panel-id" aria-labelledby="tab-btn-id">

// Progress/steps
<nav aria-label="Checkout steps">
  <ol>
    <li aria-current="step">Address</li>
    <li>Payment</li>
    <li>Review</li>
  </ol>
</nav>

// Search
<input type="search" aria-label="Search products" role="searchbox"
       aria-autocomplete="list" aria-haspopup="listbox" />
<ul role="listbox" aria-label="Search suggestions">
  <li role="option">suggestion</li>
</ul>
```

---

## 10.5 Keyboard Navigation Patterns

```
Global:
  Tab:         Move forward through focusable elements
  Shift+Tab:   Move backward
  Enter/Space: Activate buttons, links, checkboxes
  Escape:      Close modals, drawers, dropdowns, overlays
  /            Open search (when not in input) — custom hotkey

Modal/Dialog:
  Focus trap:  Tab cycles within modal only
  Escape:      Close modal, return focus to trigger
  On open:     Focus moves to first focusable element inside

Dropdown/Select:
  ArrowDown:   Open dropdown, move to next option
  ArrowUp:     Move to previous option
  Enter:       Select highlighted option
  Escape:      Close dropdown without selection
  Home/End:    Jump to first/last option

Tabs:
  ArrowRight:  Move to next tab (activate)
  ArrowLeft:   Move to previous tab (activate)
  Home:        First tab
  End:         Last tab

Accordion:
  Enter/Space: Toggle accordion item
  Tab:         Move to next accordion header

Carousel:
  ArrowRight:  Next slide
  ArrowLeft:   Previous slide
  Home:        First slide
  End:         Last slide

Star Rating (interactive):
  ArrowRight/Up:   Increase rating
  ArrowLeft/Down:  Decrease rating
  1–5 keys:        Set specific rating

Quantity Stepper:
  ArrowUp:     Increment
  ArrowDown:   Decrement
  Type number: Direct input (if type="number")

Cart Drawer:
  On open:     Focus → Close button (first focusable)
  Tab within:  Close → items → remove buttons → promo → checkout
  Escape:      Close drawer, return focus to cart icon
```

---

## 10.6 Screen Reader Considerations

```tsx
// Visually hidden utility (sr-only — screen reader only):
// Already in Tailwind: className="sr-only"

// Price with strikethrough — screen readers need context:
<span aria-label={`Sale price ₹${current}. Was ₹${compare}. ${discount}% discount.`}>
  <span aria-hidden="true">₹{current}</span>
  <span aria-hidden="true" className="line-through">₹{compare}</span>
</span>

// Product card — annotate wisely:
<article aria-label={product.name}>
  <img alt={product.imageAlt || product.name} />
  {/* Don't repeat product name in alt if heading already names it */}
  <h3>{product.name}</h3>
  <div aria-label={`${rating} stars from ${count} reviews`}>
    <Star aria-hidden="true" /> {/* Icons: aria-hidden */}
    <span className="sr-only">{rating} out of 5 stars</span>
    <span>({count})</span>
  </div>
</article>

// Announcements for dynamic actions:
// Add to cart success:
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {lastAddedProduct} added to cart
</div>

// Wishlist toggle:
<div role="status" aria-live="polite" className="sr-only">
  {isWishlisted ? `${product.name} added to wishlist` : `${product.name} removed from wishlist`}
</div>

// Loading completion:
<div role="status" aria-live="polite" className="sr-only">
  {isLoading ? 'Loading products' : `${count} products loaded`}
</div>
```

---

## 10.7 Reduced Motion Handling

```tsx
// Global (in globals.css):
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// In Framer Motion — use the hook:
import { useReducedMotion } from 'framer-motion'

function AnimatedSection({ children }) {
  const prefersReduced = useReducedMotion()

  const variants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

  return (
    <motion.div variants={variants} initial="hidden" whileInView="visible">
      {children}
    </motion.div>
  )
}

// Marquee: stop in reduced motion
.animate-marquee {
  animation: marquee-left 35s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-marquee, .animate-marquee-reverse { animation: none; }
}

// Float: remove in reduced motion
@media (prefers-reduced-motion: reduce) {
  .animate-float { animation: none; }
}

// Shimmer: keep as static gradient (not animated)
@media (prefers-reduced-motion: reduce) {
  .shimmer { animation: none; background: var(--color-surface-raised); }
}

// Hero rotating words: stay on single word in reduced motion
if (prefersReduced) clearInterval(wordRotationInterval)
```

---

# SECTION 11: COMPONENT INTERACTION STATES MATRIX

For every interactive element, the exact visual specification for each state:

## 11.1 Complete States Matrix

| Component | Default | Hover | Focus (keyboard) | Active/Pressed | Loading | Success | Error | Disabled |
|-----------|---------|-------|-----------------|----------------|---------|---------|-------|----------|
| **Primary Button** | bg:#2563EB text:white shadow-button-primary | bg:#1D4ED8 y:-1px shadow-button-primary-hover | ring-2 ring-primary ring-offset-2 ring-offset-bg | bg:#1E40AF scale(0.98) y:0 | bg:#2563EB + spinner, aria-busy | bg:#16A34A 1.5s then revert | — | opacity:40% pointer-events:none |
| **Outline Button** | border:#2A2A2A bg:transparent text:white | border:#2563EB bg:primary-muted | ring-2 ring-primary ring-offset-2 | scale(0.98) | border + spinner | border-success momentary | — | opacity:40% |
| **Ghost Button** | bg:transparent text:white | bg:rgba(255,255,255,0.06) | ring-2 ring-white/20 ring-offset-2 | bg:rgba(255,255,255,0.10) scale(0.98) | spinner | — | — | opacity:40% |
| **Destructive Button** | bg:#EF4444 text:white shadow-error | bg:#DC2626 y:-1px | ring-2 ring-error ring-offset-2 | bg:#B91C1C scale(0.98) | spinner | — | — | opacity:40% |
| **Icon-only Button** | bg:transparent text:text-secondary | bg:surface-raised text:text | ring-2 ring-primary ring-offset-1 | bg:surface-overlay scale(0.95) | spinner | — | — | opacity:40% |
| **Text Input** | border:#1F1F1F bg:#080808 text:white | border:#2A2A2A | border:#2563EB shadow:[0_0_0_3px_primary-muted] | same as focus | — | border-success shadow-success-glow | border-error shadow-error-glow | opacity:50% bg:surface-sunken/50 |
| **Textarea** | same as input | border:#2A2A2A | border:#2563EB shadow-primary-muted | same as focus | — | border-success | border-error | opacity:50% |
| **Select** | border:#1F1F1F bg:#080808 | border:#2A2A2A | border:#2563EB shadow-primary-muted | — | — | — | border-error | opacity:50% |
| **Checkbox (unchecked)** | border:#2A2A2A bg:#080808 | border:#2563EB | ring-2 ring-primary ring-offset-1 | — | — | — | border-error | opacity:40% |
| **Checkbox (checked)** | bg:#2563EB border:#2563EB check:white | bg:#1D4ED8 | ring-2 ring-primary ring-offset-1 | scale(0.90) | — | — | border-error | opacity:40% |
| **Radio (unchecked)** | border:#2A2A2A bg:transparent | border:#2563EB | ring-2 ring-primary ring-offset-1 | — | — | — | border-error | opacity:40% |
| **Radio (checked)** | border:#2563EB inner-dot:#2563EB | border:#1D4ED8 | ring-2 ring-primary ring-offset-1 | dot scale(0.85) | — | — | border-error | opacity:40% |
| **Toggle (off)** | bg:#1F2937 thumb:white | bg:#374151 | ring-2 ring-primary ring-offset-2 | scale(0.97) | — | — | — | opacity:40% |
| **Toggle (on)** | bg:#2563EB thumb:white thumb-x:+20px | bg:#1D4ED8 | ring-2 ring-primary ring-offset-2 | scale(0.97) | — | — | — | opacity:40% |
| **Product Card** | border:#1F1F1F bg:#111111 shadow-card | border:#2A2A2A y:-4px shadow-card-hover | ring-2 ring-primary/40 rounded-2xl | y:0 shadow-card | skeleton overlay | — | — | opacity:50% |
| **Wishlist Button** | text:#6B7280 heart-outline | text:#EF4444 scale(1.10) | ring-2 ring-primary ring-offset-2 | scale(0.85) | — | text:#EF4444 fill:currentColor | — | opacity:40% |
| **Add to Cart** | [primary button rules] | [primary hover] | [primary focus] | [primary tap] | spinner + "Adding..." | check icon + "Added!" 1.5s | — | [primary disabled] |
| **Buy Now** | [outline button rules] | [outline hover] | [outline focus] | [outline tap] | spinner | — | — | [outline disabled] |
| **Cart Icon (nav)** | text:#9CA3AF | text:white scale(1.05) | ring-2 ring-primary ring-offset-2 | scale(0.95) | — | badge spring bounce | — | opacity:40% |
| **Nav Link** | text:#9CA3AF | text:white | ring-1 ring-primary/40 rounded-md | text:white | — | — | — | — |
| **Breadcrumb Link** | text:#9CA3AF | text:white underline | ring-1 ring-primary/40 rounded-xs | text:primary | — | — | — | — |
| **Pagination (inactive)** | border:transparent text:#9CA3AF | border:#2A2A2A text:white bg-surface-raised | ring-2 ring-primary rounded-lg | scale(0.95) | — | — | — | opacity:40% |
| **Pagination (active)** | bg:#2563EB text:white | bg:#1D4ED8 | ring-2 ring-white ring-offset-2 ring-offset-primary | scale(0.95) | — | — | — | — |
| **Accordion Header** | text:white | text:#9CA3AF | ring-2 ring-primary outline-none | text:#9CA3AF | — | — | — | — |
| **Tab (inactive)** | text:#9CA3AF | text:white | ring-2 ring-primary rounded-lg | text:white | — | — | — | — |
| **Tab (active)** | text:white bg:surface-raised | — | ring-2 ring-primary | — | — | — | — | — |
| **Star (interactive)** | text:#374151 | fill:#F59E0B text:#F59E0B scale(1.10) | ring-2 ring-primary rounded | scale(0.95) | — | spring-bounce on select | — | opacity:40% |
| **Text Link** | text:#60A5FA | text:#93C5FD underline | ring-1 ring-primary/40 rounded-xs | text:#3B82F6 | — | — | — | text:#4B5563 pointer-events:none |
| **Image Thumbnail** | border:transparent opacity:70% | border:#2563EB opacity:100% | ring-2 ring-primary | border:#1D4ED8 | skeleton shimmer | — | — | opacity:30% |
| **Quantity Minus** | border:#2A2A2A bg:#080808 text:#9CA3AF | border:#2563EB text:white | ring-2 ring-primary | scale(0.90) | — | — | — | opacity:40% (at qty=1) |
| **Quantity Plus** | border:#2A2A2A bg:#080808 text:#9CA3AF | border:#2563EB text:white | ring-2 ring-primary | scale(0.90) | — | — | — | opacity:40% (at max-qty) |
| **Filter Chip** | border:#1F1F1F bg:#111111 text:#9CA3AF | border:#2A2A2A text:white | ring-2 ring-primary | scale(0.97) | — | — | — | opacity:40% |
| **Filter Chip (active)** | border:rgba(37,99,235,0.4) bg:primary-muted text:primary | border-primary | ring-2 ring-primary | scale(0.97) | — | — | — | — |

---

# SECTION 12: HOMEPAGE SECTION-BY-SECTION LAYOUT SPEC

## 12.1 Navigation

**Height:** 64px desktop / 56px mobile  
**Background:** Transparent at top → `rgba(10,10,10,0.85)` with `backdrop-filter: blur(20px)` after 80px scroll  
**Border-bottom:** 0 opacity → `rgba(31,31,31,1)` after scroll  
**Max-width of content:** 1280px, centered  
**Padding:** px-4 sm:px-6 lg:px-12  
**Position:** `fixed top-0 left-0 right-0 z-[200]`

**Typography tokens:**
- Logo: text-lg font-bold text-white
- Nav links: text-sm font-medium text-text-secondary → text-white on hover/active
- Cart badge: text-[10px] font-bold text-white

**Color tokens:**
- Background (scrolled): rgba(10,10,10,0.85)
- Backdrop blur: blur(20px)
- Border: rgba(31,31,31,1)
- Logo text: #FFFFFF
- Nav links: #9CA3AF / #FFFFFF on hover
- Icons: #9CA3AF / #FFFFFF on hover
- Cart badge: bg-primary text-white

**Animation:**
- Entry: none (immediate render)
- Scroll transition: background + backdropFilter + borderColor animate over 300ms ease-out
- Nav link hover: color change 100ms

**Data:** Static — logo, links, cart count from cart context

**Mobile vs Desktop:**
- Mobile: hamburger menu, no nav links, simplified right icons
- Desktop: full horizontal nav with all links

**Performance:** Use CSS transition on nav element (not Framer) for scroll-driven style changes. Scroll listener with passive: true. Debounce not needed for binary threshold.

---

## 12.2 Hero Section

**Height:** min-h: 100vh (desktop), min-h: auto pt-20 pb-20 (mobile)  
**Background:** `#0A0A0A` + radial glow at top: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 100%)`  
**Max-width:** 1280px, centered  
**Padding:** pt-32 pb-32 desktop / pt-20 pb-20 mobile  

**Typography tokens:**
- Eyebrow tag: text-xs font-semibold text-primary bg-primary-muted px-3 py-1 rounded-full
- H1: text-7xl (desktop) / text-5xl (mobile), font-extrabold, text-white, tracking-tight, text-balance
- Rotating word: same size as H1, text-primary, inline-block
- Body copy: text-lg text-text-secondary leading-relaxed, max-w-[480px]
- CTA primary: text-base font-semibold text-white (inside primary button)
- CTA outline: text-base font-semibold text-white (inside outline button)
- Social proof: text-sm text-text-secondary

**Color tokens:**
- Section bg: #0A0A0A
- Glow: rgba(37,99,235,0.15) radial gradient
- H1: #FFFFFF
- Eyebrow bg: rgba(37,99,235,0.12) border rgba(37,99,235,0.25)
- Body: #9CA3AF
- Stars: #F59E0B
- CTA primary bg: #2563EB + shimmer sweep

**Animation (full timeline):**
- 0ms: Section renders with gradient
- 100ms: Eyebrow tag — opacity 0→1, y 16→0, 400ms
- 250ms: H1 line 1 — opacity 0→1, y 24→0, 600ms expo-out
- 400ms: H1 line 2 — same
- 550ms: Rotating words begin cycling every 2500ms
- 700ms: Body paragraph — opacity 0→1, y 16→0, 400ms
- 900ms: CTA buttons staggered 60ms apart
- 300ms: Product image — opacity 0→1, x 32→0, 700ms expo-out
- 600ms: Float loop begins (4s cycle, infinite)
- 1200ms: Glow bloom — scale 0.8→1, opacity 0→1, 800ms
- 1500ms: Social proof row — opacity 0→1, 400ms

**Data:** Static marketing copy + product images from CMS

**Mobile vs Desktop:**
- Mobile: single column, image below text, H1 text-5xl, pt-20 pb-20
- Desktop: 2-column split, H1 text-7xl, min-h:100vh

**Performance:**
- Product image: WebP format, preloaded with `<link rel="preload" as="image" />`
- Float animation: `will-change: transform` on image wrapper
- Glow: pure CSS (no canvas), `pointer-events: none`

---

## 12.3 Trending Carousel

**Height:** auto (card height ~480px + section padding)  
**min-height:** 640px (desktop), 560px (mobile)  
**Background:** `#0A0A0A`  
**Max-width:** 1280px content, full-bleed background  
**Padding:** pt-24 pb-24 desktop / pt-16 pb-16 mobile  

**Typography tokens:**
- Section label: text-xs font-semibold text-trending bg-trending-bg px-3 py-1 rounded-full + Flame icon
- H2: text-4xl font-bold text-white (desktop) / text-3xl (mobile)
- Sub-heading: text-lg text-text-secondary
- "View all" link: text-sm font-medium text-primary hover:text-primary-400

**Color tokens:**
- Background: #0A0A0A
- Section label: #F97316 on rgba(249,115,22,0.12)
- H2: #FFFFFF
- Sub: #9CA3AF
- Arrow buttons: bg:transparent border:border-border text:text-secondary → text:white bg:surface-raised

**Animation:**
- Section enters with staggerContainer: staggerChildren 0.08s, delayChildren 0.1s
- H2 + sub: fadeUp, 500ms expo-out
- Cards: staggerChild, each 0.08s apart
- Carousel drag: Framer Motion drag with dragConstraints
- Auto-scroll: 3500ms interval, 600ms transition
- Arrow hover: scale(1.05) bg-change, 150ms

**Data:** `GET /api/products?sort=trending&limit=8` — real-time trending score

**Mobile vs Desktop:**
- Desktop: shows 4 cards at once, arrows visible
- Mobile: shows 1.5 cards (partial 2nd card teases scrollability), arrows hidden
- Drag to scroll on both; dots indicator on mobile

**Performance:**
- Images: lazy loaded (loading="lazy") except first 2 cards
- Carousel: `overflow-hidden` on container prevents layout shift
- `will-change: transform` on draggable track

---

## 12.4 Problem Solvers Section

**Height:** auto  
**Background:** `#111111` (surface — contrasts with hero #0A0A0A)  
**Max-width:** 1280px  
**Padding:** pt-24 pb-24 desktop / pt-16 pb-16 mobile  

**Typography tokens:**
- Overline: text-xs font-semibold text-text-secondary uppercase tracking-widest
- H2: text-4xl font-bold text-white text-balance (desktop) / text-3xl (mobile)
- Sub: text-lg text-text-secondary max-w-prose
- Card title: text-xl font-semibold text-white
- Card body: text-sm text-text-secondary leading-relaxed
- Card CTA: text-sm font-medium text-primary (inline link, → arrow)

**Color tokens:**
- Section bg: #111111
- Icon container: bg-primary-muted, icon text-primary
- Card border: #1F1F1F → #2A2A2A on hover
- Card bg: gradient(145deg, #161616 0%, #111111 100%)

**Animation:**
- whileInView threshold: 0.15
- H2 block: fadeUp, 500ms, on entry
- Cards: stagger container, 3 children, 0.08s apart, fadeUp each

**Data:** Static — hardcoded problem categories (3), each links to filtered product collection

**Mobile vs Desktop:**
- Desktop: 3-column grid (grid-cols-3)
- Tablet: 2-column (grid-cols-2), 3rd card full-width
- Mobile: 1-column (grid-cols-1)

**Performance:** No images in this section — icon-only. Instant render.

---

## 12.5 Viral Products Section

**Height:** auto  
**Background:** `#0A0A0A`  
**Max-width:** 1280px  
**Padding:** pt-24 pb-24 / pt-16 pb-16 mobile  

**Typography tokens:**
- Section label: text-xs font-semibold text-viral bg-viral-bg rounded-full + Zap icon
- H2: text-4xl font-bold text-white (desktop) / text-3xl (mobile)
- Sub: text-lg text-text-secondary
- Large card name: text-xl font-semibold text-white
- Small card name: text-sm font-medium text-white
- Price: text-2xl font-bold (large card) / text-base font-semibold (small card)

**Color tokens:**
- Section label: #A855F7 on rgba(168,85,247,0.12)
- Viral badge: rgba(168,85,247,0.85) text-white shadow-glow-viral

**Layout:**
```
Desktop: grid-cols-12
  Row 1: large-card span-6 | small-card span-3 | small-card span-3
  Row 2: small-card span-3 | small-card span-3 | large-card span-6

Mobile: grid-cols-2
  All cards equal size span-1
```

**Animation:**
- Stagger with 0.06s delay (more cards = tighter stagger)
- Large cards: scale 0.97→1 on entry
- Card hover: y:-4px, border brighter, shadow-card-hover

**Data:** `GET /api/products?sort=viral&limit=6`

**Mobile vs Desktop:**
- Desktop: masonry-style asymmetric grid
- Mobile: uniform 2-column grid

---

## 12.6 Why Us / Trust Signals

**Height:** auto (~400px desktop, auto mobile)  
**Background:** `#111111`  
**Max-width:** 1280px  
**Padding:** pt-24 pb-24 / pt-16 pb-16  

**Typography tokens:**
- H2: text-4xl font-bold text-white text-center / text-3xl mobile
- Sub: text-lg text-text-secondary text-center
- Icon label: text-base font-semibold text-white
- Icon desc: text-sm text-text-secondary leading-relaxed
- Stats number: text-4xl font-extrabold text-white (count-up animated)
- Stats label: text-sm text-text-secondary

**Color tokens:**
- Icon box: bg-primary-muted border border-primary/20
- Icon: text-primary

**Animation:**
- 4 icon cards stagger: 0.08s between each, fadeUp 400ms
- Stats numbers: count-up animation triggered on viewport entry (0.30 threshold)
- Count duration: 1.5s ease-out

**Data:** Static (delivery badge, returns, security, support). Stats: live from analytics API or CMS.

**Mobile vs Desktop:**
- Desktop: 4-column grid for icons, 4-column for stats
- Mobile: 2-column grid for icons, 2-column for stats

---

## 12.7 Reviews Marquee

**Height:** auto (~520px desktop for 2 rows)  
**Background:** `#0A0A0A`  
**Max-width:** full-bleed (no container constraint on marquee itself)  
**Content max-width:** heading is 1280px centered, marquee full-bleed  
**Padding:** pt-20 pb-20 / pt-14 pb-14 mobile  

**Typography tokens:**
- H2: text-4xl font-bold text-white text-center / text-3xl mobile
- Average rating: text-lg font-semibold text-white
- Star count: text-sm text-text-secondary
- Reviewer name: text-sm font-semibold text-white
- Date: text-xs text-text-secondary
- Review text: text-sm text-text-secondary leading-relaxed line-clamp-4
- Product ref: text-xs text-text-tertiary

**Color tokens:**
- Review card: bg-surface border-border
- Stars: text-star fill-star
- Section average: text-star

**Animation:**
- Row 1: marquee-left 35s linear infinite
- Row 2: marquee-right 35s linear infinite
- Pause on hover (CSS animation-play-state: paused)
- Edge fade: mask-image gradient left/right
- Entry of section heading: fadeUp on whileInView

**Data:** `GET /api/reviews?featured=true&limit=12` — curated featured reviews. Duplicate array for seamless loop.

**Mobile vs Desktop:**
- Desktop: 2 rows of marquee, cards 380px wide
- Mobile: 1 row of marquee, cards 300px wide, slightly slower (45s)

**Performance:**
- Cards are static HTML, no JS for scroll movement
- `will-change: transform` on marquee track
- Reduced motion: marquee stops

---

## 12.8 Newsletter Section

**Height:** auto (~350px)  
**Background:** `#111111`  
**Max-width:** max-w-2xl (672px) centered for content  
**Padding:** pt-24 pb-24 / pt-16 pb-16 mobile  

**Typography tokens:**
- H2: text-3xl font-bold text-white text-center (desktop) / text-2xl (mobile)
- Sub: text-base text-text-secondary text-center max-w-prose mx-auto
- Privacy note: text-xs text-text-quaternary
- Button label: text-sm font-semibold text-white

**Color tokens:**
- Section bg: #111111
- Card (if using a card): bg-surface-overlay border-border
- Input: bg-surface-sunken border-border
- Button: bg-primary

**Animation:**
- fadeUp on whileInView threshold 0.25
- On submit success: form replaced with success message (fade, scale)
- Success: CheckCircle2 + "You're in! Check your inbox." — fadeIn 300ms

**Data:** Email captured to: Mailchimp / ConvertKit / custom DB via `POST /api/newsletter`

**Mobile vs Desktop:**
- Desktop: email input + button side-by-side in a row
- Mobile: email input full-width, button below it full-width

**Performance:** Lightweight — no images. Form submission with optimistic UI update.

---

## 12.9 Footer

**Height:** auto (~320px desktop, auto mobile)  
**Background:** `#0A0A0A`  
**Max-width:** 1280px  
**Padding:** pt-16 pb-10 / pt-12 pb-8 mobile  

**Typography tokens:**
- Logo: text-lg font-bold text-white
- Tagline: text-sm text-text-secondary
- Column heading: text-xs font-semibold text-text-secondary uppercase tracking-widest
- Footer links: text-sm text-text-secondary hover:text-white
- Copyright: text-xs text-text-quaternary
- Social icons: text-text-tertiary hover:text-white, h-5 w-5

**Color tokens:**
- Bg: #0A0A0A
- Top border: #1F1F1F (border-t border-border)
- Links: #9CA3AF → #FFFFFF on hover
- Bottom bar border: #171717 (border-border-subtle)

**Animation:**
- No complex animation — functional section
- Link hover: color transition 100ms

**Data:** Static links. Company details from config.

**Mobile vs Desktop:**
- Desktop: 4-column grid (brand col + 3 link columns)
- Tablet: 2-column
- Mobile: single column stacked, with accordions for each link group

**Layout:**
```
Column 1 (4/12): Logo + tagline + social icons
Column 2 (2/12): Shop (links)
Column 3 (2/12): Help (links)
Column 4 (2/12): Company (links)
Column 5 (2/12): Legal (links)

Bottom bar (full-width):
  Left: © 2026 PlatformName. All rights reserved.
  Right: Payment method icons (UPI, Visa, Mastercard, RuPay)
```

**Footer links by column:**

Shop: All Products, Trending, Viral Picks, New Arrivals, Deals & Offers, Categories

Help: Track Order, FAQs, Returns Policy, Shipping Policy, Contact Us, Support Chat

Company: About Us, Blog, Careers, Press Kit, Affiliate Program, Bulk Orders

Legal: Privacy Policy, Terms of Service, Cookie Policy, Refund Policy, Disclaimer

---

# APPENDIX: QUICK REFERENCE CHEAT SHEET

## Color Quick Reference
```
Background:   #0A0A0A   — Page bg
Surface:      #111111   — Cards
Raised:       #161616   — Elevated cards
Overlay:      #1C1C1C   — Modals, dropdowns
Primary:      #2563EB   — Buttons, focus, active
Text:         #FFFFFF   — Primary text
Secondary:    #9CA3AF   — Supporting text
Trending:     #F97316   — Trending badges
Viral:        #A855F7   — Viral badges
Sale:         #EF4444   — Sale price, error
Success:      #22C55E   — Success, in-stock
Star:         #F59E0B   — Ratings
```

## Spacing Quick Reference
```
4px   gap-1    — Tight badge/icon gap
8px   gap-2    — Icon+text gap
12px  p-3      — Small card padding
16px  p-4      — Default padding, card content
24px  p-6      — Large card padding
32px  p-8      — XL card padding
48px  py-12    — Section inner padding
64px  py-16    — Larger section spacing
96px  py-24    — Primary section v-padding
128px py-32    — Hero v-padding
```

## Typography Quick Reference
```
text-xs   12px  — Captions, badges, legal
text-sm   14px  — Labels, nav links, secondary
text-base 16px  — Body, descriptions
text-lg   18px  — Sub-headings, feature items
text-xl   20px  — Section sub-headings
text-2xl  24px  — Card headings
text-3xl  30px  — H2 mobile, section headings
text-4xl  36px  — H2 desktop, PDP title
text-5xl  48px  — Feature numbers, hero sub
text-6xl  60px  — Hero H1 mobile
text-7xl  72px  — Hero H1 desktop
text-8xl  96px  — 404 display number
```

## Z-index Quick Reference
```
-1    z-below    — Background elements
0     z-base     — Default
10    z-raised   — Raised cards, tooltips
100   z-dropdown — Dropdowns, menus
200   z-sticky   — Sticky navbar
300   z-overlay  — Backdrop overlays
400   z-modal    — Modals, drawers
500   z-toast    — Toast notifications
600   z-tooltip  — Tooltips (above modals)
9999  z-top      — Loading bars, critical
```

## Animation Duration Quick Reference
```
50ms   instant   — Snap interactions
100ms  fast      — Button click feedback
150ms  normal    — Hover state changes
200ms  moderate  — Backdrop fade, modal position
300ms  slow      — Toast, simple card transitions
400ms  slower    — Stagger children, fade
500ms  sluggish  — Page sections, hero elements
700ms  crawl     — Count-up, complex transitions
```
