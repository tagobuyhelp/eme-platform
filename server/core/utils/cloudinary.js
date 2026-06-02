import { v2 as cloudinary } from "cloudinary";

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

let isConfigured = false;

function configureCloudinary() {
  if (isConfigured) {
    return cloudinary;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
  return cloudinary;
}

export async function uploadFile(filePath, options = {}) {
  const client = configureCloudinary();
  if (!client) {
    return null;
  }

  const result = await client.uploader.upload(filePath, {
    resource_type: "raw",
    folder: "eme-platform/certificates",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    ...options,
  });

  return result.secure_url;
}

export default cloudinary;
