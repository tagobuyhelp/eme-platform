import Student from "../student/student.model.js";
import Certificate from "./certificate.model.js";

import {
  buildCertificatePdfByCertificateId,
  generateCertificate,
  getCertificates,
  verifyCertificate,
} from "./certificate.service.js";

function ensureOwnershipOrAdmin(reqUser, studentId) {
  if (reqUser?.role !== "admin" && reqUser?.role !== "student") {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  return true;
}

export async function generateCertificateHandler(req, res, next) {
  try {
    const userId = req.user?.id;
    const examId = req.body?.examId;

    const student = await Student.findOne({ userId }).select("_id").lean();
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const certificate = await generateCertificate(student._id, examId);
    return res.status(201).json({
      message: "Certificate generated",
      certificate: {
        certificateId: certificate.certificateId,
        certificateUrl: certificate.certificateUrl,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getMyCertificates(req, res, next) {
  try {
    const userId = req.user?.id;
    const student = await Student.findOne({ userId }).select("_id").lean();
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const certificates = await getCertificates(student._id);
    return res.json({ certificates });
  } catch (err) {
    return next(err);
  }
}

export async function verifyCertificateHandler(req, res, next) {
  try {
    const details = await verifyCertificate(req.params.id);
    return res.json({ certificate: details });
  } catch (err) {
    return next(err);
  }
}

export async function downloadCertificateHandler(req, res, next) {
  try {
    const certificateId = req.params.id;
    const cert = await Certificate.findOne({ certificateId }).lean();
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    const pdf = await buildCertificatePdfByCertificateId(certificateId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${certificateId}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    return next(err);
  }
}

export default {
  generateCertificateHandler,
  getMyCertificates,
  verifyCertificateHandler,
  downloadCertificateHandler,
};

