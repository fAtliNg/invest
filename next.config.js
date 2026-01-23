/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Отключаем SWC Minify из-за проблем в Docker/QEMU
  typescript: {
    // Игнорируем ошибки TS при сборке (проверяем локально), чтобы экономить память
    ignoreBuildErrors: true,
  },
  eslint: {
    // Игнорируем ESLint при сборке
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/logos/:path*',
        destination: '/api/logos/:path*',
      },
    ];
  },
}

module.exports = nextConfig
