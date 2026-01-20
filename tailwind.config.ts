import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        script: ['Dancing Script', 'cursive'],
        mono: ['Roboto Mono', 'monospace'],
      },
      fontSize: {
        'h1': ['56px', { lineHeight: '1.1', fontWeight: '700' }],
        'h2': ['40px', { lineHeight: '1.1', fontWeight: '700' }],
        'h3': ['28px', { lineHeight: '1.2', fontWeight: '600' }],
        'h4': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'micro': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        'xs': '8px',
        'sm-custom': '12px',
        'md': '16px',
        'lg-custom': '24px',
        'xl-custom': '32px',
        '2xl-custom': '48px',
        'section': '96px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: {
          DEFAULT: "hsl(var(--input))",
          border: "hsl(var(--input-border))",
          placeholder: "hsl(var(--input-placeholder))",
        },
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          gold: "hsl(var(--brand-gold))",
          green: "hsl(var(--brand-green))",
          orange: "hsl(var(--brand-orange))",
          blue: "hsl(var(--brand-blue))",
          navy: "hsl(var(--brand-navy))",
          darkRed: "hsl(var(--brand-dark-red))",
          red: "hsl(var(--brand-red))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        header: {
          DEFAULT: "hsl(var(--header-background))",
          foreground: "hsl(var(--header-foreground))",
        },
        // Seeksy soft accents
        create: "hsl(var(--accent-create))",
        connect: "hsl(var(--accent-connect))",
        monetize: "hsl(var(--accent-monetize))",
        // State colors
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        info: "#2C6BED",
      },
      backgroundImage: {
        "gradient-warm": "var(--gradient-warm)",
        "gradient-cool": "var(--gradient-cool)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-vibrant": "var(--gradient-vibrant)",
        "gradient-warm-cta": "var(--gradient-warm-cta)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-glow)",
        card: "0 18px 40px rgba(15, 23, 42, 0.10)",
        floating: "0 30px 70px rgba(15, 23, 42, 0.18)",
      },
      borderRadius: {
        'seeksy-sm': '10px',
        'seeksy-md': '16px',
        'seeksy-lg': '24px',
        'seeksy-xl': '32px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "bounce-once": {
          "0%": { 
            transform: "translateY(0) scale(1)",
          },
          "40%": { 
            transform: "translateY(-12px) scale(1.05)",
          },
          "60%": {
            transform: "translateY(-12px) scale(1.05)",
          },
          "100%": { 
            transform: "translateY(0) scale(1)",
          }
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)"
          },
          "50%": {
            transform: "translateY(-15px)"
          }
        },
        "wave": {
          "0%, 100%": {
            transform: "rotate(0deg)"
          },
          "10%, 30%": {
            transform: "rotate(-10deg)"
          },
          "20%, 40%": {
            transform: "rotate(10deg)"
          },
          "50%": {
            transform: "rotate(0deg)"
          }
        },
        "holiday-glow": {
          "0%, 100%": {
            opacity: "0.15",
            transform: "scale(1)"
          },
          "50%": {
            opacity: "0.25",
            transform: "scale(1.1)"
          }
        },
        "scan": {
          "0%": {
            transform: "translateY(-100%)"
          },
          "100%": {
            transform: "translateY(100%)"
          }
        },
        "spin-slow": {
          "0%": {
            transform: "rotate(0deg)"
          },
          "100%": {
            transform: "rotate(360deg)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-once": "bounce-once 0.7s ease-out 1",
        "float": "float 3s ease-in-out infinite",
        "wave": "wave 1.2s ease-in-out",
        "holiday-glow": "holiday-glow 2.5s ease-in-out infinite",
        "scan": "scan 2s linear infinite",
        "spin-slow": "spin-slow 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
