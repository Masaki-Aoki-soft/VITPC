/** @type {import('next').NextConfig} */
module.exports = {
  // output: 'export' を削除 - Clerkとmiddlewareを使用するため
  // Electronアプリでも開発環境では通常のNext.jsサーバーが動作します
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
}
