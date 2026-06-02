import Student from "../student/student.model.js";
import Certificate from "./certificate.model.js";

import {
  buildCertificatePdfByCertificateId,
  generateCertificate,
  getCertificates,
  getAllCertificates,
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

    // Auto-generate missing certificates for passed exams
    try {
      const { getStudentResults } = await import("../result/result.service.js");
      const results = await getStudentResults(student._id);
      const passedResults = results.filter(r => r.status === "pass");
      
      for (const r of passedResults) {
        const exists = await Certificate.findOne({ studentId: student._id, examId: r.examId }).lean();
        if (!exists) {
           console.log(`Auto-generating missing certificate for student ${student._id} and exam ${r.examId}`);
           await generateCertificate(student._id, r.examId);
        }
      }
    } catch (autoErr) {
      console.error("Failed to auto-generate missing certificates:", autoErr);
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

export async function getAllCertificatesHandler(req, res, next) {
  try {
    const certificates = await getAllCertificates();
    return res.json({ certificates });
  } catch (err) {
    return next(err);
  }
}

export default {
  generateCertificateHandler,
  getMyCertificates,
  getAllCertificatesHandler,
  verifyCertificateHandler,
  downloadCertificateHandler,
};

