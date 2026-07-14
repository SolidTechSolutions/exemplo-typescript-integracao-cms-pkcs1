'use strict';
import axios from 'axios';
import FormData from 'form-data';

export class CmsPkcs1Service {
  private readonly baseUrl = (process.env.SOLIDSIGN_API_BASE_URL ?? '').replace(/\/$/, '');
  private readonly authorization = process.env.SOLIDSIGN_API_AUTHORIZATION ?? '';
  private readonly profile = process.env.SOLIDSIGN_SIG_PROFILE ?? 'ADRB';
  private readonly hashAlgorithm = process.env.SOLIDSIGN_SIG_HASH_ALGORITHM ?? 'SHA256';
  private readonly signaturePackaging = process.env.SOLIDSIGN_SIG_PACKAGING ?? 'ENVELOPING';
  private readonly signerCertPem = process.env.SOLIDSIGN_CERT_PEM ?? '';

  async prepareSignature(documents: Express.Multer.File[]): Promise<unknown> {
    const form = new FormData();
    documents.forEach((d, i) => form.append(`document[${i}]`, d.buffer, { filename: d.originalname }));
    form.append('profile', this.profile); form.append('hashAlgorithm', this.hashAlgorithm);
    form.append('signaturePackaging', this.signaturePackaging); form.append('certificate', this.signerCertPem);
    try {
      const r = await axios.post(`${this.baseUrl}/solidsign/dsig/cms/pkcs1/sign-preparation`, form,
        { headers: { Authorization: this.authorization, ...form.getHeaders() }, timeout: 120000 });
      return r.data;
    } catch (err) { this.logError('CMS PKCS1 prepare', err); return null; }
  }

  async finalizeSignature(params: Record<string, string>): Promise<unknown> {
    const form = new FormData();
    Object.entries(params).forEach(([k, v]) => form.append(k, v));
    try {
      const r = await axios.post(`${this.baseUrl}/solidsign/dsig/cms/pkcs1/sign-finalization`, form,
        { headers: { Authorization: this.authorization, ...form.getHeaders() }, timeout: 120000 });
      return r.data;
    } catch (err) { this.logError('CMS PKCS1 finalize', err); return null; }
  }

  async prepareForm(authorization: string, baseUrl: string, certificate: string,
    documents: Express.Multer.File[], profile?: string, hashAlgorithm?: string,
    signaturePackaging?: string, policyVersion?: string): Promise<unknown> {
    const form = new FormData();
    documents.forEach((d, i) => form.append(`document[${i}]`, d.buffer, { filename: d.originalname }));
    form.append('certificate', certificate);
    if (profile)            form.append('profile', profile);
    if (hashAlgorithm)      form.append('hashAlgorithm', hashAlgorithm);
    if (signaturePackaging) form.append('signaturePackaging', signaturePackaging);
    if (policyVersion)      form.append('policyVersion', policyVersion);
    try {
      const r = await axios.post(`${baseUrl.replace(/\/$/, '')}/solidsign/dsig/cms/pkcs1/sign-preparation`, form,
        { headers: { Authorization: authorization, ...form.getHeaders() }, timeout: 120000 });
      return r.data;
    } catch (err) { this.logError('CMS PKCS1 prepare form', err); return null; }
  }

  async finalizeForm(authorization: string, baseUrl: string, params: Record<string, string>): Promise<unknown> {
    const form = new FormData();
    Object.entries(params).forEach(([k, v]) => form.append(k, v));
    try {
      const r = await axios.post(`${baseUrl.replace(/\/$/, '')}/solidsign/dsig/cms/pkcs1/sign-finalization`, form,
        { headers: { Authorization: authorization, ...form.getHeaders() }, timeout: 120000 });
      return r.data;
    } catch (err) { this.logError('CMS PKCS1 finalize form', err); return null; }
  }

  private logError(ctx: string, err: unknown): void {
    if (axios.isAxiosError(err)) console.error(`SolidSign error ${err.response?.status} [${ctx}]`);
    else console.error(`Error [${ctx}]: ${(err as Error).message}`);
  }
}
