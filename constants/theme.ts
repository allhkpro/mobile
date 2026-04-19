// Dark premium theme — matching prototype design
export const Colors = {
  // Core palette
  bg: "#030306",
  card: "rgba(255,255,255,0.028)",
  border: "rgba(255,255,255,0.05)",

  // Accent colors
  blue: "#4f8fff",
  cyan: "#00e5c7",
  purple: "#9d7aff",
  amber: "#ffb547",
  rose: "#ff5c8a",
  emerald: "#34d399",
  red: "#FF3B30",

  // Text hierarchy
  t1: "#ffffff",
  t2: "rgba(255,255,255,0.6)",
  t3: "rgba(255,255,255,0.3)",
  t4: "rgba(255,255,255,0.12)",

  // Legacy aliases (for components that still use old names)
  primary: "#4f8fff",
  success: "#34d399",
  warning: "#ffb547",
  destructive: "#ff5c8a",
  background: "#030306",
  cardBackground: "rgba(255,255,255,0.028)",
  separator: "rgba(255,255,255,0.05)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.3)",
  textTertiary: "rgba(255,255,255,0.12)",
  deviceOn: "#00e5c7",
  deviceOff: "rgba(255,255,255,0.15)",
  secondary: "#9d7aff",
  teal: "#00e5c7",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
};
