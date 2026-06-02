import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
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
        score: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pass", "fail"],
            required: true,
        },
    },
    { timestamps: true }
);

const Result = mongoose.models.Result || mongoose.model("Result", resultSchema);

export default Result;

