import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes.js";
import studentRoutes from "./modules/student/student.routes.js";
import examRoutes from "./modules/exam/exam.routes.js";
import resultRoutes from "./modules/result/result.routes.js";
import certificateRoutes from "./modules/certificate/certificate.routes.js";
import courseRoutes from "./modules/course/course.routes.js";
import errorMiddleware from "./core/middleware/errorMiddleware.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ message: "Server running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/courses", courseRoutes);

import fs from "fs";

const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(errorMiddleware);

export default app;
