const fs = require('fs');
const https = require('https');
const path = require('path');

const targets = [
  { name: 'TCS.svg', page: 'https://commons.wikimedia.org/wiki/File:Tinkoff_Bank_logo.svg' },
  { name: 'SUEK.svg', page: 'https://commons.wikimedia.org/wiki/File:SUEK_Logo.svg' },
];

const direct = [
  // Add direct URLs here if any
];

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded ' + dest);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file async. (But we don't check the result)
      console.error('Error downloading ' + url, err.message);
      reject(err);
    });
  });
};

const getSvgUrlFromPage = (pageUrl) => {
  return new Promise((resolve, reject) => {
    https.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Look for the "Original file" link or the main image
        // Wikimedia Commons structure: <a href=".../upload/..." class="internal" title="...">Original file</a>
        const match = data.match(/href="([^"]+\.svg)" class="internal"/);
        if (match) {
            resolve(match[1]);
        } else {
            // Fallback: look for other patterns if "internal" class is not there
            const match2 = data.match(/href="([^"]+\.svg)"/);
             if (match2) {
                // Check if it looks like an upload URL
                if (match2[1].includes('/upload/')) {
                     resolve(match2[1]);
                } else {
                    reject(new Error('No suitable SVG link found in ' + pageUrl));
                }
            } else {
                reject(new Error('No SVG link found in ' + pageUrl));
            }
        }
      });
    }).on('error', reject);
  });
};

const processTargets = async () => {
    const destDir = path.join(__dirname, 'public', 'icons', 'shares', 'ru');
    if (!fs.existsSync(destDir)){
        fs.mkdirSync(destDir, { recursive: true });
    }

    for (const target of targets) {
        try {
            console.log(`Processing ${target.name}...`);
            const svgUrl = await getSvgUrlFromPage(target.page);
            console.log(`Found URL: ${svgUrl}`);
            await download(svgUrl, path.join(destDir, target.name));
        } catch (err) {
            console.error(`Failed to process ${target.name}:`, err.message);
        }
    }

    for (const d of direct) {
        try {
             console.log(`Downloading direct ${d.name}...`);
             await download(d.url, path.join(destDir, d.name));
        } catch (err) {
            console.error(`Failed to download ${d.name}:`, err.message);
        }
    }
};

processTargets();
