import "dotenv/config";
import app from "./app";
import type { Request, Response } from "express";

// Export the app for Vercel
export default async (req: Request, res: Response) => {
  // Make sure to call app() directly as an Express handler
  await app(req, res);
};

// Also export as named "handler" which Vercel recognizes
export const handler = async (req: Request, res: Response) => {
  await app(req, res);
};

// For local development
const rawPort = process.env["PORT"];
if (rawPort) {
  const port = Number(rawPort);
  if (!Number.isNaN(port) && port > 0) {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }
}
