import { NavGroup } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 *
 * Examples:
 *
 * 1. Require organization:
 *    access: { requireOrg: true }
 *
 * 2. Require specific permission:
 *    access: { requireOrg: true, permission: 'org:teams:manage' }
 *
 * 3. Require specific plan:
 *    access: { plan: 'pro' }
 *
 * 4. Require specific feature:
 *    access: { feature: 'premium_access' }
 *
 * 5. Require specific role:
 *    access: { role: 'admin' }
 *
 * 6. Multiple conditions (all must be true):
 *    access: { requireOrg: true, permission: 'org:teams:manage', plan: 'pro' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Product',
        url: '/dashboard/product',
        icon: 'product',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      },
      {
        title: '询盘漏斗',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['k', 'k'],
        isActive: false,
        items: []
      },
      {
        title: '订单',
        url: '/dashboard/orders',
        icon: 'orders',
        shortcut: ['o', 'o'],
        isActive: false,
        items: []
      },
      {
        title: '待跟进',
        url: '/dashboard/followups',
        icon: 'calendar',
        shortcut: ['f', 'f'],
        isActive: false,
        items: []
      },
      {
        title: '潜在客户',
        url: '/dashboard/prospects',
        icon: 'search',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: '站点管理',
        url: '/dashboard/sites',
        icon: 'dashboard',
        shortcut: ['s', 's'],
        isActive: false,
        access: { role: 'admin' },
        items: []
      },
      {
        title: '审计日志',
        url: '/dashboard/audit',
        icon: 'dashboard',
        isActive: false,
        access: { role: 'admin' },
        items: []
      },
      {
        title: '素材库',
        url: '/dashboard/media',
        icon: 'product',
        shortcut: ['m', 'm'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Account',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Notifications',
            url: '/dashboard/notifications',
            icon: 'notification',
            shortcut: ['n', 'n']
          },
          {
            title: 'Login',
            shortcut: ['l', 'l'],
            url: '/',
            icon: 'login'
          }
        ]
      }
    ]
  }
];
