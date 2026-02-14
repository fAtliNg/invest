export default function Robots() {
  return null;
}

export async function getServerSideProps({ res }) {
  const isDev = process.env.NEXT_PUBLIC_IS_DEV === 'true';
  const domain = isDev ? 'profit-case-dev.ru' : 'profit-case.ru';

  const lines = [
    'User-agent: *',
    isDev ? 'Disallow: /' : 'Allow: /',
    ...(isDev ? [] : ['Disallow: /customers', 'Disallow: /equities', 'Disallow: /404']),
    '',
    'Host: ' + domain,
    '',
    'Sitemap: https://' + domain + '/sitemap.xml',
    'Sitemap: https://' + domain + '/server-sitemap.xml',
  ];

  res.setHeader('Content-Type', 'text/plain');
  res.write(lines.join('\n'));
  res.end();

  return { props: {} };
}
