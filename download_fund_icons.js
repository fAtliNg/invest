const fs = require('fs');
const https = require('https');
const path = require('path');

const TARGET_DIR = '/Users/sergey/invest/public/icons/shares/ru';

const domains = [
  { name: 'ATON.png', domain: 'aton.ru' },
  { name: 'BCS.png', domain: 'bcs.ru' },
  { name: 'INGO.png', domain: 'ingos.ru' },
  { name: 'DOHOD.png', domain: 'dohod.ru' },
  { name: 'PSB.png', domain: 'psbank.ru' },
  { name: 'SOLID.png', domain: 'solid.ru' },
  { name: 'WIM.png', domain: 'wim-investments.ru' },
  { name: 'GENERAL.png', domain: 'generalinvest.ru' },
  { name: 'APRIORI.png', domain: 'apriori-am.ru' }
];

const downloadIcon = (filename, domain) => {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const filePath = path.join(TARGET_DIR, filename);
  
  const file = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${filename} from ${domain}`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {}); // Delete the file async
    console.error(`Error downloading ${filename}: ${err.message}`);
  });
};

domains.forEach(d => downloadIcon(d.name, d.domain));
