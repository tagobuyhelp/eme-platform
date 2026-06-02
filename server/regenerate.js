import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Certificate from "./modules/certificate/certificate.model.js";
import { generateCertificate } from "./modules/certificate/certificate.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

async function run() {
  try {
    await connectDB();
    console.log("Connected to DB...");

    const certificates = await Certificate.find().lean();
    console.log(`Found ${certificates.length} certificates to regenerate.`);

    let successCount = 0;
    let failCount = 0;

    for (const cert of certificates) {
      try {
        console.log(`Regenerating certificate ${cert.certificateId}...`);
        await generateCertificate(cert.studentId, cert.examId, true);
        console.log(`Successfully regenerated ${cert.certificateId}`);
        successCount++;
      } catch (err) {
        console.error(`Failed to regenerate ${cert.certificateId}:`, err.message);
        failCount++;
      }
    }

    console.log("==========================================");
    console.log(`Regeneration Complete!`);
    console.log(`Successfully Regenerated: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log("==========================================");

    process.exit(0);
  } catch (err) {
    console.error("Critical error:", err);
    process.exit(1);
  }
}

run();
