import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { filePath, timestamps } = req.body;
  if (!filePath || !timestamps) {
    return res.status(400).json({ error: 'Missing filePath or timestamps' });
  }
  // Ensure thumbnails directory exists
  const thumbsDir = path.join(process.cwd(), 'public', 'thumbnails');
  if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

  const thumbPromises = timestamps.map((ts: number, idx: number) => {
    return new Promise((resolve, reject) => {
      const outName = `thumb_${idx}_${Date.now()}.jpg`;
      const outPath = path.join(thumbsDir, outName);
      const ffmpeg = spawn('ffmpeg', [
        '-ss', ts.toString(),
        '-i', filePath,
        '-frames:v', '1',
        '-q:v', '2',
        outPath,
      ]);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve(`/thumbnails/${outName}`);
        else reject(new Error('FFmpeg failed'));
      });
    });
  });
  try {
    const thumbs = await Promise.all(thumbPromises);
    res.status(200).json({ thumbs });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate thumbnails' });
  }
}
