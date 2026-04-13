import { Platform } from 'react-native';

export const typography = {
  h1: {
    fontSize: Platform.select({
      ios: 32,
      android: 28,
    }),
    fontWeight: '700',
    lineHeight: Platform.select({
      ios: 40,
      android: 36,
    }),
  },
  h2: {
    fontSize: Platform.select({
      ios: 24,
      android: 22,
    }),
    fontWeight: '600',
    lineHeight: Platform.select({
      ios: 32,
      android: 30,
    }),
  },
  h3: {
    fontSize: Platform.select({
      ios: 20,
      android: 18,
    }),
    fontWeight: '600',
    lineHeight: Platform.select({
      ios: 28,
      android: 26,
    }),
  },
  h4: {
    fontSize: Platform.select({
      ios: 18,
      android: 16,
    }),
    fontWeight: '600',
    lineHeight: Platform.select({
      ios: 24,
      android: 22,
    }),
  },
  body1: {
    fontSize: Platform.select({
      ios: 16,
      android: 16,
    }),
    fontWeight: '400',
    lineHeight: Platform.select({
      ios: 24,
      android: 24,
    }),
  },
  body2: {
    fontSize: Platform.select({
      ios: 14,
      android: 14,
    }),
    fontWeight: '400',
    lineHeight: Platform.select({
      ios: 20,
      android: 20,
    }),
  },
  caption: {
    fontSize: Platform.select({
      ios: 12,
      android: 12,
    }),
    fontWeight: '400',
    lineHeight: Platform.select({
      ios: 16,
      android: 16,
    }),
  },
  button: {
    fontSize: Platform.select({
      ios: 16,
      android: 16,
    }),
    fontWeight: '600',
    lineHeight: Platform.select({
      ios: 24,
      android: 24,
    }),
  },
};
