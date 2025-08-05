import { NextApiRequest, NextApiResponse } from 'next';
const nextConnect = require('next-connect');
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// Multer setup for file uploads
const upload = multer({ dest: '/tmp' });

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

const apiRoute = nextConnect<NextApiRequest, NextApiResponse>({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry, something went wrong! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.use(upload.single('video'));

apiRoute.post(async (req: any, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const outputDir = path.join(process.cwd(), 'public', 'keyframes', file.filename);
  try {
    const frames = await extractKeyframesFFmpeg(file.path, outputDir);
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    res.status(200).json({ frames });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default apiRoute;
