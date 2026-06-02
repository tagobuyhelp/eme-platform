import path from "path";
import { fileURLToPath } from "url";
import http from "http";

import dotenv from "dotenv";

import app from "./app.js";
import connectDB from "./config/db.js";
import { ensureDefaultUsers } from "./modules/auth/auth.service.js";
import { initSocket } from "./core/utils/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const port = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

async function start() {
  await connectDB();
  try {
    await ensureDefaultUsers();
  } catch (err) {
    console.error("Failed to ensure default users:", err?.message || err);
  }

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err?.message || err);
  process.exit(1);
});

// Triggering restart for env variables
