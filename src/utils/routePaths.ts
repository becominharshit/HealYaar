import { NavTab } from '../types';

export const PUBLIC_TABS: readonly NavTab[] = [
  'landing',
  'login',
  'privacy',
  'terms',
  'cookies',
  'refund'
];

export const TAB_TO_PATH: Record<NavTab, string> = {
  landing: '/',
  login: '/login',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  refund: '/refund',
  home: '/home',
  assistant: '/assistant',
  symptoms: '/symptoms',
  reports: '/reports',
  nutrition: '/nutrition',
  doctors: '/doctors',
  fitness: '/fitness',
  medicines: '/medicines',
  mental: '/mental',
  period: '/period',
  reminders: '/reminders'
};

const PATH_TO_TAB: Record<string, NavTab> = Object.entries(TAB_TO_PATH).reduce(
  (acc, [tab, path]) => {
    acc[path] = tab as NavTab;
    return acc;
  },
  {} as Record<string, NavTab>
);

export function isPublicTab(tab: NavTab): boolean {
  return PUBLIC_TABS.includes(tab);
}

export function getPathForTab(tab: NavTab): string {
  return TAB_TO_PATH[tab] || '/';
}

export function getTabForPath(pathname: string): NavTab {
  const normalized = (pathname || '/').trim().toLowerCase().replace(/\/+$/, '') || '/';
  return PATH_TO_TAB[normalized] || 'landing';
}

export function resolveAuthorizedTab(requestedTab: NavTab, isAuthenticated: boolean): NavTab {
  if (isAuthenticated) {
    return requestedTab === 'landing' ? 'home' : requestedTab;
  }
  return isPublicTab(requestedTab) ? requestedTab : 'login';
}
