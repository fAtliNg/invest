
import https from 'https';

const secids = [
  'AAH6', 'AAM6', 'AGH6', 'AGM6', 'ANH6', 'ANM6', 
  'BBH6', 'BBM6', 'BDH6', 'BDM6', 'BMH6', 'BMM6', 'BRH6', 'BRM6', 
  'CAH6', 'CAM6', 'CCH6', 'CCM6', 'CLH6', 'CLM6', 'CTH6', 'CTM6', 
  'DAU5', 'DAZ5', 'DBH6', 'DBM6', 'DFH6', 'DFM6', 'EDH6', 'EDM6'
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
      const latNameIdx = columns.indexOf('LATNAME'); // Sometimes useful

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
