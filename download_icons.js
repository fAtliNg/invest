const fs = require('fs');
const https = require('https');
const path = require('path');
const { URL } = require('url');

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      },
      agent: new https.Agent({ rejectUnauthorized: false })
    };
    
    const request = https.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const location = response.headers.location;
        console.log(`Redirecting from ${url} to ${location}`);
        try {
          const nextUrl = new URL(location, url).toString();
          downloadFile(nextUrl, dest).then(resolve).catch(reject);
        } catch (e) {
          reject(new Error(`Invalid redirect URL: ${location} (base: ${url})`));
        }
        return;
      }
      
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const wikiBase = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const wikiRuBase = 'https://ru.wikipedia.org/wiki/Special:FilePath/';
const simpleIconsBase = 'https://cdn.simpleicons.org/';
const flagBase = 'https://flagcdn.com/';

const tasks = [
  // Russian Companies (Wiki/Custom SVGs)
  { type: 'wiki', name: 'AFLT.svg', source: ['Logo_of_Aeroflot_Russian_Airlines.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'SBRF.svg', source: ['Sberbank_Logo_2020.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'GAZR.svg', source: ['Gazprom_logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'LKOH.svg', source: ['LUK_OIL_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'YNDX.svg', source: ['Yandex_logo_en.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'ROSN.svg', source: ['Rosneft_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'NVTK.svg', source: ['Novatek_Logo.svg', 'Novatek_logo.svg', 'Logo_Novatek.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'GMKN.svg', source: ['Norilsk_Nickel_logo.svg', 'Nornickel_Logo.svg', 'MMC_Norilsk_Nickel_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SNGS.svg', source: 'https://logo-teka.com/wp-content/uploads/2025/07/surgutneftegaz-logo.svg', dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'TATN.svg', source: ['Tatneft_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'PLZL.svg', source: ['Logo_Polyus_Gold_en.svg', 'Polyus_Gold_logo.svg', 'Polyus_logo.svg', 'Logo_Polyus.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'MGNT.svg', source: ['New_logo_of_Magnit.svg', 'Magnit_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'MTSS.svg', source: ['MTS_logo_(2016).svg', 'MTS_Logo_2019.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'NLMK.svg', source: ['NLMK_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'CHMF.svg', source: ['Severstal_Logo.svg', 'Severstal_logo.svg', 'Logo_Severstal.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'ALRS.svg', source: ['Alrosa_logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'OZON.svg', source: ['Ozon_logo_clear.svg', 'Ozon_logo.svg', 'Ozon_Group_logo.svg', 'Logo_Ozon.svg', 'Ozon_Holdings_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'VTBR.svg', source: ['VTB_Logo_2018.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'FIVE.svg', source: ['X5Group.svg', 'X5_Retail_Group_logo.svg', 'X5_Group_logo.svg', 'Logo_X5_Retail_Group.svg'], dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'HYDR.svg', source: 'https://logo-teka.com/wp-content/uploads/2025/11/rushydro-logo-eng.svg', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'IRAO.png', source: 'https://www.google.com/s2/favicons?domain=interrao.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'FEES.ico', source: 'https://www.fsk-ees.ru/favicon.ico', dir: 'public/icons/shares/ru' },

  { type: 'wiki', name: 'PHOR.svg', source: ['PhosAgro_-_Logo.svg', 'PhosAgro.svg', 'PhosAgro_logo.svg', 'PhosAgro_Logo.svg', 'Logo_PhosAgro.svg'], dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'PIKK.svg', source: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D0%9F%D0%90%D0%9E_%C2%AB%D0%9F%D0%98%D0%9A%C2%BB.svg', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'AFKS.svg', source: 'https://upload.wikimedia.org/wikipedia/en/9/9f/AFK_Sistema.svg', dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'TRNF.svg', source: ['Logo_Transneft.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'AGRO.svg', source: ['Rusagro_logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'BANE.svg', source: ['Bashneft_logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'KMAZ.svg', source: ['Typeface_logo_of_KAMAZ.svg'], dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SIBN.svg', source: 'https://logo-teka.com/wp-content/uploads/2025/07/gazprom-neft-logo-eng.svg', dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'RKKE.svg', source: ['Energia_ball_logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'MOEX.svg', source: ['Moscow_Exchange_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'RUAL.svg', source: ['Rusal_Logo.svg'], dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'VKCO.svg', source: ['VK_Full_Logo_(2021-present).svg'], dir: 'public/icons/shares/ru' },

  // Additional Russian Companies (Favicons)
  { type: 'custom', name: 'HHRU.png', source: 'https://www.google.com/s2/favicons?domain=hh.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'BSPB.png', source: 'https://www.google.com/s2/favicons?domain=bspb.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'CBOM.png', source: 'https://www.google.com/s2/favicons?domain=mkb.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'ENPG.png', source: 'https://www.google.com/s2/favicons?domain=enplusgroup.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'ETLN.png', source: 'https://www.google.com/s2/favicons?domain=etalongroup.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'FIXP.png', source: 'https://www.google.com/s2/favicons?domain=fix-price.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'FLOT.png', source: ['Совкомфлот.png'], dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'LSRG.png', source: 'https://www.google.com/s2/favicons?domain=lsrgroup.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'MVID.png', source: 'https://www.google.com/s2/favicons?domain=mvideo.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'OGKB.png', source: 'https://www.google.com/s2/favicons?domain=ogk2.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'QIWI.png', source: 'https://www.google.com/s2/favicons?domain=qiwi.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'RASP.png', source: 'https://www.google.com/s2/favicons?domain=raspadskaya.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'RENI.png', source: 'https://www.google.com/s2/favicons?domain=renins.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'RTKM.png', source: 'https://www.google.com/s2/favicons?domain=rt.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SELG.png', source: 'https://www.google.com/s2/favicons?domain=seligdar.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SGZH.png', source: 'https://www.google.com/s2/favicons?domain=segezha-group.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SOFL.png', source: 'https://www.google.com/s2/favicons?domain=softline.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SPBE.png', source: 'https://www.google.com/s2/favicons?domain=spbexchange.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'UPRO.png', source: 'https://www.google.com/s2/favicons?domain=unipro.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'VSMO.png', source: 'https://www.google.com/s2/favicons?domain=vsmpo.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'WUSH.png', source: 'https://www.google.com/s2/favicons?domain=whoosh-bike.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'BELU.png', source: 'https://www.google.com/s2/favicons?domain=novabev.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'ASTR.png', source: 'https://www.google.com/s2/favicons?domain=astragroup.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'POSI.png', source: 'https://www.google.com/s2/favicons?domain=positive.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SVCB.png', source: 'https://www.google.com/s2/favicons?domain=sovcombank.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'UGLD.png', source: 'https://www.google.com/s2/favicons?domain=ugold.ru&sz=128', dir: 'public/icons/shares/ru' },
  // { type: 'custom', name: 'EUTR.ico', source: 'https://evrotrans-azs.ru/favicon.ico', dir: 'public/icons/shares/ru' }, // 404/SSL error
  { type: 'custom', name: 'DELI.png', source: 'https://www.google.com/s2/favicons?domain=delimobil.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'DIAS.png', source: 'https://www.google.com/s2/favicons?domain=diasoft.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'LEAS.png', source: 'https://www.google.com/s2/favicons?domain=europlan.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'ABIO.png', source: 'https://www.google.com/s2/favicons?domain=artgen.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'AQUA.png', source: 'https://www.google.com/s2/favicons?domain=inarctica.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'CIAN.png', source: 'https://www.google.com/s2/favicons?domain=cian.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'FESH.png', source: 'https://www.google.com/s2/favicons?domain=fesco.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'GCHE.png', source: 'https://www.google.com/s2/favicons?domain=cherkizovo.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'HNFG.png', source: 'https://www.google.com/s2/favicons?domain=henderson.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'KAZT.png', source: 'https://www.google.com/s2/favicons?domain=kuazot.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'KZOS.png', source: 'https://www.google.com/s2/favicons?domain=kazanorgsintez.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'LENT.png', source: 'https://www.google.com/s2/favicons?domain=lenta.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'MSRS.png', source: 'https://www.google.com/s2/favicons?domain=moesk.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'MSTT.png', source: 'https://www.google.com/s2/favicons?domain=mostotrest.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'MTLR.png', source: 'https://www.google.com/s2/favicons?domain=mechel.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'NAUK.png', source: 'https://www.google.com/s2/favicons?domain=npo-nauka.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'NKNC.png', source: 'https://www.google.com/s2/favicons?domain=nknh.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'NMTP.svg', source: 'https://ncsp.ru/local/templates/ost/img/svg/logo-nmtp.svg', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'OKEY.png', source: 'https://www.google.com/s2/favicons?domain=okmarket.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'ORUP.png', source: 'https://www.google.com/s2/favicons?domain=obuvrus.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'RNFT.png', source: 'https://www.google.com/s2/favicons?domain=russneft.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'ROLO.png', source: 'https://www.google.com/s2/favicons?domain=rusolovo.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SFIN.png', source: 'https://www.google.com/s2/favicons?domain=sfiholding.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SVAV.png', source: 'https://www.google.com/s2/favicons?domain=sollers-auto.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'TGKA.png', source: 'https://www.google.com/s2/favicons?domain=tgc1.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'TGKB.png', source: 'https://www.google.com/s2/favicons?domain=tgc-2.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'TGKD.png', source: 'https://www.google.com/s2/favicons?domain=tgk-14.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'TMOS.png', source: 'https://www.google.com/s2/favicons?domain=tinkoff.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'UNAC.png', source: 'https://www.google.com/s2/favicons?domain=uacrussia.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'VEON.png', source: 'https://www.google.com/s2/favicons?domain=veon.com&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'WTCM.png', source: 'https://wtcmoscow.ru/upload/resize_cache/iblock/669/v5zsgpuq5jt2lacpo4t1ofz0yhxuotyp/400_400_1/header_logo.png', dir: 'public/icons/shares/ru' },
  { type: 'wiki', name: 'YAKG.svg', source: ['1-Yatek-rus.svg'], dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'SMLT.png', source: 'https://www.google.com/s2/favicons?domain=samolet.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'ISKJ.png', source: 'https://www.google.com/s2/favicons?domain=hsci.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'MDMG.png', source: 'https://www.google.com/s2/favicons?domain=mcclinics.ru&sz=128', dir: 'public/icons/shares/ru' },
  { type: 'custom', name: 'IVAT.ico', source: 'https://iva.ru/favicon.ico', dir: 'public/icons/shares/ru' },

  // Foreign Companies (SimpleIcons / Custom)
  { type: 'simple', name: 'AAPL.svg', source: 'apple', dir: 'public/icons/shares/us' },
  { type: 'custom', name: 'MSFT.svg', source: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', dir: 'public/icons/shares/us' },
  { type: 'simple', name: 'GOOG.svg', source: 'google', dir: 'public/icons/shares/us' },
  { type: 'custom', name: 'AMZN.svg', source: 'https://unpkg.com/simple-icons@v14/icons/amazon.svg', dir: 'public/icons/shares/us' },
  { type: 'simple', name: 'TSLA.svg', source: 'tesla', dir: 'public/icons/shares/us' },
  { type: 'simple', name: 'META.svg', source: 'meta', dir: 'public/icons/shares/us' },
  { type: 'simple', name: 'NFLX.svg', source: 'netflix', dir: 'public/icons/shares/us' },
  { type: 'simple', name: 'NVDA.svg', source: 'nvidia', dir: 'public/icons/shares/us' },
  { type: 'simple', name: 'AMD.svg', source: 'amd', dir: 'public/icons/shares/us' },
  { type: 'simple', name: 'INTC.svg', source: 'intel', dir: 'public/icons/shares/us' },
  { type: 'simple', name: 'BABA.svg', source: 'alibabadotcom', dir: 'public/icons/shares/cn' }, 
  { type: 'simple', name: 'BIDU.svg', source: 'baidu', dir: 'public/icons/shares/cn' },
  { type: 'wiki', name: 'TENCENT.svg', source: ['Tencent_logo.svg', 'Tencent_Logo.svg', 'Logo_Tencent.svg'], dir: 'public/icons/shares/cn' }, 
  { type: 'simple', name: 'XIA.svg', source: 'xiaomi', dir: 'public/icons/shares/cn' },

  // Currencies / Flags
  { type: 'flag', name: 'us.svg', source: 'us', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'eu.svg', source: 'eu', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'cn.svg', source: 'cn', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'gb.svg', source: 'gb', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'ch.svg', source: 'ch', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'jp.svg', source: 'jp', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'tr.svg', source: 'tr', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'hk.svg', source: 'hk', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'ae.svg', source: 'ae', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'kz.svg', source: 'kz', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'am.svg', source: 'am', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'by.svg', source: 'by', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'in.svg', source: 'in', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'br.svg', source: 'br', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'sa.svg', source: 'sa', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'au.svg', source: 'au', dir: 'public/icons/currencies' },
  { type: 'flag', name: 'ca.svg', source: 'ca', dir: 'public/icons/currencies' },

  // Crypto (SimpleIcons)
  { type: 'simple', name: 'BTC.svg', source: 'bitcoin', dir: 'public/icons/crypto' },
  { type: 'simple', name: 'ETH.svg', source: 'ethereum', dir: 'public/icons/crypto' },

  // Commodities (Wiki)
  { type: 'wiki', name: 'GOLD.svg', source: ['Color_icon_gold.svg', 'Gold_bullion_icon.svg', 'Symbol_Au.svg'], dir: 'public/icons/commodities' }
];

const downloadAll = async () => {
  const errors = [];
  for (const item of tasks) {
    let sources = Array.isArray(item.source) ? item.source : [item.source];
    let success = false;
    let lastError = null;

    for (const source of sources) {
      let url;
      if (item.type === 'wiki') {
        url = wikiBase + encodeURIComponent(source);
      } else if (item.type === 'wiki_ru') {
        url = wikiRuBase + encodeURIComponent(source);
      } else if (item.type === 'simple') {
        url = simpleIconsBase + source;
      } else if (item.type === 'flag') {
        url = flagBase + source + '.svg';
      } else if (item.type === 'custom') {
        url = source;
      }

      try {
        console.log(`Trying to download ${item.name} from ${url}...`); // Log URL
        await downloadFile(url, path.join(item.dir, item.name));
        success = true;
        break; // Stop trying other sources if successful
      } catch (err) {
        console.error(`Failed to download ${item.name} from ${source}: ${err.message}`);
        lastError = err;
      }
    }

    if (!success) {
      errors.push({ name: item.name, error: lastError ? lastError.message : 'Unknown error' });
    }
  }
  
  if (errors.length > 0) {
    console.log('Finished with errors:');
    errors.forEach(e => console.log(`${e.name}: ${e.error}`));
  } else {
    console.log('All downloads finished successfully!');
  }
};

downloadAll();
