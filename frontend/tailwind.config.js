export default {
  content: [
    './index.html',
    './src/market_intelligence/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#FFFBF0',
          100: '#FFF3D6',
          200: '#FFE299',
          300: '#FFCB4D',
          400: '#FFB020',
          500: '#F59000',
          600: '#E07800',
          700: '#C8500A',
          800: '#A03C08',
          900: '#7A2C06',
          950: '#4A1803',
        },
        navy: {
          50: '#F0F4FF',
          100: '#E0E9FF',
          200: '#C7D7FE',
          300: '#A4BBFC',
          400: '#8196F8',
          500: '#6366F1',
          600: '#3A3F8F',
          700: '#252C6E',
          800: '#151C52',
          900: '#0A1228',
          950: '#06091A',
        },
        paddy: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        monsoon: {
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        warm: {
          50: '#FFFBF5',
          100: '#FFF5E6',
          200: '#FEEBC8',
          300: '#FDD68A',
          400: '#F9B94A',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        ink: {
          DEFAULT: '#1C1007',
          mid: '#3D2510',
          soft: '#8C6B4A',
          muted: '#BEA48A',
        },
      },

      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sub: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        marathi: ['Tiro Devanagari Marathi', 'serif'],
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },

      boxShadow: {
        'amber-sm': '0 2px 10px rgba(200,80,10,0.14)',
        'amber-md': '0 6px 28px rgba(200,80,10,0.22)',
        'amber-lg': '0 16px 56px rgba(200,80,10,0.30)',
        'amber-xl': '0 28px 80px rgba(200,80,10,0.36)',
        'amber-glow':
          '0 0 0 4px rgba(200,80,10,0.18), 0 0 0 8px rgba(200,80,10,0.06)',
        card:
          '0 2px 16px rgba(28,16,7,0.07), 0 1px 4px rgba(28,16,7,0.05)',
        'card-hover':
          '0 10px 40px rgba(28,16,7,0.12), 0 4px 12px rgba(28,16,7,0.07)',
        'card-lift': '0 20px 60px rgba(28,16,7,0.15)',
        float: '0 32px 80px rgba(28,16,7,0.18)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.12)',
      },

      backgroundImage: {
        'amber-gradient':
          'linear-gradient(135deg, #C8500A 0%, #E07800 50%, #F59000 100%)',
        'amber-soft':
          'linear-gradient(135deg, #C8500A 0%, #F59E0B 100%)',
        sunrise:
          'linear-gradient(135deg, #7A2C06 0%, #C8500A 30%, #E07800 60%, #F5A623 100%)',
        'night-base':
          'linear-gradient(160deg, #0A1228 0%, #151C52 100%)',
        'card-shine':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
      },

      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        breathe: 'breathe 8s ease-in-out infinite',
        riseUp: 'riseUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards',
        voicePulse: 'voicePulse 1.4s ease infinite',
        shimmer: 'shimmer 1.8s infinite linear',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2.5s ease-in-out infinite',
      },

      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        breathe: {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.07)' },
        },
        riseUp: {
          from: {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        voicePulse: {
          '0%,100%': {
            boxShadow: '0 0 0 0 rgba(200,80,10,0.5)',
          },
          '50%': {
            boxShadow: '0 0 0 18px rgba(200,80,10,0)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseDot: {
          '0%,100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(1.4)',
            opacity: '0.5',
          },
        },
        bounceGentle: {
          '0%,100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-8px)',
          },
        },
      },
    },
  },
  plugins: [],
};