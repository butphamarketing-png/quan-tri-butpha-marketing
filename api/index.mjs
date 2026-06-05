
import { handler as serverHandler from '../artifacts/api-server/dist/index.mjs';

export default async function handler(req, res) {
  // Gọi handler đã import
  if (serverHandler) {
    return serverHandler(req, res);
  } else {
    res.status(200).json({ 
      message: "Phá ERP API is running!" 
    });
  }
}
