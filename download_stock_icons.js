const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = path.join(__dirname, 'public', 'icons', 'shares', 'ru');

const tickers = [
  'AKRN', 'APRI', 'APTK', 'ARSA', 'ASSB', 'AVAN', 'BAZA', 'BISVP', 'BLNG', 'BRZL', 
  'CARM', 'CHGZ', 'CHKZ', 'CHMK', 'CNTL', 'CNTLP', 'DATA', 'DIOD', 'DVEC', 'DZRD', 
  'DZRDP', 'ELFV', 'ELMT', 'GAZA', 'GAZAP', 'GAZC', 'GAZS', 'GAZT', 'GECO', 'GEMA', 
  'GEMC', 'GTRK', 'HIMCP', 'IGST', 'IGSTP', 'IRKT', 'JNOS', 'JNOSP', 'KBSB', 'KCHE', 
  'KCHEP', 'KFBA', 'KGKC', 'KGKCP', 'KLSB', 'KLVZ', 'KMEZ', 'KOGK', 'KRKN', 'KRKNP', 
  'KRKOP', 'KROT', 'KROTP', 'KRSB', 'KRSBP', 'KUZB', 'LIFE', 'LMBZ', 'LNZL', 'LNZLP', 
  'LPSB', 'LVHK', 'MAGE', 'MAGEP', 'MAGN', 'MFGS', 'MFGSP', 'MGKL', 'MGNZ', 'MGTS', 
  'MGTSP', 'MISB', 'MISBP', 'MRSB', 'MSNG', 'NFAZ', 'NKHP', 'NKSH', 'NNSB', 'NNSBP', 
  'OMZZP', 'PAZA', 'PMSB', 'PMSBP', 'PRFN', 'PRMB', 'PRMD', 'RBCM', 'RDRB', 'RGSS', 
  'ROST', 'RTGZ', 'RTSB', 'RTSBP', 'RUSI', 'RZSB', 'SAGO', 'SAGOP', 'SARE', 'SAREP', 
  'SLEN', 'STSB', 'STSBP', 'SVET', 'SVETP', 'TASB', 'TASBP', 'TGKN', 'TNSE', 'TORS', 
  'TORSP', 'TTLK', 'TUZA', 'UNKL', 'URKZ', 'USBN', 'UTAR', 'UWGN', 'VGSB', 'VGSBP', 
  'VJGZ', 'VJGZP', 'VLHZ', 'VRSB', 'VRSBP', 'VSYD', 'VSYDP', 'YKEN', 'YKENP', 'YRSB', 
  'YRSBP', 'ZAYM', 'ZILL', 'ZVEZ'
];

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        fs.unlink(dest, () => {}); // Clean up empty file
        reject(new Error(`Status ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const run = async () => {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  let successCount = 0;
  let failCount = 0;

  for (const ticker of tickers) {
    const dest = path.join(DIR, `${ticker}.png`);
    if (fs.existsSync(dest)) {
      console.log(`Skipping ${ticker}, already exists.`);
      continue;
    }

    // Try funcid/take-moex-logos (User provided source)
    const funcidUrl = `https://raw.githubusercontent.com/funcid/take-moex-logos/main/images/${ticker}.png`;
    try {
      await download(funcidUrl, dest);
      console.log(`Downloaded ${ticker} from funcid/take-moex-logos`);
      successCount++;
      continue;
    } catch (e) {
      // Ignore
    }

    // Try Tinkoff first
    const tinkoffUrl = `https://assets.tinkoff.ru/automata/icons/equity/${ticker}.png`;
    try {
      await download(tinkoffUrl, dest);
      console.log(`Downloaded ${ticker} from Tinkoff`);
      successCount++;
      continue;
    } catch (e) {
      // Ignore
    }

    // Try TradingView (lowercase)
    const tvUrl = `https://s3-symbol-logo.tradingview.com/${ticker.toLowerCase()}.svg`;
    const destSvg = path.join(DIR, `${ticker}.svg`);
    try {
        await download(tvUrl, destSvg);
        console.log(`Downloaded ${ticker} from TradingView`);
        successCount++;
        continue;
    } catch (e) {
        // Ignore
    }

     // Try TradingView (uppercase)
     const tvUrlUp = `https://s3-symbol-logo.tradingview.com/${ticker}.svg`;
     try {
         await download(tvUrlUp, destSvg);
         console.log(`Downloaded ${ticker} from TradingView (Upper)`);
         successCount++;
         continue;
     } catch (e) {
         // Ignore
     }

    console.log(`Failed to find icon for ${ticker}`);
    failCount++;
  }

  console.log(`Finished. Success: ${successCount}, Failed: ${failCount}`);
};

run();
