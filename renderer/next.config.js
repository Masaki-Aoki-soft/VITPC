/** @type {import('next').NextConfig} */
module.exports = {
  // Nextronの要件: 本番環境では静的エクスポートが必要
  // 開発環境ではAPIルートを使用するため、output: 'export' を無効化
  // 本番環境でのみ静的エクスポートを有効化
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
}
