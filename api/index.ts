import "dotenv/config";
import app from "../artifacts/api-server/src/app";
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
