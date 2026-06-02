import crypto from "crypto";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

import fs from "fs-extra";
import mongoose from "mongoose";
import puppeteer from "puppeteer";

import { uploadToS3 } from "../../core/utils/s3.js";
import Certificate from "./certificate.model.js";
import Result from "../result/result.model.js";
import Student from "../student/student.model.js";
import Exam from "../exam/exam.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.join(__dirname, "templates", "certificate-template.html");

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function ensureObjectId(value, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createHttpError(400, `${fieldName} is invalid`);
  }
  return value;
}

function makeCertificateId() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `EME-${year}-${suffix}`;
}

function formatIssueDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function applyTemplate(html, replacements) {
  return Object.entries(replacements).reduce(
    (output, [key, value]) => output.replaceAll(`{{${key}}}`, String(value ?? "")),
    html
  );
}

async function allocateUniqueCertificateId() {
  for (let i = 0; i < 10; i += 1) {
    const candidate = makeCertificateId();
    const exists = await Certificate.findOne({ certificateId: candidate }).lean();
    if (!exists) {
      return candidate;
    }
  }

  throw createHttpError(500, "Failed to generate unique certificateId");
}

async function getCertificateContext(studentId, examId) {
  const [student, exam, result] = await Promise.all([
    Student.findById(studentId).select("fullName email profilePhoto").lean(),
    Exam.findById(examId).select("title course").lean(),
    Result.findOne({ studentId, examId, status: "pass" }).sort({ createdAt: -1 }).select("score status").lean(),
  ]);

  if (!student) {
    throw createHttpError(404, "Student not found");
  }

  if (!exam) {
    throw createHttpError(404, "Exam not found");
  }

  if (!result) {
    throw createHttpError(404, "Result not found");
  }

  return { student, exam, result };
}

export async function generateCertificatePDF(data) {
  const template = await fs.readFile(templatePath, "utf8");
  
  const logoPath = path.join(__dirname, "..", "..", "..", "client", "public", "logo.png");
  let logoBase64 = "";
  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("Failed to read logo.png from client/public for certificate generation");
  }

  const msmePath = path.join(__dirname, "..", "..", "public", "asset", "images", "msme-logo-500x500.png");
  let msmeLogoBase64 = "";
  try {
    const msmeBuffer = await fs.readFile(msmePath);
    msmeLogoBase64 = `data:image/png;base64,${msmeBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("Failed to read MSME logo");
  }

  const isoPath = path.join(__dirname, "..", "..", "public", "asset", "images", "ISO_9001-2015.svg.png");
  let isoLogoBase64 = "";
  try {
    const isoBuffer = await fs.readFile(isoPath);
    isoLogoBase64 = `data:image/png;base64,${isoBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("Failed to read ISO logo");
  }

  const goldBadgePath = path.join(__dirname, "..", "..", "public", "asset", "images", "EMEBatch.png");
  let goldBadgeBase64 = "";
  try {
    const goldBadgeBuffer = await fs.readFile(goldBadgePath);
    goldBadgeBase64 = `data:image/png;base64,${goldBadgeBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("Failed to read Gold Badge");
  }

  const signaturePath = path.join(__dirname, "..", "..", "public", "asset", "images", "Signature.png");
  let signatureBase64 = "";
  try {
    const signatureBuffer = await fs.readFile(signaturePath);
    signatureBase64 = `data:image/png;base64,${signatureBuffer.toString("base64")}`;
  } catch (err) {
    console.warn("Failed to read Signature image");
  }

  const verifyUrl = `https://emeacademy.co.in/verify/${data.certificateId}`;
  
  const html = applyTemplate(template, {
    studentName: data.studentName,
    courseName: data.courseName,
    examName: data.examName,
    date: data.date,
    certificateId: data.certificateId,
    logoBase64,
    msmeLogoHtml: msmeLogoBase64 ? `<img src="${msmeLogoBase64}" alt="MSME Logo" style="height: 25mm; width: auto; object-fit: contain; margin-right: 3mm;" onerror="this.style.display='none'"/>` : "",
    isoLogoHtml: isoLogoBase64 ? `<img src="${isoLogoBase64}" alt="ISO Logo" style="height: 25mm; width: auto; object-fit: contain; margin-right: 3mm;" onerror="this.style.display='none'"/>` : "",
    goldBadgeHtml: goldBadgeBase64 ? `<img src="${goldBadgeBase64}" alt="Gold Badge" style="height: 35mm; width: auto; object-fit: contain;" onerror="this.style.display='none'"/>` : "",
    signatureHtml: signatureBase64 ? `<img src="${signatureBase64}" alt="Signature" style="max-height: 20mm; max-width: 55mm; object-fit: contain; vertical-align: bottom;" onerror="this.style.display='none'"/>` : `<span class="sig-text">Eme Academy</span>`,
    verifyUrl,
    verifyQrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`,
    studentPhotoHtml: data.studentPhoto ? `<img src="${data.studentPhoto}" alt="Student Photo" style="width: 24mm; height: 30mm; object-fit: cover; vertical-align: middle; margin-right: 4mm;"/>` : ""
  });

  const tempFilePath = path.join(os.tmpdir(), `certificate-${data.certificateId}.pdf`);
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox", 
        "--disable-dev-shm-usage", 
        "--disable-gpu"
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: tempFilePath,
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
    });

    return tempFilePath;
  } catch (error) {
    throw createHttpError(500, `Failed to generate certificate PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function uploadCertificatePdf(certificateId, filePath) {
  return uploadToS3(filePath, "certificates", 3, "application/pdf");
}

export async function generateCertificate(studentId, examId, force = false) {
  ensureObjectId(studentId, "studentId");
  ensureObjectId(examId, "examId");

  const existing = await Certificate.findOne({ studentId, examId }).lean();
  if (!force && existing?.certificateUrl) {
    return existing;
  }

  const { student, exam, result } = await getCertificateContext(studentId, examId);
  if (result.status !== "pass") {
    throw createHttpError(400, "Certificate can only be generated for passing results");
  }

  const issuedAt = existing?.issuedAt ? new Date(existing.issuedAt) : new Date();
  const certificateId = existing?.certificateId || (await allocateUniqueCertificateId());

  let tempFilePath;

  try {
    tempFilePath = await generateCertificatePDF({
      studentName: student.fullName,
      courseName: exam.course || exam.title,
      examName: exam.title,
      date: formatIssueDate(issuedAt),
      certificateId,
      studentPhoto: student.profilePhoto || "",
    });

    const uploadedUrl = await uploadCertificatePdf(certificateId, tempFilePath);
    const certificateUrl = uploadedUrl || `http://localhost:${process.env.PORT || 5000}/api/certificates/download/${certificateId}`;

    const certificate = await Certificate.findOneAndUpdate(
      { studentId, examId },
      {
        $set: {
          certificateId,
          issuedAt,
          certificateUrl,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return certificate;
  } finally {
    if (tempFilePath) {
      await fs.remove(tempFilePath);
    }
  }
}

export async function getCertificates(studentId) {
  ensureObjectId(studentId, "studentId");
  return Certificate.find({ studentId }).sort({ issuedAt: -1 }).lean();
}

export async function getAllCertificates() {
  return Certificate.find()
    .populate("studentId", "fullName email")
    .populate("examId", "title course")
    .sort({ issuedAt: -1 })
    .lean();
}

export async function verifyCertificate(certificateId) {
  const cert = await Certificate.findOne({ certificateId }).lean();
  if (!cert) {
    throw createHttpError(404, "Certificate not found");
  }

  const { student, exam, result } = await getCertificateContext(cert.studentId, cert.examId);

  return {
    certificateId: cert.certificateId,
    certificateUrl: cert.certificateUrl,
    issuedAt: cert.issuedAt,
    student: { fullName: student.fullName, email: student.email, profilePhoto: student.profilePhoto },
    exam: { title: exam.title, course: exam.course },
    result: { score: result.score, status: result.status },
  };
}

export async function buildCertificatePdfByCertificateId(certificateId) {
  const details = await verifyCertificate(certificateId);
  if (!details.student || !details.exam) {
    throw createHttpError(404, "Certificate details incomplete");
  }

  const tempFilePath = await generateCertificatePDF({
    studentName: details.student.fullName,
    courseName: details.exam.course || details.exam.title,
    examName: details.exam.title,
    date: formatIssueDate(new Date(details.issuedAt)),
    certificateId: details.certificateId,
    studentPhoto: details.student.profilePhoto || "",
  });

  try {
    return await fs.readFile(tempFilePath);
  } finally {
    await fs.remove(tempFilePath);
  }
}

export default {
  generateCertificate,
  generateCertificatePDF,
  getCertificates,
  verifyCertificate,
  buildCertificatePdfByCertificateId,
};
