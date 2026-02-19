const isDev = process.env.NEXT_PUBLIC_IS_DEV === 'true';

module.exports = {
  siteUrl: isDev ? 'https://profit-case-dev.ru' : 'https://profit-case.ru',
  generateRobotsTxt: true,
  exclude: ['/server-sitemap.xml', '/404', '/customers', '/equities', '/robots.txt'],
  robotsTxtOptions: {
    policies: isDev
      ? [
          { userAgent: '*', disallow: '/' }
        ]
      : [
          { userAgent: '*', allow: '/' },
          { userAgent: '*', disallow: ['/customers', '/equities', '/404'] }
        ],
  },
}
