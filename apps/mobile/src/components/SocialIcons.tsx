import Svg, { Path } from 'react-native-svg';
import { theme } from '@jayedaad/ui-native';

// Mirrors apps/web's per-file GoogleIcon/AppleIcon (same path data) — used
// as the leading icon on Login/SignupScreen's "Google"/"Apple" buttons.
export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.99 11.99 0 0 0 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </Svg>
  );
}

// Dark fill (theme.colors.text) rather than web's currentColor — these
// buttons sit on the app's gold gradient (Button variant="secondary"), same
// dark label color the button's own text already uses.
export function AppleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={theme.colors.text}>
      <Path d="M16.36 1.4c.09 1.1-.32 2.13-1.02 2.9-.72.79-1.9 1.4-3 1.32-.11-1.06.36-2.16 1.03-2.87.75-.8 2.03-1.4 2.99-1.35zM20.2 17.02c-.53 1.22-.78 1.76-1.46 2.83-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.97-3.87-.96-2 .01-2.42.98-3.9.96-1.66-.02-2.93-1.7-3.88-3.2C1 16.6.68 12.7 2.02 10.62c.95-1.48 2.46-2.34 3.87-2.34 1.44 0 2.34.97 3.53.97 1.15 0 1.85-.97 3.53-.97 1.26 0 2.6.68 3.55 1.86-3.12 1.71-2.61 6.16.7 6.88z" />
    </Svg>
  );
}
