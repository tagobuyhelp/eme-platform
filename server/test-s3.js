import fs from "fs";
import { uploadToS3 } from "./core/utils/s3.js";
import "dotenv/config";
import https from "https";

async function testS3() {
  fs.writeFileSync("test.pdf", "Dummy PDF content");
  // Test with PDF mimetype
  const url = await uploadToS3("test.pdf", "eme-platform/test", 1, "application/pdf");
  console.log("Uploaded to", url);

  https.get(url, (res) => {
    console.log("Headers:", res.headers);
    process.exit(0);
  });
}

testS3();
