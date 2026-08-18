// Shared tokens for apps/mobile — swap values here once the Figma design lands
// instead of hunting hex literals across every screen.
export const theme = {
  colors: {
    primary: '#0D634B',
    bg: '#ffffff',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    inputBorder: '#cbd5e1',
    secondaryBg: '#f1f5f9',
    accent: '#f59e0b',
    // Consolidated from hex literals repeated across every mobile screen —
    // one place to adjust instead of hunting each screen's StyleSheet.
    surface: '#F9FAFB',
    surfaceAlt: '#F3F4F6',
    mutedLight: '#9CA3AF',
    danger: '#dc2626',
    dangerBg: '#FEF2F2',
    // Newer Figma redesign pass's palette — was duplicated as local
    // FIGMA_PRIMARY/FIGMA_BORDER/etc. constants in ListingDetailScreen.tsx
    // and ProjectDetailScreen.tsx; promoted here so the post-listing/
    // post-project step wizard (and any future screen in the same redesign)
    // reads the same green instead of the slightly different
    // theme.colors.primary (#0D634B).
    figma: {
      primary: '#0F5A3E',
      surface: '#FFFFFF',
      mutedBg: '#F5F7F7',
      border: '#E5E7EB',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 6,
    md: 8,
  },
  // Button gradients — RN has no CSS-angle gradient syntax, so start/end are
  // the closest {x,y} box-coordinate approximation of the requested CSS
  // angles (90deg is exact; 111.53deg is a rounded approximation).
  gradients: {
    primary: {
      colors: ['#0D634B', '#034B37'] as [string, string],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },
    gold: {
      colors: ['#EBBD57', '#AD7B3D'] as [string, string],
      start: { x: 0.03, y: 0.32 },
      end: { x: 0.97, y: 0.68 },
    },
  },
} as const;
