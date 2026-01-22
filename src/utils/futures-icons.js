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

  if (secid && secid.startsWith('BYM')) return map['BLR'];

  // Reported missing funds (Explicit checks to ensure coverage)
  if (['AMFL', 'AMGB', 'AMGL', 'AMNR', 'AMNY', 'AMRE', 'AMRH'].includes(secid)) return map['ATON'];
  if (['BCSB', 'BCSD', 'BCSE', 'BCSG', 'BCSR', 'BCSW'].includes(secid)) return map['BCS'];
  if (['BNDA', 'BNDB', 'BNDC', 'BOND', 'DIVD', 'GROD'].includes(secid)) return map['DOHOD'];
  if (['INFL', 'INGO'].includes(secid)) return map['INGO'];
  if (['CASH'].includes(secid)) return map['AAA'];
  if (['CNYM', 'EQMX', 'ESGE', 'WILD', 'OBLG'].includes(secid)) return map['WIM'];
  if (['FINC'].includes(secid)) return map['FINSTAR'];
  if (['FLOW'].includes(secid)) return map['UKFIRST'];
  if (['FMMM', 'FMBR'].includes(secid)) return map['FINAM'];
  if (['GOOD', 'SILA', 'SAFE', 'SMCF'].includes(secid)) return map['SOLID'];

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
  }

  // Futures Prefixes
  if (secid) {
    if (secid.startsWith('AA')) return map['ZAR']; // AFRICA -> South Africa
    if (secid.startsWith('AG')) return map['AGRO'];
    if (secid.startsWith('AN')) return map['ALUMINUM']; // ALUM -> Aluminum
    if (secid.startsWith('BB')) return map['BABA'];
    if (secid.startsWith('BD')) return map['BIDU'];
    if (secid.startsWith('BM')) return map['OIL'];
    if (secid.startsWith('BR')) return map['OIL'];
    if (secid.startsWith('CA')) return map['UCAD']; // UCAD
    if (secid.startsWith('CC')) return map['COCOA'];
    if (secid.startsWith('CE')) return map['COPPER'];
    if (secid.startsWith('CL')) return map['OIL']; // WTI
    if (secid.startsWith('CS')) return map['CONSUMER']; // CNI -> Consumer Index
    if (secid.startsWith('CT')) return map['COTTON']; // Cotton
    if (secid.startsWith('CY')) return map['CNY']; // CNY
    if (secid.startsWith('DJ')) return map['DJ30'];
    if (secid.startsWith('DX')) return map['DAX'];
    if (secid.startsWith('EM')) return map['EM'];
    if (secid.startsWith('ET')) return map['ETH'];
    if (secid.startsWith('Eu')) return map['EU'];
    if (secid.startsWith('FF')) return map['TTF'];
    if (secid.startsWith('FN')) return map['FINANCE']; // FNI -> Finance Index
    if (secid.startsWith('GU')) return map['GBP']; // GU -> GBP/USD
    if (secid.startsWith('HO')) return map['HOME']; // HOME -> Real Estate
    if (secid.startsWith('HS')) return map['HKD']; // Hang Seng -> HK
    if (secid.startsWith('IB')) return map['BTC']; // IBIT -> Bitcoin
    if (secid.startsWith('IMOEXF') || secid.startsWith('MX') || secid.startsWith('MIX')) return map['MOEX']; // IMOEXF/MX -> MOEX Index
    if (secid.startsWith('IP')) return map['IPO']; // IPO -> Startup
    if (secid.startsWith('KC')) return map['COFFEE']; // COFFEE -> Commodity
    if (secid.startsWith('MA')) return map['MINING']; // Metals & Mining Index
    if (secid.startsWith('MM')) return map['MOEX']; // Mini MOEX
    if (secid.startsWith('MN')) return map['MGNT']; // Magnit
    if (secid.startsWith('MT')) return map['MTS']; // MTS
    if (secid.startsWith('MV')) return map['MVID']; // M.Video
    if (secid.startsWith('MY')) return map['MOEX']; // MOEX CNY
    if (secid.startsWith('N2')) return map['JPY']; // Nikkei -> JP
    if (secid.startsWith('NA')) return map['NASDAQ']; // Nasdaq
    if (secid.startsWith('NC')) return map['NICKEL']; // Nickel
    if (secid.startsWith('NG')) return map['NATURAL_GAS']; // Natural Gas
    if (secid.startsWith('NR')) return map['NATURAL_GAS']; // NGM -> Natural Gas
    if (secid.startsWith('NV')) return map['NVTK']; // Novatek
    if (secid.startsWith('OG')) return map['OIL']; // OGI -> Oil & Gas Index
    if (secid.startsWith('OJ')) return map['ORANGE']; // Orange Juice
    if (secid.startsWith('PD')) return map['PALLADIUM']; // Palladium
    if (secid.startsWith('PT')) return map['PLATINUM']; // Platinum
    if (secid.startsWith('PX')) return map['PLZL']; // Polyus
    if (secid.startsWith('R2')) return map['DJ30']; // Russell -> US
    if (secid.startsWith('RB')) return map['OFZ']; // RGBI -> Gov Bonds
    if (secid.startsWith('RG')) return map['OFZ']; // RGBIF -> Gov Bonds
    if (secid.startsWith('RI')) return map['MOEX']; // RTS -> MOEX
    if (secid.startsWith('RM')) return map['MOEX']; // RTS Mini -> MOEX
    if (secid.startsWith('S1')) return map['SILVER']; // Silver Mini
    if (secid.startsWith('SA') || secid.startsWith('SU') || secid.startsWith('Su')) return map['SUGAR']; // Sugar
    if (secid.startsWith('SF')) return map['DJ30']; // SPYF -> US
    if (secid.startsWith('Si')) return map['Si']; // Si -> USDRUB
    if (secid.startsWith('SQ')) return map['SOXQ']; // SOXQ
    if (secid.startsWith('SV')) return map['SILVER']; // Silver
    if (secid.startsWith('SX')) return map['EU']; // STOXX -> EU
    if (secid.startsWith('TL')) return map['TLT']; // TLT -> US Treasury
    if (secid.startsWith('VI')) return map['RVI']; // RVI -> Volatility Index
    if (secid.startsWith('W4') || secid.startsWith('WH')) return map['WHEAT']; // Wheat
    if (secid.startsWith('ZC')) return map['ZINC']; // Zinc

  // Metals
  if (secid.startsWith('GLD') || secid.startsWith('GOLD')) return map['GOLD'];
    if (secid.startsWith('SLV') || secid.startsWith('SILV')) return map['SILVER'];
    if (secid.startsWith('PLT') || secid.startsWith('PLAT')) return map['PLATINUM'];
    if (secid.startsWith('PLD') || secid.startsWith('PALL')) return map['PALLADIUM'];

    // Russian Shares Futures
    if (secid.startsWith('ED')) return map['ED'];
    if (secid.startsWith('GD')) return map['GOLD'];
    if (secid.startsWith('AF')) return map['AFLT'];
    if (secid.startsWith('AL')) return map['ALRS'];
    if (secid.startsWith('CH')) return map['CHMF'];
    if (secid.startsWith('FE')) return map['FEES'];
    if (secid.startsWith('GM')) return map['GMKN'];
    if (secid.startsWith('GZ')) return map['GAZP'];
    if (secid.startsWith('HY')) return map['HYDR'];
    if (secid.startsWith('IR')) return map['IRAO'];
    if (secid.startsWith('LK')) return map['LKOH'];
    if (secid.startsWith('NL')) return map['NLMK'];
    if (secid.startsWith('PH')) return map['PHOR'];
    if (secid.startsWith('RN')) return map['ROSN'];
    if (secid.startsWith('SN')) return map['SNGS'];
    if (secid.startsWith('SR')) return map['SBRF'];
    if (secid.startsWith('TT')) return map['TATN'];
    if (secid.startsWith('VB') || secid.startsWith('VT')) return map['VTBR'];
    if (secid.startsWith('YD') || secid.startsWith('YN')) return map['YNDX'];
  }

  if (!shortname) return null;

  const shortnameUpper = shortname.toUpperCase();

  if (shortnameUpper.startsWith('АЭРОФЛ')) return map['AFLT'];
  if (shortnameUpper.startsWith('СЕГЕЖА')) return map['SGZH'];
  if (shortnameUpper.startsWith('АПРИ')) return map['APRI'];
  if (shortnameUpper.startsWith('МГКЛ') || shortnameUpper.startsWith('МОСГОРЛОМБАРД')) return map['MGKL'];
  if (shortnameUpper.startsWith('ПСБ') || shortnameUpper.startsWith('ПРОМСВЯЗЬБАНК')) return map['PSB'];
  if (shortnameUpper.startsWith('АКРОН')) return map['AKRN'];
  if (shortnameUpper.startsWith('RUS-')) return map['OFZ'];
  if (shortnameUpper.startsWith('АФК СИСТЕМА') || shortnameUpper.startsWith('СИСТЕМА')) return map['AFKS'];
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
  if (shortnameUpper.startsWith('КЛВЗ')) return map['KLVZ'];
  if (shortnameUpper.startsWith('ИНТЛИЗ')) return map['INTLIZ'];
  if (shortnameUpper.startsWith('МЕДСИ')) return map['MEDSI'];
  if (shortnameUpper.startsWith('СТРАНА')) return map['STRANA'];
  if (shortnameUpper.startsWith('АЛЬЯНС')) return map['ALLIANCE'];
  if (shortnameUpper.startsWith('БАЛТЛИЗ')) return map['BALTLIZ'];
  if (shortnameUpper.startsWith('ХАЙТЭК')) return map['HITECH'];
  if (shortnameUpper.startsWith('ПМЕД') || shortnameUpper.startsWith('IПМЕД')) return map['PMED'];
  if (shortnameUpper.startsWith('АКВИЛОН')) return map['AQUILON'];
  if (shortnameUpper.startsWith('ЗАСЛОН')) return map['ZASLON'];
  if (shortnameUpper.startsWith('АЙДИ')) return map['ID'];
  if (shortnameUpper.startsWith('УРАЛСТ')) return map['URALST'];
  if (shortnameUpper.startsWith('SЛЕГЕНД') || shortnameUpper.startsWith('ЛЕГЕНД')) return map['LEGENDA'];
  if (shortnameUpper.startsWith('РСЭКС')) return map['RSEKS'];
  if (shortnameUpper.startsWith('НОВАТЭК')) return map['NVTK'];
  if (shortnameUpper.startsWith('ЭКОНЛИЗ')) return map['ECONLIZ'];
  if (shortnameUpper.startsWith('ЛАЙФСТР')) return map['LIFESTR'];
  if (shortnameUpper.startsWith('СОВКМ')) return map['SVCB'];
  if (shortnameUpper.startsWith('ПЕНСХОЛ')) return map['PENSHOL'];
  if (shortnameUpper.startsWith('ЭЛРЕШ')) return map['ELRESH'];
  if (shortnameUpper.startsWith('УРОЖАЙ')) return map['UROZHAY'];
  if (shortnameUpper.startsWith('ПРАКТЛК')) return map['PRAKTLK'];
  if (shortnameUpper.startsWith('РОЯЛКАП')) return map['ROYALCAP'];
  if (shortnameUpper.startsWith('БСК')) return map['BSK'];
  if (shortnameUpper.startsWith('МИГКР')) return map['MIGKR'];
  if (shortnameUpper.startsWith('КИРИЛЛИЦА')) return map['CYRILLIC'];
  if (shortnameUpper.startsWith('ПИМ')) return map['PIM'];
  if (shortnameUpper.startsWith('ФЭСАГРО')) return map['FESAGRO'];
  if (shortnameUpper.startsWith('НЕОЛИЗИНГ')) return map['NEOLIZ'];
  if (shortnameUpper.startsWith('СЕЛКТ') || shortnameUpper.startsWith('IСЕЛКТ')) return map['SELG'];
  if (shortnameUpper.startsWith('АСВ')) return map['ASV'];
  if (shortnameUpper.startsWith('ГАЗПКАП')) return map['GAZP'];
  if (shortnameUpper.startsWith('ГАЗПНЕФТЬ')) return map['SIBN'];
  if (shortnameUpper.startsWith('РЖД')) return map['RZD'];
  if (shortnameUpper.startsWith('ВЭБ')) return map['VEB'];
  if (shortnameUpper.startsWith('АВТОДОР') || shortnameUpper.startsWith('ГК АВТОДОР')) return map['AVTODOR'];
  if (shortnameUpper.startsWith('ГТЛК')) return map['GTLK'];
  if (shortnameUpper.startsWith('РСНФТ')) return map['ROSN'];
  if (shortnameUpper.startsWith('МАГНИ')) return map['MGNT'];
  if (shortnameUpper.startsWith('ПОЛЮ')) return map['PLZL'];
  if (shortnameUpper.startsWith('ИСТРСЫР')) return map['ISTRSYR'];
  if (shortnameUpper.startsWith('CTRL')) return map['CTRL'];
  if (shortnameUpper.startsWith('ПРКТ')) return map['PRKT'];
  if (shortnameUpper.startsWith('СМАК')) return map['SMAK'];
  if (shortnameUpper.startsWith('ТРДБ')) return map['TRDB'];
  if (shortnameUpper.startsWith('PLAZA')) return map['PLAZA'];
  if (shortnameUpper.startsWith('ГАЗПК')) return map['GAZP'];
  if (shortnameUpper.startsWith('ЯТЭК')) return map['YAKG'];
  if (shortnameUpper.startsWith('ГРУППРО')) return map['GRUPPRO'];
  if (shortnameUpper.startsWith('ДЖИ-ГР') || shortnameUpper.startsWith('ДЖИГР')) return map['GGROUP'];
  if (shortnameUpper.startsWith('ФЕРРУМ')) return map['FERRUM'];
  if (shortnameUpper.startsWith('МАЭСТРО')) return map['MAESTRO'];
  if (shortnameUpper.startsWith('ОХТАГР')) return map['OHTAGR'];
  if (shortnameUpper.startsWith('СИБСТЕК')) return map['SIBSTEK'];
  if (shortnameUpper.startsWith('MTRC')) return map['MTRC'];
  if (shortnameUpper.startsWith('МКЛИЗИНГ')) return map['MKLIZ'];
  if (shortnameUpper.startsWith('МАНИКАП') || shortnameUpper.startsWith('МАНКАП')) return map['MANICAP'];
  if (shortnameUpper.startsWith('РОССЦ')) return map['ROSSC'];
  if (shortnameUpper.startsWith('АЭРФЬЮ')) return map['AERFU'];
  if (shortnameUpper.startsWith('ИЛСБО')) return map['ILSBO'];
  if (shortnameUpper.startsWith('ИНВОБЛ')) return map['INVOBL'];
  if (shortnameUpper.startsWith('МОСМСП')) return map['MOSMSP'];
  if (shortnameUpper.startsWith('РУССОЙЛ')) return map['RUSOIL'];
  if (shortnameUpper.startsWith('АФАНСБО')) return map['AFANASY'];
  if (shortnameUpper.startsWith('ГАЗПН')) return map['SIBN'];
  if (shortnameUpper.startsWith('ИНАРКТ')) return map['AQUA'];
  if (shortnameUpper.startsWith('БОРЖОМИ')) return map['BORJOMI'];
  if (shortnameUpper.startsWith('АВТОДОМ')) return map['AVDOM'];
  if (shortnameUpper.startsWith('СИМПЛ')) return map['SIMPLE'];
  if (shortnameUpper.startsWith('БРУС')) return map['BRUS'];
  if (shortnameUpper.startsWith('ПИР')) return map['PIR'];
  if (shortnameUpper.startsWith('МГОР') || shortnameUpper.startsWith('МОСКВА')) return map['MGOR'];
  if (shortnameUpper.startsWith('ДЖОЙ')) return map['JOYMONEY'];
  if (shortnameUpper.startsWith('УНИТЕЛ')) return map['UNITEL'];
  if (shortnameUpper.startsWith('РЕКОРД')) return map['RECORD'];
  if (shortnameUpper.startsWith('ХРОМОС') || shortnameUpper.startsWith('IХРОМОС')) return map['CHROMOS'];
  if (shortnameUpper.startsWith('СЕРГВ')) return map['SERGV'];
  if (shortnameUpper.startsWith('СИНАРА')) return map['SINARA'];
  if (shortnameUpper.startsWith('ТЕЛХОЛ')) return map['TELHOL'];
  if (shortnameUpper.startsWith('РУМБЕРГ') || shortnameUpper.startsWith('РУМБРГ')) return map['ROOMBERG'];
  if (shortnameUpper.startsWith('АСПЭЙС')) return map['ASPACE'];
  if (shortnameUpper.startsWith('СОЛТОН')) return map['SOLTON'];
  if (shortnameUpper.startsWith('ДАРС')) return map['DARS'];
  if (shortnameUpper.startsWith('ОИЛРЕСУР')) return map['OILRESUR'];
  if (shortnameUpper.startsWith('ЦЕНТРИБ')) return map['CENTRIB'];
  if (shortnameUpper.startsWith('ПКБ') || shortnameUpper.startsWith('ПЕРВОЕ КЛИЕНТСКОЕ') || shortnameUpper.startsWith('ПЕРВОЕ КОЛЛЕКТОРСКОЕ')) return map['PKB'];
  if (shortnameUpper.startsWith('ЮДП')) return map['UDP'];
  if (shortnameUpper.startsWith('ТКБ')) return map['TKB'];
  if (shortnameUpper.startsWith('АРЛИФТ')) return map['ARLIFT'];
  if (shortnameUpper.startsWith('ТАЛК')) return map['TALK'];
  if (shortnameUpper.startsWith('AGROFRGT')) return map['AGROFRGT'];
  if (shortnameUpper.startsWith('ANTERRA')) return map['ANTERRA'];
  if (shortnameUpper.startsWith('ЕСЭГ')) return map['ESEG'];
  if (shortnameUpper.startsWith('ЕВРХОЛ')) return map['EVRHOL'];
  if (shortnameUpper.startsWith('А101')) return map['A101'];
  if (shortnameUpper.startsWith('АФБАНК')) return map['AFBANK'];
  if (shortnameUpper.startsWith('СИБКХП')) return map['SIBKHP'];
  if (shortnameUpper.startsWith('ЕАС')) return map['EAS'];
  if (shortnameUpper.startsWith('РЕСБЕЛ')) return map['BLR'];
  if (shortnameUpper.startsWith('НИЖЕГОРОД')) return map['NIZHEGOROD'];
  if (shortnameUpper.startsWith('КЕАРЛИ')) return map['KEARLI'];
  if (shortnameUpper.startsWith('NSKATD')) return map['NSKATD'];
  if (shortnameUpper.startsWith('БИЗНЕС')) return map['BUSINESS'];
  if (shortnameUpper.startsWith('ПУБ')) return map['PUB'];
  if (shortnameUpper.startsWith('ММЗ')) return map['MMZ'];
  if (shortnameUpper.startsWith('ПОЗИТИВ') || shortnameUpper.startsWith('IПОЗИТИВ')) return map['POSI'];
  if (shortnameUpper.startsWith('МИРРИКО')) return map['MIRRICO'];
  if (shortnameUpper.startsWith('ОМЕГА')) return map['OMEGA'];
  if (shortnameUpper.startsWith('БАЙСЭЛ')) return map['BYCEL'];
  if (shortnameUpper.startsWith('СБ СЕК') || shortnameUpper.startsWith('СБСЕК')) return map['SBSEC'];
  if (shortnameUpper.startsWith('БИАНКА')) return map['BIANKA'];
  if (shortnameUpper.startsWith('СУЛЬФУР')) return map['SULFUR'];
  if (shortnameUpper.startsWith('АЙГЕНИС')) return map['IGENIS'];
  if (shortnameUpper.startsWith('СПЛИТ')) return map['YNDX'];
  if (shortnameUpper.startsWith('МОЭ')) return map['MOE'];
  if (shortnameUpper.startsWith('ЕДА')) return map['EDA'];
  if (shortnameUpper.startsWith('СБКИБ')) return map['SBRF'];
  if (shortnameUpper.startsWith('ЛАЗСИСТ')) return map['LAZSYST'];
  if (shortnameUpper.startsWith('НЭППИ')) return map['NAPPY'];
  if (shortnameUpper.startsWith('ТФИНАНС')) return map['TFINANCE'];
  if (shortnameUpper.startsWith('РОЛЬФ')) return map['ROLF'];
  if (shortnameUpper.startsWith('ВСМИ')) return map['VSMI'];
  if (shortnameUpper.startsWith('МЦП')) return map['MCP'];
  if (shortnameUpper.startsWith('СОЛСАТЛ')) return map['SOLSATL'];
  if (shortnameUpper.startsWith('РСТ')) return map['RST'];
  if (shortnameUpper.startsWith('СКАЗКА')) return map['SKAZKA'];
  if (shortnameUpper.startsWith('ЭКСПО')) return map['EXPO'];
  if (shortnameUpper.startsWith('САМОКАТ')) return map['SAMOKAT'];
  if (shortnameUpper.startsWith('ТЛК')) return map['TLK'];
  if (shortnameUpper.startsWith('ОСТРОВ')) return map['OSTROV'];
  if (shortnameUpper.startsWith('САДКО')) return map['SADKO'];
  if (shortnameUpper.startsWith('R-VISION')) return map['RVISION'];
  if (shortnameUpper.startsWith('ДЕЛЛИЗ')) return map['DELLIZ'];
  if (shortnameUpper.startsWith('SЕВТРАН')) return map['EUTR'];
  if (shortnameUpper.startsWith('SГПБ')) return map['GPB'];
  if (shortnameUpper.startsWith('SМГОР')) return map['SMGOR'];
  if (shortnameUpper.startsWith('SМЕТАЛИ')) return map['SMETALI'];
  if (shortnameUpper.startsWith('МЕТАЛН')) return map['METALN'];
  if (shortnameUpper.startsWith('БСИНАРА')) return map['BSINARA'];
  if (shortnameUpper.startsWith('УЛК')) return map['ULK'];
  if (shortnameUpper.startsWith('АРКТИК')) return map['ARCTIC'];
  if (shortnameUpper.startsWith('РЕСАЛБ')) return map['RESALB'];
  if (shortnameUpper.startsWith('БАНКДОМ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('МЕДСКАН')) return map['MEDSCAN'];
  if (shortnameUpper.startsWith('ЭРФЬЮ') || shortnameUpper.includes('ЭРФЬЮ')) return map['ERF'];
  if (shortnameUpper.startsWith('ССТЕМ')) return map['AFKS'];
  if (shortnameUpper.startsWith('РФ З')) return map['OFZ'];
  if (shortnameUpper.startsWith('ЕВР')) return map['EUTR'];
  if (shortnameUpper.startsWith('ПОЛИП')) return map['POLYP'];
  if (shortnameUpper.startsWith('SГТЛК') || shortnameUpper.startsWith('СГТЛК')) return map['GTLK'];
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
  if (shortnameUpper.startsWith('СЛ ') || shortnameUpper === 'СЛ') return map['SOFL'];
  if (shortnameUpper.startsWith('ФОС')) return map['PHOR'];
  if (shortnameUpper.startsWith('ВУШ') || shortnameUpper.startsWith('IВУШ')) return map['WUSH'];
  if (shortnameUpper.startsWith('ЛУКОЙЛ')) return map['LKOH'];
  if (shortnameUpper.startsWith('ЧЕРКИЗ')) return map['GCHE'];
  if (shortnameUpper.startsWith('СКФ')) return map['FLOT'];
  if (shortnameUpper.startsWith('РКС')) return map['ETLN'];
  if (shortnameUpper.startsWith('СОПФ') || shortnameUpper.startsWith('SСОПФ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('МАГНИТ')) return map['MGNT'];
  if (shortnameUpper.startsWith('ВЫМПЕЛ')) return map['VEON'];
  if (shortnameUpper.startsWith('ТГК-1') || shortnameUpper.startsWith('ТГК1')) return map['TGKA'];
  if (shortnameUpper.startsWith('ГАЗК')) return map['GAZR'];
  if (shortnameUpper.startsWith('ИНТЕРРАО')) return map['IRAO'];
  if (shortnameUpper.startsWith('ТМК') || shortnameUpper.startsWith('ЧТПЗ')) return map['TMK'];
  if (shortnameUpper.startsWith('ГТЛК')) return map['GTLK'];
  if (shortnameUpper.startsWith('ГПБ') || shortnameUpper.startsWith('ГАЗПРОМБ')) return map['GPB'];
  if (shortnameUpper.startsWith('АЛЬФА')) return map['ALFA'];
  if (shortnameUpper.startsWith('ДОМ.РФ') || shortnameUpper.startsWith('ДОМРФ') || shortnameUpper.startsWith('АИЖК') || shortnameUpper.startsWith('ИАДОМ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('ВЭБ.РФ') || shortnameUpper.startsWith('ВЭБ')) return map['VEB'];
  if (shortnameUpper.startsWith('АТОМ')) return map['ROSATOM'];
  if (shortnameUpper.startsWith('РСХБ')) return map['RSHB'];
  if (shortnameUpper.startsWith('ПОЧТА')) return map['POCHTA'];
  if (shortnameUpper.startsWith('ОФЗ')) return map['OFZ'];
  if (shortnameUpper.startsWith('РЖД')) return map['RZD'];
  if (shortnameUpper.startsWith('СУЭК')) return map['SUEK'];
  if (shortnameUpper.startsWith('ГАЗПНФ')) return map['SIBN'];
  if (shortnameUpper.startsWith('ГАЗПРОМК')) return map['GAZR'];
  if (shortnameUpper.startsWith('ОГК-2') || shortnameUpper.startsWith('ОГК2')) return map['OGKB'];
  if (shortnameUpper.startsWith('ТРНФ') || shortnameUpper.startsWith('ТРАНСНФ')) return map['TRNF'];
  if (shortnameUpper.startsWith('BLR-') || shortnameUpper.startsWith('РЕСБЕЛ') || shortnameUpper.startsWith('BYM')) return map['BLR'];

  if (shortnameUpper.startsWith('HENDERSON')) return map['HENDERSON'];
  if (shortnameUpper.startsWith('POLYUS')) return map['POLYUS'];
  if (shortnameUpper.startsWith('MT_FREE')) return map['MTS'];
  if (shortnameUpper.startsWith('МТС')) return map['MTS'];
  if (shortnameUpper.startsWith('SELGOLD')) return map['SELG'];
  if (shortnameUpper.startsWith('SUEK')) return map['SUEK'];
  if (shortnameUpper.startsWith('TCS')) return map['TCS'];
  if (shortnameUpper.startsWith('GTLK')) return map['GTLK'];
  if (shortnameUpper.startsWith('EUTR') || shortnameUpper.startsWith('EUROTRANS') || shortnameUpper.startsWith('ЕВРОТРАНС')) return map['EUTR'];
  if (shortnameUpper.startsWith('СБЕР') || shortnameUpper.startsWith('SBER') || shortnameUpper.startsWith('СБСЕКР') || shortnameUpper.startsWith('СБЕ')) return map['SBRF'];
  if (shortnameUpper.startsWith('ВТБ')) return map['VTBR'];
  if (shortnameUpper.startsWith('КАМАЗ')) return map['KMAZ'];
  if (shortnameUpper.startsWith('БАШНФТ')) return map['BANE'];
  if (shortnameUpper.startsWith('СИСТЕМА') || shortnameUpper.startsWith('АФК СИСТЕМА') || shortnameUpper.startsWith('СИСТЕМ')) return map['AFKS'];
  if (shortnameUpper.startsWith('SИАДОМ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('SВЭБ')) return map['VEB'];
  if (shortnameUpper.startsWith('CIB')) return map['SBER'];
  if (shortnameUpper.startsWith('ГАЗКЗ')) return map['GAZR'];
  if (shortnameUpper.startsWith('РОСНЕФТЬ') || shortnameUpper.startsWith('РОСНФТ')) return map['ROSN'];
  if (shortnameUpper.startsWith('МЭЙЛ')) return map['VKCO'];
  if (shortnameUpper.startsWith('АТОМЭН') || shortnameUpper.startsWith('SАТОМЭН') || shortnameUpper.startsWith('SАТОМ')) return map['ROSATOM'];
  if (shortnameUpper.startsWith('ЭТАЛ')) return map['ETLN'];
  if (shortnameUpper.startsWith('РУСАЛ') || shortnameUpper.startsWith('РСАЛ')) return map['RUAL'];
  if (shortnameUpper.startsWith('МОСТРЕСТ')) return map['MSTT'];
  if (shortnameUpper.startsWith('РОСТЕЛ')) return map['RTKM'];
  if (shortnameUpper.startsWith('РЕСО')) return map['RENI'];
  if (shortnameUpper.startsWith('ЧТПЗ')) return map['TMK'];
  if (shortnameUpper.startsWith('ДОМ') || shortnameUpper.startsWith('ИА ДОМ') || shortnameUpper.startsWith('ИАДОМ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('МОСКРЕД') || shortnameUpper.startsWith('МКБ')) return map['CBOM'];
  if (shortnameUpper.startsWith('НКНХ')) return map['NKNC'];
  if (shortnameUpper.startsWith('СЕВЕРСТ')) return map['CHMF'];
  if (shortnameUpper.startsWith('ФПК')) return map['RZD'];
  if (shortnameUpper.startsWith('R-VISION') || shortnameUpper.startsWith('Р-ВИЖН') || shortnameUpper.startsWith('R-VIS')) return map['RVIS'];
  if (shortnameUpper.startsWith('КАЗАХСТ')) return map['KZT']; // Use BLR/Foreign icon or KZT? KZT is currency icon. BLR maps to by.svg. Maybe map to KZ flag if available? I have KZT -> kz.svg.
  if (shortnameUpper.startsWith('IMT_FREE')) return map['MTS'];
  if (shortnameUpper.startsWith('СПЛИТ')) return map['YNDX'];
  if (shortnameUpper.startsWith('ДЕНУМ')) return map['DENUM'];
  if (shortnameUpper.startsWith('ТАЛАН')) return map['TALAN'];
  if (shortnameUpper.startsWith('ПИОНЕР')) return map['PIONEER'];
  if (shortnameUpper.startsWith('СОДРУЖ')) return map['SODR'];
  if (shortnameUpper.startsWith('АСГ')) return map['ASG'];
  if (shortnameUpper.startsWith('ТПЛЮС')) return map['TPLUS'];
  if (shortnameUpper.startsWith('ГК АЗОТ') || shortnameUpper.startsWith('АЗОТ')) return map['AZOT'];
  if (shortnameUpper.startsWith('ЛОМБАРД')) return map['LOMBARD'];
  if (shortnameUpper.startsWith('ЦЕНТР-К')) return map['CENTERK'];
  if (shortnameUpper.startsWith('ДЕНУМ')) return map['DENUM'];
  if (shortnameUpper.startsWith('ТАЛАН')) return map['TALAN'];
  if (shortnameUpper.startsWith('АСГТРАФО')) return map['ASG'];
  if (shortnameUpper.startsWith('ТПЛЮС')) return map['TPLUS'];
  if (shortnameUpper.startsWith('ГКАЗОТ')) return map['AZOT'];
  if (shortnameUpper.startsWith('ЛМБРД888') || shortnameUpper.startsWith('ЛОМБАРД888')) return map['LOMBARD888'];
  if (shortnameUpper.startsWith('РС БО') || shortnameUpper.startsWith('РУССКИЙ СВЕТ')) return map['RUSVET'];
  
  if (shortnameUpper.startsWith('SСОЦ.РАЗ') || shortnameUpper.startsWith('ССОЦ.РАЗ')) return map['SOCR'];
  if (shortnameUpper.startsWith('SТКК') || shortnameUpper.startsWith('СТКК')) return map['TKK'];
  if (shortnameUpper.startsWith('A101') || shortnameUpper.startsWith('А101')) return map['A101'];
  if (shortnameUpper.startsWith('АБЗ-1')) return map['ABZ'];
  if (shortnameUpper.startsWith('АВТОБФ')) return map['AVBN'];
  if (shortnameUpper.startsWith('АВТОДОМ')) return map['AVDOM'];

  
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
    'BABA': cn('BABA.svg'),
    'BIDU': cn('BIDU.svg'),
    'OIL': com('OIL.svg'),
    'ALUMINUM': com('ALUMINUM.svg'),
    'COCOA': com('COCOA.svg'),
    'COPPER': com('COPPER.svg'),
    'TTF': com('TTF.svg'),
    'DJ30': cur('us.svg'),
    'DAX': cur('de.svg'),
    'EM': us('EM.svg'),
    'ETH': cry('ETH.svg'),
    'EU': cur('eu.svg'),
    'UCAD': cur('ca.svg'),
    'HOME': ru('HOME.svg'),
    'COFFEE': com('COFFEE.svg'),
    'MINING': ru('MINING.svg'),
    'NASDAQ': us('NASDAQ.svg'),
    'NICKEL': com('NICKEL.svg'),
    'OFZ': cur('ru.svg'),
    'BLR': cur('by.svg'),
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
    'BRUS': ru('BRUS.svg'),
    'BORJ': ru('BORJ.svg'),
    'SINARA': ru('SINARA.svg'),
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
    'COTTON': com('COTTON.svg'),
    'GAZP': ru('GAZR.svg'),
    'GAZPF': ru('GAZR.svg'),
    'GOLD': com('GOLD.svg'),
    'GL': com('GOLD.svg'),
    'GD': com('GOLD.svg'), // Gold Future prefix
    'SILVER': com('SILVER.svg'),
    'SLV': com('SILVER.svg'),
    'SILV': com('SILVER.svg'),
    'PLATINUM': com('PLATINUM.svg'),
    'PLT': com('PLATINUM.svg'),
    'PLAT': com('PLATINUM.svg'),
    'PALLADIUM': com('PALLADIUM.svg'),
    'PLD': com('PALLADIUM.svg'),
    'PALL': com('PALLADIUM.svg'),
    'NATURAL_GAS': com('NATURAL_GAS.svg'),
    'NG': com('NATURAL_GAS.svg'),
    'NR': com('NATURAL_GAS.svg'),
    'ORANGE': com('ORANGE.svg'),
    'SUGAR': com('SUGAR.svg'),
    'SOXQ': us('SOXQ.svg'),
    'TLT': cur('us.svg'), // Using US flag for Treasury Bonds
    'WHEAT': com('WHEAT.svg'),
    'ZINC': com('ZINC.svg'),
    'ZC': com('ZINC.svg'),
    'ALUMINUM': com('ALUMINUM.svg'),
    'AN': com('ALUMINUM.svg'),
    'COPPER': com('COPPER.svg'),
    'CE': com('COPPER.svg'),
    'Co': com('COPPER.svg'),
    'NICKEL': com('NICKEL.svg'),
    'NC': com('NICKEL.svg'),
    'Ni': com('NICKEL.svg'),
    'OIL': com('OIL.svg'),
    'BR': com('OIL.svg'),
    'BM': com('OIL.svg'),
    'CL': com('OIL.svg'), // WTI
    'RVI': ru('RVI.svg'),
    
    // Currencies
    'SI': cur('us.svg'), // Si -> SI (uppercase)
    'EU': cur('eu.svg'), // Eu -> EU (uppercase)
    'CY': cur('cn.svg'), // CNY Future
    'CNYRUB': cur('cn.svg'),
    'CNY': cur('cn.svg'),
    'Si': cur('us.svg'),
    'Eu': cur('eu.svg'),
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
    'BLR': cur('by.svg'),
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
    'APRI': ru('APRI.svg'),
    'RZD': ru('rzd.svg'),
    'VEB': ru('veb.svg'),
    'AVTODOR': ru('avtodor.svg'),

  };
};

