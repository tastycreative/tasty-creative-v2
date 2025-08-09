import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';

// Helper to run ffmpeg and extract keyframes
function extractKeyframesFFmpeg(videoPath: string, outputDir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPattern = path.join(outputDir, 'frame-%03d.jpg');
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vf', "select='eq(pict_type,PICT_TYPE_I)'",
      '-vsync', 'vfr',
      outputPattern
    ]);
    ffmpeg.on('error', reject);
    ffmpeg.stderr.on('data', () => {}); // suppress output
    ffmpeg.on('close', (code) => {
      if (code !== 0) return reject(new Error('ffmpeg failed'));
      const files = fs.readdirSync(outputDir)
        .filter(f => f.endsWith('.jpg'))
        .map(f => path.join('/keyframes', path.basename(outputDir), f));
      resolve(files);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }

  try {
    const bb = busboy({ headers: req.headers });
    let uploadedFilePath: string | null = null;
    const filename = uuidv4();

    bb.on('file', (name, file, info) => {
      const uploadPath = path.join('/tmp', filename);
      uploadedFilePath = uploadPath;
      file.pipe(fs.createWriteStream(uploadPath));
    });

    bb.on('close', async () => {
      if (!uploadedFilePath) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        const outputDir = path.join(process.cwd(), 'public', 'keyframes', filename);
        const frames = await extractKeyframesFFmpeg(uploadedFilePath, outputDir);
        
        // Clean up uploaded file
        fs.unlinkSync(uploadedFilePath);
        
        res.status(200).json({ frames });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
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
