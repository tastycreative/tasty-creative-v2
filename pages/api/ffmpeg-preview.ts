import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { editScript } = req.body;
  if (!editScript) {
    return res.status(400).json({ error: 'Missing editScript' });
  }
  // TODO: Parse editScript and build FFmpeg command for preview
  // For now, just concatenate all videos in editScript.videos
  const previewDir = path.join(process.cwd(), 'public', 'previews');
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });
  const outputName = `preview_${Date.now()}.mp4`;
  const outputPath = path.join(previewDir, outputName);
  // Assume editScript.videos is an array of { filePath }
  const fileListPath = path.join(previewDir, `inputs_${Date.now()}.txt`);
  fs.writeFileSync(fileListPath, editScript.videos.map((v: any) => `file '${v.filePath}'`).join('\n'));
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'concat',
      '-safe', '0',
      '-i', fileListPath,
      '-c', 'copy',
      outputPath,
    ]);
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error('FFmpeg failed'));
    });
  });
  res.status(200).json({ previewUrl: `/previews/${outputName}` });
}
