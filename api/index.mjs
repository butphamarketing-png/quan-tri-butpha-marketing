
// Import file đã build của api-server
import app from '../artifacts/api-server/dist/index.mjs';

export default async function handler(req, res) {
  // Gọi express app như một handler Vercel
  await app(req, res);
}
