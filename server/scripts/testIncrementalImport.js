import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import connectDB from "../config/db.js";
import { importStudentsFromExcelBuffer } from "../modules/student/student.service.js";
import User from "../modules/auth/auth.model.js";
import Student from "../modules/student/student.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../..", ".env") });

async function testNewCandidatesOnly() {
  await connectDB();
  const filePath = path.resolve(__dirname, "../../uploads/CANDIDATE_LIST.xlsx");
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets["Sheet1"];
  
  // Add 2 new candidate rows at the end of Sheet1
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  rows.push([446, "TEST NEW CANDIDATE ONE", 9800112233, "FULL STACK DEVELOPMENT"]);
  rows.push([447, "TEST NEW CANDIDATE TWO", 9800445566, "CYBER SECURITY"]);

  const newSheet = XLSX.utils.aoa_to_sheet(rows);
  wb.Sheets["Sheet1"] = newSheet;
  const newBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  console.log("--- Testing Incremental File Re-Import (Existing + 2 New Candidates) ---");
  const res = await importStudentsFromExcelBuffer(newBuffer);
  console.log("Import Result Summary:", res);

  // Cleanup test records
  await User.deleteMany({ phone: { $in: ["9800112233", "9800445566"] } });
  await Student.deleteMany({ phone: { $in: ["9800112233", "9800445566"] } });
  console.log("🧹 Cleaned up test candidates from DB.");

  process.exit(0);
}

testNewCandidatesOnly().catch((err) => {
  console.error(err);
  process.exit(1);
});
