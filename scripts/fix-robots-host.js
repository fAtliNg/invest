const fs = require('fs');
const path = require('path');

const isDev = process.env.NEXT_PUBLIC_IS_DEV === 'true';
const domain = isDev ? 'profit-case-dev.ru' : 'profit-case.ru';

const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');

try {
  let content = fs.readFileSync(robotsPath, 'utf8');
  content = content.replace(/^Host:\s*https?:\/\/([^ \n]+)/mi, `Host: ${domain}`);
  fs.writeFileSync(robotsPath, content, 'utf8');
  console.log(`Updated Host in robots.txt to: ${domain}`);
} catch (err) {
  console.error('Failed to update robots.txt Host:', err);
  process.exitCode = 0;
}
