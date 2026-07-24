import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import { importStudentsFromExcelBuffer } from "../modules/student/student.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../..", ".env") });

async function runSeed() {
  await connectDB();
  const filePath = path.resolve(__dirname, "../../uploads/CANDIDATE_LIST.xlsx");
  
  if (!fs.existsSync(filePath)) {
    console.error("❌ Candidate Excel file not found at:", filePath);
    process.exit(1);
  }

  console.log("📂 Reading candidate Excel file:", filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  const result = await importStudentsFromExcelBuffer(fileBuffer);
  console.log("✅ Seed completed successfully!");
  console.log(`📊 Total Parsed: ${result.totalParsed}`);
  console.log(`✨ Newly Imported: ${result.importedCount}`);
  console.log(`🔄 Updated: ${result.updatedCount}`);
  if (result.errors.length > 0) {
    console.log(`⚠️ Errors (${result.errors.length}):`, result.errors);
  }
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
