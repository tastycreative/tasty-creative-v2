import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }

  try {
    const bb = busboy({ headers: req.headers });
    const files: any[] = [];
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    bb.on('file', (name, file, info) => {
      const filename = uuidv4() + path.extname(info.filename || '');
      const uploadPath = path.join(uploadsDir, filename);
      
      file.pipe(fs.createWriteStream(uploadPath));
      
      files.push({
        fieldname: name,
        originalname: info.filename,
        filename: filename,
        path: uploadPath,
        size: 0 // Would need to track this if needed
      });
    });

    bb.on('close', () => {
      res.status(200).json({ files });
    });

    bb.on('error', (error: any) => {
      res.status(500).json({ error: error.message });
    });

    req.pipe(bb);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
