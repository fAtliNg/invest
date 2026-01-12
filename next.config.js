/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Отключаем SWC Minify из-за проблем в Docker/QEMU
}

module.exports = nextConfig
