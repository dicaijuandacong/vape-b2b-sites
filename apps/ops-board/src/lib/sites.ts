/** The live marketing sites the ops board manages. */
export interface SiteInfo {
  key: string;
  label: string;
  repoDir: string; // under sites/ (empty if not locally managed)
  prodUrl: string;
  github: string;
  gscUrl: string;
  vercelUrl: string;
  domainPending?: string;
}

export const SITES: SiteInfo[] = [
  {
    key: 'dubai',
    label: 'DubaiVape',
    repoDir: 'vape-dubai',
    prodUrl: 'https://vape-dubai.vercel.app',
    github: 'https://github.com/YOUR_GITHUB_ORG/vape-dubai-site',
    gscUrl: 'https://search.google.com/search-console',
    vercelUrl: 'https://vercel.com/dashboard',
    domainPending: '待购独立域名'
  },
  {
    key: 'gulf',
    label: 'GulfVape',
    repoDir: 'vape-gulf',
    prodUrl: 'https://vape-gulf.vercel.app',
    github: 'https://github.com/YOUR_GITHUB_ORG/vape-gulf-site',
    gscUrl: 'https://search.google.com/search-console',
    vercelUrl: 'https://vercel.com/dashboard',
    domainPending: '待购独立域名'
  },
  {
    key: 'europe',
    label: 'EuroVape',
    repoDir: 'vape-europe',
    prodUrl: 'https://vape-europe.vercel.app',
    github: 'https://github.com/YOUR_GITHUB_ORG/vape-europe-site',
    gscUrl: 'https://search.google.com/search-console',
    vercelUrl: 'https://vercel.com/dashboard',
    domainPending: '待购独立域名'
  },
  {
    key: 'vapegogogo',
    label: 'VapeGoGoGo',
    repoDir: '',
    prodUrl: 'https://vapegogogo.com',
    github: '',
    gscUrl: 'https://search.google.com/search-console',
    vercelUrl: 'https://vercel.com/dashboard'
  }
];

export const REQUIRED_SITE_ENV = [
  { key: 'FEISHU_APP_ID', label: '飞书 App ID' },
  { key: 'FEISHU_APP_SECRET', label: '飞书 Secret' },
  { key: 'FEISHU_BITABLE_APP_TOKEN', label: '多维表格 token' },
  { key: 'FEISHU_LEADS_TABLE_ID', label: 'leads 表 id' },
  { key: 'RESEND_API_KEY', label: 'Resend（邮件兜底）', optional: true },
  { key: 'NEXT_PUBLIC_SITE_URL', label: '站点 URL', optional: true }
] as const;
