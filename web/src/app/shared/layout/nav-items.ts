export interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  tab?: string;
}

/** Entries shown to signed-in users (non-admin shell). */
export const FIRM_NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  },
];

/** Entries shown to EVERY signed-in role, rendered outside the role branches. */
export const SHARED_NAV_ITEMS: NavItem[] = [];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    path: '/admin/overview',
    label: 'Overview',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    adminOnly: true,
    tab: 'overview',
  },
  {
    path: '/admin/users',
    label: 'Users',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    adminOnly: true,
    tab: 'users',
  },
  {
    path: '/admin/app-settings',
    label: 'App Settings',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8 7 17M17 7l2.8-2.8"/></svg>',
    adminOnly: true,
    tab: 'app-settings',
  },
];

export const ADMIN_TAB_MAP: Record<string, string> = {
  'Overview': 'overview',
  'Users': 'users',
  'App Settings': 'app-settings',
};
// <<codegen:nav-items:start>>
export type NavGroup = 'Vendor' | 'Customer' | 'Admin';

/** Feature entries grouped under the card's nav groups (Vendor, Customer, Admin). */
export const GROUPED_NAV_ITEMS: { group: NavGroup; items: NavItem[] }[] = [
  {
    group: 'Vendor',
    items: [
      { path: '/vendor/profile', label: 'Vendor Profile', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>' },
      { path: '/channels', label: 'Channels', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
      { path: '/invoices', label: 'Invoices', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>' },
      { path: '/settings/notifications', label: 'Notification Settings', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>' },
    ],
  },
  {
    group: 'Customer',
    items: [
      { path: '/orders', label: 'Orders', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>' },
    ],
  },
  {
    group: 'Admin',
    items: [
      { path: '/admin/customers', label: 'Customer Management', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>' },
      { path: '/admin/audit-log', label: 'Audit Log', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>' },
    ],
  },
];
// <<codegen:nav-items:end>>
