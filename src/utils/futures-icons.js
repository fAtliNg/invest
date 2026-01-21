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

  // ETF Mappings
  if (secid === 'LQDT') return map['VTBR'];
  if (secid === 'RSHU') return map['RSHB'];
  if (secid === 'MKBD' || secid === 'SUGB') return map['CBOM']; // Credit Bank of Moscow
  if (secid === 'TMOS') return map['TCS'];
  if (secid === 'CASH') return map['AAA'];
  if (secid === 'MONY') return map['AKBARS'];
  if (secid === 'FINC') return map['FINSTAR'];
  if (secid === 'FMMM' || secid === 'FMBR') return map['FINAM'];
  
  // Sberbank / UK First ETFs (SB* and others)
  if (secid && (secid.startsWith('SB') && secid !== 'SBER' && secid !== 'SBPR') || ['SCFT', 'SCLI', 'SIPO', 'STME'].includes(secid)) return map['UKFIRST'];
  
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
  if (shortnameUpper.startsWith('КЛВЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ИНТЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('МЕДСИ')) return map['RUS'];
  if (shortnameUpper.startsWith('СТРАНА')) return map['RUS'];
  if (shortnameUpper.startsWith('АЛЬЯНС')) return map['RUS'];
  if (shortnameUpper.startsWith('БАЛТЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ХАЙТЭК')) return map['RUS'];
  if (shortnameUpper.startsWith('ПМЕД') || shortnameUpper.startsWith('IПМЕД')) return map['RUS'];
  if (shortnameUpper.startsWith('АКВИЛОН')) return map['RUS'];
  if (shortnameUpper.startsWith('ЗАСЛОН')) return map['RUS'];
  if (shortnameUpper.startsWith('АЙДИ')) return map['RUS'];
  if (shortnameUpper.startsWith('УРАЛСТ')) return map['RUS'];
  if (shortnameUpper.startsWith('SЛЕГЕНД') || shortnameUpper.startsWith('ЛЕГЕНД')) return map['RUS'];
  if (shortnameUpper.startsWith('РСЭКС')) return map['RUS'];
  if (shortnameUpper.startsWith('НОВАТЭК')) return map['NVTK'];
  if (shortnameUpper.startsWith('ЭКОНЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЛАЙФСТР')) return map['RUS'];
  if (shortnameUpper.startsWith('СОВКМ')) return map['SVCB'];
  if (shortnameUpper.startsWith('ПЕНСХОЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭЛРЕШ')) return map['RUS'];
  if (shortnameUpper.startsWith('УРОЖАЙ')) return map['RUS'];
  if (shortnameUpper.startsWith('ПРАКТЛК')) return map['RUS'];
  if (shortnameUpper.startsWith('РОЯЛКАП')) return map['RUS'];
  if (shortnameUpper.startsWith('БСК')) return map['RUS'];
  if (shortnameUpper.startsWith('МИГКР')) return map['RUS'];
  if (shortnameUpper.startsWith('КИРИЛЛИЦА')) return map['RUS'];
  if (shortnameUpper.startsWith('ПИМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ФЭСАГРО')) return map['RUS'];
  if (shortnameUpper.startsWith('НЕОЛИЗИНГ')) return map['RUS'];
  if (shortnameUpper.startsWith('СЕЛКТ') || shortnameUpper.startsWith('IСЕЛКТ')) return map['SELG'];
  if (shortnameUpper.startsWith('АСВ')) return map['RUS'];
  if (shortnameUpper.startsWith('ГАЗПКАП')) return map['GAZP'];
  if (shortnameUpper.startsWith('ГАЗПНЕФТЬ')) return map['SIBN'];
  if (shortnameUpper.startsWith('ГТЛК')) return map['GTLK'];
  if (shortnameUpper.startsWith('РСНФТ')) return map['ROSN'];
  if (shortnameUpper.startsWith('МАГНИ')) return map['MGNT'];
  if (shortnameUpper.startsWith('ПОЛЮ')) return map['PLZL'];
  if (shortnameUpper.startsWith('ИСТРСЫР')) return map['RUS'];
  if (shortnameUpper.startsWith('CTRL')) return map['RUS'];
  if (shortnameUpper.startsWith('ПРКТ')) return map['RUS'];
  if (shortnameUpper.startsWith('СМАК')) return map['RUS'];
  if (shortnameUpper.startsWith('ТРДБ')) return map['RUS'];
  if (shortnameUpper.startsWith('PLAZA')) return map['RUS'];
  if (shortnameUpper.startsWith('ГАЗПК')) return map['GAZP'];
  if (shortnameUpper.startsWith('ЯТЭК')) return map['YAKG'];
  if (shortnameUpper.startsWith('ГРУППРО')) return map['RUS'];
  if (shortnameUpper.startsWith('ДЖИ-ГР') || shortnameUpper.startsWith('ДЖИГР')) return map['RUS'];
  if (shortnameUpper.startsWith('ФЕРРУМ')) return map['RUS'];
  if (shortnameUpper.startsWith('МАЭСТРО')) return map['RUS'];
  if (shortnameUpper.startsWith('ОХТАГР')) return map['RUS'];
  if (shortnameUpper.startsWith('СИБСТЕК')) return map['RUS'];
  if (shortnameUpper.startsWith('MTRC')) return map['RUS'];
  if (shortnameUpper.startsWith('МКЛИЗИНГ')) return map['RUS'];
  if (shortnameUpper.startsWith('МАНИКАП') || shortnameUpper.startsWith('МАНКАП')) return map['RUS'];
  if (shortnameUpper.startsWith('РОССЦ')) return map['RUS'];
  if (shortnameUpper.startsWith('АЭРФЬЮ')) return map['RUS'];
  if (shortnameUpper.startsWith('ИЛСБО')) return map['RUS'];
  if (shortnameUpper.startsWith('ИНВОБЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('МОСМСП')) return map['RUS'];
  if (shortnameUpper.startsWith('РУССОЙЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('АФАНСБО')) return map['RUS'];
  if (shortnameUpper.startsWith('ГАЗПН')) return map['SIBN'];
  if (shortnameUpper.startsWith('ИНАРКТ')) return map['AQUA'];
  if (shortnameUpper.startsWith('БОРЖОМИ')) return map['RUS'];
  if (shortnameUpper.startsWith('АВТОДОМ')) return map['RUS'];
  if (shortnameUpper.startsWith('СИМПЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('БРУС')) return map['RUS'];
  if (shortnameUpper.startsWith('ПИР')) return map['RUS'];
  if (shortnameUpper.startsWith('МГОР') || shortnameUpper.startsWith('МОСКВА')) return map['RUS'];
  if (shortnameUpper.startsWith('ДЖОЙ')) return map['JOYMONEY'];
  if (shortnameUpper.startsWith('УНИТЕЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('РЕКОРД')) return map['RUS'];
  if (shortnameUpper.startsWith('ХРОМОС') || shortnameUpper.startsWith('IХРОМОС')) return map['RUS'];
  if (shortnameUpper.startsWith('СЕРГВ')) return map['RUS'];
  if (shortnameUpper.startsWith('СИНАРА')) return map['SINARA'];
  if (shortnameUpper.startsWith('ТЕЛХОЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('РУМБЕРГ') || shortnameUpper.startsWith('РУМБРГ')) return map['RUS'];
  if (shortnameUpper.startsWith('АСПЭЙС')) return map['RUS'];
  if (shortnameUpper.startsWith('СОЛТОН')) return map['RUS'];
  if (shortnameUpper.startsWith('ДАРС')) return map['RUS'];
  if (shortnameUpper.startsWith('ОИЛРЕСУР')) return map['RUS'];
  if (shortnameUpper.startsWith('ЦЕНТРИБ')) return map['RUS'];
  if (shortnameUpper.startsWith('ПКБ') || shortnameUpper.startsWith('ПЕРВОЕ КЛИЕНТСКОЕ') || shortnameUpper.startsWith('ПЕРВОЕ КОЛЛЕКТОРСКОЕ')) return map['PKB'];
  if (shortnameUpper.startsWith('ЮДП')) return map['RUS'];
  if (shortnameUpper.startsWith('ТКБ')) return map['RUS'];
  if (shortnameUpper.startsWith('АРЛИФТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ТАЛК')) return map['RUS'];
  if (shortnameUpper.startsWith('AGROFRGT')) return map['RUS'];
  if (shortnameUpper.startsWith('ANTERRA')) return map['RUS'];
  if (shortnameUpper.startsWith('ЕСЭГ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЕВРХОЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('А101')) return map['A101'];
  if (shortnameUpper.startsWith('АФБАНК')) return map['RUS'];
  if (shortnameUpper.startsWith('СИБКХП')) return map['RUS'];
  if (shortnameUpper.startsWith('ЕАС')) return map['RUS'];
  if (shortnameUpper.startsWith('РЕСБЕЛ')) return map['BLR'];
  if (shortnameUpper.startsWith('НИЖЕГОРОД')) return map['RUS'];
  if (shortnameUpper.startsWith('КЕАРЛИ')) return map['RUS'];
  if (shortnameUpper.startsWith('NSKATD')) return map['RUS'];
  if (shortnameUpper.startsWith('БИЗНЕС')) return map['RUS'];
  if (shortnameUpper.startsWith('ПУБ')) return map['RUS'];
  if (shortnameUpper.startsWith('ММЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ПОЗИТИВ') || shortnameUpper.startsWith('IПОЗИТИВ')) return map['POSI'];
  if (shortnameUpper.startsWith('МИРРИКО')) return map['RUS'];
  if (shortnameUpper.startsWith('ОМЕГА')) return map['RUS'];
  if (shortnameUpper.startsWith('БАЙСЭЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('СБ СЕК') || shortnameUpper.startsWith('СБСЕК')) return map['RUS'];
  if (shortnameUpper.startsWith('БИАНКА')) return map['RUS'];
  if (shortnameUpper.startsWith('СУЛЬФУР')) return map['RUS'];
  if (shortnameUpper.startsWith('АЙГЕНИС')) return map['RUS'];
  if (shortnameUpper.startsWith('СПЛИТ')) return map['YNDX'];
  if (shortnameUpper.startsWith('МОЭ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЕДА')) return map['RUS'];
  if (shortnameUpper.startsWith('СБКИБ')) return map['SBRF'];
  if (shortnameUpper.startsWith('ЛАЗСИСТ')) return map['RUS'];
  if (shortnameUpper.startsWith('НЭППИ')) return map['RUS'];
  if (shortnameUpper.startsWith('ТФИНАНС')) return map['RUS'];
  if (shortnameUpper.startsWith('РОЛЬФ')) return map['ROLF'];
  if (shortnameUpper.startsWith('ВСМИ')) return map['RUS'];
  if (shortnameUpper.startsWith('МЦП')) return map['RUS'];
  if (shortnameUpper.startsWith('СОЛСАТЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('РСТ')) return map['RUS'];
  if (shortnameUpper.startsWith('СКАЗКА')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭКСПО')) return map['RUS'];
  if (shortnameUpper.startsWith('САМОКАТ')) return map['SAMOKAT'];
  if (shortnameUpper.startsWith('ТЛК')) return map['RUS'];
  if (shortnameUpper.startsWith('ОСТРОВ')) return map['RUS'];
  if (shortnameUpper.startsWith('САДКО')) return map['RUS'];
  if (shortnameUpper.startsWith('R-VISION')) return map['RUS'];
  if (shortnameUpper.startsWith('ДЕЛЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('SЕВТРАН')) return map['EUTR'];
  if (shortnameUpper.startsWith('SГПБ')) return map['GPB'];
  if (shortnameUpper.startsWith('SМГОР')) return map['RUS'];
  if (shortnameUpper.startsWith('SМЕТАЛИ')) return map['RUS'];
  if (shortnameUpper.startsWith('МЕТАЛН')) return map['RUS'];
  if (shortnameUpper.startsWith('БСИНАРА')) return map['RUS'];
  if (shortnameUpper.startsWith('УЛК')) return map['RUS'];
  if (shortnameUpper.startsWith('АРКТИК')) return map['RUS'];
  if (shortnameUpper.startsWith('РЕСАЛБ')) return map['RUS'];
  if (shortnameUpper.startsWith('БАНКДОМ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('МЕДСКАН')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭРФЬЮ') || shortnameUpper.includes('ЭРФЬЮ')) return map['RUS'];
  if (shortnameUpper.startsWith('ССТЕМ')) return map['AFKS'];
  if (shortnameUpper.startsWith('РФ З')) return map['OFZ'];
  if (shortnameUpper.startsWith('ЕВР')) return map['EUTR'];
  if (shortnameUpper.startsWith('ПОЛИП')) return map['RUS'];
  if (shortnameUpper.startsWith('SГТЛК')) return map['GTLK'];
  if (shortnameUpper.startsWith('УРАЛКУЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('АБРАУ')) return map['SVAV'];
  if (shortnameUpper.startsWith('МЕТИН')) return map['RUS'];
  if (shortnameUpper.startsWith('IЭДЬЮКЕЙШН')) return map['RUS'];
  if (shortnameUpper.startsWith('СКСЛОМБ')) return map['RUS'];
  if (shortnameUpper.startsWith('ИА ТБ')) return map['RUS'];
  if (shortnameUpper.startsWith('УПТК')) return map['RUS'];
  if (shortnameUpper.startsWith('СЛАВЭК')) return map['RUS'];
  if (shortnameUpper.startsWith('АЛФФБ')) return map['ALFA'];
  if (shortnameUpper.startsWith('Л-СТАРТ')) return map['RUS'];
  if (shortnameUpper.startsWith('РОСИНТЕР')) return map['RUS'];
  if (shortnameUpper.startsWith('IАЙДЕКО')) return map['RUS'];
  if (shortnameUpper.startsWith('ЮСВ')) return map['RUS'];
  if (shortnameUpper.startsWith('КВАЗАРЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('ГЛАНИТ')) return map['RUS'];
  if (shortnameUpper.startsWith('БАШКРТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ГЛАВСНАБ')) return map['RUS'];
  if (shortnameUpper.startsWith('ИНТЕЛК')) return map['RUS'];
  if (shortnameUpper.startsWith('ФЕРА')) return map['RUS'];
  if (shortnameUpper.startsWith('АГРОЭКО')) return map['RUS'];
  if (shortnameUpper.startsWith('РОССИЯ')) return map['RUS'];
  if (shortnameUpper.startsWith('МАЭСТР')) return map['RUS'];
  if (shortnameUpper.startsWith('ПГК')) return map['RUS'];
  if (shortnameUpper.startsWith('БУСТЕР')) return map['RUS'];
  if (shortnameUpper.startsWith('МЕГАФН')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭЛМЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ГТЕК')) return map['RUS'];
  if (shortnameUpper.startsWith('ЮУЛЦ')) return map['RUS'];
  if (shortnameUpper.startsWith('СТАНКОМАШ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭЛЬТОН')) return map['RUS'];
  if (shortnameUpper.startsWith('ВЕКУС')) return map['RUS'];
  if (shortnameUpper.startsWith('ПЭТ')) return map['RUS'];
  if (shortnameUpper.startsWith('СЕЛОЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('УРСБ')) return map['RUS'];
  if (shortnameUpper.startsWith('ВОСТКОЙЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('МКАОВОКС')) return map['RUS'];
  if (shortnameUpper.startsWith('ДИНТЕГ')) return map['RUS'];
  if (shortnameUpper.startsWith('СТРОЙДОР')) return map['RUS'];
  if (shortnameUpper.startsWith('ТОМОБ')) return map['RUS'];
  if (shortnameUpper.startsWith('АДВТРАК')) return map['RUS'];
  if (shortnameUpper.startsWith('ФИНЭКВА')) return map['RUS'];
  if (shortnameUpper.startsWith('ДФЮГР')) return map['RUS'];
  if (shortnameUpper.startsWith('РЕСТОР')) return map['RUS'];
  if (shortnameUpper.startsWith('ЯНАО')) return map['RUS'];
  if (shortnameUpper.startsWith('SСИСТЕМ')) return map['AFKS'];
  if (shortnameUpper.startsWith('ЗОНЛАЙН')) return map['RUS'];
  if (shortnameUpper.startsWith('ЗООПТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ТАЛЬВЕН')) return map['RUS'];
  if (shortnameUpper.startsWith('СОВКОКАП')) return map['SVCB'];
  if (shortnameUpper.startsWith('ЭЛТЕРА')) return map['RUS'];
  if (shortnameUpper.startsWith('КОРПСАН')) return map['RUS'];
  if (shortnameUpper.startsWith('ДЖЕТЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('АЛРОСА') || shortnameUpper.startsWith('АЛРОC')) return map['ALRS'];
  if (shortnameUpper.startsWith('РСЭ')) return map['RUS'];
  if (shortnameUpper.startsWith('СИСТЕМ')) return map['AFKS'];
  if (shortnameUpper.startsWith('МАНКАП')) return map['RUS'];
  if (shortnameUpper.startsWith('ТРАНСМ')) return map['RUS'];
  if (shortnameUpper.startsWith('РУБЕЖ')) return map['RUS'];
  if (shortnameUpper.startsWith('ГЛОРАКС')) return map['GLORAX'];
  if (shortnameUpper.startsWith('ЕВТРАН') || shortnameUpper.startsWith('ЕВТРНС') || shortnameUpper.startsWith('SЕВТРАН') || shortnameUpper.startsWith('SЕВТРНС')) return map['EUTR'];
  if (shortnameUpper.startsWith('РАТ')) return map['RUS'];
  if (shortnameUpper.startsWith('СЛДК')) return map['RUS'];
  if (shortnameUpper.startsWith('ВЕРАТЕК')) return map['RUS'];
  if (shortnameUpper.startsWith('АНТЕРРА')) return map['RUS'];
  if (shortnameUpper.startsWith('АГРОДОМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ТРАНСКО')) return map['RUS'];
  if (shortnameUpper.startsWith('АСПЭК')) return map['RUS'];
  if (shortnameUpper.startsWith('РФ ЗО')) return map['OFZ'];
  if (shortnameUpper.startsWith('АМУР')) return map['RUS'];
  if (shortnameUpper.startsWith('SELSILV')) return map['SELG'];
  if (shortnameUpper.startsWith('АСАЧА')) return map['RUS'];
  if (shortnameUpper.startsWith('ВОКСИС')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭТС')) return map['RUS'];
  if (shortnameUpper.startsWith('ПОЛИПЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('МИРАТ')) return map['RUS'];
  if (shortnameUpper.startsWith('НОВТЕХ')) return map['RUS'];
  if (shortnameUpper.startsWith('КОКС')) return map['RUS'];
  if (shortnameUpper.startsWith('ОИЛРЕС')) return map['RUS'];
  if (shortnameUpper.startsWith('ЛКХ')) return map['RUS'];
  if (shortnameUpper.startsWith('СБCIB') || shortnameUpper.startsWith('СБ CIB')) return map['SBRF'];
  if (shortnameUpper.startsWith('РДВ')) return map['RUS'];
  if (shortnameUpper.startsWith('ССЕКЬЮР')) return map['RUS'];
  if (shortnameUpper.startsWith('УРКАП')) return map['RUS'];
  if (shortnameUpper.startsWith('МАНИМЕН')) return map['RUS'];
  if (shortnameUpper.startsWith('ОРГАНИК')) return map['RUS'];
  if (shortnameUpper.startsWith('ЮГК')) return map['UGLD'];
  if (shortnameUpper.startsWith('ПАТРИОТ')) return map['RUS'];
  if (shortnameUpper.startsWith('БАРРЕЛЬ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭФФТЕХ')) return map['RUS'];
  if (shortnameUpper.startsWith('РСГ')) return map['RUS'];
  if (shortnameUpper.startsWith('ИЭК')) return map['RUS'];
  if (shortnameUpper.startsWith('ДЕЛПОРТ')) return map['RUS'];
  if (shortnameUpper.startsWith('АГРОUSD')) return map['AGRO'];
  if (shortnameUpper.startsWith('ИПС')) return map['RUS'];
  if (shortnameUpper.startsWith('ДЕВАР')) return map['RUS'];
  if (shortnameUpper.startsWith('ТЕХНЛГ')) return map['RUS'];
  if (shortnameUpper.startsWith('БИОВИТ')) return map['RUS'];
  if (shortnameUpper.startsWith('СЗА')) return map['RUS'];
  if (shortnameUpper.startsWith('ТБ-')) return map['TCS'];
  if (shortnameUpper.startsWith('СГ РУС')) return map['RUS'];
  if (shortnameUpper.startsWith('ИНТЕРСК')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭНПЛГ')) return map['ENPG'];
  if (shortnameUpper.startsWith('СПЕКТР')) return map['RUS'];
  if (shortnameUpper.startsWith('ФЛИТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ИНВКЦ')) return map['RUS'];
  if (shortnameUpper.startsWith('НПАК')) return map['RUS'];
  if (shortnameUpper.startsWith('ВИЛЛИН')) return map['RUS'];
  if (shortnameUpper.startsWith('АВТОМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ВЗВТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ВСИНСТР')) return map['VSEH'];
  if (shortnameUpper.startsWith('СКЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('АФБАНК')) return map['RUS'];
  if (shortnameUpper.startsWith('СИБКХП')) return map['RUS'];
  if (shortnameUpper.startsWith('ЕАС')) return map['RUS'];
  if (shortnameUpper.startsWith('ИНТЕРСКОЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('СЛ ') || shortnameUpper === 'СЛ') return map['SOFL'];
  if (shortnameUpper.startsWith('КАРРУС') || shortnameUpper.startsWith('IКАРРУС')) return map['RUS'];
  if (shortnameUpper.startsWith('СОБИЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('УЛЬТРА')) return map['RUS'];
  if (shortnameUpper.startsWith('СЕЛЛСЕРВ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЛАЙМ')) return map['RUS'];
  if (shortnameUpper.startsWith('СМАРТ')) return map['RUS'];
  if (shortnameUpper.startsWith('РЕДСОФТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ФОРДЕВИНД')) return map['RUS'];
  if (shortnameUpper.startsWith('КИФА')) return map['RUS'];
  if (shortnameUpper.startsWith('МИКРАН')) return map['RUS'];
  if (shortnameUpper.startsWith('СПМК')) return map['RUS'];
  if (shortnameUpper.startsWith('ФОС')) return map['PHOR'];
  if (shortnameUpper.startsWith('ВУШ') || shortnameUpper.startsWith('IВУШ')) return map['WUSH'];
  if (shortnameUpper.startsWith('ИНТЕРСКОЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЛУКОЙЛ')) return map['LKOH'];
  if (shortnameUpper.startsWith('ЧЕРКИЗ')) return map['GCHE'];
  if (shortnameUpper.startsWith('МЕТАЛИН')) return map['RUS'];
  if (shortnameUpper.startsWith('СКФ')) return map['FLOT'];
  if (shortnameUpper.startsWith('АЛЬТА')) return map['RUS'];
  if (shortnameUpper.startsWith('НОВТЕХН')) return map['RUS'];
  if (shortnameUpper.startsWith('АПРИ')) return map['RUS'];
  if (shortnameUpper.startsWith('РКС')) return map['ETLN'];
  if (shortnameUpper.startsWith('БОРЕЦ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭФФЕРОН')) return map['RUS'];
  if (shortnameUpper.startsWith('РЕИННОЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('РОДЕЛЕН')) return map['RUS'];
  if (shortnameUpper.startsWith('СОПФ') || shortnameUpper.startsWith('SСОПФ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('SСТМ') || shortnameUpper.startsWith('СТМ')) return map['RUS'];
  if (shortnameUpper.startsWith('СИБАВТО')) return map['RUS'];
  if (shortnameUpper.startsWith('МАГНИТ')) return map['MGNT'];
  if (shortnameUpper.startsWith('АРЕНЗА')) return map['RUS'];
  if (shortnameUpper.startsWith('ВЫМПЕЛ')) return map['VEON'];
  if (shortnameUpper.startsWith('САММИТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭЛЕМЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('СЭТЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('ДФФ')) return map['RUS'];
  if (shortnameUpper.startsWith('БДЕНЬГ')) return map['RUS'];
  if (shortnameUpper.startsWith('ТГК-1') || shortnameUpper.startsWith('ТГК1')) return map['TGKA'];
  if (shortnameUpper.startsWith('МГДОБЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('ГАЗК')) return map['GAZR'];
  if (shortnameUpper.startsWith('АГТК')) return map['RUS'];
  if (shortnameUpper.startsWith('РЭО')) return map['RUS'];
  if (shortnameUpper.startsWith('АБЗ')) return map['RUS'];
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
  if (shortnameUpper.startsWith('РОСНАНО')) return map['RUS'];
  if (shortnameUpper.startsWith('МЕГАФОН')) return map['RUS'];
  if (shortnameUpper.startsWith('МЕТАЛИНБ')) return map['RUS'];
  if (shortnameUpper.startsWith('АЗБУКА')) return map['RUS'];
  if (shortnameUpper.startsWith('АПТ36')) return map['RUS'];
  if (shortnameUpper.startsWith('ЯКУТ')) return map['RUS'];
  if (shortnameUpper.startsWith('КРАСНОД')) return map['RUS'];
  if (shortnameUpper.startsWith('ПСБ')) return map['RUS'];
  if (shortnameUpper.startsWith('МБЭС')) return map['RUS'];
  if (shortnameUpper.startsWith('ПР-ЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЮНИМЕТР')) return map['RUS'];
  if (shortnameUpper.startsWith('ПНППК')) return map['RUS'];
  if (shortnameUpper.startsWith('ЖКХРСЯ')) return map['RUS'];
  if (shortnameUpper.startsWith('SРУСОЛ') || shortnameUpper.startsWith('РУСОЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('IУОМЗ') || shortnameUpper.startsWith('УОМЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('SСОЦ') || shortnameUpper.startsWith('СОЦ')) return map['RUS'];
  if (shortnameUpper.startsWith('RUS-')) return map['RUS'];
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
  if (shortnameUpper.startsWith('БИНФАРМ')) return map['RUS'];
  if (shortnameUpper.startsWith('SКАПИТАЛ') || shortnameUpper.startsWith('КАПИТАЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('ПЕТСНАБ')) return map['RUS'];
  if (shortnameUpper.startsWith('БНТЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('СОЛЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('СНХТ')) return map['RUS'];
  if (shortnameUpper.startsWith('НЗРМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ПУШК')) return map['RUS'];
  if (shortnameUpper.startsWith('ТРАНСМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭЛАП')) return map['RUS'];
  if (shortnameUpper.startsWith('SИАДОМ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('МГКЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('SВЭБ')) return map['VEB'];
  if (shortnameUpper.startsWith('ШЕВЧЕНК')) return map['RUS'];
  if (shortnameUpper.startsWith('CIB')) return map['SBER'];
  if (shortnameUpper.startsWith('ЦР')) return map['RUS'];
  if (shortnameUpper.startsWith('ГАЗКЗ')) return map['GAZR'];
  if (shortnameUpper.startsWith('РОСНЕФТЬ') || shortnameUpper.startsWith('РОСНФТ')) return map['ROSN'];
  if (shortnameUpper.startsWith('ГИДРОМАШ')) return map['RUS'];
  if (shortnameUpper.startsWith('СИБУР')) return map['RUS']; // No Sibur icon yet
  if (shortnameUpper.startsWith('SMGOR') || shortnameUpper.startsWith('SМГОР') || shortnameUpper.startsWith('СМГОР')) return map['RUS'];
  if (shortnameUpper.startsWith('МЭЙЛ')) return map['VKCO'];
  if (shortnameUpper.startsWith('ПЕТРИНЖ')) return map['RUS'];
  if (shortnameUpper.startsWith('ДРКТЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('МОТОР')) return map['RUS'];
  if (shortnameUpper.startsWith('ТАТНХИМ')) return map['RUS'];
  if (shortnameUpper.startsWith('МСБЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('СЛАВЭКО')) return map['RUS'];
  if (shortnameUpper.startsWith('СФО')) return map['RUS'];
  if (shortnameUpper.startsWith('ЦИФРБРО')) return map['RUS'];
  if (shortnameUpper.startsWith('ВСК')) return map['RUS'];
  if (shortnameUpper.startsWith('ИА') && shortnameUpper.includes('АБС')) return map['RUS'];
  if (shortnameUpper.startsWith('ЛТРЕЙД')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭНИКА')) return map['RUS'];
  if (shortnameUpper.startsWith('ТРАНСМХ')) return map['RUS'];
  if (shortnameUpper.startsWith('АТОМЭН') || shortnameUpper.startsWith('SАТОМЭН')) return map['RUS'];
  if (shortnameUpper.startsWith('БАШКОРТ')) return map['RUS'];
  if (shortnameUpper.startsWith('АРТГН')) return map['RUS'];
  if (shortnameUpper.startsWith('БЭЛТИ')) return map['RUS'];
  if (shortnameUpper.startsWith('МЕТИНВ')) return map['RUS'];
  if (shortnameUpper.startsWith('МАНЫЧ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЕВРОПЛН')) return map['RUS'];
  if (shortnameUpper.startsWith('РЕГПРОД')) return map['RUS'];
  if (shortnameUpper.startsWith('АВТОБФ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЭТАЛ')) return map['ETLN'];
  if (shortnameUpper.startsWith('СЛАВНЕ')) return map['RUS']; // Shortened from СЛАВНЕФ
  if (shortnameUpper.startsWith('РУСАЛ') || shortnameUpper.startsWith('РСАЛ')) return map['RUAL'];
  if (shortnameUpper.startsWith('МОСТРЕСТ')) return map['MSTT'];
  if (shortnameUpper.startsWith('РОСТЕЛ')) return map['RTKM'];
  if (shortnameUpper.startsWith('РЕСО')) return map['RENI'];
  if (shortnameUpper.startsWith('ЧТПЗ')) return map['TMK'];
  if (shortnameUpper.startsWith('АВТОДОР')) return map['RUS'];
  if (shortnameUpper.startsWith('ЗСД') || shortnameUpper.startsWith('ГЛДОРОГА') || shortnameUpper.startsWith('СЗКК')) return map['RUS'];
  if (shortnameUpper.startsWith('ДОМ') || shortnameUpper.startsWith('ИА ДОМ') || shortnameUpper.startsWith('ИАДОМ')) return map['DOMRF'];
  if (shortnameUpper.startsWith('МОСКРЕД') || shortnameUpper.startsWith('МКБ')) return map['CBOM'];
  if (shortnameUpper.startsWith('НКНХ')) return map['NKNC'];
  if (shortnameUpper.startsWith('СЕВЕРСТ')) return map['CHMF'];
  if (shortnameUpper.startsWith('ФПК')) return map['RZD'];
  if (shortnameUpper.startsWith('СИТИМАТ') || shortnameUpper.startsWith('СИТИМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ПЕРЕСВЕТ') || shortnameUpper.startsWith('ПЕРЕСВ')) return map['RUS'];
  if (shortnameUpper.startsWith('МДС')) return map['RUS'];
  if (shortnameUpper.startsWith('ПКТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ДЕРЖАВА')) return map['RUS'];
  if (shortnameUpper.startsWith('НОВОСИБ') || shortnameUpper.startsWith('НОВСИБ') || shortnameUpper.startsWith('ЯРОБЛ') || shortnameUpper.startsWith('ОРЕНБ') || shortnameUpper.startsWith('СПБГО') || shortnameUpper.startsWith('САМАРОБЛ') || shortnameUpper.startsWith('СВЕРДЛОБЛ') || shortnameUpper.startsWith('УДМУРТ')) return map['RUS'];
  if (shortnameUpper.startsWith('ОДК')) return map['RUS'];
  if (shortnameUpper.startsWith('STKK') || shortnameUpper.startsWith('SТКК') || shortnameUpper.startsWith('ТКК')) return map['RUS'];
  if (shortnameUpper.startsWith('АКРОН')) return map['RUS'];
  if (shortnameUpper.startsWith('ТРАНСФ')) return map['RUS'];
  if (shortnameUpper.startsWith('КРАУС')) return map['RUS'];
  if (shortnameUpper.startsWith('РСЭКСМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЛОКОСЕРВ')) return map['RUS'];
  if (shortnameUpper.startsWith('АРАГОН')) return map['RUS'];
  if (shortnameUpper.startsWith('МЕЖИНБ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЛЕВЕНГУК')) return map['RUS'];
  if (shortnameUpper.startsWith('ВЦЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЦППК')) return map['RUS'];
  if (shortnameUpper.startsWith('ВЕРТОЛЕТ')) return map['RUS'];
  if (shortnameUpper.startsWith('СФЕРФИН')) return map['RUS'];
  if (shortnameUpper.startsWith('РОССИУМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЕАБР')) return map['RUS'];
  if (shortnameUpper.startsWith('ТКХ')) return map['RUS'];
  if (shortnameUpper.startsWith('ММЦБ')) return map['RUS'];
  if (shortnameUpper.startsWith('ПРАВОУРМ')) return map['RUS'];
  if (shortnameUpper.startsWith('ПИОНЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('СГБ')) return map['RUS'];
  if (shortnameUpper.startsWith('БРАЙТФ')) return map['RUS'];
  if (shortnameUpper.startsWith('СЛАВНЕФ')) return map['RUS'];
  if (shortnameUpper.startsWith('КАЗАХСТ')) return map['BLR']; // Use BLR/Foreign icon or KZT? KZT is currency icon. BLR maps to by.svg. Maybe map to KZ flag if available? I have KZT -> kz.svg.
  if (shortnameUpper.startsWith('УЛЬОБ')) return map['RUS'];
  if (shortnameUpper.startsWith('IMT_FREE')) return map['MTS'];
  if (shortnameUpper.startsWith('МОЭК')) return map['RUS'];
  if (shortnameUpper.startsWith('ИА АБС')) return map['RUS'];
  if (shortnameUpper.startsWith('НКК')) return map['RUS'];
  if (shortnameUpper.startsWith('РВК')) return map['RUS'];
  if (shortnameUpper.startsWith('ТОМСК')) return map['RUS'];
  if (shortnameUpper.startsWith('СЭЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ВИС')) return map['RUS'];
  if (shortnameUpper.startsWith('ПРОДКОРП')) return map['RUS'];
  if (shortnameUpper.startsWith('МОСОБ')) return map['RUS'];
  if (shortnameUpper.startsWith('НИЖГОР')) return map['RUS'];
  if (shortnameUpper.startsWith('ЧЕЛЯБ')) return map['RUS'];
  if (shortnameUpper.startsWith('МСП')) return map['RUS'];
  if (shortnameUpper.startsWith('СТАВР')) return map['RUS'];
  if (shortnameUpper.startsWith('КАЛИН')) return map['RUS'];
  if (shortnameUpper.startsWith('ТИТАН')) return map['RUS'];
  if (shortnameUpper.startsWith('БМБАНК')) return map['RUS'];
  if (shortnameUpper.startsWith('РЕНКРЕД')) return map['RUS'];
  if (shortnameUpper.startsWith('СДЭК')) return map['RUS'];
  if (shortnameUpper.startsWith('РОСАГРЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('ЮСК')) return map['RUS'];
  if (shortnameUpper.startsWith('РИТЙЛ')) return map['RUS'];
  if (shortnameUpper.startsWith('КИРОВ')) return map['RUS'];
  if (shortnameUpper.startsWith('МГОР')) return map['RUS'];
  if (shortnameUpper.startsWith('НОВОТР')) return map['RUS'];
  if (shortnameUpper.startsWith('ТЕХЛИЗ')) return map['RUS'];
  if (shortnameUpper.startsWith('ТП КИР')) return map['RUS'];
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
  if (shortnameUpper.startsWith('ПИОНЕР')) return map['PIONEER'];
  if (shortnameUpper.startsWith('СОДРУЖ')) return map['SODR'];
  if (shortnameUpper.startsWith('АСГТРАФО')) return map['ASG'];
  if (shortnameUpper.startsWith('ТПЛЮС')) return map['TPLUS'];
  if (shortnameUpper.startsWith('ГКАЗОТ')) return map['AZOT'];
  if (shortnameUpper.startsWith('ЛМБРД888') || shortnameUpper.startsWith('ЛОМБАРД888')) return map['LOMBARD888'];
  if (shortnameUpper.startsWith('РС БО') || shortnameUpper.startsWith('РУССКИЙ СВЕТ')) return map['RUSVET'];
  
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

// Export alias for backward compatibility if needed, but we will update usages
export const getFuturesIcon = getIcon;
