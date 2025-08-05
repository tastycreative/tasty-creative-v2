import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({ dest: './uploads/' });

const handler = nextConnect<NextApiRequest, NextApiResponse>({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

handler.use(upload.array('videos'));

handler.post((req: any, res) => {
  // Return uploaded file info
  res.status(200).json({ files: req.files });
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
