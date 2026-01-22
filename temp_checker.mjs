
const getIconMap = () => {
  const ru = (file) => `/icons/shares/ru/${file}`;
  const us = (file) => `/icons/shares/us/${file}`;
  const cn = (file) => `/icons/shares/cn/${file}`;
  const cur = (file) => `/icons/currencies/${file}`;
  const cry = (file) => `/icons/crypto/${file}`;
  const com = (file) => `/icons/commodities/${file}`;

  return {
    // Russian Companies
    'AFLT': ru('AFLT.svg'),
    'OFZ': cur('ru.svg'),
    'RUS': cur('ru.svg'),
    'BLR': cur('by.svg'),
    'RZD': ru('RZD.svg'),
    'TMK': ru('TMK.svg'),
    'ALFA': ru('ALFA.svg'),
    'POCHTA': ru('POCHTA.svg'),
    'GPB': ru('GPB.svg'),
    'RSHB': ru('RSHB.svg'),
    'HENDERSON': ru('HNFG.png'),
    'POLYUS': ru('PLZL.svg'),
    'MTS': ru('MTSS.svg'),
    'TCS': ru('TCS.svg'),
    'SUEK': ru('SUEK.svg'),
    'GTLK': cur('ru.svg'),
    'EUTR': cur('ru.svg'),
    'BRUS': ru('BRUS.svg'),
    'A101': ru('A101.svg'),
    'BORJ': ru('BORJ.svg'),
    'SINARA': ru('SINARA.svg'),
    'VSEH': cur('ru.svg'),
    'SAMOKAT': ru('SAMOKAT.svg'),
    'ROLF': ru('ROLF.svg'),
    'GLORAX': ru('GLORAX.svg'),
    'JOYMONEY': ru('JOYMONEY.svg'),
    'ATON': ru('ATON.png'),
    'BCS': ru('BCS.png'),
    'INGO': ru('INGO.png'),
    'DOHOD': ru('DOHOD.png'),
    'PSB': ru('PSB.png'),
    'SOLID': ru('SOLID.png'),
    'WIM': ru('WIM.png'),
    'GENERAL': ru('GENERAL.png'),
    'APRIORI': ru('APRIORI.png'),
    'PKB': ru('PKB.svg'),
    'SBER': ru('SBRF.svg'), // Share ticker
    'SBERP': ru('SBRF.svg'), // Share ticker
    'SBRF': ru('SBRF.svg'),
    'SBPR': ru('SBRF.svg'), // Sberbank Preferred
    'GAZR': ru('GAZR.svg'),
    'GAZP': ru('GAZR.svg'), // Map GAZP to GAZR icon
    'LKOH': ru('LKOH.svg'),
    'YNDX': ru('YNDX.svg'),
    'YDEX': ru('YNDX.svg'), // New ticker
    'ROSN': ru('ROSN.svg'),
    'NVTK': ru('NVTK.svg'),
    'GMKN': ru('GMKN.svg'),
    'SNGS': ru('SNGS.svg'),
    'SNGP': ru('SNGS.svg'), // Surgutneftegas Preferred
    'SNGR': ru('SNGS.svg'),
    'TATN': ru('TATN.svg'),
    'TATP': ru('TATN.svg'), // Tatneft Preferred
    'PLZL': ru('PLZL.svg'),
    'MGNT': ru('MGNT.svg'),
    'MTSS': ru('MTSS.svg'),
    'NLMK': ru('NLMK.svg'),
    'CHMF': ru('CHMF.svg'),
    'ALRS': ru('ALRS.svg'),
    'OZON': ru('OZON.svg'),
    'VTBR': ru('VTBR.svg'),
    'FIVE': ru('FIVE.svg'),
    'X5': ru('FIVE.svg'),
    'HYDR': ru('HYDR.svg'),
    'IRAO': ru('IRAO.png'),
    'FEES': ru('FEES.ico'),
    'PHOR': ru('PHOR.svg'),
    'PIKK': ru('PIKK.svg'),
    'AFKS': ru('AFKS.svg'),
    'TRNF': ru('TRNF.svg'),
    'TRNFP': ru('TRNF.svg'),
    'AGRO': ru('AGRO.svg'),
    'BANE': ru('BANE.svg'),
    'KMAZ': ru('KMAZ.svg'),
    'SIBN': ru('SIBN.svg'),
    'RKKE': ru('RKKE.svg'),
    'MOEX': ru('MOEX.svg'),
    'RUAL': ru('RUAL.svg'),
    'VKCO': ru('VKCO.svg'),
    'DOMRF': ru('DOMRF.svg'),
    'VEB': ru('VEB.svg'),
    'ROSATOM': ru('ROSATOM.svg'),
    
    // Russian Companies (Favicons saved as PNG)
    'HHRU': ru('HHRU.png'),
    'HEAD': ru('HHRU.png'),
    'BSPB': ru('BSPB.png'),
    'CBOM': ru('CBOM.png'),
    'ENPG': ru('ENPG.png'),
    'ETLN': ru('ETLN.png'),
    'FIXP': ru('FIXP.png'),
    'FLOT': ru('FLOT.png'),
    'LSRG': ru('LSRG.png'),
    'MVID': ru('MVID.png'),
    'OGKB': ru('OGKB.png'),
    'QIWI': ru('QIWI.png'),
    'RASP': ru('RASP.png'),
    'RENI': ru('RENI.png'),
    'RTKM': ru('RTKM.png'),
    'RTKMP': ru('RTKM.png'),
    'SELG': ru('SELG.png'),
    'SGZH': ru('SGZH.png'),
    'SOFL': ru('SOFL.png'),
    'SPBE': ru('SPBE.png'),
    'UPRO': ru('UPRO.png'),
    'VSMO': ru('VSMO.png'),
    'WUSH': ru('WUSH.png'),
    'BELU': ru('BELU.png'),
    'BELUGA': ru('BELU.png'),
    'ASTR': ru('ASTR.png'),
    'POSI': ru('POSI.png'),
    'SVCB': ru('SVCB.png'),
    'UGLD': ru('UGLD.png'),
    'DELI': ru('DELI.png'),
    'DIAS': ru('DIAS.png'),
    'DENUM': ru('DENUM.png'),
    'TALAN': ru('TALAN.png'),
    'PIONEER': ru('PIONEER.png'),
    'SODR': ru('SODR.png'),
    'ASG': ru('ASG.png'),
    'TPLUS': ru('TPLUS.png'),
    'AZOT': ru('AZOT.png'),
    'LOMBARD': ru('LOMBARD.png'),
    'CENTERK': ru('CENTERK.png'),
    'RUSVET': ru('RUSVET.png'),
    'LEAS': ru('LEAS.png'),
    'ABIO': ru('ABIO.png'),
    'AQUA': ru('AQUA.png'),
    'CIAN': ru('CIAN.png'),
    'FESH': ru('FESH.png'),
    'GCHE': ru('GCHE.png'),
    'HNFG': ru('HNFG.png'),
    'KAZT': ru('KAZT.png'),
    'KZOS': ru('KZOS.png'),
    'LENT': ru('LENT.png'),
    'MSRS': ru('MSRS.png'),
    'MSTT': ru('MSTT.png'),
    'MTLR': ru('MTLR.png'),
    'NAUK': ru('NAUK.png'),
    'NKNC': ru('NKNC.png'),
    'NMTP': ru('NMTP.svg'),
    'OKEY': ru('OKEY.png'),
    'ORUP': ru('ORUP.png'),
    'RNFT': ru('RNFT.png'),
    'ROLO': ru('ROLO.png'),
    'SFIN': ru('SFIN.png'),
    'SVAV': ru('SVAV.png'),
    'TGKA': ru('TGKA.png'),
    'TGKB': ru('TGKB.png'),
    'TGKD': ru('TGKD.png'),
    'TMOS': ru('TMOS.png'),
    'TCSG': ru('TCS.svg'),
    'T': ru('TCS.svg'),
    'UNAC': ru('UNAC.png'),
    'VEON': ru('VEON.png'),
    'WTCM': ru('WTCM.png'),
    'YAKG': ru('YAKG.svg'),
    'SMLT': ru('SMLT.png'),
    'ISKJ': ru('ISKJ.png'),
    'MDMG': ru('MDMG.png'),
    'IVAT': ru('IVAT.ico'),
    'AAA': ru('AAA.png'),
    'FINAM': ru('FINAM.png'),
    'AKBARS': ru('AKBARS.png'),
    'FINSTAR': ru('FINSTAR.png'),
    'UKFIRST': ru('UKFIRST.png'),
    'CNRU': ru('CIAN.png'),
    'GLRX': ru('GLORAX.svg'),
    'KAZTP': ru('KAZT.png'),
    'KZOSP': ru('KZOS.png'),
    'MTLRP': ru('MTLR.png'),
    'NKNCP': ru('NKNC.png'),
    'SNGSP': ru('SNGS.svg'),
    'TATNP': ru('TATN.svg'),
    'TGKBP': ru('TGKB.png'),
    'TRMK': ru('TMK.svg'),
    'VEON-RX': ru('VEON.png'),
    'WTCMP': ru('WTCM.png'),
    'BANEP': ru('BANE.svg'),
    'BSPBP': ru('BSPB.png'),
    'FIXR': ru('FIXP.png'),
    'NSVZ': ru('NAUK.png'),
    'OZPH': ru('OZON.svg'),
    'RAGR': ru('AGRO.svg'),
    'UKUZ': ru('MTLR.png'),
    'MBNK': ru('MTSS.svg'),
    'MRKC': ru('FEES.ico'),
    'MRKS': ru('FEES.ico'),
    'MRKV': ru('FEES.ico'),
    'MRKY': ru('FEES.ico'),

    'ZVEZ': ru('ZVEZ.png'),
    'AKRN': ru('AKRN.png'),
    'APRI': ru('APRI.svg'),
    'APTK': ru('APTK.png'),
    'ARSA': ru('ARSA.png'),
    'ASSB': ru('ASSB.png'),
    'AVAN': ru('AVAN.png'),
    'BISVP': ru('BISVP.png'),
    'BLNG': ru('BLNG.png'),
    'BRZL': ru('BRZL.png'),
    'CARM': ru('CARM.png'),
    'CHKZ': ru('CHKZ.png'),
    'CHMK': ru('CHMK.png'),
    'CNTL': ru('CNTL.png'),
    'CNTLP': ru('CNTLP.png'),
    'DATA': ru('DATA.png'),
    'DIOD': ru('DIOD.png'),
    'DVEC': ru('DVEC.png'),
    'GAZA': ru('GAZA.png'),
    'GAZAP': ru('GAZAP.png'),
    'GAZC': ru('GAZC.png'),
    'GAZS': ru('GAZS.png'),
    'GECO': ru('GECO.png'),
    'GEMA': ru('GEMA.png'),
    'GEMC': ru('GEMC.png'),
    'GTRK': ru('GTRK.png'),
    'HIMCP': ru('HIMCP.png'),
    'IGST': ru('IGST.png'),
    'IGSTP': ru('IGSTP.png'),
    'IRKT': ru('IRKT.png'),
    'JNOS': ru('JNOS.png'),
    'JNOSP': ru('JNOSP.png'),
    'KBSB': ru('KBSB.png'),
    'KCHE': ru('KCHE.png'),
    'KCHEP': ru('KCHEP.png'),
    'KGKC': ru('KGKC.png'),
    'KGKCP': ru('KGKCP.png'),
    'KLSB': ru('KLSB.png'),
    'KMEZ': ru('KMEZ.png'),
    'KOGK': ru('KOGK.png'),
    'KRKN': ru('KRKN.png'),
    'KRKNP': ru('KRKNP.png'),
    'KRKOP': ru('KRKOP.png'),
    'KROT': ru('KROT.png'),
    'KROTP': ru('KROTP.png'),
    'KRSB': ru('KRSB.png'),
    'KRSBP': ru('KRSBP.png'),
    'LIFE': ru('LIFE.png'),
    'LNZL': ru('LNZL.png'),
    'LNZLP': ru('LNZLP.png'),
    'LVHK': ru('LVHK.png'),
    'MAGE': ru('MAGE.png'),
    'MAGN': ru('MAGN.png'),
    'MFGS': ru('MFGS.png'),
    'MFGSP': ru('MFGSP.png'),
    'MGKL': ru('MGKL.svg'),
    'MGTS': ru('MGTS.png'),
    'MGTSP': ru('MGTSP.png'),
    'MSNG': ru('MSNG.png'),
    'NFAZ': ru('NFAZ.png'),
    'NKHP': ru('NKHP.png'),
    'NKSH': ru('NKSH.png'),
    'OMZZP': ru('OMZZP.png'),
    'PAZA': ru('PAZA.png'),
    'PMSB': ru('PMSB.png'),
    'PMSBP': ru('PMSBP.png'),
    'PRFN': ru('PRFN.png'),
    'PRMB': ru('PRMB.png'),
    'RBCM': ru('RBCM.png'),
    'RDRB': ru('RDRB.png'),
    'RGSS': ru('RGSS.png'),
    'ROST': ru('ROST.png'),
    'RTGZ': ru('RTGZ.png'),
    'RTSB': ru('RTSB.png'),
    'RUSI': ru('RUSI.png'),
    'RZSB': ru('RZSB.png'),
    'SAGO': ru('SAGO.png'),
    'SAGOP': ru('SAGOP.png'),
    'SARE': ru('SARE.png'),
    'SLEN': ru('SLEN.png'),
    'STSB': ru('STSB.png'),
    'STSBP': ru('STSBP.png'),
    'TASB': ru('TASB.png'),
    'TASBP': ru('TASBP.png'),
    'TGKN': ru('TGKN.png'),
    'TTLK': ru('TTLK.png'),
    'UNKL': ru('UNKL.png'),
    'URKZ': ru('URKZ.png'),
    'UTAR': ru('UTAR.png'),
    'UWGN': ru('UWGN.png'),
    'VJGZ': ru('VJGZ.png'),
    'VJGZP': ru('VJGZP.png'),
    'VRSB': ru('VRSB.png'),
    'VRSBP': ru('VRSBP.png'),
    'VSYD': ru('VSYD.png'),
    'YKEN': ru('YKEN.png'),
    'YKENP': ru('YKENP.png'),
    'YRSB': ru('YRSB.png'),
    'YRSBP': ru('YRSBP.png'),
    'ZAYM': ru('ZAYM.png'),
    'ZILL': ru('ZILL.png'),

    // Foreign Companies
    'AAPL': us('AAPL.svg'),
    'MSFT': us('MSFT.svg'),
    'GOOG': us('GOOG.svg'),
    'GOOGL': us('GOOG.svg'),
    'AMZN': us('AMZN.svg'),
    'TSLA': us('TSLA.svg'),
    'META': us('META.svg'),
    'NFLX': us('NFLX.svg'),
    'NVDA': us('NVDA.svg'),
    'AMD': us('AMD.svg'),
    'INTC': us('INTC.svg'),
    'BABA': cn('BABA.svg'),
    'BIDU': cn('BIDU.svg'),
    'TENCENT': cn('TENCENT.svg'),
    'XIA': cn('XIA.svg'),
    
    // Commodities
    'GOLD': com('GOLD.svg'),
    'GL': com('GOLD.svg'),
    'SILVER': com('SILVER.svg'),
    'PLATINUM': com('PLATINUM.svg'),
    'PALLADIUM': com('PALLADIUM.svg'),
    
    // Currencies
    'Si': cur('us.svg'),
    'Eu': cur('eu.svg'),
    'CNY': cur('cn.svg'),
    'ED': cur('eu.svg'),
    'AED': cur('ae.svg'),
    'AMD_CURRENCY': cur('am.svg'), // Renamed to avoid conflict with AMD stock
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
    'UCNY': cur('cn.svg'),
    'UCHF': cur('ch.svg'),
    'UEUR': cur('eu.svg'),
    'UGBP': cur('gb.svg'),
    'UHKD': cur('hk.svg'),
    'UJPY': cur('jp.svg'),
    'UKZT': cur('kz.svg'),
    'UTRY': cur('tr.svg'),
    'USDRUB': cur('us.svg'),
    'EURRUB': cur('eu.svg'),
    'CNYRUB': cur('cn.svg'),
    'USD000UTSTOM': cur('us.svg'),
    'USD000UTSTOD': cur('us.svg'),
    'EUR_RUB__TOM': cur('eu.svg'),
    'EUR_RUB__TOD': cur('eu.svg'),
    'CNYRUB_TOM': cur('cn.svg'),
    'CNYRUB_TOD': cur('cn.svg'),
    'HKDRUB_TOM': cur('hk.svg'),
    'HKDRUB_TOD': cur('hk.svg'),
    'TRYRUB_TOM': cur('tr.svg'),
    'TRYRUB_TOD': cur('tr.svg'),
    
    // Crypto
    'BTC': cry('BTC.svg'),
    'ETH': cry('ETH.svg'),
    
    // Indices (Flags)
    'BRAZIL': cur('br.svg'),
    'CHINA': cur('cn.svg'),
    'INDIA': cur('in.svg'),
    'SAUDI': cur('sa.svg'),
    
    // Bonds
    'OFZ': cur('ru.svg'),
    'RUS': cur('ru.svg'),
    'BLR': cur('by.svg'),
    'RZD': ru('RZD.svg'),
    'TMK': ru('TMK.svg'),
    'ALFA': ru('ALFA.svg'),
    'POCHTA': ru('POCHTA.svg'),
    'DENUM': ru('DENUM.png'),
    'TALAN': ru('TALAN.png'),
    'PIONEER': ru('PIONEER.png'),
    'SODR': ru('SODR.png'),
    'ASG': ru('ASG.png'),
    'TPLUS': ru('TPLUS.png'),
    'AZOT': ru('AZOT.png'),
    'LOMBARD888': ru('LOMBARD888.png'),
    'CENTERK': ru('CENTERK.png'),
    'GPB': ru('GPB.svg'),
    'RSHB': ru('RSHB.svg'),
    'HENDERSON': ru('HNFG.png'),
    'POLYUS': ru('PLZL.svg'),
    'MTS': ru('MTSS.svg'),
    'DOMRF': ru('DOMRF.svg'),
    'VEB': ru('VEB.svg'),
    'ROSATOM': ru('ROSATOM.svg'),
  };
};

const getIcon = (secid, shortname) => {
  const map = getIconMap();

  // Special handling for AMD (Stock vs Currency)
  // If secid implies currency pair for AMD (Armenian Dram), use currency icon
  if (secid && (secid === 'AMDRUB' || secid === 'AMD_RUB__TOM' || secid === 'AMD_RUB__TOD')) {
    return map['AMD_CURRENCY'];
  }

  // Try to match exact secid first (for shares, currencies, etc.)
  if (secid && map[secid]) {
    return map[secid];
  }

  if (secid && secid.startsWith('BYM')) return map['BLR'];

  // ETF Mappings
  if (secid === 'LQDT') return map['VTBR'];
  if (secid === 'RSHU' || secid === 'ESGR') return map['RSHB'];
  if (secid === 'MKBD' || secid === 'SUGB') return map['CBOM']; // Credit Bank of Moscow
  if (secid === 'TMOS') return map['TCS'];
  if (secid === 'CASH') return map['AAA'];
  if (secid === 'MONY') return map['AKBARS'];
  if (secid === 'FINC') return map['FINSTAR'];
  if (secid === 'FMMM' || secid === 'FMBR') return map['FINAM'];
  
  // Sberbank / UK First ETFs (SB* and others)
  if (secid && (secid.startsWith('SB') && secid !== 'SBER' && secid !== 'SBPR') || ['SCFT', 'SCLI', 'SIPO', 'STME', 'FLOW'].includes(secid)) return map['UKFIRST'];
  
  // Alfa Capital ETFs (AK*) - exclude AKRN (Acron)
  if (secid && secid.startsWith('AK') && secid !== 'AKRN') return map['ALFA'];

  // Tinkoff/T-Capital ETFs
  const tCapitalEtfs = [
    'TBEU', 'TBRU', 'TDIV', 'TEUR', 'TGLD', 'TITR', 'TLCB', 'TMON', 'TOFZ', 
    'TPAY', 'TRND', 'TRUR', 'TUSD', 'TMOS'
  ];
  if (secid && tCapitalEtfs.includes(secid)) return map['TCS'];

  // Aton Management
  if (secid && (secid.startsWith('AM') || secid.startsWith('ATON'))) {
    // Exclude AMD (Armenian Dram and AMD stock)
    if (!secid.startsWith('AMD')) return map['ATON'];
  }

  // BCS
  if (secid && (secid.startsWith('BCS') || ['OBLG', 'OPNB', 'OPNR', 'PRIE', 'VOST'].includes(secid))) return map['BCS'];

  // Ingosstrakh
  if (secid && (secid.startsWith('IN') && secid !== 'INARKT' && secid !== 'INTL')) {
      return map['INGO'];
  }
  if (['YUAN'].includes(secid)) return map['INGO'];
  
  // Dohod
  if (secid && (['DIVD', 'GROD', 'BOND'].includes(secid) || secid.startsWith('BND'))) return map['DOHOD'];

  // PSB (Promsvyazbank)
  if (secid && secid.startsWith('PS')) return map['PSB'];

  // Solid
  if (secid && (['SILA', 'SAFE', 'GOOD', 'SMCF'].includes(secid))) return map['SOLID'];

  // WIM Investments
  if (secid && ['ESGE', 'WILD', 'CNYM', 'EQMX', 'OBLG'].includes(secid)) return map['WIM'];

  // Currencies (by prefix)
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

  if (!shortname) return null;

  const shortnameUpper = shortname.toUpperCase();
  // ... (skipping shortname fallback for now as we primarily want to check secid)
  return null;
};

const reportedFunds = [
  'AMFL', 'AMGB', 'AMGL', 'AMNR', 'AMNY', 'AMRE', 'AMRH',
  'BCSB', 'BCSD', 'BCSE', 'BCSG', 'BCSR', 'BCSW',
  'BNDA', 'BNDB', 'BNDC',
  'BOND', 'CASH', 'CNYM', 'EQMX', 'ESGE',
  'ETF DIVD', 'ETF GROD', 'DIVD', 'GROD',
  'FINC', 'FLOW', 'FMBR', 'FMMM',
  'GOOD', 'INFL', 'INGO'
];

console.log('Checking reported funds:');
reportedFunds.forEach(secid => {
  const icon = getIcon(secid, secid); // using secid as shortname for now
  console.log(`${secid}: ${icon}`);
});
