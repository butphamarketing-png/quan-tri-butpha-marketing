import "dotenv/config";
import app from "./app";
import type { Request, Response } from "express";

// Export the app for Vercel
export default async (req: Request, res: Response) => {
  await app(req, res);
};

// For local development
const rawPort = process.env["PORT"];
if (rawPort && process.env.NODE_ENV !== "production") {
  const port = Number(rawPort);
  if (!Number.isNaN(port) && port > 0) {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }
}
