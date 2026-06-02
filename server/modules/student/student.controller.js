import Student from "./student.model.js";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
} from "./student.service.js";

function ensureOwnershipOrAdmin(reqUser, student) {
  if (reqUser?.role === "student" && String(reqUser.id) !== String(student.userId)) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
}

export async function createStudentProfile(req, res, next) {
  try {
    const userId = req.user?.role === "admin" ? req.body?.userId : req.user?.id;
    const student = await createStudent(req.body, userId);
    return res.status(201).json({ message: "Student profile created", student });
  } catch (err) {
    return next(err);
  }
}

export async function listStudents(req, res, next) {
  try {
    const students = await getAllStudents();
    return res.json({ students });
  } catch (err) {
    return next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    return res.json({ student });
  } catch (err) {
    return next(err);
  }
}

export async function getStudent(req, res, next) {
  try {
    const student = await getStudentById(req.params.id);
    ensureOwnershipOrAdmin(req.user, student);
    return res.json({ student });
  } catch (err) {
    return next(err);
  }
}

import { sendAdminNotification } from "../../core/utils/mailer.js";
import { getIO } from "../../core/utils/socket.js";

export async function updateStudentProfile(req, res, next) {
  try {
    const existing = await Student.findById(req.params.id).select("userId status fullName course").lean();
    if (!existing) {
      return res.status(404).json({ message: "Student not found" });
    }
    ensureOwnershipOrAdmin(req.user, existing);

    const student = await updateStudent(req.params.id, req.body);
    
    // If a student just updated their own profile, and they are in "pending" status, notify admin
    if (req.user?.role === "student" && student.status === "pending" && student.course) {
       const htmlContent = `
         <h3>New Student Registration Submitted</h3>
         <p>A student has completed their registration and is awaiting admin approval.</p>
         <ul>
           <li><strong>Name:</strong> ${student.fullName}</li>
           <li><strong>Email:</strong> ${student.email}</li>
           <li><strong>Course:</strong> ${student.course}</li>
         </ul>
         <p>Please log in to the Admin Dashboard to review their uploaded documents and approve their enrollment.</p>
       `;
       sendAdminNotification("Action Required: New Student Enrollment", htmlContent);

       // Real-time UI notification
       const io = getIO();
       if (io) {
         io.to("admin_room").emit("admin_alert", {
           title: "New Registration",
           message: `${student.fullName} registered for ${student.course}`,
           time: new Date(),
           studentId: student._id
         });
       }
    }

    return res.json({ message: "Student profile updated", student });
  } catch (err) {
    return next(err);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const { uploadToS3 } = await import("../../core/utils/s3.js");
    const fs = await import("fs");

    try {
      const url = await uploadToS3(req.file.path, "eme-platform/documents", 3, req.file.mimetype);
      
      // Always cleanup temp file regardless of S3 outcome
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (!url) {
        return res.status(500).json({ message: "Failed to upload file to cloud storage after multiple attempts." });
      }

      return res.json({ url });
    } catch (uploadErr) {
      // Cleanup in case of unhandled error during upload
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw uploadErr;
    }
  } catch (err) {
    return next(err);
  }
}

export async function previewDocument(req, res, next) {
  try {
    const docUrl = req.query.url;
    if (!docUrl) return res.status(400).send("No URL provided");
    
    const https = await import("https");
    const path = await import("path");

    const ext = path.extname(new URL(docUrl).pathname).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === '.pdf') contentType = "application/pdf";
    else if (ext === '.png') contentType = "image/png";
    else if (ext === '.jpg' || ext === '.jpeg') contentType = "image/jpeg";

    https.get(docUrl, (s3Res) => {
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", "inline");
      s3Res.pipe(res);
    }).on("error", (err) => {
      next(err);
    });
  } catch (err) {
    next(err);
  }
}

export default {
  createStudentProfile,
  listStudents,
  getMe,
  getStudent,
  updateStudentProfile,
  uploadDocument,
  previewDocument,
};

