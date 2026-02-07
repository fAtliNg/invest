import axios from 'axios';

export default function ServerSitemap() {
  return null;
}

export async function getServerSideProps({ res }) {
  const isDev = process.env.NEXT_PUBLIC_IS_DEV === 'true';
  const domain = isDev ? 'https://profit-case-dev.ru' : 'https://profit-case.ru';

  const sources = [
    { type: 'share', url: 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID' },
    { type: 'bond', url: 'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQCB/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID' },
    { type: 'bond', url: 'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID' },
    { type: 'fund', url: 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQTF/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID' },
    { type: 'currency', url: 'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID' },
    { type: 'future', url: 'https://iss.moex.com/iss/engines/futures/markets/forts/boards/RFUD/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID' }
  ];

  const urls = [];

  for (const src of sources) {
    try {
      const response = await axios.get(src.url);
      const sec = response.data?.securities;
      if (!sec || !Array.isArray(sec.data)) continue;
      const secIdIdx = (sec.columns || []).indexOf('SECID');
      sec.data.forEach((row) => {
        const secid = row[secIdIdx];
        if (secid) {
          urls.push(`${domain}/quotes/${src.type}/${secid}`);
        }
      });
    } catch (_) {}
  }

  const lastMod = new Date().toISOString();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((loc) => `<url><loc>${loc}</loc><lastmod>${lastMod}</lastmod><changefreq>daily</changefreq><priority>0.5</priority></url>`),
    '</urlset>'
  ].join('');

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.write(xml);
  res.end();

  return { props: {} };
}
