/**
 * Color Palette & Theme Configuration for Wecode GCEK
 *
 * Extracting hardcoded colors to this central configuration file allows
 * changing the entire application theme easily by updating the activeThemeName
 * or calling applyTheme('emerald' | 'indigo' | 'violet' | 'cyan' | 'amber').
 */

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export type ThemeName = 'amber' | 'emerald' | 'indigo' | 'violet' | 'cyan' | 'rose' | 'blue';

export const palettes: Record<ThemeName, ColorPalette> = {
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
};

/**
 * Active theme key. Change this key to switch theme globally.
 */
export const activeThemeName: ThemeName = 'amber';

export const activePalette: ColorPalette = palettes[activeThemeName] || palettes.amber;

/**
 * Theme UI tokens mapping primary design system elements
 */
export const themeColors = {
  // Brand & Accent Text
  textPrimary: 'text-primary-400',
  textPrimaryLight: 'text-primary-300',
  textPrimaryDark: 'text-primary-500',

  // Backgrounds
  bgPrimary: 'bg-primary-500',
  bgPrimaryHover: 'hover:bg-primary-400',
  bgPrimarySoft: 'bg-primary-500/10',
  bgPrimarySubtle: 'bg-primary-500/20',

  // Borders
  borderPrimary: 'border-primary-500',
  borderPrimarySoft: 'border-primary-500/20',
  borderPrimarySubtle: 'border-primary-500/30',

  // Buttons & Controls
  btnGradient: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-zinc-950 font-bold',
  btnSecondary: 'bg-zinc-800 hover:bg-zinc-700 text-primary-300 font-bold border border-zinc-700/60',
  shadowPrimary: 'shadow-primary-500/20',

  // Badges & Pills
  badgePrimary: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',

  // Icons
  iconPrimary: 'text-primary-400',
  iconPrimaryFill: 'text-primary-400 fill-primary-400',
};

/**
 * Helper function to apply theme variables to document root for runtime switching
 */
export function applyTheme(themeName: ThemeName) {
  if (typeof document === 'undefined') return;
  const palette = palettes[themeName] || palettes.amber;
  const root = document.documentElement;
  Object.entries(palette).forEach(([shade, hex]) => {
    root.style.setProperty(`--primary-${shade}`, hex);
  });
}
