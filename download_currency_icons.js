const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(__dirname, 'public', 'icons', 'currencies');
const COM_DIR = path.join(__dirname, 'public', 'icons', 'commodities');

const flags = [
  { code: 'az', url: 'https://flagcdn.com/az.svg' },
  { code: 'kg', url: 'https://flagcdn.com/kg.svg' },
  { code: 'tj', url: 'https://flagcdn.com/tj.svg' },
  { code: 'ua', url: 'https://flagcdn.com/ua.svg' },
  { code: 'uz', url: 'https://flagcdn.com/uz.svg' },
  { code: 'za', url: 'https://flagcdn.com/za.svg' },
];

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest);
      console.error(`Error downloading ${url}:`, err.message);
      reject(err);
    });
  });
};

const createMetalIcon = (name, color, symbol) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="32" fill="${color}"/>
  <text x="32" y="42" font-family="Arial, sans-serif" font-weight="bold" font-size="28" text-anchor="middle" fill="#333">${symbol}</text>
</svg>`;
    fs.writeFileSync(path.join(COM_DIR, `${name}.svg`), svg);
    console.log(`Created ${name}.svg`);
};

const run = async () => {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(COM_DIR)) fs.mkdirSync(COM_DIR, { recursive: true });

  // Download flags
  for (const flag of flags) {
    try {
      await download(flag.url, path.join(DIR, `${flag.code}.svg`));
    } catch (e) {
      console.error(`Failed to download ${flag.code}:`, e);
    }
  }

  // Create Metal Icons
  // Silver: #C0C0C0 (Silver)
  createMetalIcon('SILVER', '#C0C0C0', 'Ag');
  // Platinum: #E5E4E2 (Platinum)
  createMetalIcon('PLATINUM', '#E5E4E2', 'Pt');
  // Palladium: #CED0DD (Palladium - slightly different grey)
  createMetalIcon('PALLADIUM', '#CED0DD', 'Pd');
};

run();
