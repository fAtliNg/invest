/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Отключаем SWC Minify из-за проблем в Docker/QEMU
  experimental: {
    amp: {
      skipValidation: true
    }
  },
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
        source: '/api/:path*',
        destination: 'http://localhost:5001/:path*',
      },
    ];
  },
}

module.exports = nextConfig
