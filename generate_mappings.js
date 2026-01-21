const fs = require('fs');
const path = require('path');

const ICONS_FILE = path.join(__dirname, 'src', 'utils', 'futures-icons.js');
const ICONS_DIR = path.join(__dirname, 'public', 'icons', 'shares', 'ru');

const getMapKeys = () => {
  const content = fs.readFileSync(ICONS_FILE, 'utf8');
  const startMatch = content.match(/const getIconMap = \(\) => \{/);
  if (!startMatch) throw new Error('Could not find getIconMap');
  
  const startIndex = startMatch.index;
  const returnMatch = content.slice(startIndex).match(/return (\{[\s\S]*?\});/);
  if (!returnMatch) throw new Error('Could not find return object in getIconMap');
  
  const objectCode = returnMatch[1];
  // Simple regex to extract keys
  const keys = [];
  const regex = /'([^']+)':/g;
  let match;
  while ((match = regex.exec(objectCode)) !== null) {
    keys.push(match[1]);
  }
  return new Set(keys);
};

const run = () => {
  const existingKeys = getMapKeys();
  const files = fs.readdirSync(ICONS_DIR);
  
  const newMappings = [];
  
  for (const file of files) {
    if (!file.endsWith('.png') && !file.endsWith('.svg') && !file.endsWith('.ico')) continue;
    
    const ticker = path.basename(file, path.extname(file));
    
    // Skip if already mapped
    if (existingKeys.has(ticker)) continue;
    
    // Also skip if it looks like a system file or backup
    if (file.includes('~')) continue;
    
    newMappings.push(`    '${ticker}': ru('${file}'),`);
  }
  
  if (newMappings.length > 0) {
    console.log(newMappings.join('\n'));
  } else {
    console.log('No new mappings needed.');
  }
};

run();
