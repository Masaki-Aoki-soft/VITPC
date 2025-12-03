/** @type {import('next').NextConfig} */
module.exports = {
  // Electronアプリでは静的エクスポートが必要（本番環境でNext.jsサーバーが起動しないため）
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
}
