import { Platform } from 'react-native';

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

const sans = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const fonts = {
  serif,
  sans,
};

export const textStyles = {
  h1: { fontFamily: serif, fontSize: 26, fontWeight: '700', color: '#3E2723' },
  h2: { fontFamily: serif, fontSize: 24, fontWeight: '700', color: '#3E2723' },
  h3: { fontFamily: serif, fontSize: 19, fontWeight: '600', color: '#3E2723' },
  h4: { fontFamily: sans, fontSize: 15, fontWeight: '600', color: '#3E2723' },
  body: { fontFamily: sans, fontSize: 14, fontWeight: '400', color: '#3E2723' },
  bodySmall: { fontFamily: sans, fontSize: 12, fontWeight: '400', color: '#6D4C41' },
  caption: { fontFamily: sans, fontSize: 10, fontWeight: '500', color: '#6D4C41' },
  label: { fontFamily: sans, fontSize: 11, fontWeight: '600', color: '#3E2723' },
};
