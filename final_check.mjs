
import { getIcon } from "./temp_icons.mjs";
import fs from 'fs';
import path from 'path';

const reportedFunds = [
    { secid: 'AMFL', shortname: 'AMFL ETF' },
    { secid: 'AMGB', shortname: 'AMGB ETF' },
    { secid: 'BCSB', shortname: 'BCSB ETF' },
    { secid: 'BNDA', shortname: 'BNDA ETF' },
    { secid: 'DIVD', shortname: 'ETF DIVD' }, // Note: user said ETF DIVD
    { secid: 'GROD', shortname: 'ETF GROD' },
    { secid: 'FINC', shortname: 'FINC ETF' },
    { secid: 'FLOW', shortname: 'FLOW ETF' },
    { secid: 'FMMM', shortname: 'FMMM ETF' },
    { secid: 'GOOD', shortname: 'GOOD ETF' },
    { secid: 'INFL', shortname: 'INFL ETF' },
    { secid: 'INGO', shortname: 'INGO ETF' },
    { secid: 'CASH', shortname: 'CASH ETF' },
    { secid: 'CNYM', shortname: 'CNYM ETF' },
    { secid: 'EQMX', shortname: 'EQMX ETF' },
    { secid: 'ESGE', shortname: 'ESGE ETF' },
    { secid: 'BOND', shortname: 'BOND ETF' },
];

console.log('Checking icon mapping and file existence...');

let errors = 0;

reportedFunds.forEach(fund => {
    const iconPath = getIcon(fund.secid, fund.shortname);
    
    if (!iconPath) {
        console.error(`[FAIL] ${fund.secid}: getIcon returned null/undefined`);
        errors++;
        return;
    }

    // iconPath is relative to public/ e.g. /icons/shares/ru/ATON.png
    // We need to check if file exists in public/
    const localPath = path.join(process.cwd(), 'public', iconPath);
    
    if (fs.existsSync(localPath)) {
        console.log(`[OK] ${fund.secid} -> ${iconPath} (File exists)`);
    } else {
        console.error(`[FAIL] ${fund.secid} -> ${iconPath} (File MISSING at ${localPath})`);
        errors++;
    }
});

if (errors === 0) {
    console.log('All reported funds have valid icons!');
} else {
    console.log(`Found ${errors} errors.`);
}
