
const fs = require('fs');
const path = require('path');
const https = require('https');

const ICONS_DIR = path.join(__dirname, 'public', 'icons', 'shares', 'ru');

const issuers = [
  { name: 'AAA', domain: 'aaacapital.ru' },
  { name: 'FINAM', domain: 'finam.ru' },
  { name: 'AKBARS', domain: 'akbars.ru' }, // Using bank domain for better icon availability
  { name: 'FINSTAR', domain: 'finstar.ru' }, // Trying .ru first
  { name: 'UKFIRST', domain: 'first-am.ru' },
];

const downloadIcon = (name, domain) => {
  const size = 128;
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  const filePath = path.join(ICONS_DIR, `${name}.png`);

  const file = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${name}.png from ${domain}`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath);
    console.error(`Error downloading ${name}.png: ${err.message}`);
  });
};

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

issuers.forEach(issuer => {
  downloadIcon(issuer.name, issuer.domain);
});
