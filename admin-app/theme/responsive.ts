import { useWindowDimensions, Platform } from 'react-native';
import { breakpoints, type BreakpointKey } from './tokens';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isPortrait: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWideDesktop: boolean;
  isUltraWide: boolean;
  columns: number;
  gutter: number;
  contentMaxWidth: number;
  platform: 'ios' | 'android' | 'web';
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isPortrait = height >= width;
  const platform = Platform.OS as 'ios' | 'android' | 'web';

  const isMobile = width < breakpoints.md;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg && width < breakpoints.xl;
  const isWideDesktop = width >= breakpoints.xl && width < breakpoints.xxl;
  const isUltraWide = width >= breakpoints.xxl;

  let columns: number;
  if (isMobile) columns = 1;
  else if (isTablet) columns = 2;
  else if (isDesktop) columns = 3;
  else if (isWideDesktop) columns = 4;
  else columns = 5;

  const gutter = isMobile ? 12 : isTablet ? 16 : 20;
  const contentMaxWidth = 1400;

  return {
    width,
    height,
    isPortrait,
    isMobile,
    isTablet,
    isDesktop,
    isWideDesktop,
    isUltraWide,
    columns,
    gutter,
    contentMaxWidth,
    platform,
  };
}

export function getCardWidth(containerWidth: number, columns: number, gutter: number): number {
  const totalGutters = (columns - 1) * gutter;
  return Math.floor((containerWidth - totalGutters) / columns);
}

export function horizontalPadding(r: ResponsiveInfo): number {
  if (r.isMobile) return 16;
  if (r.isTablet) return 24;
  return Math.max(24, (r.width - r.contentMaxWidth) / 2);
}
