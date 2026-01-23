import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { isin } = req.query;
  
  // Validate ISIN to prevent directory traversal
  if (!isin || typeof isin !== 'string' || !/^[A-Z0-9]+$/.test(isin)) {
    return res.status(400).json({ error: 'Invalid ISIN' });
  }

  const extensions = ['svg', 'png', 'jpg', 'jpeg', 'ico'];
  const logosDir = path.join(process.cwd(), 'logos');

  for (const ext of extensions) {
    const filePath = path.join(logosDir, `${isin}.${ext}`);
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      let contentType = 'image/svg+xml';
      if (ext === 'png') contentType = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      if (ext === 'ico') contentType = 'image/x-icon';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(fileBuffer);
      return;
    }
  }

  res.status(404).json({ error: 'Logo not found' });
}
