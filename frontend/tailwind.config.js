/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Typography - Bold, Sharp, Electric
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },

      // Primary - Gold/Amber (Winning, Wealth, Premium)
      colors: {
        gold: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',  // Primary
          600: '#D97706',  // Primary Hover
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },

        // Secondary - Electric Cyan (Energy, Links, Accents)
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',  // Secondary
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },

        // Neutral - Rich Blacks (Command Center Dark Theme)
        gray: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',  // Card backgrounds
          900: '#18181B',  // Surface
          950: '#09090B',  // Base background
        },

        // Semantic Colors
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',  // Success
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },

        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',  // Error
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        },

        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',  // Info
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },

        // Semantic shortcuts
        // Neon Green — War Room: real-time updates, wins, "live" alerts
        neon: {
          50:  '#F0FFF4',
          100: '#C6F6D5',
          200: '#9AE6B4',
          300: '#68D391',
          400: '#48BB78',
          500: '#10F981',  // Primary neon
          600: '#00D084',
        },

        success: {
          light: '#34D399',
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        warning: {
          light: '#FCD34D',
          DEFAULT: '#FBBF24',
          dark: '#F59E0B',
        },
        error: {
          light: '#FB7185',
          DEFAULT: '#F43F5E',
          dark: '#E11D48',
        },
        info: {
          light: '#7DD3FC',
          DEFAULT: '#0EA5E9',
          dark: '#0284C7',
        },
      },

      // Typography Scale
      fontSize: {
        'micro': ['0.625rem', { lineHeight: '1.3', fontWeight: '500' }],      // 10px
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],     // 12px
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],    // 14px
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],           // 16px
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],    // 18px
        'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],         // 18px
        'h3': ['1.375rem', { lineHeight: '1.3', fontWeight: '600' }],         // 22px
        'h2': ['1.75rem', { lineHeight: '1.25', fontWeight: '600' }],         // 28px
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],          // 36px
        'display': ['3rem', { lineHeight: '1.15', fontWeight: '700' }],       // 48px
        'hero': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],           // 64px
      },

      // Spacing Scale (8px base)
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },

      // Border Radius
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },

      // Shadows (Command Center style)
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        // Special glows
        'gold': '0 0 20px rgba(245, 158, 11, 0.25), 0 0 40px rgba(245, 158, 11, 0.1)',
        'gold-intense': '0 0 30px rgba(245, 158, 11, 0.4), 0 0 60px rgba(245, 158, 11, 0.2)',
        'cyan': '0 0 20px rgba(6, 182, 212, 0.25), 0 0 40px rgba(6, 182, 212, 0.1)',
        'success': '0 0 20px rgba(16, 185, 129, 0.25), 0 0 40px rgba(16, 185, 129, 0.1)',
        'neon': '0 0 20px rgba(16, 249, 129, 0.4), 0 0 40px rgba(16, 249, 129, 0.2)',
        'neon-intense': '0 0 40px rgba(16, 249, 129, 0.6), 0 0 80px rgba(16, 249, 129, 0.3)',
      },

      // Transitions
      transitionDuration: {
        'fast': '100ms',
        'base': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },

      // Z-Index Scale
      zIndex: {
        '0': '0',
        '10': '10',    // Elevated cards, dropdowns
        '20': '20',    // Sticky headers
        '30': '30',    // Fixed navigation
        '40': '40',    // Overlays, backdrops
        '50': '50',    // Modals, dialogs
        '60': '60',    // Popovers, tooltips
        '70': '70',    // Notifications, toasts
        '100': '100',  // Maximum (dev tools, debug)
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        // War Room — real-time update animations
        'pulse-neon': 'pulseNeon 0.5s ease-in-out 2',
        'pulse-neon-loop': 'pulseNeon 1.5s ease-in-out infinite',
        'intense-pulse': 'intensePulse 1s ease-in-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(245, 158, 11, 0.5)' },
        },
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(16, 249, 129, 0.2)', color: 'inherit' },
          '50%': { boxShadow: '0 0 30px rgba(16, 249, 129, 0.6)', color: 'rgb(16 249 129)' },
        },
        intensePulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 249, 129, 0.3)' },
          '50%': { boxShadow: '0 0 60px rgba(16, 249, 129, 0.8)' },
        },
      },

      // Breakpoints
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      // Max widths
      maxWidth: {
        'miniapp': '1280px',
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // Backdrop blur
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
