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
      {
        source: '/api/auth/:path*',
        destination: 'http://127.0.0.1:5002/:path*',
      },
      {
        source: '/api/news/:path*',
        destination: 'http://127.0.0.1:5004/news/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5001/:path*',
      },
    ];
  },
}

module.exports = nextConfig
