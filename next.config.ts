import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactCompiler: false,
  serverExternalPackages: ['@react-pdf/renderer', 'react-pdf-html'],
  experimental: {
    inlineCss: true,
    // 10 MB files are sent as base64 (~13.3 MB) plus action metadata.
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
