import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";

const getS3Client = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
    return null;
  }

  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
};

export const uploadToS3 = async (filePath, folder = "eme-platform", retries = 3, contentType = "application/octet-stream") => {
  const s3Client = getS3Client();
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!s3Client || !bucketName) {
    console.warn("AWS S3 is not configured properly in .env");
    return null;
  }

  let attempt = 0;
  while (attempt < retries) {
    try {
      const fileStream = fs.createReadStream(filePath);
      const fileName = path.basename(filePath);
      const s3Key = `${folder}/${fileName}`;

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucketName,
          Key: s3Key,
          Body: fileStream,
          ContentType: contentType,
          ContentDisposition: "inline",
        },
      });

      const response = await upload.done();
      return response.Location; // Returns the public S3 URL
    } catch (error) {
      attempt++;
      console.error(`Failed to upload file to S3 (Attempt ${attempt} of ${retries}):`, error);
      if (attempt >= retries) {
        return null; // All retries failed
      }
      // Wait for 1 second before retrying
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  return null;
};
