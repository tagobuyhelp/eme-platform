import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator(val) {
          return Array.isArray(val) && val.length === 4 && val.every((s) => typeof s === "string");
        },
        message: "options must be an array of 4 strings",
      },
      required: true,
    },
    correctAnswer: {
      type: Number,
      min: 0,
      max: 3,
      required: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.models.Question || mongoose.model("Question", questionSchema);

export default Question;
