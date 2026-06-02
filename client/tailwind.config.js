export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: "#143674",
        secondary: "#2E7BB3",
        accent: "#26C1D3",

        // UI Colors
        background: "#F5F7FA",
        surface: "#FFFFFF",

        textPrimary: "#1A1A1A",
        textSecondary: "#6B7280",

        border: "#E5E7EB",

        success: "#16A34A",
        error: "#DC2626",
        warning: "#F59E0B",

        // Dark Mode Tokens
        "dark-bg": "#111827",
        "dark-surface": "#1F2937",
        "dark-textPrimary": "#F9FAFB",
        "dark-textSecondary": "#D1D5DB",
        "dark-border": "#374151",

        // Legacy/Utility (keeping for transition if needed, but pointing to tokens)
        grayText: "#6B7280",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
