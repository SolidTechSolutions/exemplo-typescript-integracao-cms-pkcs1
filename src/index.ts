'use strict';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { CmsPkcs1Service } from './service';

const app = express();
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage() });
const service = new CmsPkcs1Service();

app.post('/api/cms/pkcs1/prepare', upload.fields([{ name: 'document' }]), async (req: Request, res: Response) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const result = await service.prepareSignature(files['document'] ?? []);
  return result ? res.json(result) : res.status(500).json({ error: 'Preparation failed.' });
});

app.post('/api/cms/pkcs1/finalize', async (req: Request, res: Response) => {
  const result = await service.finalizeSignature(req.body as Record<string, string>);
  return result ? res.json(result) : res.status(500).json({ error: 'Finalization failed.' });
});

app.post('/api/cms/pkcs1/prepare/form', upload.fields([{ name: 'document' }]), async (req: Request, res: Response) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const b = req.body as Record<string, string>;
  const result = await service.prepareForm(b.authorization, b.baseUrl, b.certificate,
    files['document'] ?? [], b.profile, b.hashAlgorithm, b.signaturePackaging, b.policyVersion);
  return result ? res.json(result) : res.status(500).json({ error: 'Preparation failed.' });
});

app.post('/api/cms/pkcs1/finalize/form', async (req: Request, res: Response) => {
  const { authorization, baseUrl, ...rest } = req.body as Record<string, string>;
  const result = await service.finalizeForm(authorization, baseUrl, rest);
  return result ? res.json(result) : res.status(500).json({ error: 'Finalization failed.' });
});

const PORT = Number(process.env.PORT ?? 8092);
app.listen(PORT, () => console.info(`SolidSign CMS PKCS1 (TS) running on port ${PORT}`));
