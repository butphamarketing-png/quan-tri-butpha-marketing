import 'dotenv/config';
import app from '../artifacts/api-server/src/app.js';

export default async function handler(req, res) {
  await app(req, res);
}
