const https = require('https');
const fs = require('fs');

const SOURCES = [
  'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME'
];

const getIconMap = () => {
  const cur = (file) => `/icons/currencies/${file}`;
  const com = (file) => `/icons/commodities/${file}`;
  
  return {
    'Si': cur('us.svg'),
    'Eu': cur('eu.svg'),
    'CNY': cur('cn.svg'),
    'ED': cur('eu.svg'),
    'AED': cur('ae.svg'),
    'AMD_CURRENCY': cur('am.svg'),
    'AUD': cur('au.svg'),
    'AUDU': cur('au.svg'),
    'AZN': cur('az.svg'),
    'BYN': cur('by.svg'),
    'CAD': cur('ca.svg'),
    'CHF': cur('ch.svg'),
    'GBP': cur('gb.svg'),
    'HKD': cur('hk.svg'),
    'JPY': cur('jp.svg'),
    'KGS': cur('kg.svg'),
    'TRY': cur('tr.svg'),
    'KZT': cur('kz.svg'),
    'TJS': cur('tj.svg'),
    'UAH': cur('ua.svg'),
    'UZS': cur('uz.svg'),
    'ZAR': cur('za.svg'),
    'INR': cur('in.svg'),
    
    // Commodities
    'GOLD': com('GOLD.svg'),
    'SILVER': com('SILVER.svg'),
    'PLATINUM': com('PLATINUM.svg'),
    'PALLADIUM': com('PALLADIUM.svg'),
  };
};

const getIcon = (secid, shortname) => {
  const map = getIconMap();

  // Special handling for AMD (Stock vs Currency)
  if (secid && (secid === 'AMDRUB' || secid === 'AMD_RUB__TOM' || secid === 'AMD_RUB__TOD')) {
    return map['AMD_CURRENCY'];
  }

  // Try to match exact secid first
  if (secid && map[secid]) {
    return map[secid];
  }

  if (secid) {
    if (secid.startsWith('USD')) return map['Si'];
    if (secid.startsWith('EUR')) return map['Eu'];
    if (secid.startsWith('CNY')) return map['CNY'];
    if (secid.startsWith('HKD')) return map['HKD'];
    if (secid.startsWith('GBP')) return map['GBP'];
    if (secid.startsWith('CHF')) return map['CHF'];
    if (secid.startsWith('JPY')) return map['JPY'];
    if (secid.startsWith('TRY')) return map['TRY'];
    if (secid.startsWith('KZT')) return map['KZT'];
    if (secid.startsWith('BYN')) return map['BYN'];
    if (secid.startsWith('AED')) return map['AED'];
    if (secid.startsWith('AMD')) return map['AMD_CURRENCY'];
    if (secid.startsWith('AZN')) return map['AZN'];
    if (secid.startsWith('KGS')) return map['KGS'];
    if (secid.startsWith('TJS')) return map['TJS'];
    if (secid.startsWith('UAH')) return map['UAH'];
    if (secid.startsWith('UZS')) return map['UZS'];
    if (secid.startsWith('ZAR')) return map['ZAR'];
    if (secid.startsWith('INR')) return map['INR'];
    
    // Metals
    if (secid.startsWith('GLD') || secid.startsWith('GOLD')) return map['GOLD'];
    if (secid.startsWith('SLV') || secid.startsWith('SILV')) return map['SILVER'];
    if (secid.startsWith('PLT') || secid.startsWith('PLAT')) return map['PLATINUM'];
    if (secid.startsWith('PLD') || secid.startsWith('PALL')) return map['PALLADIUM'];
  }

  return null;
};

const fetchSecurities = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const securities = json.securities.data.map(item => ({
            secid: item[0],
            shortname: item[1]
          }));
          resolve(securities);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const run = async () => {
  const missing = [];
  let total = 0;

  for (const url of SOURCES) {
    try {
      console.log(`Fetching ${url}...`);
      const securities = await fetchSecurities(url);
      total += securities.length;

      for (const sec of securities) {
        const icon = getIcon(sec.secid, sec.shortname);
        if (!icon) {
          missing.push(`${sec.secid} | ${sec.shortname}`);
        }
      }
    } catch (e) {
      console.error(`Error fetching ${url}:`, e);
    }
  }

  console.log(`Total currencies fetched: ${total}`);
  console.log(`Currencies missing icons: ${missing.length}`);

  if (missing.length > 0) {
    fs.writeFileSync('missing_currency_icons.txt', missing.join('\n'));
    console.log('List saved to missing_currency_icons.txt');
  }
};

run();
