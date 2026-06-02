import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    certificateUrl: {
      type: String,
      default: null,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

certificateSchema.index({ studentId: 1, examId: 1 }, { unique: true });

const Certificate =
  mongoose.models.Certificate || mongoose.model("Certificate", certificateSchema);

export default Certificate;

