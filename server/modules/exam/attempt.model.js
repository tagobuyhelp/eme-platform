import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
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
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedOption: Number,
      }
    ],
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pass", "fail"],
      required: true,
    },
    startedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Attempt = mongoose.models.Attempt || mongoose.model("Attempt", attemptSchema);

export default Attempt;
