export const getIcon = (secid, shortname) => {
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

  if (!shortname) return null;
  
  // Extract asset code from shortname (e.g., "SBRF-3.26" -> "SBRF")
  const assetCode = shortname.split('-')[0].toUpperCase();
  
  return map[assetCode] || null;
};

// Helper to generate the map (moved outside to avoid recreation)
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
    'SBER': ru('SBRF.svg'), // Share ticker
    'SBERP': ru('SBRF.svg'), // Share ticker
    'SBRF': ru('SBRF.svg'),
    'SBPR': ru('SBRF.svg'), // Sberbank Preferred
    'GAZR': ru('GAZR.svg'),
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
    'TCSG': ru('TMOS.png'),
    'T': ru('TMOS.png'),
    'UNAC': ru('UNAC.png'),
    'VEON': ru('VEON.png'),
    'WTCM': ru('WTCM.png'),
    'YAKG': ru('YAKG.svg'),
    'SMLT': ru('SMLT.png'),
    'ISKJ': ru('ISKJ.png'),
    'MDMG': ru('MDMG.png'),
    'IVAT': ru('IVAT.ico'),

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
    
    // Currencies
    'Si': cur('us.svg'),
    'Eu': cur('eu.svg'),
    'CNY': cur('cn.svg'),
    'ED': cur('eu.svg'),
    'AED': cur('ae.svg'),
    'AMD_CURRENCY': cur('am.svg'), // Renamed to avoid conflict with AMD stock
    'AUD': cur('au.svg'),
    'AUDU': cur('au.svg'),
    'BYN': cur('by.svg'),
    'CAD': cur('ca.svg'),
    'CHF': cur('ch.svg'),
    'GBP': cur('gb.svg'),
    'HKD': cur('hk.svg'),
    'JPY': cur('jp.svg'),
    'TRY': cur('tr.svg'),
    'KZT': cur('kz.svg'),
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
  };
};

// Export alias for backward compatibility if needed, but we will update usages
export const getFuturesIcon = getIcon;
