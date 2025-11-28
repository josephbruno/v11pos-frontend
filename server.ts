import express, { type Express } from "express";
import cors from "cors";
import type { DemoResponse } from "./shared/api";

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/demo", (req, res) => {
    const response: DemoResponse = {
      message: "Hello from the server!"
    };
    res.json(response);
  });

  return app;
}
