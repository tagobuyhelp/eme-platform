import fs from "fs";
import { uploadToS3 } from "./server/core/utils/s3.js";
import "dotenv/config";
import https from "https";

async function testS3() {
  fs.writeFileSync("test.txt", "Hello World");
  const url = await uploadToS3("test.txt", "eme-platform/test", 1, "text/plain");
  console.log("Uploaded to", url);

  https.get(url, (res) => {
    console.log("Headers:", res.headers);
    process.exit(0);
  });
}

testS3();
