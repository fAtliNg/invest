
import https from 'https';

const secids = [
  'CCM6', 'CLH6', 'CLM6', 'CTH6', 'CTM6', 
  'DAU5', 'DAZ5', 'DBH6', 'DBM6', 'DFH6', 'DFM6'
];

const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?securities=${secids.join(',')}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const securities = json.securities.data;
      const columns = json.securities.columns;
      
      const secidIdx = columns.indexOf('SECID');
      const assetIdx = columns.indexOf('ASSETCODE');
      const nameIdx = columns.indexOf('SECNAME');

      securities.forEach(row => {
        console.log(`${row[secidIdx]}: ${row[assetIdx]} (${row[nameIdx]})`);
      });
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', (err) => {
  console.error(err);
});
