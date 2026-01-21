const fs = require('fs');
const https = require('https');
const path = require('path');

const ICONS_FILE = path.join(__dirname, 'src/utils/futures-icons.js');
const URL = 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME';

const getMapFromSource = () => {
  const content = fs.readFileSync(ICONS_FILE, 'utf8');
  const startMatch = content.match(/const getIconMap = \(\) => \{/);
  if (!startMatch) throw new Error('Could not find getIconMap');
  
  const startIndex = startMatch.index;
  const returnMatch = content.slice(startIndex).match(/return (\{[\s\S]*?\});/);
  if (!returnMatch) throw new Error('Could not find return object in getIconMap');
  
  const objectCode = returnMatch[1];
  
  const ru = (file) => `/icons/shares/ru/${file}`;
  const us = (file) => `/icons/shares/us/${file}`;
  const cn = (file) => `/icons/shares/cn/${file}`;
  const cur = (file) => `/icons/currencies/${file}`;
  const cry = (file) => `/icons/crypto/${file}`;
  const com = (file) => `/icons/commodities/${file}`;
  
  return eval('(' + objectCode + ')');
};

const map = getMapFromSource();

const getIcon = (secid, shortname) => {
  // Direct map lookup
  if (secid && map[secid]) return map[secid];
  
  // Logic from futures-icons.js
  if (secid && secid.startsWith('BYM')) return map['BLR'];
  if (secid === 'LQDT') return map['VTBR'];
  if (secid === 'RSHU') return map['RSHB'];
  if (secid === 'MKBD' || secid === 'SUGB') return map['CBOM'];
  if (secid === 'TMOS') return map['TCS'];
  if (secid === 'CASH') return map['AAA'];
  if (secid === 'MONY') return map['AKBARS'];
  if (secid === 'FINC') return map['FINSTAR'];
  if (secid === 'FMMM' || secid === 'FMBR') return map['FINAM'];
  
  if (secid && (secid.startsWith('SB') && secid !== 'SBER' && secid !== 'SBPR') || ['SCFT', 'SCLI', 'SIPO', 'STME'].includes(secid)) return map['UKFIRST'];
  
  if (secid && secid.startsWith('AK') && secid !== 'AKRN') return map['ALFA'];
  
  const tCapitalEtfs = ['TBEU', 'TBRU', 'TDIV', 'TEUR', 'TGLD', 'TITR', 'TLCB', 'TMON', 'TOFZ', 'TPAY', 'TRND', 'TRUR', 'TUSD', 'TMOS'];
  if (secid && tCapitalEtfs.includes(secid)) return map['TCS'];
  
  if (secid && (secid.startsWith('AM') || secid.startsWith('ATON'))) {
    if (!secid.startsWith('AMD')) return map['ATON'];
  }
  
  if (secid && (secid.startsWith('BCS') || ['OBLG', 'OPNB', 'OPNR', 'PRIE', 'VOST'].includes(secid))) return map['BCS'];
  
  if (secid && (secid.startsWith('IN') && secid !== 'INARKT' && secid !== 'INTL')) return map['INGO'];
  if (['YUAN'].includes(secid)) return map['INGO'];
  
  if (secid && (['DIVD', 'GROD', 'BOND'].includes(secid) || secid.startsWith('BND'))) return map['DOHOD'];
  
  if (secid && secid.startsWith('PS')) return map['PSB'];
  
  if (secid && (['SILA', 'SAFE', 'GOOD', 'SMCF'].includes(secid))) return map['SOLID'];
  
  if (secid && ['ESGE', 'WILD', 'CNYM', 'EQMX', 'OBLG'].includes(secid)) return map['WIM'];
  
  if (!shortname) return null;
  const shortnameUpper = shortname.toUpperCase();
  
  if (shortnameUpper.startsWith('АЭРОФЛ')) return map['AFLT'];
  if (shortnameUpper.startsWith('СЕГЕЖА')) return map['SGZH'];
  if (shortnameUpper.startsWith('НОРНИК')) return map['GMKN'];
  if (shortnameUpper.startsWith('НЛМК')) return map['NLMK'];
  if (shortnameUpper.startsWith('РОССЕТ') || shortnameUpper.startsWith('ФСК') || shortnameUpper.startsWith('РСЕТИ')) return map['FEES'];
  if (shortnameUpper.startsWith('ИКС 5') || shortnameUpper.startsWith('X5') || shortnameUpper.startsWith('ИКС5')) return map['FIVE'];
  if (shortnameUpper.startsWith('СОВКОМ')) return map['SVCB'];
  if (shortnameUpper.startsWith('САМОЛЕТ')) return map['SMLT'];
  if (shortnameUpper.startsWith('СЕЛИГДАР')) return map['SELG'];
  if (shortnameUpper.startsWith('ЕВРОПЛАН') || shortnameUpper.startsWith('ЛК ')) return map['LEAS'];
  if (shortnameUpper.startsWith('ДЕЛИМОБИЛЬ') || shortnameUpper.startsWith('КАРШЕРИНГ')) return map['DELI'];
  if (shortnameUpper.startsWith('ВУШ')) return map['WUSH'];
  if (shortnameUpper.startsWith('ПОЛЮС')) return map['PLZL'];
  if (shortnameUpper.startsWith('ПИК')) return map['PIKK'];
  if (shortnameUpper.startsWith('ЛСР')) return map['LSRG'];
  if (shortnameUpper.startsWith('ЭТАЛОН')) return map['ETLN'];
  if (shortnameUpper.startsWith('ОКЕЙ') || shortnameUpper.startsWith("О'КЕЙ")) return map['OKEY'];
  if (shortnameUpper.startsWith('ЛЕНТА')) return map['LENT'];
  if (shortnameUpper.startsWith('МВИДЕО') || shortnameUpper.startsWith('МВ ФИН')) return map['MVID'];
  if (shortnameUpper.startsWith('БЕЛУГА') || shortnameUpper.startsWith('НОВАБЕВ')) return map['BELU'];
  if (shortnameUpper.startsWith('ТИНЬКОФФ') || shortnameUpper.startsWith('Т-ФИН') || shortnameUpper.startsWith('ТБАНК')) return map['T'];
  if (shortnameUpper.startsWith('ЯНДЕКС')) return map['YNDX'];
  if (shortnameUpper.startsWith('ФОСАГРО')) return map['PHOR'];
  if (shortnameUpper.startsWith('РУСГИД')) return map['HYDR'];
  if (shortnameUpper.startsWith('ОЗОН')) return map['OZON'];
  if (shortnameUpper.startsWith('SТБАНК')) return map['T'];
  if (shortnameUpper.startsWith('НОВАТЭК')) return map['NVTK'];
  if (shortnameUpper.startsWith('ГАЗПКАП')) return map['GAZP'];
  if (shortnameUpper.startsWith('ГАЗПНЕФТЬ')) return map['SIBN'];
  if (shortnameUpper.startsWith('ГТЛК')) return map['GTLK'];
  if (shortnameUpper.startsWith('РСНФТ')) return map['ROSN'];
  if (shortnameUpper.startsWith('МАГНИ')) return map['MGNT'];
  if (shortnameUpper.startsWith('ПОЛЮ')) return map['PLZL'];
  if (shortnameUpper.startsWith('ГАЗПК')) return map['GAZP'];
  if (shortnameUpper.startsWith('ЯТЭК')) return map['YAKG'];
  if (shortnameUpper.startsWith('ГАЗПН')) return map['SIBN'];
  if (shortnameUpper.startsWith('ИНАРКТ')) return map['AQUA'];
  if (shortnameUpper.startsWith('СИНАРА')) return map['SINARA'];
  if (shortnameUpper.startsWith('ПКБ') || shortnameUpper.startsWith('ПЕРВОЕ КЛИЕНТСКОЕ') || shortnameUpper.startsWith('ПЕРВОЕ КОЛЛЕКТОРСКОЕ')) return map['PKB'];
  if (shortnameUpper.startsWith('А101')) return map['A101'];
  if (shortnameUpper.startsWith('РЕСБЕЛ')) return map['BLR'];
  if (shortnameUpper.startsWith('ПОЗИТИВ') || shortnameUpper.startsWith('IПОЗИТИВ')) return map['POSI'];
  if (shortnameUpper.startsWith('СПЛИТ')) return map['YNDX'];
  if (shortnameUpper.startsWith('СБКИБ')) return map['SBRF'];
  if (shortnameUpper.startsWith('РОЛЬФ')) return map['ROLF'];
  if (shortnameUpper.startsWith('САМОКАТ')) return map['SAMOKAT'];
  if (shortnameUpper.startsWith('SЕВТРАН')) return map['EUTR'];
  if (shortnameUpper.startsWith('SГПБ')) return map['GPB'];
  if (shortnameUpper.startsWith('БАНКДОМ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('ССТЕМ')) return map['AFKS'];
  if (shortnameUpper.startsWith('РФ З')) return map['OFZ'];
  if (shortnameUpper.startsWith('ЕВР')) return map['EUTR'];
  if (shortnameUpper.startsWith('SГТЛК')) return map['GTLK'];
  if (shortnameUpper.startsWith('АБРАУ')) return map['SVAV'];
  if (shortnameUpper.startsWith('АЛФФБ')) return map['ALFA'];
  if (shortnameUpper.startsWith('SСИСТЕМ')) return map['AFKS'];
  if (shortnameUpper.startsWith('СОВКОКАП')) return map['SVCB'];
  if (shortnameUpper.startsWith('АЛРОСА') || shortnameUpper.startsWith('АЛРОC')) return map['ALRS'];
  if (shortnameUpper.startsWith('СИСТЕМ')) return map['AFKS'];
  if (shortnameUpper.startsWith('ГЛОРАКС')) return map['GLORAX'];
  if (shortnameUpper.startsWith('ЕВТРАН') || shortnameUpper.startsWith('ЕВТРНС') || shortnameUpper.startsWith('SЕВТРАН') || shortnameUpper.startsWith('SЕВТРНС')) return map['EUTR'];
  if (shortnameUpper.startsWith('РФ ЗО')) return map['OFZ'];
  if (shortnameUpper.startsWith('SELSILV')) return map['SELG'];
  if (shortnameUpper.startsWith('СБCIB') || shortnameUpper.startsWith('СБ CIB')) return map['SBRF'];
  if (shortnameUpper.startsWith('ЮГК')) return map['UGLD'];
  if (shortnameUpper.startsWith('АГРОUSD')) return map['AGRO'];
  if (shortnameUpper.startsWith('ТБ-')) return map['TCS'];
  if (shortnameUpper.startsWith('ЭНПЛГ')) return map['ENPG'];
  if (shortnameUpper.startsWith('ВСИНСТР')) return map['VSEH'];
  
  return null;
};

const fetchData = () => {
  https.get(URL, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        const securities = jsonData.securities.data;
        const missingIcons = [];
        
        securities.forEach(sec => {
          const secid = sec[0];
          const shortname = sec[1];
          const icon = getIcon(secid, shortname);
          if (!icon) {
            missingIcons.push({ secid, shortname });
          }
        });
        
        console.log(`Total missing icons: ${missingIcons.length}`);
        if (missingIcons.length > 0) {
          missingIcons.forEach(item => console.log(`${item.secid} (${item.shortname})`));
        }
      } catch (err) {
        console.error(err);
      }
    });
  }).on('error', err => console.error(err));
};

fetchData();
