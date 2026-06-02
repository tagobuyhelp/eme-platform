import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;

    // Drop index on attempts collection
    try {
      await db.collection("attempts").dropIndex("studentId_1_examId_1");
      console.log("Successfully dropped studentId_1_examId_1 index from attempts.");
    } catch (err) {
      console.log("Index studentId_1_examId_1 on attempts might not exist:", err.message);
    }

    // Drop index on results collection
    try {
      await db.collection("results").dropIndex("studentId_1_examId_1");
      console.log("Successfully dropped studentId_1_examId_1 index from results.");
    } catch (err) {
      console.log("Index studentId_1_examId_1 on results might not exist:", err.message);
    }

    console.log("Migration completed.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
