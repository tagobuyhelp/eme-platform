import mongoose from "mongoose";

import Student from "./student.model.js";
import User from "../auth/auth.model.js";

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

export async function createStudent(data, userId) {
  ensureObjectId(userId, "userId");

  const fullName = data?.fullName;
  if (!fullName) {
    throw createHttpError(400, "fullName is required");
  }

  const user = await User.findById(userId).select("email").lean();
  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const existing = await Student.findOne({ userId }).lean();
  if (existing) {
    throw createHttpError(409, "Student profile already exists for this user");
  }

  const student = await Student.create({
    userId,
    fullName: String(fullName).trim(),
    email: String(user.email).trim().toLowerCase(),
    phone: data?.phone ? String(data.phone).trim() : undefined,
    course: data?.course ? String(data.course).trim() : undefined,
    documents: Array.isArray(data?.documents) ? data.documents : [],
    status: data?.status || "pending",
  });

  return student;
}

export async function getAllStudents() {
  return Student.find().sort({ createdAt: -1 }).lean();
}

export async function getStudentById(id) {
  ensureObjectId(id, "id");
  const student = await Student.findById(id).lean();
  if (!student) {
    throw createHttpError(404, "Student not found");
  }
  return student;
}

export async function updateStudent(id, data) {
  ensureObjectId(id, "id");

  const allowed = {};

  if (data?.fullName !== undefined) allowed.fullName = String(data.fullName).trim();
  if (data?.phone !== undefined) allowed.phone = data.phone ? String(data.phone).trim() : "";
  if (data?.course !== undefined) allowed.course = data.course ? String(data.course).trim() : "";
  if (data?.status !== undefined) allowed.status = data.status;
  if (data?.studentId !== undefined) allowed.studentId = data.studentId ? String(data.studentId).trim() : undefined;
  if (data?.profilePhoto !== undefined) allowed.profilePhoto = data.profilePhoto ? String(data.profilePhoto).trim() : undefined;
  if (data?.documents !== undefined && Array.isArray(data.documents)) allowed.documents = data.documents;

  const student = await Student.findById(id);
  if (!student) {
    throw createHttpError(404, "Student not found");
  }

  Object.assign(student, allowed);
  await student.save();

  return student.toObject();
}

export async function importStudentsFromExcelBuffer(fileBuffer) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  let totalParsed = 0;
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length === 0) continue;

    let headerIndex = -1;
    let nameIdx = -1;
    let phoneIdx = -1;
    let courseIdx = -1;
    let idIdx = -1;

    // Scan for header row
    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      row.forEach((cell, c) => {
        const str = String(cell || "").toLowerCase().trim();
        if (str.includes("candidate") || str === "name" || str === "student name" || str === "full name" || (str.includes("name") && !str.includes("course"))) {
          nameIdx = c;
        }
        if (str.includes("mob") || str.includes("phone") || str.includes("contact")) {
          phoneIdx = c;
        }
        if (str.includes("course")) {
          courseIdx = c;
        }
        if (str.includes("sl no") || str.startsWith("sl") || str.includes("student_id") || str.includes("student id")) {
          idIdx = c;
        }
      });

      if (nameIdx !== -1 && phoneIdx !== -1) {
        headerIndex = r;
        break;
      }
    }

    // Fallback if explicit headers were not matched by text
    if (headerIndex === -1) {
      headerIndex = 0;
      nameIdx = 1;
      phoneIdx = 2;
      courseIdx = 3;
    }

    for (let r = headerIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row) || row.length < 2) continue;

      const rawName = row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : "";
      const rawPhone = row[phoneIdx] !== undefined ? String(row[phoneIdx]).replace(/\D/g, "") : "";
      const rawCourse = courseIdx !== -1 && row[courseIdx] !== undefined ? String(row[courseIdx]).trim() : "";
      const rawId = idIdx !== -1 && row[idIdx] !== undefined ? String(row[idIdx]).trim() : "";

      if (!rawName || rawName.toUpperCase() === "CANDIDATE NAME") continue;

      // Extract 10-digit phone
      let cleanPhone = rawPhone;
      if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
        cleanPhone = cleanPhone.slice(2);
      }
      if (cleanPhone.length !== 10) continue;

      totalParsed++;

      try {
        let user = await User.findOne({ phone: cleanPhone });
        let isNewUser = false;

        if (!user) {
          user = await User.create({
            name: rawName,
            phone: cleanPhone,
            role: "student",
          });
          isNewUser = true;
        }

        let student = await Student.findOne({ phone: cleanPhone }) || await Student.findOne({ userId: user._id });
        
        let studentIdToUse = undefined;
        if (rawId && /^\d+$/.test(rawId)) {
          const candidateIdStr = `EME-${rawId.padStart(4, "0")}`;
          const existingWithId = await Student.findOne({ studentId: candidateIdStr, _id: { $ne: student?._id } });
          if (!existingWithId) {
            studentIdToUse = candidateIdStr;
          }
        }
        if (!studentIdToUse && (!student || !student.studentId)) {
          studentIdToUse = `EME-${cleanPhone.slice(-6)}`;
        }

        if (!student) {
          // Brand New Candidate
          await Student.create({
            userId: user._id,
            fullName: rawName,
            phone: cleanPhone,
            course: rawCourse || "General",
            studentId: studentIdToUse,
            status: "active",
          });
          importedCount++;
        } else {
          // Existing candidate - check if any fields changed
          let isChanged = false;
          if (student.fullName !== rawName) {
            student.fullName = rawName;
            user.name = rawName;
            isChanged = true;
          }
          if (rawCourse && student.course !== rawCourse) {
            student.course = rawCourse;
            isChanged = true;
          }
          if (student.status !== "active") {
            student.status = "active";
            isChanged = true;
          }
          if (studentIdToUse && student.studentId !== studentIdToUse) {
            student.studentId = studentIdToUse;
            isChanged = true;
          }

          if (isChanged) {
            await student.save();
            await user.save();
            if (isNewUser) importedCount++;
            else updatedCount++;
          } else {
            skippedCount++;
          }
        }
      } catch (err) {
        errors.push(`Row ${r + 1} (${rawName}): ${err.message}`);
      }
    }
  }

  return {
    totalParsed,
    importedCount,
    updatedCount,
    skippedCount,
    errors,
  };
}

export default {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  importStudentsFromExcelBuffer,
};

