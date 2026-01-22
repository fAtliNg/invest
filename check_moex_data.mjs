
import https from 'https';

const url = 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQTF/securities.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const securities = json.securities.data;
      const columns = json.securities.columns;
      const secidIdx = columns.indexOf('SECID');
      const shortnameIdx = columns.indexOf('SHORTNAME');

      const funds = securities.map(s => ({
        secid: s[secidIdx],
        shortname: s[shortnameIdx]
      }));

      // Filter for reported funds to see their exact details
      const reportedPrefixes = ['AM', 'BCS', 'BND', 'DIVD', 'GROD', 'FINC', 'FLOW', 'FMBR', 'FMMM', 'GOOD', 'INFL', 'INGO', 'CASH', 'CNYM', 'EQMX', 'ESGE', 'BOND'];
      
      const reportedFunds = funds.filter(f => {
        return reportedPrefixes.some(p => f.secid.startsWith(p)) || 
               ['ETF DIVD', 'ETF GROD'].includes(f.shortname) ||
               ['ETF DIVD', 'ETF GROD'].includes(f.secid); // Just in case
      });

      console.log('Found reported funds in MOEX TQTF:');
      reportedFunds.forEach(f => {
        console.log(`SECID: "${f.secid}", SHORTNAME: "${f.shortname}"`);
      });

    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', (e) => {
  console.error('Error fetching data:', e);
});
