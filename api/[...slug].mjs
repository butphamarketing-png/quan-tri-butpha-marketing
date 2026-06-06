import "dotenv/config";
import expressApp from "../artifacts/api-server/dist/index.mjs";

export default async (req, res) => {
  return new Promise((resolve, reject) => {
    expressApp(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
