
import { query } from '../db';
import * as fs from 'fs';
import * as path from 'path';

// Manual mapping of currency codes to names
const currencyMap: { [key: string]: string } = {
  'AED': 'Дирхам ОАЭ',
  'AMD': 'Армянский драм',
  'AZN': 'Азербайджанский манат',
  'BYN': 'Белорусский рубль',
  'CHF': 'Швейцарский франк',
  'CNY': 'Китайский юань',
  'EUR': 'Евро',
  'GBP': 'Фунт стерлингов',
  'GLD': 'Золото',
  'HKD': 'Гонконгский доллар',
  'JPY': 'Японская йена',
  'KGS': 'Киргизский сом',
  'KZT': 'Казахстанский тенге',
  'PLD': 'Палладий',
  'PLT': 'Платина',
  'SLV': 'Серебро',
  'TJS': 'Таджикский сомони',
  'TRY': 'Турецкая лира',
  'UAH': 'Украинская гривна',
  'USD': 'Доллар США',
  'UZS': 'Узбекский сум',
  'ZAR': 'Южноафриканский рэнд'
};

// Mode mappings
const modeMap: { [key: string]: string } = {
  'TOD': 'TOD',
  'TOM': 'TOM',
  'TMS': '(малые лоты) TMS',
  'SPT': 'SPOT',
  'TODTOM': 'Своп TOD/TOM',
  'TOM1D': 'Своп TOM/1D',
  'TOM1W': 'Своп TOM/1W',
  'TOM1M': 'Своп TOM/1M',
  'TOM2W': 'Своп TOM/2W',
  'TOM2M': 'Своп TOM/2M',
  'TOM3M': 'Своп TOM/3M',
  'TOM6M': 'Своп TOM/6M',
  'TOM9M': 'Своп TOM/9M',
  'TOM1Y': 'Своп TOM/1Y',
  'LTV': 'FWD',
  'DIS': 'Аукцион',
  'TDTM': 'Своп TOD/TOM',
  'TMSP': 'Своп TOM/SPT',
  'FWD': 'Форвард'
};

// Raw data from MOEX (copy-pasted from the curl output to ensure coverage)
const rawData = [
    ["AEDRUBTODTOM", "AED_TODTOM"], ["AEDRUB_SPT", "AEDRUB_SPT"], ["AEDRUB_TMS", "AEDRUB_TMS"], 
    ["AEDRUB_TOD", "AEDRUB_TOD"], ["AEDRUB_TOM", "AEDRUB_TOM"], ["AEDRUB_TOM1D", "AED_TOMSPT"], 
    ["AMDRUBTODTOM", "AMD_TODTOM"], ["AMDRUB_TMS", "AMDRUB_TMS"], ["AMDRUB_TOD", "AMDRUB_TOD"], 
    ["AMDRUB_TOM", "AMDRUB_TOM"], ["AZNRUBTODTOM", "AZN_TODTOM"], ["AZNRUB_TMS", "AZNRUB_TMS"], 
    ["AZNRUB_TOD", "AZNRUB_TOD"], ["AZNRUB_TOM", "AZNRUB_TOM"], ["BYNRUBTODTOM", "BYN_TODTOM"], 
    ["BYNRUB_TMS", "BYNRUB_TMS"], ["BYNRUB_TOD", "BYNRUB_TOD"], ["BYNRUB_TOM", "BYNRUB_TOM"], 
    ["CHFRUBTODTOM", "CHF_TODTOM"], ["CHFRUB_SPT", "CHFRUB_SPT"], ["CHFRUB_TMS", "CHFRUB_TMS"], 
    ["CHFRUB_TOD", "CHFRUB_TOD"], ["CHFRUB_TOM", "CHFRUB_TOM"], ["CHFRUB_TOM1D", "CHF_TOMSPT"], 
    ["CNY000000TOD", "CNYRUB_TOD"], ["CNYRUBTODTOM", "CNY_TODTOM"], ["CNYRUB_FWD", "CNYRUB_LTV"], 
    ["CNYRUB_SPT", "CNYRUB_SPT"], ["CNYRUB_TMS", "CNYRUB_TMS"], ["CNYRUB_TOM", "CNYRUB_TOM"], 
    ["CNYRUB_TOM1D", "CNY_TOMSPT"], ["CNYRUB_TOM1M", "CNY_TOM1M"], ["CNYRUB_TOM1W", "CNY_TOM1W"], 
    ["CNYRUB_TOM2M", "CNY_TOM2M"], ["CNYRUB_TOM2W", "CNY_TOM2W"], ["CNYRUB_TOM3M", "CNY_TOM3M"], 
    ["CNYRUB_TOM6M", "CNY_TOM6M"], ["EUR000TODTOM", "EUR_TODTOM"], ["EURRUB_FWD", "EURRUB_LTV"], 
    ["EURRUB_SPT", "EURRUB_SPT"], ["EURRUB_TMS", "EURRUB_TMS"], ["EURRUB_TOM1D", "EUR_TOMSPT"], 
    ["EURRUB_TOM1M", "EUR_TOM1M"], ["EURRUB_TOM1W", "EUR_TOM1W"], ["EURRUB_TOM1Y", "EUR_TOM1Y"], 
    ["EURRUB_TOM2M", "EUR_TOM2M"], ["EURRUB_TOM2W", "EUR_TOM2W"], ["EURRUB_TOM3M", "EUR_TOM3M"], 
    ["EURRUB_TOM6M", "EUR_TOM6M"], ["EURRUB_TOM9M", "EUR_TOM9M"], ["EURUSD000TOD", "EURUSD_TOD"], 
    ["EURUSD000TOM", "EURUSD_TOM"], ["EURUSDTODTOM", "EURUSDTDTM"], ["EURUSD_SPT", "EURUSD_SPT"], 
    ["EURUSD_TOM1D", "EURUSDTMSP"], ["EUR_RUB__TOD", "EURRUB_TOD"], ["EUR_RUB__TOM", "EURRUB_TOM"], 
    ["GBPRUBTODTOM", "GBP_TODTOM"], ["GBPRUB_SPT", "GBPRUB_SPT"], ["GBPRUB_TMS", "GBPRUB_TMS"], 
    ["GBPRUB_TOD", "GBPRUB_TOD"], ["GBPRUB_TOM", "GBPRUB_TOM"], ["GBPRUB_TOM1D", "GBP_TOMSPT"], 
    ["GBPUSDTODTOM", "GBPUSDTDTM"], ["GBPUSD_SPT", "GBPUSD_SPT"], ["GBPUSD_TOD", "GBPUSD_TOD"], 
    ["GBPUSD_TOM", "GBPUSD_TOM"], ["GBPUSD_TOM1D", "GBPUSDTMSP"], ["GLDRUBTODTOM", "GLD_TODTOM"], 
    ["GLDRUB_FWD", "GLDRUB_LTV"], ["GLDRUB_SPT", "GLDRUB_SPT"], ["GLDRUB_TOD", "GLDRUB_TOD"], 
    ["GLDRUB_TOM", "GLDRUB_TOM"], ["GLDRUB_TOM1D", "GLD_TOMSPT"], ["GLDRUB_TOM1M", "GLD_TOM1M"], 
    ["GLDRUB_TOM1W", "GLD_TOM1W"], ["GLDRUB_TOM6M", "GLD_TOM6M"], ["HKDRUBTODTOM", "HKD_TODTOM"], 
    ["HKDRUB_TMS", "HKDRUB_TMS"], ["HKDRUB_TOD", "HKDRUB_TOD"], ["HKDRUB_TOM", "HKDRUB_TOM"], 
    ["JPYRUBTODTOM", "JPY_TODTOM"], ["JPYRUB_SPT", "JPYRUB_SPT"], ["JPYRUB_TMS", "JPYRUB_TMS"], 
    ["JPYRUB_TOD", "JPYRUB_TOD"], ["JPYRUB_TOM", "JPYRUB_TOM"], ["JPYRUB_TOM1D", "JPY_TOMSPT"], 
    ["KGSRUBTODTOM", "KGS_TODTOM"], ["KGSRUB_TOD", "KGSRUB_TOD"], ["KGSRUB_TOM", "KGSRUB_TOM"], 
    ["KZTRUBTODTOM", "KZT_TODTOM"], ["KZTRUB_FWD", "KZTRUB_LTV"], ["KZTRUB_SPT", "KZTRUB_SPT"], 
    ["KZTRUB_TMS", "KZTRUB_TMS"], ["KZTRUB_TOD", "KZTRUB_TOD"], ["KZTRUB_TOM", "KZTRUB_TOM"], 
    ["KZTRUB_TOM1D", "KZT_TOMSPT"], ["KZTRUB_TOM1M", "KZT_TOM1M"], ["KZTRUB_TOM1W", "KZT_TOM1W"], 
    ["KZTRUB_TOM2M", "KZT_TOM2M"], ["KZTRUB_TOM2W", "KZT_TOM2W"], ["KZTRUB_TOM3M", "KZT_TOM3M"], 
    ["KZTRUB_TOM6M", "KZT_TOM6M"], ["PLDRUBTODTOM", "PLD_TODTOM"], ["PLDRUB_FWD", "PLDRUB_LTV"], 
    ["PLDRUB_SPT", "PLDRUB_SPT"], ["PLDRUB_TOD", "PLDRUB_TOD"], ["PLDRUB_TOM", "PLDRUB_TOM"], 
    ["PLDRUB_TOM1D", "PLD_TOMSPT"], ["PLDRUB_TOM1M", "PLD_TOM1M"], ["PLDRUB_TOM1W", "PLD_TOM1W"], 
    ["PLDRUB_TOM6M", "PLD_TOM6M"], ["PLTRUBTODTOM", "PLT_TODTOM"], ["PLTRUB_FWD", "PLTRUB_LTV"], 
    ["PLTRUB_SPT", "PLTRUB_SPT"], ["PLTRUB_TOD", "PLTRUB_TOD"], ["PLTRUB_TOM", "PLTRUB_TOM"], 
    ["PLTRUB_TOM1D", "PLT_TOMSPT"], ["PLTRUB_TOM1M", "PLT_TOM1M"], ["PLTRUB_TOM1W", "PLT_TOM1W"], 
    ["PLTRUB_TOM6M", "PLT_TOM6M"], ["SLVRUBTODTOM", "SLV_TODTOM"], ["SLVRUB_FWD", "SLVRUB_LTV"], 
    ["SLVRUB_SPT", "SLVRUB_SPT"], ["SLVRUB_TOD", "SLVRUB_TOD"], ["SLVRUB_TOM", "SLVRUB_TOM"], 
    ["SLVRUB_TOM1D", "SLV_TOMSPT"], ["SLVRUB_TOM1M", "SLV_TOM1M"], ["SLVRUB_TOM1W", "SLV_TOM1W"], 
    ["SLVRUB_TOM6M", "SLV_TOM6M"], ["TJSRUBTODTOM", "TJS_TODTOM"], ["TJSRUB_TOD", "TJSRUB_TOD"], 
    ["TJSRUB_TOM", "TJSRUB_TOM"], ["TRYRUBTODTOM", "TRY_TODTOM"], ["TRYRUB_TMS", "TRYRUB_TMS"], 
    ["TRYRUB_TOD", "TRYRUB_TOD"], ["TRYRUB_TOM", "TRYRUB_TOM"], ["UAH000000TOM", "UAHRUB_TOD"], 
    ["USD000000TOD", "USDRUB_TOD"], ["USD000TODTOM", "USD_TODTOM"], ["USD000UTSTOM", "USDRUB_TOM"], 
    ["USDAEDTODTOM", "USDAEDTDTM"], ["USDAED_SPT", "USDAED_SPT"], ["USDAED_TOD", "USDAED_TOD"], 
    ["USDAED_TOM", "USDAED_TOM"], ["USDAED_TOM1D", "USDAEDTMSP"], ["USDAMDTODTOM", "USDAMDTDTM"], 
    ["USDAMD_TOD", "USDAMD_TOD"], ["USDAMD_TOM", "USDAMD_TOM"], ["USDAZNTODTOM", "USDAZNTDTM"], 
    ["USDAZN_TOD", "USDAZN_TOD"], ["USDAZN_TOM", "USDAZN_TOM"], ["USDCHFTODTOM", "USDCHFTDTM"], 
    ["USDCHF_SPT", "USDCHF_SPT"], ["USDCHF_TOD", "USDCHF_TOD"], ["USDCHF_TOM", "USDCHF_TOM"], 
    ["USDCHF_TOM1D", "USDCHFTMSP"], ["USDCNYTODTOM", "USDCNYTDTM"], ["USDCNY_SPT", "USDCNY_SPT"], 
    ["USDCNY_TOD", "USDCNY_TOD"], ["USDCNY_TOM", "USDCNY_TOM"], ["USDCNY_TOM1D", "USDCNYTMSP"], 
    ["USDJPYTODTOM", "USDJPYTDTM"], ["USDJPY_SPT", "USDJPY_SPT"], ["USDJPY_TOD", "USDJPY_TOD"], 
    ["USDJPY_TOM", "USDJPY_TOM"], ["USDJPY_TOM1D", "USDJPYTMSP"], ["USDKZTTODTOM", "USDKZTTDTM"], 
    ["USDKZT_SPT", "USDKZT_SPT"], ["USDKZT_TOD", "USDKZT_TOD"], ["USDKZT_TOM", "USDKZT_TOM"], 
    ["USDKZT_TOM1D", "USDKZTTMSP"], ["USDRUB_DIS", "USDRUB_DIS"], ["USDRUB_SPT", "USDRUB_SPT"], 
    ["USDRUB_TMS", "USDRUB_TMS"], ["USDRUB_TOM1D", "USD_TOMSPT"], ["USDRUB_TOM1M", "USD_TOM1M"], 
    ["USDRUB_TOM1W", "USD_TOM1W"], ["USDRUB_TOM1Y", "USD_TOM1Y"], ["USDRUB_TOM2M", "USD_TOM2M"], 
    ["USDRUB_TOM2W", "USD_TOM2W"], ["USDRUB_TOM3M", "USD_TOM3M"], ["USDRUB_TOM6M", "USD_TOM6M"], 
    ["USDRUB_TOM9M", "USD_TOM9M"], ["USDTRYTODTOM", "USDTRYTDTM"], ["USDTRY_SPT", "USDTRY_SPT"], 
    ["USDTRY_TOD", "USDTRY_TOD"], ["USDTRY_TOM", "USDTRY_TOM"], ["USDTRY_TOM1D", "USDTRYTMSP"], 
    ["USDZARTODTOM", "USDZARTDTM"], ["USDZAR_TOD", "USDZAR_TOD"], ["USDZAR_TOM", "USDZAR_TOM"], 
    ["UZSRUBTODTOM", "UZS_TODTOM"], ["UZSRUB_TOD", "UZSRUB_TOD"], ["UZSRUB_TOM", "UZSRUB_TOM"], 
    ["ZARRUBTODTOM", "ZAR_TODTOM"], ["ZARRUB_TMS", "ZARRUB_TMS"], ["ZARRUB_TOD", "ZARRUB_TOD"], 
    ["ZARRUB_TOM", "ZARRUB_TOM"]
];

const generateName = (secid: string, shortname: string): string => {
  let name = secid;
  
  // Clean shortname from MOEX weirdness if needed, but for now use it as base for parsing
  // Common format: XXXRUB_MOD or XXX_MOD
  
  // Identify Currency Pair
  let pair = '';
  let currencyCode = '';
  
  // Try to find currency code in shortname
  for (const code of Object.keys(currencyMap)) {
    if (shortname.includes(code)) {
      currencyCode = code;
      break;
    }
  }
  
  if (!currencyCode) {
    // Try secid
     for (const code of Object.keys(currencyMap)) {
      if (secid.includes(code)) {
        currencyCode = code;
        break;
      }
    }
  }

  if (currencyCode) {
    pair = currencyMap[currencyCode];
  } else {
    return shortname; // Fallback
  }
  
  // Identify Mode
  let mode = '';
  let modeSuffix = '';
  
  // Special handling for cross rates like EURUSD, GBPUSD
  if (shortname.includes('USD') && shortname.includes('EUR')) {
      pair = 'EUR/USD';
  } else if (shortname.includes('USD') && shortname.includes('GBP')) {
      pair = 'GBP/USD';
  } else if (shortname.includes('USD') && shortname.includes('CNY') && !shortname.startsWith('CNY')) {
      // USDCNY
      pair = 'Доллар/Юань';
  } else if (shortname.includes('USD') && shortname.includes('TRY') && !shortname.startsWith('TRY')) {
      pair = 'Доллар/Лира';
  } else if (shortname.includes('USD') && shortname.includes('AED') && !shortname.startsWith('AED')) {
      pair = 'Доллар/Дирхам';
  } else if (shortname.includes('USD') && shortname.includes('JPY')) {
      pair = 'Доллар/Йена';
  } else if (shortname.includes('USD') && shortname.includes('KZT')) {
      pair = 'Доллар/Тенге';
  }

  // Find mode
  for (const m of Object.keys(modeMap)) {
    if (shortname.endsWith('_' + m) || shortname.endsWith(m)) {
      mode = modeMap[m];
      modeSuffix = m;
      break;
    }
  }
  
  if (!mode) {
      // Fallback mode detection
      if (shortname.includes('TOD')) mode = 'TOD';
      else if (shortname.includes('TOM')) mode = 'TOM';
      else if (shortname.includes('TMS')) mode = '(малые лоты) TMS';
  }

  if (pair && mode) {
      return `${pair} ${mode}`;
  }
  
  return shortname;
};

const run = async () => {
  try {
    console.log('Creating currency_names table...');
    await query(`
      CREATE TABLE IF NOT EXISTS currency_names (
        secid VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        shortname VARCHAR(50) NOT NULL
      );
    `);
    
    console.log('Truncating table...');
    await query('TRUNCATE TABLE currency_names');
    
    console.log('Inserting data...');
    for (const [secid, shortname] of rawData) {
      const decodedName = generateName(secid, shortname);
      // Format requested: "Decoded Name (SECID)" or just Decoded Name?
      // User said: "В таблице нужно в столбец наименование выводить как расшифрованное название, так и тикер."
      // So I will store the decoded name in 'name'. The frontend can combine them or I can store combined.
      // Let's store just the nice name in 'name', and keep 'shortname' as original ticker/shortname.
      // Actually, user said: "Имена должны иметь вид "Беларусский рубль TOM"..."
      // So 'name' should be "Беларусский рубль TOM".
      
      await query(
        'INSERT INTO currency_names (secid, name, shortname) VALUES ($1, $2, $3)',
        [secid, decodedName, shortname]
      );
      console.log(`Inserted: ${secid} -> ${decodedName}`);
    }
    
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
