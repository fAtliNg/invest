/**
 * Список тикеров MOEX для парсинга.
 * Топ-50 наиболее ликвидных акций Московской биржи.
 */

export const TICKERS: string[] = [
    // Нефть и газ
    'GAZP', 'LKOH', 'ROSN', 'SNGS', 'SNGSP', 'TATN', 'TATNP', 'SIBN', 'BANEP', 'BANE',
    // Банки и финансы
    'SBER', 'SBERP', 'VTBR', 'TCSG', 'BSPB', 'CBOM', 'SPBE',
    // Металлургия и горнодобыча
    'GMKN', 'NLMK', 'CHMF', 'MAGN', 'PLZL', 'POLY', 'ALRS', 'MTLR', 'RUAL',
    // Телеком и IT
    'MTSS', 'RTKM', 'YDEX', 'VKCO', 'OZON', 'POSI', 'HHRU', 'ASTR',
    // Электроэнергетика
    'IRAO', 'FEES', 'HYDR', 'RSTI', 'UPRO',
    // Ритейл и потребительский сектор
    'MGNT', 'FIVE', 'FIXP', 'LENT',
    // Строительство и девелопмент
    'PIKK', 'SMLT', 'LSRG',
    // Транспорт
    'AFLT', 'FLOT', 'NMTP',
    // Прочие
    'MOEX', 'MVID', 'SGZH', 'CIAN', 'RENI', 'PHOR',
];

/**
 * Тикеры банков — у них нет EBITDA, FCF, EV/EBITDA
 */
export const BANK_TICKERS = new Set(['SBER', 'SBERP', 'VTBR', 'BSPB', 'CBOM', 'TCSG', 'SPBE']);
