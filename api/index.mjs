
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (_req, res) => {
  res.json({
    message: "Phá ERP API is running!",
    version: "1.0.0",
    health: "/api/healthz"
  });
});

// Health check
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// Export handler cho Vercel
export default async function handler(req, res) {
  await app(req, res);
}
