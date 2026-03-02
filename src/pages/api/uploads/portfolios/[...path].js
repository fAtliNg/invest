import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { path: filePathArray } = req.query;
  
  if (!filePathArray || !Array.isArray(filePathArray)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const fileName = filePathArray[filePathArray.length - 1];
  
  // Basic security check for filename
  if (!fileName || !/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  // Look for the file in the backend uploads directory
  const rootDir = path.join(process.cwd());
  const uploadsDir = path.join(rootDir, 'backend', 'uploads', 'portfolios');
  const filePath = path.join(uploadsDir, fileName);

  console.log('Trying to read file:', filePath);
  console.log('Current working directory:', process.cwd());

  if (fs.existsSync(filePath)) {
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.svg') contentType = 'image/svg+xml';
    if (ext === '.gif') contentType = 'image/gif';
    
    const fileBuffer = fs.readFileSync(filePath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(fileBuffer);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
}
