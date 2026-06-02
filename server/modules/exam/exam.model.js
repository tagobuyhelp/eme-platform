import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      min: 1,
    },
    totalMarks: {
      type: Number,
      min: 0,
    },
    passMarks: {
      type: Number,
      min: 0,
    },
    questionCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Exam = mongoose.models.Exam || mongoose.model("Exam", examSchema);

export default Exam;
